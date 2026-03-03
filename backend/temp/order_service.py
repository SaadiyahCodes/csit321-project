from typing import Dict, List, Optional
from datetime import datetime

class OrderService:
    def __init__(self):
        """Manage customer orders from chatbot"""
        # In-memory orders (keyed by session_id)
        self.orders = {}
    
    def add_item(self, session_id: str, item: Dict, quantity: int = 1, notes: str = None) -> Dict:
        """Add item to customer's order"""
        
        # Get or create order for session
        if session_id not in self.orders:
            self.orders[session_id] = {
                'session_id': session_id,
                'items': [],
                'total': 0.0,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
        
        order = self.orders[session_id]
        
        # Check if item already in order (update quantity)
        existing_item = next((i for i in order['items'] if i['id'] == item['id']), None)
        
        if existing_item:
            existing_item['quantity'] += quantity
            if notes:
                existing_item['notes'] = notes
        else:
            order['items'].append({
                'id': item['id'],
                'name': item['name'],
                'description': item['description'],
                'price': item['price'],
                'quantity': quantity,
                'notes': notes or "",
                'allergens': item.get('allergens', [])
            })
        
        # Recalculate total
        order['total'] = sum(
            item['price'] * item['quantity'] 
            for item in order['items']
        )
        order['updated_at'] = datetime.utcnow().isoformat()
        
        return order
    
    def remove_item(self, session_id: str, item_id: int) -> Dict:
        """Remove item from order"""
        if session_id not in self.orders:
            return {"error": "No order found"}
        
        order = self.orders[session_id]
        order['items'] = [item for item in order['items'] if item['id'] != item_id]
        
        # Recalculate total
        order['total'] = sum(
            item['price'] * item['quantity'] 
            for item in order['items']
        )
        order['updated_at'] = datetime.utcnow().isoformat()
        
        return order
    
    def get_order(self, session_id: str) -> Optional[Dict]:
        """Get current order"""
        return self.orders.get(session_id)
    
    def clear_order(self, session_id: str):
        """Clear order"""
        if session_id in self.orders:
            del self.orders[session_id]
    
    def get_order_summary(self, session_id: str) -> str:
        """Get formatted order summary for display"""
        order = self.get_order(session_id)
        
        if not order or not order['items']:
            return "Your cart is empty."
        
        summary = "🛒 Your Order:\n\n"
        for item in order['items']:
            summary += f"• {item['quantity']}x {item['name']} (${item['price']})\n"
            if item['notes']:
                summary += f"  Note: {item['notes']}\n"
        
        summary += f"\n💰 Total: ${order['total']:.2f}"
        
        return summary

# Global instance
order_service = OrderService()