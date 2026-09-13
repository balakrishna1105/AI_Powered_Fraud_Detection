import uuid
import json
from datetime import datetime
from typing import Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import AuditLog, Notification, User

def log_audit_event(
    db: Session,
    user: Optional[User],
    action: str,
    resource: str,
    resource_id: Optional[str] = None,
    previous_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    ip_address: str = "127.0.0.1",
    session_info: Optional[str] = None
) -> AuditLog:
    user_email = user.email if user else "system"
    user_id = user.id if user else None

    prev_json = json.dumps(previous_value) if previous_value is not None else None
    new_json = json.dumps(new_value) if new_value is not None else None

    audit_entry = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10].upper()}",
        timestamp=datetime.utcnow(),
        user_email=user_email,
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        previous_value_json=prev_json,
        new_value_json=new_json,
        ip_address=ip_address,
        session_info=session_info
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry

def create_notification(
    db: Session,
    title: str,
    message: str,
    notification_type: str = "ALERT",
    recipient_id: Optional[str] = None,
    recipient_role: Optional[str] = None,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None
) -> Notification:
    notif = Notification(
        id=f"NOTIF-{uuid.uuid4().hex[:10].upper()}",
        title=title,
        message=message,
        notification_type=notification_type,
        recipient_id=recipient_id,
        recipient_role=recipient_role,
        is_read=False,
        reference_id=reference_id,
        reference_type=reference_type,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
