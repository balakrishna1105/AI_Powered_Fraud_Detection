from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.models.enums import RiskLevel

class DashboardSummaryOut(BaseModel):
    total_claims: int
    claims_analyzed: int
    suspicious_claims: int
    confirmed_fraud: int
    potential_fraud_amount: float
    fraud_prevented: float
    detection_rate: float
    false_positive_rate: float
    
    # Period Comparisons & Percentages
    total_claims_growth: float = 8.4
    claims_analyzed_growth: float = 7.9
    suspicious_claims_growth: float = -4.2
    confirmed_fraud_growth: float = 12.1
    potential_fraud_amount_growth: float = 5.6
    fraud_prevented_growth: float = 18.2
    detection_rate_change: float = 1.8
    false_positive_rate_change: float = -0.9

class FraudTrendItem(BaseModel):
    date: str
    total_claims: int
    suspicious_claims: int
    confirmed_fraud: int
    fraud_amount: float
    prevented_amount: float

class FraudByCategoryItem(BaseModel):
    category: str
    label: str
    count: int
    amount: float
    percentage: float

class FraudByRegionItem(BaseModel):
    state: str
    total_claims: int
    suspicious_claims: int
    confirmed_fraud: int
    total_amount: float
    fraud_amount: float
    fraud_rate: float
    risk_level: str

class TopProviderItem(BaseModel):
    id: str
    name: str
    state: str
    city: str
    suspicious_claims: int
    total_claims: int
    fraud_amount: float
    fraud_percentage: float
    risk_score: float

class HighPriorityAlertItem(BaseModel):
    claim_id: str
    member_id: str
    provider_id: str
    provider_name: str
    claim_amount: float
    risk_score: float
    risk_level: RiskLevel
    fraud_indicators: List[str]
    claim_date: str
    assigned_investigator: Optional[str]
    status: str
