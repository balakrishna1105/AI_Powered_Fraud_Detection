from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, dashboard, claims, fraud, fraud_rules,
    investigations, providers, members, users, reports
)
from app.api.v1.endpoints.audit_logs import audit_router, notif_router, settings_router

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(claims.router, prefix="/claims", tags=["Claims"])
api_router.include_router(fraud.router, prefix="/fraud", tags=["Fraud Detection Engine"])
api_router.include_router(fraud_rules.router, prefix="/fraud-rules", tags=["Fraud Rules"])
api_router.include_router(investigations.router, prefix="/investigations", tags=["Investigations"])
api_router.include_router(providers.router, prefix="/providers", tags=["Providers"])
api_router.include_router(members.router, prefix="/members", tags=["Members"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(audit_router, prefix="/audit-logs", tags=["Audit Logs"])
api_router.include_router(notif_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(settings_router, prefix="/settings", tags=["System Settings"])
