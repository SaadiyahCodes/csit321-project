#app/routers/chatbot.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.chat_handler import chat_handler
from app.services.chatbot_service import chatbot_service
from app.crud import session as session_crud
from app.schemas.chatbot import ChatRequest, ChatResponse, ChatHistoryResponse

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_bot(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with AI assistant
    
    Example:
    {
        "message": "أريد شيئًا حارًا",  // I want something spicy
        "session_id": "abc123",
        "language": "ar",
        "allergies": ["peanuts"]
    }
    """
    
    # Use shared chat handler
    result = chat_handler.process_chat(
        message=request.message,
        session_id=request.session_id,
        language=request.language,
        db=db,
        user_allergies=request.allergies
    )
    
    return ChatResponse(
        response=result["response"],
        intent=result["intent"],
        session_id=result["session_id"],
        original_message=result.get("original_message"),
        translated=result.get("translated", False),
        error=result.get("error", False)
    )

@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    """Get conversation history for a session"""
    
    session = session_crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = chatbot_service.get_conversation_history(session_id)
    
    return ChatHistoryResponse(
        session_id=session_id,
        messages=history,
        count=len(history)
    )

@router.delete("/clear/{session_id}")
def clear_chat_history(session_id: str, db: Session = Depends(get_db)):
    """Clear conversation history"""
    
    session = session_crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    chatbot_service.clear_conversation(session_id)
    
    return {
        "message": "Conversation cleared",
        "session_id": session_id
    }