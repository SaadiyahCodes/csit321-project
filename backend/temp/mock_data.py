# Mock menu data (until Manisha's DB is ready)
MOCK_MENU_ITEMS = [
    {
        "id": 1,
        "name": "Spicy Chicken Tikka",
        "description": "Grilled chicken marinated in spicy yogurt sauce with aromatic herbs",
        "ingredients": "chicken, yogurt, spices, lemon, garlic",
        "price": 45.00,
        "category": "mains",
        "allergens": ["dairy"],
        "image_url": "https://example.com/chicken-tikka.jpg"
    },
    {
        "id": 2,
        "name": "Vegetable Biryani",
        "description": "Fragrant basmati rice with mixed vegetables and aromatic spices",
        "ingredients": "rice, vegetables, spices, saffron",
        "price": 35.00,
        "category": "mains",
        "allergens": [],
        "image_url": "https://example.com/biryani.jpg"
    },
    {
        "id": 3,
        "name": "Mango Lassi",
        "description": "Sweet yogurt drink blended with fresh mango pulp",
        "ingredients": "yogurt, mango, sugar, cardamom",
        "price": 15.00,
        "category": "drinks",
        "allergens": ["dairy"],
        "image_url": "https://example.com/lassi.jpg"
    },
    {
        "id": 4,
        "name": "Lamb Seekh Kebab",
        "description": "Succulent minced lamb grilled with traditional spices",
        "ingredients": "lamb, onions, herbs, spices",
        "price": 55.00,
        "category": "mains",
        "allergens": [],
        "image_url": "https://example.com/kebab.jpg"
    },
    {
        "id": 5,
        "name": "Garlic Naan",
        "description": "Fresh baked flatbread topped with garlic and butter",
        "ingredients": "flour, garlic, butter, yeast",
        "price": 8.00,
        "category": "sides",
        "allergens": ["gluten", "dairy"],
        "image_url": "https://example.com/naan.jpg"
    },
    {
        "id": 6,
        "name": "Paneer Tikka",
        "description": "Grilled cottage cheese cubes in spicy marinade",
        "ingredients": "paneer, spices, yogurt, bell peppers",
        "price": 38.00,
        "category": "appetizers",
        "allergens": ["dairy"],
        "image_url": "https://example.com/paneer.jpg"
    },
    {
        "id": 7,
        "name": "Masala Chai",
        "description": "Traditional Indian spiced tea with milk",
        "ingredients": "tea, milk, spices, sugar",
        "price": 10.00,
        "category": "drinks",
        "allergens": ["dairy"],
        "image_url": "https://example.com/chai.jpg"
    },
    {
        "id": 8,
        "name": "Butter Chicken",
        "description": "Tender chicken in rich creamy tomato sauce",
        "ingredients": "chicken, butter, cream, tomatoes, spices",
        "price": 48.00,
        "category": "mains",
        "allergens": ["dairy"],
        "image_url": "https://example.com/butter-chicken.jpg"
    }
]

def get_mock_menu():
    """Return mock menu items"""
    return MOCK_MENU_ITEMS