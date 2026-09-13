from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.entities import User, Member, Provider, Claim
from app.schemas.claims import ClaimScoreRequest, ClaimScoreResponse
from app.schemas.common import APIResponse
from app.fraud_engine.scorer import fraud_pipeline

router = APIRouter()

@router.post("/score", response_model=APIResponse[ClaimScoreResponse])
def score_claim(
    req: ClaimScoreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Score a claim using the Rule Engine + Feature Pipeline + ML Model with Explainable AI.
    """
    member = db.query(Member).filter(Member.id == req.patient_id).first()
    provider = db.query(Provider).filter(Provider.id == req.provider_id).first()

    prior_claims = db.query(Claim).filter(Claim.member_id == req.patient_id, Claim.id != req.claim_id).all()
    hist_claims_dicts = [{
        "id": pc.id,
        "claim_date": pc.claim_date,
        "claim_amount": pc.claim_amount,
        "procedure_codes": pc.procedure_codes,
        "provider_id": pc.provider_id
    } for pc in prior_claims]

    score_result = fraud_pipeline.score_claim(
        claim_data={
            "claim_id": req.claim_id,
            "claim_amount": req.claim_amount,
            "hospitalization_days": req.hospitalization_days,
            "diagnosis_codes": req.diagnosis_codes,
            "procedure_codes": req.procedure_codes,
            "provider_id": req.provider_id,
            "claim_date": req.admission_date
        },
        member_context={"risk_score": member.risk_score if member else 10},
        provider_context={
            "risk_score": provider.risk_score if provider else 15,
            "historical_fraud_rate": provider.historical_fraud_rate if provider else 0,
            "avg_claim_amount": provider.avg_claim_amount if provider else 45000
        },
        historical_claims=hist_claims_dicts
    )

    resp_data = ClaimScoreResponse(
        claim_id=req.claim_id,
        fraud_probability=score_result["fraud_probability"],
        risk_score=score_result["risk_score"],
        risk_level=score_result["risk_level"],
        fraud_indicators=score_result["fraud_indicators"],
        explanations=score_result["explanations"]
    )

    return APIResponse(
        success=True,
        data=resp_data,
        message="Claim scored successfully"
    )

@router.get("/rules-summary", response_model=APIResponse[Dict[str, Any]])
def get_fraud_rules_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return APIResponse(
        success=True,
        data={
            "engine": "HealthGuard-Hybrid-Ensemble-v2.4",
            "active_rule_types": [
                "DUPLICATE_CLAIM_CHECK",
                "EXCESSIVE_BILLING_ANOMALY",
                "PROVIDER_HISTORICAL_RISK",
                "UNUSUAL_LENGTH_OF_STAY",
                "UPCODING_INCONSISTENCY",
                "FREQUENT_HOSPITALIZATION_VELOCITY"
            ],
            "calibrated_weights": {
                "rule_penalty_max": 45.0,
                "ml_feature_contribution_max": 55.0,
                "risk_thresholds": {"CRITICAL": 85, "HIGH": 70, "MEDIUM": 40, "LOW": 15}
            }
        }
    )
