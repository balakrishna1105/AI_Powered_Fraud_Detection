from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
from app.models.enums import FraudCategory, RuleSeverity

DEFAULT_RULES = [
    {
        "id": "RULE-DUP-001",
        "name": "Duplicate Claim Submission",
        "category": FraudCategory.DUPLICATE_CLAIMS,
        "severity": RuleSeverity.CRITICAL,
        "threshold": 1.0,
        "description": "Identical patient, provider, primary diagnosis and overlapping date sequence."
    },
    {
        "id": "RULE-AMT-002",
        "name": "Excessive Billing Threshold",
        "category": FraudCategory.BILLING_FRAUD,
        "severity": RuleSeverity.HIGH,
        "threshold": 250000.0,
        "description": "Claim amount exceeds high-risk threshold ₹2,50,000 without prior pre-authorization."
    },
    {
        "id": "RULE-LOS-003",
        "name": "Unusual Length of Stay Outlier",
        "category": FraudCategory.UNNECESSARY_HOSPITALIZATION,
        "severity": RuleSeverity.MEDIUM,
        "threshold": 2.5,
        "description": "Hospitalization days exceed 2.5x the clinical specialty benchmark."
    },
    {
        "id": "RULE-PRV-004",
        "name": "High-Risk Provider Network Filter",
        "category": FraudCategory.PROVIDER_FRAUD,
        "severity": RuleSeverity.HIGH,
        "threshold": 5.0,
        "description": "Provider has historical fraud/dispute rate exceeding 5.0%."
    },
    {
        "id": "RULE-UPC-005",
        "name": "Clinical Upcoding Discrepancy",
        "category": FraudCategory.UPCODING,
        "severity": RuleSeverity.HIGH,
        "threshold": 1.0,
        "description": "Major surgery procedure billed alongside benign non-surgical diagnosis code."
    },
    {
        "id": "RULE-FRQ-006",
        "name": "Frequent Hospitalization Hopper",
        "category": FraudCategory.MEMBER_FRAUD,
        "severity": RuleSeverity.MEDIUM,
        "threshold": 3.0,
        "description": "Member has 3 or more inpatient claims within a rolling 90-day window."
    }
]

class RuleEngine:
    """
    Deterministic rule-based clinical and administrative fraud filter engine.
    """
    
    def __init__(self, active_rules: List[Dict[str, Any]] = None):
        self.rules = active_rules if active_rules is not None else DEFAULT_RULES

    def evaluate(
        self,
        claim_data: Dict[str, Any],
        member_history: List[Dict[str, Any]] = None,
        provider_data: Dict[str, Any] = None
    ) -> Tuple[float, List[str], List[Dict[str, Any]], FraudCategory]:
        """
        Evaluates active rules against claim context.
        Returns: (rule_risk_score: 0-100, indicators: list, rule_hits: list, primary_category)
        """
        member_history = member_history or []
        provider_data = provider_data or {}
        
        score_accum = 0.0
        indicators = []
        rule_hits = []
        category_counts: Dict[FraudCategory, int] = {}
        
        claim_amount = float(claim_data.get("claim_amount", 0.0))
        los = int(claim_data.get("hospitalization_days", 1))
        diagnoses = claim_data.get("diagnosis_codes", [])
        procedures = claim_data.get("procedure_codes", [])
        claim_date = claim_data.get("claim_date") or datetime.now(timezone.utc)
        
        for rule in self.rules:
            triggered = False
            hit_reason = ""
            weight = 0.0
            
            # Rule 1: Duplicate Claim Check
            if rule["id"] == "RULE-DUP-001":
                for past in member_history:
                    if (
                        past.get("provider_id") == claim_data.get("provider_id") and
                        past.get("claim_amount") == claim_amount and
                        past.get("id") != claim_data.get("claim_id")
                    ):
                        triggered = True
                        hit_reason = f"Duplicate claim detected matching prior claim {past.get('id')} for identical amount ₹{claim_amount:,.0f}"
                        weight = 40.0
                        break
            
            # Rule 2: Excessive Billing Threshold
            elif rule["id"] == "RULE-AMT-002":
                threshold = float(rule.get("threshold", 250000.0))
                if claim_amount >= threshold:
                    triggered = True
                    hit_reason = f"Claim amount ₹{claim_amount:,.0f} exceeds excessive billing threshold of ₹{threshold:,.0f}"
                    weight = 25.0
            
            # Rule 3: Length of Stay Outlier
            elif rule["id"] == "RULE-LOS-003":
                threshold_multiplier = float(rule.get("threshold", 2.5))
                standard_los = 3
                if los > (standard_los * threshold_multiplier):
                    triggered = True
                    hit_reason = f"Hospitalization of {los} days is {los/standard_los:.1f}x longer than clinical benchmark ({standard_los} days)"
                    weight = 20.0
            
            # Rule 4: High Provider Risk
            elif rule["id"] == "RULE-PRV-004":
                threshold_rate = float(rule.get("threshold", 5.0))
                prov_rate = float(provider_data.get("historical_fraud_rate", 0.0))
                if prov_rate >= threshold_rate:
                    triggered = True
                    hit_reason = f"Treating provider has historical fraud rate of {prov_rate:.1f}% (threshold: {threshold_rate}%)"
                    weight = 25.0
            
            # Rule 5: Upcoding Discrepancy
            elif rule["id"] == "RULE-UPC-005":
                has_major_proc = any("PROC3" in p or "SURG" in p for p in procedures)
                has_minor_diag = any(d in ["D001", "D004"] for d in diagnoses)
                if has_major_proc and has_minor_diag:
                    triggered = True
                    hit_reason = "High-cost major surgical procedure billed for minor non-surgical clinical diagnosis"
                    weight = 30.0
            
            # Rule 6: Frequent Hospitalization
            elif rule["id"] == "RULE-FRQ-006":
                threshold_count = int(rule.get("threshold", 3))
                recent_count = len([
                    c for c in member_history
                    if isinstance(c.get("claim_date"), datetime) and
                    abs((claim_date - c["claim_date"]).days) <= 90
                ])
                if recent_count >= threshold_count:
                    triggered = True
                    hit_reason = f"Member has {recent_count} inpatient hospitalizations within the last 90 days (threshold: {threshold_count})"
                    weight = 20.0
            
            if triggered:
                score_accum += weight
                indicators.append(hit_reason)
                cat = rule.get("category", FraudCategory.BILLING_FRAUD)
                category_counts[cat] = category_counts.get(cat, 0) + 1
                rule_hits.append({
                    "rule_id": rule["id"],
                    "rule_name": rule["name"],
                    "severity": rule["severity"].value if hasattr(rule["severity"], "value") else str(rule["severity"]),
                    "reason": hit_reason
                })
        
        primary_category = FraudCategory.NONE
        if category_counts:
            primary_category = max(category_counts, key=category_counts.get)
            
        capped_score = min(100.0, score_accum)
        return capped_score, indicators, rule_hits, primary_category
