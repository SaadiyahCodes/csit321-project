#app/routers/customer_profile.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.customer import Customer
from app.schemas.customer_profile import ProfileResponse, ProfileUpdate, available_allergens, available_dietary_preferences
from app.core.dependencies import get_current_active_customer
from app.crud import customer_profile as profile_crud
from app.services.translation_service import translation_service

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
    
    #Attach customer fields for the response
    profile.name = current_customer.name
    profile.email = current_customer.email
    profile.phone_number = current_customer.phone_number
    return profile

#UPDATE CUSTOMER PROFILE
@router.put("/", response_model=ProfileResponse)
async def update_customer_profile(
    profile_update: ProfileUpdate,
    current_customer: Customer = Depends(get_current_active_customer),
    db: Session = Depends(get_db)
):
    if profile_update.name is not None:
        current_customer.name = profile_update.name
    if profile_update.phone_number is not None:
        current_customer.phone_number = profile_update.phone_number
    db.commit()
    db.refresh(current_customer)

    updated_profile = profile_crud.update_customer_profile(db, current_customer.id, profile_update)
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )
    
    updated_profile.name = current_customer.name
    updated_profile.email = current_customer.email
    updated_profile.phone_number = current_customer.phone_number
    return updated_profile

# Get available allergens and dietary preferences
@router.get("/options")
async def get_profile_options(lang: str = "en"):
    if lang == "en":
        return {
            "available_allergens": available_allergens,
            "available_dietary_preferences": available_dietary_preferences,
        }

    all_strings = available_allergens + available_dietary_preferences
    results = {}
    for text in all_strings:
        result = translation_service.translate_text(text, lang, use_gemini=False)
        results[text] = result.get("translated_text", text)

    return {
        "available_allergens": [results.get(a, a) for a in available_allergens],
        "available_dietary_preferences": [results.get(d, d) for d in available_dietary_preferences],
    }