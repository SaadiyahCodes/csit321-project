from google import genai
import os
from typing import Dict, List
from datetime import datetime
from dotenv import load_dotenv
from app.menu_rag import MenuRAG

load_dotenv()


class ChatbotService:
    def __init__(self):
        """Initialize Gemini AI"""
        api_key = os.getenv('GEMINI_API_KEY')
        
        if api_key:
            self.client = genai.Client(api_key=api_key)
            self.model_name = 'models/gemini-flash-latest'  # ← CHANGE THIS!
            self.enabled = True
            print("✅ Chatbot service initialized (Gemini)")
        else:
            self.enabled = False
            print("⚠️ Gemini API key not found")
        
        # Conversation memory
        self.conversations = {}
    
    def get_system_prompt(self, menu_items: List[Dict], user_allergies: List[str] = None) -> str:
        """Create system prompt with menu context"""
        
        # Format menu for AI
        menu_text = "\n".join([
            f"- {item['name']}: {item['description']} (${item['price']}) "
            f"[Allergens: {', '.join(item.get('allergens', []))}]"
            for item in menu_items
        ])
        
        allergy_warning = ""
        if user_allergies:
            allergy_warning = f"\n⚠️ CRITICAL: Customer is allergic to: {', '.join(user_allergies)}. NEVER recommend dishes containing these allergens!"
        
        return f"""You are Gusto AI, a friendly restaurant assistant helping customers order food.

YOUR MENU:
{menu_text}

YOUR ROLE:
- Help customers find dishes they'll love
- Answer questions about ingredients, spices, preparation
- Make personalized recommendations based on preferences
- Be warm, friendly, and helpful{allergy_warning}

IMPORTANT RULES:
1. ONLY recommend dishes from the menu above
2. If customer has allergies, NEVER suggest dishes with those allergens
3. When customer says "yes" or "add it" or "I'll take it", that means they want to ORDER
4. Be concise - keep responses under 3 sentences unless asked for details
5. Use emojis sparingly (1-2 per message max)

Remember: You're helping someone choose their meal. Make it delightful! 🍽️"""
    
    def chat(
        self, 
        message: str, 
        session_id: str,
        menu_items: List[Dict],
        user_allergies: List[str] = None
    ) -> Dict:
        """Have a conversation with the customer"""
        
        if not self.enabled:
            return {
                "response": "Sorry, chatbot is not configured.",
                "error": True
            }
        
        try:
            # Get or create conversation history
            if session_id not in self.conversations:
                self.conversations[session_id] = []
            
            history = self.conversations[session_id]
            
            # Build conversation context
            system_prompt = self.get_system_prompt(menu_items, user_allergies)

            # Use RAG to find relevant menu items based on message
            rag = MenuRAG(menu_items)

            # Extract keywords from message
            keywords = message.lower().split()
            relevant_items = rag.search_by_keywords(keywords, exclude_allergens=user_allergies)

            # If we found relevant items, enhance the prompt
            if relevant_items[:3]:  # Top 3 matches
                system_prompt += f"\n\n🎯 MOST RELEVANT DISHES FOR THIS QUERY:\n"
                system_prompt += rag.format_items_for_ai(relevant_items[:3])
                system_prompt += "\n\nFocus on recommending these dishes first!"
            
            # Create full conversation for AI
            full_context = system_prompt + "\n\n"
            
            # Add conversation history (last 10 messages)
            for msg in history[-10:]:
                full_context += f"\nCustomer: {msg['user']}\nGusto AI: {msg['assistant']}"
            
            # Add current message
            full_context += f"\nCustomer: {message}\nGusto AI:"
            
            # Get AI response
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_context
            )
            ai_message = response.text.strip()
            
            # Detect intent
            intent = self._detect_intent(message, ai_message)
            
            # Save to history
            history.append({
                "user": message,
                "assistant": ai_message,
                "intent": intent,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Keep only last 20 messages (memory management)
            if len(history) > 20:
                self.conversations[session_id] = history[-20:]
            
            return {
                "response": ai_message,
                "intent": intent,
                "session_id": session_id,
                "error": False
            }
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"❌ CHATBOT ERROR: {error_details}")
            
            return {
                "response": f"Sorry, I'm having trouble right now. Please try again!",
                "error": True,
                "error_message": str(e)
            }
    
    def _detect_intent(self, user_message: str, ai_response: str) -> str:
        """Detect if user wants to order or just inquiring"""
        
        # Order keywords
        order_keywords = [
            'yes', 'yeah', 'sure', 'ok', 'okay', 'add it', 'ill take it', 
            'i want', 'give me', 'order', 'get me', 'نعم', 'طيب', 'أريد'
        ]
        
        # Check if user message contains order intent
        message_lower = user_message.lower()
        for keyword in order_keywords:
            if keyword in message_lower:
                return "order_confirmation"
        
        # Check if AI is asking for confirmation
        confirmation_phrases = ['add', 'order', 'would you like', 'want me to']
        if any(phrase in ai_response.lower() for phrase in confirmation_phrases):
            return "order_inquiry"
        
        return "menu_inquiry"
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        return self.conversations.get(session_id, [])
    
    def clear_conversation(self, session_id: str):
        """Clear conversation history"""
        if session_id in self.conversations:
            del self.conversations[session_id]

# Global instance
chatbot_service = ChatbotService()