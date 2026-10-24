import React, { useEffect, useState } from 'react';
import { Ban, AlertTriangle, CheckCircle, RefreshCw, ShieldAlert, ExternalLink, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { CredentialListItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const RevocationPage: React.FC = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Revocation Modal
  const [selectedCred, setSelectedCred] = useState<CredentialListItem | null>(null);
  const [reasonCode, setReasonCode] = useState<string>('ACADEMIC_MISCONDUCT');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [revocationSuccess, setRevocationSuccess] = useState<any | null>(null);

  const fetchCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.credentials.list();
      setCredentials(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCred) return;

    setSubmitting(true);
    setRevocationSuccess(null);
    try {
      const res = await api.credentials.revoke({
        credentialId: selectedCred.credentialId,
        reasonCode
      });
      setRevocationSuccess(res);
      await fetchCredentials();
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Credential Revocation Management</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Cryptographic revocation enforced via smart contract registry state updates
          </p>
        </div>
        <button
          onClick={fetchCredentials}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Revocation notice */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed flex items-start gap-3">
        <Ban size={20} className="text-purple-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Irreversible On-Chain Revocation:</strong> Revoking a credential updates the on-chain registry state on the EVM. Any future verification attempt across all institutions will immediately identify the record as <strong>REVOKED</strong>.
        </div>
      </div>

      {/* Success Notification */}
      {revocationSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle size={16} className="text-emerald-600" />
            <span>Revocation Confirmed on Blockchain!</span>
          </div>
          <p className="font-mono text-[11px] text-emerald-800">
            TxHash: {revocationSuccess.txHash} (Block #{revocationSuccess.blockNumber})
          </p>
          <p className="text-[11px] text-emerald-700">
            Credential ID {revocationSuccess.credentialId} is now officially revoked.
          </p>
        </div>
      )}

      {/* Credentials Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono uppercase text-slate-500 text-[10px]">
              <tr>
                <th className="px-5 py-3">Credential Identifier</th>
                <th className="px-5 py-3">Subject / Student</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Institution</th>
                <th className="px-5 py-3">Current Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {credentials.map((c) => (
                <tr key={c.credentialId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-semibold text-slate-900 truncate max-w-[200px]" title={c.credentialId}>
                    {c.credentialId}
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-800">
                    {c.studentName}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {c.credentialType}
                  </td>
                  <td className="px-5 py-4 font-mono text-[11px] text-slate-600">
                    {c.institutionId}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={c.isRevoked ? 'REVOKED' : 'VERIFIED'} size="sm" />
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!c.isRevoked ? (
                      <button
                        onClick={() => {
                          setSelectedCred(c);
                          setRevocationSuccess(null);
                        }}
                        className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-xs font-semibold transition-colors"
                      >
                        Revoke Credential
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">Revoked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revocation Confirmation Dialog */}
      {selectedCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center gap-3 text-purple-800">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Ban size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Confirm On-Chain Revocation</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to permanently revoke the following credential record on the smart contract registry.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs space-y-1">
              <div>Credential: <strong className="text-slate-900 truncate block">{selectedCred.credentialId}</strong></div>
              <div>Student: <strong className="text-slate-900">{selectedCred.studentName}</strong></div>
              <div>Institution: <strong className="text-slate-900">{selectedCred.institutionId}</strong></div>
            </div>

            <form onSubmit={handleRevokeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Official Reason Code</label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                >
                  <option value="ACADEMIC_MISCONDUCT">ACADEMIC_MISCONDUCT</option>
                  <option value="DATA_ENTRY_ERROR">DATA_ENTRY_ERROR</option>
                  <option value="ADMINISTRATIVE_REVOCATION">ADMINISTRATIVE_REVOCATION</option>
                  <option value="SANCTIONS_OR_DISQUALIFICATION">SANCTIONS_OR_DISQUALIFICATION</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCred(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  {submitting ? 'Committing to Blockchain...' : 'Execute Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
