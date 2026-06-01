# Global exception handlers — convert errors into the standard response shape
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


def http_exception_handler(request: Request, exc: HTTPException):
    """Handles all HTTPExceptions (401, 403, 404, 409, etc.)."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail, "errors": []},
    )


def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic validation errors — returns 422 with per-field details."""
    errors = [
        {"field": " → ".join(str(loc) for loc in err["loc"]), "message": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"success": False, "message": "Validation failed", "errors": errors},
    )


def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unexpected server errors — never leaks stack traces."""
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error", "errors": []},
    )
