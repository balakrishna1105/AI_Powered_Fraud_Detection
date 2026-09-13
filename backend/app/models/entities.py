import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.enums import (
    UserRole, UserStatus, ClaimStatus, ClaimType,
    RiskLevel, FraudCategory, InvestigationStatus, RuleSeverity, ReportStatus, ReportType
)

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.ANALYST, nullable=False)
    department = Column(String, default="Risk Operations")
    status = Column(SQLEnum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    investigations = relationship("Investigation", back_populates="investigator", foreign_keys="Investigation.investigator_id")
    notes = relationship("InvestigationNote", back_populates="author")

class Member(Base):
    __tablename__ = "members"

    id = Column(String, primary_key=True, index=True)  # e.g. PAT-1001
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    state = Column(String, nullable=False)
    city = Column(String, nullable=False)
    policy_number = Column(String, unique=True, index=True, nullable=False)
    policy_tier = Column(String, default="Comprehensive Health Plan")
    policy_start_date = Column(DateTime, default=utcnow)
    policy_expiry_date = Column(DateTime, nullable=True)
    risk_score = Column(Float, default=15.0)
    created_at = Column(DateTime, default=utcnow)

    claims = relationship("Claim", back_populates="member")

class Provider(Base):
    __tablename__ = "providers"

    id = Column(String, primary_key=True, index=True)  # e.g. PRV-2001
    name = Column(String, index=True, nullable=False)
    provider_type = Column(String, default="Multi-Specialty Hospital")
    state = Column(String, nullable=False)
    city = Column(String, nullable=False)
    address = Column(String, nullable=True)
    risk_score = Column(Float, default=20.0)
    historical_claims_count = Column(Integer, default=0)
    historical_fraud_count = Column(Integer, default=0)
    historical_fraud_rate = Column(Float, default=0.0)
    avg_claim_amount = Column(Float, default=35000.0)
    created_at = Column(DateTime, default=utcnow)

    claims = relationship("Claim", back_populates="provider")

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String, primary_key=True, index=True)  # e.g. CLM-10001
    member_id = Column(String, ForeignKey("members.id"), nullable=False, index=True)
    provider_id = Column(String, ForeignKey("providers.id"), nullable=False, index=True)
    claim_type = Column(SQLEnum(ClaimType), default=ClaimType.INPATIENT, nullable=False)
    claim_status = Column(SQLEnum(ClaimStatus), default=ClaimStatus.SUBMITTED, nullable=False, index=True)
    fraud_category = Column(SQLEnum(FraudCategory), default=FraudCategory.NONE, nullable=False)
    
    claim_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, nullable=True)
    claim_date = Column(DateTime, default=utcnow, index=True)
    admission_date = Column(DateTime, nullable=True)
    discharge_date = Column(DateTime, nullable=True)
    hospitalization_days = Column(Integer, default=1)
    
    diagnosis_codes_raw = Column(Text, default="[]")
    procedure_codes_raw = Column(Text, default="[]")
    
    assigned_investigator_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    member = relationship("Member", back_populates="claims")
    provider = relationship("Provider", back_populates="claims")
    fraud_score = relationship("FraudScore", back_populates="claim", uselist=False)
    indicators = relationship("FraudIndicator", back_populates="claim")
    investigations = relationship("Investigation", back_populates="claim")

    @property
    def diagnosis_codes(self):
        try:
            return json.loads(self.diagnosis_codes_raw)
        except Exception:
            return []

    @diagnosis_codes.setter
    def diagnosis_codes(self, value):
        self.diagnosis_codes_raw = json.dumps(value)

    @property
    def procedure_codes(self):
        try:
            return json.loads(self.procedure_codes_raw)
        except Exception:
            return []

    @procedure_codes.setter
    def procedure_codes(self, value):
        self.procedure_codes_raw = json.dumps(value)

class FraudScore(Base):
    __tablename__ = "fraud_scores"

    id = Column(String, primary_key=True, index=True)
    claim_id = Column(String, ForeignKey("claims.id"), nullable=False, unique=True, index=True)
    risk_score = Column(Float, nullable=False, index=True)  # 0 to 100
    fraud_probability = Column(Float, nullable=False)  # 0.0 to 1.0
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.NORMAL, nullable=False, index=True)
    model_version = Column(String, default="v1.0.0-rules-ml-ensemble")
    explanations_raw = Column(Text, default="[]")
    scored_at = Column(DateTime, default=utcnow)

    claim = relationship("Claim", back_populates="fraud_score")

    @property
    def explanations(self):
        try:
            return json.loads(self.explanations_raw)
        except Exception:
            return []

    @explanations.setter
    def explanations(self, value):
        self.explanations_raw = json.dumps(value)

