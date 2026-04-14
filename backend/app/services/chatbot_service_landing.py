# app/services/chatbot_service_landing.py
from google import genai
import os
import json
import re
import time
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.models.restaurant import Restaurant

load_dotenv()

def normalize(name: str) -> str:
    return name.strip().lower()

class ChatbotServiceLanding:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            self.client = genai.Client(api_key=api_key)
            self.model_name = 'models/gemini-flash-latest'
            self.enabled = True
            print("Landing chatbot service initialized with Gemini API key.")
        else:
            self.enabled = False
            print("Gemini API key not found. Landing chatbot service is disabled.")

        # conversation_id -> list of {user, assistant}
        self.conversations: dict[str, list[dict]] = {}

        # Simple in-memory cache for restaurant data to avoid frequent DB hits
        self.restaurant_cache : list[dict] | None = None
        self.cache_timestamp : float = 0
        self.cache_ttl: int = 300

    # Data layer
    def get_restaurants(self, db: Session) -> list[dict]:
        # Fetch all restaurants from DB with short-lived cache.
        current_time = time.time()
        if self.restaurant_cache and (current_time - self.cache_timestamp < self.cache_ttl):
            print("Using cached restaurant data.")
            return self.restaurant_cache

        
        restaurants = db.query(Restaurant).all()
        self.restaurant_cache = [
            {
                "id": r.id,
                "name": r.name,
                "category": r.category or "Various",
                "rating": r.rating or 0.0,
                "location": r.location or "Not specified",
                "avg_price_range": r.avg_price_range or "Not specified",
            }
            for r in restaurants
        ]
        
        # Update cache
        self.cache_timestamp = current_time
        print(f"Cached {len(self.restaurant_cache)} restaurants for landing chatbot")
        return self.restaurant_cache

    # Call this whenever a restaurant is created, updated, or deleted.
    def invalidate_cache(self):
        self.restaurant_cache = None
        self.cache_timestamp = 0
        print("Invalidated restaurant cache for landing chatbot")

    # Prompt
    def build_prompt(self, restaurants: list[dict]) -> str:
        restaurant_json = json.dumps(restaurants, indent=2)

        return f"""You are Gusto AI, a friendly dining concierge on the Gusto restaurant discovery platform.

AVAILABLE RESTAURANTS:
{restaurant_json}

PRICE RANGE GUIDE:
- $: Budget-friendly
- $$: Mid-range 
- $$$: Expensive/Fine dining 

YOUR ROLE:
- Welcome users warmly and help them find the perfect restaurant
- Ask clarifying questions when helpful (budget, location, cuisine preference, group size)
- Make personalised recommendations based on what the user tells you
- For group hangouts, help find a middle-ground spot that works for everyone
- Be concise, warm, and conversational
 
CRITICAL RULES:
1. ONLY recommend restaurants from the list above
2. NEVER make up restaurants, locations, prices, or ratings
3. Keep responses under 4 sentences unless the user asks for more detail
4. NEVER use emojis (they interfere with accessibility and voice output)
5. Do not mention ordering — users browse and order inside each restaurant's page

RESPONSE FORMAT:
Always respond with valid JSON only, no text outside the JSON:
{{
    "response": "your conversational reply",
    "suggested_restaurants": [
        {{
            "id": <integer id from list>,
            "name": "exact restaurant name",
            "reason": "one short sentence why you are recommending this"
        }}
    ]
}}

FIELD RULES:
- "name" MUST EXACTLY match one of the restaurant names provided (character-for-character)
- Do NOT modify, shorten, or rephrase restaurant names
- "response": natural, friendly text — no emojis, no markdown
- "suggested_restaurants": restaurants you are recommending in this turn. Empty list [] if just chatting or asking a clarifying question.
- "suggested_restaurants": ONLY include restaurants you are recommending FOR THE FIRST TIME in this turn. If the user is confirming, asking follow-up questions, or you already suggested these restaurants in a previous turn, return []
- Only include restaurants you actually mention in "response"

EXAMPLE:
User: "Looking for something cheap and Italian near the Marina"
->
{{
    "response": "Based on what we have near the marina, I would suggest Pizza Haven. It is an affordable Italian spot with a 4.1 rating.",
    "suggested_restaurants": [
        {{"id": 5, "name": "Pizza Haven", "reason": "Budget-friendly Italian near the marina with great ratings"}}
    ]
}}"""
    
    # Main chat method
    def chat(self, message: str, conversation_id: str, db: Session) -> dict:
        if not self.enabled:
            return {
                "response": "Sorry, the chatbot assistant is currently unavailable.",
                "suggested_restaurants": [],
                "error": True
            }

        try:
            restaurants = self.get_restaurants(db)

            if not restaurants:
                return {
                    "response": "Sorry, there are no restaurants available at the moment.",
                    "suggested_restaurants": [],
                    "error": False
                }

            # Build conversation context
            history = self.conversations.setdefault(conversation_id, [])
            system_prompt = self.build_prompt(restaurants)

            full_context = system_prompt + "\n\n"
            for msg in history[-10:]:  # Include last 10 messages for context
                full_context += f"\nUser: {msg['user']}\nGusto AI: {msg['assistant']}"
            full_context += f"\nUser: {message}\nGusto AI:"

            # Call Gemini API
            gemini_response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_context,
                config={"temperature": 0},
            )
            raw_text = gemini_response.text.strip().replace("```json", "").replace("```", "").strip()

            # Parse JSON response
            parsed = None
            try:
                match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                if match:
                    parsed = json.loads(match.group())
            except (json.JSONDecodeError, AttributeError):
                pass
 
            if not parsed:
                parsed = {"response": raw_text, "suggested_restaurants": []}
 
            ai_message = parsed.get("response", raw_text)

            # Enrich suggested restaurants with full details from our cached data
            #Build maps
            restaurant_map_by_id = {r["id"]: r for r in restaurants}
            restaurant_map_by_name = {normalize(r["name"]): r for r in restaurants}

            enriched = []
            for s in parsed.get("suggested_restaurants", []):
                r = None
                # Try name match first
                name = s.get("name")
                if name:
                    r = restaurant_map_by_name.get(normalize(name))

                # Fallback to ID
                if not r:
                    rid = s.get("id")
                    if rid in restaurant_map_by_id:
                        r = restaurant_map_by_id[rid]

                # Final alignment check with response text
                if r and r["name"] in ai_message:
                    enriched.append({
                        **r,
                        "reason": s.get("reason", ""),
                    })

            # Save to conversation memory
            history.append({
                "user": message,
                "assistant": ai_message,
                "timestamp": datetime.utcnow().isoformat(),
            })
            if len(history) > 20:
                self.conversations[conversation_id] = history[-20:]
 
            return {
                "response": ai_message,
                "suggested_restaurants": enriched,
                "error": False,
            }
        
        except Exception as e:
            import traceback
            print(f"CHATBOT ERROR: {traceback.format_exc()}")
            return {
                "response": "Sorry, something went wrong while processing your request. Please try again later.",
                "suggested_restaurants": [],
                "error": True,
                "error_message": str(e)
            }
        
    def clear_conversation(self, conversation_id: str):
        self.conversations.pop(conversation_id, None)

# Global instance
chatbot_service_landing = ChatbotServiceLanding()