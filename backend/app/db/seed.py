from sqlalchemy.orm import Session
from app.db.database import engine, SessionLocal
from app.db.base import Base

from app.models.restaurant import Restaurant
from app.models.menuitems import MenuItem

# Seed initial data into the database
def seed_data():

    # Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    # Restaurant
    restaurant = db.query(Restaurant).first()

    if not restaurant:
        restaurant = Restaurant(name="A")
        db.add(restaurant)
        db.commit()
        db.refresh(restaurant)
        print("Restaurant added")
    else:
        print("Restaurant already exists")

    # MenuItem
    if db.query(MenuItem).count() == 0:
        items = [
            MenuItem(
                name = "Spaghetti",
                description = "Classic spaghetti with tomato sauce and basil.",
                price = 25,
                category = "Mains",
                allergens = "Gluten, Dairy",
                is_available = True,
                restaurant_id = restaurant.id
            ),
            MenuItem(
                name = "Macarons",
                description = "Assorted French macarons in various flavors.",
                price = 20,
                category = "Desserts",
                allergens = "Tree nuts, Eggs, Dairy",
                is_available = True,
                restaurant_id = restaurant.id
            ),
            MenuItem(
                name = "Vanilla Latte",
                description = "Rich and creamy vanilla latte with steamed milk.",
                price = 18.5,
                category = "Drinks",
                allergens = "Dairy",
                is_available = True,
                restaurant_id = restaurant.id
            ),
            MenuItem(
                name = "Loaded Nachos",
                description = "Crispy nachos topped with cheese, jalapenos, and salsa.",
                price = 15,
                category = "Sides",
                allergens = "Gluten",
                is_available = True,
                restaurant_id = restaurant.id
            ),]
        
        db.add_all(items)
        db.commit()

        print("Menu items added")
    else:
        print("Menu items already exist, add something else thanks")

    db.close()
    print("Seeded")

# Run the seed function if this script is executed directly
if __name__ == "__main__":
    seed_data()
        
