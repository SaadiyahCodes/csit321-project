# app/routers/translation.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.translation_service import translation_service
from app.models.menuitems import MenuItem
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/translate", tags=["translation"])

class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: str = "en"

class MenuItemTranslate(BaseModel):
    id: int
    name: str
    description: str
    ingredients: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    allergens: Optional[List[str]] = []

class BatchTranslateRequest(BaseModel):
    items: List[MenuItemTranslate]
    target_lang: str
    source_lang: str = "en"

class UIBatchTranslateRequest(BaseModel):
    texts: List[str]
    target_lang: str

@router.post("/text")
def translate_text(req: TranslateRequest):
    """Single text translation"""
    return translation_service.translate_text(
        req.text,
        req.target_lang,
        req.source_lang,
        use_gemini=False
    )

@router.post("/menu")
def translate_menu_batch(req: BatchTranslateRequest):
    """Batch translate menu items"""
    items_dict = [item.dict() for item in req.items]
    translated = translation_service.translate_batch(items_dict, req.target_lang)
    
    return {
        "items": translated,
        "target_lang": req.target_lang,
        "count": len(translated)
    }

@router.get("/menu/{restaurant_id}/{lang}")
def get_translated_menu(restaurant_id: int, lang: str, db: Session = Depends(get_db)):
    """Get restaurant menu translated to specific language"""
    
    # Fetch real menu items from database
    menu_items = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id
    ).all()
    
    # Convert to dict format
    items_dict = [
        {
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": float(item.price),
            "category": item.category,
            "allergens": item.allergens or [],
            "ingredients": item.ingredients or "",
            "image_url": item.image_url,
            "is_available": item.is_available,
            "calories": item.calories,
            "ar_model_url": item.ar_model_url,
        }
        for item in menu_items
    ]
    
    # Translate
    translated = translation_service.translate_batch(items_dict, lang)
    
    return {
        "restaurant_id": restaurant_id,
        "language": lang,
        "items": translated,
        "count": len(translated)
    }

@router.get("/cache/stats")
def cache_stats():
    """Get translation cache statistics"""
    return translation_service.get_cache_stats()

@router.delete("/cache/clear")
def clear_cache():
    """Clear translation cache"""
    translation_service.clear_cache()
    return {"message": "Cache cleared"}

@router.post("/batch-ui")
def translate_ui_batch(req: UIBatchTranslateRequest):
    """Batch translate plain UI strings (not menu items)"""
    results = {}
    for text in req.texts:
        if not text or not text.strip():
            continue
        result = translation_service.translate_text(
            text, req.target_lang, use_gemini=False
        )
        if result.get("success"):
            results[text] = result["translated_text"]
        else:
            results[text] = text  # fallback to original
    return {"translations": results, "target_lang": req.target_lang}