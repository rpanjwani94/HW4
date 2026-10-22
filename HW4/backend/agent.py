"""Agent entry point: loads prompts/prompt.md, the model, and the tools into one PydanticAI agent."""
import asyncio
import os
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncIterator

from pydantic_ai import Agent, FunctionToolCallEvent, ModelRetry, RunContext, UsageLimits
from pydantic_ai.exceptions import ModelHTTPError
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    RetryPromptPart,
    TextPart,
    ToolCallPart,
    ToolReturnPart,
    UserPromptPart,
)
from pydantic_ai.models.openai import OpenAIResponsesModelSettings

import db
from models import AgentReply, AuditEntry, AuditToolCall, ChatReply, Customer, PageContext
from tools import AgentDeps, append_audit_entry, build_model, catalogue_overview, check_stock, get_product, search_products

PROMPT_PATH = Path(__file__).parent / "prompts" / "prompt.md"
# Cap on model requests per chat turn so a confused agent cannot loop and spend without end.
MAX_LOOP_ITERATIONS = 8


# Lower reasoning effort answers faster. Change it with OPENAI_REASONING_EFFORT (low, medium, high).
MODEL_SETTINGS = OpenAIResponsesModelSettings(openai_reasoning_effort=os.getenv("OPENAI_REASONING_EFFORT", "low"))  # type: ignore[typeddict-item]

# Temporary upstream errors worth one more try before telling the shopper.
RETRYABLE_STATUS = {408, 409, 429, 500, 502, 503, 504}

# The model host's own content filter sometimes refuses a message (for example an attempt to override the
# instructions). That is a refusal, not an outage, so the shopper gets a calm answer and the trail records it.
BLOCKED_REPLY = "I can't help with that request, but I'm happy to help you find Yale gear, check prices, or see what is in stock in your size."


def blocked_by_filter(e: Exception) -> bool:
    return isinstance(e, ModelHTTPError) and e.status_code == 400 and isinstance(e.body, dict) and e.body.get("code") == "content_filter"


# Shown in the chat while a tool runs.
TOOL_STATUS = {
    "search_products": "Searching the catalogue…",
    "get_product": "Looking up the details…",
    "check_stock": "Checking stock…",
    "catalogue_overview": "Looking at what we carry…",
}


@dataclass
class AuditMeta:
    """Facts about one chat turn that go on every audit entry of that turn."""
    run_id: str
    shopper: str
    page: str | None
    input_chars: int

    @classmethod
    def for_turn(cls, message: str, customer: Customer | None, deps: "AgentDeps") -> "AuditMeta":
        page = deps.page_product.product_id if deps.page_product else deps.page_label
        return cls(uuid.uuid4().hex[:8], f"user:{customer.id}" if customer else "guest", page, len(message))


def _short(value: Any) -> Any:
    if isinstance(value, str):
        return value if len(value) <= 80 else value[:77] + "…"
    if isinstance(value, list):
        return [_short(v) for v in value[:8]] + (["…"] if len(value) > 8 else [])
    return value


def summarize_result(content: Any) -> str:
    """One readable line about a tool result, without copying the whole thing into the trail."""
    name = type(content).__name__
    if name == "SearchResult":
        ids = ", ".join(p.product_id for p in content.products[:5])
        return f"{content.total_matches} matches, showing {len(content.products)}: {ids}" + ("…" if len(content.products) > 5 else "")
    if name == "ProductDetail":
        return f"{content.product_id}: ${content.price:.2f}, sizes in stock {', '.join(content.sizes_in_stock) or 'none'}"
    if name == "StockCheck":
        return f"{content.product_id} size {content.size}: {content.status} ({content.quantity})"
    if name == "CatalogueOverview":
        return f"{content.total_products} products in {len(content.garment_types)} kinds"
    return str(content)[:150]


def audit_entries(messages: list[ModelMessage], meta: AuditMeta, model_name: str) -> list[AuditEntry]:
    """Turn the messages of one finished run into one audit entry per model response that used a tool."""
    entries: list[AuditEntry] = []
    for i, msg in enumerate(messages):
        if not isinstance(msg, ModelResponse):
            continue
        calls = [p for p in msg.parts if isinstance(p, ToolCallPart)]
        if not calls:
            continue
        returned: dict[str, Any] = {}
        if i + 1 < len(messages) and isinstance(messages[i + 1], ModelRequest):
            returned = {p.tool_call_id: p for p in messages[i + 1].parts if isinstance(p, (ToolReturnPart, RetryPromptPart))}
        tool_calls, stop = [], "tool_call"
        for call in calls:
            part = returned.get(call.tool_call_id)
            rejected = isinstance(part, RetryPromptPart)
            is_answer = call.tool_name == agent_output_tool_name()
            args = {k: _short(v) for k, v in call.args_as_dict().items()}
            if is_answer:
                args = {"product_ids": args.get("product_ids", []), "reply_chars": len(str(call.args_as_dict().get("reply", "")))}
                stop = "retry" if rejected else "final_result"
                summary = "answer rejected, asked to retry: " + str(part.content)[:120] if rejected else "answer accepted"
            elif rejected:
                summary = "rejected, asked to retry: " + str(part.content)[:120]
            else:
                summary = summarize_result(part.content) if part is not None else "(no result)"
            tool_calls.append(AuditToolCall(tool_name=call.tool_name, args=args, result_summary=summary))
        entries.append(
            AuditEntry(
                run_id=meta.run_id,
                timestamp=msg.timestamp.astimezone(timezone.utc).isoformat(timespec="seconds"),
                model=model_name,
                shopper=meta.shopper,
                page=meta.page,
                iteration=len(entries) + 1,
                input_chars=meta.input_chars,
                tool_calls=tool_calls,
                stop_reason=stop,
            )
        )
    return entries


