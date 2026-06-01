# Pydantic schemas for auth endpoints — request bodies and response shapes
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from app.models.enums import Role


def _validate_password(v: str) -> str:
    """Shared password strength validator — enforces 6 security rules."""
    errors = []
    if len(v) < 8:                                              errors.append("at least 8 characters")
    if not any(c.isupper() for c in v):                        errors.append("one uppercase letter")
    if not any(c.islower() for c in v):                        errors.append("one lowercase letter")
    if not any(c.isdigit() for c in v):                        errors.append("one number")
    if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in v): errors.append("one special character")
    if " " in v:                                               errors.append("no spaces allowed")
    if errors:
        raise ValueError(f"Password must contain: {', '.join(errors)}")
    return v


# ── Request schemas ───────────────────────────────────────────────────────────

class AdminRegisterRequest(BaseModel):
    """Body for POST /auth/register/admin — one-time admin setup."""
    name: str
    email: EmailStr
    password: str
    admin_secret: str  # must match ADMIN_SECRET in .env

    @field_validator("name")
    @classmethod
    def name_ok(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password(v)


class EmployeeRegisterRequest(BaseModel):
    """Body for POST /auth/register/employee — uses invite token from admin."""
    name: str
    password: str
    token: str  # invite token received via email/link

    @field_validator("name")
    @classmethod
    def name_ok(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password(v)


class LoginRequest(BaseModel):
    """Body for POST /auth/login — works for both admins and employees."""
    email: EmailStr
    password: str


# ── Response schemas ──────────────────────────────────────────────────────────

class UserOut(BaseModel):
    """Safe user representation — never includes the password field."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str | None
    email: str
    role: Role
    is_active: bool


class TokenResponse(BaseModel):
    """Returned after a successful login — contains the JWT and user info."""
    token: str
    user: UserOut


class InviteTokenOut(BaseModel):
    """Returned after admin creates an invite — share the token with the employee."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    token: str
    used: bool
