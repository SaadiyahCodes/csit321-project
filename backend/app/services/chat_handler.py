#app/services/chat_handler.py
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from app.services.chatbot_service import chatbot_service
from app.services.translation_service import translation_service
from app.crud import session as session_crud
from app.crud import selection as selection_crud
from app.models.chat_history import ChatHistory, IntentType
from app.models.chatbot_order import ChatbotOrder

class ChatHandler:
    """Shared logic for text and voice chat"""
    
    @staticmethod
    def process_chat(
        message: str,
        session_id: str,
        language: str,
        db: Session,
        user_allergies: Optional[List[str]] = None,
        dietary_prefs: Optional[List[str]] = None
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
                source_lang=language,
                use_gemini=False
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
            user_allergies=user_allergies,
            dietary_prefs=dietary_prefs
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
                source_lang="en",
                use_gemini=True
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
                    quantity = item.get("quantity", 1)
                    notes = item.get("notes", "") or "Added by chatbot"

                    selection_crud.add_item_to_selection(
                        db=db,
                        selection=selection,
                        menu_item_id=item["id"],
                        quantity=quantity,
                        notes=notes
                    )
                    items_added.append(f"{quantity}x {item['name']}")

                    chatbot_order = ChatbotOrder(
                        session_id=session_id,
                        menu_item_id=item["id"],
                        quantity=quantity,
                        notes=notes
                    )
                    db.add(chatbot_order)
                db.commit()
                print(f"✅ Auto-added {len(items_added)} items to cart: {items_added}")
                
            except Exception as e:
                print(f"⚠️ Failed to auto-add to cart: {e}")

        # ===== 5.5. HANDLE HANDS-FREE INTENTS (NEW!) =====
        
        # Handle read menu intent
        if result["intent"].get("type") == "read_menu":
            # Frontend will detect this and call /handsfree/menu
            pass
        
        # Handle read cart intent
        if result["intent"].get("type") == "read_cart":
            # Frontend will detect this and call /handsfree/cart
            pass
        
        # Handle checkout intent
        if result["intent"].get("should_finalize"):
            try:
                from app.models.selection import SelectionStatus
                from datetime import datetime
                
                selection = selection_crud.get_selection_by_session(db, session_id)
                if selection and selection.items:
                    selection.status = SelectionStatus.FINALIZED
                    selection.finalized_at = datetime.utcnow()
                    db.commit()
                    
                    total = sum(
                        item.menu_item.price * item.quantity 
                        for item in selection.items
                    )
                    
                    # Override response with checkout confirmation
                    response_text = f"Order placed! Your order number is {selection.id}. Total: ${total:.2f}. A waiter will bring it to you shortly."
                    
                    # Translate if needed
                    if language != "en":
                        translation_result = translation_service.translate_text(
                            response_text,
                            language,
                            use_gemini=True
                        )
                        if translation_result.get("success"):
                            response_text = translation_result["translated_text"]
                
            except Exception as e:
                print(f"⚠️ Checkout failed: {e}")
        
        # ===== 6. RETURN COMPLETE RESULT & SAVE TO DB =====

        try:
            # Map intent type string to enum, fallback to GENERAL
            intent_type_map = {
                "order_confirmation": IntentType.ORDER_CONFIRMATION,
                "menu_inquiry": IntentType.INQUIRY,
                "order_intent": IntentType.INQUIRY,
            }
            intent_str = result.get("intent", {}).get("type", "general")
            intent_enum = intent_type_map.get(intent_str, IntentType.GENERAL)

            print(f"🧪 Extracted preferences: {result.get('extracted_preferences')}")

            # Save user message in English
            user_msg = ChatHistory(
                session_id=session_id,
                role="user",
                content=message_to_process,
                intent=intent_enum,
                extracted_allergens=result.get("extracted_preferences", {}).get("allergies") or None
            )
            db.add(user_msg)

            # Save assistant response in English
            assistant_msg = ChatHistory(
                session_id=session_id,
                role="assistant",
                content=result["response"],  # translated response
                intent=None,
                items_rejected_count=len(result.get("intent", {}).get("items_rejected", []))
            )
            db.add(assistant_msg)

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"⚠️ Failed to save chat history to DB: {e}")
            #Request will not be failed, analytics data loss is non-critical

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