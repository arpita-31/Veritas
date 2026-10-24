import os
import json
from typing import Optional, Dict, Any, List
from web3 import Web3
from web3.exceptions import ContractCustomError, TransactionNotFound
from ..config import settings
from .canonicalization import compute_identifier_hash

class BlockchainService:
    def __init__(self):
        self.rpc_url = settings.RPC_URL
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.contract = None
        self.contract_address = None
        self.abi = None
        self.load_contract()

    def load_contract(self):
        """Loads contract address and ABI from contract_info.json if available."""
        if os.path.exists(settings.CONTRACT_INFO_PATH):
            try:
                with open(settings.CONTRACT_INFO_PATH, "r", encoding="utf-8") as f:
                    info = json.load(f)
                    self.contract_address = Web3.to_checksum_address(info["address"])
                    self.abi = info["abi"]
                    self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)
            except Exception as e:
                print(f"[BlockchainService] Warning: Could not initialize contract: {e}")

    def is_connected(self) -> bool:
        """Checks if local EVM node is reachable."""
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def get_network_info(self) -> Dict[str, Any]:
        """Returns node and contract connectivity status."""
        connected = self.is_connected()
        if not connected:
            return {
                "connected": False,
                "chainId": None,
                "latestBlock": None,
                "contractAddress": self.contract_address,
                "status": "EVM node unreachable"
            }
        try:
            chain_id = self.w3.eth.chain_id
            latest_block = self.w3.eth.block_number
            return {
                "connected": True,
                "chainId": chain_id,
                "latestBlock": latest_block,
                "contractAddress": self.contract_address,
                "status": "Operational"
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "contractAddress": self.contract_address,
                "status": "Error"
            }

    def _ensure_ready(self):
        if not self.is_connected():
            raise ConnectionError("Blockchain node is currently unreachable at " + self.rpc_url)
        if not self.contract:
            self.load_contract()
        if not self.contract:
            raise RuntimeError("InstitutionalTrustRegistry contract is not loaded or deployed.")

    def get_institution(self, institution_id: str) -> Dict[str, Any]:
        """Look up institution details on-chain."""
        self._ensure_ready()
        inst_hash = bytes.fromhex(compute_identifier_hash(institution_id)[2:])
        admin, is_active, registered_at, name, exists = self.contract.functions.getInstitution(inst_hash).call()
        return {
            "institutionId": institution_id,
            "institutionIdHash": "0x" + inst_hash.hex(),
            "admin": admin,
            "isActive": is_active,
            "registeredAt": registered_at,
            "name": name,
            "exists": exists
        }

    def is_issuer_authorized(self, institution_id: str, issuer_address: str) -> bool:
        """Checks whether issuer is active and authorized for institution on-chain."""
        self._ensure_ready()
        inst_hash = bytes.fromhex(compute_identifier_hash(institution_id)[2:])
        checksum_issuer = Web3.to_checksum_address(issuer_address)
        return self.contract.functions.isIssuerValid(inst_hash, checksum_issuer).call()

    def issue_credential(
        self,
        institution_id: str,
        credential_id: str,
        record_hash: str,
        issuer_private_key: str
    ) -> Dict[str, Any]:
        """
        Commits a credential issuance reference to the smart contract.
        Transaction must be signed by the authorized issuer.
        """
        self._ensure_ready()
        inst_hash = bytes.fromhex(compute_identifier_hash(institution_id)[2:])
        cred_id_hash = bytes.fromhex(compute_identifier_hash(credential_id)[2:])
        clean_record_hash = bytes.fromhex(record_hash[2:] if record_hash.startswith("0x") else record_hash)

        account = self.w3.eth.account.from_key(issuer_private_key)
        issuer_addr = account.address

        nonce = self.w3.eth.get_transaction_count(issuer_addr, "pending")
        gas_price = self.w3.eth.gas_price

        # Build transaction
        tx = self.contract.functions.issueCredential(
            inst_hash,
            cred_id_hash,
            clean_record_hash
        ).build_transaction({
            "from": issuer_addr,
            "nonce": nonce,
            "gas": 300000,
            "gasPrice": gas_price,
            "chainId": self.w3.eth.chain_id
        })

        signed_tx = self.w3.eth.account.sign_transaction(tx, issuer_private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

        if receipt.status != 1:
            raise RuntimeError(f"Issuance transaction reverted on-chain. TxHash: {tx_hash.hex()}")

        return {
            "txHash": tx_hash.hex() if tx_hash.hex().startswith("0x") else "0x" + tx_hash.hex(),
            "blockNumber": receipt.blockNumber,
            "status": "SUCCESS",
            "gasUsed": receipt.gasUsed
        }

    def revoke_credential(
        self,
        credential_id: str,
        reason_code_str: str,
        revoker_private_key: str
    ) -> Dict[str, Any]:
        """
        Revokes a credential on-chain.
        Can only be called by an authorized issuer or institution administrator.
        """
        self._ensure_ready()
        cred_id_hash = bytes.fromhex(compute_identifier_hash(credential_id)[2:])
        reason_hash = bytes.fromhex(compute_identifier_hash(reason_code_str)[2:])

        account = self.w3.eth.account.from_key(revoker_private_key)
        revoker_addr = account.address

        nonce = self.w3.eth.get_transaction_count(revoker_addr, "pending")
        gas_price = self.w3.eth.gas_price

        tx = self.contract.functions.revokeCredential(
            cred_id_hash,
            reason_hash
        ).build_transaction({
            "from": revoker_addr,
            "nonce": nonce,
            "gas": 250000,
            "gasPrice": gas_price,
            "chainId": self.w3.eth.chain_id
        })

        signed_tx = self.w3.eth.account.sign_transaction(tx, revoker_private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

        if receipt.status != 1:
            raise RuntimeError(f"Revocation transaction reverted on-chain. TxHash: {tx_hash.hex()}")

        return {
            "txHash": tx_hash.hex() if tx_hash.hex().startswith("0x") else "0x" + tx_hash.hex(),
            "blockNumber": receipt.blockNumber,
            "status": "SUCCESS",
            "gasUsed": receipt.gasUsed
        }

    def verify_credential_status(
        self,
        credential_id: str,
        record_hash: str
    ) -> Dict[str, Any]:
        """
        Checks current on-chain state for credential:
        - exists
        - hashMatches
        - isRevoked
        - issuer
        - issuedAt
        """
        self._ensure_ready()
        cred_id_hash = bytes.fromhex(compute_identifier_hash(credential_id)[2:])
        clean_record_hash = bytes.fromhex(record_hash[2:] if record_hash.startswith("0x") else record_hash)

        exists, hash_matches, is_revoked, issuer, issued_at = (
            self.contract.functions.verifyCredentialStatus(cred_id_hash, clean_record_hash).call()
        )

        return {
            "exists": exists,
            "hashMatches": hash_matches,
            "isRevoked": is_revoked,
            "issuer": issuer,
            "issuedAt": issued_at
        }

    def get_credential_record(self, credential_id: str) -> Dict[str, Any]:
        """Returns the full record stored on-chain."""
        self._ensure_ready()
        cred_id_hash = bytes.fromhex(compute_identifier_hash(credential_id)[2:])

        (
            inst_hash,
            rec_hash,
            issuer,
            issued_at,
            exists,
            is_revoked,
            revoked_at,
            revoked_by,
            reason_code
        ) = self.contract.functions.getCredentialRecord(cred_id_hash).call()

        return {
            "credentialId": credential_id,
            "credentialIdHash": "0x" + cred_id_hash.hex(),
            "institutionIdHash": "0x" + inst_hash.hex(),
            "recordHash": "0x" + rec_hash.hex(),
            "issuer": issuer,
            "issuedAt": issued_at,
            "exists": exists,
            "isRevoked": is_revoked,
            "revokedAt": revoked_at,
            "revokedBy": revoked_by,
            "reasonCode": "0x" + reason_code.hex()
        }

    def fetch_all_events(self, from_block: int = 0) -> List[Dict[str, Any]]:
        """
        Retrieves all emitted events from the deployed contract:
        - InstitutionRegistered
        - IssuerAuthorized
        - IssuerSuspended
        - CredentialIssued
        - CredentialRevoked
        """
        if not self.is_connected() or not self.contract:
            return []

        all_events = []
        try:
            latest = self.w3.eth.block_number

            # Helper for filtering
            event_types = [
                ("InstitutionRegistered", self.contract.events.InstitutionRegistered),
                ("IssuerAuthorized", self.contract.events.IssuerAuthorized),
                ("IssuerSuspended", self.contract.events.IssuerSuspended),
                ("CredentialIssued", self.contract.events.CredentialIssued),
                ("CredentialRevoked", self.contract.events.CredentialRevoked),
            ]

            for name, event_contract in event_types:
                try:
                    entries = event_contract().get_logs(from_block=from_block, to_block=latest)
                    for log in entries:
                        args_dict = dict(log["args"])
                        # Format bytes32 to hex strings
                        formatted_args = {}
                        for k, v in args_dict.items():
                            if isinstance(v, bytes):
                                formatted_args[k] = "0x" + v.hex()
                            else:
                                formatted_args[k] = v

                        all_events.append({
                            "eventType": name,
                            "txHash": log["transactionHash"].hex() if isinstance(log["transactionHash"], bytes) else str(log["transactionHash"]),
                            "blockNumber": log["blockNumber"],
                            "args": formatted_args
                        })
                except Exception as ex:
                    print(f"Error fetching logs for {name}: {ex}")

            # Sort by blockNumber descending
            all_events.sort(key=lambda x: x["blockNumber"], reverse=True)
            return all_events
        except Exception as e:
            print(f"Failed to fetch blockchain events: {e}")
            return []

blockchain_service = BlockchainService()
