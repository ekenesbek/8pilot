from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ....core.dependencies import get_current_user, get_current_active_user, get_current_admin_user
from ....core.database import get_db
from ....services.user_service import UserService
from ....models.user import (
    UserCreate, UserResponse, UserUpdate, UserLogin, 
    UserLoginResponse, Token
)

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    user_service = UserService(db)
    user = user_service.create_user(user_data)
    return UserResponse.model_validate(user)

@router.post("/login", response_model=UserLoginResponse)
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user and get access token"""
    user_service = UserService(db)
    return user_service.login_user(user_data)

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user = Depends(get_current_active_user)
):
    """Get current user information"""
    return UserResponse.model_validate(current_user)

@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_data: UserUpdate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    user_service = UserService(db)
    updated_user = user_service.update_user(current_user.id, user_data)
    return UserResponse.model_validate(updated_user)

from pydantic import BaseModel

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/me/change-password")
def change_password(
    password_data: PasswordChangeRequest,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change current user password"""
    user_service = UserService(db)
    success = user_service.change_password(
        current_user.id, 
        password_data.current_password, 
        password_data.new_password
    )
    if success:
        return {"message": "Password changed successfully"}
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to change password"
    )

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    user_service = UserService(db)
    # This would need to be implemented in UserService
    # For now, return empty list
    return []

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get user by ID (admin only)"""
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse.model_validate(user)

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user_by_id(
    user_id: int,
    user_data: UserUpdate,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user by ID (admin only)"""
    user_service = UserService(db)
    updated_user = user_service.update_user(user_id, user_data)
    return UserResponse.model_validate(updated_user)

@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: int,
    current_user = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Deactivate user account (admin only)"""
    user_service = UserService(db)
    success = user_service.deactivate_user(user_id)
    if success:
        return {"message": "User deactivated successfully"}
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to deactivate user"
    )

@router.post("/refresh", response_model=Token)
def refresh_token(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    user_service = UserService(db)
    access_token = user_service.create_access_token(
        data={"sub": current_user.email, "user_id": current_user.id}
    )
    return {"access_token": access_token, "token_type": "bearer"}
