from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    role: str
    institution_id: Optional[str] = None
    wallet_address: Optional[str] = None

# --- Institution Schemas ---
class InstitutionCreate(BaseModel):
    institution_id: str
    display_name: str
    institution_type: Optional[str] = "Higher Education"
    admin_address: str

class InstitutionResponse(BaseModel):
    id: int
    institution_id: str
    display_name: str
    institution_type: str
    id_hash: str
    admin_address: str
    is_active: bool
    registration_tx: Optional[str] = None
    registered_at: Any

# --- Issuer Schemas ---
class IssuerAuthorizeRequest(BaseModel):
    institution_id: str
    issuer_address: str
    label: Optional[str] = None

class IssuerSuspendRequest(BaseModel):
    institution_id: str
    issuer_address: str

class IssuerResponse(BaseModel):
    id: int
    wallet_address: str
    institution_id: str
    is_authorized: bool
    authorized_at: Any
    suspended_at: Optional[Any] = None
    label: Optional[str] = None

# --- Credential Schemas ---
class CredentialCreateRequest(BaseModel):
    institutionId: str
    credentialType: str = "AcademicCertificate"
    expirationDate: Optional[str] = None
    credentialSubject: Dict[str, Any]

class CredentialProof(BaseModel):
    type: str = "EIP191PersonalSign"
    signature: str
    recordHash: str
    blockchainTransactionHash: Optional[str] = None
    blockNumber: Optional[int] = None

class SignedCredential(BaseModel):
    credential: Dict[str, Any]
    proof: CredentialProof

class CredentialRevokeRequest(BaseModel):
    credentialId: str
    reasonCode: str = "ADMINISTRATIVE_REVOCATION"

# --- Verification Schemas ---
class CheckDetail(BaseModel):
    name: str
    status: str # "PASS", "FAIL", "WARN"
    message: str
    expected: Optional[str] = None
    actual: Optional[str] = None

class VerifyRequest(BaseModel):
    credentialPayload: Dict[str, Any]

class VerifyResponse(BaseModel):
    overallOutcome: str # "VERIFIED", "TAMPERED", "REVOKED", "UNAUTHORIZED_ISSUER", "UNKNOWN", "EXPIRED", "INVALID_SIGNATURE", "VERIFICATION_UNAVAILABLE"
    isAuthentic: bool
    credentialId: Optional[str] = None
    institutionId: Optional[str] = None
    issuerAddress: Optional[str] = None
    checks: List[CheckDetail]
    onChainEvidence: Optional[Dict[str, Any]] = None
    verifiedAt: str
    summaryMessage: str

class BatchVerifyRequest(BaseModel):
    credentials: List[Dict[str, Any]]

class BatchVerifyResponse(BaseModel):
    totalProcessed: int
    verifiedCount: int
    tamperedCount: int
    revokedCount: int
    unauthorizedCount: int
    failedCount: int
    results: List[VerifyResponse]

# --- Dashboard & Audit ---
class DashboardMetrics(BaseModel):
    totalInstitutions: int
    activeIssuers: int
    credentialsIssued: int
    credentialsRevoked: int
    totalVerifications: int
    successfulVerifications: int
    failedVerifications: int
    networkStatus: Dict[str, Any]
    credentialTypeDistribution: Dict[str, int]
    recentActivity: List[Dict[str, Any]]

class AuditFilter(BaseModel):
    eventType: Optional[str] = None
    institutionId: Optional[str] = None
    credentialId: Optional[str] = None
    source: Optional[str] = None # "blockchain" or "offchain"
