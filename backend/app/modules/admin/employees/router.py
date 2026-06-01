# Employee management routes — ADMIN only
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.exceptions import not_found
from app.core.responses import ok
from app.models.user import User
from app.models.enums import Role
from app.modules.common.auth.schemas import UserOut

router = APIRouter(prefix="/employees", tags=["Employees (Admin)"])


@router.get("/", summary="[ADMIN] List all employees")
def list_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    """Returns every employee account, newest first."""
    employees = db.query(User).filter(User.role == Role.EMPLOYEE).order_by(User.created_at.desc()).all()
    return ok("Employees fetched", [UserOut.model_validate(e) for e in employees])


@router.patch("/{employee_id}/deactivate", summary="[ADMIN] Deactivate an employee")
def deactivate_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    """Blocks the employee from logging in without deleting their data."""
    emp = db.query(User).filter(User.id == employee_id, User.role == Role.EMPLOYEE).first()
    if not emp:
        raise not_found("Employee")
    emp.is_active = False
    db.commit()
    return ok("Employee deactivated", UserOut.model_validate(emp))


@router.patch("/{employee_id}/activate", summary="[ADMIN] Reactivate an employee")
def activate_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    """Restores login access for a previously deactivated employee."""
    emp = db.query(User).filter(User.id == employee_id, User.role == Role.EMPLOYEE).first()
    if not emp:
        raise not_found("Employee")
    emp.is_active = True
    db.commit()
    return ok("Employee activated", UserOut.model_validate(emp))
