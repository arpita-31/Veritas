# VERITAS
### Verifiable Institutional Records and Trust Infrastructure for Authenticity, Traceability, and Auditability

> **Tagline:** *Trust the proof. Verify the source. Protect the data.*  
> **Competition Track:** Decentralized Institutional Data and Trust Infrastructure | Full-Stack Blockchain MVP

---
<img width="1521" height="695" alt="image" src="https://github.com/user-attachments/assets/3a8dd036-14d5-4968-8a43-c6739c2a7f87" />


## 1. Executive Summary & Problem Statement

Educational institutions, universities, and enterprise credential issuers face severe challenges with record verification:
- **Centralized Vulnerabilities:** Centralized verification databases create single points of failure, downtime, and privacy breaches.
- **Communication Delays:** Cross-institution credential verification requires tedious manual back-and-forth or API integration dependencies.
- **Tampering Risks:** Digital certificates (PDFs, paper, or plain JSON) can easily have grades or names edited without detection.
- **Database Exposure Risk:** Verifiers traditionally demand direct API access or complete institutional student database dumps.

### The VERITAS Solution
VERITAS is a decentralized trust infrastructure combining:
1. **Solidity Smart Contract Trust Registry (`InstitutionalTrustRegistry.sol`):** Enforces institutional identity management, authorized issuer signing keys, issuance hashes, and irrevocable status revocation on an EVM blockchain.
2. **Deterministic Canonical Serialization & Hashing:** Canonical JSON recursive sorting ensures mathematically identical byte representations across languages.
3. **EIP-191 ECDSA Cryptographic Signatures:** Ethereum-compatible `personal_sign` proofs recover exact signing addresses without exposing private keys.
4. **Privacy by Design:** Zero personal details (names, grades, roll numbers) are ever written to the blockchain, transaction inputs, or event logs.
5. **Independent Cross-Institution Verification:** Receiving employers or partner universities verify credentials mathematically against the blockchain without contacting the issuing institution's database.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Issuing Institution
        Admin["Institution Administrator\n(VCET Admin)"] -->|Authorizes Signing Keys| RegistryContract
        Issuer["Authorized Registrar\n(VCET Issuer Key)"] -->|Signs Canonical JSON| BackendService["FastAPI Cryptography Service"]
        BackendService -->|Commits recordHash| RegistryContract["InstitutionalTrustRegistry.sol\n(EVM Blockchain)"]
        BackendService -->|Saves Full JSON Off-Chain| LocalDB[("Off-Chain DB\n(SQLite / PostgreSQL)")]
    end

    subgraph Holder
        BackendService -->|Downloads Portable Credential| Holder["Student / Credential Holder\n(JSON + QR Code)"]
    end

    subgraph Receiving Institution / Verifier
        Holder -->|Presents Credential| VerifierApp["VERITAS Verification Center\n(Independent Verifier)"]
        VerifierApp -->|1. Canonicalizes & Rehashes| HashCheck["Payload Integrity Check\n(Local Hash == proof.recordHash)"]
        VerifierApp -->|2. Recovers ECDSA Signer| SigCheck["Signer Address Recovery\n(ecRecover(canonical, sig))"]
        VerifierApp -->|3. Queries Registry| RegistryContract
        RegistryContract -->|Returns isAuthorized, exists, isRevoked| OnChainProof["Blockchain State Match"]
        OnChainProof -->|Pass / Fail Evaluation| FinalStatus["Verdict: VERIFIED / TAMPERED / REVOKED"]
    end
