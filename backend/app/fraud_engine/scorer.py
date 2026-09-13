from typing import Dict, Any, List
from app.fraud_engine.feature_extractor import FeatureExtractor
from app.fraud_engine.ml_model import MLFraudModel
from app.fraud_engine.rule_engine import RuleEngine
from app.models.enums import RiskLevel, FraudCategory

class FraudScorer:
    """
    Composite Fraud Scorer coordinating deterministic rule evaluation,
    statistical feature vectorization, and ML inference scoring.
    """
    
    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        self.ml_model = MLFraudModel()
        self.rule_engine = RuleEngine()

    def score(
        self,
        claim_data: Dict[str, Any],
        member_history: List[Dict[str, Any]] = None,
        provider_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        member_history = member_history or []
        provider_data = provider_data or {}
        
        # 1. Rule Engine evaluation
        rule_score, rule_indicators, rule_hits, primary_category = self.rule_engine.evaluate(
            claim_data, member_history, provider_data
        )
        
        # 2. ML Feature Extraction
        features = self.feature_extractor.extract_features(
            claim_data, member_history, provider_data
        )
        
        # 3. ML Inference
        ml_prob, ml_explanations = self.ml_model.predict_risk(features)
        ml_score = ml_prob * 100.0
        
        # 4. Ensemble Calibration (60% ML Model + 40% Clinical Rules)
        composite_score = (0.60 * ml_score) + (0.40 * rule_score)
        composite_score = round(min(100.0, max(0.0, composite_score)), 1)
        composite_prob = round(composite_score / 100.0, 3)
        
        # 5. Risk Tier Assignment
        if composite_score >= 80.0:
            risk_level = RiskLevel.CRITICAL
        elif composite_score >= 60.0:
            risk_level = RiskLevel.HIGH
        elif composite_score >= 40.0:
            risk_level = RiskLevel.MEDIUM
        elif composite_score >= 20.0:
            risk_level = RiskLevel.LOW
        else:
            risk_level = RiskLevel.NORMAL
            
        return {
            "claim_id": claim_data.get("claim_id", "UNKNOWN"),
            "fraud_probability": composite_prob,
            "risk_score": composite_score,
            "risk_level": risk_level,
            "fraud_category": primary_category,
            "fraud_indicators": rule_indicators,
            "rule_hits": rule_hits,
            "explanations": ml_explanations
        }

scorer_service = FraudScorer()
