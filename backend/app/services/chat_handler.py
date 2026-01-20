#app/services/chat_handler.py
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from app.services.chatbot_service import chatbot_service
from app.services.translation_service import translation_service
from app.crud import session as session_crud
from app.crud import selection as selection_crud

class ChatHandler:
    """Shared logic for text and voice chat"""
    
    @staticmethod
    def process_chat(
        message: str,
        session_id: str,
        language: str,
        db: Session,
        user_allergies: Optional[List[str]] = None
    ) -> Dict:
        """
        Complete chat processing with translation and auto-cart
        
        Returns:
        {
            "response": "translated bot response",
            "intent": {...},
            "session_id": "...",
            "original_message": "...",  # If translated
            "translated": bool,
            "items_added": ["item1", "item2"],
            "error": False
        }
        """
        
        # ===== 1. VERIFY SESSION =====
        session = session_crud.get_session_by_id(db, session_id)
        if not session:
            return {
                "response": f"Session '{session_id}' not found. Please create a session first.",
                "intent": {"type": "error"},
                "session_id": session_id,
                "error": True
            }
        
        # ===== 2. TRANSLATE TO ENGLISH (if needed) =====
        original_message = None
        message_to_process = message
        
        if language != "en":
            translation_result = translation_service.translate_text(
                text=message,
                target_lang="en",
                source_lang=language
            )
            
            if translation_result.get("success"):
                message_to_process = translation_result["translated_text"]
                original_message = message
                print(f"📝 Translated '{message}' → '{message_to_process}'")
            else:
                print(f"⚠️ Translation failed, using original message")
        
        # ===== 3. CHATBOT PROCESSING =====
        result = chatbot_service.chat(
            message=message_to_process,
            session_id=session_id,
            db=db,
            restaurant_id=session.restaurant_id,
            user_allergies=user_allergies
        )
        
        if result.get("error"):
            return {
                "response": result["response"],
                "intent": {"type": "error"},
                "session_id": session_id,
                "error": True
            }
        
        # ===== 4. TRANSLATE BACK (if needed) =====
        response_text = result["response"]
        translated = False
        
        if language != "en":
            translation_result = translation_service.translate_text(
                text=response_text,
                target_lang=language,
                source_lang="en"
            )
            
            if translation_result.get("success"):
                response_text = translation_result["translated_text"]
                translated = True
                print(f"📝 Translated bot response to {language}")
            else:
                print(f"⚠️ Translation failed, using English response")
        
        # ===== 5. AUTO-ADD TO CART (if confirmed) =====
        items_added = []
        
        if result["intent"].get("should_add") and result["intent"].get("items"):
            try:
                selection = selection_crud.get_or_create_selection(db, session_id)
                
                for item in result["intent"]["items"]:
                    selection_crud.add_item_to_selection(
                        db=db,
                        selection=selection,
                        menu_item_id=item["id"],
                        quantity=1,
                        notes="Added by chatbot"
                    )
                    items_added.append(item['name'])
                
                print(f"✅ Auto-added {len(items_added)} items to cart")
                
            except Exception as e:
                print(f"⚠️ Failed to auto-add to cart: {e}")
                # Don't fail the whole request, just log it
        
        # ===== 6. RETURN COMPLETE RESULT =====
        return {
            "response": response_text,
            "intent": result["intent"],
            "session_id": session_id,
            "original_message": original_message,
            "translated": translated,
            "items_added": items_added,
            "error": False
        }

chat_handler = ChatHandler()