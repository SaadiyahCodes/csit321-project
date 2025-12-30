from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

# Model for menu items
class MenuItem(Base):
    __tablename__ = "menuitems"

    id = Column(Integer, primary_key=True, index=True)

    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)

    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)

    price = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)

    # image_url = Column(String(500), nullable=True)
    # ar_model_url = Column(String(500), nullable=True)

    allergens = Column(String(255), nullable=True)
    # Example: "peanuts,dairy,gluten"

    is_available = Column(Boolean, default=True)

    # relationship to restaurant
    restaurant = relationship("Restaurant", back_populates="menu_items")