import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Credential, User
from ..schemas import CredentialCreateRequest, CredentialRevokeRequest
from ..security.auth_handler import get_current_user
from ..services.credential_service import credential_service
from ..services.revocation_service import revocation_service

router = APIRouter(prefix="/credentials", tags=["Credentials"])

@router.post("/issue")
def issue_credential(
    req: CredentialCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Issues a new verifiable credential, signs payload, commits reference to EVM registry."""
    return credential_service.issue_credential(req, current_user, db)

@router.get("")
def list_credentials(
    institution_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List credentials. For institutions, filters by user's institution or requested institution.
    """
    query = db.query(Credential)
    if institution_id:
        query = query.filter(Credential.institution_id == institution_id)
    elif current_user.institution_id:
        query = query.filter(Credential.institution_id == current_user.institution_id)

    creds = query.order_by(Credential.created_at.desc()).all()
    results = []
    for c in creds:
        # Extract studentName or basic summary from stored JSON without exposing everything
        subject_name = "N/A"
        try:
            full = json.loads(c.full_credential_json)
            subject_name = full.get("credential", {}).get("credentialSubject", {}).get("studentName", "N/A")
        except Exception:
            pass

        results.append({
            "id": c.id,
            "credentialId": c.credential_id,
            "credentialType": c.credential_type,
            "institutionId": c.institution_id,
            "issuerAddress": c.issuer_address,
            "studentName": subject_name,
            "recordHash": c.record_hash,
            "isRevoked": c.is_revoked,
            "revokedAt": c.revoked_at.isoformat() if c.revoked_at else None,
            "txHash": c.tx_hash,
            "blockNumber": c.block_number,
            "createdAt": c.created_at.isoformat() if c.created_at else None
        })
    return results

@router.get("/{credential_id}")
def get_credential(credential_id: str, db: Session = Depends(get_db)):
    """Downloads or views the full signed credential JSON for presentation."""
    cred = db.query(Credential).filter(Credential.credential_id == credential_id).first()
    if not cred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")
    try:
        return json.loads(cred.full_credential_json)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Credential corrupt in database")

@router.post("/revoke")
def revoke_credential(
    req: CredentialRevokeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revokes an authentic credential through the smart contract registry."""
    return revocation_service.revoke_credential(req, current_user, db)
