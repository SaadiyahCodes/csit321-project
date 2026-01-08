from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.menu import MenuItemResponse, MenuItemCreate, MenuItemUpdate
from app.crud.menu import get_all_menu_items, get_menu_item
from app.models.menuitems import MenuItem

router = APIRouter(prefix="/api/menu", tags=["menu"])

# Returns all menu items
@router.get("/", response_model=list[MenuItemResponse])
def list_menu_items(restaurant_id: int | None = None, db: Session = Depends(get_db)):
    if restaurant_id:
        #filter by restaurant
        return db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant_id).all()
    return get_all_menu_items(db)

# Returns a specific menu item by ID
@router.get("/{item_id}", response_model=MenuItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = get_menu_item(db, item_id)

    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    return item


