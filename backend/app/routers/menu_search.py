# app/routers/menu_search.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.menu_rag import MenuRAG
from app.models.menuitems import MenuItem
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/menu", tags=["menu-search"])

class MenuSearchRequest(BaseModel):
    keywords: List[str]
    allergies: Optional[List[str]] = None
    category: Optional[str] = None
    max_price: Optional[float] = None

@router.post("/search")
def search_menu(request: MenuSearchRequest, db: Session = Depends(get_db)):
    """
    Smart menu search using RAG
    
    Example:
    {
        "keywords": ["spicy", "chicken"],
        "allergies": ["dairy"],
        "max_price": 50
    }
    """
    
    # Get all menu items (or filter by restaurant_id if needed)
    menu_items_db = db.query(MenuItem).all()
    
    # Convert to dict format for RAG
    menu_items = [
        {
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": float(item.price),
            "category": item.category or "other",
            "allergens": item.allergens or [],
            "ingredients": item.ingredients or ""
        }
        for item in menu_items_db
    ]
    
    # Use RAG to search
    rag = MenuRAG(menu_items)
    results = rag.search_by_keywords(
        keywords=request.keywords,
        exclude_allergens=request.allergies
    )
    
    # Filter by category if specified
    if request.category:
        results = [item for item in results if item.get('category') == request.category]
    
    # Filter by price if specified
    if request.max_price:
        results = [item for item in results if item.get('price', 0) <= request.max_price]
    
    return {
        "query": {
            "keywords": request.keywords,
            "allergies": request.allergies,
            "category": request.category,
            "max_price": request.max_price
        },
        "results": results[:10],
        "count": len(results)
    }

@router.get("/safe/{restaurant_id}/{allergies}")
def get_safe_menu(restaurant_id: int, allergies: str, db: Session = Depends(get_db)):
    """
    Get dishes safe for specific allergies
    
    Example: /api/menu/safe/1/dairy,peanuts
    """
    
    # Get menu items for restaurant
    menu_items_db = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id
    ).all()
    
    # Convert to dict
    menu_items = [
        {
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": float(item.price),
            "category": item.category or "other",
            "allergens": item.allergens or [],
            "ingredients": item.ingredients or ""
        }
        for item in menu_items_db
    ]
    
    # Find safe items
    rag = MenuRAG(menu_items)
    allergen_list = [a.strip() for a in allergies.split(',')]
    safe_items = rag.get_safe_items(exclude_allergens=allergen_list)
    
    return {
        "restaurant_id": restaurant_id,
        "avoid_allergens": allergen_list,
        "safe_dishes": safe_items,
        "count": len(safe_items)
    }