import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.entities import FraudRule, User
from app.models.enums import FraudCategory, RuleSeverity
from app.schemas.fraud_rules import FraudRuleCreate, FraudRuleUpdate
from app.services.audit_service import log_audit_event

class FraudRuleService:
    @staticmethod
    def get_all_rules(db: Session) -> List[FraudRule]:
        return db.query(FraudRule).order_by(desc(FraudRule.created_at)).all()

    @staticmethod
    def create_rule(db: Session, rule_in: FraudRuleCreate, user: User) -> FraudRule:
        rule_id = f"RULE-{uuid.uuid4().hex[:6].upper()}"
        rule = FraudRule(
            id=rule_id,
            name=rule_in.name,
            description=rule_in.description,
            category=rule_in.category,
            severity=rule_in.severity,
            threshold=rule_in.threshold,
            rule_type=rule_in.rule_type,
            is_active=rule_in.is_active,
            created_by=f"{user.first_name} {user.last_name}",
            version="1.0",
            created_at=datetime.utcnow()
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)

        log_audit_event(
            db=db,
            user=user,
            action="RULE_CREATED",
            resource="FRAUD_RULES",
            resource_id=rule.id,
            new_value={"name": rule.name, "category": rule.category.value, "threshold": rule.threshold}
        )
        return rule

    @staticmethod
    def update_rule(db: Session, rule_id: str, rule_in: FraudRuleUpdate, user: User) -> Optional[FraudRule]:
        rule = db.query(FraudRule).filter(FraudRule.id == rule_id).first()
        if not rule:
            return None

        prev_val = {"name": rule.name, "threshold": rule.threshold, "is_active": rule.is_active, "severity": rule.severity.value}

        if rule_in.name is not None:
            rule.name = rule_in.name
            rule.description = rule_in.description
        if rule_in.category is not None:
            rule.category = rule_in.category
        if rule_in.severity is not None:
            rule.severity = rule_in.severity
        if rule_in.threshold is not None:
            rule.threshold = rule_in.threshold
        if rule_in.is_active is not None:
            rule.is_active = rule_in.is_active

        # Increment version
        try:
            curr_v = float(rule.version or "1.0")
            rule.version = f"{curr_v + 0.1:.1f}"
        except:
            rule.version = "1.1"

        rule.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(rule)

        log_audit_event(
            db=db,
            user=user,
            action="RULE_UPDATED",
            resource="FRAUD_RULES",
            resource_id=rule.id,
            previous_value=prev_val,
            new_value={"name": rule.name, "threshold": rule.threshold, "is_active": rule.is_active, "severity": rule.severity.value, "version": rule.version}
        )
        return rule

    @staticmethod
    def toggle_rule(db: Session, rule_id: str, is_active: bool, user: User) -> Optional[FraudRule]:
        rule = db.query(FraudRule).filter(FraudRule.id == rule_id).first()
        if not rule:
            return None

        old_state = rule.is_active
        rule.is_active = is_active
        rule.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(rule)

        log_audit_event(
            db=db,
            user=user,
            action="RULE_STATUS_TOGGLED",
            resource="FRAUD_RULES",
            resource_id=rule.id,
            previous_value={"is_active": old_state},
            new_value={"is_active": is_active}
        )
        return rule

    @staticmethod
    def delete_rule(db: Session, rule_id: str, user: User) -> bool:
        rule = db.query(FraudRule).filter(FraudRule.id == rule_id).first()
        if not rule:
            return False

        log_audit_event(
            db=db,
            user=user,
            action="RULE_DELETED",
            resource="FRAUD_RULES",
            resource_id=rule.id,
            previous_value={"name": rule.name, "id": rule.id}
        )

        db.delete(rule)
        db.commit()
        return True
