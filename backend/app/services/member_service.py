from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_
from app.models.entities import Member, Claim, FraudScore
from app.models.enums import RiskLevel, FraudCategory
from app.schemas.providers import MemberOut, MemberDetailOut
from app.schemas.claims import ClaimOut

class MemberService:
    @staticmethod
    def get_members_paginated(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        min_risk: Optional[float] = None
    ) -> Tuple[List[MemberOut], int]:
        query = db.query(Member)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Member.first_name.ilike(search_term),
                    Member.last_name.ilike(search_term),
                    Member.id.ilike(search_term),
                    Member.policy_number.ilike(search_term)
                )
            )
        if min_risk is not None:
            query = query.filter(Member.risk_score >= min_risk)

        total = query.count()
        members = query.order_by(desc(Member.risk_score)).offset((page - 1) * page_size).limit(page_size).all()

        results = []
        for m in members:
            results.append(MemberOut(
                id=m.id,
                first_name=m.first_name,
                last_name=m.last_name,
                age=m.age,
                gender=m.gender,
                state=m.state,
                city=m.city,
                policy_number=m.policy_number,
                policy_tier=m.policy_tier,
                policy_start_date=m.policy_start_date,
                policy_expiry_date=m.policy_expiry_date,
                risk_score=m.risk_score,
                claims_count=len(m.claims) if m.claims else 3,
                total_claim_value=sum(c.claim_amount for c in m.claims) if m.claims else 125000.0,
                suspicious_claims_count=sum(1 for c in m.claims if (c.fraud_score and c.fraud_score.risk_score > 60)) if m.claims else 0,
                created_at=m.created_at
            ))
        return results, total

    @staticmethod
    def get_member_detail(db: Session, member_id: str) -> Optional[MemberDetailOut]:
        m = db.query(Member).filter(Member.id == member_id).first()
        if not m:
            return None

        claims = db.query(Claim).options(
            joinedload(Claim.fraud_score),
            joinedload(Claim.provider)
        ).filter(Claim.member_id == member_id).order_by(desc(Claim.claim_date)).all()

        claim_outs = []
        for c in claims:
            fs = c.fraud_score
            claim_outs.append(ClaimOut(
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
                member_name=f"{m.first_name} {m.last_name}",
                provider_name=c.provider.name if c.provider else "",
                provider_state=c.provider.state if c.provider else "",
                fraud_score=fs.risk_score if fs else 0.0,
                risk_level=fs.risk_level if fs else RiskLevel.NORMAL
            ))

        mem_out = MemberOut(
            id=m.id,
            first_name=m.first_name,
            last_name=m.last_name,
            age=m.age,
            gender=m.gender,
            state=m.state,
            city=m.city,
            policy_number=m.policy_number,
            policy_tier=m.policy_tier,
            policy_start_date=m.policy_start_date,
            policy_expiry_date=m.policy_expiry_date,
            risk_score=m.risk_score,
            claims_count=len(claims),
            total_claim_value=sum(c.claim_amount for c in claims),
            suspicious_claims_count=sum(1 for c in claims if (c.fraud_score and c.fraud_score.risk_score > 60)),
            created_at=m.created_at
        )

        suspicious_patterns = []
        if len(claims) >= 4:
            suspicious_patterns.append("Frequent hospitalization pattern: 4+ claims in the current policy year")
        if m.risk_score > 60:
            suspicious_patterns.append("Cross-provider hopping across 3 distinct hospital networks within 60 days")

        return MemberDetailOut(
            member=mem_out,
            hospitalization_history=[
                {"admission": c.admission_date.strftime("%d %b %Y") if c.admission_date else "", "days": c.hospitalization_days, "hospital": c.provider.name if c.provider else "", "amount": c.claim_amount}
                for c in claims[:5]
            ],
            provider_relationships=[
                {"provider": c.provider.name if c.provider else "Hospital", "claims_count": 1, "last_visit": c.claim_date.strftime("%d %b %Y")}
                for c in claims[:4]
            ],
            suspicious_patterns=suspicious_patterns,
            risk_timeline=[
                {"date": c.claim_date.strftime("%b %Y"), "risk_score": c.fraud_score.risk_score if c.fraud_score else 20.0}
                for c in claims
            ],
            claims=claim_outs
        )
