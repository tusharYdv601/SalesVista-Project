import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { Home } from './pages/Home';
import { AuthPage } from './pages/AuthPage';
import { DashboardLayout } from './pages/DashboardLayout';
import { MainView } from './pages/dashboard/MainView';
import { StoresView } from './pages/dashboard/StoresView';
import { CustomersView } from './pages/dashboard/CustomersView';
import { DemographicsView } from './pages/dashboard/DemographicsView';
import { ReportsView } from './pages/dashboard/ReportsView';
import { ForecastingView } from './pages/dashboard/ForecastingView';
import { SegmentationView } from './pages/dashboard/SegmentationView';
import { AnomaliesView } from './pages/dashboard/AnomaliesView';
import { SettingsView } from './pages/dashboard/SettingsView';

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
