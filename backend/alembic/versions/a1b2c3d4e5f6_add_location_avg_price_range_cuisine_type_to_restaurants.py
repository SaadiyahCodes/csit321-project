"""add location, avg_price_range to restaurants

Revision ID: a1b2c3d4e5f6
Revises: 62c4f8a92fbe
Create Date: 2026-03-13 20:02:02.367468

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '62c4f8a92fbe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('restaurants', sa.Column('location', sa.String(255), nullable=True))
    op.add_column('restaurants', sa.Column('avg_price_range', sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column('restaurants', 'avg_price_range')
    op.drop_column('restaurants', 'location')