from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

from app.translation_service import translation_service
from app.mock_data import get_mock_menu

app = FastAPI(
    title="Gusto API",
    version="2.0.0",
    description="Multilingual Restaurant Assistant - Sprint 1 & 2"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== REQUEST MODELS =====
class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: str = "en"

class MenuItemModel(BaseModel):
    id: int
    name: str
    description: str
    ingredients: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    allergens: Optional[List[str]] = []
    image_url: Optional[str] = None

class BatchTranslateRequest(BaseModel):
    items: List[MenuItemModel]
    target_lang: str
    source_lang: str = "en"

# ===== ROOT =====
@app.get("/")
def root():
    return {
        "service": "Gusto API",
        "version": "2.0.0",
        "status": "operational",
        "sprints": ["Sprint 1: Basic Translation", "Sprint 2: Batch & Caching"],
        "translation_ready": translation_service.translate_client is not None
    }

@app.get("/api/health")
def health():
    cache_stats = translation_service.get_cache_stats()
    return {
        "status": "healthy",
        "translation": translation_service.translate_client is not None,
        "cache": cache_stats
    }

# ===== SPRINT 1: BASIC TRANSLATION =====
@app.post("/api/translate/text")
def translate_text(req: TranslateRequest):
    """Single text translation (Sprint 1)"""
    return translation_service.translate_text(
        req.text,
        req.target_lang,
        req.source_lang
    )

# ===== SPRINT 2: BATCH TRANSLATION =====
@app.post("/api/translate/menu")
def translate_menu_batch(req: BatchTranslateRequest):
    """Batch translate menu items (Sprint 2)"""
    items_dict = [item.dict() for item in req.items]
    translated = translation_service.translate_batch(items_dict, req.target_lang)
    
    return {
        "items": translated,
        "target_lang": req.target_lang,
        "count": len(translated)
    }

@app.get("/api/menu")
def get_menu():
    """Get menu in English (mock data)"""
    items = get_mock_menu()
    return {
        "language": "en",
        "items": items,
        "count": len(items),
        "note": "Mock data - will connect to real DB later"
    }

@app.get("/api/menu/translated/{lang}")
def get_translated_menu(lang: str):
    """Get pre-translated menu (Sprint 2)"""
    items = get_mock_menu()
    translated = translation_service.translate_batch(items, lang)
    
    return {
        "language": lang,
        "items": translated,
        "count": len(translated),
        "note": "Mock data - will connect to real DB later"
    }

# ===== CACHE MANAGEMENT =====
@app.get("/api/cache/stats")
def cache_stats():
    """Get cache statistics"""
    return translation_service.get_cache_stats()

@app.delete("/api/cache/clear")
def clear_cache():
    """Clear translation cache"""
    translation_service.clear_cache()
    return {"message": "Cache cleared"}

# ===== TEST ENDPOINT =====
@app.get("/api/test")
def test():
    return {
        "status": "working",
        "message": "All systems operational",
        "team": "CSIT321",
        "developer": "Sadhguna"
    }