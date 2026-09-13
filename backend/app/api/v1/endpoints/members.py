from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.entities import User
from app.services.member_service import MemberService
from app.schemas.providers import MemberOut, MemberDetailOut
from app.schemas.common import APIResponse, PaginatedData

router = APIRouter()

@router.get("", response_model=APIResponse[PaginatedData[MemberOut]])
def get_members(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    min_risk: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = MemberService.get_members_paginated(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
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

@router.get("/{member_id}", response_model=APIResponse[MemberDetailOut])
def get_member_detail(
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    detail = MemberService.get_member_detail(db, member_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member '{member_id}' not found"
        )
    return APIResponse(success=True, data=detail)
