from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.audit_service import audit_service

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("")
def get_audit_trail(
    eventType: Optional[str] = None,
    institutionId: Optional[str] = None,
    credentialId: Optional[str] = None,
    source: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns unified institutional audit log combining:
    - Smart contract emitted events (InstitutionRegistered, IssuerAuthorized, CredentialIssued, CredentialRevoked)
    - Off-chain system audit records
    """
    return audit_service.get_audit_trail(
        db=db,
        event_type=eventType,
        institution_id=institutionId,
        credential_id=credentialId,
        source=source
    )
