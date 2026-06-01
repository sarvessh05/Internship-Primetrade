# Inventory business logic — used by both employee routes and admin routes
import math
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc, desc, or_, func

from app.models.inventory import InventoryItem
from app.models.user import User
from app.models.enums import Role
from app.modules.employee.inventory.schemas import CreateItemRequest, UpdateItemRequest, ItemListQuery, PaginationMeta
from app.core.exceptions import not_found, forbidden, conflict


def _assert_ownership(db: Session, item_id: str, user: User) -> InventoryItem:
    """Fetch item by id. Raise 404 if missing, 403 if user doesn't own it (admins bypass)."""
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise not_found("Inventory item")
    if user.role != Role.ADMIN and item.added_by != user.id:
        raise forbidden("You did not add this item")
    return item


def _paginate(query, page: int, limit: int):
    """Run count + slice in one go and return (items, PaginationMeta)."""
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    meta = PaginationMeta(
        total=total, page=page, limit=limit,
        total_pages=math.ceil(total / limit) if limit else 1,
        has_next=page * limit < total,
    )
    return items, meta


# ── Employee-facing functions ─────────────────────────────────────────────────

def list_my_items(db: Session, user_id: str, q: ItemListQuery):
    """Return only the items added by this employee."""
    query = db.query(InventoryItem).filter(InventoryItem.added_by == user_id)
    if q.category:
        query = query.filter(InventoryItem.category == q.category)
    if q.search:
        s = f"%{q.search}%"
        query = query.filter(or_(InventoryItem.name.ilike(s), InventoryItem.sku.ilike(s)))
    col = getattr(InventoryItem, q.sort_by, InventoryItem.created_at)
    query = query.order_by(asc(col) if q.order == "asc" else desc(col))
    return _paginate(query, q.page, q.limit)


def create_item(db: Session, user_id: str, data: CreateItemRequest) -> InventoryItem:
    """Add a new inventory item. Rejects duplicate SKUs."""
    if data.sku:
        if db.query(InventoryItem).filter(InventoryItem.sku == data.sku).first():
            raise conflict(f"SKU '{data.sku}' already exists")
    item = InventoryItem(**data.model_dump(), added_by=user_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_item(db: Session, item_id: str, user: User) -> InventoryItem:
    """Fetch a single item — enforces ownership."""
    return _assert_ownership(db, item_id, user)


def update_item(db: Session, item_id: str, user: User, data: UpdateItemRequest) -> InventoryItem:
    """Partially update an item — enforces ownership and SKU uniqueness."""
    item = _assert_ownership(db, item_id, user)
    if data.sku and data.sku != item.sku:
        if db.query(InventoryItem).filter(InventoryItem.sku == data.sku).first():
            raise conflict(f"SKU '{data.sku}' already exists")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item_id: str, user: User) -> None:
    """Delete an item — enforces ownership."""
    item = _assert_ownership(db, item_id, user)
    db.delete(item)
    db.commit()


# ── Admin-facing functions ────────────────────────────────────────────────────

def list_all_items(db: Session, q: ItemListQuery):
    """Return all items from all employees — includes owner info."""
    query = db.query(InventoryItem).options(joinedload(InventoryItem.added_by_user))
    if q.category:
        query = query.filter(InventoryItem.category == q.category)
    if q.search:
        s = f"%{q.search}%"
        query = query.filter(or_(InventoryItem.name.ilike(s), InventoryItem.sku.ilike(s)))
    col = getattr(InventoryItem, q.sort_by, InventoryItem.created_at)
    query = query.order_by(asc(col) if q.order == "asc" else desc(col))
    return _paginate(query, q.page, q.limit)


def get_inventory_stats(db: Session) -> dict:
    """Aggregate stats for the admin overview dashboard."""
    total_items = db.query(func.count(InventoryItem.id)).scalar()
    total_value = db.query(func.sum(InventoryItem.price * InventoryItem.quantity)).scalar() or 0
    low_stock = db.query(func.count(InventoryItem.id)).filter(InventoryItem.quantity <= 5).scalar()
    return {"total_items": total_items, "total_value": float(total_value), "low_stock": low_stock}
