# Standardised API response helpers — every endpoint returns the same shape
from typing import Any


def ok(message: str, data: Any = None) -> dict:
    """Return a 200 success response with optional data payload."""
    return {"success": True, "message": message, "data": data}


def created(message: str, data: Any = None) -> dict:
    """Return a 201 created response with optional data payload."""
    return {"success": True, "message": message, "data": data}
