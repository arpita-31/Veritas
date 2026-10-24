import uuid
import json
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models import Credential, Institution, Issuer, AuditRecord, User
from ..schemas import CredentialCreateRequest, SignedCredential, CredentialProof
from ..config import settings
from .canonicalization import canonicalize_json, compute_record_hash, compute_identifier_hash
from .crypto_service import crypto_service
from .blockchain_service import blockchain_service

class CredentialService:
    @staticmethod
    def issue_credential(
        req: CredentialCreateRequest,
        current_user: User,
        db: Session
    ) -> Dict[str, Any]:
        """
        Executes end-to-end credential issuance:
        1. Authorization check
        2. UUID generation
        3. Canonical hashing
        4. EIP-191 signing
        5. Blockchain commitment
        6. Off-chain database storage
        7. Audit logging
        """
        # Validate institution
        inst = db.query(Institution).filter(Institution.institution_id == req.institutionId).first()
        if not inst or not inst.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Institution '{req.institutionId}' is not registered or not active."
            )

        # Validate issuer permission
        # In demo flow: current_user.wallet_address must be an authorized issuer for this institution
        issuer_addr = current_user.wallet_address
        if not issuer_addr:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current user has no associated wallet address for signing."
            )

        # Check DB issuer record
        issuer_rec = db.query(Issuer).filter(
            Issuer.wallet_address == issuer_addr,
            Issuer.institution_id == req.institutionId,
            Issuer.is_authorized == True
        ).first()

        if not issuer_rec:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Wallet {issuer_addr} is not an authorized issuer for institution '{req.institutionId}'."
            )

        # Dev key lookup
        private_key = settings.DEV_PRIVATE_KEYS.get(issuer_addr)
        if not private_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Signing key for {issuer_addr} not provisioned in key manager."
            )

        # Check on-chain authorization (blockchain source of truth)
        if blockchain_service.is_connected():
            try:
                is_auth_on_chain = blockchain_service.is_issuer_authorized(req.institutionId, issuer_addr)
                if not is_auth_on_chain:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Issuer {issuer_addr} is revoked or not authorized on the smart contract registry."
                    )
            except Exception as e:
                if isinstance(e, HTTPException):
                    raise e
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to query on-chain issuer status: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="EVM node is unreachable. Cannot issue credentials without blockchain verification."
            )

        # Generate Credential ID and Payload
        cred_id = f"urn:uuid:{uuid.uuid4()}"
        now_iso = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        credential_payload = {
            "schemaVersion": "1.0",
            "id": cred_id,
            "type": req.credentialType,
            "institutionId": req.institutionId,
            "issuerAddress": issuer_addr,
            "issuanceDate": now_iso,
            "expirationDate": req.expirationDate,
            "credentialSubject": req.credentialSubject
        }

        # Canonicalize and hash
        canonical_cred_str = canonicalize_json(credential_payload)
        record_hash = compute_record_hash({"credential": credential_payload})
        cred_id_hash = compute_identifier_hash(cred_id)

        # Sign with issuer private key
        signature = crypto_service.sign_canonical_payload(canonical_cred_str, private_key)

        # Self-check recovered signer
        recovered_signer = crypto_service.recover_signer_address(canonical_cred_str, signature)
        if recovered_signer.lower() != issuer_addr.lower():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cryptographic self-check failed: recovered address does not match issuer."
            )

        # Commit to Blockchain
        try:
            tx_result = blockchain_service.issue_credential(
                institution_id=req.institutionId,
                credential_id=cred_id,
                record_hash=record_hash,
                issuer_private_key=private_key
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Blockchain transaction failed: {str(e)}"
            )

        full_envelope = {
            "credential": credential_payload,
            "proof": {
                "type": "EIP191PersonalSign",
                "signature": signature,
                "recordHash": record_hash,
                "blockchainTransactionHash": tx_result["txHash"],
                "blockNumber": tx_result["blockNumber"]
            }
        }

        # Persist Off-Chain
        db_cred = Credential(
            credential_id=cred_id,
            credential_type=req.credentialType,
            institution_id=req.institutionId,
            issuer_address=issuer_addr,
            full_credential_json=json.dumps(full_envelope),
            record_hash=record_hash,
            credential_id_hash=cred_id_hash,
            is_revoked=False,
            tx_hash=tx_result["txHash"],
            block_number=tx_result["blockNumber"]
        )
        db.add(db_cred)

        # Off-chain Audit Record
        audit_rec = AuditRecord(
            event_type="CredentialIssued",
            source="blockchain",
            actor_address=issuer_addr,
            institution_id=req.institutionId,
            credential_id=cred_id,
            tx_hash=tx_result["txHash"],
            block_number=tx_result["blockNumber"],
            details_json=json.dumps({
                "credentialType": req.credentialType,
                "recordHash": record_hash,
                "credentialIdHash": cred_id_hash
            })
        )
        db.add(audit_rec)
        db.commit()
        db.refresh(db_cred)

        return full_envelope

credential_service = CredentialService()
