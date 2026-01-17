from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

# Model for customer sessions
class CustomerSession(Base):
    __tablename__ = "customer_sessions"

    session_id = Column(String(100), primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    language = Column(String, default="en", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    restaurant = relationship("Restaurant")
    selections = relationship("Selection", back_populates="session", cascade="all, delete-orphan")
