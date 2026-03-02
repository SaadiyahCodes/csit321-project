# app/services/translation_service.py

from xmlrpc import client

from click import prompt
from google.cloud import translate_v2 as translate
from google import genai
import os
from typing import Dict, List
from functools import lru_cache

class TranslationService:
    def __init__(self):
        """Initialize Google Translate client + Gemini"""
        
        # Google Translate (for simple translations)
        credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        
        if credentials_path and os.path.exists(credentials_path):
            try:
                self.translate_client = translate.Client.from_service_account_json(credentials_path)
                print("✅ Translation service initialized (Google Cloud)")
            except Exception as e:
                self.translate_client = None
                print(f"❌ Translation failed to initialize: {e}")
        else:
            self.translate_client = None
            print("⚠️ Google Translate credentials not found")
        
        # Gemini (for smart food translation)
        gemini_key = os.getenv('GEMINI_API_KEY')
        if gemini_key:
            self.client = genai.Client(
                api_key=gemini_key,
                http_options={"api_version": "v1"}
            )
            print("✅ Gemini API initialized")
        else:
            print("⚠️ Gemini API key not found")
        
        # In-memory cache (your existing one - keep it!)
        self.cache = {}

    
    def translate_text(
        self, 
        text: str, 
        target_lang: str, 
        source_lang: str = "en",
        use_gemini: bool = False  # NEW PARAMETER
    ) -> Dict:
        """
        Translate with caching
        
        use_gemini=True: Use Gemini for food context (better for menus)
        use_gemini=False: Use Google Translate (faster for simple text)
        """
        
        # Check cache first
        cache_key = f"{source_lang}:{target_lang}:{text.lower()}"
        if cache_key in self.cache:
            result = self.cache[cache_key]
            result['cached'] = True
            return result
        
        # Use Gemini for food translation (smart context)
        if use_gemini:
            try:
                translated = self._translate_with_gemini(text, target_lang)
                response = {
                    "original_text": text,
                    "translated_text": translated,
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                    "cached": False,
                    "success": True,
                    "method": "gemini"
                }
                
                # Save to cache
                self.cache[cache_key] = response.copy()
                return response
                
            except Exception as e:
                print(f"⚠️ Gemini failed, falling back to Google Translate: {e}")
                # Fall through to Google Translate
        
        # Use Google Translate (original method)
        if not self.translate_client:
            return {"error": "Translation not configured", "success": False}
        
        try:
            result = self.translate_client.translate(
                text,
                target_language=target_lang,
                source_language=source_lang
            )
            
            response = {
                "original_text": text,
                "translated_text": result['translatedText'],
                "source_lang": source_lang,
                "target_lang": target_lang,
                "cached": False,
                "success": True,
                "method": "google"
            }
            
            # Save to cache
            self.cache[cache_key] = response.copy()
            return response
            
        except Exception as e:
            print(f"❌ Translation error for '{text}': {e}")
            return {"error": str(e), "success": False}
    
    @lru_cache(maxsize=1000)  # ← CACHING HERE (automatic)
    def _translate_with_gemini(self, text: str, target_lang: str) -> str:
        """
        Smart food translation using Gemini with context
        
        Cached in RAM - repeat translations are instant!
        """
        
        # Map language codes to full names
        lang_names = {
            'hi': 'Hindi',
            'ar': 'Arabic',
            'ur': 'Urdu',
            'fr': 'French',
            'es': 'Spanish',
            'en': 'English'
        }
        
        target_language = lang_names.get(target_lang, target_lang)
        
        # Smart prompt with food context
        prompt = f"""Translate this restaurant menu text to {target_language}.

RULES:
- Keep dish names culturally appropriate (don't literally translate)
- Keep brand names unchanged (Buffalo Sauce, Tandoori, etc.)
- Translate descriptions naturally
- If it's a dish name like "Buffalo Sauce", keep it or transliterate it
- Don't translate: "Tikka", "Tandoori", "Kebab", "Biryani", etc.

Text: {text}

Return ONLY the translation, nothing else."""
        
        try:
            client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
            response = client.models.generate_content(
                model='models/gemini-2.5-flash',
                contents=prompt
            )
            return response.text.strip()
            
        except Exception as e:
            print(f"❌ Gemini translation error: {e}")
            # If rate limited, return original text
            if "429" in str(e) or "quota" in str(e).lower():
                print("🚨 Rate limit! Returning original text")
                return text
            raise
    
    def translate_batch(
        self, 
        items: List[Dict], 
        target_lang: str,
        use_gemini: bool = True  # NEW: Use Gemini for menus by default
    ) -> List[Dict]:
        """Translate multiple items (menu items)"""
        print(f"🔍 translate_batch called with {len(items)} items, target_lang={target_lang}")
        
        if not items:
            print("⚠️ No items to translate!")
            return []
        
        translated = []
        
        for i, item in enumerate(items):
            print(f"🔍 Translating item {i+1}/{len(items)}: {item.get('name', 'NO NAME')}")
            
            # Use Gemini for menu items (better food context)
            name_result = self.translate_text(
                item.get("name", ""), 
                target_lang,
                use_gemini=use_gemini
            )
            
            desc_result = self.translate_text(
                item.get("description", ""), 
                target_lang,
                use_gemini=use_gemini
            )
            
            translated_item = {
                **item,
                "name": name_result.get("translated_text", item.get("name")),
                "description": desc_result.get("translated_text", item.get("description")),
                "original_name": item.get("name"),
                "original_description": item.get("description")
            }
            
            translated.append(translated_item)
        
        print(f"🔍 translate_batch returning {len(translated)} items")
        return translated
    
    def get_cache_stats(self):
        """Cache statistics"""
        return {
            "total_cached": len(self.cache),
            "cache_keys": list(self.cache.keys())[:5]
        }
    
    def clear_cache(self):
        """Clear cache"""
        self.cache.clear()
        # Clear LRU cache too
        self._translate_with_gemini.cache_clear()

# Global instance
translation_service = TranslationService()