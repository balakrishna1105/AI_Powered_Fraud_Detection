import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_role
from app.models.entities import AuditLog, Notification, SystemSetting, User
from app.models.enums import UserRole
from app.schemas.reports import AuditLogOut, NotificationOut, SystemSettingOut, SystemSettingUpdate
from app.schemas.common import APIResponse, PaginatedData

audit_router = APIRouter()
notif_router = APIRouter()
settings_router = APIRouter()

# ----------------- AUDIT LOGS -----------------
@audit_router.get("", response_model=APIResponse[PaginatedData[AuditLogOut]])
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user_email: Optional[str] = None,
    action: Optional[str] = None,
    resource: Optional[str] = None,
    resource_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.ANALYST]))
):
    query = db.query(AuditLog)
    if user_email:
        query = query.filter(AuditLog.user_email.ilike(f"%{user_email}%"))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource:
        query = query.filter(AuditLog.resource.ilike(f"%{resource}%"))
    if resource_id:
        query = query.filter(AuditLog.resource_id == resource_id)

    total = query.count()
    logs = query.order_by(desc(AuditLog.timestamp)).offset((page - 1) * page_size).limit(page_size).all()

    outs = []
    for log in logs:
        prev = None
        new = None
        if log.previous_value_json:
            try:
                prev = json.loads(log.previous_value_json)
            except:
                prev = log.previous_value_json
        if log.new_value_json:
            try:
                new = json.loads(log.new_value_json)
            except:
                new = log.new_value_json

        outs.append(AuditLogOut(
            id=log.id,
            timestamp=log.timestamp,
            user_email=log.user_email,
            user_id=log.user_id,
            action=log.action,
            resource=log.resource,
            resource_id=log.resource_id,
            previous_value=prev,
            new_value=new,
            ip_address=log.ip_address or "127.0.0.1",
            session_info=log.session_info
        ))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return APIResponse(
        success=True,
        data=PaginatedData(
            items=outs,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )

# ----------------- NOTIFICATIONS -----------------
@notif_router.get("", response_model=APIResponse[List[NotificationOut]])
def get_notifications(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        or_(
            Notification.recipient_id == current_user.id,
            Notification.recipient_role == current_user.role.value,
            Notification.recipient_id.is_(None)
        )
    ).order_by(desc(Notification.created_at)).limit(limit).all()

    return APIResponse(
        success=True,
        data=[NotificationOut.model_validate(n) for n in notifs]
    )

@notif_router.patch("/{notif_id}/read", response_model=APIResponse[dict])
def mark_notification_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return APIResponse(success=True, data={"read": True})

@notif_router.get("/unread-count", response_model=APIResponse[dict])
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(Notification).filter(
        Notification.is_read == False,
        or_(
            Notification.recipient_id == current_user.id,
            Notification.recipient_role == current_user.role.value,
            Notification.recipient_id.is_(None)
        )
    ).count()
    return APIResponse(success=True, data={"unread_count": count})

# ----------------- SETTINGS -----------------
@settings_router.get("", response_model=APIResponse[List[SystemSettingOut]])
def get_system_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = db.query(SystemSetting).all()
    return APIResponse(success=True, data=[SystemSettingOut.model_validate(s) for s in settings])

@settings_router.put("/{key}", response_model=APIResponse[SystemSettingOut])
def update_system_setting(
    key: str,
    payload: SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(
            id=f"SET-{key}",
            key=key,
            value=payload.value,
            description=payload.description or "",
            updated_by=current_user.email
        )
        db.add(setting)
    else:
        setting.value = payload.value
        if payload.description:
            setting.description = payload.description
        setting.updated_by = current_user.email

    db.commit()
    db.refresh(setting)
    return APIResponse(success=True, data=SystemSettingOut.model_validate(setting), message="Setting updated")
