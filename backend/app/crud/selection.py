from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timezone
from app.models.selection import Selection, SelectionItem, SelectionStatus
from app.crud import menu as menu_crud
from app.crud import session as session_crud

# CRUD operations for selection (cart)

# Get selection by ID
def get_selection_by_id(db: Session, selection_id: int):
    return db.query(Selection).filter(Selection.id == selection_id).first()

# Get pending selection or create new one
def get_or_create_selection(db: Session, session_id: str):
    selection = db.query(Selection).filter(
        and_(
            Selection.session_id == session_id, 
            Selection.status == SelectionStatus.PENDING
        )
    ).first()
    
    if not selection:
        # Get session to inherit customer_id
        session = session_crud.get_session_by_id(db, session_id)
        
        selection = Selection(
            session_id=session_id,
            customer_id=session.customer_id if session else None  # Inherit from session
        ) 
        db.add(selection)
        db.commit()
        db.refresh(selection)
    
    return selection


# Mark selection as finalized
def finalize_selection(db: Session, selection: Selection):
    if selection.status == SelectionStatus.FINALIZED:
        raise ValueError("Selection is already finalized")
    if not selection.items:
        raise ValueError("Cart is empty")
    
    selection.status = SelectionStatus.FINALIZED
    selection.finalized_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(selection)
    return selection


# Delete selection
def delete_selection(db: Session, selection: Selection):
    if selection.status == SelectionStatus.FINALIZED:
        raise ValueError("Cannot delete a finalized selection")

    db.delete(selection)
    db.commit()
    return True


# CRUD operations for selection items

# Get selection item by ID
def get_selection_item_by_id(db: Session, item_id: int):
    return db.query(SelectionItem).filter(SelectionItem.id == item_id).first()


# Add item to selection
def add_item_to_selection(db: Session, selection: Selection, menu_item_id: int, quantity: int, notes: str | None = None):
    # Validate selection is not finalized
    if selection.status == SelectionStatus.FINALIZED:
        raise ValueError("Cannot modify finalized selection")
    
    # Get and validate menu item
    menu_item = menu_crud.get_menu_item(db, menu_item_id)
    if not menu_item:
        raise ValueError("Menu item not found")
    if not menu_item.is_available:
        raise ValueError("Menu item not available") 
    
    # Set restaurant on first item
    if selection.restaurant_id is None:
        selection.restaurant_id = menu_item.restaurant_id
        db.commit()
    # Enforce same-restaurant rule
    elif selection.restaurant_id != menu_item.restaurant_id:
        raise ValueError("Cannot mix items from different restaurants")
    
    # Check if item already exists
    existing = db.query(SelectionItem).filter(
        SelectionItem.selection_id == selection.id,
        SelectionItem.menu_item_id == menu_item_id
    ).first()
    
    if existing:
        # Increment quantity
        existing.quantity += quantity
        if notes:
            existing.notes = notes
        db.commit()
        db.refresh(existing)
        return existing
    else:
        item = SelectionItem(
            selection_id=selection.id,
            menu_item_id=menu_item_id,
            quantity=quantity,
            notes=notes
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

# Update item quantity and notes
def update_selection_item(db: Session, item_id: int, quantity: int | None = None, notes: str | None = None):
    item = get_selection_item_by_id(db, item_id)
    if not item:
        raise ValueError("Item not found")
    
    if item.selection.status == SelectionStatus.FINALIZED:
        raise ValueError("Cannot modify finalized selection")
    
    # Delete if quantity = 0
    if quantity == 0:
        db.delete(item)
        db.commit()
        return
    
    # Update item
    if quantity is not None:
        item.quantity = quantity
    if notes is not None:
        item.notes = notes
    db.commit()
    db.refresh(item)

# Delete selection item
def delete_selection_item(db: Session, item_id: int):
    item = get_selection_item_by_id(db, item_id)
    if not item:
        raise ValueError("Item not found")

    if item.selection.status == SelectionStatus.FINALIZED:
        raise ValueError("Cannot modify finalized selection")
    
    db.delete(item)
    db.commit()


