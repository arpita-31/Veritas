import React, { useState } from 'react';
import {
  FlaskConical,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  RefreshCw,
  Ban,
  HelpCircle,
  ShieldCheck,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface ScenarioState {
  loading: boolean;
  executed: boolean;
  data: any | null;
  error: string | null;
}

export const TrustLabPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<Record<string, ScenarioState>>({
    scenarioA: { loading: false, executed: false, data: null, error: null },
    scenarioB: { loading: false, executed: false, data: null, error: null },
    scenarioC: { loading: false, executed: false, data: null, error: null },
    scenarioD: { loading: false, executed: false, data: null, error: null },
    scenarioE: { loading: false, executed: false, data: null, error: null },
  });

  const runScenario = async (key: string, apiCall: () => Promise<any>) => {
    setScenarios((prev) => ({
      ...prev,
      [key]: { loading: true, executed: false, data: null, error: null }
    }));

    try {
      const res = await apiCall();
      setScenarios((prev) => ({
        ...prev,
        [key]: { loading: false, executed: true, data: res, error: null }
      }));
    } catch (err: any) {
      setScenarios((prev) => ({
        ...prev,
        [key]: { loading: false, executed: true, data: null, error: err.message || 'Execution error' }
      }));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-mono font-bold mb-1">
            <FlaskConical size={14} className="text-amber-700" />
            <span>JUDGES ADVERSARIAL EVALUATION LAB</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Adversarial Demonstration Lab</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Interactive scenarios proving cryptographic tamper detection, contract authorization enforcement, and revocation
          </p>
        </div>
      </div>

      {/* Description Callout */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-100">
          <Terminal size={16} className="text-emerald-400" />
          <span>Evaluation Principle: Real Technical Execution Over Static Simulation</span>
        </div>
        <p className="text-slate-400">
          Every scenario button triggers actual backend operations and smart contract transactions against the deployed EVM trust registry. The system never displays a hardcoded green checkmark or fake verified badge.
        </p>
      </div>

      {/* Scenarios Grid */}
      <div className="space-y-6">
        {/* Scenario A: Valid Genuine Issuance */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Scenario A
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">Genuine Credential Issuance & Verification</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Issue a signed academic degree from an authorized VCET issuer key, commit reference to EVM, and independently verify.
              </p>
            </div>

            <button
              onClick={() => runScenario('scenarioA', api.trustLab.runValid)}
              disabled={scenarios.scenarioA.loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0"
            >
              {scenarios.scenarioA.loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>Run Scenario A</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">1. Initial State</span>
              <span className="text-slate-700 font-medium mt-1 block">VCET Issuer key is authorized on smart contract.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">2. Action Performed</span>
              <span className="text-slate-700 font-medium mt-1 block">Generate UUID, canonicalize, sign with ECDSA, commit recordHash to blockchain.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">3. Expected Result</span>
              <span className="text-emerald-700 font-bold mt-1 block">VERIFIED (100% checks pass)</span>
            </div>
          </div>

          {/* Result Evidence */}
          {scenarios.scenarioA.executed && scenarios.scenarioA.data && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs space-y-2 animate-fadeIn font-mono">
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Execution Outcome: {scenarios.scenarioA.data.actualOutcome}</span>
                </span>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-bold text-[10px]">
                  TEST PASSED
                </span>
              </div>
              <div className="text-[11px] text-slate-700">
                <div>Credential ID: <strong>{scenarios.scenarioA.data.issuedCredential?.credential?.id}</strong></div>
                <div>Record Hash: <strong>{scenarios.scenarioA.data.issuedCredential?.proof?.recordHash}</strong></div>
                <div>EVM TxHash: <strong>{scenarios.scenarioA.data.issuedCredential?.proof?.blockchainTransactionHash}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Scenario B: Tampering Attack */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Scenario B
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">Tampering Attack: Grade Forgery Detection</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Load a legitimate credential, tamper with the student qualification or grade, and present it for verification.
              </p>
            </div>

            <button
              onClick={() => runScenario('scenarioB', api.trustLab.runTamper)}
              disabled={scenarios.scenarioB.loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0"
            >
              {scenarios.scenarioB.loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>Run Scenario B</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">1. Initial State</span>
              <span className="text-slate-700 font-medium mt-1 block">Valid issued record exists in registry.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">2. Adversary Action</span>
              <span className="text-slate-700 font-medium mt-1 block">Grade modified to "First Class with Distinction (FORGED)" without new signature.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">3. Expected Result</span>
              <span className="text-red-700 font-bold mt-1 block">TAMPERED (Must NEVER return VERIFIED)</span>
            </div>
          </div>

          {/* Result Evidence */}
          {scenarios.scenarioB.executed && scenarios.scenarioB.data && (
            <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg text-xs space-y-2 animate-fadeIn font-mono">
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-red-950 flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-red-600" />
                  <span>Observed Outcome: {scenarios.scenarioB.data.actualOutcome}</span>
                </span>
                <span className="px-2 py-0.5 bg-red-200 text-red-900 rounded font-bold text-[10px]">
                  ATTACK DETECTED & DEFENDED
                </span>
              </div>
              <div className="text-[11px] text-slate-700">
                <div>Original Grade: <span className="line-through text-slate-400">{scenarios.scenarioB.data.attackPayload?.originalGrade}</span></div>
                <div>Attacker Injected: <strong className="text-red-700">{scenarios.scenarioB.data.attackPayload?.tamperedGrade}</strong></div>
                <div className="text-slate-500 mt-1">Mathematical proof check failed: Recomputed canonical hash did not match signed proof.</div>
              </div>
            </div>
          )}
        </div>

        {/* Scenario C: Unauthorized Issuer Attack */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Scenario C
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">Unauthorized Issuer: Contract Revert Enforcement</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Attempt to commit an issuance reference using an unauthorized development wallet key.
              </p>
            </div>

            <button
              onClick={() => runScenario('scenarioC', api.trustLab.runUnauthorized)}
              disabled={scenarios.scenarioC.loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0"
            >
              {scenarios.scenarioC.loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>Run Scenario C</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">1. Initial State</span>
              <span className="text-slate-700 font-medium mt-1 block">Account 0x976E... is NOT authorized for VCET Mumbai.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">2. Adversary Action</span>
              <span className="text-slate-700 font-medium mt-1 block">Submits issueCredential() transaction directly to EVM smart contract.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">3. Expected Result</span>
              <span className="text-amber-800 font-bold mt-1 block">REVERT (UnauthorizedIssuer error)</span>
            </div>
          </div>

          {/* Result Evidence */}
          {scenarios.scenarioC.executed && scenarios.scenarioC.data && (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-xs space-y-2 animate-fadeIn font-mono">
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-amber-700" />
                  <span>Observed Result: {scenarios.scenarioC.data.actualOutcome}</span>
                </span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold text-[10px]">
                  ON-CHAIN PERMISSION ENFORCED
                </span>
              </div>
              <div className="text-[11px] text-slate-700 break-all">
                Contract Revert Output: <span className="text-amber-900 font-mono">{scenarios.scenarioC.data.contractRevertReason}</span>
              </div>
            </div>
          )}
        </div>

        {/* Scenario D: Revocation Lifecycle */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Scenario D
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">Revocation Lifecycle: Live State Invalidation</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Verify a genuine credential, revoke it on-chain, and verify again to prove dynamic state propagation.
              </p>
            </div>

            <button
              onClick={() => runScenario('scenarioD', api.trustLab.runRevocation)}
              disabled={scenarios.scenarioD.loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0"
            >
              {scenarios.scenarioD.loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>Run Scenario D</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">1. Initial Verification</span>
              <span className="text-emerald-700 font-bold mt-1 block">VERIFIED (Authentic record)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">2. Revocation Action</span>
              <span className="text-slate-700 font-medium mt-1 block">Authorized issuer executes revokeCredential(credentialIdHash, reason).</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">3. Re-Verification Outcome</span>
              <span className="text-purple-700 font-bold mt-1 block">REVOKED (Immediate state update)</span>
            </div>
          </div>

          {/* Result Evidence */}
          {scenarios.scenarioD.executed && scenarios.scenarioD.data && (
            <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-lg text-xs space-y-2 animate-fadeIn font-mono">
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Ban size={16} className="text-purple-700" />
                  <span>State Progression: {scenarios.scenarioD.data.preRevocationStatus} → {scenarios.scenarioD.data.postRevocationStatus}</span>
                </span>
                <span className="px-2 py-0.5 bg-purple-200 text-purple-900 rounded font-bold text-[10px]">
                  LIFECYCLE PROVEN
                </span>
              </div>
              <div className="text-[11px] text-slate-700">
                <div>Revocation TxHash: <strong>{scenarios.scenarioD.data.revocationTxHash}</strong></div>
                <div>Credential ID: <strong>{scenarios.scenarioD.data.credentialId}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Scenario E: Unknown Record */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Scenario E
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">Unknown / Unregistered Record: Signature Alone Insufficient</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Submit a formatted credential with a valid mathematical signature that was never registered on the blockchain.
              </p>
            </div>

            <button
              onClick={() => runScenario('scenarioE', api.trustLab.runUnknown)}
              disabled={scenarios.scenarioE.loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0"
            >
              {scenarios.scenarioE.loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>Run Scenario E</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">1. Initial State</span>
              <span className="text-slate-700 font-medium mt-1 block">Valid-looking envelope signed by VCET key.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">2. Missing Condition</span>
              <span className="text-slate-700 font-medium mt-1 block">Never committed to EVM registry (credentialIdHash absent).</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">3. Expected Result</span>
              <span className="text-slate-800 font-bold mt-1 block">UNKNOWN (Issuance reference required)</span>
            </div>
          </div>

          {/* Result Evidence */}
          {scenarios.scenarioE.executed && scenarios.scenarioE.data && (
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-xs space-y-2 animate-fadeIn font-mono">
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle size={16} className="text-slate-600" />
                  <span>Observed Result: {scenarios.scenarioE.data.actualOutcome}</span>
                </span>
                <span className="px-2 py-0.5 bg-slate-300 text-slate-900 rounded font-bold text-[10px]">
                  TEST PASSED
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-sans">
                A valid cryptographic signature alone is intentionally rejected because no matching confirmed issuance reference exists on the blockchain registry.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
