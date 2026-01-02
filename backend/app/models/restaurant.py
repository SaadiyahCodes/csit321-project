from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

# Model for restaurants
class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    rating = Column(Float, default=0.0)
    image = Column(String(500), nullable=True) #stores image URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relationship to menu items
    menu_items = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")

    # relationship to admin
    admins = relationship("User", back_populates="restaurant")
