# User model — represents both admins and employees in the same table
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SAEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.enums import Role


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)   # null until invite is accepted
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password: Mapped[str | None] = mapped_column(String(255), nullable=True)  # null until invite is accepted
    role: Mapped[Role] = mapped_column(SAEnum(Role), default=Role.EMPLOYEE, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One user → many inventory items, bills, and invites they sent
    inventory_items: Mapped[list["InventoryItem"]] = relationship("InventoryItem", back_populates="added_by_user", cascade="all, delete-orphan")  # noqa: F821
    bills: Mapped[list["Bill"]] = relationship("Bill", back_populates="created_by_user", cascade="all, delete-orphan")  # noqa: F821
    invites_sent: Mapped[list["InviteToken"]] = relationship("InviteToken", back_populates="invited_by_user", cascade="all, delete-orphan")  # noqa: F821
