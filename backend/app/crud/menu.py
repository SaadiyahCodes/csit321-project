from sqlalchemy.orm import Session
from app.models.menuitems import MenuItem
from app.schemas.menu import MenuItemCreate, MenuItemUpdate
from app.models.user import User

# CRUD operations for menu items

# Returns all menu items
def get_all_menu_items(db: Session):
    return db.query(MenuItem).all()

# Returns a specific menu item by ID
def get_menu_item(db: Session, item_id: int):
    return db.query(MenuItem).filter(MenuItem.id==item_id).first()

# -------ADMIN FUNCTIONS------

#get menu item (for admin only)
def get_admin_menu_item(db:Session, item_id: int, admin_user: User):
    if not admin_user.restaurant_id:
        return []
    return db.query(MenuItem).filter(
            MenuItem.id == item_id,
            MenuItem.restaurant_id == admin_user.restaurant_id
        ).first()

#get menu items (for admin only)
def get_admin_menu_items(db:Session, admin_user: User):
    if not admin_user.restaurant_id:
        return []
    return db.query(MenuItem).filter(MenuItem.restaurant_id == admin_user.restaurant_id).all()

# Creates a new menu item (admin only)
def create_admin_menu_item(db: Session, item: MenuItemCreate, admin_user: User):
    if not admin_user.restaurant_id:
        return None
    
    #force the restaurant id to be the admin's restaurant
    item_data = item.model_dump()
    item_data['restaurant_id'] = admin_user.restaurant_id
    menu_item = MenuItem(**item_data)
    db.add(menu_item)
    db.commit()
    db.refresh(menu_item)

    return menu_item

# Updates an existing menu item (admin only)
def update_admin_menu_item(db: Session, item_id: int, data: MenuItemUpdate, admin_user: User):
    menu_item = get_admin_menu_item(db, item_id, admin_user)

    if not menu_item:
        return None
    
    # Update only the fields that are provided
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(menu_item, field, value)

    db.commit()
    db.refresh(menu_item)
    return menu_item

# Deletes a menu item (admin only)
def delete_admin_menu_item(db: Session, item_id: int, admin_user: User):
    menu_item = get_admin_menu_item(db, item_id, admin_user)

    if not menu_item:
        return False
    
    db.delete(menu_item)
    db.commit()
    return True
    