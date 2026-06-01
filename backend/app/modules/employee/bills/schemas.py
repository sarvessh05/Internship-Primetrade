# Pydantic schemas for bill endpoints — request validation and response shapes
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator
from app.models.enums import BillStatus


# ── Request schemas ───────────────────────────────────────────────────────────

class BillItemRequest(BaseModel):
    """One line in a bill — which item and how many units."""
    inventory_item_id: str
    quantity: int

    @model_validator(mode="after")
    def validate_qty(self) -> "BillItemRequest":
        if self.quantity <= 0:
            raise ValueError("Quantity must be at least 1")
        return self


class CreateBillRequest(BaseModel):
    """Body for POST /bills — creates a bill and deducts stock immediately."""
    customer_name: str
    customer_contact: Optional[str] = None
    notes: Optional[str] = None
    items: list[BillItemRequest]  # must have at least one item

    @model_validator(mode="after")
    def validate_bill(self) -> "CreateBillRequest":
        self.customer_name = self.customer_name.strip()
        if not self.customer_name:
            raise ValueError("Customer name cannot be blank")
        if not self.items:
            raise ValueError("Bill must have at least one item")
        return self


class UpdateBillStatusRequest(BaseModel):
    """Body for PATCH /bills/:id/status — move bill through its lifecycle."""
    status: BillStatus


# ── Response schemas ──────────────────────────────────────────────────────────

class BillItemOut(BaseModel):
    """One line item in a bill response."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    inventory_item_id: str
    quantity: int
    unit_price: float   # price snapshot at time of billing
    subtotal: float


class CreatedByOut(BaseModel):
    """Minimal employee info shown on bills in admin view."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: Optional[str]
    email: str


class BillOut(BaseModel):
    """Full bill details returned to the client."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    bill_number: str
    customer_name: str
    customer_contact: Optional[str]
    notes: Optional[str]
    status: BillStatus
    total: float
    created_by: str
    created_at: datetime
    updated_at: datetime
    items: list[BillItemOut] = []


class BillWithOwnerOut(BillOut):
    """BillOut extended with the employee who created it — used in admin view."""
    created_by_user: CreatedByOut


# ── Query params ──────────────────────────────────────────────────────────────

class BillListQuery(BaseModel):
    """Query parameters for GET /bills — filter, search, and paginate."""
    status: Optional[BillStatus] = None
    search: Optional[str] = None
    page: int = 1
    limit: int = 20
    order: str = "desc"


class PaginationMeta(BaseModel):
    """Pagination metadata included in every list response."""
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool


class PaginatedBillsOut(BaseModel):
    """Response shape for employee's own bill list."""
    bills: list[BillOut]
    pagination: PaginationMeta


class PaginatedBillsWithOwnerOut(BaseModel):
    """Response shape for admin's full bill view."""
    bills: list[BillWithOwnerOut]
    pagination: PaginationMeta
