from sqlalchemy import func, distinct
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.session import CustomerSession
from app.models.selection import Selection, SelectionItem
from app.models.menuitems import MenuItem
from app.models.chat_history import ChatHistory
from app.models.chatbot_order import ChatbotOrder
from app.models.analytics import ChatAnalytics, UpsellAnalytics


class AnalyticsService:
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_kpi_metrics(self, restaurant_id: int, days: int = 7):
        """Calculate KPI cards data"""
        
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
        
        # 1. Total conversations
        total_convs = self.db.query(
            func.count(distinct(ChatHistory.session_id))
        ).join(
            CustomerSession, CustomerSession.session_id == ChatHistory.session_id
        ).filter(
            CustomerSession.restaurant_id == restaurant_id,
            ChatHistory.created_at >= start_date
        ).scalar() or 0
        
        # 2. Total orders
        total_orders = self.db.query(
            func.count(Selection.id)
        ).filter(
            Selection.restaurant_id == restaurant_id,
            Selection.status == "finalized",
            Selection.created_at >= start_date
        ).scalar() or 0
        
        # 3. Conversion rate
        total_sessions = self.db.query(
            func.count(CustomerSession.session_id)
        ).filter(
            CustomerSession.restaurant_id == restaurant_id,
            CustomerSession.created_at >= start_date
        ).scalar() or 0

        #logs
        print(f"🔍 Sessions: {total_sessions}, Orders: {total_orders}, Convs: {total_convs}")

        conversion = (total_orders / total_convs * 100) if total_convs > 0 else 0
        
        # 4. Average order value
        subquery = self.db.query(
            Selection.id,
            func.sum(MenuItem.price * SelectionItem.quantity).label('order_total')
        ).join(
            SelectionItem, SelectionItem.selection_id == Selection.id
        ).join(
            MenuItem, MenuItem.id == SelectionItem.menu_item_id
        ).filter(
            Selection.restaurant_id == restaurant_id,
            Selection.status == "finalized",
            Selection.created_at >= start_date
        ).group_by(Selection.id).subquery()
        
        chatbot_aov = self.db.query(
            func.avg(subquery.c.order_total)
        ).scalar() or 0
        
        # 5. Baseline
        manual_aov = 42.0
        
        # 6. Upsell revenue
        upsell_revenue = 0  # Placeholder

        # 7. Orders originating from chatbot
        chatbot_order_count = self.db.query(
            func.count(ChatbotOrder.id)
        ).join(
            CustomerSession, CustomerSession.session_id == ChatbotOrder.session_id
        ).filter(
            CustomerSession.restaurant_id == restaurant_id,
            ChatbotOrder.confirmed_at >= start_date
        ).scalar() or 0
        
        return {
            "total_conversations": total_convs,
            "total_orders": total_orders,
            "conversion_rate": round(conversion, 1),
            "chatbot_aov": round(float(chatbot_aov), 2),
            "manual_aov": manual_aov,
            "aov_increase_percent": round(((chatbot_aov - manual_aov) / manual_aov) * 100, 1) if manual_aov > 0 else 0,
            "upsell_revenue": round(upsell_revenue, 2),
            "chatbot_order_count": chatbot_order_count
        }
    
    def get_top_questions(self, restaurant_id: int, days: int = 7):
        """Extract most common questions"""
        
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
        
        messages = self.db.query(ChatHistory.content, ChatHistory.extracted_allergens).join(
            CustomerSession, CustomerSession.session_id == ChatHistory.session_id
        ).filter(
            CustomerSession.restaurant_id == restaurant_id,
            ChatHistory.role == 'user',
            ChatHistory.created_at >= start_date
        ).all()
        
        categories = {
            "Is this spicy?": 0,
            "Does this have dairy?": 0,
            "Does this have nuts?": 0,
            "Is this vegetarian?": 0,
            "What's the portion size?": 0,
            "Is this gluten-free?": 0,
            "Does this have shellfish?": 0,
            "Does this have soy?": 0,
            "Does this have eggs?": 0,
            "Does this have fish?": 0,
            "Does this have sesame?": 0,
            "Does this have mustard?": 0,
        }

        for content, extracted_allergens in messages:
            lower = content.lower()

            allergens = extracted_allergens or []
            if any(a in allergens for a in ["dairy", "milk", "lactose"]):
                categories["Does this have dairy?"] += 1
            if any(a in allergens for a in ["nuts", "peanut", "peanuts", "tree nuts"]):
                categories["Does this have nuts?"] += 1
            if any(a in allergens for a in ["gluten", "wheat"]):
                categories["Is this gluten-free?"] += 1
            if any(a in allergens for a in ["shellfish"]):
                categories["Does this have shellfish?"] += 1
            if any(a in allergens for a in ["soy"]):
                categories["Does this have soy?"] += 1
            if any(a in allergens for a in ["eggs"]):
                categories["Does this have eggs?"] += 1
            if any(a in allergens for a in ["fish"]):
                categories["Does this have fish?"] += 1
            if any(a in allergens for a in ["sesame"]):
                categories["Does this have sesame?"] += 1
            if any(a in allergens for a in ["mustard"]):
                categories["Does this have mustard?"] += 1

            if "spicy" in lower or "spice" in lower or "hot" in lower:
                categories["Is this spicy?"] += 1
            if "vegetarian" in lower or "vegan" in lower:
                categories["Is this vegetarian?"] += 1
            if "size" in lower or "portion" in lower or "how big" in lower:
                categories["What's the portion size?"] += 1
            # Keyword fallbacks for allergens not caught by extracted_allergens
            if "shellfish" in lower or "shrimp" in lower or "prawn" in lower or "crab" in lower:
                categories["Does this have shellfish?"] += 1
            if "soy" in lower or "soya" in lower:
                categories["Does this have soy?"] += 1
            if "egg" in lower:
                categories["Does this have eggs?"] += 1
            if "sesame" in lower or "tahini" in lower:
                categories["Does this have sesame?"] += 1
            if "mustard" in lower:
                categories["Does this have mustard?"] += 1
            
        sorted_q = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        return [{"question": q, "count": c} for q, c in sorted_q if c > 0]
    
    def get_conversation_timeline(self, restaurant_id: int, days: int = 7):
        """Daily conversation and order counts"""
        
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        timeline = []
        
        for i in range(days):
            date = today - timedelta(days=days - 1 - i)
            date_start = date
            date_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            convs = self.db.query(
                func.count(distinct(ChatHistory.session_id))
            ).join(
                CustomerSession, CustomerSession.session_id == ChatHistory.session_id
            ).filter(
                CustomerSession.restaurant_id == restaurant_id,
                ChatHistory.created_at >= date_start,
                ChatHistory.created_at <= date_end
            ).scalar() or 0
            
            orders = self.db.query(
                func.count(Selection.id)
            ).filter(
                Selection.restaurant_id == restaurant_id,
                Selection.status == "finalized",
                Selection.created_at >= date_start,
                Selection.created_at <= date_end
            ).scalar() or 0
            
            timeline.append({
                "date": date.strftime("%b %d"),
                "conversations": convs,
                "orders": orders
            })
        
        return timeline
    
    def get_language_distribution(self, restaurant_id: int, days: int = 7):
        """Language usage stats"""
        
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
        
        lang_counts = self.db.query(
            CustomerSession.language,
            func.count(CustomerSession.session_id).label('count')
        ).filter(
            CustomerSession.restaurant_id == restaurant_id,
            CustomerSession.created_at >= start_date
        ).group_by(CustomerSession.language).all()
        
        lang_names = {
            'en': 'English',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'ur': 'Urdu',
            'es': 'Spanish',
            'fr': 'French'
        }
        
        return [
            {"name": lang_names.get(lang, lang), "value": count}
            for lang, count in lang_counts
        ]
    
    def get_top_menu_items(self, restaurant_id: int, days: int = 7, limit: int = 5):
        """
        Top ordered menu items with chatbot vs total order breakdown.
        Returns top `limit` items by total quantity ordered across all finalized selections.
        Each item includes total_orders (all channels) and chatbot_orders (via ChatbotOrder).
        """
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
 
        # All finalized order quantities per menu item
        total_rows = self.db.query(
            MenuItem.id,
            MenuItem.name,
            MenuItem.category,
            MenuItem.price,
            func.sum(SelectionItem.quantity).label("total_qty")
        ).join(
            SelectionItem, SelectionItem.menu_item_id == MenuItem.id
        ).join(
            Selection, Selection.id == SelectionItem.selection_id
        ).filter(
            Selection.restaurant_id == restaurant_id,
            Selection.status == "finalized",
            Selection.created_at >= start_date
        ).group_by(
            MenuItem.id, MenuItem.name, MenuItem.category, MenuItem.price
        ).order_by(
            func.sum(SelectionItem.quantity).desc()
        ).limit(limit).all()
 
        if not total_rows:
            return []
 
        # Chatbot order quantities for those same items
        top_item_ids = [row.id for row in total_rows]
 
        chatbot_rows = self.db.query(
            ChatbotOrder.menu_item_id,
            func.sum(ChatbotOrder.quantity).label("chatbot_qty")
        ).join(
            CustomerSession, CustomerSession.session_id == ChatbotOrder.session_id
        ).filter(
            CustomerSession.restaurant_id == restaurant_id,
            ChatbotOrder.menu_item_id.in_(top_item_ids),
            ChatbotOrder.confirmed_at >= start_date
        ).group_by(ChatbotOrder.menu_item_id).all()
 
        chatbot_map = {row.menu_item_id: int(row.chatbot_qty) for row in chatbot_rows}
 
        result = []
        for row in total_rows:
            total = int(row.total_qty)
            chatbot = chatbot_map.get(row.id, 0)
            result.append({
                "id": row.id,
                "name": row.name,
                "category": row.category,
                "price": round(float(row.price), 2),
                "total_orders": total,
                "chatbot_orders": chatbot,
                "chatbot_percent": min(round((chatbot / total * 100), 1), 100) if total > 0 else 0,
            })
 
        return result
    
    def generate_alerts(self, restaurant_id: int, days: int = 7, kpi: dict = None):
        """Generate actionable alerts"""
        
        alerts = []
        questions = self.get_top_questions(restaurant_id, days)
        if kpi is None:
            kpi = self.get_kpi_metrics(restaurant_id, days)
        total_convs = kpi['total_conversations']
        
        # ALERT 1: High allergen questions — covers all tracked allergens
        ALLERGEN_LABELS = {
            "dairy": "Dairy", "milk": "Dairy", "lactose": "Dairy",
            "nuts": "Nuts", "peanut": "Nuts", "peanuts": "Nuts", "tree nuts": "Nuts",
            "gluten": "Gluten", "wheat": "Gluten",
            "shellfish": "Shellfish", "soy": "Soy", "eggs": "Eggs",
            "fish": "Fish", "sesame": "Sesame", "mustard": "Mustard",
        }

        allergen_counts = {}
        for q in questions:
            lower_q = q['question'].lower()
            for keyword, label in ALLERGEN_LABELS.items():
                if keyword in lower_q:
                    allergen_counts[label] = allergen_counts.get(label, 0) + q['count']

        if total_convs > 0:
            for label, count in sorted(allergen_counts.items(), key=lambda x: x[1], reverse=True):
                percent = (count / total_convs * 100)
                if percent > 15:
                    alerts.append({
                        "severity": "yellow",
                        "title": f"High {label} Allergen Inquiries",
                        "message": f"{percent:.0f}% of customers ask about {label.lower()}",
                        "action": f"Add {label.lower()} allergen badges to relevant menu items"
                    })
                    if len(alerts) >= 3:
                        break
        
        # ALERT 2: Low conversion
        if kpi['conversion_rate'] < 50 and total_convs > 10:
            alerts.append({
                "severity": "red",
                "title": "Low Conversion Rate",
                "message": f"Only {kpi['conversion_rate']}% of sessions result in orders",
                "action": "Review menu clarity and chatbot responses"
            })
        
        # ALERT 3: High AOV
        if kpi['aov_increase_percent'] > 30:
            alerts.append({
                "severity": "green",
                "title": "Chatbot Driving Revenue",
                "message": f"Orders average ${kpi['chatbot_aov']} ({kpi['aov_increase_percent']}% above baseline)",
                "action": "Encourage more customers to use chatbot"
            })
        
        return alerts