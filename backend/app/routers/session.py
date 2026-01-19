from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.session import SessionCreate, SessionResponse
from app.crud import session as session_crud

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Create or get existing customer session
@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_or_get_session(data: SessionCreate, db: Session = Depends(get_db)):
    return session_crud.get_or_create_session(db, data)

# Get customer session by session_id
@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = session_crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# Delete customer session
@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: str, db: Session = Depends(get_db)):
    session = session_crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_crud.delete_session(db, session)