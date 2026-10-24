import React, { useEffect, useState } from 'react';
import { Building2, Plus, ShieldCheck, CheckCircle, ExternalLink, RefreshCw, AlertCircle, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { Institution, Issuer } from '../types';
import { useAuth } from '../context/AuthContext';

export const InstitutionsPage: React.FC = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New institution form modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newInstId, setNewInstId] = useState('');
  const [newInstName, setNewInstName] = useState('');
  const [newInstType, setNewInstType] = useState('Engineering & Technology University');
  const [newAdminAddr, setNewAdminAddr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [instList, issList] = await Promise.all([
        api.institutions.list(),
        api.issuers.list()
      ]);
      setInstitutions(instList);
      setIssuers(issList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch institutions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstId || !newInstName || !newAdminAddr) return;
    setSubmitting(true);
    try {
      await api.institutions.create({
        institution_id: newInstId,
        display_name: newInstName,
        institution_type: newInstType,
        admin_address: newAdminAddr
      });
      setShowAddModal(false);
      setNewInstId('');
      setNewInstName('');
      setNewAdminAddr('');
      await fetchData();
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Trust Anchors</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Registered educational institutions and cryptographic identity authorities
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
          {user?.role === 'governance' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>Register Institution</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {institutions.map((inst) => {
          const instIssuers = issuers.filter((i) => i.institution_id === inst.institution_id);
          const activeIssuers = instIssuers.filter((i) => i.is_authorized);

          return (
            <div
              key={inst.institution_id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{inst.display_name}</h3>
                    <span className="text-xs text-slate-500 font-mono">ID: {inst.institution_id}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  inst.is_active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${inst.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span>{inst.is_active ? 'Active On-Chain' : 'Suspended'}</span>
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Admin Wallet Address</span>
                  <span className="text-slate-800 font-semibold truncate block" title={inst.admin_address}>
                    {inst.admin_address}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">On-Chain Identifier Hash (keccak256)</span>
                  <span className="text-slate-600 truncate block text-[11px]" title={inst.id_hash}>
                    {inst.id_hash}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <KeyRound size={14} className="text-indigo-600" />
                  <span><strong>{activeIssuers.length}</strong> Authorized Signing Key{activeIssuers.length !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-slate-400 text-[11px]">Type: {inst.institution_type}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Registration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Register Institution Trust Anchor</h3>
            <p className="text-xs text-slate-500">
              Only registry governance can bootstrap new participating institutions.
            </p>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iit-bombay"
                  value={newInstId}
                  onChange={(e) => setNewInstId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indian Institute of Technology Bombay"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Administrator Wallet Address</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={newAdminAddr}
                  onChange={(e) => setNewAdminAddr(e.target.value)}
                  className="w-full text-xs px-3 py-2 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
