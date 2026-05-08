#app/services/menu_rag.py
from typing import List, Dict, Optional

#Maps dietary preference to ingredients/keywords that violate it
DIETARY_VIOLATION_KEYWORDS = {
    "vegetarian": ["chicken", "beef", "lamb", "pork", "meat", "fish", "prawn", "shrimp", "bacon", "turkey"],
    "vegan": ["chicken", "beef", "lamb", "pork", "meat", "fish", "prawn", "shrimp", "bacon", "turkey",
              "dairy", "milk", "cheese", "butter", "cream", "egg", "honey"],
    "gluten-free": ["wheat", "flour", "bread", "pasta", "gluten", "barley", "rye"],
    "dairy-free": ["milk", "cheese", "butter", "cream", "dairy", "yogurt"],
    "nut-free": ["nuts", "almond", "cashew", "walnut", "pistachio", "pecan", "hazelnut"],
    "halal": ["pork", "bacon", "ham", "lard", "alcohol", "wine", "beer"],
    "kosher": ["pork", "bacon", "ham", "shellfish", "shrimp", "prawn", "crab", "lobster"],
    "pescatarian": ["chicken", "beef", "lamb", "pork", "meat", "bacon", "turkey"],
    "paleo": ["wheat", "flour", "bread", "pasta", "dairy", "milk", "cheese", "grain", "rice", "bean", "legume"],
    "keto": ["sugar", "bread", "pasta", "rice", "wheat", "flour", "potato", "corn"],
}

class MenuRAG:
    """Menu Retrieval-Augmented Generation - Smart menu search"""
    
    def __init__(self, menu_items: List[Dict]):
        self.menu_items = menu_items

    def _violates_dietary(self, item: Dict, dietary_prefs: List[str]) -> bool:
        """Check if item violates any dietary preference"""
        if not dietary_prefs:
            return False
        
        searchable = f"{item['name']} {item.get('description', '')} {item.get('ingredients', '')}".lower()
        # Also check allergens field
        item_allergens = " ".join(item.get('allergens', [])).lower()
        full_text = f"{searchable} {item_allergens}"
        
        for pref in dietary_prefs:
            pref_lower = pref.lower()
            violation_keywords = DIETARY_VIOLATION_KEYWORDS.get(pref_lower, [])
            if any(kw in full_text for kw in violation_keywords):
                return True
        
        return False
    
    def search_by_keywords(self, keywords: List[str], exclude_allergens: List[str] = None, exclude_dietary: List[str] = None) -> List[Dict]:
        results = []
        
        for item in self.menu_items:
            #Check if item contains allergens
            if exclude_allergens:
                item_allergens = [a.lower() for a in item.get('allergens', [])]
                if any(allergen.lower() in item_allergens for allergen in exclude_allergens):
                    continue  #Skip this item (has allergen)
            
            #Check if item violates dietary preferences
            if self._violates_dietary(item, exclude_dietary or []):
                continue  #Skip this item (violates dietary)
            
            searchable_text = f"{item['name']} {item['description']} {item.get('ingredients', '')}".lower()
            matches = sum(1 for keyword in keywords if keyword.lower() in searchable_text)
            
            if matches > 0:
                results.append({
                    **item,
                    'relevance_score': matches
                })
        
        #Sort by relevance (most matches first)
        results.sort(key=lambda x: x['relevance_score'], reverse=True)
        return results
    
    def search_by_category(self, category: str, exclude_allergens: List[str] = None) -> List[Dict]:
        """Search by category (mains, appetizers, drinks, desserts)"""
        results = []
        
        for item in self.menu_items:
            # Check allergens
            if exclude_allergens:
                item_allergens = [a.lower() for a in item.get('allergens', [])]
                if any(allergen.lower() in item_allergens for allergen in exclude_allergens):
                    continue
            
            # Check category
            if item.get('category', '').lower() == category.lower():
                results.append(item)
        
        return results
    
    def search_by_price_range(self, min_price: float = 0, max_price: float = 1000, exclude_allergens: List[str] = None) -> List[Dict]:
        """Search by price range"""
        results = []
        
        for item in self.menu_items:
            # Check allergens
            if exclude_allergens:
                item_allergens = [a.lower() for a in item.get('allergens', [])]
                if any(allergen.lower() in item_allergens for allergen in exclude_allergens):
                    continue
            
            # Check price
            price = item.get('price', 0)
            if min_price <= price <= max_price:
                results.append(item)
        
        # Sort by price (cheapest first)
        results.sort(key=lambda x: x.get('price', 0))
        
        return results
    
    def get_safe_items(self, exclude_allergens: List[str], exclude_dietary: List[str] = None) -> List[Dict]:
        """Get all items safe for customer with allergies/dietary restrictions"""
        safe_items = []
        
        for item in self.menu_items:
            item_allergens = [a.lower() for a in item.get('allergens', [])]
            is_safe = not any(allergen.lower() in item_allergens for allergen in exclude_allergens)
            if is_safe and not self._violates_dietary(item, exclude_dietary or []):
                safe_items.append(item)
        return safe_items
    
    def get_recommendations(self, preferences: Dict, exclude_allergens: List[str] = None) -> List[Dict]:
        """
        Get recommendations based on preferences
        
        preferences = {
            'spicy': True,
            'vegetarian': True,
            'max_price': 50,
            'category': 'mains'
        }
        """
        results = self.menu_items.copy()
        
        # Filter by allergens first
        if exclude_allergens:
            results = [
                item for item in results
                if not any(allergen.lower() in [a.lower() for a in item.get('allergens', [])] 
                          for allergen in exclude_allergens)
            ]
        
        # Filter by preferences
        if preferences.get('category'):
            results = [item for item in results if item.get('category', '').lower() == preferences['category'].lower()]
        
        if preferences.get('max_price'):
            results = [item for item in results if item.get('price', 0) <= preferences['max_price']]
        
        if preferences.get('spicy'):
            results = [item for item in results if 'spicy' in f"{item['name']} {item['description']}".lower()]
        
        if preferences.get('vegetarian'):
            # Simple check - no meat keywords
            meat_keywords = ['chicken', 'lamb', 'beef', 'fish', 'meat']
            results = [
                item for item in results
                if not any(meat in f"{item['name']} {item['description']}".lower() for meat in meat_keywords)
            ]
        
        return results[:5]  # Return top 5 recommendations
    
    def format_items_for_ai(self, items: List[Dict]) -> str:
        """Format items into a string for AI prompt"""
        if not items:
            return "No matching dishes found."
        
        formatted = []
        for item in items:
            allergen_text = f" (Contains: {', '.join(item.get('allergens', []))})" if item.get('allergens') else ""
            calorie_text = f" | {item['calories']} kcal" if item.get('calories') else ""
            formatted.append(
                f"- {item['name']}: {item['description']} - ${item['price']} {calorie_text} {allergen_text}"
            )
        
        return "\n".join(formatted)