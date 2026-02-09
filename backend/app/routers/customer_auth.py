from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.customer import Customer
from app.models.session import CustomerSession
from app.models.selection import Selection
from app.schemas.auth import Token
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_active_customer
from app.crud import customer as customer_crud

router = APIRouter(prefix="/api/customer/auth", tags=["customer-authentication"])

#CUSTOMER SIGNUP
@router.post("/signup", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def signup_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db)
):
    # Check if customer with the same email already exists
    existing_customer = customer_crud.get_customer_by_email(db, customer_data.email)
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new customer
    new_customer = customer_crud.create_customer(db, customer_data)
    return new_customer

#CUSTOMER LOGIN
@router.post("/login", response_model=Token)
async def login_customer(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session_id: str | None = None,
    db: Session = Depends(get_db)
):
    customer = customer_crud.get_customer_by_email(db, form_data.username)

    if not customer or not verify_password(form_data.password, customer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer account is inactive",
        )
    
    #link current session to customer if session_id is provided
    if session_id:
        session = db.query(CustomerSession).filter(CustomerSession.session_id == session_id).first()

        if session and not session.customer_id:
            session.customer_id = customer.id
            db.commit()

            #also update any selections (cart) linked to this session
            selections = db.query(Selection).filter(Selection.session_id == session_id,
                                                    Selection.customer_id == None).all()
            
            for selection in selections:
                selection.customer_id = customer.id
                
            db.commit()
    
    access_token = create_access_token(data={"sub": customer.email, "type": "customer"})
    return {"access_token": access_token, "token_type": "bearer"}

#GET CURRENT CUSTOMER
@router.get("/me", response_model=CustomerResponse)
async def get_current_customer_info(
    current_customer: Customer = Depends(get_current_active_customer)
) -> Customer:
    return current_customer

#UPDATE CURRENT CUSTOMER
@router.put("/me", response_model=CustomerResponse)
async def update_current_customer_info(
    customer_update: CustomerUpdate,
    current_customer: Customer = Depends(get_current_active_customer),
    db: Session = Depends(get_db)
): 
    updated_customer = customer_crud.update_customer(db, current_customer.id, customer_update)
    if not updated_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return updated_customer

#LOGOUT
@router.post("/logout")
async def logout_customer():
    # For JWT-based auth, logout is handled on the client side by deleting the token.
    return {"message": "Logout successful"}