from typing import Dict, Any, List
from datetime import datetime, timezone
import numpy as np

PEER_AVG_AMOUNTS = {
    "D001": 25000.0,
    "D002": 45000.0,
    "D003": 85000.0,
    "D004": 30000.0,
    "D005": 120000.0,
    "DEFAULT": 40000.0
}

EXPECTED_LOS = {
    "D001": 2,
    "D002": 3,
    "D003": 5,
    "D004": 2,
    "D005": 7,
    "DEFAULT": 3
}

class FeatureExtractor:
    """
    Extracts numerical and categorical feature representations from raw claim data
    for consumption by the machine learning risk scoring model.
    """
    
    def extract_features(
        self,
        claim_data: Dict[str, Any],
        member_history: List[Dict[str, Any]] = None,
        provider_history: Dict[str, Any] = None
    ) -> np.ndarray:
        member_history = member_history or []
        provider_history = provider_history or {}
        
        claim_amount = float(claim_data.get("claim_amount", 0.0))
        los = int(claim_data.get("hospitalization_days", 1))
        diagnoses = claim_data.get("diagnosis_codes", [])
        procedures = claim_data.get("procedure_codes", [])
        
        primary_diag = diagnoses[0] if diagnoses else "DEFAULT"
        expected_amount = PEER_AVG_AMOUNTS.get(primary_diag, PEER_AVG_AMOUNTS["DEFAULT"])
        expected_stay = EXPECTED_LOS.get(primary_diag, EXPECTED_LOS["DEFAULT"])
        
        amount_ratio = claim_amount / max(expected_amount, 1.0)
        los_ratio = los / max(expected_stay, 1)
        
        diag_count = len(diagnoses)
        proc_count = len(procedures)
        
        # Member features
        member_claims_count = len(member_history)
        member_total_amount = sum(float(c.get("claim_amount", 0.0)) for c in member_history)
        
        # Check hospitalization frequency (claims in last 60 days)
        claim_date = claim_data.get("claim_date") or datetime.now(timezone.utc)
        recent_member_claims = 0
        for c in member_history:
            c_date = c.get("claim_date")
            if c_date and isinstance(c_date, datetime):
                diff = abs((claim_date - c_date).days)
                if diff <= 60:
                    recent_member_claims += 1
        
        # Provider features
        prov_fraud_rate = float(provider_history.get("historical_fraud_rate", 0.0))
        prov_avg_amount = float(provider_history.get("avg_claim_amount", 40000.0))
        prov_claims_count = int(provider_history.get("historical_claims_count", 100))
        prov_amount_ratio = claim_amount / max(prov_avg_amount, 1.0)
        
        # Upcoding potential
        has_surgery = any("SRG" in p or "SURG" in p or "PROC3" in p for p in procedures)
        minor_diag = primary_diag in ["D001", "D004"]
        upcoding_flag = 1.0 if (has_surgery and minor_diag) else 0.0
        
        features = [
            amount_ratio,
            los_ratio,
            float(diag_count),
            float(proc_count),
            float(member_claims_count),
            float(recent_member_claims),
            member_total_amount / 100000.0,
            prov_fraud_rate,
            prov_amount_ratio,
            np.log1p(prov_claims_count),
            upcoding_flag,
            1.0 if los > 14 else 0.0,
            1.0 if claim_amount > 200000.0 else 0.0,
            float(los)
        ]
        
        return np.array(features, dtype=np.float32)
