"""SQLite access shared by the API routes and the agent's tools."""
import json
import os
import sqlite3
from pathlib import Path

from models import ProductCard, SizeStock

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.getenv("CAMPUS_DB_PATH", ROOT / "data" / "campus_customs.db"))
PRODUCT_IMAGES = ROOT / "data" / "products"

SIZE_ORDER = {"XS": 0, "S": 1, "M": 2, "L": 3, "XL": 4, "XXL": 5}


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _card(row: sqlite3.Row, stock: list[SizeStock]) -> ProductCard:
    return ProductCard(
        product_id=row["product_id"],
        name=row["name"],
        garment_type=row["garment_type"],
        description=row["description"],
        colors=json.loads(row["colors"]),
        search_tags=json.loads(row["search_tags"]),
        image_file_path=row["image_file_path"],
        image_url=f"/media/{row['image_file_path']}",
        price=row["price"],
        inventory=stock,
        total_stock=sum(s.quantity for s in stock),
    )


def _stock_by_product(conn: sqlite3.Connection) -> dict[str, list[SizeStock]]:
    stock: dict[str, list[SizeStock]] = {}
    for r in conn.execute("SELECT product_id, size, quantity FROM inventory"):
        stock.setdefault(r["product_id"], []).append(SizeStock(size=r["size"], quantity=r["quantity"]))
    for sizes in stock.values():
        sizes.sort(key=lambda s: SIZE_ORDER.get(s.size, 99))
    return stock


def load_products(product_ids: list[str] | None = None) -> list[ProductCard]:
    """All products (or just the given ids, in the order given) with their stock by size."""
    with get_db() as conn:
        stock = _stock_by_product(conn)
        rows = conn.execute("SELECT * FROM catalogue ORDER BY name").fetchall()
    cards = {r["product_id"]: _card(r, stock.get(r["product_id"], [])) for r in rows}
    if product_ids is None:
        return list(cards.values())
    return [cards[i] for i in dict.fromkeys(product_ids) if i in cards]


def load_product(product_id: str) -> ProductCard | None:
    found = load_products([product_id])
    return found[0] if found else None
