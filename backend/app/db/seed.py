#backend/app/db/seed.py
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

    # Seed Restaurants
    if db.query(Restaurant).count() == 0:
        restaurants = [
            Restaurant(
                name="Sauce Dinner",
                category="Fast Food",
                rating=4.0,
                image="https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=300&h=150&fit=crop&auto=format"
            ),
            Restaurant(
                name="Desi Biryani",
                category="Indian",
                rating=3.5,
                image="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=150&fit=crop"
            ),
            Restaurant(
                name="PF Chang's",
                category="Chinese",
                rating=3.9,
                image="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=150&fit=crop"
            ),
            Restaurant(
                name="Nando's",
                category="Grill",
                rating=3.9,
                image="https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300&h=150&fit=crop"
            ),
            Restaurant(
                name="Pizza Haven",
                category="Italian",
                rating=4.1,
                image="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=150&fit=crop"
            ),
            Restaurant(
                name="Sushi Zen",
                category="Japanese",
                rating=4.3,
                image="https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=150&fit=crop"
            ),
            Restaurant(
                name="Taco Fiesta",
                category="Mexican",
                rating=4.0,
                image="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=150&fit=crop"
            ),
            Restaurant(
                name="Seafood Cove",
                category="Seafood",
                rating=4.3,
                image="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=150&fit=crop"
            ),
        ]
        
        db.add_all(restaurants)
        db.commit()
        print(f"{len(restaurants)} restaurants added")
    else:
        print("Restaurants already exist")

    # Get first restaurant for menu items
    restaurant = db.query(Restaurant).first()

    # Seed Menu Items (for the first restaurant)
    if db.query(MenuItem).count() == 0:
        items = [
            MenuItem(
                name="Spaghetti",
                description="Classic spaghetti with tomato sauce and basil.",
                price=25,
                category="Mains",
                allergens="Gluten, Dairy",
                is_available=True,
                restaurant_id=restaurant.id
            ),
            MenuItem(
                name="Macarons",
                description="Assorted French macarons in various flavors.",
                price=20,
                category="Desserts",
                allergens="Tree nuts, Eggs, Dairy",
                is_available=True,
                restaurant_id=restaurant.id
            ),
            MenuItem(
                name="Vanilla Latte",
                description="Rich and creamy vanilla latte with steamed milk.",
                price=18.5,
                category="Drinks",
                allergens="Dairy",
                is_available=True,
                restaurant_id=restaurant.id
            ),
            MenuItem(
                name="Loaded Nachos",
                description="Crispy nachos topped with cheese, jalapenos, and salsa.",
                price=15,
                category="Sides",
                allergens="Gluten",
                is_available=True,
                restaurant_id=restaurant.id
            ),
        ]
        
        db.add_all(items)
        db.commit()
        print(f"{len(items)} menu items added")
    else:
        print("Menu items already exist")

    db.close()
    print("✅ Database seeded successfully!")

# Run the seed function if this script is executed directly
if __name__ == "__main__":
    seed_data()
        
