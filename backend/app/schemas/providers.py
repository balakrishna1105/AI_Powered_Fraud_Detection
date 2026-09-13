from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from app.schemas.claims import ClaimOut

class ProviderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    provider_type: str
    state: str
    city: str
    address: Optional[str] = None
    risk_score: float
    historical_claims_count: int
    historical_fraud_count: int
    historical_fraud_rate: float
    avg_claim_amount: float
    total_claim_value: float = 0.0
    suspicious_claims_count: int = 0
    created_at: datetime

class ProviderDetailOut(BaseModel):
    provider: ProviderOut
    peer_avg_claim_amount: float = 45000.0
    peer_avg_fraud_rate: float = 3.2
    peer_avg_risk_score: float = 24.5
    common_procedures: List[Dict[str, Any]] = []
    fraud_trend: List[Dict[str, Any]] = []
    risk_indicators: List[str] = []
    claims: List[ClaimOut] = []
    investigations: List[Any] = []

class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    age: int
    gender: str
    state: str
    city: str
    policy_number: str
    policy_tier: str
    policy_start_date: datetime
    policy_expiry_date: Optional[datetime] = None
    risk_score: float
    claims_count: int = 0
    total_claim_value: float = 0.0
    suspicious_claims_count: int = 0
    created_at: datetime

class MemberDetailOut(BaseModel):
    member: MemberOut
    hospitalization_history: List[Dict[str, Any]] = []
    provider_relationships: List[Dict[str, Any]] = []
    suspicious_patterns: List[str] = []
    risk_timeline: List[Dict[str, Any]] = []
    claims: List[ClaimOut] = []
