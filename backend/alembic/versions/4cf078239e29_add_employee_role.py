"""add_employee_role

Revision ID: 4cf078239e29
Revises: adc02839a3fb
Create Date: 2026-06-01 18:57:00.883161

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4cf078239e29'
down_revision: Union[str, None] = 'adc02839a3fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Alter the database type 'role' to include 'EMPLOYEE'
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'EMPLOYEE'")
    
    # Migrate any old users from the 'USER' role to the new 'EMPLOYEE' role
    op.execute("UPDATE users SET role = 'EMPLOYEE' WHERE role = 'USER'")


def downgrade() -> None:
    # Revert 'EMPLOYEE' users back to 'USER' if downgrading
    op.execute("UPDATE users SET role = 'USER' WHERE role = 'EMPLOYEE'")

