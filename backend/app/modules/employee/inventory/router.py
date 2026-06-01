# Employee inventory routes — CRUD for items the employee added themselves
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.responses import ok, created
from app.models.user import User
from app.modules.employee.inventory import service
from app.modules.employee.inventory.schemas import (
    CreateItemRequest, UpdateItemRequest, ItemListQuery,
    ItemOut, PaginatedItemsOut,
)

router = APIRouter(prefix="/inventory", tags=["Inventory (Employee)"])


@router.get("/", summary="List my inventory items")
def list_my_items(
    q: ItemListQuery = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns only the items this employee has added, with filters and pagination."""
    items, pagination = service.list_my_items(db, current_user.id, q)
    return ok("Inventory fetched", PaginatedItemsOut(items=items, pagination=pagination))


@router.post("/", status_code=status.HTTP_201_CREATED, summary="Add an inventory item")
def create_item(
    body: CreateItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new item to the warehouse. SKU must be unique if provided."""
    item = service.create_item(db, current_user.id, body)
    return created("Item added", ItemOut.model_validate(item))


@router.get("/{item_id}", summary="Get one of my items by ID")
def get_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns a single item. Returns 403 if it belongs to another employee."""
    item = service.get_item(db, item_id, current_user)
    return ok("Item fetched", ItemOut.model_validate(item))


@router.patch("/{item_id}", summary="Update one of my items")
def update_item(
    item_id: str,
    body: UpdateItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Partially update an item. Returns 403 if it belongs to another employee."""
    item = service.update_item(db, item_id, current_user, body)
    return ok("Item updated", ItemOut.model_validate(item))


@router.delete("/{item_id}", summary="Delete one of my items")
def delete_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete an item. Returns 403 if it belongs to another employee."""
    service.delete_item(db, item_id, current_user)
    return ok("Item deleted")
