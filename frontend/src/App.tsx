import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { darkTheme } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AppLayout from './layouts/AppLayout';

// Pages — Member 1 (Auth & Org)
import LoginPage from './pages/LoginPage';
import DepartmentsPage from './pages/org/DepartmentsPage';
import CategoriesPage from './pages/org/CategoriesPage';
import FacilitiesPage from './pages/org/FacilitiesPage';

// Placeholder pages — Members 2, 3, 4
import {
  DashboardPage,
  AssetsPage,
  BookingsPage,
  MaintenancePage,
  AuditsPage,
  ReportsPage,
  NotificationsPage,
} from './pages/PlaceholderPages';

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
        <div className="sidebar-brand-icon" style={{ width: 56, height: 56, fontSize: 22, animation: 'pulse 2s ease-in-out infinite' }}>
          AF
        </div>
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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/audits" element={<AuditsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Organization — Member 1 */}
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
