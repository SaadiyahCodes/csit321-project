# app/services/chatbot_service_landing.py
from google import genai
from pinecone import Pinecone
import os
import json
import re
import time
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.models.restaurant import Restaurant
from app.models.menuitems import MenuItem
import inspect

load_dotenv()

def normalize(name: str) -> str:
    return name.strip().lower()

class ChatbotServiceLanding:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            self.client = genai.Client(api_key=api_key)
            self.model_name = 'models/gemini-2.0-flash-lite'
            self.enabled = True
            print("Landing chatbot service initialized with Gemini API key.")
        else:
            self.enabled = False
            print("Gemini API key not found. Landing chatbot service is disabled.")

        # Pinecone setup
        pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.pinecone_index = None
        if pinecone_api_key:
            try:
                pc = Pinecone(api_key=pinecone_api_key)
                index_host = os.getenv("PINECONE_INDEX_HOST")
                self.pinecone_index = pc.Index(host=index_host)
                print("Pinecone index connected.")
            except Exception as e:
                print(f"Pinecone connection failed: {e}")

        self.conversations: dict[str, list[dict]] = {}
        self.restaurant_cache: list[dict] | None = None
        self.cache_timestamp: float = 0
        self.cache_ttl: int = 300
        # ADD this temporarily at the end of __init__, after self.pinecone_index = pc.Index(host=index_host)
        #if self.pinecone_index:
        #    print("Pinecone index methods:", [m for m in dir(self.pinecone_index) if not m.startswith('_')])

    def get_restaurants(self, db: Session) -> list[dict]:
        current_time = time.time()
        if self.restaurant_cache and (current_time - self.cache_timestamp < self.cache_ttl):
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
        self.cache_timestamp = current_time
        print(f"Cached {len(self.restaurant_cache)} restaurants for landing chatbot")
        return self.restaurant_cache

    def invalidate_cache(self):
        self.restaurant_cache = None
        self.cache_timestamp = 0
        print("Invalidated restaurant cache for landing chatbot")

    # ── RAG: build index on startup ──────────────────────────────────────────

    def build_rag_query(self, user_message: str) -> str:
        """
        Strip negations so 'no dairy' and 'avoid peanuts' still retrieve
        dairy/peanut items as context for Gemini to reason about.
        """
        negations = ["no ", "without ", "avoid ", "free from ", "allergic to ", "don't want ", "not "]
        query = user_message.lower()
        for neg in negations:
            query = query.replace(neg, "")
        return query.strip()

    def build_menu_index(self, db: Session):
        """Upsert all available menu items into Pinecone on server startup."""
        if not self.pinecone_index:
            print("Pinecone not available — skipping menu index build.")
            return

        try:
            restaurants = {r.id: r.name for r in db.query(Restaurant).all()}
            items = db.query(MenuItem).filter(MenuItem.is_available == True).all()

            vectors = []
            for item in items:
                restaurant_name = restaurants.get(item.restaurant_id, "Unknown")
                allergens = ", ".join(item.allergens) if item.allergens else "none"
                calories = f"{item.calories} kcal" if item.calories else "unknown"

                # Text that gets embedded — English only, rich with searchable info
                text = (
                    f"{restaurant_name} | {item.name}: {item.description or ''}. "
                    f"Category: {item.category}. Price: ${item.price}. "
                    f"Allergens: {allergens}. Calories: {calories}. "
                    f"Ingredients: {item.ingredients or 'not listed'}."
                )

                vectors.append({
                    "_id": str(item.id),
                    "text": text,
                    "restaurant_id": item.restaurant_id,
                    "restaurant_name": restaurant_name,
                    "item_name": item.name,
                    "price": item.price,
                    "category": item.category,
                    "allergens": allergens,
                    "calories": calories,
                })

            # Upsert in batches of 96
            for i in range(0, len(vectors), 96):
                batch = vectors[i:i+96]
                self.pinecone_index.upsert_records(namespace="menu-items", records=batch)

            print(f"Pinecone: indexed {len(vectors)} menu items.")
        except Exception as e:
            print(f"Pinecone index build failed: {e}")

    def query_menu_rag(self, user_message: str, original_message: str = None, top_k: int = 8):
        """
        Query Pinecone for relevant menu items.
        Returns (matched_items_metadata, relevant_restaurant_ids).
        Falls back to ([], []) if Pinecone unavailable.
        """
        if not self.pinecone_index:
            return [], []

        try:
            # Primary query — the stripped keyword (e.g. "onion")
            results1 = self.pinecone_index.search_records(
                namespace="menu-items",
                top_k=top_k,
                inputs={"text": user_message},
                fields=["restaurant_id", "restaurant_name", "item_name",
                        "price", "category", "allergens", "calories"]
            )
            matched_items = []
            restaurant_ids = []
            for hit in results1.get("result", {}).get("hits", []):
                fields = hit.get("fields", {})
                matched_items.append(fields)
                rid = fields.get("restaurant_id")
                if rid and rid not in restaurant_ids:
                    restaurant_ids.append(rid)

            # Second query — broader search using original message for alternatives
            if original_message and restaurant_ids:
                results2 = self.pinecone_index.search_records(
                    namespace="menu-items",
                    top_k=top_k,
                    inputs={"text": "food menu items"},
                    fields=["restaurant_id", "restaurant_name", "item_name",
                            "price", "category", "allergens", "calories"]
                )
                for hit in results2.get("result", {}).get("hits", []):
                    fields = hit.get("fields", {})
                    rid = fields.get("restaurant_id")
                    # Only add items from restaurants already identified as relevant
                    if rid in restaurant_ids and fields not in matched_items:
                        matched_items.append(fields)

            print(f"Pinecone RAG: query='{user_message}' → {len(matched_items)} items, restaurants={restaurant_ids}")
            return matched_items, restaurant_ids

        except Exception as e:
            print(f"Pinecone query failed: {e}")
            return [], []

    # ── Prompt ───────────────────────────────────────────────────────────────

    def build_prompt(self, restaurants: list[dict], rag_items: list[dict]) -> str:
        restaurant_json = json.dumps(restaurants, indent=2)

        rag_context = ""
        if rag_items:
            rag_lines = []
            for item in rag_items:
                rag_lines.append(
                    f"- {item.get('restaurant_name')}: {item.get('item_name')} "
                    f"(${item.get('price')}, {item.get('calories')}) "
                    f"| Allergens: {item.get('allergens')} | Category: {item.get('category')}"
                )
            rag_context = "\nRELEVANT MENU ITEMS (from vector search):\n" + "\n".join(rag_lines)

        return f"""You are Gusto AI, a friendly dining concierge on the Gusto restaurant discovery platform.

AVAILABLE RESTAURANTS:
{restaurant_json}
{rag_context}

PRICE RANGE GUIDE:
- $: Budget-friendly
- $$: Mid-range 
- $$$: Expensive/Fine dining 

YOUR ROLE:
- Welcome users warmly and help them find the perfect restaurant
- Ask clarifying questions when helpful (budget, location, cuisine preference, group size)
- Make personalised recommendations based on what the user tells you
- When the user asks about allergens or specific dishes, use the RELEVANT MENU ITEMS section to give accurate answers
- For group hangouts, help find a middle-ground spot that works for everyone
- Be concise, warm, and conversational
 
CRITICAL RULES:
1. ONLY recommend restaurants from the AVAILABLE RESTAURANTS list
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
User: "I'm allergic to nuts, what can I eat?"
->
{{
    "response": "Based on our menu data, Pizza Haven has several nut-free options like the Margherita Pizza. I would recommend checking them out.",
    "suggested_restaurants": [
        {{"id": 5, "name": "Pizza Haven", "reason": "Has nut-free menu items suitable for your allergy"}}
    ]
}}"""

    # ── Main chat ─────────────────────────────────────────────────────────────

    def chat(self, message: str, conversation_id: str, db: Session) -> dict:
        if not self.enabled:
            return {
                "response": "Sorry, the chatbot assistant is currently unavailable.",
                "suggested_restaurants": [],
                "error": True
            }

        try:
            # RAG query — runs in parallel with restaurant fetch conceptually
            rag_query = self.build_rag_query(message)
            rag_items, rag_restaurant_ids = self.query_menu_rag(rag_query, original_message=message, top_k=10)

            all_restaurants = self.get_restaurants(db)

            # If RAG returned specific restaurants, prioritise them but keep all for fallback
            if rag_restaurant_ids:
                rag_ids_int = [int(rid) for rid in rag_restaurant_ids]
                priority = [r for r in all_restaurants if r["id"] in rag_ids_int]
                others = [r for r in all_restaurants if r["id"] not in rag_ids_int]
                restaurants_for_prompt = priority + others
            else:
                restaurants_for_prompt = all_restaurants

            if not restaurants_for_prompt:
                return {
                    "response": "Sorry, there are no restaurants available at the moment.",
                    "suggested_restaurants": [],
                    "error": False
                }

            history = self.conversations.setdefault(conversation_id, [])
            system_prompt = self.build_prompt(restaurants_for_prompt, rag_items)

            full_context = system_prompt + "\n\n"
            for msg in history[-10:]:
                full_context += f"\nUser: {msg['user']}\nGusto AI: {msg['assistant']}"
            full_context += f"\nUser: {message}\nGusto AI:"

            gemini_response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_context,
                config={"temperature": 0},
            )
            raw_text = gemini_response.text.strip().replace("```json", "").replace("```", "").strip()

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

            restaurant_map_by_id = {r["id"]: r for r in all_restaurants}
            restaurant_map_by_name = {normalize(r["name"]): r for r in all_restaurants}

            enriched = []
            for s in parsed.get("suggested_restaurants", []):
                r = None
                name = s.get("name")
                if name:
                    r = restaurant_map_by_name.get(normalize(name))
                if not r:
                    rid = s.get("id")
                    if rid in restaurant_map_by_id:
                        r = restaurant_map_by_id[rid]
                if r and r["name"] in ai_message:
                    enriched.append({**r, "reason": s.get("reason", "")})

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
                "response": "Sorry, something went wrong. Please try again later.",
                "suggested_restaurants": [],
                "error": True,
                "error_message": str(e)
            }

    def clear_conversation(self, conversation_id: str):
        self.conversations.pop(conversation_id, None)


chatbot_service_landing = ChatbotServiceLanding()