from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_role
from app.models.entities import User
from app.models.enums import UserRole
from app.services.fraud_rule_service import FraudRuleService
from app.schemas.fraud_rules import FraudRuleCreate, FraudRuleUpdate, FraudRuleOut
from app.schemas.common import APIResponse

router = APIRouter()

@router.get("", response_model=APIResponse[List[FraudRuleOut]])
def get_all_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rules = FraudRuleService.get_all_rules(db)
    return APIResponse(success=True, data=[FraudRuleOut.model_validate(r) for r in rules])

@router.post("", response_model=APIResponse[FraudRuleOut])
def create_rule(
    rule_in: FraudRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    rule = FraudRuleService.create_rule(db, rule_in, user=current_user)
    return APIResponse(success=True, data=FraudRuleOut.model_validate(rule), message="Fraud rule created")

@router.put("/{rule_id}", response_model=APIResponse[FraudRuleOut])
def update_rule(
    rule_id: str,
    rule_in: FraudRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    rule = FraudRuleService.update_rule(db, rule_id, rule_in, user=current_user)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Rule {rule_id} not found")
    return APIResponse(success=True, data=FraudRuleOut.model_validate(rule), message="Fraud rule updated")

@router.patch("/{rule_id}/toggle", response_model=APIResponse[FraudRuleOut])
def toggle_rule(
    rule_id: str,
    payload: Dict[str, bool],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    is_active = payload.get("is_active", True)
    rule = FraudRuleService.toggle_rule(db, rule_id, is_active, user=current_user)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Rule {rule_id} not found")
    return APIResponse(success=True, data=FraudRuleOut.model_validate(rule), message=f"Rule set to {'active' if is_active else 'inactive'}")

@router.delete("/{rule_id}", response_model=APIResponse[dict])
def delete_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    deleted = FraudRuleService.delete_rule(db, rule_id, user=current_user)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Rule {rule_id} not found")
    return APIResponse(success=True, data={"deleted": True}, message="Fraud rule deleted")
