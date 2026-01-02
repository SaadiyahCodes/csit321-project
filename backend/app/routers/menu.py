from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.menu import MenuItemResponse, MenuItemCreate, MenuItemUpdate
from app.crud.menu import get_all_menu_items, get_menu_item, create_menu_item, update_menu_item, delete_menu_item
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

# Creates a new menu item
@router.post("/", response_model=MenuItemResponse, status_code=201)
def add_menu_item(item: MenuItemCreate, db: Session = Depends(get_db)):
    return create_menu_item(db, item)

# Updates an existing menu item
@router.put("/{item_id}", response_model=MenuItemResponse)
def edit_menu_item(item_id: int, data: MenuItemUpdate, db: Session = Depends(get_db)):
    item = update_menu_item(db, item_id, data)

    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    return item

# Deletes a menu item
@router.delete("/{item_id}")
def remove_menu_item(item_id: int, db: Session = Depends(get_db)):
    deleted = delete_menu_item(db, item_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    return {"message": "Menu item deleted successfully"}
    

