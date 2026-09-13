from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_role
from app.models.entities import User
from app.models.enums import UserRole, UserStatus
from app.services.user_service import UserService
from app.schemas.users import UserCreate, UserUpdate, UserOut, UserStatusUpdate, PasswordResetRequest
from app.schemas.common import APIResponse, PaginatedData

router = APIRouter()

@router.get("", response_model=APIResponse[PaginatedData[UserOut]])
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    users, total = UserService.get_users_paginated(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        role=role,
        status=status
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return APIResponse(
        success=True,
        data=PaginatedData(
            items=[UserOut.model_validate(u) for u in users],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )

@router.get("/{user_id}", response_model=APIResponse[UserOut])
def get_user_by_id(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{user_id}' not found")
    return APIResponse(success=True, data=UserOut.model_validate(user))

@router.post("", response_model=APIResponse[UserOut])
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    existing = UserService.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    new_user = UserService.create_user(db, user_in, current_user=current_user)
    return APIResponse(success=True, data=UserOut.model_validate(new_user), message="User created successfully")

@router.put("/{user_id}", response_model=APIResponse[UserOut])
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = UserService.update_user(db, user_id, user_in, current_user=current_user)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{user_id}' not found")
    return APIResponse(success=True, data=UserOut.model_validate(user), message="User updated successfully")

@router.patch("/{user_id}/status", response_model=APIResponse[UserOut])
def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = UserService.update_status(db, user_id, payload.status, current_user=current_user)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{user_id}' not found")
    return APIResponse(success=True, data=UserOut.model_validate(user), message="Status updated successfully")

@router.post("/{user_id}/reset-password", response_model=APIResponse[dict])
def reset_password(
    user_id: str,
    payload: PasswordResetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    success = UserService.reset_password(db, user_id, payload.new_password, current_user=current_user)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{user_id}' not found")
    return APIResponse(success=True, data={"reset": True}, message="Password reset successfully")

@router.delete("/{user_id}", response_model=APIResponse[dict])
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    success = UserService.delete_user(db, user_id, current_user=current_user)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{user_id}' not found")
    return APIResponse(success=True, data={"deleted": True}, message="User deleted successfully")
