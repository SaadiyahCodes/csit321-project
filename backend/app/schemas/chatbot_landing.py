# app/schemas/chatbot_landing.py
from pydantic import BaseModel, Field

class ChatbotLandingRequest(BaseModel):
    message: str = Field(..., description="User's message")
    conversation_id: str = Field(..., description="Client-generated UUID to track conversation")
    language: str = Field(default="en", description="Language code (en, ar, ur, etc.)")

class ChatbotLandingResponse(BaseModel):
    response: str
    conversation_id: str
    suggested_restaurants: list[dict] = []
    original_message: str | None = None
    translated: bool = False
    error: bool = False