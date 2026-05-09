# app/routers/chatbot_landing.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.chatbot_landing import ChatbotLandingRequest, ChatbotLandingResponse
from app.services.chatbot_service_landing import chatbot_service_landing
from app.services.translation_service import translation_service

router = APIRouter(prefix="/api/landing", tags=["landing-chatbot"])

@router.post("/chat", response_model=ChatbotLandingResponse)
def landing_chat(request: ChatbotLandingRequest, db: Session = Depends(get_db)):
    message = request.message
    original_message = None
    translated = False

    # If message is not in English, translate it first
    if request.language != "en":
        result = translation_service.translate_text(
            text = message,  
            target_lang = "en",
            source_lang = request.language,
            use_gemini = False,
        )
        if result.get("success"):
            original_message = message
            message = result["translated_text"]

    # Core chat
    result = chatbot_service_landing.chat(
        message=message,
        conversation_id=request.conversation_id,
        db=db,
    )

    response_text = result["response"]

    # Translate response back if needed
    if request.language != "en" and not result.get("error"):
        tr = translation_service.translate_text(
            text=response_text,
            target_lang=request.language,
            source_lang="en",
            use_gemini=True,
        )
        if tr.get("success"):
            response_text = tr["translated_text"]
            translated = True

    return ChatbotLandingResponse(
        response=response_text,
        conversation_id=request.conversation_id,
        suggested_restaurants=result.get("suggested_restaurants", []),
        original_message=original_message,
        translated=translated,
        error=result.get("error", False),
    )

@router.delete("/chat/{conversation_id}")
def delete_conversation(conversation_id: str):
    # Clear conversation history for a given conversation_id
    chatbot_service_landing.clear_conversation(conversation_id)
    return {"message": "Conversation cleared", "conversation_id": conversation_id}

@router.get("/debug/rag")
def debug_rag(q: str, db: Session = Depends(get_db)):
    """Test endpoint — remove before submission."""
    items, restaurant_ids = chatbot_service_landing.query_menu_rag(q)
    return {
        "query": q,
        "pinecone_connected": chatbot_service_landing.pinecone_index is not None,
        "matched_items": items,
        "matched_restaurant_ids": restaurant_ids,
        "rag_working": len(items) > 0,
    }