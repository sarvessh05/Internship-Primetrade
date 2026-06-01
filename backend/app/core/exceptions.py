# Shorthand helpers for raising common HTTP errors consistently
from fastapi import HTTPException


def not_found(resource: str = "Resource") -> HTTPException:
    """Raise a 404 when a requested record doesn't exist."""
    return HTTPException(status_code=404, detail=f"{resource} not found")


def forbidden(msg: str = "You do not have permission") -> HTTPException:
    """Raise a 403 when a user tries to access something they don't own."""
    return HTTPException(status_code=403, detail=msg)


def conflict(msg: str) -> HTTPException:
    """Raise a 409 when a duplicate or invalid state is detected."""
    return HTTPException(status_code=409, detail=msg)


def unauthorized(msg: str = "Not authenticated") -> HTTPException:
    """Raise a 401 when credentials are missing or wrong."""
    return HTTPException(status_code=401, detail=msg)