def agent_output_tool_name() -> str:
    return "final_result"


def record_run(messages: list[ModelMessage], meta: AuditMeta) -> None:
    """Append the finished run to the audit trail. A problem writing the trail must never break a chat."""
    try:
        for entry in audit_entries(messages, meta, os.getenv("OPENAI_MODEL", "gpt-5.6-luna")):
            append_audit_entry(entry)
    except Exception as e:
        print(f"audit trail write failed: {type(e).__name__}", flush=True)


def record_stop(meta: AuditMeta, stop_reason: str, iteration: int = 0) -> None:
    """Append an entry for a turn that ended without a normal answer (an error, or a rate limit)."""
    try:
        append_audit_entry(
            AuditEntry(
                run_id=meta.run_id,
                timestamp=datetime.now(timezone.utc).isoformat(timespec="seconds"),
                model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna"),
                shopper=meta.shopper,
                page=meta.page,
                iteration=iteration,
                input_chars=meta.input_chars,
                tool_calls=[],
                stop_reason=stop_reason,
            )
        )
    except Exception as e:
        print(f"audit trail write failed: {type(e).__name__}", flush=True)


def load_prompt() -> str:
    return PROMPT_PATH.read_text()


def clean_reply(text: str) -> str:
    """Plain-text safety net: the chat bubble does not render markdown, so remove asterisks, backticks and headings."""
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)  # [label](url) -> label
    text = re.sub(r"(?m)^\s*[*•]\s+", "- ", text)  # "* item" bullets -> "- item"
    text = re.sub(r"(?m)^\s*#{1,6}\s*", "", text)  # headings
    text = text.replace("**", "").replace("*", "").replace("`", "")
    text = re.sub(r"(?<!\w)__(.+?)__(?!\w)", r"\1", text)
    return text


def build_agent() -> Agent[AgentDeps, AgentReply]:
    agent = Agent(
        build_model(),
        deps_type=AgentDeps,
        output_type=AgentReply,
        system_prompt=load_prompt(),
        tools=[search_products, get_product, check_stock, catalogue_overview],
        model_settings=MODEL_SETTINGS,
    )

    @agent.instructions
    def shopper(ctx: RunContext[AgentDeps]) -> str:
        c = ctx.deps.customer
        if c is None:
            return "The shopper is a guest (not signed in), so this chat is not saved."
        full_name = f"{c.first_name} {c.last_name}".strip()
        return f"The shopper is signed in: {full_name}, email {c.email}. Their chat history is saved to their account."

    @agent.instructions
    def page(ctx: RunContext[AgentDeps]) -> str:
        parts = []
        if ctx.deps.page_label:
            parts.append(f"The shopper is currently on the {ctx.deps.page_label}.")
        p = ctx.deps.page_product
        if p:
            stock = ", ".join(f"{s.size} {s.quantity}" if s.quantity else f"{s.size} sold out" for s in p.inventory)
            parts.append(
                f'They are looking at the product page for "{p.name}" (product_id {p.product_id}). '
                'When they say "this", "it", "this one", or ask about a color, size or price without naming a product, '
                "they mean this product. Its details were just read from the database: "
                f"{p.garment_type}, ${p.price:.2f}, colors {', '.join(p.colors)}; stock by size: {stock}. "
                "You can answer questions about this product from those details without calling a tool. "
                "Use your tools for any other product or for a search."
            )
        return " ".join(parts)

    @agent.output_validator
    def known_products(ctx: RunContext[AgentDeps], output: AgentReply) -> AgentReply:
        valid = {p.product_id for p in db.load_products(output.product_ids)}
        unknown = [i for i in output.product_ids if i not in valid]
        if unknown:
            raise ModelRetry(f"These product_ids are not in the catalogue: {unknown}. Use only ids from tool results.")
        return output

    return agent


_agent: Agent[AgentDeps, AgentReply] | None = None


