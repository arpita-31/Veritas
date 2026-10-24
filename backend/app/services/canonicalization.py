import json
from eth_utils import keccak

def sort_keys_recursively(obj):
    """
    Recursively sorts dictionary keys to guarantee deterministic serialization.
    Handles nested dicts, lists, and primitives.
    """
    if isinstance(obj, dict):
        return {k: sort_keys_recursively(v) for k, v in sorted(obj.items())}
    elif isinstance(obj, list):
        return [sort_keys_recursively(elem) for elem in obj]
    else:
        return obj

def canonicalize_json(data: dict) -> str:
    """
    Deterministic canonical JSON serializer:
    - Recursively sorted keys
    - UTF-8 encoding without whitespace
    - Uniform separators (',', ':')
    - Does not alter datatypes
    """
    sorted_data = sort_keys_recursively(data)
    return json.dumps(sorted_data, separators=(",", ":"), ensure_ascii=False)

def compute_keccak256_hex(data: str) -> str:
    """
    Calculates keccak256 hash of UTF-8 encoded string.
    Returns 0x-prefixed 64-character hex string.
    """
    raw_bytes = data.encode("utf-8")
    hash_bytes = keccak(raw_bytes)
    return "0x" + hash_bytes.hex()

def compute_record_hash(credential_payload: dict) -> str:
    """
    Computes keccak256(UTF8(canonicalJson(credential)))
    If passed the full envelope, extracts the 'credential' sub-object.
    Excludes any 'proof' field.
    """
    if "credential" in credential_payload:
        target = credential_payload["credential"]
    else:
        target = {k: v for k, v in credential_payload.items() if k != "proof"}

    canonical_str = canonicalize_json(target)
    return compute_keccak256_hex(canonical_str)

def compute_identifier_hash(identifier: str) -> str:
    """
    Computes keccak256(UTF8(identifier)) with 0x prefix.
    Used for credentialIdHash and institutionIdHash.
    """
    return compute_keccak256_hex(identifier.strip())
