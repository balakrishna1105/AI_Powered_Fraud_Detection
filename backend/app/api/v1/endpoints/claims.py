from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.entities import User
from app.models.enums import ClaimStatus, RiskLevel, FraudCategory
from app.services.claim_service import ClaimService
from app.schemas.claims import ClaimCreate, ClaimOut, ClaimDetailOut
from app.schemas.common import APIResponse, PaginatedData

router = APIRouter()

@router.get("", response_model=APIResponse[PaginatedData[ClaimOut]])
def get_claims(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    risk_level: Optional[RiskLevel] = None,
    status: Optional[ClaimStatus] = None,
    provider_id: Optional[str] = None,
    member_id: Optional[str] = None,
    category: Optional[FraudCategory] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = ClaimService.get_claims_paginated(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        risk_level=risk_level,
        status=status,
        provider_id=provider_id,
        member_id=member_id,
        category=category,
        min_amount=min_amount,
        max_amount=max_amount,
        state=state
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

@router.get("/{claim_id}", response_model=APIResponse[ClaimDetailOut])
def get_claim_detail(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    detail = ClaimService.get_claim_detail(db, claim_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim '{claim_id}' not found"
        )
    return APIResponse(success=True, data=detail)

@router.post("", response_model=APIResponse[ClaimOut])
def submit_new_claim(
    claim_in: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_claim = ClaimService.create_and_score_claim(db, claim_in, current_user=current_user)
    detail = ClaimService.get_claim_detail(db, new_claim.id)
    return APIResponse(
        success=True,
        data=detail.claim if detail else None,
        message="Claim submitted and scored successfully"
    )
