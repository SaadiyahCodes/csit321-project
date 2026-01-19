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
            self.model_name = 'models/gemini-flash-latest'
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

    CRITICAL RULES:
    1. ONLY recommend dishes from the menu above
    2. If customer has allergies, NEVER suggest dishes with those allergens
    3. When customer says "yes" or "I'll take it", respond with: "Great choice! I'll add that to your order."
    4. ⚠️ NEVER say "I have added" or "Added to cart" - You are RECOMMENDING, not adding directly!
    5. After recommendation, ALWAYS ask: "Would you like me to add this to your order?"
    6. Be concise - keep responses under 3 sentences unless asked for details
    7. Use emojis sparingly (1-2 per message max)

    CONVERSATION FLOW:
    - Customer asks about food → Recommend dishes
    - Customer shows interest → Confirm: "Would you like to add the [dish] to your order?"
    - Customer confirms → Say: "Perfect! Let me add that for you." (backend will handle actual adding)
    - Continue conversation naturally

    Remember: You SUGGEST items. The system adds them. Don't claim you've added anything yourself! 🍽️"""
    
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

            extracted = self.extract_keywords_and_preferences(message)

            # Merge allergies (user profile + message-based)
            all_allergies = list(set((user_allergies or []) + extracted.get("allergies", [])))

            # Use extracted keywords for RAG
            rag = MenuRAG(menu_items)

            if extracted.get("keywords"):
                relevant_items = rag.search_by_keywords(
                    keywords=extracted["keywords"],
                    exclude_allergens=all_allergies
                )

                if relevant_items[:3]:
                    system_prompt += f"\n\n🎯 DISHES MATCHING: {', '.join(extracted['keywords'])}\n"
                    system_prompt += rag.format_items_for_ai(relevant_items[:3])
                    system_prompt += "\n\nPrioritize recommending these dishes."
            
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
    
    def _detect_intent(self, user_message: str, ai_response: str) -> Dict:
        """Enhanced intent detection with item extraction"""
        
        message_lower = user_message.lower()
        response_lower = ai_response.lower()
    
        # Customer explicitly confirms order
        if any(word in message_lower for word in ['yes', 'sure', 'ok', 'add it', "i'll take it"]):
            # Check if AI mentioned a specific dish in previous response
            if 'recommend' in response_lower or any(item['name'].lower() in response_lower for item in self.last_recommended_items):
                return {
                    'type': 'order_confirmation',
                    'confidence': 'high',
                    'action': 'add_to_cart',
                    'should_add': True  # ← FLAG to actually add!
                }
        
        # Customer expresses interest ("I want...")
        if any(word in message_lower for word in ['i want', 'i would like', 'can i get']):
            return {
                'type': 'order_intent',
                'confidence': 'medium',
                'action': 'recommend_and_ask',  # ← Changed!
                'should_add': False  # ← Don't add yet!
            }
        
        return {
            'type': 'menu_inquiry',
            'confidence': 'high',
            'action': 'provide_info',
            'should_add': False
        }
    
    def get_conversation_summary(self, session_id: str, menu_items: List[Dict]) -> str:
        """Generate order summary from conversation"""
        
        history = self.conversations.get(session_id, [])
        
        # Extract confirmed orders from conversation
        confirmed_items = []
        
        for msg in history:
            if msg.get('intent', {}).get('should_add'):
                # Find which item was discussed
                for item in menu_items:
                    if item['name'].lower() in msg['user'].lower() or item['name'].lower() in msg['assistant'].lower():
                        confirmed_items.append(item)
                        break
        
        if not confirmed_items:
            return "You haven't confirmed any items yet. What would you like to order?"
        
        # Format summary
        summary = "📋 **Order Summary from our conversation:**\n\n"
        total = 0
        
        for item in confirmed_items:
            summary += f"• {item['name']} - ${item['price']}\n"
            total += item['price']
        
        summary += f"\n💰 **Total: ${total:.2f}**\n\n"
        summary += "Would you like to proceed with this order?"
        
        return summary
    
    def clear_conversation(self, session_id: str):
        """Clear conversation history"""
        if session_id in self.conversations:
            del self.conversations[session_id]



    def extract_keywords_and_preferences(self, message: str) -> Dict:
        """
        Use AI to extract keywords, allergies, and preferences from natural language
        """
        
        extraction_prompt = f"""Analyze this customer message and extract:
    1. Food-related keywords (ingredients, cooking styles, flavors)
    2. Any mentioned allergies or dietary restrictions
    3. Price preferences if mentioned
    4. Category preferences (appetizer, main, dessert, drink)

    Customer message: "{message}"

    Respond ONLY with JSON:
    {{
        "keywords": ["list", "of", "keywords"],
        "allergies": ["list", "of", "allergens"],
        "max_price": number or null,
        "category": "category" or null,
        "dietary": ["vegetarian", "vegan", etc] or []
    }}"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=extraction_prompt
            )
            
            # Parse AI response
            import json
            import re
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                extracted = json.loads(json_match.group())
                return extracted
            
            return {"keywords": [], "allergies": [], "max_price": None, "category": None}
            
        except Exception as e:
            print(f"Extraction error: {e}")
            # Fallback: simple keyword extraction
            words = message.lower().split()
            food_keywords = [w for w in words if len(w) > 3]  # Simple heuristic
            return {"keywords": food_keywords, "allergies": [], "max_price": None}

# Global instance
chatbot_service = ChatbotService()