from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_role
from app.models.entities import User
from app.models.enums import InvestigationStatus, RiskLevel, UserRole
from app.services.investigation_service import InvestigationService
from app.schemas.investigations import (
    InvestigationOut, InvestigationDetailOut, InvestigationCreate,
    InvestigationStatusUpdate, InvestigationDecisionUpdate, InvestigationAssignRequest,
    InvestigationNoteCreate, InvestigationNoteOut, InvestigationEvidenceCreate, InvestigationEvidenceOut
)
from app.schemas.common import APIResponse, PaginatedData

router = APIRouter()

@router.get("", response_model=APIResponse[PaginatedData[InvestigationOut]])
def get_investigations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[InvestigationStatus] = None,
    priority: Optional[RiskLevel] = None,
    investigator_id: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = InvestigationService.get_investigations_paginated(
        db=db,
        page=page,
        page_size=page_size,
        status=status,
        priority=priority,
        investigator_id=investigator_id,
        search=search
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

@router.get("/{investigation_id}", response_model=APIResponse[InvestigationDetailOut])
def get_investigation_detail(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    detail = InvestigationService.get_investigation_detail(db, investigation_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found"
        )
    return APIResponse(success=True, data=detail)

@router.post("", response_model=APIResponse[InvestigationOut])
def create_investigation(
    inv_in: InvestigationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.INVESTIGATOR]))
):
    inv = InvestigationService.create_investigation(db, inv_in, user=current_user)
    detail = InvestigationService.get_investigation_detail(db, inv.id)
    return APIResponse(
        success=True,
        data=detail.investigation if detail else None,
        message="Investigation created"
    )

@router.patch("/{investigation_id}/status", response_model=APIResponse[dict])
def update_status(
    investigation_id: str,
    update_in: InvestigationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.INVESTIGATOR]))
):
    inv = InvestigationService.update_status(db, investigation_id, update_in, user=current_user)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation not found")
    return APIResponse(success=True, data={"status": inv.status.value}, message="Status updated successfully")

@router.post("/{investigation_id}/assign", response_model=APIResponse[dict])
def assign_investigator(
    investigation_id: str,
    req: InvestigationAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.INVESTIGATOR]))
):
    inv = InvestigationService.assign_investigator(db, investigation_id, req.investigator_id, user=current_user)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation not found")
    return APIResponse(success=True, data={"investigator_id": inv.investigator_id}, message="Investigator assigned")

@router.post("/{investigation_id}/decision", response_model=APIResponse[dict])
def submit_decision(
    investigation_id: str,
    decision_in: InvestigationDecisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.INVESTIGATOR]))
):
    inv = InvestigationService.submit_decision(db, investigation_id, decision_in, user=current_user)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation not found")
    return APIResponse(success=True, data={"decision": inv.final_decision, "status": inv.status.value}, message="Decision recorded")

@router.post("/{investigation_id}/notes", response_model=APIResponse[InvestigationNoteOut])
def add_note(
    investigation_id: str,
    note_in: InvestigationNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.INVESTIGATOR]))
):
    note = InvestigationService.add_note(db, investigation_id, note_in.note_text, user=current_user)
    return APIResponse(success=True, data=InvestigationNoteOut.model_validate(note), message="Note added")

@router.post("/{investigation_id}/evidence", response_model=APIResponse[InvestigationEvidenceOut])
def add_evidence(
    investigation_id: str,
    evidence_in: InvestigationEvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.INVESTIGATOR]))
):
    ev = InvestigationService.add_evidence(
        db, investigation_id,
        title=evidence_in.title,
        file_type=evidence_in.file_type,
        file_url=evidence_in.file_url,
        description=evidence_in.description,
        user=current_user
    )
    return APIResponse(success=True, data=InvestigationEvidenceOut.model_validate(ev), message="Evidence added")
