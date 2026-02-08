from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class CustomerBase(BaseModel):
    name: str | None = None
    email: EmailStr
    phone_number: str | None = None

class CustomerCreate(CustomerBase):
    password: str = Field(..., min_length=8)

class CustomerUpdate(BaseModel):
    name: str | None = None
    phone_number: str | None = None

class CustomerResponse(CustomerBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True