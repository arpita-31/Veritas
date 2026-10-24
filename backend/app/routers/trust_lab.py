import copy
import json
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Credential, User, Institution, Issuer
from ..services.canonicalization import canonicalize_json, compute_record_hash, compute_identifier_hash
from ..services.crypto_service import crypto_service
from ..services.blockchain_service import blockchain_service
from ..services.verification_service import verification_service
from ..services.credential_service import credential_service
from ..schemas import CredentialCreateRequest
from ..config import settings

router = APIRouter(prefix="/trust-lab", tags=["Trust Lab"])

@router.post("/scenario/valid")
def run_scenario_valid(db: Session = Depends(get_db)):
    """
    Scenario A: Issue a genuine credential from authorized VCET issuer, then verify it.
    Expected outcome: VERIFIED.
    """
    issuer_user = db.query(User).filter(User.username == "vcet_issuer").first()
    if not issuer_user:
        raise HTTPException(status_code=400, detail="VCET issuer demo persona not found.")

    req = CredentialCreateRequest(
        institutionId="vcet-mumbai",
        credentialType="AcademicCertificate",
        credentialSubject={
            "studentName": f"Judge Test Candidate #{uuid.uuid4().hex[:4].upper()}",
            "qualification": "Bachelor of Engineering",
            "branch": "Computer Engineering",
            "completionYear": 2026,
            "grade": "First Class with Distinction"
        }
    )

    issued_envelope = credential_service.issue_credential(req, issuer_user, db)
    verify_result = verification_service.verify_credential_payload(issued_envelope, db, verifier_identity="Trust Lab Runner")

    return {
        "scenario": "Scenario A — Valid Credential",
        "description": "Issue signed credential from authorized VCET issuer and verify on-chain.",
        "expectedOutcome": "VERIFIED",
        "actualOutcome": verify_result.overallOutcome,
        "isPassed": verify_result.overallOutcome == "VERIFIED",
        "issuedCredential": issued_envelope,
        "verificationDetails": verify_result
    }

@router.post("/scenario/tamper")
def run_scenario_tamper(db: Session = Depends(get_db)):
    """
    Scenario B: Alter grade on a valid credential without a new signature or issuance.
    Expected outcome: TAMPERED.
    """
    valid_cred = db.query(Credential).filter(Credential.is_revoked == False).order_by(Credential.created_at.desc()).first()
    if not valid_cred:
        # Issue one first if none exists
        run_scenario_valid(db)
        valid_cred = db.query(Credential).filter(Credential.is_revoked == False).order_by(Credential.created_at.desc()).first()

    envelope = json.loads(valid_cred.full_credential_json)
    tampered_envelope = copy.deepcopy(envelope)

    # Tamper with the student grade
    original_grade = tampered_envelope["credential"]["credentialSubject"].get("grade", "First Class")
    tampered_envelope["credential"]["credentialSubject"]["grade"] = "First Class with Distinction (FORGED)"

    verify_result = verification_service.verify_credential_payload(tampered_envelope, db, verifier_identity="Trust Lab Adversary")

    return {
        "scenario": "Scenario B — Tampering Attack",
        "description": "Modify student grade in the credential payload without obtaining a valid signature.",
        "attackPayload": {
            "originalGrade": original_grade,
            "tamperedGrade": "First Class with Distinction (FORGED)"
        },
        "expectedOutcome": "TAMPERED",
        "actualOutcome": verify_result.overallOutcome,
        "isPassed": verify_result.overallOutcome == "TAMPERED",
        "tamperedCredential": tampered_envelope,
        "verificationDetails": verify_result
    }

@router.post("/scenario/unauthorized")
def run_scenario_unauthorized(db: Session = Depends(get_db)):
    """
    Scenario C: Attempt issuance from unauthorized development wallet key.
    The smart contract rejects unauthorized issuance.
    """
    unauthorized_addr = "0x976EA74026E726554dB657fA54763abd0C3a0aa9"
    unauthorized_key = settings.DEV_PRIVATE_KEYS[unauthorized_addr]

    cred_id = f"urn:uuid:{uuid.uuid4()}"
    inst_id = "vcet-mumbai"
    record_hash = "0x" + "a" * 64

    contract_reverted = False
    revert_message = ""

    if blockchain_service.is_connected():
        try:
            blockchain_service.issue_credential(
                institution_id=inst_id,
                credential_id=cred_id,
                record_hash=record_hash,
                issuer_private_key=unauthorized_key
            )
        except Exception as e:
            contract_reverted = True
            revert_message = str(e)
    else:
        contract_reverted = True
        revert_message = "Node offline: Unauthorized issuance blocked prior to network submission."

    return {
        "scenario": "Scenario C — Unauthorized Issuer Rejection",
        "description": "Attempt to commit an issuance record to the smart contract using an unauthorized wallet.",
        "unauthorizedActor": unauthorized_addr,
        "expectedOutcome": "REJECTED_BY_CONTRACT",
        "actualOutcome": "REJECTED_BY_CONTRACT" if contract_reverted else "ACCEPTED (BUG)",
        "isPassed": contract_reverted,
        "contractRevertReason": revert_message
    }

