import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Clock, HelpCircle, WifiOff } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const normalized = status.toUpperCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-300';
  let Icon = HelpCircle;
  let label = status;

  if (normalized === 'VERIFIED') {
    bg = 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30';
    Icon = CheckCircle2;
    label = 'VERIFIED';
  } else if (normalized === 'TAMPERED') {
    bg = 'bg-red-50 text-red-800 border-red-300 ring-1 ring-red-400/30 font-semibold';
    Icon = AlertTriangle;
    label = 'TAMPERED';
  } else if (normalized === 'UNAUTHORIZED_ISSUER') {
    bg = 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/30';
    Icon = ShieldAlert;
    label = 'UNAUTHORIZED ISSUER';
  } else if (normalized === 'REVOKED') {
    bg = 'bg-purple-50 text-purple-800 border-purple-300 ring-1 ring-purple-400/30';
    Icon = XCircle;
    label = 'REVOKED';
  } else if (normalized === 'EXPIRED') {
    bg = 'bg-amber-50 text-amber-800 border-amber-300';
    Icon = Clock;
    label = 'EXPIRED';
  } else if (normalized === 'UNKNOWN' || normalized === 'NOT REGISTERED') {
    bg = 'bg-slate-100 text-slate-800 border-slate-300';
    Icon = HelpCircle;
    label = 'UNKNOWN / UNREGISTERED';
  } else if (normalized === 'VERIFICATION_UNAVAILABLE') {
    bg = 'bg-rose-50 text-rose-800 border-rose-300';
    Icon = WifiOff;
    label = 'VERIFICATION UNAVAILABLE';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-medium'
  }[size];

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  }[size];

  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${bg} ${sizeClasses}`}>
      {showIcon && <Icon size={iconSizes} className="shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
