#app/crud/customer_profile.py
from sqlalchemy.orm import Session
from app.models.customer_profile import CustomerProfile
from app.schemas.customer_profile import ProfileCreate, ProfileUpdate

def get_customer_profile(db: Session, customer_id: int) -> CustomerProfile | None:
    return db.query(CustomerProfile).filter(CustomerProfile.customer_id == customer_id).first()

def create_customer_profile(db: Session, customer_id: int, profile: ProfileCreate) -> CustomerProfile:
    db_profile = CustomerProfile(
        customer_id=customer_id,
        allergens=profile.allergens or [],
        dietary_preferences=profile.dietary_preferences or [],
        notes=profile.notes,
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def update_customer_profile(db: Session, customer_id: int, profile_update: ProfileUpdate) -> CustomerProfile | None:
    db_profile = get_customer_profile(db, customer_id)
    if not db_profile:
        return None
    
    #Exclude customer-level fields — those are handled in the router
    update_data = profile_update.model_dump(exclude_unset=True, exclude={"name", "phone_number"})
    for field, value in update_data.items():
        setattr(db_profile, field, value)
        
    db.commit()
    db.refresh(db_profile)
    return db_profile