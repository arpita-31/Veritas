import json
import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models import Credential, Institution, Issuer, AuditRecord, User
from ..schemas import CredentialRevokeRequest
from ..config import settings
from .blockchain_service import blockchain_service

class RevocationService:
    @staticmethod
    def revoke_credential(
        req: CredentialRevokeRequest,
        current_user: User,
        db: Session
    ) -> Dict[str, Any]:
        cred = db.query(Credential).filter(Credential.credential_id == req.credentialId).first()
        if not cred:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Credential '{req.credentialId}' not found in registry."
            )

        if cred.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Credential '{req.credentialId}' is already marked revoked."
            )

        inst = db.query(Institution).filter(Institution.institution_id == cred.institution_id).first()
        if not inst:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Issuing institution not found.")

        # Check authorization: caller must be inst admin, authorized issuer of this inst, or governance
        caller_addr = current_user.wallet_address
        if not caller_addr:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Caller has no wallet address configured.")

        is_gov = (current_user.role == "governance")
        is_inst_admin = (caller_addr.lower() == inst.admin_address.lower())
        is_auth_issuer = db.query(Issuer).filter(
            Issuer.wallet_address == caller_addr,
            Issuer.institution_id == cred.institution_id,
            Issuer.is_authorized == True
        ).first() is not None

        if not (is_gov or is_inst_admin or is_auth_issuer):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Wallet {caller_addr} is not authorized to revoke credentials for institution '{cred.institution_id}'."
            )

        # Get private key for caller
        private_key = settings.DEV_PRIVATE_KEYS.get(caller_addr)
        if not private_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Private key for revoker {caller_addr} not available in dev key manager."
            )

        # Execute blockchain transaction
        if not blockchain_service.is_connected():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Blockchain node is unreachable. Cannot process on-chain revocation."
            )

        try:
            tx_res = blockchain_service.revoke_credential(
                credential_id=req.credentialId,
                reason_code_str=req.reasonCode,
                revoker_private_key=private_key
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"On-chain revocation reverted: {str(e)}"
            )

        # Update database record
        now = datetime.datetime.utcnow()
        cred.is_revoked = True
        cred.revoked_at = now
        cred.revoked_by = caller_addr
        cred.revocation_reason = req.reasonCode

        # Off-chain Audit log
        audit = AuditRecord(
            event_type="CredentialRevoked",
            source="blockchain",
            actor_address=caller_addr,
            institution_id=cred.institution_id,
            credential_id=cred.credential_id,
            tx_hash=tx_res["txHash"],
            block_number=tx_res["blockNumber"],
            details_json=json.dumps({
                "reasonCode": req.reasonCode,
                "revokedBy": caller_addr
            })
        )
        db.add(audit)
        db.commit()
        db.refresh(cred)

        return {
            "credentialId": cred.credential_id,
            "isRevoked": True,
            "revokedAt": cred.revoked_at.isoformat() + "Z",
            "revokedBy": caller_addr,
            "reasonCode": req.reasonCode,
            "txHash": tx_res["txHash"],
            "blockNumber": tx_res["blockNumber"]
        }

revocation_service = RevocationService()
