from sqlalchemy.orm import Session
from app.models.selection import Selection, SelectionStatus

def get_customer_order_history(db: Session, customer_id: int, skip: int=0, limit: int=100) -> list[Selection]:
    return db.query(Selection).filter(
        Selection.customer_id == customer_id,
        Selection.status == SelectionStatus.FINALIZED
    ).order_by(Selection.finalized_at.desc()).offset(skip).limit(limit).all()

def get_customer_order_by_id(db: Session, customer_id: int, selection_id: int) -> Selection | None:
    return db.query(Selection).filter(
        Selection.id == selection_id,
        Selection.customer_id == customer_id,
        Selection.status == SelectionStatus.FINALIZED
    ).first()

# link (guest places order then logs in) (later if needed)