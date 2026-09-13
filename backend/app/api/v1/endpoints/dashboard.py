from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.entities import User
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import (
    DashboardSummaryOut, FraudTrendItem, FraudByCategoryItem,
    FraudByRegionItem, TopProviderItem, HighPriorityAlertItem
)
from app.schemas.common import APIResponse

router = APIRouter()

@router.get("/summary", response_model=APIResponse[DashboardSummaryOut])
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    summary = DashboardService.get_summary_kpis(db)
    return APIResponse(success=True, data=summary)

@router.get("/fraud-trends", response_model=APIResponse[List[FraudTrendItem]])
def get_fraud_trends(
    period: str = Query("30d", enum=["7d", "30d", "90d", "1y"]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trends = DashboardService.get_fraud_trends(db, period=period)
    return APIResponse(success=True, data=trends)

@router.get("/fraud-by-category", response_model=APIResponse[List[FraudByCategoryItem]])
def get_fraud_by_category(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cats = DashboardService.get_fraud_by_category(db)
    return APIResponse(success=True, data=cats)

@router.get("/fraud-by-region", response_model=APIResponse[List[FraudByRegionItem]])
def get_fraud_by_region(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    regions = DashboardService.get_fraud_by_region(db)
    return APIResponse(success=True, data=regions)

@router.get("/top-providers", response_model=APIResponse[List[TopProviderItem]])
def get_top_risky_providers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    providers = DashboardService.get_top_risky_providers(db)
    return APIResponse(success=True, data=providers)

@router.get("/high-priority-alerts", response_model=APIResponse[List[HighPriorityAlertItem]])
def get_high_priority_alerts(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alerts = DashboardService.get_high_priority_alerts(db, limit=limit)
    return APIResponse(success=True, data=alerts)
