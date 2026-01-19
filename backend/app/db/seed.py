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

    # Seed Menu Items for each restaurant
    if db.query(MenuItem).count() == 0:
        menu_items = []
        
        # Menu items for first restaurant (Sauce Dinner - Fast Food)
        menu_items.extend([
            MenuItem(
                name="Classic Burger",
                description="Juicy beef patty with lettuce, tomato, cheese, and special sauce",
                price=12.99,
                category="mains",
                allergens="Gluten, Dairy, Eggs",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=999&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                restaurant_id=restaurants[0].id
            ),
            MenuItem(
                name="Chicken Wings",
                description="Crispy fried chicken wings tossed in buffalo sauce",
                price=10.99,
                category="mains",
                allergens="Gluten",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2hpY2tlbiUyMHdpbmdzfGVufDB8fDB8fHww",
                restaurant_id=restaurants[0].id
            ),
            MenuItem(
                name="French Fries",
                description="Crispy golden fries with sea salt",
                price=3.99,
                category="sides",
                allergens="None",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1518013431117-eb1465fa5752?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                restaurant_id=restaurants[0].id
            ),
            MenuItem(
                name="Onion Rings",
                description="Crispy battered onion rings",
                price=4.99,
                category="sides",
                allergens="Gluten",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1625938146369-adc83368bda7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8b25pb24lMjByaW5nc3xlbnwwfHwwfHx8MA%3D%3D",
                restaurant_id=restaurants[0].id
            ),
            MenuItem(
                name="Chocolate Shake",
                description="Rich and creamy chocolate milkshake",
                price=5.99,
                category="drinks",
                allergens="Dairy",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2hvY29sYXRlJTIwc2hha2V8ZW58MHx8MHx8fDA%3D",
                restaurant_id=restaurants[0].id
            ),
            MenuItem(
                name="Apple Pie",
                description="Warm apple pie with cinnamon and flaky crust",
                price=4.99,
                category="dessert",
                allergens="Gluten, Dairy",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1624299831638-82c15fcafd2b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXBwbGUlMjBwaWV8ZW58MHx8MHx8fDA%3D",
                restaurant_id=restaurants[0].id
            ),
        ])

        # Menu items for second restaurant (Desi Biryani - Indian)
        menu_items.extend([
            MenuItem(
                name="Chicken Biryani",
                description="Aromatic basmati rice with tender chicken and traditional spices",
                price=14.99,
                category="mains",
                allergens="Dairy",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop",
                restaurant_id=restaurants[1].id
            ),
            MenuItem(
                name="Butter Chicken",
                description="Creamy tomato-based curry with tender chicken pieces",
                price=13.99,
                category="mains",
                allergens="Dairy",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop",
                restaurant_id=restaurants[1].id
            ),
            MenuItem(
                name="Naan Bread",
                description="Soft and fluffy traditional Indian flatbread",
                price=2.99,
                category="sides",
                allergens="Gluten, Dairy",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1697155406014-04dc649b0953?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bmFhbiUyMGJyZWFkfGVufDB8fDB8fHww",
                restaurant_id=restaurants[1].id
            ),
            MenuItem(
                name="Samosas",
                description="Crispy pastry filled with spiced potatoes and peas",
                price=4.99,
                category="sides",
                allergens="Gluten",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
                restaurant_id=restaurants[1].id
            ),
            MenuItem(
                name="Mango Lassi",
                description="Sweet yogurt drink blended with fresh mango",
                price=4.99,
                category="drinks",
                allergens="Dairy",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=300&fit=crop",
                restaurant_id=restaurants[1].id
            ),
            MenuItem(
                name="Gulab Jamun",
                description="Sweet milk-solid dumplings in rose-flavored syrup",
                price=5.99,
                category="dessert",
                allergens="Dairy, Gluten",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amFtdW58ZW58MHx8MHx8fDA%3D",
                restaurant_id=restaurants[1].id
            ),
        ])

        # Menu items for third restaurant (Pizza Haven - Italian)
        menu_items.extend([
            MenuItem(
                name="Margherita Pizza",
                description="Classic pizza with fresh mozzarella, tomato sauce, and basil",
                price=11.99,
                category="mains",
                allergens="Gluten, Dairy",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
                restaurant_id=restaurants[4].id
            ),
            MenuItem(
                name="Spaghetti Carbonara",
                description="Creamy pasta with bacon, eggs, and parmesan cheese",
                price=13.99,
                category="mains",
                allergens="Gluten, Dairy, Eggs",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop",
                restaurant_id=restaurants[4].id
            ),
            MenuItem(
                name="Garlic Bread",
                description="Toasted bread with garlic butter and herbs",
                price=3.99,
                category="sides",
                allergens="Gluten, Dairy",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1598785244280-7a428600d053?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Z2FybGljJTIwYnJlYWR8ZW58MHx8MHx8fDA%3D",
                restaurant_id=restaurants[4].id
            ),
            MenuItem(
                name="Caesar Salad",
                description="Crisp romaine lettuce with parmesan and croutons",
                price=6.99,
                category="sides",
                allergens="Gluten, Dairy, Eggs",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
                restaurant_id=restaurants[4].id
            ),
            MenuItem(
                name="Italian Soda",
                description="Sparkling water with flavored syrup and cream",
                price=3.99,
                category="drinks",
                allergens="Dairy",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=300&fit=crop",
                restaurant_id=restaurants[4].id
            ),
            MenuItem(
                name="Tiramisu",
                description="Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
                price=6.99,
                category="dessert",
                allergens="Gluten, Dairy, Eggs",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1568627175730-73d05bd69ca9?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dGlyYW1pc3V8ZW58MHx8MHx8fDA%3D",
                restaurant_id=restaurants[4].id
            ),
        ])

        db.add_all(menu_items)
        db.commit()
        print(f"✅ {len(menu_items)} menu items added")
    else:
        print("ℹ️  Menu items already exist")

    db.close()
    print("✅ Database seeded successfully!")

if __name__ == "__main__":
    seed_data()