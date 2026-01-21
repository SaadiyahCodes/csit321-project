#app/services/chatbot_service.py
from google import genai
import os
from typing import Dict, List
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.models.menuitems import MenuItem
from app.services.menu_rag import MenuRAG
import json
import re

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

    def get_menu_items_dict(self, db: Session, restaurant_id: int) -> List[Dict]:
        """Fetch menu items from database and convert to dict format"""
        menu_items = db.query(MenuItem).filter(
            MenuItem.restaurant_id == restaurant_id
        ).all()
        
        # Convert SQLAlchemy models to dicts for AI
        return [
            {
                "id": item.id,
                "name": item.name,
                "description": item.description,
                "price": float(item.price),
                "category": item.category or "other",
                "allergens": item.allergens if item.allergens else [],
                "ingredients": item.ingredients or ""
            }
            for item in menu_items
        ]
    
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
    - Customer asks about food → Recommend dishes from the menu
    - Customer shows interest → Confirm: "Would you like to add the [dish] to your order?"
    - Customer confirms → Say: "Perfect! Let me add that for you." (backend will handle actual adding)
    - Continue conversation naturally

    Remember: You SUGGEST items. The system adds them. Don't claim you've added anything yourself!"""
    
    def chat(
        self, 
        message: str, 
        session_id: str,
        db: Session,
        restaurant_id: int,
        user_allergies: List[str] = None
    ) -> Dict:
        """Have a conversation with the customer using real database + RAG"""
        
        if not self.enabled:
            return {
                "response": "Sorry, chatbot is not configured.",
                "error": True
            }
        
        try:
            # Get real menu items from database
            menu_items = self.get_menu_items_dict(db, restaurant_id)
            
            if not menu_items:
                return {
                    "response": "Sorry, this restaurant's menu is not available right now.",
                    "error": True
                }
            
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
            intent = self._detect_intent(message, ai_message, menu_items, history)
            
            # Save to history
            history.append({
                "user": message,
                "assistant": ai_message,
                "intent": intent,
                "extracted_preferences": extracted,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Keep only last 20 messages (memory management)
            if len(history) > 20:
                self.conversations[session_id] = history[-20:]
            
            return {
                "response": ai_message,
                "intent": intent,
                "session_id": session_id,
                "extracted_preferences": extracted,
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
    
    def _detect_intent(self, user_message: str, ai_response: str, menu_items: List[Dict], history: List[Dict] = None) -> Dict:
        """Detect user intent and extract menu items mentioned"""
        
        message_lower = user_message.lower()
        response_lower = ai_response.lower()
        
        # Find items mentioned in AI's CURRENT response
        ai_mentioned_items = []
        for item in menu_items:
            if item['name'].lower() in response_lower:
                ai_mentioned_items.append({
                    "id": item['id'],
                    "name": item['name'],
                    "price": item['price']
                })
        
        # Find items mentioned in USER's message
        user_mentioned_items = []
        for item in menu_items:
            if item['name'].lower() in message_lower:
                user_mentioned_items.append({
                    "id": item['id'],
                    "name": item['name'],
                    "price": item['price']
                })
        
        # Customer explicitly confirms with "yes", "sure", etc.
        if any(word in message_lower for word in ['yes', 'sure', 'ok', 'add it', "i'll take it", 'sounds good', 'perfect']):
            # Priority 1: If user mentions specific item ("yes add french fries")
            if user_mentioned_items:
                items_to_add = user_mentioned_items
            # Priority 2: Check PREVIOUS AI message for recommendations
            elif history:
                # Get the last AI message (where recommendation was made)
                previous_ai_message = history[-1].get('assistant', '').lower() if history else ''
                
                # Find items mentioned in PREVIOUS AI message
                previous_mentioned_items = []
                for item in menu_items:
                    if item['name'].lower() in previous_ai_message:
                        previous_mentioned_items.append({
                            "id": item['id'],
                            "name": item['name'],
                            "price": item['price']
                        })
                
                # Use FIRST item from previous message (primary recommendation)
                items_to_add = [previous_mentioned_items[0]] if previous_mentioned_items else []
            # Priority 3: Fallback to current AI message
            else:
                items_to_add = [ai_mentioned_items[0]] if ai_mentioned_items else []
            
            return {
                'type': 'order_confirmation',
                'confidence': 'high',
                'action': 'add_to_cart',
                'should_add': True,
                'items': items_to_add
            }
        
        # Customer expresses interest with SPECIFIC item name
        if any(word in message_lower for word in ['i want', 'i would like', 'can i get', 'get me', "i'll have"]):
            # Use items mentioned in user's message
            return {
                'type': 'order_intent',
                'confidence': 'medium',
                'action': 'recommend_and_ask',
                'should_add': True if user_mentioned_items else False,
                'items': user_mentioned_items
            }
        
        # Just asking questions
        return {
            'type': 'menu_inquiry',
            'confidence': 'high',
            'action': 'provide_info',
            'should_add': False,
            'items': []
        }
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        return self.conversations.get(session_id, [])
    

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
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                extracted = json.loads(json_match.group())
                return extracted
            
            return {"keywords": [], "allergies": [], "max_price": None, "category": None, "dietary": []}
            
        except Exception as e:
            print(f"Extraction error: {e}")
            # Fallback: simple keyword extraction
            words = message.lower().split()
            food_keywords = [w for w in words if len(w) > 3]  # Simple heuristic
            return {"keywords": food_keywords, "allergies": [], "max_price": None, "category": None, "dietary": []}

# Global instance
chatbot_service = ChatbotService()