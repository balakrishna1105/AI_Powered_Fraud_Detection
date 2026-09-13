from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import FraudCategory, RuleSeverity

class FraudRuleCreate(BaseModel):
    name: str
    description: str
    category: FraudCategory
    severity: RuleSeverity = RuleSeverity.HIGH
    threshold: float
    rule_type: str = "THRESHOLD"
    is_active: bool = True

class FraudRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[FraudCategory] = None
    severity: Optional[RuleSeverity] = None
    threshold: Optional[float] = None
    is_active: Optional[bool] = None

class FraudRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    category: FraudCategory
    severity: RuleSeverity
    threshold: float
    is_active: bool
    rule_type: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    version: str
