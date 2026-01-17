from pydantic import BaseModel, Field, computed_field
from datetime import datetime
from app.schemas.menu import MenuItemResponse

# Schema for creating a selection item
class SelectionItemAdd(BaseModel):
    menu_item_id: int = Field(..., description="Menu item ID")
    quantity: int = Field(..., ge=1)
    notes: str | None = None

# Schema for updating a selection item
class SelectionItemUpdate(BaseModel):
    quantity: int | None = Field(None, ge=0)
    notes: str | None = None

# Schema for responding with selection items
class SelectionItemResponse(BaseModel):
    id: int
    menu_item_id: int
    quantity: int
    notes: str | None
    menu_item: MenuItemResponse

    # Computed field for the total price of the item
    @computed_field
    @property
    def item_total(self) -> float:
        return round(self.quantity * self.menu_item.price, 2)

    class Config:
        from_attributes = True

# Schema for responding with selections
class SelectionResponse(BaseModel):
    id: int
    session_id: str
    restaurant_id: int | None
    status: str
    items: list[SelectionItemResponse] = Field(default_factory=list)
    created_at: datetime
    finalized_at: datetime | None

    # Computed field for the total price of the selection
    @computed_field
    @property
    def total_price(self) -> float:
        return round(sum(item.item_total for item in self.items), 2)

    # Computed field for the total number of items in the selection
    @computed_field
    @property
    def item_count(self) -> int:
        return len(self.items)

    class Config:
        from_attributes = True

# Schema for finalizing a selection response
class SelectionFinalizeResponse(BaseModel):
    selection_id: int
    qr_code: str
    total_price: float
    item_count: int
    finalized_at: datetime

    class Config:
        from_attributes = True
