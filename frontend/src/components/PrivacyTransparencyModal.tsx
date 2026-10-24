import React from 'react';
import { X, Shield, Lock, Database, ArrowRight, EyeOff, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyTransparencyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Privacy & Trust Architecture: What Goes On-Chain?</h2>
              <p className="text-xs text-slate-500">Cryptographic privacy-by-design guarantees in VERITAS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Core Principle Notice */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-emerald-900">
              <strong className="font-semibold">Privacy By Design:</strong> Student names, grades, marks, and personal academic records are <strong>NEVER</strong> written to the blockchain, transaction inputs, or smart-contract event logs.
            </div>
          </div>

          {/* Side-by-side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* On-Chain Registry */}
            <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                <Lock size={16} />
                <span>STORED ON-CHAIN (Public Trust Registry)</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                <li><strong className="text-slate-900">Hashed Institution ID:</strong> keccak256(UTF8(institutionId))</li>
                <li><strong className="text-slate-900">Hashed Credential ID:</strong> keccak256(UTF8(credentialId))</li>
                <li><strong className="text-slate-900">Canonical Record Hash:</strong> keccak256(canonical JSON)</li>
                <li><strong className="text-slate-900">Authorized Issuer Address:</strong> 0x3C44...</li>
                <li><strong className="text-slate-900">Revocation State:</strong> Boolean flag & revocation reason code</li>
                <li><strong className="text-slate-900">Issuance & Revocation Timestamps</strong></li>
              </ul>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-mono text-slate-500 block">Example On-Chain Struct:</span>
                <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2.5 rounded mt-1 overflow-x-auto">
{`struct CredentialRecord {
  bytes32 institutionIdHash;  // 0x9f1a...
  bytes32 recordHash;         // 0x4d8e...
  address issuer;             // 0x3C44...
  uint256 issuedAt;           // 1730000000
  bool exists;                // true
  bool isRevoked;             // false
}`}
                </pre>
              </div>
            </div>

            {/* Off-Chain Storage */}
            <div className="border border-slate-200 rounded-lg p-5 bg-white space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                <Database size={16} />
                <span>KEPT OFF-CHAIN (Holder & Local Storage)</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                <li><strong className="text-slate-900">Student Personal Identifiers:</strong> Name, Roll No, DOB</li>
                <li><strong className="text-slate-900">Degree & Discipline:</strong> Qualification, Branch</li>
                <li><strong className="text-slate-900">Academic Evaluation:</strong> Grades, CGPA, Division</li>
                <li><strong className="text-slate-900">Complete Credential JSON Document</strong></li>
                <li><strong className="text-slate-900">Internal Institutional Databases & Records</strong></li>
              </ul>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-mono text-slate-500 block">Example Off-Chain JSON:</span>
                <pre className="text-[10px] font-mono bg-slate-900 text-sky-300 p-2.5 rounded mt-1 overflow-x-auto">
{`{
  "studentName": "Demo Student",
  "qualification": "B.E. Computer Eng",
  "completionYear": 2026,
  "grade": "First Class with Distinction"
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Verification Explanation */}
          <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <EyeOff size={16} className="text-indigo-600" />
              How Does Independent Verification Work Without Exposing Data?
            </h4>
            <p>
              When a student presents their signed JSON document to an employer or receiving university, the verifier computes the mathematical hash of the presented payload locally. The verifier checks that hash against the immutable on-chain record hash and checks whether the signer address was authorized by the university.
            </p>
            <p>
              This achieves <strong>complete mathematical verification across organizational boundaries</strong> with <strong>zero access to the university’s internal student database</strong> and <strong>zero storage of private personal data on the public blockchain</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
