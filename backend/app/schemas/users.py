from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.enums import UserRole, UserStatus

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserPayload(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    department: str
    status: UserStatus

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPayload

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: UserRole = UserRole.ANALYST
    department: str = "Risk Operations"
    status: UserStatus = UserStatus.ACTIVE

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    status: Optional[UserStatus] = None

class UserStatusUpdate(BaseModel):
    status: UserStatus

class PasswordResetRequest(BaseModel):
    new_password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    department: str
    status: UserStatus
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
