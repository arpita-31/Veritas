import pytest
from app.services.canonicalization import (
    canonicalize_json,
    compute_record_hash,
    compute_identifier_hash
)

def test_canonical_json_key_order_independence():
    """
    Proves that logically identical payloads with differing key order
    produce exact byte-for-byte identical canonical representations and hashes.
    """
    dict_a = {
        "id": "urn:uuid:12345",
        "institutionId": "vcet-mumbai",
        "credentialSubject": {
            "studentName": "Aarav Sharma",
            "branch": "Computer Engineering",
            "grade": "Distinction"
        },
        "type": "AcademicCertificate"
    }

    dict_b = {
        "type": "AcademicCertificate",
        "credentialSubject": {
            "grade": "Distinction",
            "studentName": "Aarav Sharma",
            "branch": "Computer Engineering"
        },
        "id": "urn:uuid:12345",
        "institutionId": "vcet-mumbai"
    }

    canon_a = canonicalize_json(dict_a)
    canon_b = canonicalize_json(dict_b)

    assert canon_a == canon_b, "Canonical representations must match regardless of dictionary key order"

    hash_a = compute_record_hash({"credential": dict_a})
    hash_b = compute_record_hash({"credential": dict_b})

    assert hash_a == hash_b, "Record hashes must be identical for logically identical payloads"

def test_canonical_json_excludes_proof_envelope():
    """
    Verifies that the proof envelope is excluded from recordHash computation.
    """
    cred_body = {
        "id": "urn:uuid:9999",
        "studentName": "Test Student"
    }

    envelope_with_proof = {
        "credential": cred_body,
        "proof": {
            "type": "EIP191PersonalSign",
            "signature": "0x1234567890abcdef"
        }
    }

    hash_from_envelope = compute_record_hash(envelope_with_proof)
    hash_from_pure_cred = compute_record_hash({"credential": cred_body})

    assert hash_from_envelope == hash_from_pure_cred

def test_identifier_hash_is_deterministic():
    id_1 = "vcet-mumbai"
    id_2 = "vcet-mumbai " # whitespace stripped
    hash_1 = compute_identifier_hash(id_1)
    hash_2 = compute_identifier_hash(id_2)

    assert hash_1 == hash_2
    assert hash_1.startswith("0x")
    assert len(hash_1) == 66
