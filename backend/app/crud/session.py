from sqlalchemy.orm import Session
from app.models.session import CustomerSession
from app.schemas.session import SessionCreate

# CRUD operations for customer sessions

# Get session by session_id
def get_session_by_id(db: Session, session_id: str):
    return db.query(CustomerSession).filter(CustomerSession.session_id == session_id).first()

# Create a new customer session
def create_session(db: Session, data: SessionCreate):
    session = CustomerSession(
        session_id=data.session_id,
        restaurant_id=data.restaurant_id,
        language=data.language
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

# Get or create a customer session
def get_or_create_session(db: Session, data: SessionCreate): 
    existing = get_session_by_id(db, data.session_id)
    if existing:
        return existing
    return create_session(db, data)

# Delete a customer session
def delete_session(db: Session, session: CustomerSession):
    db.delete(session)
    db.commit()
    return True