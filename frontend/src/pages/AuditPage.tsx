import React, { useEffect, useState } from 'react';
import { History, Filter, RefreshCw, ExternalLink, Shield, Layers, Search, Eye } from 'lucide-react';
import { api } from '../services/api';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.audit.getTrail({
        eventType: eventTypeFilter || undefined,
        source: sourceFilter || undefined
      });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventTypeFilter, sourceFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.eventType?.toLowerCase().includes(q) ||
      log.actorAddress?.toLowerCase().includes(q) ||
      log.txHash?.toLowerCase().includes(q) ||
      log.credentialId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Trail & Blockchain Explorer</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Cryptographic event timeline verified directly against smart contract event logs
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search address, txHash, event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Event Type Filter */}
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Event Types</option>
            <option value="CredentialIssued">CredentialIssued</option>
            <option value="CredentialRevoked">CredentialRevoked</option>
            <option value="IssuerAuthorized">IssuerAuthorized</option>
            <option value="IssuerSuspended">IssuerSuspended</option>
            <option value="InstitutionRegistered">InstitutionRegistered</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Sources</option>
            <option value="blockchain">EVM Blockchain Events Only</option>
            <option value="offchain">Off-chain Logs Only</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-500 font-semibold">
          Showing {filteredLogs.length} Records
        </span>
      </div>

      {/* Event Timeline Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono uppercase text-slate-500 text-[10px]">
              <tr>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Event Type</th>
                <th className="px-5 py-3">Actor / Signer Address</th>
                <th className="px-5 py-3">Block / Reference</th>
                <th className="px-5 py-3">Transaction Hash</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.source === 'blockchain'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {log.source.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-sans font-bold text-slate-900">
                    {log.eventType}
                  </td>
                  <td className="px-5 py-3 text-slate-600 truncate max-w-[180px]" title={log.actorAddress}>
                    {log.actorAddress || 'Registry Anchor'}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {log.blockNumber ? `Block #${log.blockNumber}` : 'Off-Chain'}
                  </td>
                  <td className="px-5 py-3 text-indigo-600 truncate max-w-[180px]" title={log.txHash}>
                    {log.txHash ? log.txHash : '-'}
                  </td>
                  <td className="px-5 py-3 text-right font-sans">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium transition-colors"
                    >
                      View Decoded
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History size={18} className="text-indigo-600" />
                <span>Decoded Event Log</span>
              </h3>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                selectedLog.source === 'blockchain' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {selectedLog.source.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-900 text-slate-200 p-4 rounded-lg overflow-x-auto custom-scrollbar max-h-80">
              <pre className="text-emerald-400">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <div>Tx Hash: <span className="font-mono text-slate-800">{selectedLog.txHash || 'None'}</span></div>
              {selectedLog.blockNumber && <div>Block Number: <span className="font-mono text-slate-800">#{selectedLog.blockNumber}</span></div>}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
