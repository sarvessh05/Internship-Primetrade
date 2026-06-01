# WarehouseOS — Warehouse Management System

A role-based Warehouse Management System (WMS) with JWT authentication and granular controls. The application supports two distinct roles: **ADMIN** and **EMPLOYEE**, each having tailormade dashboards and workflows. Built with **FastAPI (Python)**, **React (Vite + TypeScript)**, and **PostgreSQL**.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Python 3.11+, FastAPI, Uvicorn      |
| ORM        | SQLAlchemy 2.0                      |
| Migrations | Alembic                             |
| Database   | PostgreSQL (Supabase recommended)   |
| Auth       | JWT (python-jose) + bcrypt          |
| Validation | Pydantic v2                         |
| Frontend   | React 19, Vite, TypeScript          |
| Styling    | Vanilla CSS (Rich Custom Design)    |
| HTTP / Form| Axios, React Hook Form, React Router|

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── core/              # DB config, security, exceptions, global handlers
│   │   ├── models/            # SQLAlchemy database models + enums
│   │   ├── modules/           # Module-based route splits
│   │   │   ├── common/        # Shared components
│   │   │   │   └── auth/      # Registration, login, /me, invite
│   │   │   ├── employee/      # Employee dashboards/actions
│   │   │   │   ├── inventory/ # CRUD for owned inventory items
│   │   │   │   └── bills/     # Create and status management for bills
│   │   │   └── admin/         # Admin endpoints
│   │   │       ├── inventory/ # Global inventory view + aggregated stats
│   │   │       ├── bills/     # Global bills view + revenue metrics
│   │   │       └── employees/ # Team management (deactivate/activate accounts)
│   │   └── main.py            # FastAPI entry point & router wiring
│   ├── alembic/               # Database migrations
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/           # Axios instance + API call specifications
        ├── components/    # Common widgets (Protected routes, Password checkers, Loaders)
        ├── context/       # AuthContext containing global state (user profile + token)
        └── pages/         # Login, AdminRegister, EmployeeRegister, Dashboard
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL Database

### Backend

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
copy .env.example .env
# Edit .env and supply DATABASE_URL, JWT_SECRET, and ADMIN_SECRET

# 4. Run migrations
alembic upgrade head

# 5. Start development server
uvicorn app.main:app --reload
```

- API docs: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger) or [http://localhost:8000/redoc](http://localhost:8000/redoc) (ReDoc)

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

- App live at: [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

### Backend (`backend/.env`)

| Variable          | Description                                  | Example                             |
|-------------------|----------------------------------------------|-------------------------------------|
| `DATABASE_URL`    | PostgreSQL connection string                 | `postgresql://user:pass@host/db`    |
| `JWT_SECRET`      | Random secret string to sign JWTs            | `super-secret-key-phrase`           |
| `JWT_EXPIRE_DAYS` | Token longevity in days (default: 7)         | `7`                                 |
| `ADMIN_SECRET`    | Secret required for bootstrapping an Admin   | `warehouse-admin-2024`              |

### Frontend (`frontend/.env`)

| Variable       | Description                        | Example                         |
|----------------|------------------------------------|---------------------------------|
| `VITE_API_URL` | Base endpoint of the backend API   | `http://localhost:8000/api/v1`  |

---

## Database Schema

```mermaid
erDiagram
    users ||--o{ inventory_items : "adds"
    users ||--o{ bills : "creates"
    users ||--o{ invite_tokens : "invites"
    bills ||--|{ bill_items : "contains"
    inventory_items ||--o{ bill_items : "billed_in"

    users {
        string id PK
        string name "nullable"
        string email UK
        string password "nullable"
        string role "ADMIN | EMPLOYEE"
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    inventory_items {
        string id PK
        string name
        string sku UK "nullable"
        string category "RAW_MATERIAL | FINISHED_GOOD | CONSUMABLE | EQUIPMENT | OTHER"
        text description "nullable"
        integer quantity
        string unit
        numeric price
        string added_by FK
        datetime created_at
        datetime updated_at
    }

    bills {
        string id PK
        string bill_number UK
        string customer_name
        string customer_contact "nullable"
        text notes "nullable"
        string status "DRAFT | CONFIRMED | CANCELLED"
        numeric total
        string created_by FK
        datetime created_at
        datetime updated_at
    }

    bill_items {
        string id PK
        string bill_id FK
        string inventory_item_id FK
        integer quantity
        numeric unit_price
        numeric subtotal
    }

    invite_tokens {
        string id PK
        string email
        string token UK
        boolean used
        string invited_by FK
        datetime expires_at
        datetime created_at
    }
```

---

## API Reference

### Auth & User Management (Shared)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register/admin` | None | Create the initial admin account (requires `ADMIN_SECRET`). |
| POST | `/api/v1/auth/register/employee` | None | Register an invited employee using a valid token. |
| POST | `/api/v1/auth/login` | None | Verify credentials and return a signed JWT. |
| GET | `/api/v1/auth/me` | JWT | Get the profile details of the logged-in user. |
| POST | `/api/v1/auth/invite` | JWT (Admin Only) | Invite an employee by email (generates registration token). |

### Inventory Management

| Method | Endpoint | Auth | Access | Description |
|---|---|---|---|---|
| GET | `/api/v1/inventory/` | JWT | Employee | List own inventory items (paginated + search/filter). |
| POST | `/api/v1/inventory/` | JWT | Employee | Create a new inventory item (rejections on duplicate SKUs). |
| GET | `/api/v1/inventory/{id}` | JWT | Employee | Fetch single owned inventory item. |
| PATCH | `/api/v1/inventory/{id}` | JWT | Employee | Update owned inventory item details. |
| DELETE | `/api/v1/inventory/{id}` | JWT | Employee | Delete owned inventory item. |
| GET | `/api/v1/inventory/admin/all` | JWT | Admin Only | View all inventory items across all warehouse employees. |
| GET | `/api/v1/inventory/admin/stats` | JWT | Admin Only | Fetch global metrics (total items, total value, low-stock). |

### Dispatch Bills

| Method | Endpoint | Auth | Access | Description |
|---|---|---|---|---|
| GET | `/api/v1/bills/` | JWT | Employee | List own created bills. |
| POST | `/api/v1/bills/` | JWT | Employee | Create a dispatch bill (auto-generates bill number, deducts stock). |
| GET | `/api/v1/bills/{id}` | JWT | Employee | Fetch single owned bill with line items. |
| PATCH | `/api/v1/bills/{id}/status` | JWT | Employee | Cancel or confirm a draft bill (cancelling restores stock). |
| GET | `/api/v1/bills/admin/all` | JWT | Admin Only | View all bills created across the team. |
| GET | `/api/v1/bills/admin/stats` | JWT | Admin Only | Fetch aggregate revenue and pending/cancelled bill counts. |

### Employee Team Management (Admin Only)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/employees/` | JWT | List all registered warehouse employees, sorted newest first. |
| PATCH | `/api/v1/employees/{id}/deactivate` | JWT | Block an employee from logging in (prevents auth without deleting data). |
| PATCH | `/api/v1/employees/{id}/activate` | JWT | Restore warehouse/app access for a deactivated employee. |
