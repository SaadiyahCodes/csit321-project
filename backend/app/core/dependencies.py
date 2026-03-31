from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.core.security import decode_access_token
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_customer_scheme = OAuth2PasswordBearer(tokenUrl="/api/customer/auth/login")

#Admin
#get current user from jwt token
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if payload is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permission. Admin access required"
        )
    return current_user

async def get_admin_restaurant_id(current_user: User = Depends(get_current_admin_user)) -> int:
    if not current_user.restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user has no associated restaurant"
        )
    return current_user.restaurant_id

#Customer
async def get_current_customer(
    token: str = Depends(oauth2_customer_scheme),
    db: Session = Depends(get_db)
) -> Customer:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str | None = payload.get("sub")
    user_type: str | None = payload.get("type")

    if email is None or user_type != "customer":
        raise credentials_exception
    
    customer = db.query(Customer).filter(Customer.email == email).first()
    if customer is None:
        raise credentials_exception
    
    return customer

async def get_current_active_customer(
    current_customer: Customer = Depends(get_current_customer)
) -> Customer:
    if not current_customer.is_active:
        raise HTTPException(status_code=400, detail="Inactive customer account")
    return current_customer

def get_selection_customer(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db)
) -> int | None:
    """
    Extract customer_id from Authorization header if present.
    Used to auto-link selections/orders to logged-in customers.
    Returns None if no token or invalid token (allows guest users).
    """
    if not authorization:
        return None
    
    # Extract token from "Bearer <token>"
    if not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        return None
    
    email: str | None = payload.get("sub")
    user_type: str | None = payload.get("type")
    
    # Only process customer tokens
    if user_type != "customer":
        return None
    
    customer = db.query(Customer).filter(Customer.email == email).first()
    return customer.id if customer else None

def get_optional_customer(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db)
) -> Customer | None:
    """
    Returns the Customer object if a valid customer token is present.
    Returns None for guests. Used where auth is optional (e.g. chatbot).
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        return None
    
    email: str | None = payload.get("sub")
    user_type: str | None = payload.get("type")
    
    if user_type != "customer":
        return None
    
    customer = db.query(Customer).filter(Customer.email == email).first()
    if not customer or not customer.is_active:
        return None
    
    return customer