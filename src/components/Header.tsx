import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, LogIn, UserPlus, Home, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onSelectMode?: (mode: 'login' | 'signup') => void;
  currentMode?: 'login' | 'signup';
}

export const Header: React.FC<HeaderProps> = ({ onSelectMode, currentMode }) => {
  const { user, signOut, isConfigured } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  const handleModeClick = (mode: 'login' | 'signup') => {
    if (onSelectMode) {
      onSelectMode(mode);
    }
  };

  return (
    <header id="main-header" className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
      {!isConfigured && (
        <div id="supabase-config-banner" className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              <strong>Supabase Setup:</strong> Add <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">VITE_SUPABASE_ANON_KEY</code> to connect your live Supabase project.
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Left: Branding */}
          <Link to="/" className="flex items-center gap-3 group" id="header-brand">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 group-hover:bg-emerald-800 transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight block leading-tight">
                Comparative Sales Analysis
              </span>
              <span className="text-[11px] text-emerald-800 font-medium tracking-wide">
                Stores • Customers • Demographics
              </span>
            </div>
          </Link>

          {/* Right: Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 sm:gap-3" id="header-nav-links">
            <Link
              to="/"
              id="header-nav-home"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/'
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  id="header-nav-dashboard"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                  Dashboard
                </Link>
                <div className="h-4 w-px bg-slate-200 mx-1"></div>
                <button
                  onClick={() => signOut()}
                  id="header-nav-logout"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                {isAuthPage && onSelectMode ? (
                  <button
                    onClick={() => handleModeClick('login')}
                    id="header-btn-login-mode"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                      currentMode === 'login'
                        ? 'text-emerald-800 bg-emerald-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </button>
                ) : (
                  <Link
                    to="/login"
                    id="header-link-login"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                )}

                {isAuthPage && onSelectMode ? (
                  <button
                    onClick={() => handleModeClick('signup')}
                    id="header-btn-signup-mode"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-all ${
                      currentMode === 'signup'
                        ? 'text-white bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20'
                        : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </button>
                ) : (
                  <Link
                    to="/signup"
                    id="header-link-signup"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-700/20 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              id="header-mobile-toggle"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div id="header-mobile-menu" className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-emerald-800 bg-emerald-50"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                to="/login"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onSelectMode) onSelectMode('login');
                }}
                className="block text-center px-4 py-2.5 rounded-lg text-base font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onSelectMode) onSelectMode('signup');
                }}
                className="block text-center px-4 py-2.5 rounded-lg text-base font-medium text-white bg-emerald-700 hover:bg-emerald-800"
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
