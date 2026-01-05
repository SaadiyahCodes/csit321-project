from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from app.chatbot_service import chatbot_service
from app.mock_data import get_mock_menu
import uuid

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


# ===== CHATBOT ENDPOINTS =====

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "en"
    allergies: Optional[List[str]] = None

class ChatResponse(BaseModel):
    response: str
    intent: str
    session_id: str
    original_message: Optional[str] = None
    translated: bool = False

@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """
    Chat with Gusto AI assistant
    
    Example:
    {
        "message": "I want something spicy",
        "session_id": "abc123",  // optional, will create if not provided
        "language": "en",
        "allergies": ["peanuts"]
    }
    """
    
    # Generate session ID if not provided
    session_id = request.session_id or str(uuid.uuid4())
    
    # Get menu
    menu_items = get_mock_menu()
    
    # Translate message to English if needed
    original_message = None
    message_to_process = request.message
    
    if request.language != "en":
        # Translate to English for AI processing
        translation_result = translation_service.translate_text(
            request.message,
            target_lang="en",
            source_lang=request.language
        )
        if translation_result.get("success"):
            message_to_process = translation_result["translated_text"]
            original_message = request.message
    
    # Get AI response
    result = chatbot_service.chat(
        message=message_to_process,
        session_id=session_id,
        menu_items=menu_items,
        user_allergies=request.allergies
    )
    
    if result.get("error"):
        return ChatResponse(
            response=result["response"],
            intent="error",
            session_id=session_id
        )
    
    # Translate response back to user's language if needed
    response_text = result["response"]
    translated = False
    
    if request.language != "en":
        translation_result = translation_service.translate_text(
            response_text,
            target_lang=request.language,
            source_lang="en"
        )
        if translation_result.get("success"):
            response_text = translation_result["translated_text"]
            translated = True
    
    return ChatResponse(
        response=response_text,
        intent=result["intent"],
        session_id=session_id,
        original_message=original_message,
        translated=translated
    )

@app.get("/api/chat/history/{session_id}")
def get_chat_history(session_id: str):
    """Get conversation history for a session"""
    history = chatbot_service.get_conversation_history(session_id)
    return {
        "session_id": session_id,
        "messages": history,
        "count": len(history)
    }

@app.delete("/api/chat/clear/{session_id}")
def clear_chat(session_id: str):
    """Clear conversation history"""
    chatbot_service.clear_conversation(session_id)
    return {"message": "Conversation cleared", "session_id": session_id}