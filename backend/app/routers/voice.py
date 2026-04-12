#app/routers/voice.py
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.voice_service import voice_service
from app.services.chat_handler import chat_handler
from app.services.translation_service import translation_service
from app.services.chatbot_service import chatbot_service
from app.crud import session as session_crud
from app.crud import selection as selection_crud
from app.models.menuitems import MenuItem
from app.models.selection import SelectionStatus
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
import base64
from app.crud import customer_profile
from app.core.dependencies import get_optional_customer
from app.models.customer import Customer
import re

router = APIRouter(prefix="/api/voice", tags=["voice"])

@router.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = "en"
):
    """Speech to Text - Upload audio file"""
    try:
        audio_data = await audio.read()
        result = voice_service.speech_to_text(audio_data, language)
        return result
    except Exception as e:
        return {"error": str(e), "success": False}

@router.post("/tts")
def text_to_speech(text: str, language: str = "en"):
    """Text to Speech - Convert text to audio"""
    result = voice_service.text_to_speech(text, language)
    return result

class VoiceChatRequest(BaseModel):
    audio_base64: Optional[str] = None
    text: Optional[str] = None
    session_id: str
    language: str = "en"
    allergies: Optional[List[str]] = None

@router.post("/chat")
async def voice_chat(request: VoiceChatRequest, db: Session = Depends(get_db),
                     current_customer: Optional[Customer] = Depends(get_optional_customer)):
    """
    Complete voice conversation flow
    
    1. Speech to text
    2. Process with chatbot (shared logic)
    3. Text to speech
    """
    try:
        merged_allergies = list(request.allergies or [])
        merged_dietary = []
        if current_customer:
            profile = customer_profile.get_customer_profile(db, current_customer.id)
            if profile:
                merged_allergies = list(set(merged_allergies + (profile.allergens or [])))
                merged_dietary = list(profile.dietary_preferences or [])

        # ===== 1. GET USER TEXT =====
        if request.audio_base64:
            audio_data = base64.b64decode(request.audio_base64)
            stt_result = voice_service.speech_to_text(
                audio_data,
                request.language
            )
            if not stt_result.get('success'):
                return {
                    "error": "Speech recognition failed",
                    "details": stt_result,
                    "success": False
                }
            user_text = stt_result['text']
        elif request.text:
            user_text = request.text
        else:
            raise HTTPException(
                status_code=400,
                detail="No input provided"
            )
        print(f"🎤 User said ({request.language}): {user_text}")
        
        # ===== 2. PROCESS CHAT (shared logic!) =====
        chat_result = chat_handler.process_chat(
            message=user_text,
            session_id=request.session_id,
            language=request.language,
            db=db,
            user_allergies=merged_allergies if merged_allergies else None,
            dietary_prefs=merged_dietary if merged_dietary else None
        )
        
        if chat_result.get('error'):
            return {
                "error": "Chat processing failed",
                "details": chat_result,
                "success": False
            }
        
        bot_text = chat_result['response']
        
        # ===== 3. TEXT TO SPEECH =====
        tts_result = voice_service.text_to_speech(bot_text, request.language)
        
        if not tts_result.get('success'):
            return {
                "error": "TTS failed",
                "details": tts_result,
                "success": False
            }
        
        # ===== 4. RETURN COMPLETE RESPONSE =====
        return {
            "user_text": user_text,
            "bot_text": bot_text,
            "bot_audio": tts_result['audio'],
            "audio_format": "mp3",
            "intent": chat_result['intent'],
            "items_added_to_cart": chat_result.get('items_added', []),
            "session_id": request.session_id,
            "language": request.language,
            "success": True
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "success": False
        }


class HandsFreeRequest(BaseModel):
    session_id: str
    language: str = "en"