```

---

## 3. Privacy Architecture: What Goes On-Chain?

| Layer | Stored Data | Security & Privacy Rationale |
| :--- | :--- | :--- |
| **ON-CHAIN**<br>*(Public EVM Registry)* | • `institutionIdHash` (`keccak256(UTF8(institutionId))`)<br>• `credentialIdHash` (`keccak256(UTF8(credentialId))`)<br>• `recordHash` (`keccak256(canonicalJson)`<br>• Authorized Issuer Wallet Addresses (`0x...`)<br>• Revocation Flags (`isRevoked`, `revokedAt`, `reasonCode`)<br>• Audit Events (`CredentialIssued`, `CredentialRevoked`) | **Strictly Opaque:** No reverse engineering of student identity or marks is mathematically possible from cryptographic hashes. Immutable trust and tamper detection without data leakage. |
| **OFF-CHAIN**<br>*(Holder & Local DB)* | • Student Name (`studentName`)<br>• Degree / Qualification (`qualification`)<br>• Discipline / Branch (`branch`)<br>• Completion Year & Marks / Grade (`grade`)<br>• Full Credential JSON Envelope with ECDSA signature | **Zero On-Chain Exposure:** Private academic and personal details remain with the holder and can be verified across organizational boundaries without a central database. |

---

## 4. Technology Stack

- **Smart Contracts:** Solidity `^0.8.20`, Hardhat 2, Ethers.js v6.
- **Backend:** Python 3.11, FastAPI, Pydantic v2, SQLAlchemy, Web3.py, `eth-account`, `bcrypt`, `python-jose`.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Lucide React, Recharts, `qrcode.react`.
- **Testing:** Hardhat Chai Matchers (Solidity), Pytest (Python/Backend), Vite Build Checker.

---

## 5. Quick Start & Execution Guide

### Prerequisites
- Node.js (v18+ or v20+) and npm.
- Python 3.10+ or 3.11+.

### Automated Launch (Windows PowerShell)
To launch all services with one script:
```powershell
.\start-all.ps1
```

### Automated Full Test Suite (Windows PowerShell)
To execute all contract, backend, and build tests:
```powershell
.\test-all.ps1
```

---

### Step-by-Step Manual Setup

#### Step 1: Start the Local EVM Node
```powershell
cd contracts
npm install
npx hardhat node
```
*Keep this terminal running (node listens on `http://127.0.0.1:8545`).*

#### Step 2: Deploy Contracts & Seed Entities
In a second terminal:
```powershell
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
*This deploys `InstitutionalTrustRegistry`, registers VCET Mumbai and Partner University, authorizes issuer signing keys, and writes deployment info to `backend/app/contract_info.json`.*

#### Step 3: Start the FastAPI Backend
In a third terminal:
```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*FastAPI documentation will be available at `http://127.0.0.1:8000/docs`.*

#### Step 4: Start the React Frontend
In a fourth terminal:
```powershell
cd frontend
npm install
npm run dev
```
*Open your browser at `http://localhost:5173`.*

---

## 6. Preconfigured Development Personas

| Persona Name | Role | Institution | Dev Wallet Address | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **VCET Administrator** | `admin` | `vcet-mumbai` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Authorize/suspend VCET issuers, manage institution records |
| **VCET Academic Registrar** | `issuer` | `vcet-mumbai` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Authorized signing key for issuing VCET degrees |
| **Partner University Admin** | `admin` | `partner-univ` | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | Controls Partner University issuers |
| **Partner University Issuer** | `issuer` | `partner-univ` | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | Authorized signer for Partner University |
| **Global Verifier** | `verifier`| Independent | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | Evaluates presented credentials across boundaries |
| **Unauthorized Actor** | `unauthorized`| Sandbox | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | Used in adversarial lab to test on-chain rejection |

---

## 7. Automated Test Suite & Actual Recorded Results

All tests were executed against the actual deployed Solidity contract and backend services:

### 1. Smart Contract Test Suite (`contracts/test/InstitutionalTrustRegistry.test.js`)
Command: `npx hardhat test`
```text
  InstitutionalTrustRegistry
    1. Institution Registration & Governance
      √ Test 1: Authorized governance registers a valid institution
      √ Test 2: Unauthorized governance registration is rejected
      √ Rejects duplicate institution registration
    2. Issuer Authorization Management
      √ Test 3: An institution administrator authorizes an issuer
      √ Test 4: An unrelated account cannot authorize an issuer for another institution
      √ Test 12: Issuer suspension removes current issuance authorization
    3. Credential Issuance
      √ Test 5: An authorized issuer successfully registers a valid credential issuance reference
      √ Test 6: An unauthorized wallet cannot register an issuance reference
      √ Test 7: A credential cannot be registered twice under the same ID
    4. Credential Revocation
      √ Test 8: A credential from an unrelated institution cannot be revoked by another institution's administrator
      √ Test 9: An authorized actor revokes a valid credential
      √ Test 10: An unknown credential cannot be revoked
      √ Test 11: Duplicate or invalid revocation operations fail safely
      √ Test 13: Event fields contain no names, marks, or full credential payloads

  14 passing (856ms)
```

