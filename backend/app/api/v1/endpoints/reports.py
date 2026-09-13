import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.entities import User
from app.services.report_service import ReportService
from app.schemas.reports import ReportJobCreate, ReportJobOut
from app.schemas.common import APIResponse, PaginatedData

router = APIRouter()

@router.post("/generate", response_model=APIResponse[ReportJobOut])
def generate_report(
    report_in: ReportJobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = ReportService.create_report_job(db, report_in, user=current_user)
    return APIResponse(
        success=True,
        data=ReportJobOut.model_validate(job),
        message="Report generated successfully"
    )

@router.get("", response_model=APIResponse[PaginatedData[ReportJobOut]])
def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = ReportService.list_reports(db, page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return APIResponse(
        success=True,
        data=PaginatedData(
            items=[ReportJobOut.model_validate(r) for r in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )

@router.get("/{report_id}", response_model=APIResponse[ReportJobOut])
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = ReportService.get_report_by_id(db, report_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report '{report_id}' not found")
    return APIResponse(success=True, data=ReportJobOut.model_validate(job))

@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = ReportService.get_report_by_id(db, report_id)
    if not job or not job.file_path or not os.path.exists(job.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found")
    
    media_type = "text/csv" if job.file_format == "CSV" else "application/octet-stream"
    filename = f"{job.title.replace(' ', '_')}_{job.id}.csv"
    return FileResponse(job.file_path, media_type=media_type, filename=filename)
