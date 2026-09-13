from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import ClaimStatus, ClaimType, RiskLevel, FraudCategory

class ExplanationItem(BaseModel):
    feature: str
    impact: str = "HIGH"  # CRITICAL, HIGH, MEDIUM, LOW
    description: str
    weight: Optional[float] = None
    value: Optional[Any] = None

class FraudIndicatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category: str
    feature: str
    impact: str
    description: str
    created_at: datetime

class FraudScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    claim_id: str
    risk_score: float
    fraud_probability: float
    risk_level: RiskLevel
    model_version: str
    scored_at: datetime
    explanations: List[Dict[str, Any]] = []

class ClaimScoreRequest(BaseModel):
    claim_id: str = Field(..., json_schema_extra={"example": "CLM-10001"})
    patient_id: str = Field(..., json_schema_extra={"example": "PAT-1001"})
    provider_id: str = Field(..., json_schema_extra={"example": "PRV-2001"})
    claim_amount: float = Field(..., json_schema_extra={"example": 85000.0})
    diagnosis_codes: List[str] = Field(default_factory=list, json_schema_extra={"example": ["D001", "D023"]})
    procedure_codes: List[str] = Field(default_factory=list, json_schema_extra={"example": ["PROC101"]})
    hospitalization_days: int = Field(default=1, json_schema_extra={"example": 7})
    admission_date: Optional[datetime] = None
    discharge_date: Optional[datetime] = None

class ClaimScoreResponse(BaseModel):
    claim_id: str
    fraud_probability: float
    risk_score: float
    risk_level: str
    fraud_indicators: List[str]
    explanations: List[Dict[str, Any]] = []

class ClaimCreate(BaseModel):
    member_id: str
    provider_id: str
    claim_type: ClaimType = ClaimType.INPATIENT
    claim_amount: float
    admission_date: Optional[datetime] = None
    discharge_date: Optional[datetime] = None
    hospitalization_days: int = 1
    diagnosis_codes: List[str] = []
    procedure_codes: List[str] = []

class ClaimOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    member_id: str
    provider_id: str
    claim_type: ClaimType
    claim_status: ClaimStatus
    fraud_category: FraudCategory
    claim_amount: float
    approved_amount: Optional[float] = None
    claim_date: datetime
    admission_date: Optional[datetime] = None
    discharge_date: Optional[datetime] = None
    hospitalization_days: int
    diagnosis_codes: List[str]
    procedure_codes: List[str]
    assigned_investigator_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested relations when needed
    fraud_score: Optional[FraudScoreOut] = None

class ClaimListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    member_id: str
    member_name: Optional[str] = None
    provider_id: str
    provider_name: Optional[str] = None
    provider_state: Optional[str] = None
    claim_date: datetime
    claim_amount: float
    claim_type: ClaimType
    claim_status: ClaimStatus
    fraud_category: FraudCategory
    diagnosis_codes: List[str] = []
    procedure_codes: List[str] = []
    risk_score: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    assigned_investigator: Optional[str] = None
    created_at: datetime

class ClaimDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    claim: ClaimOut
    member: Any
    provider: Any
    fraud_score: Optional[FraudScoreOut] = None
    indicators: List[FraudIndicatorOut] = []
    active_investigation_id: Optional[str] = None
    related_claims: List[ClaimListItem] = []
