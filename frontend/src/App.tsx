import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InstitutionsPage } from './pages/InstitutionsPage';
import { IssuersPage } from './pages/IssuersPage';
import { IssueCredentialPage } from './pages/IssueCredentialPage';
import { VerificationPage } from './pages/VerificationPage';
import { RevocationPage } from './pages/RevocationPage';
import { AuditPage } from './pages/AuditPage';
import { TrustLabPage } from './pages/TrustLabPage';
import { BatchVerificationPage } from './pages/BatchVerificationPage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NetworkStatusBanner />
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/institutions" element={<InstitutionsPage />} />
            <Route path="/issuers" element={<IssuersPage />} />
            <Route path="/issue" element={<IssueCredentialPage />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/batch-verify" element={<BatchVerificationPage />} />
            <Route path="/revocation" element={<RevocationPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/trust-lab" element={<TrustLabPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
