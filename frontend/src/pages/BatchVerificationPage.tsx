import React, { useState } from 'react';
import { FileCheck2, Upload, Download, CheckCircle2, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { api } from '../services/api';
import { BatchVerifyResponse, VerifyResponse } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const BatchVerificationPage: React.FC = () => {
  const [files, setFiles] = useState<{ name: string; content: any }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<BatchVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const fileList: { name: string; content: any }[] = [];
    let readCount = 0;

    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          fileList.push({ name: file.name, content: parsed });
        } catch (err) {
          console.error(`Could not parse ${file.name}`);
        }
        readCount++;
        if (readCount === uploadedFiles.length) {
          setFiles(fileList);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleRunBatch = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const payloads = files.map((f) => f.content);
      const res = await api.verification.batchVerify(payloads);
      setBatchResult(res);
    } catch (err: any) {
      setError(err.message || 'Batch verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!batchResult) return;
    const headers = ['Credential ID', 'Institution', 'Issuer Address', 'Overall Outcome', 'Is Authentic', 'Verified At', 'Summary'];
    const rows = batchResult.results.map((r) => [
      `"${r.credentialId || 'N/A'}"`,
      `"${r.institutionId || 'N/A'}"`,
      `"${r.issuerAddress || 'N/A'}"`,
      `"${r.overallOutcome}"`,
      `"${r.isAuthentic}"`,
      `"${r.verifiedAt}"`,
      `"${r.summaryMessage.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VERITAS_Batch_Verification_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Helper to load synthetic batch for testing
  const handleLoadSyntheticBatch = async () => {
    setLoading(true);
    try {
      const [sampleValid, sampleTampered, sampleRevoked] = await Promise.all([
        api.verification.getSample('valid'),
        api.verification.getSample('tampered'),
        api.verification.getSample('revoked')
      ]);

      const testBatch = [
        { name: 'genuine_degree_01.json', content: sampleValid },
        { name: 'tampered_grade_02.json', content: sampleTampered },
        { name: 'revoked_certificate_03.json', content: sampleRevoked }
      ];
      setFiles(testBatch);
      const res = await api.verification.batchVerify(testBatch.map((t) => t.content));
      setBatchResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to run synthetic batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Batch Credential Verification</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Process bulk credentials for enterprise recruitment, admissions, and accreditation audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSyntheticBatch}
            disabled={loading}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Load Sample Batch (3 Records)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 p-8 rounded-xl text-center space-y-3 transition-colors">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <Upload size={24} />
          </div>
          <div>
            <label className="text-sm font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
              <span>Select Multiple Credential JSON Files</span>
              <input
                type="file"
                multiple
                accept=".json"
                onChange={handleMultipleFiles}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-500 mt-1">Upload multiple credential files to verify simultaneously</p>
          </div>
          {files.length > 0 && (
            <div className="inline-block bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 font-mono">
              {files.length} Files Selected
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setFiles([]);
                setBatchResult(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Reset
            </button>
            <button
              onClick={handleRunBatch}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <FileCheck2 size={16} />
                  <span>Execute Batch Verification ({files.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {batchResult && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Processed</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{batchResult.totalProcessed}</span>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block">Verified</span>
              <span className="text-2xl font-bold text-emerald-800 mt-1 block">{batchResult.verifiedCount}</span>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <span className="text-[10px] font-mono uppercase text-red-700 font-bold block">Tampered</span>
              <span className="text-2xl font-bold text-red-800 mt-1 block">{batchResult.tamperedCount}</span>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
              <span className="text-[10px] font-mono uppercase text-purple-700 font-bold block">Revoked</span>
              <span className="text-2xl font-bold text-purple-800 mt-1 block">{batchResult.revokedCount}</span>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <span className="text-[10px] font-mono uppercase text-amber-700 font-bold block">Unauthorized</span>
              <span className="text-2xl font-bold text-amber-800 mt-1 block">{batchResult.unauthorizedCount}</span>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Batch Inspection Results</h3>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Download size={14} />
                <span>Export CSV Report</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono uppercase text-slate-500 text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Credential ID</th>
                    <th className="px-4 py-2.5">Institution</th>
                    <th className="px-4 py-2.5">Outcome</th>
                    <th className="px-4 py-2.5">Technical Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {batchResult.results.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 truncate max-w-[200px]" title={r.credentialId}>
                        {r.credentialId || 'Malformed Record'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.institutionId || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <StatusBadge status={r.overallOutcome} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-600 text-[11px]">
                        {r.summaryMessage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
