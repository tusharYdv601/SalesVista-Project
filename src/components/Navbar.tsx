import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, LogIn, UserPlus, LogOut, LayoutDashboard, Menu, X, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header id="main-navbar" className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {!isConfigured && (
        <div id="supabase-config-banner" className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              <strong>Supabase Setup:</strong> Add <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">VITE_SUPABASE_ANON_KEY</code> to connect your live Supabase project.
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group" id="nav-brand-logo">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight block leading-tight">
                Sales Analysis
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                B.Tech Mini Project • Supabase & React
              </span>
            </div>
          </Link>

          {/* Desktop Nav Actions */}
          <nav className="hidden md:flex items-center gap-3" id="desktop-nav-links">
            <Link
              to="/"
              id="nav-link-home"
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive('/') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  id="nav-link-dashboard"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/dashboard') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="h-4 w-px bg-slate-200 mx-1"></div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium max-w-[160px] truncate" title={user.email}>
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    id="nav-btn-logout"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  id="nav-btn-login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  id="nav-btn-signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-100 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              id="mobile-menu-toggle-btn"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-nav-menu" className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-base font-medium ${
              isActive('/') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </Link>
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  isActive('/dashboard') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>
              <div className="pt-2 border-t border-slate-100">
                <p className="px-3 py-1 text-xs text-slate-500 font-medium truncate">{user.email}</p>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 rounded-lg text-base font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 rounded-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
