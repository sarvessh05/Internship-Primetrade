# Pydantic schemas for inventory endpoints — request validation and response shapes
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator
from app.models.enums import ItemCategory


# ── Request schemas ───────────────────────────────────────────────────────────

class CreateItemRequest(BaseModel):
    """Body for POST /inventory — add a new item to the warehouse."""
    name: str
    sku: Optional[str] = None          # optional unique stock-keeping unit
    category: ItemCategory = ItemCategory.OTHER
    description: Optional[str] = None
    quantity: int = 0
    unit: str = "pcs"
    price: float = 0.0

    @model_validator(mode="after")
    def validate_fields(self) -> "CreateItemRequest":
        self.name = self.name.strip()
        if not self.name:
            raise ValueError("Name cannot be blank")
        if len(self.name) > 200:
            raise ValueError("Name max 200 characters")
        if self.quantity < 0:
            raise ValueError("Quantity cannot be negative")
        if self.price < 0:
            raise ValueError("Price cannot be negative")
        return self


class UpdateItemRequest(BaseModel):
    """Body for PATCH /inventory/:id — at least one field must be provided."""
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[ItemCategory] = None
    description: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    price: Optional[float] = None

    @model_validator(mode="after")
    def at_least_one(self) -> "UpdateItemRequest":
        if not any(v is not None for v in self.model_dump().values()):
            raise ValueError("At least one field required")
        if self.quantity is not None and self.quantity < 0:
            raise ValueError("Quantity cannot be negative")
        if self.price is not None and self.price < 0:
            raise ValueError("Price cannot be negative")
        return self


# ── Query params ──────────────────────────────────────────────────────────────

class ItemListQuery(BaseModel):
    """Query parameters for GET /inventory — filter, search, and paginate."""
    category: Optional[ItemCategory] = None
    search: Optional[str] = None
    page: int = 1
    limit: int = 20
    sort_by: str = "created_at"
    order: str = "desc"


# ── Response schemas ──────────────────────────────────────────────────────────

class AddedByOut(BaseModel):
    """Minimal user info shown on items in admin view."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: Optional[str]
    email: str


class ItemOut(BaseModel):
    """Full item details returned to the client."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    sku: Optional[str]
    category: ItemCategory
    description: Optional[str]
    quantity: int
    unit: str
    price: float
    added_by: str
    created_at: datetime
    updated_at: datetime


class ItemWithOwnerOut(ItemOut):
    """ItemOut extended with the employee who added it — used in admin view."""
    added_by_user: AddedByOut


class PaginationMeta(BaseModel):
    """Pagination metadata included in every list response."""
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool


class PaginatedItemsOut(BaseModel):
    """Response shape for employee's own inventory list."""
    items: list[ItemOut]
    pagination: PaginationMeta


class PaginatedItemsWithOwnerOut(BaseModel):
    """Response shape for admin's full inventory view."""
    items: list[ItemWithOwnerOut]
    pagination: PaginationMeta
