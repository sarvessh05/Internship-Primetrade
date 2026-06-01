# Bill and BillItem models — a bill dispatches inventory to a customer
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Numeric, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.enums import BillStatus


class Bill(Base):
    """One bill per transaction — contains one or more BillItems."""
    __tablename__ = "bills"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bill_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)  # auto-generated e.g. WH-202406-1234
    customer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    customer_contact: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[BillStatus] = mapped_column(SAEnum(BillStatus), default=BillStatus.DRAFT, nullable=False)
    total: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)  # sum of all BillItem subtotals
    created_by: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by_user: Mapped["User"] = relationship("User", back_populates="bills")
    items: Mapped[list["BillItem"]] = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")


class BillItem(Base):
    """One line in a bill — links an inventory item with quantity and price snapshot."""
    __tablename__ = "bill_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bill_id: Mapped[str] = mapped_column(String, ForeignKey("bills.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_item_id: Mapped[str] = mapped_column(String, ForeignKey("inventory_items.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)  # price at time of billing
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)    # quantity × unit_price

    bill: Mapped["Bill"] = relationship("Bill", back_populates="items")
    inventory_item: Mapped["InventoryItem"] = relationship("InventoryItem", back_populates="bill_items")
