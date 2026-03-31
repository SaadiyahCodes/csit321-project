#app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_admin_user, get_admin_restaurant_id
from app.models import User
from app.db.database import get_db
from app.schemas.restaurant import RestaurantResponse, RestaurantUpdate
from app.schemas.menu import MenuItemResponse, MenuItemCreate, MenuItemUpdate
from app.crud import restaurant as restaurant_crud
from app.crud import menu as menu_crud
from app.services.chatbot_service import chatbot_service

# AR Model Validator
def validate_ar_model_url(ar_model_url: str | None):
    if ar_model_url and not ar_model_url.endswith(".glb"):
        raise HTTPException(
            status_code=400,
            detail="AR model URL must end with .glb"
        )

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/dashboard")
async def admin_dashboard(current_admin: User = Depends(get_current_admin_user)):
    """this is an admin only endpoint
    requires valid JWT Token AND is_admin=True"""
    return {
        "message": f"Welcome to admin dashboard, {current_admin.email}!",
        "user": {
            "email": current_admin.email,
            "is_admin": current_admin.is_admin
        }
    }


#RESTAURANT ENDPOINTS

@router.get("/restaurant", response_model=RestaurantResponse)
def get_my_restaurant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get the restaurant associated with the logged-in admin"""
    restaurant = restaurant_crud.get_admin_restaurant(db, current_user)
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="No restaurant associated with this admin")
    
    return restaurant


@router.patch("/restaurant", response_model=RestaurantResponse)
def update_my_restaurant(
    data: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update the restaurant associated with the logged-in admin"""
    restaurant = restaurant_crud.update_admin_restaurant(db, current_user, data)
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="No restaurant associated with this admin")
    
    return restaurant


#MENU ENDPOINTS

@router.get("/menu", response_model=list[MenuItemResponse])
def get_my_menu_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all menu items for the admin's restaurant"""
    return menu_crud.get_admin_menu_items(db, current_user)


@router.get("/menu/{item_id}", response_model=MenuItemResponse)
def get_my_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get a specific menu item (only if it belongs to admin's restaurant)"""
    item = menu_crud.get_admin_menu_item(db, item_id, current_user)
    
    if not item:
        raise HTTPException(
            status_code=404, 
            detail="Menu item not found or doesn't belong to your restaurant"
        )
    
    return item


@router.post("/menu", response_model=MenuItemResponse, status_code=201)
def create_my_menu_item(
    item: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    validate_ar_model_url(item.ar_model_url)
    """Create a new menu item for the admin's restaurant"""
    #Note: restaurant_id in MenuItemCreate will be overridden with admin's restaurant_id
    created_item = menu_crud.create_admin_menu_item(db, item, current_user)
    
    if not created_item:
        raise HTTPException(status_code=400, detail="Failed to create menu item")
    chatbot_service.invalidate_menu_cache(current_user.restaurant_id)
    return created_item


@router.patch("/menu/{item_id}", response_model=MenuItemResponse)
def update_my_menu_item(
    item_id: int,
    data: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    validate_ar_model_url(data.ar_model_url)
    """Update a menu item (only if it belongs to admin's restaurant)"""
    item = menu_crud.update_admin_menu_item(db, item_id, data, current_user)
    
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found or doesn't belong to your restaurant"
        )
    chatbot_service.invalidate_menu_cache(current_user.restaurant_id)
    return item


@router.delete("/menu/{item_id}")
def delete_my_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a menu item (only if it belongs to admin's restaurant)"""
    deleted = menu_crud.delete_admin_menu_item(db, item_id, current_user)
    
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found or doesn't belong to your restaurant"
        )
    chatbot_service.invalidate_menu_cache(current_user.restaurant_id)
    return {"message": "Menu item deleted successfully"}