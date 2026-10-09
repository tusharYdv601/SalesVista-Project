import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { Home } from './pages/Home';
import { AuthPage } from './pages/AuthPage';
import { DashboardLayout } from './pages/DashboardLayout';

const lazyView = (name: string, load: () => Promise<Record<string, React.ComponentType>>) =>
  lazy(() => load().then(m => ({ default: m[name] })));

const MainView = lazyView('MainView', () => import('./pages/dashboard/MainView'));
const StoresView = lazyView('StoresView', () => import('./pages/dashboard/StoresView'));
const CustomersView = lazyView('CustomersView', () => import('./pages/dashboard/CustomersView'));
const DemographicsView = lazyView('DemographicsView', () => import('./pages/dashboard/DemographicsView'));
const ReportsView = lazyView('ReportsView', () => import('./pages/dashboard/ReportsView'));
const ForecastingView = lazyView('ForecastingView', () => import('./pages/dashboard/ForecastingView'));
const SegmentationView = lazyView('SegmentationView', () => import('./pages/dashboard/SegmentationView'));
const AnomaliesView = lazyView('AnomaliesView', () => import('./pages/dashboard/AnomaliesView'));
const DataImportView = lazyView('DataImportView', () => import('./pages/dashboard/DataImportView'));
const SettingsView = lazyView('SettingsView', () => import('./pages/dashboard/SettingsView'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#f4f9f6] font-sans antialiased selection:bg-emerald-600 selection:text-white" id="app-root-container">
          <Routes>
            {/* Public Landing Home */}
            <Route path="/" element={<Home />} />

            {/* Reusable Split-Screen Sliding Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthPage defaultMode="login" />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <AuthPage defaultMode="signup" />
                </PublicRoute>
              }
            />

            {/* Protected Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MainView />} />
              <Route path="stores" element={<StoresView />} />
              <Route path="customers" element={<CustomersView />} />
              <Route path="demographics" element={<DemographicsView />} />
              <Route path="reports" element={<ReportsView />} />
              <Route path="forecasting" element={<ForecastingView />} />
              <Route path="segmentation" element={<SegmentationView />} />
              <Route path="anomalies" element={<AnomaliesView />} />
              <Route path="import" element={<DataImportView />} />
              <Route path="settings" element={<SettingsView />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