class FraudIndicator(Base):
    __tablename__ = "fraud_indicators"

    id = Column(String, primary_key=True, index=True)
    claim_id = Column(String, ForeignKey("claims.id"), nullable=False, index=True)
    category = Column(String, nullable=False)
    feature = Column(String, nullable=False)
    impact = Column(String, default="HIGH")
    description = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    claim = relationship("Claim", back_populates="indicators")

class FraudRule(Base):
    __tablename__ = "fraud_rules"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(FraudCategory), nullable=False)
    severity = Column(SQLEnum(RuleSeverity), default=RuleSeverity.HIGH, nullable=False)
    threshold = Column(Float, default=1.0)
    is_active = Column(Boolean, default=True)
    rule_type = Column(String, default="THRESHOLD")
    created_by = Column(String, default="System")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    version = Column(String, default="1.0")

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, index=True)  # e.g. INV-3001
    claim_id = Column(String, ForeignKey("claims.id"), nullable=False, index=True)
    investigator_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    status = Column(SQLEnum(InvestigationStatus), default=InvestigationStatus.NEW, nullable=False, index=True)
    priority = Column(SQLEnum(RiskLevel), default=RiskLevel.HIGH, nullable=False)
    findings = Column(Text, nullable=True)
    final_decision = Column(String, nullable=True)
    decision_rationale = Column(Text, nullable=True)
    recovery_amount = Column(Float, default=0.0)
    started_at = Column(DateTime, default=utcnow)
    closed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    claim = relationship("Claim", back_populates="investigations")
    investigator = relationship("User", back_populates="investigations", foreign_keys=[investigator_id])
    notes = relationship("InvestigationNote", back_populates="investigation", cascade="all, delete-orphan")
    evidence = relationship("InvestigationEvidence", back_populates="investigation", cascade="all, delete-orphan")

class InvestigationNote(Base):
    __tablename__ = "investigation_notes"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False, index=True)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    investigation = relationship("Investigation", back_populates="notes")
    author = relationship("User", back_populates="notes")

class InvestigationEvidence(Base):
    __tablename__ = "investigation_evidence"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    file_type = Column(String, default="PDF")
    file_url = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    uploaded_by = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=utcnow)

    investigation = relationship("Investigation", back_populates="evidence")

class ReportJob(Base):
    __tablename__ = "report_jobs"

    id = Column(String, primary_key=True, index=True)  # e.g. REP-8001
    title = Column(String, nullable=False)
    report_type = Column(SQLEnum(ReportType), nullable=False)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING, nullable=False)
    filters_raw = Column(Text, default="{}")
    file_format = Column(String, default="CSV")
    file_path = Column(String, nullable=True)
    row_count = Column(Integer, default=0)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)

    @property
    def filters(self):
        try:
            return json.loads(self.filters_raw)
        except Exception:
            return {}

    @filters.setter
    def filters(self, value):
        self.filters_raw = json.dumps(value)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    user_email = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=True)
    action = Column(String, nullable=False, index=True)
    resource = Column(String, nullable=False, index=True)
    resource_id = Column(String, nullable=True)
    previous_value_raw = Column(Text, nullable=True)
    new_value_raw = Column(Text, nullable=True)
    ip_address = Column(String, default="127.0.0.1")
    session_info = Column(String, nullable=True)

    @property
    def previous_value(self):
        if not self.previous_value_raw:
            return None
        try:
            return json.loads(self.previous_value_raw)
        except Exception:
            return self.previous_value_raw

    @previous_value.setter
    def previous_value(self, value):
        if value is None:
            self.previous_value_raw = None
        elif isinstance(value, (dict, list)):
            self.previous_value_raw = json.dumps(value)
        else:
            self.previous_value_raw = str(value)

    @property
    def new_value(self):
        if not self.new_value_raw:
            return None
        try:
            return json.loads(self.new_value_raw)
        except Exception:
            return self.new_value_raw

    @new_value.setter
    def new_value(self, value):
        if value is None:
            self.new_value_raw = None
        elif isinstance(value, (dict, list)):
            self.new_value_raw = json.dumps(value)
        else:
            self.new_value_raw = str(value)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, default="ALERT")  # ALERT, ASSIGNMENT, REPORT, SYSTEM
    recipient_id = Column(String, ForeignKey("users.id"), nullable=True)
    recipient_role = Column(String, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    reference_id = Column(String, nullable=True)
    reference_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(String, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String, nullable=True)
    updated_by = Column(String, default="System")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
