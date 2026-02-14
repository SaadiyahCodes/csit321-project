from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base

class ChatbotOrder(Base):
    __tablename__ = "chatbot_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), ForeignKey("customer_sessions.session_id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menuitems.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    notes = Column(Text, nullable=True)
    confirmed_at = Column(DateTime(timezone=True), server_default=func.now())