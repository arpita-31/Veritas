import pytest
from app.services.crypto_service import crypto_service
from app.config import settings

def test_signature_creation_and_recovery():
    """
    Tests that a canonical payload signed with an issuer private key
    recovers the exact expected Ethereum address.
    """
    issuer_addr = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    private_key = settings.DEV_PRIVATE_KEYS[issuer_addr]

    canonical_text = '{"credential":{"id":"urn:uuid:test","studentName":"Rohan"}}'
    signature = crypto_service.sign_canonical_payload(canonical_text, private_key)

    assert signature.startswith("0x")
    assert len(signature) == 132 # 65 bytes = 130 hex chars + 2 ('0x')

    recovered = crypto_service.recover_signer_address(canonical_text, signature)
    assert recovered.lower() == issuer_addr.lower()

    # Test verify helper
    assert crypto_service.verify_signature(canonical_text, signature, issuer_addr) is True

def test_tampered_payload_signature_recovery():
    """
    Proves that altering even one character in the payload causes
    recovered signer address to NOT match the original issuer address.
    """
    issuer_addr = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    private_key = settings.DEV_PRIVATE_KEYS[issuer_addr]

    original_text = '{"grade":"First Class","student":"Neha"}'
    tampered_text = '{"grade":"Distinction","student":"Neha"}'

    signature = crypto_service.sign_canonical_payload(original_text, private_key)

    recovered_from_tampered = crypto_service.recover_signer_address(tampered_text, signature)

    # Recovered address for altered text will be a completely different address
    assert recovered_from_tampered.lower() != issuer_addr.lower()
    assert crypto_service.verify_signature(tampered_text, signature, issuer_addr) is False

def test_malformed_signature_handling():
    """
    Ensures safe error handling for malformed or garbage signatures.
    """
    canonical_text = '{"test":1}'

    with pytest.raises(ValueError):
        crypto_service.recover_signer_address(canonical_text, "0xInvalidSignatureBytes")

    with pytest.raises(ValueError):
        crypto_service.recover_signer_address(canonical_text, "")
