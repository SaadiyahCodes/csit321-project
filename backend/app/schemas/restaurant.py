#backend/app/schemas/restaurant.py
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime

# Schema for restaurants
class RestaurantBase(BaseModel):
    name: str
    category: str | None = None
    rating: float | None = 0.0
    image: str | None = None
    location: str | None = None
    avg_price_range: str | None = None #eg: "$", "$$", "$$$"
    table_count: int = Field(default=10, ge=1, le=100)

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    rating: float | None = None
    image: str | None = None
    location: str | None = None
    avg_price_range: str | None = None
    table_count: int | None = Field(default=None, ge=1, le=100)

class RestaurantResponse(RestaurantBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True