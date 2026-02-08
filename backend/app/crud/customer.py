from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.models.customer_profile import CustomerProfile
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.core.security import get_password_hash

def get_customer_by_email(db: Session, email: str) -> Customer | None:
    return db.query(Customer).filter(Customer.email == email).first()

def get_customer_by_id(db: Session, customer_id: int) -> Customer | None:
    return db.query(Customer).filter(Customer.id == customer_id).first()

def create_customer(db: Session, customer: CustomerCreate) -> Customer:
    db_customer = Customer(
        name=customer.name,
        email=customer.email,
        hashed_password=get_password_hash(customer.password),
        phone_number=customer.phone_number,
        is_active=True,
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    # Auto-create an empty profile for the new customer
    db_profile = CustomerProfile(
        customer_id=db_customer.id,
        allergens=[],
        dietary_preferences=[],
        notes=None,
    )
    db.add(db_profile)
    db.commit() 
    db.refresh(db_profile)

    return db_customer

def update_customer(db: Session, customer_id: int, customer_update: CustomerUpdate) -> Customer | None:
    db_customer = get_customer_by_id(db, customer_id)
    if not db_customer:
        return None
    
    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
        
    db.commit()
    db.refresh(db_customer)
    return db_customer