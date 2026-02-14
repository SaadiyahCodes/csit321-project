from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.db.base import Base

class ChatAnalytics(Base):
    __tablename__ = "chat_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    date = Column(Date, nullable=False)
    total_conversations = Column(Integer, default=0)
    total_orders = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0.0)
    avg_session_duration = Column(Integer, default=0)  # seconds
    top_questions = Column(JSONB)  # [{"question": "...", "count": 50}]
    allergen_inquiries = Column(JSONB)  # {"dairy": 45, "peanuts": 23}
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UpsellAnalytics(Base):
    __tablename__ = "upsell_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False)
    original_item_id = Column(Integer, ForeignKey("menuitems.id"), nullable=False)
    suggested_items = Column(JSONB)  # [5, 8, 12]
    accepted_items = Column(JSONB)   # [5]
    created_at = Column(DateTime(timezone=True), server_default=func.now())