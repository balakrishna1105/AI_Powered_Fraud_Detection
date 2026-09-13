import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.models.entities import User
from app.models.enums import UserRole, UserStatus
from app.schemas.users import UserCreate, UserUpdate, UserOut
from app.auth.security import get_password_hash
from app.services.audit_service import log_audit_event

class UserService:
    @staticmethod
    def get_users_paginated(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        role: Optional[UserRole] = None,
        status: Optional[UserStatus] = None
    ) -> Tuple[List[User], int]:
        query = db.query(User)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.department.ilike(search_term)
                )
            )
        if role:
            query = query.filter(User.role == role)
        if status:
            query = query.filter(User.status == status)

        total = query.count()
        users = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        return users, total

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email.ilike(email)).first()

    @staticmethod
    def create_user(db: Session, user_in: UserCreate, current_user: Optional[User] = None) -> User:
        user_id = f"USR-{uuid.uuid4().hex[:6].upper()}"
        new_user = User(
            id=user_id,
            email=user_in.email.lower().strip(),
            password_hash=get_password_hash(user_in.password),
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            role=user_in.role,
            department=user_in.department,
            status=user_in.status,
            created_at=datetime.utcnow()
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        log_audit_event(
            db=db,
            user=current_user,
            action="USER_CREATED",
            resource="USERS",
            resource_id=new_user.id,
            new_value={"email": new_user.email, "role": new_user.role.value, "department": new_user.department}
        )
        return new_user

    @staticmethod
    def update_user(db: Session, user_id: str, user_in: UserUpdate, current_user: User) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        prev = {"first_name": user.first_name, "last_name": user.last_name, "role": user.role.value, "status": user.status.value, "department": user.department}

        if user_in.first_name is not None:
            user.first_name = user_in.first_name
        if user_in.last_name is not None:
            user.last_name = user_in.last_name
        if user_in.role is not None:
            user.role = user_in.role
        if user_in.department is not None:
            user.department = user_in.department
        if user_in.status is not None:
            user.status = user_in.status

        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)

        log_audit_event(
            db=db,
            user=current_user,
            action="USER_UPDATED",
            resource="USERS",
            resource_id=user.id,
            previous_value=prev,
            new_value={"first_name": user.first_name, "last_name": user.last_name, "role": user.role.value, "status": user.status.value}
        )
        return user

    @staticmethod
    def update_status(db: Session, user_id: str, status: UserStatus, current_user: User) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        old_status = user.status
        user.status = status
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)

        log_audit_event(
            db=db,
            user=current_user,
            action="USER_STATUS_CHANGED",
            resource="USERS",
            resource_id=user.id,
            previous_value={"status": old_status.value},
            new_value={"status": status.value}
        )
        return user

    @staticmethod
    def reset_password(db: Session, user_id: str, new_pass: str, current_user: User) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        user.password_hash = get_password_hash(new_pass)
        user.updated_at = datetime.utcnow()
        db.commit()

        log_audit_event(
            db=db,
            user=current_user,
            action="USER_PASSWORD_RESET",
            resource="USERS",
            resource_id=user.id
        )
        return True

    @staticmethod
    def delete_user(db: Session, user_id: str, current_user: User) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        log_audit_event(
            db=db,
            user=current_user,
            action="USER_DELETED",
            resource="USERS",
            resource_id=user.id,
            previous_value={"email": user.email, "role": user.role.value}
        )

        db.delete(user)
        db.commit()
        return True
