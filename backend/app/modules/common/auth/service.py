# Auth business logic — registration, login, and invite creation
import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.invite import InviteToken
from app.models.enums import Role
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import conflict, unauthorized, not_found
from app.core.config import settings


def register_admin(db: Session, name: str, email: str, password: str, admin_secret: str) -> User:
    """Create the first admin account. Requires the ADMIN_SECRET from .env."""
    if admin_secret != settings.ADMIN_SECRET:
        raise unauthorized("Invalid admin secret")
    if db.query(User).filter(User.email == email).first():
        raise conflict("Email already registered")
    user = User(name=name, email=email, password=hash_password(password), role=Role.ADMIN)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def register_employee(db: Session, name: str, password: str, token_str: str) -> User:
    """Complete employee registration using a valid invite token."""
    invite = db.query(InviteToken).filter(InviteToken.token == token_str).first()
    if not invite:
        raise not_found("Invite token")
    if invite.used:
        raise conflict("Invite link has already been used")
    if invite.expires_at < datetime.utcnow():
        raise conflict("Invite link has expired")

    user = db.query(User).filter(User.email == invite.email).first()
    if not user:
        raise not_found("Invited user record")
    if user.password is not None:
        raise conflict("Account already set up — please login")

    # Fill in the placeholder user created when the invite was sent
    user.name = name
    user.password = hash_password(password)
    invite.used = True
    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, email: str, password: str) -> dict:
    """Verify credentials and return a signed JWT + user object."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password:
        raise unauthorized("Invalid email or password")
    if not verify_password(password, user.password):
        raise unauthorized("Invalid email or password")
    if not user.is_active:
        raise unauthorized("Account is deactivated")
    token = create_access_token({"sub": user.id, "role": user.role.value})
    return {"token": token, "user": user}


def create_invite(db: Session, email: str, invited_by_id: str) -> InviteToken:
    """Admin creates an invite for an email. Invalidates any previous unused invite."""
    existing = db.query(User).filter(User.email == email).first()
    if existing and existing.password is not None:
        raise conflict("A registered user with this email already exists")

    # Create a placeholder user row so the email is reserved
    if not existing:
        placeholder = User(email=email, role=Role.EMPLOYEE)
        db.add(placeholder)
        db.flush()

    # Remove old unused invites for this email before creating a new one
    db.query(InviteToken).filter(
        InviteToken.email == email, InviteToken.used == False  # noqa: E712
    ).delete()

    token_str = secrets.token_urlsafe(32)
    invite = InviteToken(
        email=email,
        token=token_str,
        invited_by=invited_by_id,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite
