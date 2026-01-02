#backend/app/routers/restaurant.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.restaurant import RestaurantResponse, RestaurantCreate, RestaurantUpdate
from app.crud.restaurant import (
    get_all_restaurants, get_restaurant,
    create_restaurant, update_restaurant, delete_restaurant
)

router = APIRouter(prefix="/api/restaurants", tags=["restaurants"])

#get all restaurants - for landing page
@router.get("/", response_model=list[RestaurantResponse])
def list_restaurants(db: Session = Depends(get_db)):
    return get_all_restaurants(db)


#get a specific restaurant
@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant_detail(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = get_restaurant(db, restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


#create a new restaurant (admin only)
@router.post("/", response_model=RestaurantResponse, status_code=201)
def add_restaurant(restaurant: RestaurantCreate, db: Session = Depends(get_db)):
    return create_restaurant(db, restaurant)


#update a restaurant (admin only)
@router.put("/{restaurant_id}", response_model=RestaurantResponse)
def edit_restaurant(restaurant_id: int, data: RestaurantUpdate, db: Session = Depends(get_db)):
    restaurant = update_restaurant(db, restaurant_id, data)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


# Delete a restaurant (admin only - add auth later)
@router.delete("/{restaurant_id}")
def remove_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    deleted = delete_restaurant(db, restaurant_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return {"message": "Restaurant deleted successfully"}