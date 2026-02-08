from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.customer import Customer
from app.schemas.selection import SelectionResponse
from app.core.dependencies import get_current_active_customer
from app.crud import order_history as order_crud

router = APIRouter(prefix="/api/customer/orders", tags=["customer-orders"])

#GET CUSTOMER ORDER HISTORY
@router.get("/history", response_model=list[SelectionResponse])
async def get_customer_order_history(
    skip: int = 0,
    limit: int = 100,
    current_customer: Customer = Depends(get_current_active_customer),
    db: Session = Depends(get_db)
):
    orders = order_crud.get_customer_order_history(db, current_customer.id, skip, limit)
    return orders

#GET CUSTOMER ORDER BY ID
@router.get("/history/{order_id}", response_model=SelectionResponse)
async def get_customer_order_by_id(
    order_id: int,
    current_customer: Customer = Depends(get_current_active_customer),
    db: Session = Depends(get_db)
):
    order = order_crud.get_customer_order_by_id(db, order_id, current_customer.id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order