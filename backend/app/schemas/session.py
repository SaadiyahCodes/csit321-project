from pydantic import BaseModel, field_validator
from datetime import datetime
#import uuid

# Schema for creating a new session
class SessionCreate(BaseModel):
    session_id: str
    restaurant_id: int
    language: str = "en"

    # Uncomment the following validator if you want to enforce UUID format for session_id
    # Only if you want strict UUID validation
    # @field_validator("session_id")
    # def validate_session_id(cls, v):
    #     # Validate uuid format
    #     try:
    #         uuid.UUID(v)
    #     except ValueError:
    #         raise ValueError("session_id must be a valid UUID")
    #     return v
    
# Schema for responding with session details
class SessionResponse(BaseModel):
    session_id: str
    restaurant_id: int
    language: str
    created_at: datetime

    class Config:
        from_attributes = True
