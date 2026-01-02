#app/crud/restaurant.py
from sqlalchemy.orm import Session
from app.models.restaurant import Restaurant
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate

def get_all_restaurants(db: Session):
    return db.query(Restaurant).all()

def get_restaurant(db: Session, restaurant_id: int):
    return db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()

def create_restaurant(db: Session, restaurant: RestaurantCreate):
    db_restaurant = Restaurant(**restaurant.model_dump())
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

def update_restaurant(db: Session, restaurant_id: int, data: RestaurantUpdate):
    restaurant = get_restaurant(db, restaurant_id)
    if not restaurant:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    print(f"Update data: {update_data}")
    for key, value in update_data.items():
        setattr(restaurant, key, value)

    db.commit()
    db.refresh(restaurant)
    return restaurant

def delete_restaurant(db: Session, restaurant_id: int):
    restaurant = get_restaurant(db, restaurant_id)
    if not restaurant:
        return False
    
    db.delete(restaurant)
    db.commit()
    return True