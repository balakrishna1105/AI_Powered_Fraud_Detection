from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.security import verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.models.entities import User
from app.models.enums import UserStatus
from app.schemas.users import LoginRequest, TokenResponse, UserPayload, UserOut
from app.schemas.common import APIResponse
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.post("/login", response_model=APIResponse[TokenResponse])
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(login_data.email.strip())).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.status.value}"
        )

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(subject=user.id, role=user.role.value)
    
    log_audit_event(
        db=db,
        user=user,
        action="USER_LOGIN",
        resource="AUTH",
        resource_id=user.id
    )

    return APIResponse(
        success=True,
        data=TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserPayload(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                role=user.role,
                department=user.department,
                status=user.status
            )
        ),
        message="Login successful"
    )

@router.get("/me", response_model=APIResponse[UserOut])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return APIResponse(
        success=True,
        data=UserOut.model_validate(current_user),
        message="Profile retrieved"
    )

@router.post("/logout", response_model=APIResponse[dict])
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit_event(
        db=db,
        user=current_user,
        action="USER_LOGOUT",
        resource="AUTH",
        resource_id=current_user.id
    )
    return APIResponse(
        success=True,
        data={"logged_out": True},
        message="Successfully logged out"
    )
