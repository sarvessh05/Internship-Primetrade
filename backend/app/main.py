# Application entry point — wires together all routers, middleware, and error handlers
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

# Core infrastructure
from app.core.error_handlers import (
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)

# Routers grouped by who can access them
from app.modules.common.auth.router import router as auth_router          # everyone
from app.modules.employee.inventory.router import router as inv_router    # employees + admin
from app.modules.employee.bills.router import router as bills_router      # employees + admin
from app.modules.admin.inventory.router import router as admin_inv_router # admin only
from app.modules.admin.bills.router import router as admin_bills_router   # admin only
from app.modules.admin.employees.router import router as emp_router       # admin only

app = FastAPI(
    title="Warehouse Management API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    description="""
## Warehouse Management System API

Role-based access control with **ADMIN** and **EMPLOYEE** roles.

### Setup Flow
1. First admin registers via `POST /api/v1/auth/register/admin` (allowed only if no admin exists in the system)
2. Admin invites employees via `POST /api/v1/auth/invite`
3. Employee registers via `POST /api/v1/auth/register/employee` using invite token
4. Everyone logs in via `POST /api/v1/auth/login`

### Auth
All protected routes require: `Authorization: Bearer <token>`

### Roles
| Role | Access |
|------|--------|
| EMPLOYEE | Own inventory + own bills |
| ADMIN | Everything + employee management |
""",
)

# Allow the Vite dev server to call the API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register global error handlers — all errors return { success, message, errors }
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Mount all routers under /api/v1
app.include_router(auth_router,        prefix="/api/v1")
app.include_router(inv_router,         prefix="/api/v1")
app.include_router(bills_router,       prefix="/api/v1")
app.include_router(admin_inv_router,   prefix="/api/v1")
app.include_router(admin_bills_router, prefix="/api/v1")
app.include_router(emp_router,         prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health():
    """Quick liveness check — returns 200 if the server is running."""
    return {"status": "ok", "service": "Warehouse Management API"}
