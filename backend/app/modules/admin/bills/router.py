# Admin bill routes — see all bills across all employees + revenue stats
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import ok
from app.models.user import User
from app.models.enums import Role
from app.modules.employee.bills import service
from app.modules.employee.bills.schemas import BillListQuery, PaginatedBillsWithOwnerOut

router = APIRouter(prefix="/bills/admin", tags=["Bills (Admin)"])


@router.get("/all", summary="[ADMIN] All bills across all employees")
def admin_list_all(
    q: BillListQuery = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    """Paginated list of every bill, with the employee who created it."""
    bills, pagination = service.list_all_bills(db, q)
    return ok("All bills fetched", PaginatedBillsWithOwnerOut(bills=bills, pagination=pagination))


@router.get("/stats", summary="[ADMIN] Bills and revenue statistics")
def admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    """Returns total bill count, confirmed revenue, and pending bill count."""
    stats = service.get_bills_stats(db)
    return ok("Stats fetched", stats)
