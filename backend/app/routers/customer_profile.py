from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.customer import Customer
from app.schemas.customer_profile import ProfileResponse, ProfileUpdate, available_allergens, available_dietary_preferences
from app.core.dependencies import get_current_active_customer
from app.crud import customer_profile as profile_crud

router = APIRouter(prefix="/api/customer/profile", tags=["customer-profile"])

#GET CUSTOMER PROFILE
@router.get("/", response_model=ProfileResponse)
async def get_customer_profile(
    current_customer: Customer = Depends(get_current_active_customer),
    db: Session = Depends(get_db)
):
    profile = profile_crud.get_customer_profile(db, current_customer.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )
    return profile

#UPDATE CUSTOMER PROFILE
@router.put("/", response_model=ProfileResponse)
async def update_customer_profile(
    profile_update: ProfileUpdate,
    current_customer: Customer = Depends(get_current_active_customer),
    db: Session = Depends(get_db)
):
    
    updated_profile = profile_crud.update_customer_profile(db, current_customer.id, profile_update)
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )
    return updated_profile

# Get available allergens and dietary preferences
@router.get("/options")
async def get_profile_options():
    return {
        "available_allergens": available_allergens,
        "available_dietary_preferences": available_dietary_preferences
    }