import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  KeyRound,
  FileBadge,
  CheckCircle,
  FileCheck2,
  Ban,
  History,
  FlaskConical,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/institutions', label: 'Institutions', icon: Building2 },
    { to: '/issuers', label: 'Issuer Registry', icon: KeyRound },
    { to: '/issue', label: 'Issue Credential', icon: FileBadge, roles: ['admin', 'issuer', 'governance'] },
    { to: '/verify', label: 'Verification Center', icon: CheckCircle, highlight: true },
    { to: '/batch-verify', label: 'Batch Verification', icon: FileCheck2 },
    { to: '/revocation', label: 'Revocation Manager', icon: Ban, roles: ['admin', 'issuer', 'governance'] },
    { to: '/audit', label: 'Audit Explorer', icon: History },
    { to: '/trust-lab', label: 'Trust Lab (Judges)', icon: FlaskConical, special: true }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold px-3 mb-2 block">
            Navigation
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              if (item.roles && user && !item.roles.includes(user.role)) {
                // Show as disabled or hidden
              }
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all
                    ${isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : item.special
                      ? 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/20'
                      : item.highlight
                      ? 'text-emerald-300 hover:bg-slate-800'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{item.label}</span>
                  {item.special && (
                    <span className="ml-auto text-[9px] uppercase font-mono bg-amber-400/20 text-amber-300 px-1 py-0.5 rounded font-bold">
                      DEMO
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Current Active Context Card */}
        {user && (
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-xs space-y-1.5">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Active Context</span>
            <div className="font-semibold text-slate-100 truncate">{user.username}</div>
            <div className="text-[11px] text-indigo-300">
              {user.institution_id ? `Institution: ${user.institution_id}` : 'Role: Global Verifier'}
            </div>
            {user.wallet_address && (
              <div className="text-[10px] font-mono text-slate-400 truncate">
                {user.wallet_address}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>VERITAS Core</span>
          <span className="font-mono text-slate-400">v1.0.0</span>
        </div>
        <p className="text-[10px] text-slate-600">
          Decentralized Institutional Data & Trust Infrastructure
        </p>
      </div>
    </aside>
  );
};
