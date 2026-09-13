from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.models.enums import ReportStatus, ReportType

class ReportJobCreate(BaseModel):
    title: str
    report_type: ReportType
    filters: Dict[str, Any] = {}
    file_format: str = "CSV"  # CSV, EXCEL, PDF

class ReportJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    report_type: ReportType
    status: ReportStatus
    filters: Dict[str, Any] = {}
    file_format: str
    file_path: Optional[str] = None
    row_count: int
    created_by: str
    created_at: datetime
    completed_at: Optional[datetime] = None

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    user_email: str
    user_id: Optional[str] = None
    action: str
    resource: str
    resource_id: Optional[str] = None
    previous_value: Optional[Any] = None
    new_value: Optional[Any] = None
    ip_address: str
    session_info: Optional[str] = None

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    message: str
    notification_type: str
    recipient_id: Optional[str] = None
    recipient_role: Optional[str] = None
    is_read: bool
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    created_at: datetime

class SystemSettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    value: str
    description: Optional[str] = None
    updated_by: str
    updated_at: datetime
