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
import time

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
        
        # Conversation memory: session_id -> list of messages
        self.conversations = {}

        # Menu cache: restaurant_id -> {items, timestamp}
        self.menu_cache = {}
        self.menu_cache_ttl = 300  # 5 minutes

    def get_menu_items_dict(self, db: Session, restaurant_id: int) -> List[Dict]:
        """Fetch menu items from DB with in-memory cache"""

        cached = self.menu_cache.get(restaurant_id)
        if cached and (time.time() - cached['timestamp']) < self.menu_cache_ttl:
            print(f"🚀 Using cached menu for restaurant {restaurant_id}")
            return cached['items']

        menu_items = db.query(MenuItem).filter(
            MenuItem.restaurant_id == restaurant_id
        ).all()
        
        items = [
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

        self.menu_cache[restaurant_id] = {
            "items": items,
            "timestamp": time.time()
        }
        print(f"💾 Cached menu for restaurant {restaurant_id} ({len(items)} items)")

        return items
    
    def get_system_prompt(
        self,
        menu_items: List[Dict],
        user_allergies: List[str] = None,
        dietary_prefs: List[str] = None
    ) -> str:
        """Create system prompt with menu context"""
        
        menu_text = "\n".join([
            f"- {item['name']}: {item['description']} (${item['price']}) "
            f"[Allergens: {', '.join(item.get('allergens', []))}]"
            for item in menu_items
        ])
        
        allergy_warning = ""
        if user_allergies:
            allergy_warning += f"\n⚠️ CRITICAL: Customer is allergic to: {', '.join(user_allergies)}. NEVER recommend dishes containing these allergens!"
        if dietary_prefs:
            allergy_warning += f"\n⚠️ CRITICAL: Customer follows these dietary preferences: {', '.join(dietary_prefs)}. NEVER recommend dishes that violate these!"
        
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
2. If customer has allergies or dietary preferences, NEVER suggest dishes that violate them
3. Be concise - keep responses under 3 sentences unless asked for details
4. NEVER use emojis in responses (they interfere with voice output)
5. You are RECOMMENDING items, not adding them directly. Always ask for confirmation first.
6. Pay attention to quantity ("2 burgers", "three fries") and customizations ("no onions", "extra cheese")
7. NEVER set should_add: true on the first request. Always confirm first. Only set should_add: true when customer responds yes/sure/ok to YOUR confirmation question.

CONVERSATION FLOW:
- Customer asks about food -> Recommend suitable dishes
- Customer shows interest -> Confirm: "Would you like to add [quantity] [dish] to your order?"
- Customer confirms -> Say: "Perfect! Let me add that for you."
- Continue conversation naturally

RESPONSE FORMAT:
You MUST always respond with valid JSON in this exact format, no extra text outside the JSON:
{{
    "response": "your conversational reply to the customer",
    "intent": "menu_inquiry | order_intent | order_confirmation",
    "should_add": true or false,
    "items_to_add": [
        {{
            "name": "exact item name from menu",
            "quantity": 1,
            "notes": "any customization notes or empty string"
        }}
    ],
    "items_rejected": [
        {{"name": "exact item name from menu"}}
    ],
    "awaiting_confirmation": true or false
}}

FIELD RULES:
- "response": natural conversational text, no emojis
- "intent":
    "menu_inquiry" = customer asking questions, browsing
    "order_intent" = customer wants something but needs confirmation
    "order_confirmation" = customer confirmed a previous recommendation
- "should_add": true ONLY when customer has explicitly confirmed AND items_to_add is not empty
- "items_to_add": ONLY items the customer confirmed they want. NEVER include rejected/allergen items here.
- "quantity": integer, default 1. Extract from message ("2 burgers" -> 2, "three fries" -> 3)
- "notes": customer customizations ("no onions", "extra cheese", "well done"). Empty string if none.
- "items_rejected": items NOT recommended due to allergies/dietary restrictions
- "awaiting_confirmation": true when you just recommended something and are waiting for yes/no

EXAMPLE - Allergen conflict with customization:
Customer: "I want 2 burgers with extra cheese"
-> {{
    "response": "Our Classic Burger contains beef and cheese which conflict with your vegan diet. I recommend our crispy French Fries instead. Would you like to add those?",
    "intent": "order_intent",
    "should_add": false,
    "items_to_add": [],
    "items_rejected": [{{"name": "Classic Burger"}}],
    "awaiting_confirmation": true
}}

EXAMPLE - Confirmation with quantity and notes:
Customer: "yes, 2 portions and make them extra crispy"
-> {{
    "response": "Perfect! Let me add 2 portions of French Fries (extra crispy) for you.",
    "intent": "order_confirmation",
    "should_add": true,
    "items_to_add": [{{"name": "French Fries", "quantity": 2, "notes": "extra crispy"}}],
    "items_rejected": [],
    "awaiting_confirmation": false
}}

EXAMPLE - Direct order with notes:
Customer: "can I get a chicken sandwich with no pickles"
-> {{
    "response": "Great choice! One Chicken Sandwich with no pickles. Shall I add that to your order?",
    "intent": "order_intent",
    "should_add": false,
    "items_to_add": [{{"name": "Chicken Sandwich", "quantity": 1, "notes": "no pickles"}}],
    "items_rejected": [],
    "awaiting_confirmation": true
}}"""

    def extract_keywords_and_preferences(self, message: str) -> Dict:
        """
        Rule-based extraction — no Gemini call needed.
        Used only to detect allergens/dietary mentioned in chat
        and extract basic keywords for logging.
        """
        message_lower = message.lower()

        stopwords = {
            'what', 'have', 'that', 'this', 'with', 'from', 'want', 'like',
            'something', 'anything', 'please', 'can', 'you', 'get', 'give',
            'make', 'would', 'could', 'should', 'there', 'they', 'their',
            'about', 'some', 'just', 'also', 'more', 'very', 'good', 'nice'
        }
        keywords = [
            w for w in re.sub(r'[^\w\s]', '', message_lower).split()
            if len(w) > 3 and w not in stopwords
        ]

        # Allergen detection
        allergy_triggers = ['allergic', 'allergy', 'intolerant', 'intolerance', "can't eat", 'avoid', 'no ']
        allergens = []
        if any(trigger in message_lower for trigger in allergy_triggers):
            known_allergens = ['nuts', 'peanuts', 'dairy', 'gluten', 'shellfish',
                               'soy', 'eggs', 'fish', 'wheat', 'sesame', 'mustard']
            allergens = [a for a in known_allergens if a in message_lower]

        # Price detection
        price_match = re.search(r'under\s*\$?(\d+)', message_lower)
        max_price = float(price_match.group(1)) if price_match else None

        # Category detection
        category_map = {
            'starter': 'appetizer', 'appetizer': 'appetizer', 'starters': 'appetizer',
            'main': 'mains', 'mains': 'mains', 'entree': 'mains',
            'dessert': 'desserts', 'sweet': 'desserts',
            'drink': 'drinks', 'drinks': 'drinks', 'beverage': 'drinks'
        }
        category = next((category_map[w] for w in message_lower.split() if w in category_map), None)

        # Dietary detection
        dietary_keywords = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free',
                            'halal', 'kosher', 'keto', 'paleo', 'pescatarian']
        dietary = [d for d in dietary_keywords if d in message_lower]

        return {
            "keywords": keywords,
            "allergies": allergens,
            "max_price": max_price,
            "category": category,
            "dietary": dietary
        }

    def _resolve_items(self, item_list: List[Dict], menu_items: List[Dict]) -> List[Dict]:
        """
        Match item names from Gemini JSON to actual menu items with IDs.
        Preserves quantity and notes from Gemini response.
        """
        resolved = []
        for entry in item_list:
            name = entry.get("name", "").lower()
            for item in menu_items:
                if item['name'].lower() == name:
                    resolved.append({
                        "id": item["id"],
                        "name": item["name"],
                        "price": item["price"],
                        "quantity": entry.get("quantity", 1),
                        "notes": entry.get("notes", "") or "Added by chatbot"
                    })
                    break
        return resolved

    def chat(
        self, 
        message: str, 
        session_id: str,
        db: Session,
        restaurant_id: int,
        user_allergies: List[str] = None,
        dietary_prefs: List[str] = None
    ) -> Dict:
        """Single Gemini call: chat response + intent + cart items combined"""

        if not self.enabled:
            return {
                "response": "Sorry, chatbot is not configured.",
                "error": True
            }
        
        try:
            # ===== 1. GET MENU (cached) =====
            menu_items = self.get_menu_items_dict(db, restaurant_id)
            
            if not menu_items:
                return {
                    "response": "Sorry, this restaurant's menu is not available right now.",
                    "error": True
                }
            
            # ===== 2. RULE-BASED EXTRACTION (free, instant) =====
            extracted = self.extract_keywords_and_preferences(message)
            print(f"🧪 Extracted: {extracted}")

            # Merge allergens and dietary from profile + current message
            all_allergies = list(set((user_allergies or []) + extracted.get("allergies", [])))
            all_dietary = list(set((dietary_prefs or []) + extracted.get("dietary", [])))

            # ===== 3. RAG — safety filtering only =====
            # RAG is used to filter unsafe items, not keyword matching
            # Gemini handles natural language understanding
            rag = MenuRAG(menu_items)
            rag_context = ""

            if all_allergies or all_dietary:
                safe_items = rag.get_safe_items(
                    exclude_allergens=all_allergies,
                    exclude_dietary=all_dietary
                )
                # Only add RAG context if some items were filtered out
                if len(safe_items) < len(menu_items):
                    filtered_count = len(menu_items) - len(safe_items)
                    rag_context = f"\n\nSAFE ITEMS FOR THIS CUSTOMER ({filtered_count} items filtered due to allergens/dietary restrictions):\n"
                    rag_context += rag.format_items_for_ai(safe_items)
                    rag_context += "\n\nOnly recommend items from this safe list."

            # ===== 4. BUILD PROMPT =====
            if session_id not in self.conversations:
                self.conversations[session_id] = []
            
            history = self.conversations[session_id]
            system_prompt = self.get_system_prompt(menu_items, all_allergies or None, all_dietary or None)
            
            full_context = system_prompt + rag_context + "\n\n"
            
            for msg in history[-10:]:
                full_context += f"\nCustomer: {msg['user']}\nGusto AI: {msg['assistant']}"
            
            full_context += f"\nCustomer: {message}\nGusto AI:"

            # ===== 5. SINGLE GEMINI CALL =====
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_context,
                config={
                    "temperature": 0,
                }
            )
            raw_text = response.text.strip()
            # Strip markdown code fences if present
            raw_text = raw_text.replace('```json', '').replace('```', '').strip()
            print(f"🤖 Raw Gemini response: {raw_text[:200]}")

            # ===== 6. PARSE JSON RESPONSE =====
            parsed = None
            try:
                json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
            except (json.JSONDecodeError, AttributeError):
                pass

            if not parsed:
                print("⚠️ Failed to parse Gemini JSON, using plain text fallback")
                parsed = {
                    "response": raw_text,
                    "intent": "menu_inquiry",
                    "should_add": False,
                    "items_to_add": [],
                    "items_rejected": [],
                    "awaiting_confirmation": False
                }

            ai_message = parsed.get("response", raw_text)

            # ===== 6.5 DETECT HANDS-FREE COMMANDS =====
            message_lower = message.lower()
            
            # Check for special hands-free intents
            if any(word in message_lower for word in ['menu', 'show menu', 'read menu', 'what do you have']):
                parsed["intent"] = "read_menu"
                parsed["should_add"] = False
                parsed["items_to_add"] = []
            
            elif any(word in message_lower for word in ['cart', 'my order', 'what did i order', 'my cart']):
                parsed["intent"] = "read_cart"
                parsed["should_add"] = False
                parsed["items_to_add"] = []
            
            elif any(word in message_lower for word in ['checkout', 'finalize', 'done ordering', "that's all", 'place order']):
                parsed["intent"] = "checkout"
                parsed["should_add"] = False
                parsed["items_to_add"] = []
                parsed["should_finalize"] = True

            # ===== 7. RESOLVE ITEM NAMES TO MENU IDs =====
            items_to_add = self._resolve_items(parsed.get("items_to_add", []), menu_items)
            items_rejected = self._resolve_items(parsed.get("items_rejected", []), menu_items)

            intent = {
                "type": parsed.get("intent", "menu_inquiry"),
                "should_add": parsed.get("should_add", False) and len(items_to_add) > 0,
                "should_finalize": parsed.get("should_finalize", False),
                "items": items_to_add,
                "items_rejected": items_rejected,
                "awaiting_confirmation": parsed.get("awaiting_confirmation", False)
            }

            # ===== 8. SAVE TO HISTORY =====
            history.append({
                "user": message,
                "assistant": ai_message,
                "intent": intent,
                "extracted_preferences": extracted,
                "timestamp": datetime.utcnow().isoformat()
            })

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
            print(f"❌ CHATBOT ERROR: {traceback.format_exc()}")
            return {
                "response": "Sorry, I'm having trouble right now. Please try again!",
                "error": True,
                "error_message": str(e)
            }

    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        return self.conversations.get(session_id, [])

    def get_conversation_summary(self, session_id: str, menu_items: List[Dict]) -> str:
        """Generate order summary from conversation"""
        history = self.conversations.get(session_id, [])
        confirmed_items = []
        
        for msg in history:
            if msg.get('intent', {}).get('should_add'):
                for item in msg['intent'].get('items', []):
                    confirmed_items.append(item)
        
        if not confirmed_items:
            return "You haven't confirmed any items yet. What would you like to order?"
        
        summary = "Order Summary from our conversation:\n\n"
        total = 0
        for item in confirmed_items:
            qty = item.get('quantity', 1)
            summary += f"- {qty}x {item['name']} - ${item['price'] * qty:.2f}\n"
            total += item['price'] * qty
        
        summary += f"\nTotal: ${total:.2f}\n\nWould you like to proceed with this order?"
        return summary

    def clear_conversation(self, session_id: str):
        """Clear conversation history"""
        if session_id in self.conversations:
            del self.conversations[session_id]

    def invalidate_menu_cache(self, restaurant_id: int):
        """Call this from menu update/delete endpoints so cache stays fresh"""
        if restaurant_id in self.menu_cache:
            del self.menu_cache[restaurant_id]
            print(f"🗑️ Cleared menu cache for restaurant {restaurant_id}")


# Global instance
chatbot_service = ChatbotService()