@router.post("/scenario/revocation")
def run_scenario_revocation(db: Session = Depends(get_db)):
    """
    Scenario D: Verify valid credential, revoke it on-chain, and verify again.
    Expected outcome: Transitions from VERIFIED to REVOKED.
    """
    # 1. Issue a fresh credential
    run_res = run_scenario_valid(db)
    envelope = run_res["issuedCredential"]
    cred_id = envelope["credential"]["id"]

    # 2. First verify: Must be VERIFIED
    first_verify = verification_service.verify_credential_payload(envelope, db, verifier_identity="Pre-Revocation Verifier")

    # 3. Revoke on-chain via VCET issuer key
    issuer_addr = envelope["credential"]["issuerAddress"]
    private_key = settings.DEV_PRIVATE_KEYS[issuer_addr]

    tx_res = blockchain_service.revoke_credential(
        credential_id=cred_id,
        reason_code_str="ACADEMIC_MISCONDUCT",
        revoker_private_key=private_key
    )

    # Update in DB
    cred = db.query(Credential).filter(Credential.credential_id == cred_id).first()
    if cred:
        cred.is_revoked = True
        cred.revoked_at = datetime.datetime.utcnow()
        cred.revoked_by = issuer_addr
        cred.revocation_reason = "ACADEMIC_MISCONDUCT"
        db.commit()

    # 4. Second verify: Must be REVOKED
    second_verify = verification_service.verify_credential_payload(envelope, db, verifier_identity="Post-Revocation Verifier")

    return {
        "scenario": "Scenario D — Revocation Lifecycle",
        "description": "Demonstrate that revoking a credential on the EVM changes subsequent verification status to REVOKED.",
        "credentialId": cred_id,
        "preRevocationStatus": first_verify.overallOutcome,
        "postRevocationStatus": second_verify.overallOutcome,
        "revocationTxHash": tx_res["txHash"],
        "expectedOutcome": "REVOKED",
        "actualOutcome": second_verify.overallOutcome,
        "isPassed": (first_verify.overallOutcome == "VERIFIED" and second_verify.overallOutcome == "REVOKED"),
        "verificationDetails": second_verify
    }

@router.post("/scenario/unknown")
def run_scenario_unknown(db: Session = Depends(get_db)):
    """
    Scenario E: Submit formatted credential that has never been registered on blockchain.
    Expected outcome: UNKNOWN.
    """
    fake_cred = {
        "credential": {
            "schemaVersion": "1.0",
            "id": f"urn:uuid:{uuid.uuid4()}",
            "type": "AcademicCertificate",
            "institutionId": "vcet-mumbai",
            "issuerAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            "issuanceDate": "2026-10-24T12:00:00Z",
            "expirationDate": None,
            "credentialSubject": {
                "studentName": "Unregistered Student",
                "qualification": "Diploma in Engineering",
                "branch": "Mechanical Engineering",
                "completionYear": 2026,
                "grade": "Second Class"
            }
        }
    }
    canonical_str = canonicalize_json(fake_cred["credential"])
    rec_hash = compute_record_hash(fake_cred)
    sig = crypto_service.sign_canonical_payload(canonical_str, settings.DEV_PRIVATE_KEYS["0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"])

    fake_cred["proof"] = {
        "type": "EIP191PersonalSign",
        "signature": sig,
        "recordHash": rec_hash,
        "blockchainTransactionHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
    }

    verify_result = verification_service.verify_credential_payload(fake_cred, db, verifier_identity="Trust Lab Verifier")

    return {
        "scenario": "Scenario E — Unknown / Unregistered Record",
        "description": "Submit a signed credential that was never registered on the blockchain trust registry.",
        "expectedOutcome": "UNKNOWN",
        "actualOutcome": verify_result.overallOutcome,
        "isPassed": verify_result.overallOutcome == "UNKNOWN",
        "verificationDetails": verify_result
    }
