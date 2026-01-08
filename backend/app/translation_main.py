from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from app.chatbot_service import chatbot_service
from app.mock_data import get_mock_menu
import uuid
from app.menu_rag import MenuRAG
from app.order_service import order_service
from app.voice_service import voice_service
from fastapi import File, UploadFile
import base64

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
    intent_meta: Optional[dict] = None
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
        intent=result["intent"]["type"],
        intent_meta=result["intent"],
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


# ===== MENU SEARCH ENDPOINTS =====

class MenuSearchRequest(BaseModel):
    keywords: List[str]
    allergies: Optional[List[str]] = None
    category: Optional[str] = None
    max_price: Optional[float] = None

@app.post("/api/menu/search")
def search_menu(request: MenuSearchRequest):
    """
    Smart menu search
    
    Example:
    {
        "keywords": ["spicy", "chicken"],
        "allergies": ["dairy"],
        "max_price": 50
    }
    """
    menu_items = get_mock_menu()
    rag = MenuRAG(menu_items)
    
    # Search by keywords
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
        "results": results[:10],  # Top 10 results
        "count": len(results)
    }

@app.get("/api/menu/safe/{allergies}")
def get_safe_menu(allergies: str):
    """
    Get dishes safe for specific allergies
    
    Example: /api/menu/safe/dairy,peanuts
    """
    menu_items = get_mock_menu()
    rag = MenuRAG(menu_items)
    
    allergen_list = [a.strip() for a in allergies.split(',')]
    safe_items = rag.get_safe_items(exclude_allergens=allergen_list)
    
    return {
        "avoid_allergens": allergen_list,
        "safe_dishes": safe_items,
        "count": len(safe_items)
    }


# ===== ORDER MANAGEMENT ENDPOINTS =====

class AddToCartRequest(BaseModel):
    session_id: str
    item_id: int
    quantity: int = 1
    notes: Optional[str] = None

@app.post("/api/order/add")
def add_to_cart(request: AddToCartRequest):
    """
    Add item to cart (called when chatbot confirms order)
    
    Example:
    {
        "session_id": "abc123",
        "item_id": 1,
        "quantity": 2,
        "notes": "Extra spicy please"
    }
    """
    # Get menu item
    menu_items = get_mock_menu()
    item = next((i for i in menu_items if i['id'] == request.item_id), None)
    
    if not item:
        return {"error": "Item not found"}
    
    # Add to order
    order = order_service.add_item(
        session_id=request.session_id,
        item=item,
        quantity=request.quantity,
        notes=request.notes
    )
    
    return {
        "success": True,
        "order": order,
        "message": f"Added {request.quantity}x {item['name']} to cart"
    }

@app.get("/api/order/{session_id}")
def get_order(session_id: str):
    """Get current order for session"""
    order = order_service.get_order(session_id)
    
    if not order:
        return {
            "session_id": session_id,
            "items": [],
            "total": 0.0,
            "message": "No order found"
        }
    
    return order

@app.delete("/api/order/{session_id}/item/{item_id}")
def remove_from_cart(session_id: str, item_id: int):
    """Remove item from cart"""
    order = order_service.remove_item(session_id, item_id)
    return {
        "success": True,
        "order": order,
        "message": "Item removed"
    }

@app.delete("/api/order/{session_id}")
def clear_cart(session_id: str):
    """Clear entire cart"""
    order_service.clear_order(session_id)
    return {
        "success": True,
        "message": "Cart cleared"
    }

@app.get("/api/order/{session_id}/summary")
def get_order_summary(session_id: str):
    """Get formatted order summary"""
    summary = order_service.get_order_summary(session_id)
    order = order_service.get_order(session_id)
    
    return {
        "session_id": session_id,
        "summary": summary,
        "order": order
    }


# ===== VOICE ENDPOINTS (STT/TTS) =====

@app.post("/api/voice/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = "en"
):
    """
    Speech to Text
    
    Upload audio file and get text transcription
    Supports: WAV, FLAC, MP3
    """
    try:
        # Read audio file
        audio_data = await audio.read()
        
        # Convert to text
        result = voice_service.speech_to_text(audio_data, language)
        
        return result
        
    except Exception as e:
        return {
            "error": str(e),
            "success": False
        }

@app.post("/api/voice/tts")
def text_to_speech(
    text: str,
    language: str = "en"
):
    """
    Text to Speech
    
    Convert text to audio (returns base64 encoded MP3)
    
    Example: POST /api/voice/tts?text=Hello&language=en
    """
    result = voice_service.text_to_speech(text, language)
    return result

class VoiceChatRequest(BaseModel):
    audio_base64: str  # Base64 encoded audio
    session_id: Optional[str] = None
    language: str = "en"
    allergies: Optional[List[str]] = None

@app.post("/api/voice/chat")
async def voice_chat(request: VoiceChatRequest):
    """
    Complete voice conversation flow
    
    1. Receive audio (base64)
    2. Convert to text (STT)
    3. Process with chatbot
    4. Convert response to speech (TTS)
    5. Return audio response (base64)
    """
    try:
        # Decode audio
        audio_data = base64.b64decode(request.audio_base64)
        
        # Speech to Text
        stt_result = voice_service.speech_to_text(audio_data, request.language)
        
        if not stt_result.get('success'):
            return {"error": "Speech recognition failed", "details": stt_result}
        
        user_text = stt_result['text']
        
        # Process with chatbot (reuse existing chat endpoint logic)
        session_id = request.session_id or str(uuid.uuid4())
        menu_items = get_mock_menu()
        
        # Translate to English if needed
        if request.language != "en":
            trans_result = translation_service.translate_text(
                user_text, "en", request.language
            )
            if trans_result.get('success'):
                user_text = trans_result['translated_text']
        
        # Get chatbot response
        chat_result = chatbot_service.chat(
            message=user_text,
            session_id=session_id,
            menu_items=menu_items,
            user_allergies=request.allergies
        )
        
        if chat_result.get('error'):
            return {"error": "Chatbot error", "details": chat_result}
        
        bot_text = chat_result['response']
        
        # Translate back if needed
        if request.language != "en":
            trans_result = translation_service.translate_text(
                bot_text, request.language, "en"
            )
            if trans_result.get('success'):
                bot_text = trans_result['translated_text']
        
        # Text to Speech
        tts_result = voice_service.text_to_speech(bot_text, request.language)
        
        if not tts_result.get('success'):
            return {"error": "TTS failed", "details": tts_result}
        
        return {
            "user_text": stt_result['text'],
            "bot_text": bot_text,
            "bot_audio": tts_result['audio'],
            "audio_format": "mp3",
            "intent": chat_result['intent'],
            "session_id": session_id,
            "success": True
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "success": False
        }