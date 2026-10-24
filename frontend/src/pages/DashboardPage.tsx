import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  KeyRound,
  FileBadge,
  Ban,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Activity,
  Layers,
  FlaskConical
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.dashboard.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 20000);
    return () => clearInterval(interval);
  }, []);

  // Prepare chart data
  const verificationData = [
    { name: 'Verified (Authentic)', value: metrics?.successfulVerifications || 0, color: '#10b981' },
    { name: 'Failed / Tampered / Revoked', value: metrics?.failedVerifications || 0, color: '#ef4444' }
  ];

  const typeData = Object.entries(metrics?.credentialTypeDistribution || {}).map(([key, val]) => ({
    name: key.replace('Certificate', ''),
    count: val
  }));

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Trust Dashboard</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Real-time synchronization with EVM Trust Registry and off-chain data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Metrics</span>
          </button>
          <Link
            to="/trust-lab"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <FlaskConical size={15} />
            <span>Open Trust Lab</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Registered Institutions */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Institutions
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {metrics?.totalInstitutions ?? '-'}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Registered trust anchors</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 size={24} />
          </div>
        </div>

        {/* Active Issuers */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Active Issuers
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {metrics?.activeIssuers ?? '-'}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Authorized signing keys</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <KeyRound size={24} />
          </div>
        </div>

        {/* Issued Credentials */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Issued Records
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {metrics?.credentialsIssued ?? '-'}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Committed to EVM registry</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileBadge size={24} />
          </div>
        </div>

        {/* Revoked Credentials */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Revoked Records
            </span>
            <div className="text-3xl font-extrabold text-purple-900 mt-1">
              {metrics?.credentialsRevoked ?? '-'}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Permanently invalidated</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Ban size={24} />
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Outcomes Chart */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Verification Inspection Ratio</h2>
              <p className="text-xs text-slate-500">Real-time outcome metrics from verification logs</p>
            </div>
            <span className="text-xs font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              Total: {metrics?.totalVerifications || 0}
            </span>
          </div>

          <div className="h-56 flex items-center justify-center">
            {metrics && (metrics.totalVerifications > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {verificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400 py-10">
                <CheckCircle2 size={32} className="mx-auto text-slate-300 mb-2" />
                <span>No verification logs recorded yet. Verify a credential to populate metrics.</span>
              </div>
            )}
          </div>
        </div>

        {/* Credential Distribution Chart */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Credential Types Breakdown</h2>
              <p className="text-xs text-slate-500">Issued records across synthetic categories</p>
            </div>
            <Layers size={18} className="text-slate-400" />
          </div>

          <div className="h-56 flex items-center justify-center">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4338ca" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400 py-10">
                <Layers size={32} className="mx-auto text-slate-300 mb-2" />
                <span>No credentials issued yet. Issue a credential to see distribution.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/issue"
          className="p-5 bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-200 font-bold">Workflow 01</span>
            <ArrowRight size={16} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-base font-bold mt-2">Issue New Credential</h3>
          <p className="text-xs text-indigo-100/80 mt-1">
            Fill academic records, generate canonical hash, sign with ECDSA, and commit to EVM.
          </p>
        </Link>

        <Link
          to="/verify"
          className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Workflow 02</span>
            <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-base font-bold mt-2">Verification Center</h3>
          <p className="text-xs text-slate-300 mt-1">
            Upload JSON or QR to inspect signature, on-chain match, and revocation status.
          </p>
        </Link>

        <Link
          to="/trust-lab"
          className="p-5 bg-gradient-to-br from-amber-700 to-amber-900 text-white rounded-xl shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-200 font-bold">Adversarial Lab</span>
            <ArrowRight size={16} className="text-amber-300 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-base font-bold mt-2">Judges Trust Lab</h3>
          <p className="text-xs text-amber-100 mt-1">
            Execute real tampering attacks, unauthorized issuance, and revocation tests with evidence.
          </p>
        </Link>
      </div>

      {/* Recent Blockchain & Offchain Audit Activity */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Institutional Activity</h2>
            <p className="text-xs text-slate-500">Live events retrieved from EVM smart contract and operational logs</p>
          </div>
          <Link
            to="/audit"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <span>View Full Audit Explorer</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {metrics.recentActivity.map((act: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    act.source === 'blockchain' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {act.source.toUpperCase()}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900 block">{act.eventType}</span>
                    <span className="text-slate-500 font-mono text-[11px] truncate max-w-sm block">
                      Actor: {act.actorAddress || 'System'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {act.txHash ? (
                    <span className="font-mono text-indigo-600 text-[10px] block" title={act.txHash}>
                      {act.txHash.substring(0, 10)}...{act.txHash.substring(act.txHash.length - 8)}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px] block">Off-chain Log</span>
                  )}
                  {act.blockNumber && (
                    <span className="text-slate-500 font-mono text-[10px] block">Block #{act.blockNumber}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No activity logs found.
          </div>
        )}
      </div>
    </div>
  );
};
