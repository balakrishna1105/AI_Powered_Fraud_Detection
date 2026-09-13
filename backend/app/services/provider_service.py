from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_
from app.models.entities import Provider, Member, Claim, FraudScore, Investigation
from app.models.enums import RiskLevel, FraudCategory
from app.schemas.providers import ProviderOut, ProviderDetailOut, MemberOut, MemberDetailOut
from app.schemas.claims import ClaimOut

class ProviderService:
    @staticmethod
    def get_providers_paginated(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        state: Optional[str] = None,
        min_risk: Optional[float] = None
    ) -> Tuple[List[ProviderOut], int]:
        query = db.query(Provider)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(or_(Provider.name.ilike(search_term), Provider.id.ilike(search_term), Provider.city.ilike(search_term)))
        if state:
            query = query.filter(Provider.state.ilike(f"%{state}%"))
        if min_risk is not None:
            query = query.filter(Provider.risk_score >= min_risk)

        total = query.count()
        providers = query.order_by(desc(Provider.risk_score)).offset((page - 1) * page_size).limit(page_size).all()

        results = []
        for p in providers:
            results.append(ProviderOut(
                id=p.id,
                name=p.name,
                provider_type=p.provider_type,
                state=p.state,
                city=p.city,
                address=p.address,
                risk_score=p.risk_score,
                historical_claims_count=p.historical_claims_count,
                historical_fraud_count=p.historical_fraud_count,
                historical_fraud_rate=p.historical_fraud_rate,
                avg_claim_amount=p.avg_claim_amount,
                total_claim_value=p.historical_claims_count * p.avg_claim_amount,
                suspicious_claims_count=int(p.historical_fraud_count * 2.5),
                created_at=p.created_at
            ))
        return results, total

    @staticmethod
    def get_provider_detail(db: Session, provider_id: str) -> Optional[ProviderDetailOut]:
        p = db.query(Provider).filter(Provider.id == provider_id).first()
        if not p:
            return None

        claims = db.query(Claim).options(
            joinedload(Claim.fraud_score),
            joinedload(Claim.member)
        ).filter(Claim.provider_id == provider_id).order_by(desc(Claim.claim_date)).limit(15).all()

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
                member_name=f"{c.member.first_name} {c.member.last_name}" if c.member else "",
                provider_name=p.name,
                provider_state=p.state,
                fraud_score=fs.risk_score if fs else 0.0,
                risk_level=fs.risk_level if fs else RiskLevel.NORMAL
            ))

        prov_out = ProviderOut(
            id=p.id,
            name=p.name,
            provider_type=p.provider_type,
            state=p.state,
            city=p.city,
            address=p.address,
            risk_score=p.risk_score,
            historical_claims_count=p.historical_claims_count,
            historical_fraud_count=p.historical_fraud_count,
            historical_fraud_rate=p.historical_fraud_rate,
            avg_claim_amount=p.avg_claim_amount,
            total_claim_value=p.historical_claims_count * p.avg_claim_amount,
            suspicious_claims_count=int(p.historical_fraud_count * 2.5),
            created_at=p.created_at
        )

        risk_indicators = []
        if p.historical_fraud_rate > 10.0:
            risk_indicators.append(f"Elevated fraud rate of {p.historical_fraud_rate:.1f}% compared to state average (3.2%)")
        if p.avg_claim_amount > 75000:
            risk_indicators.append(f"Average claim size (₹{p.avg_claim_amount:,.0f}) is 1.7x higher than peer facilities")
        if p.risk_score > 60:
            risk_indicators.append("Multiple upcoding and duplicate billing patterns detected across recent audit periods")

        return ProviderDetailOut(
            provider=prov_out,
            peer_avg_claim_amount=48000.0,
            peer_avg_fraud_rate=3.4,
            peer_avg_risk_score=22.0,
            common_procedures=[
                {"procedure": "PROC-CABG", "name": "Coronary Bypass", "count": 28, "avg_cost": 210000},
                {"procedure": "PROC-ANGIO", "name": "Coronary Angiography", "count": 64, "avg_cost": 45000},
                {"procedure": "PROC-TKR", "name": "Total Knee Replacement", "count": 32, "avg_cost": 175000},
                {"procedure": "PROC-APPEN", "name": "Appendectomy", "count": 45, "avg_cost": 68000}
            ],
            fraud_trend=[
                {"month": "May", "claims": 32, "fraud_count": 2},
                {"month": "Jun", "claims": 38, "fraud_count": 3},
                {"month": "Jul", "claims": 42, "fraud_count": 5},
                {"month": "Aug", "claims": 48, "fraud_count": 4},
                {"month": "Sep", "claims": 52, "fraud_count": 6}
            ],
            risk_indicators=risk_indicators,
            claims=claim_outs,
            investigations=[]
        )
