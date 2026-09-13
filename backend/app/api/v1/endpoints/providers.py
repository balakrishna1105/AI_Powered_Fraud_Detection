from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.entities import User
from app.services.provider_service import ProviderService
from app.schemas.providers import ProviderOut, ProviderDetailOut
from app.schemas.common import APIResponse, PaginatedData

router = APIRouter()

@router.get("", response_model=APIResponse[PaginatedData[ProviderOut]])
def get_providers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    state: Optional[str] = None,
    min_risk: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = ProviderService.get_providers_paginated(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        state=state,
        min_risk=min_risk
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return APIResponse(
        success=True,
        data=PaginatedData(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )

@router.get("/{provider_id}", response_model=APIResponse[ProviderDetailOut])
def get_provider_detail(
    provider_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    detail = ProviderService.get_provider_detail(db, provider_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found"
        )
    return APIResponse(success=True, data=detail)
