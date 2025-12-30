from pydantic import BaseModel
from datetime import datetime

# Schema for restaurants
class RestaurantBase(BaseModel):
    id: int
    name: str
    created_at: datetime | None = None #optional

    class Config:
        from_attributes = True