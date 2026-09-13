from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.models.enums import FraudCategory, RuleSeverity, InvestigationStatus, RiskLevel

# Investigation Notes & Evidence
class InvestigationNoteCreate(BaseModel):
    note_text: str

class InvestigationNoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    author_id: str
    author_name: Optional[str] = None
    note_text: str
    created_at: datetime

class InvestigationEvidenceCreate(BaseModel):
    title: str
    file_type: str = "PDF"
    file_url: str
    description: Optional[str] = None

class InvestigationEvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    title: str
    file_type: str
    file_url: str
    description: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime

# Investigations
class InvestigationCreate(BaseModel):
    claim_id: str
    investigator_id: Optional[str] = None
    priority: RiskLevel = RiskLevel.HIGH
    findings: Optional[str] = None

class InvestigationStatusUpdate(BaseModel):
    status: InvestigationStatus
    notes: Optional[str] = None

class InvestigationDecisionUpdate(BaseModel):
    final_decision: str  # CONFIRMED_FRAUD, FALSE_POSITIVE, ESCALATED, CLOSED
    decision_rationale: str
    status: InvestigationStatus = InvestigationStatus.CLOSED

class InvestigationAssignRequest(BaseModel):
    investigator_id: str

class InvestigationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    claim_id: str
    investigator_id: Optional[str] = None
    investigator_name: Optional[str] = None
    status: InvestigationStatus
    priority: RiskLevel
    findings: Optional[str] = None
    final_decision: Optional[str] = None
    decision_rationale: Optional[str] = None
    recovery_amount: float = 0.0
    started_at: datetime
    closed_at: Optional[datetime] = None
    updated_at: datetime

class InvestigationDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    investigation: InvestigationOut
    claim: Any
    member: Any
    provider: Any
    fraud_score: Any
    fraud_indicators: List[str] = []
    related_claims: List[Any] = []
    notes: List[InvestigationNoteOut] = []
    evidence: List[InvestigationEvidenceOut] = []
    timeline: List[Dict[str, Any]] = []
