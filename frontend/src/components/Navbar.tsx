import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, UserCheck, ChevronDown, LogOut, Info, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DemoPersona } from '../types';
import { PrivacyTransparencyModal } from './PrivacyTransparencyModal';

export const Navbar: React.FC = () => {
  const { user, logout, switchPersona } = useAuth();
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<DemoPersona[]>([]);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  useEffect(() => {
    api.auth.getDemoPersonas()
      .then(setPersonas)
      .catch(console.error);
  }, []);

  const handlePersonaSelect = async (persona: DemoPersona) => {
    await switchPersona(persona);
    setShowPersonaDropdown(false);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900 to-blue-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">VERITAS</span>
                <span className="text-[10px] uppercase font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  EVM Trust
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Institutional Data and Trust Infrastructure</p>
            </div>
          </Link>

          {/* Right Navigation & Persona Switcher */}
          <div className="flex items-center gap-3">
            {/* Privacy Transparency Trigger */}
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <Lock size={14} className="text-indigo-600" />
              <span className="hidden md:inline">What Goes On-Chain?</span>
            </button>

            {user ? (
              <div className="relative">
                {/* Persona Selector Button */}
                <button
                  onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="font-semibold text-slate-900 block truncate max-w-[130px]">{user.username}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Role: {user.role}</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {/* Dropdown */}
                {showPersonaDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500">
                      <span className="font-semibold text-slate-900 block mb-0.5">Quick Switch Demo Persona</span>
                      Switch roles to test permissions across institutions
                    </div>

                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                      {personas.map((p) => {
                        const isCurrent = user.username === p.username;
                        return (
                          <button
                            key={p.username}
                            onClick={() => handlePersonaSelect(p)}
                            className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors mb-1 ${
                              isCurrent ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-semibold text-slate-900">{p.displayName}</span>
                              {isCurrent && <span className="text-[10px] text-indigo-700 font-bold">ACTIVE</span>}
                            </div>
                            <p className="text-[11px] text-slate-500">{p.description}</p>
                            {p.walletAddress && (
                              <span className="text-[10px] font-mono text-slate-400 block truncate mt-1">
                                {p.walletAddress}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 pt-1 px-1">
                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut size={14} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/verify"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  Verify Document
                </Link>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Demo Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Privacy Transparency Modal */}
      <PrivacyTransparencyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </>
  );
};
