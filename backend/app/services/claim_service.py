import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, and_
from app.models.entities import Claim, Member, Provider, FraudScore, FraudIndicator, Investigation, User
from app.models.enums import ClaimStatus, RiskLevel, FraudCategory, InvestigationStatus, UserRole
from app.schemas.claims import ClaimCreate, ClaimOut, ClaimDetailOut, MemberSummaryOut, ProviderSummaryOut, FraudScoreOut, FraudIndicatorOut
from app.fraud_engine.scorer import fraud_pipeline
from app.services.audit_service import log_audit_event, create_notification

class ClaimService:
    @staticmethod
    def get_claims_paginated(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        risk_level: Optional[RiskLevel] = None,
        status: Optional[ClaimStatus] = None,
        provider_id: Optional[str] = None,
        member_id: Optional[str] = None,
        category: Optional[FraudCategory] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        state: Optional[str] = None
    ) -> Tuple[List[ClaimOut], int]:
        query = db.query(Claim).options(
            joinedload(Claim.member),
            joinedload(Claim.provider),
            joinedload(Claim.fraud_score),
            joinedload(Claim.investigations)
        )

        if search:
            search_term = f"%{search.strip()}%"
            query = query.join(Claim.member).join(Claim.provider).filter(
                or_(
                    Claim.id.ilike(search_term),
                    Claim.member_id.ilike(search_term),
                    Claim.provider_id.ilike(search_term),
                    Member.first_name.ilike(search_term),
                    Member.last_name.ilike(search_term),
                    Provider.name.ilike(search_term)
                )
            )

        if provider_id:
            query = query.filter(Claim.provider_id == provider_id)
        if member_id:
            query = query.filter(Claim.member_id == member_id)
        if status:
            query = query.filter(Claim.claim_status == status)
        if category and category != FraudCategory.NONE:
            query = query.filter(Claim.fraud_category == category)
        if min_amount is not None:
            query = query.filter(Claim.claim_amount >= min_amount)
        if max_amount is not None:
            query = query.filter(Claim.claim_amount <= max_amount)

        if risk_level:
            query = query.join(Claim.fraud_score).filter(FraudScore.risk_level == risk_level)
        if state:
            query = query.join(Claim.provider).filter(Provider.state.ilike(f"%{state}%"))

        total = query.count()
        claims = query.order_by(desc(Claim.claim_date)).offset((page - 1) * page_size).limit(page_size).all()

        results = []
        for c in claims:
            fs = c.fraud_score
            inv = c.investigations[0] if c.investigations else None
            assigned_name = None
            if inv and inv.investigator:
                assigned_name = f"{inv.investigator.first_name} {inv.investigator.last_name}"

            results.append(ClaimOut(
                id=c.id,
                member_id=c.member_id,
                provider_id=c.provider_id,
                claim_type=c.claim_type,
                claim_amount=c.claim_amount,
                approved_amount=c.approved_amount,
                admission_date=c.admission_date,
                discharge_date=c.discharge_date,
                hospitalization_days=c.hospitalization_days,
                claim_date=c.claim_date,
                claim_status=c.claim_status,
                diagnosis_codes=c.diagnosis_codes,
                procedure_codes=c.procedure_codes,
                fraud_category=c.fraud_category or FraudCategory.NONE,
                created_at=c.created_at,
                member_name=f"{c.member.first_name} {c.member.last_name}" if c.member else "Unknown",
                provider_name=c.provider.name if c.provider else "Unknown",
                provider_state=c.provider.state if c.provider else "Unknown",
                fraud_score=fs.risk_score if fs else 0.0,
                risk_level=fs.risk_level if fs else RiskLevel.NORMAL,
                assigned_investigator=assigned_name,
                investigation_id=inv.id if inv else None
            ))

        return results, total

    @staticmethod
    def get_claim_detail(db: Session, claim_id: str) -> Optional[ClaimDetailOut]:
        claim = db.query(Claim).options(
            joinedload(Claim.member),
            joinedload(Claim.provider),
            joinedload(Claim.fraud_score),
            joinedload(Claim.indicators),
            joinedload(Claim.investigations).joinedload(Investigation.investigator)
        ).filter(Claim.id == claim_id).first()

        if not claim:
            return None

        fs = claim.fraud_score
        active_inv = claim.investigations[0] if claim.investigations else None

        # Fetch related historical claims for this member
        related = db.query(Claim).options(
            joinedload(Claim.provider),
            joinedload(Claim.fraud_score)
        ).filter(
            Claim.member_id == claim.member_id,
            Claim.id != claim.id
        ).order_by(desc(Claim.claim_date)).limit(5).all()

        related_outs = []
        for rc in related:
            rfs = rc.fraud_score
            related_outs.append(ClaimOut(
                id=rc.id,
                member_id=rc.member_id,
                provider_id=rc.provider_id,
                claim_type=rc.claim_type,
                claim_amount=rc.claim_amount,
                approved_amount=rc.approved_amount,
                admission_date=rc.admission_date,
                discharge_date=rc.discharge_date,
                hospitalization_days=rc.hospitalization_days,
                claim_date=rc.claim_date,
                claim_status=rc.claim_status,
                diagnosis_codes=rc.diagnosis_codes,
                procedure_codes=rc.procedure_codes,
                fraud_category=rc.fraud_category or FraudCategory.NONE,
                created_at=rc.created_at,
                provider_name=rc.provider.name if rc.provider else "",
                fraud_score=rfs.risk_score if rfs else 0.0,
                risk_level=rfs.risk_level if rfs else RiskLevel.NORMAL
            ))

        claim_out = ClaimOut(
            id=claim.id,
            member_id=claim.member_id,
            provider_id=claim.provider_id,
            claim_type=claim.claim_type,
            claim_amount=claim.claim_amount,
            approved_amount=claim.approved_amount,
            admission_date=claim.admission_date,
            discharge_date=claim.discharge_date,
            hospitalization_days=claim.hospitalization_days,
            claim_date=claim.claim_date,
            claim_status=claim.claim_status,
            diagnosis_codes=claim.diagnosis_codes,
            procedure_codes=claim.procedure_codes,
            fraud_category=claim.fraud_category or FraudCategory.NONE,
            created_at=claim.created_at,
            member_name=f"{claim.member.first_name} {claim.member.last_name}" if claim.member else "",
            provider_name=claim.provider.name if claim.provider else "",
            provider_state=claim.provider.state if claim.provider else "",
            fraud_score=fs.risk_score if fs else 0.0,
            risk_level=fs.risk_level if fs else RiskLevel.NORMAL,
            assigned_investigator=f"{active_inv.investigator.first_name} {active_inv.investigator.last_name}" if (active_inv and active_inv.investigator) else None,
            investigation_id=active_inv.id if active_inv else None
        )

        member_summary = MemberSummaryOut(
            id=claim.member.id,
            first_name=claim.member.first_name,
            last_name=claim.member.last_name,
            age=claim.member.age,
            gender=claim.member.gender,
            policy_number=claim.member.policy_number,
            policy_tier=claim.member.policy_tier,
            policy_start_date=claim.member.policy_start_date,
            risk_score=claim.member.risk_score
        )

        provider_summary = ProviderSummaryOut(
            id=claim.provider.id,
            name=claim.provider.name,
            provider_type=claim.provider.provider_type,
            state=claim.provider.state,
            city=claim.provider.city,
            risk_score=claim.provider.risk_score,
            historical_claims_count=claim.provider.historical_claims_count,
            historical_fraud_rate=claim.provider.historical_fraud_rate,
            avg_claim_amount=claim.provider.avg_claim_amount
        )

        fs_out = None
        if fs:
            fs_out = FraudScoreOut(
                id=fs.id,
                claim_id=fs.claim_id,
                risk_score=fs.risk_score,
                fraud_probability=fs.fraud_probability,
                risk_level=fs.risk_level,
                model_version=fs.model_version,
                scored_at=fs.scored_at,
                explanations=fs.explanations
            )

        ind_outs = [
            FraudIndicatorOut(
                id=ind.id,
                category=ind.category,
                feature=ind.feature,
                impact=ind.impact,
                description=ind.description,
                created_at=ind.created_at
            ) for ind in claim.indicators
        ]

        return ClaimDetailOut(
            claim=claim_out,
            member=member_summary,
            provider=provider_summary,
            fraud_score=fs_out,
            indicators=ind_outs,
            active_investigation_id=active_inv.id if active_inv else None,
            active_investigation_status=active_inv.status.value if active_inv else None,
            related_claims=related_outs
        )

    @staticmethod
    def create_and_score_claim(db: Session, claim_in: ClaimCreate, current_user: Optional[User] = None) -> Claim:
        claim_id = f"CLM-{uuid.uuid4().hex[:6].upper()}"
        member = db.query(Member).filter(Member.id == claim_in.member_id).first()
        provider = db.query(Provider).filter(Provider.id == claim_in.provider_id).first()

        new_claim = Claim(
            id=claim_id,
            member_id=claim_in.member_id,
            provider_id=claim_in.provider_id,
            claim_type=claim_in.claim_type,
            claim_amount=claim_in.claim_amount,
            admission_date=claim_in.admission_date or datetime.utcnow(),
            discharge_date=claim_in.discharge_date,
            hospitalization_days=claim_in.hospitalization_days,
            claim_date=datetime.utcnow(),
            claim_status=ClaimStatus.SUBMITTED,
            created_at=datetime.utcnow()
        )
        new_claim.diagnosis_codes = claim_in.diagnosis_codes
        new_claim.procedure_codes = claim_in.procedure_codes

        db.add(new_claim)
        db.flush()

        # Gather historical claims
        prior_claims = db.query(Claim).filter(Claim.member_id == claim_in.member_id, Claim.id != claim_id).all()
        hist_claims_dicts = [{
            "id": pc.id,
            "claim_date": pc.claim_date,
            "claim_amount": pc.claim_amount,
            "procedure_codes": pc.procedure_codes,
            "provider_id": pc.provider_id
        } for pc in prior_claims]

        score_res = fraud_pipeline.score_claim(
            claim_data={
                "id": claim_id,
                "claim_amount": claim_in.claim_amount,
                "hospitalization_days": claim_in.hospitalization_days,
                "diagnosis_codes": claim_in.diagnosis_codes,
                "procedure_codes": claim_in.procedure_codes,
                "claim_date": new_claim.claim_date,
                "provider_id": claim_in.provider_id
            },
            member_context={"risk_score": member.risk_score if member else 10},
            provider_context={
                "risk_score": provider.risk_score if provider else 15,
                "historical_fraud_rate": provider.historical_fraud_rate if provider else 0,
                "avg_claim_amount": provider.avg_claim_amount if provider else 45000
            },
            historical_claims=hist_claims_dicts
        )

        risk_lvl = RiskLevel(score_res["risk_level"])
        fraud_cat = FraudCategory(score_res["fraud_category"])
        new_claim.fraud_category = fraud_cat

        # Persist Fraud Score
        fs_record = FraudScore(
            id=f"FS-{uuid.uuid4().hex[:8].upper()}",
            claim_id=claim_id,
            risk_score=score_res["risk_score"],
            fraud_probability=score_res["fraud_probability"],
            risk_level=risk_lvl,
            model_version=score_res["model_version"],
            scored_at=datetime.utcnow()
        )
        fs_record.explanations = score_res["explanations"]
        db.add(fs_record)

        # Persist Indicators
        for ind_str in score_res["fraud_indicators"]:
            ind_record = FraudIndicator(
                id=f"IND-{uuid.uuid4().hex[:8].upper()}",
                claim_id=claim_id,
                category=fraud_cat.value,
                feature="ML_RULE_HYBRID",
                impact="HIGH" if risk_lvl in [RiskLevel.HIGH, RiskLevel.CRITICAL] else "MEDIUM",
                description=ind_str,
                created_at=datetime.utcnow()
            )
            db.add(ind_record)

        # Auto-create investigation if Critical/High Risk
        if risk_lvl in [RiskLevel.CRITICAL, RiskLevel.HIGH]:
            new_claim.claim_status = ClaimStatus.UNDER_INVESTIGATION
            inv = Investigation(
                id=f"INV-{uuid.uuid4().hex[:6].upper()}",
                claim_id=claim_id,
                status=InvestigationStatus.NEW,
                priority=risk_lvl,
                findings=f"Automated risk alert triggered: Risk score {score_res['risk_score']}/100. Primary flags: {', '.join(score_res['fraud_indicators'][:2])}",
                opened_at=datetime.utcnow()
            )
            db.add(inv)
            create_notification(
                db=db,
                title=f"High Risk Claim Alert ({risk_lvl.value})",
                message=f"Claim {claim_id} for ₹{claim_in.claim_amount:,.0f} scored {score_res['risk_score']}/100 and queued for investigation.",
                notification_type="ALERT",
                reference_id=claim_id,
                reference_type="CLAIM"
            )

        db.commit()
        db.refresh(new_claim)

        log_audit_event(
            db=db,
            user=current_user,
            action="CLAIM_SUBMITTED_AND_SCORED",
            resource="CLAIMS",
            resource_id=claim_id,
            new_value={"claim_amount": claim_in.claim_amount, "risk_score": score_res["risk_score"], "risk_level": risk_lvl.value}
        )

        return new_claim
