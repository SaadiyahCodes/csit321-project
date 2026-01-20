# app/schemas/chatbot.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message")
    session_id: str = Field(..., description="Customer session ID")
    language: str = Field(default="en", description="Language code (en, ar, ur)")
    allergies: Optional[List[str]] = Field(default=None, description="User allergies")

class ChatResponse(BaseModel):
    response: str
    intent: Dict
    session_id: str
    original_message: Optional[str] = None
    translated: bool = False
    error: bool = False

class ChatHistoryMessage(BaseModel):
    user: str
    assistant: str
    intent: Dict
    timestamp: str

class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[ChatHistoryMessage]
    count: int