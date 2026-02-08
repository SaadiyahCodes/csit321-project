"""Add customer profile management

Revision ID: b3f7c89a4d21
Revises: a91e18296df2
Create Date: 2026-02-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b3f7c89a4d21'
down_revision: Union[str, Sequence[str], None] = 'a91e18296df2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add customer tables and link to existing selections/sessions."""
    
    # 1. Create customers table
    op.create_table(
        'customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_customers_email'), 'customers', ['email'], unique=False)
    
    # 2. Create customer_profiles table
    op.create_table(
        'customer_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('allergens', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default='[]'),
        sa.Column('dietary_preferences', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default='[]'),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('customer_id')
    )
    op.create_index(op.f('ix_customer_profiles_customer_id'), 'customer_profiles', ['customer_id'], unique=False)
    
    # 3. Add customer_id to customer_sessions (nullable - supports guests)
    op.add_column('customer_sessions', sa.Column('customer_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_customer_sessions_customer_id', 'customer_sessions', 'customers', ['customer_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_customer_sessions_customer_id'), 'customer_sessions', ['customer_id'], unique=False)
    
    # 4. Add customer_id to selections (nullable - supports guests)
    op.add_column('selections', sa.Column('customer_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_selections_customer_id', 'selections', 'customers', ['customer_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_selections_customer_id'), 'selections', ['customer_id'], unique=False)
    
    # 5. Create trigger for auto-updating updated_at on customers
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)
    
    op.execute("""
        CREATE TRIGGER update_customers_updated_at 
        BEFORE UPDATE ON customers 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    """)
    
    op.execute("""
        CREATE TRIGGER update_customer_profiles_updated_at 
        BEFORE UPDATE ON customer_profiles 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    """Downgrade schema - Remove customer tables and columns."""
    
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;")
    op.execute("DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")
    
    # Drop indexes and columns from selections
    op.drop_index(op.f('ix_selections_customer_id'), table_name='selections')
    op.drop_constraint('fk_selections_customer_id', 'selections', type_='foreignkey')
    op.drop_column('selections', 'customer_id')
    
    # Drop indexes and columns from customer_sessions
    op.drop_index(op.f('ix_customer_sessions_customer_id'), table_name='customer_sessions')
    op.drop_constraint('fk_customer_sessions_customer_id', 'customer_sessions', type_='foreignkey')
    op.drop_column('customer_sessions', 'customer_id')
    
    # Drop customer_profiles table
    op.drop_index(op.f('ix_customer_profiles_customer_id'), table_name='customer_profiles')
    op.drop_table('customer_profiles')
    
    # Drop customers table
    op.drop_index(op.f('ix_customers_email'), table_name='customers')
    op.drop_table('customers')