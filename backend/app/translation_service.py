from google.cloud import translate_v2 as translate
import os
from typing import Dict, List

class TranslationService:
    def __init__(self):
        """Initialize Google Translate client"""
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
            print("⚠️ Credentials not found")
        
        # In-memory cache
        self.cache = {}
    
    def translate_text(
        self, 
        text: str, 
        target_lang: str, 
        source_lang: str = "en"
    ) -> Dict:
        """Translate with caching"""
        if not self.translate_client:
            return {"error": "Translation not configured", "success": False}
        
        # Check cache
        cache_key = f"{source_lang}:{target_lang}:{text.lower()}"
        if cache_key in self.cache:
            result = self.cache[cache_key]
            result['cached'] = True
            return result
        
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
                "success": True
            }
            
            # Save to cache
            self.cache[cache_key] = response.copy()
            
            return response
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def translate_batch(self, items: List[Dict], target_lang: str) -> List[Dict]:
        """Translate multiple items"""
        translated = []
        
        for item in items:
            name_result = self.translate_text(item.get("name", ""), target_lang)
            desc_result = self.translate_text(item.get("description", ""), target_lang)
            
            translated.append({
                **item,  # Keep all original fields
                "name": name_result.get("translated_text", item.get("name")),
                "description": desc_result.get("translated_text", item.get("description")),
                "original_name": item.get("name"),
                "original_description": item.get("description")
            })
        
        return translated
    
    def get_cache_stats(self):
        """Cache statistics"""
        return {
            "total_cached": len(self.cache),
            "cache_keys": list(self.cache.keys())[:5]  # Show first 5
        }
    
    def clear_cache(self):
        """Clear cache"""
        self.cache.clear()

# Global instance
translation_service = TranslationService()