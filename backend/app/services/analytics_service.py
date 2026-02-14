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
        
        start_date = datetime.now() - timedelta(days=days)
        
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
        
        return {
            "total_conversations": total_convs,
            "total_orders": total_orders,
            "conversion_rate": round(conversion, 1),
            "chatbot_aov": round(float(chatbot_aov), 2),
            "manual_aov": manual_aov,
            "aov_increase_percent": round(((chatbot_aov - manual_aov) / manual_aov) * 100, 1) if manual_aov > 0 else 0,
            "upsell_revenue": round(upsell_revenue, 2)
        }
    
    def get_top_questions(self, restaurant_id: int, days: int = 7):
        """Extract most common questions"""
        
        start_date = datetime.now() - timedelta(days=days)
        
        messages = self.db.query(ChatHistory.content).join(
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
        }
        
        for (msg,) in messages:
            lower = msg.lower()
            if "spicy" in lower or "spice" in lower:
                categories["Is this spicy?"] += 1
            if "dairy" in lower or "milk" in lower:
                categories["Does this have dairy?"] += 1
            if "nut" in lower or "peanut" in lower:
                categories["Does this have nuts?"] += 1
            if "vegetarian" in lower or "vegan" in lower:
                categories["Is this vegetarian?"] += 1
            if "size" in lower or "portion" in lower:
                categories["What's the portion size?"] += 1
            if "gluten" in lower:
                categories["Is this gluten-free?"] += 1
        
        sorted_q = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        return [{"question": q, "count": c} for q, c in sorted_q if c > 0]
    
    def get_conversation_timeline(self, restaurant_id: int, days: int = 7):
        """Daily conversation and order counts"""
        
        start_date = datetime.now() - timedelta(days=days)
        timeline = []
        
        for i in range(days):
            date = start_date + timedelta(days=i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
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
        
        start_date = datetime.now() - timedelta(days=days)
        
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
            'fr': 'French'
        }
        
        return [
            {"name": lang_names.get(lang, lang), "value": count}
            for lang, count in lang_counts
        ]
    
    def generate_alerts(self, restaurant_id: int, days: int = 7):
        """Generate actionable alerts"""
        
        alerts = []
        questions = self.get_top_questions(restaurant_id, days)
        kpi = self.get_kpi_metrics(restaurant_id, days)
        total_convs = kpi['total_conversations']
        
        # ALERT 1: High allergen questions
        if total_convs > 0:
            for q in questions:
                if "dairy" in q['question'].lower() or "nuts" in q['question'].lower():
                    percent = (q['count'] / total_convs * 100)
                    if percent > 20:
                        alerts.append({
                            "severity": "yellow",
                            "title": "High Allergen Inquiries",
                            "message": f"{percent:.0f}% of customers ask about allergens",
                            "action": "Add allergen badges to menu items"
                        })
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