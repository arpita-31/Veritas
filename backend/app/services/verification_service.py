import json
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from ..models import VerificationLog, Institution
from ..schemas import VerifyResponse, CheckDetail
from .canonicalization import canonicalize_json, compute_record_hash, compute_identifier_hash
from .crypto_service import crypto_service
from .blockchain_service import blockchain_service

class VerificationService:
    @staticmethod
    def verify_credential_payload(
        payload: Dict[str, Any],
        db: Session,
        verifier_identity: str = "Anonymous Verifier"
    ) -> VerifyResponse:
        checks: List[CheckDetail] = []
        overall_outcome = "VERIFIED"
        summary_message = "Credential verified successfully. The record is authentic, authorized, and active."
        on_chain_evidence: Dict[str, Any] = {}
        now_iso = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        # 1. Structural Envelope Validation
        if not isinstance(payload, dict) or "credential" not in payload or "proof" not in payload:
            checks.append(CheckDetail(
                name="Envelope Structure",
                status="FAIL",
                message="Credential missing required 'credential' or 'proof' envelopes.",
                expected="Envelope containing {'credential': {...}, 'proof': {...}}",
                actual=str(type(payload))
            ))
            outcome = "INVALID_SIGNATURE"
            VerificationService._log_verification(db, None, outcome, checks, verifier_identity)
            return VerifyResponse(
                overallOutcome=outcome,
                isAuthentic=False,
                checks=checks,
                verifiedAt=now_iso,
                summaryMessage="Credential envelope structure is invalid."
            )

        cred = payload.get("credential", {})
        proof = payload.get("proof", {})

        cred_id = cred.get("id", "UNKNOWN_ID")
        institution_id = cred.get("institutionId", "UNKNOWN_INST")
        claimed_issuer = cred.get("issuerAddress", "UNKNOWN_ISSUER")
        claimed_record_hash = proof.get("recordHash")
        signature = proof.get("signature")
        exp_date_str = cred.get("expirationDate")

        # Check 1: Canonical Serialization and Payload Integrity (Tamper Detection)
        try:
            canonical_cred = canonicalize_json(cred)
            calculated_record_hash = compute_record_hash({"credential": cred})

            if claimed_record_hash and calculated_record_hash.lower() == claimed_record_hash.lower():
                checks.append(CheckDetail(
                    name="Payload Integrity",
                    status="PASS",
                    message="Payload matches declared cryptographic record hash.",
                    expected=claimed_record_hash,
                    actual=calculated_record_hash
                ))
            else:
                checks.append(CheckDetail(
                    name="Payload Integrity",
                    status="FAIL",
                    message="Payload was modified! Recomputed hash does not match proof record hash.",
                    expected=claimed_record_hash or "Valid Hash",
                    actual=calculated_record_hash
                ))
                overall_outcome = "TAMPERED"
                summary_message = "Tampering detected: Credential data was altered after signing."
        except Exception as e:
            checks.append(CheckDetail(
                name="Payload Integrity",
                status="FAIL",
                message=f"Canonical serialization error: {str(e)}",
                expected="Valid Canonical JSON",
                actual="Serialization Error"
            ))
            overall_outcome = "TAMPERED"

        # Check 2: Cryptographic Signature & Signer Recovery
        recovered_signer = None
        try:
            recovered_signer = crypto_service.recover_signer_address(canonical_cred, signature)
            if recovered_signer.lower() == claimed_issuer.lower():
                checks.append(CheckDetail(
                    name="Digital Signature",
                    status="PASS",
                    message="Valid EIP-191 personal signature. Recovered signer matches claimed issuer.",
                    expected=claimed_issuer,
                    actual=recovered_signer
                ))
            else:
                checks.append(CheckDetail(
                    name="Digital Signature",
                    status="FAIL",
                    message="Signer mismatch! Recovered signer does not match claimed issuer address.",
                    expected=claimed_issuer,
                    actual=recovered_signer
                ))
                if overall_outcome == "VERIFIED":
                    overall_outcome = "UNAUTHORIZED_ISSUER"
                    summary_message = "Signature is signed by a different address than declared issuer."
        except Exception as e:
            checks.append(CheckDetail(
                name="Digital Signature",
                status="FAIL",
                message=f"Signature verification failed: {str(e)}",
                expected="Valid EIP-191 ECDSA Signature",
                actual="Invalid or Malformed Signature"
            ))
            if overall_outcome == "VERIFIED":
                overall_outcome = "INVALID_SIGNATURE"
                summary_message = "The cryptographic proof is invalid or corrupted."

        # Check 3: Blockchain Connectivity & Node Readiness
        is_node_connected = blockchain_service.is_connected()
        if not is_node_connected:
            checks.append(CheckDetail(
                name="Blockchain Registry Connectivity",
                status="FAIL",
                message="Cannot connect to EVM blockchain node. Verification cannot be confirmed.",
                expected="Connected to EVM Node (127.0.0.1:8545)",
                actual="Node Offline"
            ))
            if overall_outcome == "VERIFIED":
                overall_outcome = "VERIFICATION_UNAVAILABLE"
                summary_message = "Blockchain network is currently unreachable."
        else:
            checks.append(CheckDetail(
                name="Blockchain Registry Connectivity",
                status="PASS",
                message="EVM Trust Registry is online and responsive.",
                expected="EVM Node Active",
                actual="Connected"
            ))

        # Check 4: Institutional Issuer Authorization on Blockchain
        if is_node_connected and recovered_signer:
            try:
                is_authorized = blockchain_service.is_issuer_authorized(institution_id, recovered_signer)
                if is_authorized:
                    checks.append(CheckDetail(
                        name="Issuer Institutional Authorization",
                        status="PASS",
                        message=f"Signer {recovered_signer} is verified as an active authorized issuer for '{institution_id}'.",
                        expected=f"Authorized Issuer for {institution_id}",
                        actual="Authorized"
                    ))
                else:
                    checks.append(CheckDetail(
                        name="Issuer Institutional Authorization",
                        status="FAIL",
                        message=f"Signer {recovered_signer} is NOT currently authorized for institution '{institution_id}'.",
                        expected=f"Authorized Issuer for {institution_id}",
                        actual="Unauthorized or Suspended"
                    ))
                    if overall_outcome == "VERIFIED":
                        overall_outcome = "UNAUTHORIZED_ISSUER"
                        summary_message = "Signer is not authorized to issue credentials for this institution."
            except Exception as e:
                checks.append(CheckDetail(
                    name="Issuer Institutional Authorization",
                    status="FAIL",
                    message=f"On-chain issuer query failed: {str(e)}",
                    expected="Authorized",
                    actual="Error querying registry"
                ))
                if overall_outcome == "VERIFIED":
                    overall_outcome = "UNAUTHORIZED_ISSUER"

        # Check 5: Blockchain Issuance Reference Match
        if is_node_connected:
            try:
                status_res = blockchain_service.verify_credential_status(cred_id, calculated_record_hash)
                on_chain_evidence = {
                    "exists": status_res["exists"],
                    "hashMatches": status_res["hashMatches"],
                    "isRevoked": status_res["isRevoked"],
                    "onChainIssuer": status_res["issuer"],
                    "issuedAt": status_res["issuedAt"],
                    "txHash": proof.get("blockchainTransactionHash")
                }

                if not status_res["exists"]:
                    checks.append(CheckDetail(
                        name="Blockchain Issuance Reference",
                        status="FAIL",
                        message="No matching issuance reference found on the blockchain trust registry.",
                        expected="Registered on-chain",
                        actual="Not Found"
                    ))
                    if overall_outcome == "VERIFIED":
                        overall_outcome = "UNKNOWN"
                        summary_message = "Credential has never been committed to the institutional registry."
                elif not status_res["hashMatches"]:
                    checks.append(CheckDetail(
                        name="Blockchain Issuance Reference",
                        status="FAIL",
                        message="On-chain issuance record hash does not match credential contents!",
                        expected="Matching Record Hash",
                        actual="Hash Mismatch"
                    ))
                    overall_outcome = "TAMPERED"
                    summary_message = "On-chain record hash differs from presented credential."
                else:
                    checks.append(CheckDetail(
                        name="Blockchain Issuance Reference",
                        status="PASS",
                        message="Issuance reference confirmed on blockchain with identical record hash.",
                        expected="Confirmed on-chain",
                        actual="Matched"
                    ))

                # Check 6: Revocation Status
                if status_res["isRevoked"]:
                    checks.append(CheckDetail(
                        name="Revocation Status",
                        status="FAIL",
                        message="Credential has been revoked by the issuing institution.",
                        expected="Active / Not Revoked",
                        actual="REVOKED"
                    ))
                    if overall_outcome in ["VERIFIED", "UNKNOWN"]:
                        overall_outcome = "REVOKED"
                        summary_message = "This credential was revoked and is no longer valid."
                else:
                    checks.append(CheckDetail(
                        name="Revocation Status",
                        status="PASS",
                        message="Credential is in active standing (not revoked).",
                        expected="Not Revoked",
                        actual="Active"
                    ))
            except Exception as e:
                checks.append(CheckDetail(
                    name="Blockchain Issuance Reference",
                    status="FAIL",
                    message=f"Blockchain lookup error: {str(e)}",
                    expected="Valid lookup",
                    actual="Error"
                ))
                if overall_outcome == "VERIFIED":
                    overall_outcome = "VERIFICATION_UNAVAILABLE"

        # Check 7: Expiration Check
        if exp_date_str:
            try:
                # Parse expiration date
                clean_exp = exp_date_str.replace("Z", "+00:00")
                exp_dt = datetime.datetime.fromisoformat(clean_exp)
                now_dt = datetime.datetime.now(datetime.timezone.utc)
                if now_dt > exp_dt:
                    checks.append(CheckDetail(
                        name="Expiration Status",
                        status="FAIL",
                        message=f"Credential expired on {exp_date_str}.",
                        expected=f"Future date (> {now_iso})",
                        actual=exp_date_str
                    ))
                    if overall_outcome == "VERIFIED":
                        overall_outcome = "EXPIRED"
                        summary_message = "The credential has expired."
                else:
                    checks.append(CheckDetail(
                        name="Expiration Status",
                        status="PASS",
                        message=f"Credential is valid until {exp_date_str}.",
                        expected="Active",
                        actual=f"Expires {exp_date_str}"
                    ))
            except Exception as e:
                checks.append(CheckDetail(
                    name="Expiration Status",
                    status="WARN",
                    message=f"Could not parse expiration date '{exp_date_str}': {str(e)}",
                    expected="ISO-8601 Date",
                    actual=exp_date_str
                ))
        else:
            checks.append(CheckDetail(
                name="Expiration Status",
                status="PASS",
                message="Credential has no expiration date (permanent academic record).",
                expected="No Expiration",
                actual="Permanent"
            ))

        # Log verification attempt in SQLite
        VerificationService._log_verification(db, cred_id, overall_outcome, checks, verifier_identity)

        is_authentic = (overall_outcome == "VERIFIED")
        return VerifyResponse(
            overallOutcome=overall_outcome,
            isAuthentic=is_authentic,
            credentialId=cred_id,
            institutionId=institution_id,
            issuerAddress=claimed_issuer,
            checks=checks,
            onChainEvidence=on_chain_evidence,
            verifiedAt=now_iso,
            summaryMessage=summary_message
        )

    @staticmethod
    def _log_verification(
        db: Session,
        credential_id: str,
        outcome: str,
        checks: List[CheckDetail],
        verifier_identity: str
    ):
        try:
            checks_dicts = [c.model_dump() for c in checks]
            log = VerificationLog(
                credential_id=credential_id,
                overall_outcome=outcome,
                checks_json=json.dumps(checks_dicts),
                verifier_identity=verifier_identity,
                verified_at=datetime.datetime.utcnow(),
                error_details=None if outcome == "VERIFIED" else outcome
            )
            db.add(log)
            db.commit()
        except Exception as e:
            print(f"[VerificationService] Warning: Failed to write verification log: {e}")

verification_service = VerificationService()
