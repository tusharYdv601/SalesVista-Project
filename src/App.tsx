import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { Home } from './pages/Home';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';

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
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
