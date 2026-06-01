# Auth routes — open (register/login) and protected (me, invite)
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.responses import ok, created
from app.models.user import User
from app.models.enums import Role
from app.modules.common.auth import service
from app.modules.common.auth.schemas import (
    AdminRegisterRequest, EmployeeRegisterRequest,
    LoginRequest, TokenResponse, UserOut, InviteTokenOut,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


class InviteRequest(BaseModel):
    email: EmailStr


@router.post(
    "/register/admin",
    status_code=status.HTTP_201_CREATED,
    summary="One-time admin account setup",
    description="Sets up the initial admin account. Allowed only if no Admin users exist in the database.",
)
def register_admin(body: AdminRegisterRequest, db: Session = Depends(get_db)):
    user = service.register_admin(db, body.name, body.email, body.password)
    return created("Admin registered", UserOut.model_validate(user))


@router.post(
    "/register/employee",
    status_code=status.HTTP_201_CREATED,
    summary="Employee registration via invite link",
    description="Employee completes signup using the token from their invite link.",
)
def register_employee(body: EmployeeRegisterRequest, db: Session = Depends(get_db)):
    user = service.register_employee(db, body.name, body.password, body.token)
    return created("Account created successfully", UserOut.model_validate(user))


@router.post("/login", summary="Login — returns a JWT for all roles")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    result = service.login_user(db, body.email, body.password)
    return ok("Login successful", TokenResponse(
        token=result["token"],
        user=UserOut.model_validate(result["user"]),
    ))


@router.get("/me", summary="Get the currently logged-in user's profile")
def me(current_user: User = Depends(get_current_user)):
    return ok("Profile fetched", UserOut.model_validate(current_user))


@router.post(
    "/invite",
    status_code=status.HTTP_201_CREATED,
    summary="[ADMIN] Invite an employee by email",
    description="Creates a 7-day invite token. Share the link with the employee.",
)
def invite_employee(
    body: InviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    invite = service.create_invite(db, body.email, current_user.id)
    return created("Invite created", InviteTokenOut.model_validate(invite))
