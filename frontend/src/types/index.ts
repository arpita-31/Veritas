export interface User {
  id: number;
  username: string;
  email: string;
  role: 'governance' | 'admin' | 'issuer' | 'verifier' | 'unauthorized';
  institution_id?: string | null;
  wallet_address?: string | null;
}

export interface DemoPersona {
  username: string;
  displayName: string;
  role: string;
  institutionId?: string | null;
  walletAddress?: string;
  description: string;
}

export interface Institution {
  id: number;
  institution_id: string;
  display_name: string;
  institution_type: string;
  id_hash: string;
  admin_address: string;
  is_active: boolean;
  registration_tx?: string | null;
  registered_at?: string | null;
}

export interface Issuer {
  id: number;
  wallet_address: string;
  institution_id: string;
  is_authorized: boolean;
  authorized_at: string;
  suspended_at?: string | null;
  label?: string | null;
}

export interface CredentialSubject {
  studentName?: string;
  qualification?: string;
  branch?: string;
  completionYear?: number;
  grade?: string;
  recipientName?: string;
  role?: string;
  organization?: string;
  award?: string;
  [key: string]: any;
}

export interface CredentialProof {
  type: string;
  signature: string;
  recordHash: string;
  blockchainTransactionHash?: string;
  blockNumber?: number;
}

export interface SignedCredential {
  credential: {
    schemaVersion: string;
    id: string;
    type: string;
    institutionId: string;
    issuerAddress: string;
    issuanceDate: string;
    expirationDate?: string | null;
    credentialSubject: CredentialSubject;
  };
  proof: CredentialProof;
}

export interface CredentialListItem {
  id: number;
  credentialId: string;
  credentialType: string;
  institutionId: string;
  issuerAddress: string;
  studentName: string;
  recordHash: string;
  isRevoked: boolean;
  revokedAt?: string | null;
  txHash?: string;
  blockNumber?: number;
  createdAt?: string;
}

export interface CheckDetail {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  expected?: string;
  actual?: string;
}

export interface VerifyResponse {
  overallOutcome: 'VERIFIED' | 'TAMPERED' | 'REVOKED' | 'UNAUTHORIZED_ISSUER' | 'UNKNOWN' | 'EXPIRED' | 'INVALID_SIGNATURE' | 'VERIFICATION_UNAVAILABLE';
  isAuthentic: boolean;
  credentialId?: string;
  institutionId?: string;
  issuerAddress?: string;
  checks: CheckDetail[];
  onChainEvidence?: {
    exists?: boolean;
    hashMatches?: boolean;
    isRevoked?: boolean;
    onChainIssuer?: string;
    issuedAt?: number;
    txHash?: string;
  };
  verifiedAt: string;
  summaryMessage: string;
}

export interface BatchVerifyResponse {
  totalProcessed: number;
  verifiedCount: number;
  tamperedCount: number;
  revokedCount: number;
  unauthorizedCount: number;
  failedCount: number;
  results: VerifyResponse[];
}

export interface NetworkInfo {
  connected: boolean;
  chainId?: number | null;
  latestBlock?: number | null;
  contractAddress?: string | null;
  status: string;
  error?: string;
}

export interface DashboardMetrics {
  totalInstitutions: number;
  activeIssuers: number;
  credentialsIssued: number;
  credentialsRevoked: number;
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  networkStatus: NetworkInfo;
  credentialTypeDistribution: Record<string, number>;
  recentActivity: any[];
}
