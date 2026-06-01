# Admin inventory routes — see all items across all employees + stats
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import ok
from app.models.user import User
from app.models.enums import Role
from app.modules.employee.inventory import service
from app.modules.employee.inventory.schemas import ItemListQuery, PaginatedItemsWithOwnerOut

router = APIRouter(prefix="/inventory/admin", tags=["Inventory (Admin)"])


@router.get("/all", summary="[ADMIN] All inventory items across all employees")
def admin_list_all(
    q: ItemListQuery = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    """Paginated list of every item in the warehouse, with the employee who added it."""
    items, pagination = service.list_all_items(db, q)
    return ok("All inventory fetched", PaginatedItemsWithOwnerOut(items=items, pagination=pagination))


@router.get("/stats", summary="[ADMIN] Inventory statistics")
def admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    """Returns total item count, total value, and low-stock count."""
    stats = service.get_inventory_stats(db)
    return ok("Stats fetched", stats)