@router.post("/handsfree/menu")
async def read_menu_handsfree(
    request: HandsFreeRequest,
    db: Session = Depends(get_db)
):
    """Read entire menu aloud for hands-free mode"""
    
    try:
        # Get session
        session = session_crud.get_session_by_id(db, request.session_id)
        if not session:
            return {
                "error": True,
                "text": "Session not found",
                "audio": None
            }
        
        # Get menu items
        menu_items = db.query(MenuItem).filter(
            MenuItem.restaurant_id == session.restaurant_id,
            MenuItem.is_available == True
        ).all()
        
        #List names first, then ask
        menu_text = "Here are our menu items: "
        
        item_names = []
        for item in menu_items:
            # Remove emojis for voice
            clean_name = re.sub(r'[^\w\s$.,]', '', item.name)
            item_names.append(f"{clean_name} for {item.price} dollars")
        
        menu_text += ", ".join(item_names) + ". "
        menu_text += "Which item would you like to know more about, or would you like to order something?"
        
        # Translate if needed
        if request.language != "en":
            translation_result = translation_service.translate_text(
                menu_text, 
                request.language,
                use_gemini=True
            )
            if translation_result.get("success"):
                menu_text = translation_result["translated_text"]
        
        # Convert to speech
        audio_base64 = voice_service.text_to_speech(menu_text, request.language)
        
        return {
            "text": menu_text,
            "audio": audio_base64,
            "error": False
        }
        
    except Exception as e:
        print(f"❌ Error in read_menu_handsfree: {e}")
        return {
            "error": True,
            "text": "Sorry, I couldn't load the menu",
            "audio": None
        }


@router.post("/handsfree/cart")
async def read_cart_handsfree(
    request: HandsFreeRequest,
    db: Session = Depends(get_db)
):
    """Read cart contents aloud for hands-free mode"""
    
    try:
        # Get selection/cart
        selection = selection_crud.get_selection_by_session(db, request.session_id)
        
        if not selection or not selection.items:
            text = "Your cart is empty. What would you like to order?"
        else:
            text = "You have ordered: "
            total = 0
            
            for sel_item in selection.items:
                item_name = re.sub(r'[^\w\s$.,]', '', sel_item.menu_item.name)
                price = sel_item.menu_item.price * sel_item.quantity
                
                text += f"{sel_item.quantity} {item_name}, ${price}. "
                total += price
            
            text += f"Total: ${total:.2f}. Say 'checkout' to place your order, or 'more' to add more items."
        
        # Translate if needed
        if request.language != "en":
            translation_result = translation_service.translate_text(
                text,
                request.language,
                use_gemini=True
            )
            if translation_result.get("success"):
                text = translation_result["translated_text"]
        
        # Convert to speech
        audio = voice_service.text_to_speech(text, request.language)
        
        return {
            "text": text,
            "audio": audio,
            "error": False
        }
        
    except Exception as e:
        print(f"❌ Error in read_cart_handsfree: {e}")
        return {
            "error": True,
            "text": "Sorry, I couldn't read your cart",
            "audio": None
        }



@router.post("/handsfree/checkout")
async def checkout_handsfree(
    request: HandsFreeRequest,
    db: Session = Depends(get_db)
):
    """Finalize order via voice for hands-free mode"""
    
    try:
        # Get selection
        selection = selection_crud.get_selection_by_session(db, request.session_id)
        
        if not selection or not selection.items:
            text = "Your cart is empty. Please add items before checking out."
        else:
            # Finalize order
            selection.status = SelectionStatus.FINALIZED
            selection.finalized_at = datetime.utcnow()
            db.commit()
            
            # Calculate total
            total = sum(
                item.menu_item.price * item.quantity 
                for item in selection.items
            )
            
            order_number = selection.id
            
            text = f"Order placed successfully! Your order number is {order_number}. Total amount: ${total:.2f}. A waiter will bring your order to your table shortly. Thank you!"
        
        # Translate if needed
        if request.language != "en":
            translation_result = translation_service.translate_text(
                text,
                request.language,
                use_gemini=True
            )
            if translation_result.get("success"):
                text = translation_result["translated_text"]
        
        # Convert to speech
        audio = voice_service.text_to_speech(text, request.language)
        
        return {
            "text": text,
            "audio": audio,
            "order_number": order_number if selection and selection.items else None,
            "error": False
        }
        
    except Exception as e:
        print(f"❌ Error in checkout_handsfree: {e}")
        return {
            "error": True,
            "text": "Sorry, I couldn't complete your checkout",
            "audio": None
        }