import uuid
from datetime import datetime
from typing import List, Optional, Tuple, Any, Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_
from app.models.entities import Investigation, InvestigationNote, InvestigationEvidence, Claim, User, Member, Provider, FraudScore, AuditLog
from app.models.enums import InvestigationStatus, RiskLevel, ClaimStatus
from app.schemas.investigations import (
    InvestigationOut, InvestigationDetailOut, InvestigationNoteOut, InvestigationEvidenceOut,
    InvestigationCreate, InvestigationStatusUpdate, InvestigationDecisionUpdate
)
from app.services.audit_service import log_audit_event, create_notification
from app.services.claim_service import ClaimService

class InvestigationService:
    @staticmethod
    def get_investigations_paginated(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status: Optional[InvestigationStatus] = None,
        priority: Optional[RiskLevel] = None,
        investigator_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[InvestigationOut], int]:
        query = db.query(Investigation).options(
            joinedload(Investigation.claim).joinedload(Claim.member),
            joinedload(Investigation.claim).joinedload(Claim.provider),
            joinedload(Investigation.claim).joinedload(Claim.fraud_score),
            joinedload(Investigation.investigator)
        )

        if status:
            query = query.filter(Investigation.status == status)
        if priority:
            query = query.filter(Investigation.priority == priority)
        if investigator_id:
            query = query.filter(Investigation.investigator_id == investigator_id)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.join(Investigation.claim).join(Claim.member).join(Claim.provider).filter(
                or_(
                    Investigation.id.ilike(search_term),
                    Claim.id.ilike(search_term),
                    Member.first_name.ilike(search_term),
                    Member.last_name.ilike(search_term),
                    Provider.name.ilike(search_term)
                )
            )

        total = query.count()
        invs = query.order_by(desc(Investigation.created_at)).offset((page - 1) * page_size).limit(page_size).all()

        results = []
        for inv in invs:
            c = inv.claim
            fs = c.fraud_score if c else None
            mem = c.member if c else None
            prov = c.provider if c else None
            inv_name = f"{inv.investigator.first_name} {inv.investigator.last_name}" if inv.investigator else None

            results.append(InvestigationOut(
                id=inv.id,
                claim_id=inv.claim_id,
                investigator_id=inv.investigator_id,
                investigator_name=inv_name,
                status=inv.status,
                priority=inv.priority,
                findings=inv.findings,
                final_decision=inv.final_decision,
                decision_rationale=inv.decision_rationale,
                opened_at=inv.opened_at,
                closed_at=inv.closed_at,
                created_at=inv.created_at,
                updated_at=inv.updated_at,
                claim_amount=c.claim_amount if c else 0.0,
                member_id=mem.id if mem else "",
                member_name=f"{mem.first_name} {mem.last_name}" if mem else "",
                provider_id=prov.id if prov else "",
                provider_name=prov.name if prov else "",
                fraud_score=fs.risk_score if fs else 0.0,
                risk_level=fs.risk_level if fs else RiskLevel.NORMAL
            ))

        return results, total

    @staticmethod
    def get_investigation_detail(db: Session, investigation_id: str) -> Optional[InvestigationDetailOut]:
        inv = db.query(Investigation).options(
            joinedload(Investigation.claim),
            joinedload(Investigation.investigator),
            joinedload(Investigation.notes).joinedload(InvestigationNote.author),
            joinedload(Investigation.evidence)
        ).filter(Investigation.id == investigation_id).first()

        if not inv:
            return None

        claim_detail = ClaimService.get_claim_detail(db, inv.claim_id)

        inv_name = f"{inv.investigator.first_name} {inv.investigator.last_name}" if inv.investigator else None
        inv_out = InvestigationOut(
            id=inv.id,
            claim_id=inv.claim_id,
            investigator_id=inv.investigator_id,
            investigator_name=inv_name,
            status=inv.status,
            priority=inv.priority,
            findings=inv.findings,
            final_decision=inv.final_decision,
            decision_rationale=inv.decision_rationale,
            opened_at=inv.opened_at,
            closed_at=inv.closed_at,
            created_at=inv.created_at,
            updated_at=inv.updated_at,
            claim_amount=claim_detail.claim.claim_amount if claim_detail else 0.0,
            member_id=claim_detail.member.id if claim_detail else "",
            member_name=f"{claim_detail.member.first_name} {claim_detail.member.last_name}" if claim_detail else "",
            provider_id=claim_detail.provider.id if claim_detail else "",
            provider_name=claim_detail.provider.name if claim_detail else "",
            fraud_score=claim_detail.fraud_score.risk_score if (claim_detail and claim_detail.fraud_score) else 0.0,
            risk_level=claim_detail.fraud_score.risk_level if (claim_detail and claim_detail.fraud_score) else RiskLevel.NORMAL
        )

        notes_out = [
            InvestigationNoteOut(
                id=n.id,
                investigation_id=n.investigation_id,
                author_id=n.author_id,
                author_name=f"{n.author.first_name} {n.author.last_name}" if n.author else n.author_name or "Investigator",
                note_text=n.note_text,
                created_at=n.created_at
            ) for n in sorted(inv.notes, key=lambda x: x.created_at, reverse=True)
        ]

        evidence_out = [
            InvestigationEvidenceOut(
                id=e.id,
                investigation_id=e.investigation_id,
                title=e.title,
                file_type=e.file_type,
                file_url=e.file_url,
                description=e.description,
                uploaded_by=e.uploaded_by,
                uploaded_at=e.uploaded_at
            ) for e in sorted(inv.evidence, key=lambda x: x.uploaded_at, reverse=True)
        ]

        # Audit logs related to this claim or investigation
        audits = db.query(AuditLog).filter(
            or_(
                AuditLog.resource_id == inv.id,
                AuditLog.resource_id == inv.claim_id
            )
        ).order_by(desc(AuditLog.timestamp)).limit(20).all()

        audit_dicts = [{
            "id": a.id,
            "timestamp": a.timestamp.isoformat(),
            "user_email": a.user_email,
            "action": a.action,
            "resource": a.resource,
            "resource_id": a.resource_id,
            "previous_value": a.previous_value_json,
            "new_value": a.new_value_json
        } for a in audits]

        return InvestigationDetailOut(
            investigation=inv_out,
            claim_details=claim_detail.model_dump() if claim_detail else {},
            notes=notes_out,
            evidence=evidence_out,
            audit_history=audit_dicts
        )

    @staticmethod
    def create_investigation(db: Session, inv_in: InvestigationCreate, user: User) -> Investigation:
        existing = db.query(Investigation).filter(
            Investigation.claim_id == inv_in.claim_id,
            Investigation.status.notin_([InvestigationStatus.CLOSED, InvestigationStatus.CONFIRMED_FRAUD, InvestigationStatus.FALSE_POSITIVE])
        ).first()
        if existing:
            return existing

        inv_id = f"INV-{uuid.uuid4().hex[:6].upper()}"
        inv = Investigation(
            id=inv_id,
            claim_id=inv_in.claim_id,
            investigator_id=inv_in.investigator_id or user.id,
            status=InvestigationStatus.ASSIGNED if (inv_in.investigator_id or user.id) else InvestigationStatus.NEW,
            priority=inv_in.priority,
            findings=inv_in.findings or "Manual investigation initiated by risk officer.",
            opened_at=datetime.utcnow()
        )
        db.add(inv)

        # Update claim status
        claim = db.query(Claim).filter(Claim.id == inv_in.claim_id).first()
        if claim:
            claim.claim_status = ClaimStatus.UNDER_INVESTIGATION

        db.commit()
        db.refresh(inv)

        log_audit_event(
            db=db,
            user=user,
            action="INVESTIGATION_OPENED",
            resource="INVESTIGATIONS",
            resource_id=inv_id,
            new_value={"claim_id": inv_in.claim_id, "priority": inv_in.priority.value, "status": inv.status.value}
        )

        return inv

    @staticmethod
    def update_status(db: Session, inv_id: str, update_in: InvestigationStatusUpdate, user: User) -> Optional[Investigation]:
        inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
        if not inv:
            return None

        old_status = inv.status
        inv.status = update_in.status
        inv.updated_at = datetime.utcnow()

        if update_in.notes:
            note = InvestigationNote(
                id=f"NOTE-{uuid.uuid4().hex[:8].upper()}",
                investigation_id=inv_id,
                author_id=user.id,
                author_name=f"{user.first_name} {user.last_name}",
                note_text=f"Status changed from {old_status.value} to {update_in.status.value}. Note: {update_in.notes}"
            )
            db.add(note)

        db.commit()
        db.refresh(inv)

        log_audit_event(
            db=db,
            user=user,
            action="INVESTIGATION_STATUS_CHANGED",
            resource="INVESTIGATIONS",
            resource_id=inv_id,
            previous_value={"status": old_status.value},
            new_value={"status": update_in.status.value, "notes": update_in.notes}
        )

        return inv

    @staticmethod
    def assign_investigator(db: Session, inv_id: str, investigator_id: str, user: User) -> Optional[Investigation]:
        inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
        if not inv:
            return None

        old_inv_id = inv.investigator_id
        inv.investigator_id = investigator_id
        if inv.status == InvestigationStatus.NEW:
            inv.status = InvestigationStatus.ASSIGNED
        inv.updated_at = datetime.utcnow()

        target_user = db.query(User).filter(User.id == investigator_id).first()
        if target_user:
            create_notification(
                db=db,
                title="Investigation Assigned",
                message=f"You have been assigned to investigate claim {inv.claim_id} (Investigation {inv.id})",
                notification_type="ASSIGNMENT",
                recipient_id=target_user.id,
                reference_id=inv.id,
                reference_type="INVESTIGATION"
            )

        db.commit()
        db.refresh(inv)

        log_audit_event(
            db=db,
            user=user,
            action="INVESTIGATION_ASSIGNED",
            resource="INVESTIGATIONS",
            resource_id=inv_id,
            previous_value={"investigator_id": old_inv_id},
            new_value={"investigator_id": investigator_id}
        )

        return inv

    @staticmethod
    def submit_decision(db: Session, inv_id: str, decision_in: InvestigationDecisionUpdate, user: User) -> Optional[Investigation]:
        inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
        if not inv:
            return None

        old_decision = inv.final_decision
        inv.final_decision = decision_in.final_decision
        inv.decision_rationale = decision_in.decision_rationale
        inv.status = decision_in.status
        inv.closed_at = datetime.utcnow() if decision_in.status in [InvestigationStatus.CLOSED, InvestigationStatus.CONFIRMED_FRAUD, InvestigationStatus.FALSE_POSITIVE] else None
        inv.updated_at = datetime.utcnow()

        # Update Claim status based on decision
        claim = db.query(Claim).filter(Claim.id == inv.claim_id).first()
        if claim:
            if decision_in.final_decision == "CONFIRMED_FRAUD":
                claim.claim_status = ClaimStatus.CONFIRMED_FRAUD
                # Update provider fraud counters
                if claim.provider:
                    claim.provider.historical_fraud_count = (claim.provider.historical_fraud_count or 0) + 1
                    total_c = max(claim.provider.historical_claims_count, 1)
                    claim.provider.historical_fraud_rate = round((claim.provider.historical_fraud_count / total_c) * 100, 1)
            elif decision_in.final_decision == "FALSE_POSITIVE":
                claim.claim_status = ClaimStatus.APPROVED
            elif decision_in.final_decision == "ESCALATED":
                claim.claim_status = ClaimStatus.UNDER_INVESTIGATION

        # Record note
        note = InvestigationNote(
            id=f"NOTE-{uuid.uuid4().hex[:8].upper()}",
            investigation_id=inv_id,
            author_id=user.id,
            author_name=f"{user.first_name} {user.last_name}",
            note_text=f"Final Decision recorded: {decision_in.final_decision}. Rationale: {decision_in.decision_rationale}"
        )
        db.add(note)

        db.commit()
        db.refresh(inv)

        log_audit_event(
            db=db,
            user=user,
            action="INVESTIGATION_DECISION_RECORDED",
            resource="INVESTIGATIONS",
            resource_id=inv_id,
            previous_value={"final_decision": old_decision},
            new_value={"final_decision": decision_in.final_decision, "rationale": decision_in.decision_rationale, "status": inv.status.value}
        )

        return inv

    @staticmethod
    def add_note(db: Session, inv_id: str, note_text: str, user: User) -> InvestigationNote:
        note = InvestigationNote(
            id=f"NOTE-{uuid.uuid4().hex[:8].upper()}",
            investigation_id=inv_id,
            author_id=user.id,
            author_name=f"{user.first_name} {user.last_name}",
            note_text=note_text,
            created_at=datetime.utcnow()
        )
        db.add(note)
        db.commit()
        db.refresh(note)

        log_audit_event(
            db=db,
            user=user,
            action="INVESTIGATION_NOTE_ADDED",
            resource="INVESTIGATIONS",
            resource_id=inv_id,
            new_value={"note_id": note.id, "note_length": len(note_text)}
        )
        return note

    @staticmethod
    def add_evidence(db: Session, inv_id: str, title: str, file_type: str, file_url: str, description: Optional[str], user: User) -> InvestigationEvidence:
        ev = InvestigationEvidence(
            id=f"EV-{uuid.uuid4().hex[:8].upper()}",
            investigation_id=inv_id,
            title=title,
            file_type=file_type,
            file_url=file_url,
            description=description,
            uploaded_by=f"{user.first_name} {user.last_name}",
            uploaded_at=datetime.utcnow()
        )
        db.add(ev)
        db.commit()
        db.refresh(ev)

        log_audit_event(
            db=db,
            user=user,
            action="INVESTIGATION_EVIDENCE_ATTACHED",
            resource="INVESTIGATIONS",
            resource_id=inv_id,
            new_value={"evidence_id": ev.id, "title": title, "file_type": file_type}
        )
        return ev
