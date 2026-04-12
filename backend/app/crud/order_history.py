from sqlalchemy.orm import Session, joinedload
from app.models.selection import Selection, SelectionStatus, SelectionItem

def get_customer_order_history(db: Session, customer_id: int, skip: int=0, limit: int=100) -> list[Selection]:
    return db.query(Selection).filter(
        Selection.customer_id == customer_id,
        Selection.status == SelectionStatus.FINALIZED
    ).options(
        joinedload(Selection.items).joinedload(SelectionItem.menu_item)
    ).order_by(Selection.finalized_at.desc()).offset(skip).limit(limit).all()

def get_customer_order_by_id(db: Session, customer_id: int, selection_id: int) -> Selection | None:
    return db.query(Selection).filter(
        Selection.id == selection_id,
        Selection.customer_id == customer_id,
        Selection.status == SelectionStatus.FINALIZED
    ).options(
        joinedload(Selection.items).joinedload(SelectionItem.menu_item)
    ).first()

def get_restaurant_order_history(db: Session, restaurant_id: int, skip: int=0, limit: int=100) -> list[Selection]:
    # Get all orders for a restaurant, latest first
    return db.query(Selection).filter(
        Selection.restaurant_id == restaurant_id
    ).options(
        joinedload(Selection.items).joinedload(SelectionItem.menu_item)
    ).order_by(Selection.created_at.desc()).offset(skip).limit(limit).all()

# link (guest places order then logs in) (later if needed)