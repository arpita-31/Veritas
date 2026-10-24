import copy
import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Credential
from ..schemas import VerifyRequest, VerifyResponse, BatchVerifyRequest, BatchVerifyResponse
from ..services.verification_service import verification_service

router = APIRouter(prefix="/verification", tags=["Verification"])

@router.post("/verify", response_model=VerifyResponse)
def verify_credential(req: VerifyRequest, db: Session = Depends(get_db)):
    """
    Performs complete cryptographic and on-chain verification of a presented credential envelope.
    Does NOT require accessing the issuing institution's private database.
    """
    return verification_service.verify_credential_payload(req.credentialPayload, db)

@router.post("/batch", response_model=BatchVerifyResponse)
def batch_verify(req: BatchVerifyRequest, db: Session = Depends(get_db)):
    """
    Independently verifies multiple credential envelopes.
    Aggregates metrics: verified, tampered, revoked, unauthorized, failed.
    """
    results: List[VerifyResponse] = []
    verified_cnt = 0
    tampered_cnt = 0
    revoked_cnt = 0
    unauth_cnt = 0
    failed_cnt = 0

    for item in req.credentials:
        res = verification_service.verify_credential_payload(item, db)
        results.append(res)
        if res.overallOutcome == "VERIFIED":
            verified_cnt += 1
        elif res.overallOutcome == "TAMPERED":
            tampered_cnt += 1
        elif res.overallOutcome == "REVOKED":
            revoked_cnt += 1
        elif res.overallOutcome == "UNAUTHORIZED_ISSUER":
            unauth_cnt += 1
        else:
            failed_cnt += 1

    return BatchVerifyResponse(
        totalProcessed=len(req.credentials),
        verifiedCount=verified_cnt,
        tamperedCount=tampered_cnt,
        revokedCount=revoked_cnt,
        unauthorizedCount=unauth_cnt,
        failedCount=failed_cnt,
        results=results
    )

@router.get("/sample/{sample_type}")
def get_sample_credential(sample_type: str, db: Session = Depends(get_db)):
    """
    Provides demo credentials for one-click testing in the verification screen:
    - 'valid': Genuine issued credential
    - 'tampered': Genuine credential with modified grade ('First Class' -> 'Distinction (Tampered)')
    - 'revoked': Revoked credential
    """
    # Try fetching a valid credential from DB
    valid_cred = db.query(Credential).filter(Credential.is_revoked == False).order_by(Credential.created_at.desc()).first()

    if not valid_cred:
        # Fallback synthetic demo payload
        return {
            "credential": {
                "schemaVersion": "1.0",
                "id": "urn:uuid:00000000-0000-0000-0000-000000000001",
                "type": "AcademicCertificate",
                "institutionId": "vcet-mumbai",
                "issuerAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                "issuanceDate": "2026-10-24T12:00:00Z",
                "expirationDate": None,
                "credentialSubject": {
                    "studentName": "Demo Student",
                    "qualification": "Bachelor of Engineering",
                    "branch": "Computer Engineering",
                    "completionYear": 2026,
                    "grade": "First Class with Distinction"
                }
            },
            "proof": {
                "type": "EIP191PersonalSign",
                "signature": "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "recordHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "blockchainTransactionHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
            }
        }

    envelope = json.loads(valid_cred.full_credential_json)

    if sample_type == "tampered":
        tampered_env = copy.deepcopy(envelope)
        subj = tampered_env["credential"]["credentialSubject"]
        if "grade" in subj:
            subj["grade"] = "Grade A+ (Tampered Mark)"
        else:
            subj["status"] = "Tampered Status"
        return tampered_env

    elif sample_type == "revoked":
        revoked_cred = db.query(Credential).filter(Credential.is_revoked == True).first()
        if revoked_cred:
            return json.loads(revoked_cred.full_credential_json)
        return envelope

    return envelope
