from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base import Base

# Model for customer sessions
class CustomerSession(Base):
    __tablename__ = "customer_sessions"

    session_id = Column(String(100), primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    language = Column(String, default="en", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    allergen_preferences = Column(JSONB)  # {"allergens": ["dairy", "peanuts"]}

    # Relationships
    restaurant = relationship("Restaurant")
    customer = relationship("Customer")
    selections = relationship("Selection", back_populates="session", cascade="all, delete-orphan")
