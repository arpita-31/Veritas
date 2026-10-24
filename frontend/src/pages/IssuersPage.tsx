import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle, Ban, Plus, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Issuer, Institution } from '../types';
import { useAuth } from '../context/AuthContext';

export const IssuersPage: React.FC = () => {
  const { user } = useAuth();
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Authorize form
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [targetInstId, setTargetInstId] = useState<string>('vcet-mumbai');
  const [issuerWallet, setIssuerWallet] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [issList, instList] = await Promise.all([
        api.issuers.list(),
        api.institutions.list()
      ]);
      setIssuers(issList);
      setInstitutions(instList);
      if (instList.length > 0) setTargetInstId(user?.institution_id || instList[0].institution_id);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch issuer registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInstId || !issuerWallet) return;
    setSubmitting(true);
    try {
      await api.issuers.authorize({
        institution_id: targetInstId,
        issuer_address: issuerWallet,
        label: label || undefined
      });
      setShowAuthModal(false);
      setIssuerWallet('');
      setLabel('');
      await fetchData();
    } catch (err: any) {
      alert(`Authorization failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async (instId: string, address: string) => {
    if (!confirm(`Are you sure you want to suspend issuer key ${address}? Any subsequent issuance will be rejected by the smart contract.`)) {
      return;
    }
    try {
      await api.issuers.suspend({
        institution_id: instId,
        issuer_address: address
      });
      await fetchData();
    } catch (err: any) {
      alert(`Suspension failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Issuer Authorization Registry</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Cryptographic signing identities authorized by participating institutions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Authorize New Issuer Key</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Info Notice about Key Rotation */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <ShieldCheck size={20} className="text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong className="font-semibold">Smart Contract Issuer Security & Key Rotation:</strong> Each institution administrator controls their own authorized signing keys on the EVM registry. If an issuer key is suspended or rotated, the contract immediately revokes its permission to register new credentials, rejecting unauthorized transactions on-chain.
        </div>
      </div>

      {/* Issuers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono uppercase text-slate-500 text-[10px]">
              <tr>
                <th className="px-5 py-3">Signing Key Address</th>
                <th className="px-5 py-3">Institution</th>
                <th className="px-5 py-3">Key Label / Role</th>
                <th className="px-5 py-3">Registry Status</th>
                <th className="px-5 py-3">Authorized At</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issuers.map((iss) => (
                <tr key={`${iss.institution_id}_${iss.wallet_address}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-semibold text-slate-900 truncate max-w-[200px]" title={iss.wallet_address}>
                    {iss.wallet_address}
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-800">
                    {iss.institution_id}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {iss.label || 'Authorized Signer'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      iss.is_authorized
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${iss.is_authorized ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span>{iss.is_authorized ? 'Authorized' : 'Suspended'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                    {new Date(iss.authorized_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {iss.is_authorized ? (
                      <button
                        onClick={() => handleSuspend(iss.institution_id, iss.wallet_address)}
                        className="px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-xs font-medium transition-colors"
                      >
                        Suspend Key
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setTargetInstId(iss.institution_id);
                          setIssuerWallet(iss.wallet_address);
                          setShowAuthModal(true);
                        }}
                        className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-medium transition-colors"
                      >
                        Re-authorize
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorize Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Authorize Issuer Signing Key</h3>
            <p className="text-xs text-slate-500">
              Commits an issuer authorization transaction to the smart contract registry.
            </p>

            <form onSubmit={handleAuthorize} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Institution</label>
                <select
                  value={targetInstId}
                  onChange={(e) => setTargetInstId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {institutions.map((inst) => (
                    <option key={inst.institution_id} value={inst.institution_id}>
                      {inst.display_name} ({inst.institution_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issuer Wallet Address</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={issuerWallet}
                  onChange={(e) => setIssuerWallet(e.target.value)}
                  className="w-full text-xs px-3 py-2 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Signing Role / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Academic Registrar Key #2"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {submitting ? 'Authorizing on EVM...' : 'Submit Authorization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
