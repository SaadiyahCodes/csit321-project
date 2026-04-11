"""add_order_details_to_selections

Revision ID: 187e6978e7a5
Revises: a1b2c3d4e5f6
Create Date: 2026-04-09 15:16:17.833849

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '187e6978e7a5'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('selections', sa.Column('order_type', sa.String(20), nullable=True))
    op.add_column('selections', sa.Column('table_number', sa.String(50), nullable=True))
    op.add_column('selections', sa.Column('delivery_address', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('selections', 'delivery_address')
    op.drop_column('selections', 'table_number')
    op.drop_column('selections', 'order_type')
