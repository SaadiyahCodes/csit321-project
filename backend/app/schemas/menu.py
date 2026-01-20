from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime
from typing import Optional, List

# Enum for menu categories (allowed categories)
class MenuCategory(str, Enum):
    MAINS = "mains"
    SIDES = "sides"
    DESSERTS = "dessert"
    DRINKS = "drinks"

# Schema for menu items
class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(default=None, max_length=255)
    price: float = Field (..., ge=0)
    category: MenuCategory
    allergens: Optional[List[str]] = []
    ingredients: Optional[str] = None
    is_available: bool = True
    image_url: str | None = None
    ar_model_url: str | None = None

# Schema for creating menu items
class MenuItemCreate(MenuItemBase):
    restaurant_id: int | None = None

# Schema for updating menu items (partial update)
class MenuItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    price: float | None = Field(default=None, ge=0)
    category: MenuCategory | None = None
    allergens: Optional[List[str]] = None
    ingredients: Optional[str] = None
    is_available: bool | None = None
    image_url: str | None = None
    ar_model_url: str | None = None

# Schema for responding with menu items
class MenuItemResponse(MenuItemBase):
    id: int
    restaurant_id: int

    class Config:
        from_attributes = True