### 2. Backend Cryptography & Acceptance Tests (`backend/tests/`)
Command: `python -m pytest tests/ -v`
```text
tests/test_acceptance_e2e.py::test_health_check PASSED                   [  9%]
tests/test_acceptance_e2e.py::test_acceptance_1_valid_credential_verification PASSED [ 18%]
tests/test_acceptance_e2e.py::test_acceptance_2_tampered_credential PASSED [ 27%]
tests/test_acceptance_e2e.py::test_acceptance_3_unauthorized_issuer_rejection PASSED [ 36%]
tests/test_acceptance_e2e.py::test_acceptance_4_expired_credential_detection PASSED [ 45%]
tests/test_canonicalization.py::test_canonical_json_key_order_independence PASSED [ 54%]
tests/test_canonicalization.py::test_canonical_json_excludes_proof_envelope PASSED [ 63%]
tests/test_canonicalization.py::test_identifier_hash_is_deterministic PASSED [ 72%]
tests/test_crypto.py::test_signature_creation_and_recovery PASSED        [ 81%]
tests/test_crypto.py::test_tampered_payload_signature_recovery PASSED    [ 90%]
tests/test_crypto.py::test_malformed_signature_handling PASSED           [100%]

======================== 11 passed, 1 warning in 2.45s ========================
```

### 3. Trust Lab Live Adversarial Verification
```text
Scenario A (Valid Credential): VERIFIED | PASSED: True
Scenario B (Tampering Attack): TAMPERED | PASSED: True
Scenario C (Unauthorized Issuer): REJECTED_BY_CONTRACT | PASSED: True
Scenario D (Revocation Lifecycle): REVOKED | PASSED: True
Scenario E (Unknown Record): UNKNOWN | PASSED: True
=== ALL 5 ADVERSARIAL SCENARIOS VERIFIED SUCCESSFULLY ===
```

---



## 8. Feature Checklist & Implementation Status

- [x] **Smart Contract (`InstitutionalTrustRegistry.sol`):** Real Solidity contract with custom errors, events, and existence flags.
- [x] **Automated Contract Tests:** 14 Hardhat tests covering registration, cross-institution rejection, duplicate issuance, and revocation.
- [x] **FastAPI Backend:** Modular design with authentication, canonicalization, cryptography, blockchain integration, and audit services.
- [x] **Real Cryptography:** EIP-191 personal signing and address recovery via `eth-account` with zero placeholder signatures.
- [x] **Deterministic Canonical JSON:** Recursive key-sorting utility with byte-for-byte consistency tests.
- [x] **Privacy By Design:** Student personal data kept strictly off-chain; only opaque hashes on-chain.
- [x] **React + TypeScript Frontend:** Clean institutional B2B aesthetic, responsive layout, and zero mock buttons.
- [x] **Verification Center:** 7-point technical checklist with clear failure explanations.
- [x] **Security Trust Lab:** Interactive adversarial testing suite with live pass/fail evidence.
- [x] **Issuer Key Rotation:** Workflow for suspending compromised keys and authorizing replacement identities.
- [x] **QR-Enabled Credentials:** Portable QR generation for mobile presentation and scanning.
- [x] **Batch Verification:** Bulk credential processing with CSV export.
- [x] **Audit Explorer:** Searchable timeline of real blockchain events and off-chain logs.
- [x] **Privacy Transparency Panel:** "What Goes On-Chain?" interactive modal.
- [x] **Automated Acceptance Tests:** All 4 required scenarios verified and passing.

---

*VERITAS: Engineered with precision for the Blockchain Competition.*
