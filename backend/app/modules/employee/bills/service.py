# Bills business logic — used by both employee routes and admin routes
import math
import random
import string
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc, desc, or_, func

from app.models.bill import Bill, BillItem
from app.models.inventory import InventoryItem
from app.models.user import User
from app.models.enums import Role, BillStatus
from app.modules.employee.bills.schemas import CreateBillRequest, BillListQuery, PaginationMeta, UpdateBillStatusRequest
from app.core.exceptions import not_found, forbidden, conflict


def _generate_bill_number(db: Session) -> str:
    """Generate a unique bill number like WH-202406-1234."""
    prefix = "WH"
    date_part = datetime.utcnow().strftime("%Y%m")
    while True:
        suffix = "".join(random.choices(string.digits, k=4))
        number = f"{prefix}-{date_part}-{suffix}"
        if not db.query(Bill).filter(Bill.bill_number == number).first():
            return number


def _assert_ownership(db: Session, bill_id: str, user: User) -> Bill:
    """Fetch bill by id. Raise 404 if missing, 403 if user doesn't own it (admins bypass)."""
    bill = db.query(Bill).options(joinedload(Bill.items)).filter(Bill.id == bill_id).first()
    if not bill:
        raise not_found("Bill")
    if user.role != Role.ADMIN and bill.created_by != user.id:
        raise forbidden("You did not create this bill")
    return bill


def _paginate(query, page: int, limit: int):
    """Run count + slice in one go and return (bills, PaginationMeta)."""
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    meta = PaginationMeta(
        total=total, page=page, limit=limit,
        total_pages=math.ceil(total / limit) if limit else 1,
        has_next=page * limit < total,
    )
    return items, meta


# ── Employee-facing functions ─────────────────────────────────────────────────

def list_my_bills(db: Session, user_id: str, q: BillListQuery):
    """Return only the bills created by this employee."""
    query = db.query(Bill).options(joinedload(Bill.items)).filter(Bill.created_by == user_id)
    if q.status:
        query = query.filter(Bill.status == q.status)
    if q.search:
        s = f"%{q.search}%"
        query = query.filter(or_(Bill.customer_name.ilike(s), Bill.bill_number.ilike(s)))
    query = query.order_by(asc(Bill.created_at) if q.order == "asc" else desc(Bill.created_at))
    return _paginate(query, q.page, q.limit)


def create_bill(db: Session, user_id: str, data: CreateBillRequest) -> Bill:
    """Create a bill and deduct stock from each referenced inventory item."""
    bill_number = _generate_bill_number(db)
    bill = Bill(
        bill_number=bill_number,
        customer_name=data.customer_name,
        customer_contact=data.customer_contact,
        notes=data.notes,
        created_by=user_id,
    )
    db.add(bill)
    db.flush()  # get bill.id before inserting bill items

    total = 0.0
    for req_item in data.items:
        inv = db.query(InventoryItem).filter(InventoryItem.id == req_item.inventory_item_id).first()
        if not inv:
            raise not_found(f"Inventory item {req_item.inventory_item_id}")
        if inv.quantity < req_item.quantity:
            raise conflict(f"Insufficient stock for '{inv.name}' (available: {inv.quantity})")

        subtotal = float(inv.price) * req_item.quantity
        total += subtotal

        db.add(BillItem(
            bill_id=bill.id,
            inventory_item_id=inv.id,
            quantity=req_item.quantity,
            unit_price=float(inv.price),
            subtotal=subtotal,
        ))
        inv.quantity -= req_item.quantity  # deduct stock immediately

    bill.total = total
    db.commit()
    db.refresh(bill)
    return bill


def get_bill(db: Session, bill_id: str, user: User) -> Bill:
    """Fetch a single bill — enforces ownership."""
    return _assert_ownership(db, bill_id, user)


def update_bill_status(db: Session, bill_id: str, user: User, data: UpdateBillStatusRequest) -> Bill:
    """Change bill status. Cancelled bills cannot be changed again."""
    bill = _assert_ownership(db, bill_id, user)
    if bill.status == BillStatus.CANCELLED:
        raise conflict("Cannot change status of a cancelled bill")
    
    # If the bill is cancelled, restore stock to inventory
    if data.status == BillStatus.CANCELLED and bill.status != BillStatus.CANCELLED:
        for item in bill.items:
            inv = db.query(InventoryItem).filter(InventoryItem.id == item.inventory_item_id).first()
            if inv:
                inv.quantity += item.quantity

    bill.status = data.status
    db.commit()
    db.refresh(bill)
    return bill


# ── Admin-facing functions ────────────────────────────────────────────────────

def list_all_bills(db: Session, q: BillListQuery):
    """Return all bills from all employees — includes creator info."""
    query = db.query(Bill).options(joinedload(Bill.items), joinedload(Bill.created_by_user))
    if q.status:
        query = query.filter(Bill.status == q.status)
    if q.search:
        s = f"%{q.search}%"
        query = query.filter(or_(Bill.customer_name.ilike(s), Bill.bill_number.ilike(s)))
    query = query.order_by(asc(Bill.created_at) if q.order == "asc" else desc(Bill.created_at))
    return _paginate(query, q.page, q.limit)


def get_bills_stats(db: Session) -> dict:
    """Aggregate stats for the admin overview dashboard."""
    total_bills = db.query(func.count(Bill.id)).scalar()
    total_revenue = db.query(func.sum(Bill.total)).filter(Bill.status == BillStatus.CONFIRMED).scalar() or 0
    pending = db.query(func.count(Bill.id)).filter(Bill.status == BillStatus.DRAFT).scalar()
    return {"total_bills": total_bills, "total_revenue": float(total_revenue), "pending_bills": pending}
