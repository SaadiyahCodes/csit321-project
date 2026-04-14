from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from app.db.base import Base
import enum
from sqlalchemy.dialects.postgresql import JSONB

class IntentType(str, enum.Enum):
    INQUIRY = "inquiry"
    ORDER_CONFIRMATION = "order_confirmation"
    GENERAL = "general"

class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), ForeignKey("customer_sessions.session_id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    intent = Column(Enum(IntentType), nullable=True)
    extracted_allergens = Column(JSONB, nullable=True)
    items_rejected_count = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())