#app/schemas/customer_profile.py
from pydantic import BaseModel, Field
from datetime import datetime

available_allergens = ["nuts", "peanuts", "dairy", "gluten", "shellfish", "soy", "eggs", "fish", "wheat", "sesame", "mustard"]

available_dietary_preferences = ["vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free", "halal", "kosher", "pescatarian", "paleo", "keto"]

class ProfileBase(BaseModel):
    allergens: list[str] | None = Field(default_factory=list)
    dietary_preferences: list[str] | None = Field(default_factory=list)
    notes: str | None = Field(None, max_length=500)

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    #These are handled in the router directly on Customer, not on CustomerProfile
    name: str | None = None
    phone_number: str | None = None

class ProfileResponse(ProfileBase):
    id: int
    customer_id: int
    created_at: datetime
    updated_at: datetime
    #pulled from Customer relationship
    name: str | None = None
    email: str | None = None
    phone_number: str | None = None

    class Config:
        from_attributes = True