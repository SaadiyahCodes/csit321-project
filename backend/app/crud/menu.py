from sqlalchemy.orm import Session
from app.models.menuitems import MenuItem
from app.schemas.menu import MenuItemCreate, MenuItemUpdate

# CRUD operations for menu items

# Returns all menu items
def get_all_menu_items(db: Session):
    return db.query(MenuItem).all()

# Returns a specific menu item by ID
def get_menu_item(db: Session, item_id: int):
    return db.query(MenuItem).filter(MenuItem.id==item_id).first()

# Creates a new menu item
def create_menu_item(db: Session, item: MenuItemCreate):
    menu_item = MenuItem(**item.model_dump())
    db.add(menu_item)
    db.commit()
    db.refresh(menu_item)

    return menu_item

# Updates an existing menu item
def update_menu_item(db: Session, item_id: int, data: MenuItemUpdate):
    menu_item = get_menu_item(db, item_id)

    if not menu_item:
        return None
    
    # Update only the fields that are provided
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(menu_item, field, value)

    db.commit()
    db.refresh(menu_item)
    return menu_item

# Deletes a menu item
def delete_menu_item(db: Session, item_id: int):
    menu_item = get_menu_item(db, item_id)

    if not menu_item:
        return None
    
    db.delete(menu_item)
    db.commit()
    return True
    