"""Tools the shop agent can call, plus the model setup. All tools are read-only."""
import fcntl
import os
from dataclasses import dataclass
from pathlib import Path

from openai import AsyncOpenAI
from pydantic_ai import ModelRetry, RunContext
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

import db
from models import (
    AuditEntry,
    CatalogueOverview,
    Customer,
    GarmentTypeCount,
    ProductCard,
    ProductDetail,
    ProductSummary,
    SearchResult,
    SizeAvailability,
    StockCheck,
)

MAX_RESULTS = 12
AUDIT_PATH = Path(os.getenv("AUDIT_TRAIL_PATH", db.ROOT / "output" / "audit_trail.json"))


def append_audit_entry(entry: AuditEntry, path: Path = AUDIT_PATH) -> None:
    """Add one entry to the end of the audit trail. The file is a JSON list that only ever grows:
    earlier entries are never read back or rewritten, and a lock keeps simultaneous chats from interleaving."""
    path.parent.mkdir(parents=True, exist_ok=True)
    text = entry.model_dump_json(indent=2)
    block = "\n".join("  " + line for line in text.splitlines())
    with open(path, "a+b") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            f.seek(0, os.SEEK_END)
            size = f.tell()
            if size == 0:
                f.write(f"[\n{block}\n]\n".encode())
                return
            tail = min(size, 16)
            f.seek(size - tail)
            end = f.read(tail).rstrip()
            close_at = size - tail + len(end) - 1  # position of the final "]"
            f.seek(close_at)
            if f.read(1) != b"]":
                raise ValueError(f"{path} does not end with a JSON list; refusing to touch it")
            f.truncate(close_at)  # remove only the closing bracket, then continue the list
            f.seek(close_at)
            f.write(f",\n{block}\n]\n".encode())
        finally:
            f.flush()  # the next writer must see these bytes before it gets the lock
            os.fsync(f.fileno())
            fcntl.flock(f, fcntl.LOCK_UN)
LOW_STOCK_AT_OR_BELOW = 5


@dataclass
class AgentDeps:
    """Per-request context the agent is given about this chat turn.

    customer: the signed-in shopper, or None for a guest.
    page_label: plain-language description of the page they are on (from a fixed list, never raw user text).
    page_product: the product on screen when they are on a product page, looked up in the database.
    """
    customer: Customer | None = None
    page_label: str | None = None
    page_product: ProductCard | None = None


def build_model() -> OpenAIResponsesModel:
    """OpenAI model routed through Portkey (Responses API). The model name comes from OPENAI_MODEL."""
    headers = {"x-portkey-api-key": os.environ["PORTKEY_API_KEY"]}
    if os.getenv("PORTKEY_PROVIDER"):
        headers["x-portkey-provider"] = os.environ["PORTKEY_PROVIDER"]
    client = AsyncOpenAI(
        base_url=os.getenv("PORTKEY_BASE_URL", "https://api.portkey.ai/v1"),
        api_key="portkey",  # Portkey authenticates with the header above, not an OpenAI key
        default_headers=headers,
    )
    return OpenAIResponsesModel(os.getenv("OPENAI_MODEL", "gpt-5.6-luna"), provider=OpenAIProvider(openai_client=client))


def _summary(p: ProductCard) -> ProductSummary:
    return ProductSummary(
        product_id=p.product_id,
        name=p.name,
        garment_type=p.garment_type,
        price=p.price,
        colors=p.colors,
        sizes_in_stock=[s.size for s in p.inventory if s.quantity > 0],
        sizes_sold_out=[s.size for s in p.inventory if s.quantity == 0],
        total_stock=p.total_stock,
    )


def _stem(word: str) -> str:
    """Normalize a word so "hoodies", "hooded" and "hoodie" (or "tee" and "t-shirt") compare equal."""
    word = word.lower().strip()
    for variant, canonical in (("t-shirt", "tshirt"), ("t shirt", "tshirt"), ("hoodie", "hood"), ("hoody", "hood"), ("hooded", "hood")):
        word = word.replace(variant, canonical)
    if word in ("tee", "tees"):
        return "tshirt"
    return word[:-1] if len(word) > 3 and word.endswith("s") else word


def _norm_text(text: str) -> str:
    return _stem(text)


def _status(quantity: int) -> str:
    if quantity <= 0:
        return "sold_out"
    return "low_stock" if quantity <= LOW_STOCK_AT_OR_BELOW else "in_stock"


