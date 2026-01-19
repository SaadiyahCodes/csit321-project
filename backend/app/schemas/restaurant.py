#backend/app/schemas/restaurant.py
from pydantic import BaseModel, HttpUrl
from datetime import datetime

# Schema for restaurants
class RestaurantBase(BaseModel):
    name: str
    category: str | None = None
    rating: float | None = 0.0
    image: str | None = None

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    rating: float | None = None
    image: str | None = None

class RestaurantResponse(RestaurantBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True