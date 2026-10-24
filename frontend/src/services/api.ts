import {
  User,
  DemoPersona,
  Institution,
  Issuer,
  SignedCredential,
  CredentialListItem,
  VerifyResponse,
  BatchVerifyResponse,
  DashboardMetrics
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('veritas_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const err = await res.json();
      errorDetail = err.detail || err.message || JSON.stringify(err);
    } catch {
      errorDetail = `HTTP Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Authentication
  auth: {
    getDemoPersonas: (): Promise<DemoPersona[]> =>
      fetch(`${API_BASE}/auth/demo-personas`).then((res) => handleResponse<DemoPersona[]>(res)),

    login: async (username: string, password = 'password123'): Promise<{ access_token: string; user: User }> => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await handleResponse<{ access_token: string; user: User }>(res);
      localStorage.setItem('veritas_token', data.access_token);
      localStorage.setItem('veritas_user', JSON.stringify(data.user));
      return data;
    },

    getMe: (): Promise<User> =>
      fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() }
      }).then((res) => handleResponse<User>(res)),

    logout: () => {
      localStorage.removeItem('veritas_token');
      localStorage.removeItem('veritas_user');
    }
  },

  // Institutions
  institutions: {
    list: (): Promise<Institution[]> =>
      fetch(`${API_BASE}/institutions`).then((res) => handleResponse<Institution[]>(res)),

    get: (id: string): Promise<Institution> =>
      fetch(`${API_BASE}/institutions/${id}`).then((res) => handleResponse<Institution>(res)),

    create: (data: { institution_id: string; display_name: string; institution_type?: string; admin_address: string }): Promise<Institution> =>
      fetch(`${API_BASE}/institutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      }).then((res) => handleResponse<Institution>(res))
  },

  // Issuers
  issuers: {
    list: (institutionId?: string): Promise<Issuer[]> => {
      const url = institutionId ? `${API_BASE}/issuers?institution_id=${institutionId}` : `${API_BASE}/issuers`;
      return fetch(url).then((res) => handleResponse<Issuer[]>(res));
    },

    authorize: (data: { institution_id: string; issuer_address: string; label?: string }): Promise<Issuer> =>
      fetch(`${API_BASE}/issuers/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      }).then((res) => handleResponse<Issuer>(res)),

    suspend: (data: { institution_id: string; issuer_address: string }): Promise<Issuer> =>
      fetch(`${API_BASE}/issuers/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      }).then((res) => handleResponse<Issuer>(res))
  },

  // Credentials
  credentials: {
    issue: (data: {
      institutionId: string;
      credentialType: string;
      credentialSubject: Record<string, any>;
      expirationDate?: string | null;
    }): Promise<SignedCredential> =>
      fetch(`${API_BASE}/credentials/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      }).then((res) => handleResponse<SignedCredential>(res)),

    list: (institutionId?: string): Promise<CredentialListItem[]> => {
      const url = institutionId ? `${API_BASE}/credentials?institution_id=${institutionId}` : `${API_BASE}/credentials`;
      return fetch(url, { headers: { ...getAuthHeader() } }).then((res) => handleResponse<CredentialListItem[]>(res));
    },

    get: (credentialId: string): Promise<SignedCredential> =>
      fetch(`${API_BASE}/credentials/${credentialId}`).then((res) => handleResponse<SignedCredential>(res)),

    revoke: (data: { credentialId: string; reasonCode: string }): Promise<any> =>
      fetch(`${API_BASE}/credentials/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
      }).then((res) => handleResponse<any>(res))
  },

  // Verification
  verification: {
    verify: (credentialPayload: Record<string, any>): Promise<VerifyResponse> =>
      fetch(`${API_BASE}/verification/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialPayload })
      }).then((res) => handleResponse<VerifyResponse>(res)),

    batchVerify: (credentials: Record<string, any>[]): Promise<BatchVerifyResponse> =>
      fetch(`${API_BASE}/verification/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials })
      }).then((res) => handleResponse<BatchVerifyResponse>(res)),

    getSample: (type: 'valid' | 'tampered' | 'revoked'): Promise<Record<string, any>> =>
      fetch(`${API_BASE}/verification/sample/${type}`).then((res) => handleResponse<Record<string, any>>(res))
  },

  // Audit
  audit: {
    getTrail: (filters?: { eventType?: string; institutionId?: string; source?: string }): Promise<any[]> => {
      const params = new URLSearchParams();
      if (filters?.eventType) params.append('eventType', filters.eventType);
      if (filters?.institutionId) params.append('institutionId', filters.institutionId);
      if (filters?.source) params.append('source', filters.source);
      return fetch(`${API_BASE}/audit?${params.toString()}`).then((res) => handleResponse<any[]>(res));
    }
  },

  // Dashboard
  dashboard: {
    getMetrics: (): Promise<DashboardMetrics> =>
      fetch(`${API_BASE}/dashboard/metrics`).then((res) => handleResponse<DashboardMetrics>(res))
  },

  // Trust Lab (Adversarial Demonstration Scenarios)
  trustLab: {
    runValid: (): Promise<any> =>
      fetch(`${API_BASE}/trust-lab/scenario/valid`, { method: 'POST' }).then((res) => handleResponse<any>(res)),

    runTamper: (): Promise<any> =>
      fetch(`${API_BASE}/trust-lab/scenario/tamper`, { method: 'POST' }).then((res) => handleResponse<any>(res)),

    runUnauthorized: (): Promise<any> =>
      fetch(`${API_BASE}/trust-lab/scenario/unauthorized`, { method: 'POST' }).then((res) => handleResponse<any>(res)),

    runRevocation: (): Promise<any> =>
      fetch(`${API_BASE}/trust-lab/scenario/revocation`, { method: 'POST' }).then((res) => handleResponse<any>(res)),

    runUnknown: (): Promise<any> =>
      fetch(`${API_BASE}/trust-lab/scenario/unknown`, { method: 'POST' }).then((res) => handleResponse<any>(res))
  },

  // Health
  health: {
    check: (): Promise<any> =>
      fetch(`${API_BASE}/health`).then((res) => handleResponse<any>(res))
  }
};
