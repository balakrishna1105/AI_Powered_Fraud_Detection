import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_admin_login():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@healthguard.ai", "password": "Admin@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["role"] == "ADMIN"

def test_investigator_login():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "investigator@healthguard.ai", "password": "Invest@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["user"]["role"] == "INVESTIGATOR"

def test_dashboard_summary():
    # Login as admin
    auth_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@healthguard.ai", "password": "Admin@123"}
    )
    token = auth_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/dashboard/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["total_claims"] >= 1000
    assert data["data"]["suspicious_claims"] > 0
    assert data["data"]["detection_rate"] > 0

def test_fraud_score_endpoint():
    auth_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "analyst@healthguard.ai", "password": "Analyst@123"}
    )
    token = auth_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "claim_id": "CLM-TEST-99",
        "patient_id": "PAT-1001",
        "provider_id": "PRV-2001",
        "claim_amount": 350000.0,  # Excessive billing
        "diagnosis_codes": ["D001"],
        "procedure_codes": ["PROC301-MajorSurgery"],
        "hospitalization_days": 18
    }
    response = client.post("/api/v1/fraud/score", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["risk_score"] > 60.0  # Should trigger high/critical risk
    assert len(data["data"]["fraud_indicators"]) > 0
    assert len(data["data"]["explanations"]) > 0

def test_claims_list_and_filter():
    auth_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@healthguard.ai", "password": "Admin@123"}
    )
    token = auth_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/claims?page=1&page_size=10", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) == 10
    assert data["data"]["total"] >= 1000

def test_fraud_rules_list():
    auth_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@healthguard.ai", "password": "Admin@123"}
    )
    token = auth_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/fraud-rules", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 6

def test_investigation_creation_and_notes():
    auth_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "investigator@healthguard.ai", "password": "Invest@123"}
    )
    token = auth_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch a claim
    claims_resp = client.get("/api/v1/claims?page=1&page_size=1", headers=headers)
    claim_id = claims_resp.json()["data"]["items"][0]["id"]

    # Create investigation
    inv_payload = {
        "claim_id": claim_id,
        "priority": "HIGH",
        "findings": "Automated integration test investigation note."
    }
    inv_resp = client.post("/api/v1/investigations", json=inv_payload, headers=headers)
    assert inv_resp.status_code == 200
    inv_data = inv_resp.json()["data"]
    inv_id = inv_data["id"]

    # Add Note
    note_resp = client.post(
        f"/api/v1/investigations/{inv_id}/notes",
        json={"note_text": "Hospital audit log requested by SIU."},
        headers=headers
    )
    assert note_resp.status_code == 200
    assert note_resp.json()["success"] is True

def test_report_generation():
    auth_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@healthguard.ai", "password": "Admin@123"}
    )
    token = auth_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "Integration Test Fraud Summary",
        "report_type": "FRAUD_SUMMARY",
        "file_format": "CSV"
    }
    response = client.post("/api/v1/reports/generate", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["status"] == "COMPLETED"
