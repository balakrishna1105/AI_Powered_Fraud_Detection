import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Claims } from './pages/Claims';
import { ClaimDetail } from './pages/ClaimDetail';
import { Investigations } from './pages/Investigations';
import { InvestigationDetail } from './pages/InvestigationDetail';
import { Providers } from './pages/Providers';
import { ProviderDetail } from './pages/ProviderDetail';
import { Members } from './pages/Members';
import { MemberDetail } from './pages/MemberDetail';
import { Reports } from './pages/Reports';
import { FraudRules } from './pages/FraudRules';
import { Users } from './pages/Users';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes inside App Shell */}
            <Route element={<ProtectedRoute />}>
              {/* Dashboard */}
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />

              {/* Claims */}
              <Route path="/claims" element={<Claims />} />
              <Route path="/claims/:claimId" element={<ClaimDetail />} />

              {/* Investigations */}
              <Route path="/investigations" element={<Investigations />} />
              <Route path="/investigations/:investigationId" element={<InvestigationDetail />} />

              {/* Providers */}
              <Route path="/providers" element={<Providers />} />
              <Route path="/providers/:providerId" element={<ProviderDetail />} />

              {/* Members */}
              <Route path="/members" element={<Members />} />
              <Route path="/members/:memberId" element={<MemberDetail />} />

              {/* Reports */}
              <Route path="/reports" element={<Reports />} />

              {/* Admin & Governance Routes */}
              <Route path="/fraud-rules" element={<Navigate to="/admin/fraud-rules" replace />} />
              <Route path="/admin/fraud-rules" element={<FraudRules />} />

              <Route path="/users" element={<Navigate to="/admin/users" replace />} />
              <Route path="/admin/users" element={<Users />} />

              <Route path="/audit-logs" element={<Navigate to="/admin/audit-logs" replace />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />

              <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
