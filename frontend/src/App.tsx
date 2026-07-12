import React from 'react';
import logo from './assets/logo.png';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { darkTheme } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AppLayout from './layouts/AppLayout';

// Pages — Auth (Member 1)
import LoginPage from './pages/LoginPage';

// Pages — Organization (Member 1)
import DepartmentsPage from './pages/org/DepartmentsPage';
import CategoriesPage from './pages/org/CategoriesPage';
import FacilitiesPage from './pages/org/FacilitiesPage';

// Pages — Assets (Member 2)
import AssetDirectoryPage from './pages/assets/AssetDirectoryPage';
import AssetRegistrationForm from './pages/assets/AssetRegistrationForm';
import AssetDetailPage from './pages/assets/AssetDetailPage';
import AllocationTransferPage from './pages/assets/AllocationTransferPage';

// Pages — Bookings (Member 3)
import ResourceBookingPage from './pages/booking/ResourceBookingPage';

// Pages — Maintenance & Dashboard (Member 4)
import DashboardPage from './pages/maintenance/DashboardPage';
import MaintenanceKanbanPage from './pages/maintenance/MaintenanceKanbanPage';
import AuditPage from './pages/maintenance/AuditPage';
import ReportsPage from './pages/maintenance/ReportsPage';
import NotificationsPage from './pages/maintenance/NotificationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-deepest)',
      }}>
        <img src={logo} alt="AssetFlow" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', animation: 'pulse 2s ease-in-out infinite' }} />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Dashboard (Member 4) */}
        <Route path="/" element={<DashboardPage />} />

        {/* Assets (Member 2) */}
        <Route path="/assets" element={<AssetDirectoryPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/assets/:id/allocate" element={<AllocationTransferPage />} />

        {/* Bookings (Member 3) */}
        <Route path="/bookings" element={<ResourceBookingPage />} />

        {/* Maintenance (Member 4) */}
        <Route path="/maintenance" element={<MaintenanceKanbanPage />} />
        <Route path="/audits" element={<AuditPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Organization (Member 1) */}
        <Route path="/org/departments" element={<DepartmentsPage />} />
        <Route path="/org/categories" element={<CategoriesPage />} />
        <Route path="/org/facilities" element={<FacilitiesPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={darkTheme}>
        <AntApp>
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