def _score(p: ProductCard, terms: list[str]) -> int:
    name = _norm_text(p.name)
    other = _norm_text(" ".join([p.garment_type, p.description, *p.search_tags, *p.colors]))
    return sum(2 if t in name else 1 if t in other else 0 for t in terms)


async def search_products(
    ctx: RunContext[AgentDeps],
    query: str = "",
    garment_type: str | None = None,
    color: str | None = None,
    size: str | None = None,
    max_price: float | None = None,
    in_stock_only: bool = False,
    limit: int = 8,
) -> SearchResult:
    """Search the Campus Customs catalogue. Every argument is optional and they combine.

    query: keywords such as a team, sport, or design ("hockey", "bulldog", "Harvard"). Leave empty to browse.
    garment_type: kind of item, such as "hoodie", "t-shirt", "crewneck", "jacket".
    color: a color word such as "navy" or "gray".
    size: XS, S, M, L, XL or XXL. Keeps only products with that size in stock.
    max_price: highest price in dollars.
    in_stock_only: keep only products with at least one size in stock.
    Returns total_matches plus up to `limit` products (max 12) with price and which sizes are in or out of stock.
    """
    products = db.load_products()
    terms = [_stem(t) for t in query.replace(",", " ").split() if t]
    gt = _stem(garment_type) if garment_type else None
    col = color.lower().strip() if color else None
    size_u = size.upper().strip() if size else None

    scored: list[tuple[int, ProductCard]] = []
    for p in products:
        if gt and gt not in _norm_text(p.garment_type) and gt not in _norm_text(p.name):
            continue
        if col and not any(col in c.lower() for c in p.colors):
            continue
        if max_price is not None and p.price > max_price:
            continue
        if size_u and not any(s.size == size_u and s.quantity > 0 for s in p.inventory):
            continue
        if in_stock_only and p.total_stock == 0:
            continue
        score = _score(p, terms) if terms else 0
        if terms and score == 0:
            continue
        scored.append((score, p))

    scored.sort(key=lambda sp: (-sp[0], sp[1].name))
    shown = [_summary(p) for _, p in scored[: max(1, min(limit, MAX_RESULTS))]]
    return SearchResult(total_matches=len(scored), products=shown)


async def get_product(ctx: RunContext[AgentDeps], product_id: str) -> ProductDetail:
    """Get one product's full details: description, price, and exact stock for every size.
    Use this before answering a specific question about a product's stock or details.
    product_id must be an id returned by search_products."""
    p = db.load_product(product_id)
    if p is None:
        raise ModelRetry(f"No product with id '{product_id}'. Use an id from search_products.")
    return ProductDetail(
        **_summary(p).model_dump(),
        description=p.description,
        search_tags=p.search_tags,
        stock_by_size=[SizeAvailability(size=s.size, quantity=s.quantity, status=_status(s.quantity)) for s in p.inventory],
    )


async def check_stock(ctx: RunContext[AgentDeps], product_id: str, size: str) -> StockCheck:
    """Check whether one product is available in one size, and how many are left.
    Use this whenever a shopper asks "do you have it in medium?" or similar.
    size: XS, S, M, L, XL or XXL. product_id must be an id returned by search_products."""
    p = db.load_product(product_id)
    if p is None:
        raise ModelRetry(f"No product with id '{product_id}'. Use an id from search_products.")
    wanted = size.upper().strip()
    match = next((s for s in p.inventory if s.size == wanted), None)
    return StockCheck(
        product_id=p.product_id,
        name=p.name,
        price=p.price,
        size=wanted,
        status=_status(match.quantity) if match else "size_not_offered",
        quantity=match.quantity if match else 0,
        sizes_in_stock=[s.size for s in p.inventory if s.quantity > 0],
    )


async def catalogue_overview(ctx: RunContext[AgentDeps]) -> CatalogueOverview:
    """Summarize what the shop carries: how many products, and each kind of item with its count and price range.
    Use it for broad questions such as "what do you sell?"."""
    products = db.load_products()
    groups: dict[str, list[float]] = {}
    for p in products:
        groups.setdefault(p.garment_type, []).append(p.price)
    return CatalogueOverview(
        total_products=len(products),
        garment_types=[
            GarmentTypeCount(garment_type=g, count=len(prices), min_price=min(prices), max_price=max(prices))
            for g, prices in sorted(groups.items(), key=lambda kv: -len(kv[1]))
        ],
    )
