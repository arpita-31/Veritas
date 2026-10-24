import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  FileCode,
  Download,
  RefreshCw,
  Shield,
  ShieldAlert,
  XCircle,
  ExternalLink,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { VerifyResponse, CheckDetail } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const VerificationPage: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // File drop handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      executeVerification(content);
    };
    reader.readAsText(file);
  };

  const executeVerification = async (rawJson?: string) => {
    const targetJson = rawJson || jsonInput;
    if (!targetJson.trim()) {
      setError('Please provide a credential JSON envelope to verify.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const parsed = JSON.parse(targetJson);
      const res = await api.verification.verify(parsed);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Verification request failed or malformed JSON.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async (type: 'valid' | 'tampered' | 'revoked') => {
    setLoading(true);
    setError(null);
    try {
      const sample = await api.verification.getSample(type);
      const formatted = JSON.stringify(sample, null, 2);
      setJsonInput(formatted);
      await executeVerification(formatted);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample credential');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const report = {
      reportType: "VERITAS Institutional Verification Report",
      generatedAt: new Date().toISOString(),
      overallOutcome: result.overallOutcome,
      isAuthentic: result.isAuthentic,
      credentialId: result.credentialId,
      institutionId: result.institutionId,
      issuerAddress: result.issuerAddress,
      checks: result.checks,
      onChainEvidence: result.onChainEvidence,
      summaryMessage: result.summaryMessage
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `VerificationReport_${result.credentialId || 'document'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Credential Verification Center</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Cross-organizational authenticity check against cryptographic proofs and EVM Trust Registry
          </p>
        </div>

        {/* 1-Click Samples for Judges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold mr-1">Quick Samples:</span>
          <button
            onClick={() => handleLoadSample('valid')}
            disabled={loading}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold transition-colors"
          >
            ✓ Genuine Record
          </button>
          <button
            onClick={() => handleLoadSample('tampered')}
            disabled={loading}
            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded text-xs font-semibold transition-colors"
          >
            ⚠ Tampered Grade
          </button>
          <button
            onClick={() => handleLoadSample('revoked')}
            disabled={loading}
            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-xs font-semibold transition-colors"
          >
            ⊘ Revoked Record
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Paste Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* File Dropzone */}
          <div className="p-6 bg-white border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl text-center space-y-3 transition-colors">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Upload size={20} />
            </div>
            <div>
              <label className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                <span>Upload credential JSON file</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">Drag and drop or select from your computer</p>
            </div>
          </div>

          {/* Paste Raw JSON */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileCode size={14} className="text-indigo-600" />
                <span>Or Paste Credential JSON</span>
              </span>
              {jsonInput && (
                <button
                  onClick={() => setJsonInput('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            <textarea
              rows={10}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste credential JSON envelope here..."
              className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar"
            />

            <button
              onClick={() => executeVerification()}
              disabled={loading || !jsonInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Inspecting Evidence...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Verify Credential Authenticity</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Inspection Output Panel */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fadeIn">
              {/* Overall Outcome Banner */}
              <div className={`p-5 rounded-xl border flex items-start justify-between ${
                result.overallOutcome === 'VERIFIED'
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : result.overallOutcome === 'TAMPERED'
                  ? 'bg-red-50/80 border-red-300 text-red-950'
                  : result.overallOutcome === 'REVOKED'
                  ? 'bg-purple-50/80 border-purple-300 text-purple-950'
                  : result.overallOutcome === 'UNAUTHORIZED_ISSUER'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase font-bold text-slate-500">Overall Verification Result</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={result.overallOutcome} size="lg" />
                  </div>
                  <p className="text-xs font-medium mt-1 leading-relaxed">
                    {result.summaryMessage}
                  </p>
                </div>

                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Download size={14} />
                  <span>Report</span>
                </button>
              </div>

              {/* 7-Point Technical Inspection Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-500">
                  Cryptographic & Institutional Checklist
                </h3>

                <div className="space-y-2">
                  {result.checks.map((check, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            check.status === 'PASS'
                              ? 'bg-emerald-500'
                              : check.status === 'FAIL'
                              ? 'bg-red-500'
                              : 'bg-amber-500'
                          }`} />
                          <span className="font-bold text-slate-900">{check.name}</span>
                        </div>
                        <p className="text-slate-600 pl-4">{check.message}</p>
                        {check.expected && check.status !== 'PASS' && (
                          <div className="pl-4 text-[11px] font-mono text-slate-500">
                            <div>Expected: <span className="text-slate-800">{check.expected}</span></div>
                            <div>Observed: <span className="text-red-700 font-semibold">{check.actual}</span></div>
                          </div>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        check.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : check.status === 'FAIL'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {check.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* On-Chain Evidence Breakdown */}
              {result.onChainEvidence && (
                <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block border-b border-slate-800 pb-1">
                    On-Chain Registry Evidence
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>Issuance Confirmed: <strong className={result.onChainEvidence.exists ? "text-emerald-400" : "text-red-400"}>{String(result.onChainEvidence.exists)}</strong></div>
                    <div>Record Hash Matched: <strong className={result.onChainEvidence.hashMatches ? "text-emerald-400" : "text-red-400"}>{String(result.onChainEvidence.hashMatches)}</strong></div>
                    <div>Revocation State: <strong className={result.onChainEvidence.isRevoked ? "text-purple-400" : "text-emerald-400"}>{result.onChainEvidence.isRevoked ? "REVOKED" : "ACTIVE"}</strong></div>
                    <div>Issuing Key: <strong className="text-slate-300 truncate block">{result.onChainEvidence.onChainIssuer || 'N/A'}</strong></div>
                  </div>
                  {result.onChainEvidence.txHash && (
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 truncate">
                      Issuance Tx: <span className="text-indigo-300">{result.onChainEvidence.txHash}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[350px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Shield size={40} className="text-slate-300 mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">Awaiting Credential Envelope</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Upload a JSON document or select one of the judge demo samples above to begin instant multi-point verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
