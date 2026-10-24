from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

class CryptoService:
    @staticmethod
    def sign_canonical_payload(canonical_text: str, private_key: str) -> str:
        """
        Signs a canonical string using EIP-191 personal_sign format.
        Returns the hex signature (0x-prefixed).
        """
        signable_message = encode_defunct(text=canonical_text)
        signed = Account.sign_message(signable_message, private_key=private_key)
        sig_hex = signed.signature.hex()
        return sig_hex if sig_hex.startswith("0x") else f"0x{sig_hex}"

    @staticmethod
    def recover_signer_address(canonical_text: str, signature: str) -> str:
        """
        Recovers the Ethereum address that signed the canonical message.
        Raises ValueError if signature is malformed.
        """
        if not signature or not isinstance(signature, str):
            raise ValueError("Empty or invalid signature provided.")

        sig_clean = signature.strip()
        if not sig_clean.startswith("0x"):
            sig_clean = f"0x{sig_clean}"

        try:
            signable_message = encode_defunct(text=canonical_text)
            recovered = Account.recover_message(signable_message, signature=sig_clean)
            return Web3.to_checksum_address(recovered)
        except Exception as e:
            raise ValueError(f"Cryptographic signature recovery failed: {str(e)}")

    @staticmethod
    def verify_signature(canonical_text: str, signature: str, expected_signer: str) -> bool:
        """
        Checks whether signature is valid and matches expected signer address.
        """
        try:
            recovered = CryptoService.recover_signer_address(canonical_text, signature)
            return recovered.lower() == expected_signer.lower()
        except Exception:
            return False

crypto_service = CryptoService()
