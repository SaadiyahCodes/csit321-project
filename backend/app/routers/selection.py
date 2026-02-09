from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.selection import(
    SelectionItemAdd,
    SelectionItemUpdate,
    SelectionResponse, 
    SelectionFinalizeResponse
)
from app.crud import selection as selection_crud
from app.crud import session as session_crud
from app.services import qr_service
from app.models.selection import SelectionStatus

router = APIRouter(prefix="/api/selections", tags=["selections"])

# Create or get pending selection (cart) for a customer session
@router.post("/", response_model=SelectionResponse, status_code=201)
def create_or_get_selection(session_id: str, db: Session = Depends(get_db)):
    if not session_crud.get_session_by_id(db, session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return selection_crud.get_or_create_selection(db, session_id)


# Get selection by ID with all items and calculated total
@router.get("/{selection_id}", response_model=SelectionResponse)
def get_selection(selection_id: int, session_id: str, db: Session = Depends(get_db)):
    selection = selection_crud.get_selection_by_id(db, selection_id)
    if not selection or selection.session_id != session_id:
        raise HTTPException(status_code=404, detail="Selection not found")
    return selection


# Delete selection
@router.delete("/{selection_id}", status_code=204)
def delete_selection(selection_id: int, session_id: str, db: Session = Depends(get_db)):
    selection = selection_crud.get_selection_by_id(db, selection_id)
    if not selection or selection.session_id != session_id:
        raise HTTPException(status_code=404, detail="Selection not found")
    try:
        selection_crud.delete_selection(db, selection)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return


# Add item to selection
@router.post("/{selection_id}/items", response_model=SelectionResponse)
def add_item(selection_id: int, session_id: str, data: SelectionItemAdd, db: Session = Depends(get_db)):
    selection = selection_crud.get_selection_by_id(db, selection_id)
    if not selection or selection.session_id != session_id:
        raise HTTPException(status_code=404, detail="Selection not found")

    try:
        selection_crud.add_item_to_selection(db, selection, data.menu_item_id, data.quantity, data.notes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    db.refresh(selection)
    return selection

# Update selection item
@router.put("/items/{item_id}", response_model=SelectionResponse)
def update_selection_item(item_id: int, session_id: str, data: SelectionItemUpdate, db: Session = Depends(get_db)):
    item = selection_crud.get_selection_item_by_id(db, item_id)
    if not item or item.selection.session_id != session_id:
        raise HTTPException(status_code=404, detail="Item not found")

    selection = item.selection
    
    try:
        selection_crud.update_selection_item(db, item_id, data.quantity, data.notes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    db.refresh(selection)
    return selection

# Remove item from selection
@router.delete("/items/{item_id}", response_model=SelectionResponse)
def delete_selection_item(item_id: int, session_id: str, db: Session = Depends(get_db)):
    item = selection_crud.get_selection_item_by_id(db, item_id)
    if not item or item.selection.session_id != session_id:
        raise HTTPException(status_code=404, detail="Item not found")
    
    selection = item.selection
    
    try:
        selection_crud.delete_selection_item(db, item_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    db.refresh(selection)
    return selection


#Finalize selections

@router.post("/{selection_id}/finalize", response_model=SelectionFinalizeResponse)
def finalize_order(selection_id: int, session_id: str, db: Session = Depends(get_db)):
    selection = selection_crud.get_selection_by_id(db, selection_id)
    if not selection or selection.session_id != session_id:
        raise HTTPException(status_code=404, detail="Selection not found")
    
    #link to customer if session has one
    session = session_crud.get_session_by_id(db, session_id)
    print(f"🔍 Finalizing - Session ID: {session_id}")
    print(f"🔍 Session customer_id: {session.customer_id if session else 'NO SESSION'}")
    print(f"🔍 Selection customer_id BEFORE: {selection.customer_id}")

    if session and session.customer_id:
        selection.customer_id = session.customer_id
        db.commit()
        db.refresh(selection)
        print(f"🔍 Selection customer_id AFTER: {selection.customer_id}")
    else:
        print(f"❌ NOT LINKING - Session has no customer_id")

    try:
        selection_crud.finalize_selection(db, selection)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Generate comprehensive response with all items
    response = SelectionResponse.model_validate(selection)
    
    # Build detailed order data for QR code
    qr_payload = {
        "selection_id": selection.id,
        "restaurant_id": selection.restaurant_id,
        "total_price": response.total_price,
        "item_count": response.item_count,
        "finalized_at": selection.finalized_at.isoformat(),
        "items": [
            {
                "name": item.menu_item.name,
                "quantity": item.quantity,
                "price": item.menu_item.price,
                "item_total": item.item_total,
                "notes": item.notes
            }
            for item in response.items
        ]
    }
    
    qr_code = qr_service.generate_qr_code(qr_payload)
    
    return SelectionFinalizeResponse(
        selection_id=selection.id,
        qr_code=qr_code,
        total_price=response.total_price,
        item_count=response.item_count,
        finalized_at=selection.finalized_at
    )


#view selections (for qr code)
# app/routers/selection.py (add this new endpoint)

@router.get("/view/{selection_id}", response_model=SelectionResponse)
def view_order_details(selection_id: int, db: Session = Depends(get_db)):
    """
    Public endpoint for waiters to view order details
    No session_id required - anyone can view finalized orders
    """
    selection = selection_crud.get_selection_by_id(db, selection_id)
    if not selection:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if selection.status != SelectionStatus.FINALIZED:
        raise HTTPException(status_code=400, detail="Order not finalized yet")
    
    return selection