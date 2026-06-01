# InventoryItem model — a physical item tracked in the warehouse
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Numeric, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.enums import ItemCategory


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True, index=True)  # optional stock-keeping unit
    category: Mapped[ItemCategory] = mapped_column(SAEnum(ItemCategory), default=ItemCategory.OTHER, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)   # decremented when a bill is created
    unit: Mapped[str] = mapped_column(String(50), default="pcs", nullable=False)
    price: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    added_by: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    added_by_user: Mapped["User"] = relationship("User", back_populates="inventory_items")  # noqa: F821
    bill_items: Mapped[list["BillItem"]] = relationship("BillItem", back_populates="inventory_item")  # noqa: F821
