import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, UserCheck, AlertTriangle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DemoPersona } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<DemoPersona[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>('vcet_issuer');
  const [customUsername, setCustomUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    api.auth.getDemoPersonas()
      .then((data) => {
        setPersonas(data);
        if (data.length > 0) setSelectedUsername(data[0].username);
      })
      .catch(console.error);
  }, []);

  const handlePersonaLogin = async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      await login(username, 'password123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUsername) return;
    setLoading(true);
    setError(null);
    try {
      await login(customUsername, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold">VERITAS Authentication Portal</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Select an authorized institutional persona or enter test credentials
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Quick Demo Persona Select */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider font-bold text-slate-500 mb-3">
              One-Click Development Personas (Preconfigured Keys)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personas.map((p) => {
                const isSelected = selectedUsername === p.username;
                const isUnauthorized = p.role === 'unauthorized';
                return (
                  <button
                    key={p.username}
                    type="button"
                    onClick={() => {
                      setSelectedUsername(p.username);
                      handlePersonaLogin(p.username);
                    }}
                    disabled={loading}
                    className={`text-left p-3.5 rounded-xl border transition-all relative ${
                      isUnauthorized
                        ? 'border-red-200 bg-red-50/50 hover:bg-red-50 text-red-950'
                        : isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{p.displayName}</span>
                      <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                        isUnauthorized ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {p.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                    {p.walletAddress && (
                      <span className="text-[10px] font-mono text-slate-400 block truncate mt-1">
                        {p.walletAddress}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-mono">Or Manual Demo Login</span>
            </div>
          </div>

          {/* Manual Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  placeholder="e.g. vcet_issuer"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !customUsername}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <KeyRound size={14} />
              <span>Sign In with Credentials</span>
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-mono">
          Demo Environment: All passwords default to <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">password123</code>
        </div>
      </div>
    </div>
  );
};
