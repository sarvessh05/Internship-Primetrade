# Password hashing and JWT creation/decoding utilities
from datetime import datetime, timedelta
from jose import jwt
from bcrypt import hashpw, checkpw, gensalt
from app.core.config import settings


def hash_password(plain: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return hashpw(plain.encode(), gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if the plain password matches the stored hash."""
    return checkpw(plain.encode(), hashed.encode())


def create_access_token(payload: dict) -> str:
    """Sign a JWT with the user's id and role. Expires after JWT_EXPIRE_DAYS."""
    data = payload.copy()
    data["exp"] = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    return jwt.encode(data, settings.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    """Decode and verify a JWT. Raises JWTError if invalid or expired."""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
