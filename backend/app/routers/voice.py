#app/routers/voice.py
from fastapi import APIRouter, File, UploadFile, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.voice_service import voice_service
from app.services.chat_handler import chat_handler
from pydantic import BaseModel
from typing import Optional, List
import base64
from app.crud import customer_profile
from app.core.dependencies import get_optional_customer
from app.models.customer import Customer

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
    audio_base64: str
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

        # ===== 1. SPEECH TO TEXT =====
        audio_data = base64.b64decode(request.audio_base64)
        stt_result = voice_service.speech_to_text(audio_data, request.language)
        
        if not stt_result.get('success'):
            return {
                "error": "Speech recognition failed",
                "details": stt_result,
                "success": False
            }
        
        user_text = stt_result['text']
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