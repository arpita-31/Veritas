import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  Lock,
  Database,
  ArrowRight,
  FileCheck,
  Building2,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PrivacyTransparencyModal } from '../components/PrivacyTransparencyModal';

export const LandingPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleQuickDemo = async (role = 'vcet_issuer') => {
    await login(role, 'password123');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900 to-blue-700 flex items-center justify-center text-white shadow-md">
              <Shield size={22} />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">VERITAS</span>
              <span className="text-[10px] uppercase font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded ml-2">
                EVM Trust
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block"
            >
              What Goes On-Chain?
            </button>
            <Link
              to="/verify"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Verify Record
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Access Demo Lab
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-medium text-indigo-800">
          <Sparkles size={14} className="text-indigo-600" />
          <span>Decentralized Institutional Trust & Credential Verification</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Trust the proof. Verify the source. <br />
          <span className="bg-gradient-to-r from-indigo-700 via-blue-600 to-teal-600 bg-clip-text text-transparent">
            Protect the personal data.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          VERITAS enables universities, employers, and authorized institutions to issue cryptographically signed credentials verified across organizational boundaries without exposing internal student databases or publishing private data on-chain.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => handleQuickDemo('vcet_issuer')}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
          >
            <span>Launch Interactive Demo</span>
            <ArrowRight size={16} />
          </button>
          <Link
            to="/verify"
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl border border-slate-300 shadow-sm transition-all text-sm"
          >
            <FileCheck size={16} className="text-emerald-600" />
            <span>Verify Sample Credential</span>
          </Link>
        </div>
      </section>

      {/* Architectural Flow Diagram */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xs uppercase font-mono tracking-wider font-bold text-indigo-600">
              CROSS-INSTITUTION ARCHITECTURE
            </h2>
            <p className="text-2xl font-bold text-slate-900 mt-1">How VERITAS Verifies Authenticity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl relative group hover:border-indigo-300 transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Institution Admin</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registers institution identity on the EVM trust registry and assigns authorized signing issuer keys.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl relative group hover:border-indigo-300 transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Authorized Issuance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Issuer signs canonical payload with EIP-191 ECDSA. The record hash is committed directly to the smart contract.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl relative group hover:border-indigo-300 transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Holder Presentation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Student receives the digital credential JSON and QR code. Sensitive personal details remain strictly off-chain.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 bg-indigo-50/50 border border-indigo-200 rounded-xl relative group hover:border-indigo-400 transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                4
              </div>
              <h3 className="font-bold text-indigo-950 text-base mb-1">Independent Verification</h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Receiving employer or partner university verifies math proof & on-chain state without calling the issuer's private database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Cryptographic Authenticity</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Deterministic canonical JSON serialization and Ethereum ECDSA/secp256k1 signatures guarantee instant tamper detection for even a 1-character modification.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Lock size={22} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Privacy by Design</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              No names, marks, grades, or personal identifiers are written to the blockchain. Only opaque hashes and issuer permissions are stored on-chain.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Layers size={22} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Immutable Auditability</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every authorized registration, issuance reference, and revocation is permanently recorded via smart contract events for independent audit.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-700">VERITAS Institutional Trust Infrastructure</p>
        <p>Built for the Blockchain Competition | VCET Mumbai • Production-Style MVP</p>
        <p className="text-[11px] text-slate-400">
          Disclaimer: Synthetic test identities and local EVM private keys used for demonstration purposes.
        </p>
      </footer>

      {/* Privacy Transparency Modal */}
      <PrivacyTransparencyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
};
