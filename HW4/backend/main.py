import json
import os
import sqlite3
import time
import uuid
from collections import defaultdict
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")  # before importing modules that read env vars

from fastapi import Cookie, FastAPI, HTTPException, Request, Response  # noqa: E402
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles  # noqa: E402

import agent  # noqa: E402
import auth  # noqa: E402
import db  # noqa: E402
from models import ChatMessage, ChatReply, ChatRequest, Customer, LoginRequest, ProductCard, RegisterRequest  # noqa: E402

app = FastAPI(title="Campus Customs API")


@app.on_event("startup")
async def warm_up() -> None:
    """Build the agent once at startup so the first chat is not slower than the rest."""
    try:
        agent.get_agent()
    except KeyError as e:  # missing PORTKEY_API_KEY: the server still serves products
        print(f"Agent not ready: {e.args[0]} is not set")
get_db = db.get_db


@app.get("/api/products")
def list_products() -> list[ProductCard]:
    return db.load_products()


@app.get("/api/products/{product_id}")
def get_product(product_id: str) -> ProductCard:
    product = db.load_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


SESSION_COOKIE = "session"
MAX_FAILED_LOGINS = 5
LOCKOUT_SECONDS = 15 * 60
failed_logins: dict[str, list[float]] = defaultdict(list)


def user_json(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "first_name": row["first_name"] or row["name"],
        "last_name": row["last_name"] or "",
        "email": row["email"],
    }


@app.post("/api/auth/register", status_code=201)
def register(body: RegisterRequest) -> dict:
    email = body.email.lower()
    with get_db() as conn:
        if conn.execute("SELECT 1 FROM users WHERE lower(email) = ?", (email,)).fetchone():
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        try:
            cur = conn.execute(
                "INSERT INTO users (name, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
                (
                    f"{body.first_name} {body.last_name}",
                    email,
                    auth.hash_password(body.password),
                    body.first_name,
                    body.last_name,
                ),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        row = conn.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    return user_json(row)


@app.post("/api/auth/login")
def login(body: LoginRequest, response: Response) -> dict:
    email = body.email.lower()
    now = time.time()
    recent = [t for t in failed_logins[email] if now - t < LOCKOUT_SECONDS]
    failed_logins[email] = recent
    if len(recent) >= MAX_FAILED_LOGINS:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Please try again in 15 minutes.")

    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE lower(email) = ?", (email,)).fetchone()
    stored = row["password_hash"] if row else auth.DUMMY_HASH
    ok = auth.verify_password(body.password, stored)
    if not row or not ok:
        failed_logins[email].append(now)
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    failed_logins.pop(email, None)
    response.set_cookie(
        SESSION_COOKIE,
        auth.make_session_token(row["id"]),
        max_age=auth.SESSION_SECONDS,
        httponly=True,
        samesite="lax",
        secure=os.getenv("COOKIE_SECURE") == "1",
    )
    return user_json(row)


@app.post("/api/auth/logout")
def logout(response: Response) -> dict:
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}


@app.get("/api/auth/me")
def me(session: str | None = Cookie(default=None)) -> dict:
    user_id = auth.read_session_token(session)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not signed in.")
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=401, detail="Not signed in.")
    return user_json(row)


# ---------- Chat ----------

CHAT_HISTORY_TURNS = 10  # stored messages sent back to the agent for context
CHAT_LIMIT_PER_MINUTE = 20  # signed-in shoppers
GUEST_LIMIT_PER_MINUTE = 10  # guests, counted per IP address
chat_calls: dict[str, list[float]] = defaultdict(list)

# Speeds up loading one shopper's saved history.
with get_db() as _conn:
    _conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, id)")


def optional_user(session: str | None) -> sqlite3.Row | None:
    """The signed-in user, or None for a guest."""
    user_id = auth.read_session_token(session)
    if user_id is None:
        return None
    with get_db() as conn:
        return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def current_user(session: str | None) -> sqlite3.Row:
    row = optional_user(session)
    if row is None:
        raise HTTPException(status_code=401, detail="Please log in to see your chat history.")
    return row


