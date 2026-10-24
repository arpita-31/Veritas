import React, { useEffect, useState } from 'react';
import { ShieldCheck, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { NetworkInfo } from '../types';

export const NetworkStatusBanner: React.FC = () => {
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStatus = async () => {
    try {
      const res = await api.health.check();
      setNetwork(res.blockchain);
    } catch {
      setNetwork({ connected: false, status: 'Backend or node unreachable' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <div className={`px-4 py-1.5 text-xs font-mono border-b flex items-center justify-between transition-colors ${
      network?.connected
        ? 'bg-slate-900 text-slate-300 border-slate-800'
        : 'bg-red-950 text-red-200 border-red-900'
    }`}>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-medium">
          {network?.connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-sans font-semibold">EVM TRUST REGISTRY OPERATIONAL</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-red-400" />
              <span className="text-red-400 font-sans font-semibold">BLOCKCHAIN NODE DISCONNECTED</span>
            </>
          )}
        </span>

        {network?.connected && (
          <>
            <span className="text-slate-600">|</span>
            <span>Chain ID: <strong className="text-slate-100">{network.chainId}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Block: <strong className="text-slate-100">#{network.latestBlock}</strong></span>
            <span className="text-slate-600">|</span>
            <span className="truncate max-w-[280px]">Contract: <strong className="text-slate-300">{network.contractAddress}</strong></span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={fetchStatus}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          title="Refresh connectivity"
        >
          <RefreshCw size={12} />
        </button>
      </div>
    </div>
  );
};
