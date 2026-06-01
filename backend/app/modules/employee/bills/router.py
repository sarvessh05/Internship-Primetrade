# Employee bill routes — create bills and manage own bills
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.responses import ok, created
from app.models.user import User
from app.modules.employee.bills import service
from app.modules.employee.bills.schemas import (
    CreateBillRequest, UpdateBillStatusRequest, BillListQuery,
    BillOut, PaginatedBillsOut,
)

router = APIRouter(prefix="/bills", tags=["Bills (Employee)"])


@router.get("/", summary="List my bills")
def list_my_bills(
    q: BillListQuery = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns only the bills this employee created, with filters and pagination."""
    bills, pagination = service.list_my_bills(db, current_user.id, q)
    return ok("Bills fetched", PaginatedBillsOut(bills=bills, pagination=pagination))


@router.post("/", status_code=status.HTTP_201_CREATED, summary="Create a bill (deducts stock)")
def create_bill(
    body: CreateBillRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a bill for a customer. Stock is deducted from inventory immediately."""
    bill = service.create_bill(db, current_user.id, body)
    return created("Bill created", BillOut.model_validate(bill))


@router.get("/{bill_id}", summary="Get one of my bills by ID")
def get_bill(
    bill_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns a single bill with all line items. Returns 403 if not the creator."""
    bill = service.get_bill(db, bill_id, current_user)
    return ok("Bill fetched", BillOut.model_validate(bill))


@router.patch("/{bill_id}/status", summary="Update bill status")
def update_status(
    bill_id: str,
    body: UpdateBillStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Move a bill from DRAFT → CONFIRMED or CANCELLED. Cannot undo CANCELLED."""
    bill = service.update_bill_status(db, bill_id, current_user, body)
    return ok("Status updated", BillOut.model_validate(bill))