def customer_from_row(row: sqlite3.Row) -> Customer:
    return Customer(
        id=row["id"],
        first_name=row["first_name"] or row["name"],
        last_name=row["last_name"] or "",
        email=row["email"],
    )


def products_from_json(raw: str | None) -> list[ProductCard]:
    """Stored cards are re-read from the catalogue so price and stock are current."""
    if not raw:
        return []
    try:
        ids = [p["product_id"] for p in json.loads(raw)]
    except (ValueError, KeyError, TypeError):
        return []
    return db.load_products(ids)


@app.get("/api/chat/history")
def chat_history(session: str | None = Cookie(default=None)) -> list[ChatMessage]:
    user = current_user(session)
    with get_db() as conn:
        rows = conn.execute(
            "SELECT role, content, products_json, created_at FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT 50",
            (user["id"],),
        ).fetchall()
    return [
        ChatMessage(role=r["role"], content=agent.clean_reply(r["content"]), products=products_from_json(r["products_json"]), created_at=r["created_at"])
        for r in reversed(rows)
    ]


def prepare_chat(body: ChatRequest, request: Request, session: str | None):
    """Shared by both chat routes: who is chatting, rate limit, and the conversation so far."""
    user = optional_user(session)
    key, limit = (f"user:{user['id']}", CHAT_LIMIT_PER_MINUTE) if user else (f"ip:{request.client.host if request.client else '?'}", GUEST_LIMIT_PER_MINUTE)
    now = time.time()
    recent = [t for t in chat_calls[key] if now - t < 60]
    if len(recent) >= limit:
        agent.record_stop(agent.AuditMeta(uuid.uuid4().hex[:8], f"user:{user['id']}" if user else "guest", None, len(body.message)), "rate_limited")
        raise HTTPException(status_code=429, detail="You're sending messages quickly. Please wait a moment.")
    chat_calls[key] = recent + [now]

    if user:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?",
                (user["id"], CHAT_HISTORY_TURNS),
            ).fetchall()
        history = [(r["role"], r["content"]) for r in reversed(rows)]
    else:
        history = [(h.role, h.content) for h in body.history]  # guests: kept in the browser, never stored
    return user, history


def save_exchange(user: sqlite3.Row, message: str, reply: str, products: list) -> None:
    """Only signed-in shoppers get their conversation saved."""
    with get_db() as conn:
        conn.execute("INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'user', ?)", (user["id"], message))
        conn.execute(
            "INSERT INTO chat_messages (user_id, role, content, products_json) VALUES (?, 'assistant', ?, ?)",
            (user["id"], reply, json.dumps(products) if products else None),
        )


UNAVAILABLE = "The shop assistant is unavailable right now. Please try again in a moment."


@app.post("/api/chat")
async def chat(body: ChatRequest, request: Request, session: str | None = Cookie(default=None)) -> ChatReply:
    user, history = prepare_chat(body, request, session)
    try:
        reply = await agent.chat(body.message, history, customer=customer_from_row(user) if user else None, page=body.page)
    except Exception as e:  # model, network, or key problems: never leak details to the shopper
        print(f"chat agent error: {type(e).__name__}", flush=True)
        raise HTTPException(status_code=502, detail=UNAVAILABLE)
    if user:
        save_exchange(user, body.message, reply.reply, [p.model_dump() for p in reply.products])
    return reply


@app.post("/api/chat/stream")
async def chat_stream(body: ChatRequest, request: Request, session: str | None = Cookie(default=None)) -> StreamingResponse:
    """Same as /api/chat, but sends server-sent events so the reply appears as it is written."""
    user, history = prepare_chat(body, request, session)
    customer = customer_from_row(user) if user else None

    async def events():
        async for event in agent.chat_stream(body.message, history, customer=customer, page=body.page):
            if event["type"] == "done" and user:
                save_exchange(user, body.message, event["reply"], event["products"])
            if event["type"] == "error":
                event = {"type": "error", "detail": UNAVAILABLE}
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# Serve only the product images, never the database file next to them.
app.mount("/media/products", StaticFiles(directory=db.PRODUCT_IMAGES), name="product-images")
