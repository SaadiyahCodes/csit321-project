from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    #restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    #restaurant = relationship("Restaurant", backref="admins")
