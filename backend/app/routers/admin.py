#app/routers/admin.py
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_admin_user
from app.models import User

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/dashboard")
async def admin_dashboard(current_admin: User = Depends(get_current_admin_user)):
    """this is an admin only endpoint
    requires valid JWT Token AND is_admin=True"""
    return {
        "message": f"Welcome to admin dashboard, {current_admin.email}!",
        "user": {
            "email": current_admin.email,
            "is_admin": current_admin.is_admin
        }
    }