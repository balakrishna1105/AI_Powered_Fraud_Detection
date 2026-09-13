import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.entities import (
    User, Member, Provider, Claim, FraudScore, FraudIndicator,
    FraudRule, Investigation, InvestigationNote, InvestigationEvidence,
    AuditLog, Notification, SystemSetting
)
from app.models.enums import (
    UserRole, UserStatus, ClaimStatus, ClaimType,
    RiskLevel, FraudCategory, InvestigationStatus, RuleSeverity
)
from app.auth.security import hash_password

def utcnow():
    return datetime.now(timezone.utc)

STATES = [
    "Maharashtra", "Telangana", "Karnataka", "Tamil Nadu",
    "Delhi", "Gujarat", "Andhra Pradesh"
]

CITIES = {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
    "Telangana": ["Hyderabad", "Warangal"],
    "Karnataka": ["Bangalore", "Mysore"],
    "Tamil Nadu": ["Chennai", "Coimbatore"],
    "Delhi": ["New Delhi"],
    "Gujarat": ["Ahmedabad", "Surat"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada"]
}

HOSPITAL_NAMES = [
    "Apollo Health City", "Fortis Memorial Hospital", "Manipal Hospital",
    "Max Super Speciality Hospital", "Care Hospitals", "Yashoda Hospital",
    "Ruby Hall Clinic", "Narayana Multispeciality", "KIMS Hospital",
    "Aster Medcity", "Gleneagles Global Hospital", "Sunshine Hospital",
    "Medanta The Medicity", "Sir Ganga Ram Hospital", "Kokilaben Dhirubhai Ambani Hospital"
]

DIAGNOSES = [
    ("D001", "Acute Myocardial Infarction", 95000.0, 4),
    ("D002", "Type 2 Diabetes Mellitus with Complications", 35000.0, 3),
    ("D003", "Severe Bacterial Pneumonia", 55000.0, 5),
    ("D004", "Chronic Kidney Disease Stage 4", 110000.0, 3),
    ("D005", "Acute Appendicitis with Peritonitis", 75000.0, 4),
    ("D006", "Total Knee Arthroplasty (Osteoarthritis)", 185000.0, 5),
    ("D007", "Dengue Hemorrhagic Fever", 42000.0, 4),
    ("D008", "Cerebrovascular Accident (Ischemic Stroke)", 140000.0, 7),
    ("D009", "Cholelithiasis with Acute Cholecystitis", 68000.0, 3),
    ("D010", "Coronary Artery Disease Triple Vessel", 245000.0, 6)
]

PROCEDURES = [
    "PROC101-Coronary Angioplasty",
    "PROC102-Laparoscopic Appendectomy",
    "PROC103-Total Knee Replacement",
    "PROC104-Hemodialysis Session",
    "PROC105-ICU Intensive Monitoring",
    "PROC106-Mechanical Ventilation",
    "PROC107-Cholecystectomy",
    "PROC108-Brain MRI with Contrast",
    "PROC109-Blood Transfusion Complex",
    "PROC110-Diagnostic Coronary Angiogram"
]

def seed_database():
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            return

        print("⚡ Seeding HealthGuard AI Enterprise Database...")

        # 1. Users
        users = [
            User(
                id="USR-ADM-01",
                email="admin@healthguard.ai",
                password_hash=hash_password("Admin@123"),
                first_name="Rajesh",
                last_name="Sharma",
                role=UserRole.ADMIN,
                department="SIU Leadership",
                status=UserStatus.ACTIVE
            ),
            User(
                id="USR-INV-01",
                email="investigator@healthguard.ai",
                password_hash=hash_password("Invest@123"),
                first_name="Priya",
                last_name="Nair",
                role=UserRole.INVESTIGATOR,
                department="Special Investigations Unit",
                status=UserStatus.ACTIVE
            ),
            User(
                id="USR-INV-02",
                email="investigator2@healthguard.ai",
                password_hash=hash_password("Invest@123"),
                first_name="Vikram",
                last_name="Reddy",
                role=UserRole.INVESTIGATOR,
                department="Special Investigations Unit",
                status=UserStatus.ACTIVE
            ),
            User(
                id="USR-ANA-01",
                email="analyst@healthguard.ai",
                password_hash=hash_password("Analyst@123"),
                first_name="Ananya",
                last_name="Deshmukh",
                role=UserRole.ANALYST,
                department="Risk & Claims Analytics",
                status=UserStatus.ACTIVE
            ),
        ]
        db.add_all(users)
        db.commit()

        # 2. Fraud Rules
        rules = [
            FraudRule(
                id="RULE-DUP-001",
                name="Duplicate Claim Submission",
                description="Identical member, provider, and matching amount within consecutive timeframe.",
                category=FraudCategory.DUPLICATE_CLAIMS,
                severity=RuleSeverity.CRITICAL,
                threshold=1.0,
                rule_type="MATCH",
                created_by="USR-ADM-01",
                version="1.2"
            ),
            FraudRule(
                id="RULE-AMT-002",
                name="Excessive Billing Threshold",
                description="Claim amount exceeds high-risk ceiling ₹2,50,000 without pre-authorization.",
                category=FraudCategory.BILLING_FRAUD,
                severity=RuleSeverity.HIGH,
                threshold=250000.0,
                rule_type="THRESHOLD",
                created_by="USR-ADM-01",
                version="2.0"
            ),
            FraudRule(
                id="RULE-LOS-003",
                name="Unusual Length of Stay Outlier",
                description="Inpatient hospitalization duration exceeds 2.5x the clinical baseline.",
                category=FraudCategory.UNNECESSARY_HOSPITALIZATION,
                severity=RuleSeverity.MEDIUM,
                threshold=2.5,
                rule_type="RATIO",
                created_by="USR-ADM-01",
                version="1.1"
            ),
            FraudRule(
                id="RULE-PRV-004",
                name="High-Risk Provider Network Filter",
                description="Treating hospital has historical fraud/dispute rate exceeding 5.0%.",
                category=FraudCategory.PROVIDER_FRAUD,
                severity=RuleSeverity.HIGH,
                threshold=5.0,
                rule_type="PERCENTAGE",
                created_by="USR-ADM-01",
                version="1.0"
            ),
            FraudRule(
                id="RULE-UPC-005",
                name="Clinical Upcoding Discrepancy",
                description="Major high-complexity surgical procedure billed with benign minor diagnosis.",
                category=FraudCategory.UPCODING,
                severity=RuleSeverity.HIGH,
                threshold=1.0,
                rule_type="HEURISTIC",
                created_by="USR-ADM-01",
                version="1.3"
            ),
            FraudRule(
                id="RULE-FRQ-006",
                name="Frequent Hospitalization Hopper",
                description="Policyholder has 3 or more inpatient claims within a rolling 90-day window.",
                category=FraudCategory.MEMBER_FRAUD,
                severity=RuleSeverity.MEDIUM,
                threshold=3.0,
                rule_type="FREQUENCY",
                created_by="USR-ADM-01",
                version="1.0"
            ),
        ]
        db.add_all(rules)
        db.commit()

        # 3. Providers (50 Hospital Networks)
        providers = []
        for i in range(1, 51):
            st = STATES[i % len(STATES)]
            ct = random.choice(CITIES[st])
            name = f"{random.choice(HOSPITAL_NAMES)} - {ct}"
            is_suspicious_prov = (i in [4, 11, 18, 27, 39, 44])
            
            fraud_rate = random.uniform(8.5, 18.2) if is_suspicious_prov else random.uniform(0.8, 3.8)
            risk_score = random.uniform(68.0, 92.0) if is_suspicious_prov else random.uniform(12.0, 38.0)
            
            p = Provider(
                id=f"PRV-{2000 + i}",
                name=name,
                provider_type="Tertiary Care Multi-Specialty Hospital" if i % 2 == 0 else "Super Speciality Center",
                state=st,
                city=ct,
                address=f"Plot #{random.randint(10, 99)}, Medical Enclave, {ct}, {st}",
                risk_score=round(risk_score, 1),
                historical_claims_count=random.randint(240, 1800),
                historical_fraud_count=random.randint(15, 85) if is_suspicious_prov else random.randint(1, 8),
                historical_fraud_rate=round(fraud_rate, 2),
                avg_claim_amount=round(random.uniform(45000.0, 125000.0), 2)
            )
            providers.append(p)
        db.add_all(providers)
        db.commit()

        # 4. Members (220 Policyholders)
        first_names = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
                       "Diya", "Saanvi", "Ananya", "Aadhya", "Pari", "Kiara", "Myra", "Riya", "Avani", "Fatima", "Sneha", "Kavita", "Ramesh", "Suresh", "Sunil"]
        last_names = ["Sharma", "Verma", "Patel", "Reddy", "Rao", "Nair", "Iyer", "Deshmukh", "Kulkarni", "Mehta",
                      "Gupta", "Joshi", "Singhania", "Choudhury", "Bose", "Menon", "Pillai", "Chauhan", "Agarwal"]
        
        members = []
        for i in range(1, 221):
            st = STATES[i % len(STATES)]
            ct = random.choice(CITIES[st])
            is_hopper = (i in [7, 23, 51, 89, 142])
            m = Member(
                id=f"PAT-{1000 + i}",
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                age=random.randint(21, 78),
                gender=random.choice(["MALE", "FEMALE"]),
                state=st,
                city=ct,
                policy_number=f"POL-2026-IND-{100000 + i}",
                policy_tier="Executive Super Top-Up Plan" if i % 3 == 0 else "Comprehensive Family Health Shield",
                policy_start_date=utcnow() - timedelta(days=random.randint(180, 1500)),
                risk_score=round(random.uniform(65.0, 88.0) if is_hopper else random.uniform(10.0, 32.0), 1)
            )
            members.append(m)
        db.add_all(members)
        db.commit()

        # 5. Claims (1,050+ Synthetic Claims with realistic distributions)
        claims = []
        fraud_scores = []
        indicators = []
        investigations = []
        
        now = utcnow()
        
        for i in range(1, 1051):
            m = random.choice(members)
            p = random.choice(providers)
            diag = random.choice(DIAGNOSES)
            
            # Synthesize fraud cases (~15% elevated risk for demo)
            is_fraud = (i % 7 == 0) or (p.id in ["PRV-2004", "PRV-2018", "PRV-2027"]) or (m.id in ["PAT-1007", "PAT-1023"])
            
            base_amount = diag[2]
            std_los = diag[3]
            
            if is_fraud:
                fraud_type = random.choice([
                    FraudCategory.UPCODING,
                    FraudCategory.BILLING_FRAUD,
                    FraudCategory.DUPLICATE_CLAIMS,
                    FraudCategory.UNNECESSARY_HOSPITALIZATION,
                    FraudCategory.PROVIDER_FRAUD
                ])
                claim_amount = base_amount * random.uniform(2.2, 4.5)
                hospitalization_days = int(std_los * random.uniform(2.4, 4.0))
                risk_score_val = random.uniform(72.0, 96.5)
                risk_level_val = RiskLevel.CRITICAL if risk_score_val >= 85.0 else RiskLevel.HIGH
                status_val = random.choice([ClaimStatus.FLAGGED_FRAUD, ClaimStatus.UNDER_REVIEW])
            else:
                fraud_type = FraudCategory.NONE
                claim_amount = base_amount * random.uniform(0.85, 1.25)
                hospitalization_days = max(1, int(std_los * random.uniform(0.8, 1.3)))
                risk_score_val = random.uniform(5.0, 38.0)
                risk_level_val = RiskLevel.NORMAL if risk_score_val < 20.0 else RiskLevel.LOW
                status_val = random.choice([ClaimStatus.APPROVED, ClaimStatus.SUBMITTED])
            
            days_ago = random.randint(1, 365)
            claim_dt = now - timedelta(days=days_ago, hours=random.randint(1, 23))
            adm_dt = claim_dt - timedelta(days=hospitalization_days)
            dis_dt = claim_dt
            
            claim_id = f"CLM-{10000 + i}"
            assigned_inv = "USR-INV-01" if is_fraud and (i % 2 == 0) else ("USR-INV-02" if is_fraud else None)
            
            c = Claim(
                id=claim_id,
                member_id=m.id,
                provider_id=p.id,
                claim_type=ClaimType.INPATIENT,
                claim_status=status_val,
                fraud_category=fraud_type,
                claim_amount=round(claim_amount, 2),
                approved_amount=round(claim_amount * 0.92, 2) if status_val == ClaimStatus.APPROVED else None,
                claim_date=claim_dt,
                admission_date=adm_dt,
                discharge_date=dis_dt,
                hospitalization_days=hospitalization_days,
                assigned_investigator_id=assigned_inv
            )
            c.diagnosis_codes = [diag[0], f"ICD-{diag[0]}"]
            c.procedure_codes = [random.choice(PROCEDURES), f"PROC-{random.randint(201, 299)}"]
            claims.append(c)
            
            # Explanations for FraudScore
            explanations_list = []
            if is_fraud:
                explanations_list.append({
                    "feature": "claim_amount_ratio",
                    "impact": "HIGH",
                    "description": f"Billed amount of ₹{claim_amount:,.0f} significantly exceeds benchmark ₹{base_amount:,.0f} by {((claim_amount/base_amount)-1)*100:.0f}%.",
                    "weight": 38.5,
                    "value": round(claim_amount/base_amount, 2)
                })
                explanations_list.append({
                    "feature": "provider_risk_anomaly",
                    "impact": "HIGH",
                    "description": f"Treating hospital ({p.name}) has an elevated historical dispute rate of {p.historical_fraud_rate}%.",
                    "weight": 31.0,
                    "value": p.historical_fraud_rate
                })
                if hospitalization_days > std_los * 2:
                    explanations_list.append({
                        "feature": "length_of_stay_outlier",
                        "impact": "MEDIUM",
                        "description": f"Hospitalization of {hospitalization_days} days is excessive for {diag[1]} (normal: {std_los} days).",
                        "weight": 22.0,
                        "value": hospitalization_days
                    })
            else:
                explanations_list.append({
                    "feature": "clinical_consistency",
                    "impact": "LOW",
                    "description": "Billed charges, duration, and diagnosis correlate with normal baseline protocols.",
                    "weight": 8.0,
                    "value": round(claim_amount/base_amount, 2)
                })

            fs = FraudScore(
                id=f"SCR-{10000 + i}",
                claim_id=claim_id,
                risk_score=round(risk_score_val, 1),
                fraud_probability=round(risk_score_val / 100.0, 3),
                risk_level=risk_level_val,
                model_version="v2.1-calibrated-ensemble",
                scored_at=claim_dt
            )
            fs.explanations = explanations_list
            fraud_scores.append(fs)
            
            # Fraud Indicators
            if is_fraud:
                for exp in explanations_list:
                    ind = FraudIndicator(
                        id=f"IND-{len(indicators) + 1}",
                        claim_id=claim_id,
                        category=fraud_type.value,
                        feature=exp["feature"],
                        impact=exp["impact"],
                        description=exp["description"],
                        created_at=claim_dt
                    )
                    indicators.append(ind)
            
            # Create Investigations for top suspicious claims (~40 cases)
            if is_fraud and (i % 6 == 0):
                inv_id = f"INV-{3000 + len(investigations) + 1}"
                inv_status = random.choice([
                    InvestigationStatus.ASSIGNED,
                    InvestigationStatus.UNDER_REVIEW,
                    InvestigationStatus.INFORMATION_REQUIRED,
                    InvestigationStatus.CONFIRMED_FRAUD,
                    InvestigationStatus.FALSE_POSITIVE
                ])
                inv = Investigation(
                    id=inv_id,
                    claim_id=claim_id,
                    investigator_id=assigned_inv or "USR-INV-01",
                    status=inv_status,
                    priority=risk_level_val,
                    findings=f"Forensic claim review opened for {p.name}. Detected {fraud_type.value} patterns.",
                    final_decision="CONFIRMED_FRAUD" if inv_status == InvestigationStatus.CONFIRMED_FRAUD else None,
                    decision_rationale="Overbilling confirmed via hospital OT register verification." if inv_status == InvestigationStatus.CONFIRMED_FRAUD else None,
                    recovery_amount=claim_amount * 0.85 if inv_status == InvestigationStatus.CONFIRMED_FRAUD else 0.0,
                    started_at=claim_dt + timedelta(days=1)
                )
                investigations.append(inv)

        # Batch insert
        db.add_all(claims)
        db.commit()
        
        db.add_all(fraud_scores)
        db.add_all(indicators)
        db.add_all(investigations)
        db.commit()

        # 6. Sample Investigation Notes & Evidence
        for inv in investigations[:15]:
            n1 = InvestigationNote(
                id=f"NOTE-{random.randint(10000, 99999)}",
                investigation_id=inv.id,
                author_id="USR-INV-01",
                note_text="Contacted hospital billing department for verified itemized ledger and OT logbook records.",
                created_at=inv.started_at + timedelta(hours=4)
            )
            n2 = InvestigationNote(
                id=f"NOTE-{random.randint(10000, 99999)}",
                investigation_id=inv.id,
                author_id="USR-INV-02",
                note_text="Cross-referenced attending physician digital signatures against state medical council database.",
                created_at=inv.started_at + timedelta(days=1, hours=2)
            )
            ev = InvestigationEvidence(
                id=f"EV-{random.randint(10000, 99999)}",
                investigation_id=inv.id,
                title="Hospital Discharge Summary & OT Record",
                file_type="PDF",
                file_url="https://healthguard-evidence-vault.internal/docs/discharge_summary_sample.pdf",
                description="Original medical discharge summary and itemized pharmacy bills.",
                uploaded_by="USR-INV-01",
                uploaded_at=inv.started_at + timedelta(days=1)
            )
            db.add_all([n1, n2, ev])
        db.commit()

        # 7. Audit Logs
        audit_records = [
            AuditLog(
                id="AUD-001",
                user_email="admin@healthguard.ai",
                user_id="USR-ADM-01",
                action="SYSTEM_INIT",
                resource="SYSTEM",
                resource_id="CONFIG-01",
                new_value={"mode": "ENTERPRISE", "rules": 6},
                ip_address="192.168.1.10"
            ),
            AuditLog(
                id="AUD-002",
                user_email="admin@healthguard.ai",
                user_id="USR-ADM-01",
                action="UPDATE_RULE",
                resource="FRAUD_RULE",
                resource_id="RULE-AMT-002",
                previous_value={"threshold": 200000.0},
                new_value={"threshold": 250000.0},
                ip_address="192.168.1.10"
            ),
            AuditLog(
                id="AUD-003",
                user_email="investigator@healthguard.ai",
                user_id="USR-INV-01",
                action="CONFIRM_FRAUD",
                resource="INVESTIGATION",
                resource_id="INV-3001",
                new_value={"decision": "CONFIRMED_FRAUD", "recovery": 185000.0},
                ip_address="192.168.1.45"
            ),
        ]
        db.add_all(audit_records)
        db.commit()

        # 8. Notifications
        notifications = [
            Notification(
                id="NOTIF-001",
                title="Critical Anomaly Alert",
                message="High-value cardiac surgery claim CLM-10028 flagged with Risk Score 94/100 (Apollo Health City).",
                notification_type="ALERT",
                recipient_role="INVESTIGATOR",
                is_read=False,
                reference_id="CLM-10028",
                reference_type="CLAIM"
            ),
            Notification(
                id="NOTIF-002",
                title="Investigation Case Escalation",
                message="Case INV-3004 has been escalated for secondary forensic audit review.",
                notification_type="ASSIGNMENT",
                recipient_role="INVESTIGATOR",
                is_read=False,
                reference_id="INV-3004",
                reference_type="INVESTIGATION"
            ),
            Notification(
                id="NOTIF-003",
                title="Scheduled SIU Executive Report Ready",
                message="Monthly Fraud Prevention & Regulatory Compliance report job completed successfully.",
                notification_type="REPORT",
                recipient_role="ADMIN",
                is_read=True
            ),
        ]
        db.add_all(notifications)
        db.commit()

        print("✅ Database seeding successfully completed (1,050 claims, 220 members, 50 providers).")

    except Exception as e:
        db.rollback()
        print(f"❌ Database seeding error: {e}")
    finally:
        db.close()
