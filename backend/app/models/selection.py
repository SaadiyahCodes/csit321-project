from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum

# Enum for selection status
class SelectionStatus(str, enum.Enum):
    PENDING = "pending"
    FINALIZED = "finalized"

# Model for selections
class Selection(Base):
    __tablename__ = "selections"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), ForeignKey("customer_sessions.session_id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    status = Column(Enum(SelectionStatus), default=SelectionStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    finalized_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    session = relationship("CustomerSession", back_populates="selections")
    restaurant = relationship("Restaurant")
    items = relationship("SelectionItem", back_populates="selection", cascade="all, delete-orphan")

# Model for selection items
class SelectionItem(Base):
    __tablename__ = "selection_items"

    id = Column(Integer, primary_key=True, index=True)
    selection_id = Column(Integer, ForeignKey("selections.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menuitems.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)

    # Constraint: quantity must be positive
    __table_args__ = (
        CheckConstraint('quantity > 0', name='check_quantity_positive'),
    )

    # Relationships
    selection = relationship("Selection", back_populates="items")
    menu_item = relationship("MenuItem")