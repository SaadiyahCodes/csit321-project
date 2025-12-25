#app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import Token, UserResponse, UserCreate
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.dependencies import get_current_active_user

router = APIRouter(prefix="/api/auth", tags=["authentication"])

#TEMPORARY ADMIN SIGNUP ENDPOINT
@router.post("/signup-admin", response_model=UserResponse)
async def signup_admin(user_data: UserCreate, db: Session = Depends(get_db)):
    #check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    #create admin user
    new_admin = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        is_admin=True,
        is_active=True
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return new_admin

#ADMIN LOGIN ENDPOINT
#takes email and password, return jwt access token
@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    #find user by email
    user = db.query(User).filter(User.email == form_data.username).first()

    #check if user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    #check if user is admin
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    #check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    #create access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
#gets current user
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}