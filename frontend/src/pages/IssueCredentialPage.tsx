import React, { useState, useEffect } from 'react';
import {
  FileBadge,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Download,
  Eye,
  RefreshCw,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { SignedCredential, Institution } from '../types';
import { CertificatePreview } from '../components/CertificatePreview';
import { useAuth } from '../context/AuthContext';

export const IssueCredentialPage: React.FC = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>('vcet-mumbai');
  const [credType, setCredType] = useState<string>('AcademicCertificate');

  // Form Fields
  const [studentName, setStudentName] = useState('Aarav Sharma');
  const [qualification, setQualification] = useState('Bachelor of Engineering');
  const [branch, setBranch] = useState('Computer Engineering');
  const [completionYear, setCompletionYear] = useState<number>(2026);
  const [grade, setGrade] = useState('First Class with Distinction');
  const [expirationDate, setExpirationDate] = useState<string>(''); // Optional!

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedCredential, setIssuedCredential] = useState<SignedCredential | null>(null);

  useEffect(() => {
    api.institutions.list()
      .then((data) => {
        setInstitutions(data);
        if (user?.institution_id) {
          setSelectedInstId(user.institution_id);
        } else if (data.length > 0) {
          setSelectedInstId(data[0].institution_id);
        }
      })
      .catch(console.error);
  }, [user]);

  // Preview canonical JSON
  const previewPayload = {
    schemaVersion: "1.0",
    id: "urn:uuid:generated-on-submit",
    type: credType,
    institutionId: selectedInstId,
    issuerAddress: user?.wallet_address || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    issuanceDate: new Date().toISOString(),
    expirationDate: expirationDate || null,
    credentialSubject: {
      studentName,
      qualification,
      branch,
      completionYear: Number(completionYear),
      grade
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIssuedCredential(null);

    try {
      const result = await api.credentials.issue({
        institutionId: selectedInstId,
        credentialType: credType,
        credentialSubject: {
          studentName,
          qualification,
          branch,
          completionYear: Number(completionYear),
          grade
        },
        expirationDate: expirationDate ? `${expirationDate}T00:00:00Z` : null
      });

      setIssuedCredential(result);
    } catch (err: any) {
      setError(err.message || 'Issuance failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Issue Verifiable Credential</h1>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Generate canonical payload, sign with authorized issuer identity, and commit hash to EVM registry
        </p>
      </div>

      {issuedCredential ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Success Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-950">Credential Issued & Confirmed on Blockchain</h3>
                <p className="text-xs text-emerald-800 font-mono">
                  TxHash: {issuedCredential.proof.blockchainTransactionHash} (Block #{issuedCredential.proof.blockNumber})
                </p>
              </div>
            </div>
            <button
              onClick={() => setIssuedCredential(null)}
              className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Issue Another
            </button>
          </div>

          {/* Certificate View */}
          <CertificatePreview credentialEnvelope={issuedCredential} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileBadge size={16} className="text-indigo-600" />
              <span>Credential Record Details</span>
            </h2>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issuing Institution</label>
                  <select
                    value={selectedInstId}
                    onChange={(e) => setSelectedInstId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {institutions.map((i) => (
                      <option key={i.institution_id} value={i.institution_id}>
                        {i.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credential Type</label>
                  <select
                    value={credType}
                    onChange={(e) => setCredType(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AcademicCertificate">Academic Certificate</option>
                    <option value="InternshipCertificate">Internship Certificate</option>
                    <option value="ScholarshipEligibilityCredential">Scholarship Eligibility Credential</option>
                    <option value="InstitutionalCompletionCertificate">Institutional Completion Certificate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student / Recipient Full Name</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Conferred Qualification / Degree</label>
                  <input
                    type="text"
                    required
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch / Discipline</label>
                  <input
                    type="text"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Completion Year</label>
                  <input
                    type="number"
                    required
                    value={completionYear}
                    onChange={(e) => setCompletionYear(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / Classification</label>
                  <input
                    type="text"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expiration Date <span className="text-slate-400 font-normal">(Optional — leave blank for permanent degree)</span>
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Signing & Committing to Blockchain...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      <span>Sign & Commit to Institutional Trust Registry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Canonical Payload Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-indigo-400" />
                  <span className="text-xs font-mono font-bold text-slate-100">Canonical JSON Preview</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Strictly Off-Chain</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                This exact JSON object is canonically ordered and hashed using Keccak256 before signing.
              </p>
              <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto text-emerald-400 custom-scrollbar max-h-72">
                {JSON.stringify(previewPayload, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <Shield size={15} className="text-indigo-700" />
                <span>On-Chain Commitment Security</span>
              </div>
              <p className="text-[11px] text-indigo-900 leading-relaxed">
                Only the cryptographic <strong>recordHash</strong> and <strong>credentialIdHash</strong> are recorded on the EVM blockchain. The student name and grade are never stored on-chain.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
