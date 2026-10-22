"""Structured types for the Campus Customs backend: API shapes, agent output, and tool results."""
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


# ---------- Products ----------

class SizeStock(BaseModel):
    size: str
    quantity: int


class ProductCard(BaseModel):
    """A product as the website shows it (shop grid, product page, and chat cards)."""
    product_id: str
    name: str
    garment_type: str
    description: str
    colors: list[str]
    search_tags: list[str]
    image_file_path: str
    image_url: str
    price: float
    inventory: list[SizeStock]
    total_stock: int


# ---------- Chat ----------

class PageContext(BaseModel):
    """Where the shopper is on the website when they send a message."""
    path: str = Field(max_length=200, description="Route such as /products or /products/<product_id>")
    product_id: str | None = Field(default=None, max_length=120, description="Set on a product page")


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class Customer(BaseModel):
    """Who is chatting, as the agent sees it. Never includes the password hash."""
    id: int
    first_name: str
    last_name: str = ""
    email: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    page: PageContext | None = None
    history: list[HistoryItem] = Field(
        default_factory=list,
        max_length=10,
        description="Recent messages. Only used for guests; for signed-in shoppers the server reads stored history.",
    )

    @field_validator("message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be blank")
        return v


class AgentReply(BaseModel):
    """What the agent returns for each chat turn."""
    reply: str = Field(description="The message shown to the shopper, in plain friendly text (light markdown is fine).")
    product_ids: list[str] = Field(
        default_factory=list,
        description="product_id values, taken only from tool results, for the items to show as cards next to the reply. At most 12. Empty if the reply is not about specific products.",
        max_length=12,
    )


class ChatReply(BaseModel):
    """What POST /api/chat returns to the website."""
    reply: str
    products: list[ProductCard]


class ChatMessage(BaseModel):
    """One stored message from the chat_messages table."""
    role: str
    content: str
    products: list[ProductCard] = Field(default_factory=list)
    created_at: str


# ---------- Tool results (what the agent sees) ----------

class ProductSummary(BaseModel):
    product_id: str
    name: str
    garment_type: str
    price: float
    colors: list[str]
    sizes_in_stock: list[str]
    sizes_sold_out: list[str]
    total_stock: int


class SearchResult(BaseModel):
    total_matches: int = Field(description="How many products matched, even if only some are listed")
    products: list[ProductSummary]


StockStatus = Literal["in_stock", "low_stock", "sold_out", "size_not_offered"]


class SizeAvailability(BaseModel):
    size: str
    quantity: int = Field(description="Units on hand for this size, straight from the inventory table")
    status: StockStatus = Field(description="in_stock, low_stock (5 or fewer left), or sold_out (0)")


class ProductDetail(ProductSummary):
    description: str
    search_tags: list[str]
    stock_by_size: list[SizeAvailability]


class StockCheck(BaseModel):
    """Answer to "is this product available in this size?"."""
    product_id: str
    name: str
    price: float
    size: str = Field(description="The size that was asked about, upper-cased")
    status: StockStatus = Field(description="size_not_offered means this product has no row for that size")
    quantity: int = Field(description="Units on hand for that size; 0 when sold out or not offered")
    sizes_in_stock: list[str] = Field(description="Other sizes of this product that can be bought now")


class GarmentTypeCount(BaseModel):
    garment_type: str
    count: int
    min_price: float
    max_price: float


class CatalogueOverview(BaseModel):
    total_products: int
    garment_types: list[GarmentTypeCount]


# ---------- Audit trail (output/audit_trail.json) ----------

class AuditToolCall(BaseModel):
    tool_name: str = Field(description="Which tool the agent called (or final_result for its answer)")
    args: dict[str, Any] = Field(description="The arguments, shortened, so the trail stays readable")
    result_summary: str = Field(description="One line on what came back, for example '12 matches, showing 8'")


class AuditEntry(BaseModel):
    """One loop iteration of one chat turn: what the agent did and why it stopped."""
    run_id: str = Field(description="Groups the iterations of one chat turn")
    timestamp: str = Field(description="UTC time of the model response, ISO 8601")
    model: str = Field(description="Model name, so changes in behavior can be traced to a model change")
    shopper: str = Field(description="'guest' or 'user:<id>'. No name, email or message text is stored")
    page: str | None = Field(default=None, description="Where the shopper was: a product_id or a page name")
    iteration: int = Field(description="1 for the first model response of the turn, 2 for the next, and so on")
    input_chars: int = Field(description="Length of the shopper's message (the text itself is not stored)")
    tool_calls: list[AuditToolCall]
    stop_reason: str = Field(description="tool_call, final_result, retry, rate_limited, or error: <type>")


# ---------- Accounts ----------

class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