def get_agent() -> Agent[AgentDeps, AgentReply]:
    global _agent
    if _agent is None:
        _agent = build_agent()
    return _agent


def to_history(messages: list[tuple[str, str]]) -> list[ModelMessage]:
    """Turn stored (role, content) pairs into PydanticAI message history."""
    history: list[ModelMessage] = []
    for role, content in messages:
        if role == "user":
            history.append(ModelRequest(parts=[UserPromptPart(content=content)]))
        else:
            history.append(ModelResponse(parts=[TextPart(content=content)]))
    return history


PAGE_LABELS = {
    "/": "home page",
    "/products": "products page (the full catalogue)",
    "/about": "About Us page",
    "/login": "login page",
    "/create-account": "create account page",
}


def build_deps(customer: Customer | None, page: PageContext | None) -> AgentDeps:
    """Page context is checked against known routes and the catalogue, so the browser cannot put free text in the prompt."""
    deps = AgentDeps(customer=customer)
    if page is None:
        return deps
    product = db.load_product(page.product_id) if page.product_id else None
    if product and page.path == f"/products/{product.product_id}":
        deps.page_product = product
        deps.page_label = "product page"
    else:
        deps.page_label = PAGE_LABELS.get(page.path)
    return deps


async def chat(
    message: str,
    history: list[tuple[str, str]],
    customer: Customer | None = None,
    page: PageContext | None = None,
) -> ChatReply:
    """Run one chat turn. Product cards come from the database, never from the model's own text."""
    deps = build_deps(customer, page)
    meta = AuditMeta.for_turn(message, customer, deps)
    try:
        result = await get_agent().run(
            message,
            deps=deps,
            message_history=to_history(history),
            usage_limits=UsageLimits(request_limit=MAX_LOOP_ITERATIONS),
        )
    except Exception as e:
        if blocked_by_filter(e):
            record_stop(meta, "blocked: content_filter")
            return ChatReply(reply=BLOCKED_REPLY, products=[])
        record_stop(meta, f"error: {type(e).__name__}")
        raise
    record_run(result.new_messages(), meta)
    return ChatReply(reply=clean_reply(result.output.reply), products=db.load_products(result.output.product_ids))


async def chat_stream(
    message: str,
    history: list[tuple[str, str]],
    customer: Customer | None = None,
    page: PageContext | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Run one chat turn and yield events as it happens:
    {"type": "status", "text"}: a tool is running;  {"type": "text", "text"}: the reply so far (replace, not append);
    {"type": "done", "reply", "products"}: finished;  {"type": "error"}: the model failed."""
    queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()
    deps = build_deps(customer, page)
    meta = AuditMeta.for_turn(message, customer, deps)

    async def on_events(ctx: RunContext[AgentDeps], events: AsyncIterator[Any]) -> None:
        async for event in events:
            if isinstance(event, FunctionToolCallEvent):
                queue.put_nowait({"type": "status", "text": TOOL_STATUS.get(event.part.tool_name, "Working on it…")})

    async def attempt() -> bool:
        """One run of the agent. Returns True when it finished; raises if the model failed."""
        async with get_agent().run_stream(
            message,
            deps=deps,
            message_history=to_history(history),
            usage_limits=UsageLimits(request_limit=MAX_LOOP_ITERATIONS),
            event_stream_handler=on_events,
        ) as result:
            last = ""
            async for partial in result.stream_output(debounce_by=0.05):
                text = clean_reply(partial.reply or "")
                if text != last:
                    last = text
                    queue.put_nowait({"type": "text", "text": text})
            output = await result.get_output()
            record_run(result.new_messages(), meta)
        products = db.load_products(output.product_ids)
        queue.put_nowait({"type": "done", "reply": clean_reply(output.reply), "products": [p.model_dump() for p in products]})
        return True

    async def produce() -> None:
        try:
            for tries_left in (1, 0):
                try:
                    await attempt()
                    break
                except ModelHTTPError as e:
                    if blocked_by_filter(e):
                        record_stop(meta, "blocked: content_filter")
                        queue.put_nowait({"type": "done", "reply": BLOCKED_REPLY, "products": []})
                        break
                    print(f"chat agent HTTP {e.status_code}", flush=True)
                    record_stop(meta, f"error: ModelHTTPError {e.status_code}")
                    if tries_left == 0 or e.status_code not in RETRYABLE_STATUS:
                        raise
                    await asyncio.sleep(1)
        except Exception as e:  # model, network, or key problems: details stay in the server log
            print(f"chat agent error: {type(e).__name__}", flush=True)
            if not isinstance(e, ModelHTTPError):
                record_stop(meta, f"error: {type(e).__name__}")
            queue.put_nowait({"type": "error"})
        finally:
            queue.put_nowait(None)

    task = asyncio.create_task(produce())
    try:
        while (event := await queue.get()) is not None:
            yield event
    finally:
        task.cancel()
