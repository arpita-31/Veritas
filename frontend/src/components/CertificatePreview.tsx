import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, CheckCircle, Shield, Award, Calendar, Hash, Key } from 'lucide-react';
import { SignedCredential } from '../types';

interface Props {
  credentialEnvelope: SignedCredential;
}

export const CertificatePreview: React.FC<Props> = ({ credentialEnvelope }) => {
  const { credential, proof } = credentialEnvelope;
  const { credentialSubject } = credential;
  const certRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(credentialEnvelope, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${credential.id.replace(/:/g, '_')}.veritas.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Prepare QR payload: minimal verification metadata for portable verification
  const qrData = JSON.stringify({
    id: credential.id,
    type: credential.type,
    institutionId: credential.institutionId,
    recordHash: proof.recordHash,
    signature: proof.signature
  });

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Award size={18} className="text-indigo-600" />
          <span>Veritas Portable Institutional Certificate</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} />
            <span>Download JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer size={16} />
            <span>Print Certificate</span>
          </button>
        </div>
      </div>

      {/* Certificate Frame */}
      <div
        ref={certRef}
        className="relative bg-white border-8 border-double border-slate-800 p-8 sm:p-12 rounded-lg shadow-xl max-w-4xl mx-auto print:border-4 print:p-6 print:shadow-none"
      >
        {/* Corner Ornaments */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-slate-800 pointer-events-none" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-slate-800 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-slate-800 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-slate-800 pointer-events-none" />

        {/* Certificate Header */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-200">
          <div className="inline-flex p-3 bg-slate-900 text-white rounded-full mb-1">
            <Shield size={32} />
          </div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 font-mono">
            {credential.institutionId.toUpperCase()} • TRUST REGISTRY ACCREDITED
          </h3>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-wide">
            {credential.type === 'AcademicCertificate' ? 'Certificate of Academic Achievement' : credential.type}
          </h1>
          <p className="text-xs text-slate-600 max-w-md mx-auto italic font-serif">
            This verifiable institutional record certifies the authenticated qualification recorded on the decentralized trust registry.
          </p>
        </div>

        {/* Body Content */}
        <div className="py-8 text-center space-y-6">
          <p className="text-xs uppercase font-mono tracking-wider text-slate-400">THIS IS PROUDLY CONFERRED UPON</p>

          <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-indigo-950 underline decoration-slate-300 underline-offset-8">
            {credentialSubject.studentName || credentialSubject.recipientName || 'Candidate Name'}
          </h2>

          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            having fulfilled all requirements for the conferred degree of
          </p>

          <div className="bg-slate-50 py-3 px-6 rounded-lg inline-block border border-slate-200">
            <p className="text-xl font-bold text-slate-900 font-serif">
              {credentialSubject.qualification || 'Bachelor of Engineering'}
            </p>
            {credentialSubject.branch && (
              <p className="text-sm text-slate-600 font-medium">in {credentialSubject.branch}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-700 font-medium pt-2">
            {credentialSubject.grade && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                <CheckCircle size={15} /> Grade: <strong>{credentialSubject.grade}</strong>
              </span>
            )}
            {credentialSubject.completionYear && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                <Calendar size={15} /> Year: <strong>{credentialSubject.completionYear}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Cryptographic Proof & QR Footer */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          {/* Signatures & Metadata */}
          <div className="md:col-span-3 space-y-3 text-left">
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Issuer Address</span>
                <span className="text-slate-800 font-semibold truncate block" title={credential.issuerAddress}>
                  {credential.issuerAddress}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Issuance Date</span>
                <span className="text-slate-800 font-semibold block">
                  {new Date(credential.issuanceDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <span className="text-slate-400 block text-[10px] uppercase">Record Hash (keccak256 canonical payload)</span>
              <span className="text-slate-700 bg-slate-100 p-1 rounded font-mono text-[10px] block truncate" title={proof.recordHash}>
                {proof.recordHash}
              </span>
            </div>

            {proof.blockchainTransactionHash && (
              <div className="space-y-1 text-xs font-mono">
                <span className="text-slate-400 block text-[10px] uppercase">Blockchain Issuance Ref</span>
                <span className="text-indigo-700 bg-indigo-50 p-1 rounded font-mono text-[10px] block truncate" title={proof.blockchainTransactionHash}>
                  Tx: {proof.blockchainTransactionHash} (Block #{proof.blockNumber || 'EVM'})
                </span>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <QRCodeSVG value={qrData} size={96} level="M" />
            <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase text-center">Scan to Verify</span>
          </div>
        </div>
      </div>
    </div>
  );
};
