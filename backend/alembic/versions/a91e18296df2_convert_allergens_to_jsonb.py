"""Convert allergens to JSONB

Revision ID: a91e18296df2
Revises: 
Create Date: 2026-01-19 22:09:09.058431

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a91e18296df2'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Convert allergens from VARCHAR to JSONB with data migration
    op.execute("""
        ALTER TABLE menuitems 
        ALTER COLUMN allergens TYPE JSONB 
        USING (
            CASE 
                WHEN allergens IS NULL THEN NULL
                WHEN allergens = '' THEN '[]'::jsonb
                ELSE ('["' || replace(allergens, ',', '","') || '"]')::jsonb
            END
        );
    """)
    
    # Add foreign key constraint (auto-generated)
    op.create_foreign_key(None, 'users', 'restaurants', ['restaurant_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop foreign key constraint
    op.drop_constraint(None, 'users', type_='foreignkey')
    
    # Revert JSONB back to VARCHAR if needed
    op.execute("""
        ALTER TABLE menuitems 
        ALTER COLUMN allergens TYPE VARCHAR(255) 
        USING (
            CASE 
                WHEN allergens IS NULL THEN NULL
                WHEN jsonb_array_length(allergens) = 0 THEN ''
                ELSE array_to_string(
                    ARRAY(SELECT jsonb_array_elements_text(allergens)), 
                    ','
                )
            END
        );
    """)
