import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onSelectMode?: (mode: 'login' | 'signup') => void;
  currentMode?: 'login' | 'signup';
}

export const Header: React.FC<HeaderProps> = ({
  onSelectMode,
  currentMode,
}) => {
  const { signOut, isConfigured, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = location.pathname === '/';
  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/signup';

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleAuthMode = (mode: 'login' | 'signup') => {
    if (onSelectMode) {
      onSelectMode(mode);
    }
  };

  const navItemClass = (active = false) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm transition-all duration-200 ${
      active
        ? 'bg-[#EAF4EE] text-[#2D6A4F] font-semibold'
        : 'text-[#64748B] hover:text-[#2D6A4F] hover:bg-[#F3F8F5]'
    }`;

  return (
    <header className="sticky top-3 z-50 w-full px-4 sm:px-6">
      <div className="mx-auto max-w-[1280px]">

        {/* Supabase configuration notice */}
        {!isConfigured && (
          <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />

              <span>
                <strong>Supabase Setup:</strong> Add{' '}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">
                  VITE_SUPABASE_URL
                </code>{' '}
                and{' '}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">
                  VITE_SUPABASE_ANON_KEY
                </code>{' '}
                in your environment settings.
              </span>
            </div>
          </div>
        )}

        {/* Main Header */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white/95 px-3 sm:px-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur-md">

          <div className="flex min-h-[64px] items-center justify-between gap-4">

            {/* Brand */}
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="group flex min-w-0 items-center gap-3"
            >
              {/* Logo */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2D6A4F] text-white shadow-sm transition-all duration-200 group-hover:bg-[#24583F] group-hover:shadow-md">
                <BarChart3 className="h-5 w-5" />
              </div>

              {/* Brand text */}
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold leading-tight tracking-tight text-[#0F172A] transition-colors group-hover:text-[#2D6A4F] sm:text-base">
                  Comparative Sales Analysis
                </div>

                <div className="mt-0.5 text-[10px] font-medium tracking-wide text-[#52735F] sm:text-[11px]">
                  Stores • Customers • Demographics
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 md:flex">

              {/* Home */}
              <Link
                to="/"
                className={navItemClass(isHome)}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>

              {isAuthenticated ? (
                <>
                  {/* Dashboard */}
                  <Link
                    to="/dashboard"
                    className={navItemClass(
                      location.pathname === '/dashboard'
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>

                  <div className="mx-2 h-6 w-px bg-[#E2E8F0]" />

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-2 h-6 w-px bg-[#E2E8F0]" />

                  {/* Login */}
                  {isAuthPage && onSelectMode ? (
                    <button
                      type="button"
                      onClick={() => handleAuthMode('login')}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                        currentMode === 'login'
                          ? 'bg-[#EAF4EE] font-semibold text-[#2D6A4F]'
                          : 'text-[#64748B] hover:bg-[#F3F8F5] hover:text-[#2D6A4F]'
                      }`}
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Login</span>
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-[#64748B] transition-all duration-200 hover:bg-[#F3F8F5] hover:text-[#2D6A4F]"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Login</span>
                    </Link>
                  )}

                  {/* Sign Up */}
                  {isAuthPage && onSelectMode ? (
                    <button
                      type="button"
                      onClick={() => handleAuthMode('signup')}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ${
                        currentMode === 'signup'
                          ? 'bg-[#24583F] shadow-md'
                          : 'bg-[#2D6A4F] shadow-sm hover:-translate-y-0.5 hover:bg-[#24583F] hover:shadow-md'
                      }`}
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Sign Up</span>
                    </button>
                  ) : (
                    <Link
                      to="/signup"
                      className="flex items-center gap-2 rounded-xl bg-[#2D6A4F] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#24583F] hover:shadow-md"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Sign Up</span>
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#334155] transition-colors hover:bg-[#F3F8F5] hover:text-[#2D6A4F] md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] md:hidden">

            {/* Home */}
            <Link
              to="/"
              onClick={closeMobileMenu}
              className={navItemClass(isHome)}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>

            {isAuthenticated ? (
              <>
                {/* Dashboard */}
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className={`mt-1 ${navItemClass(
                    location.pathname === '/dashboard'
                  )}`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                {/* Logout */}
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    signOut();
                  }}
                  className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* Login */}
                <Link
                  to="/login"
                  onClick={() => {
                    closeMobileMenu();
                    handleAuthMode('login');
                  }}
                  className="mt-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#2D6A4F] transition-colors hover:bg-[#F3F8F5]"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>

                {/* Sign Up */}
                <Link
                  to="/signup"
                  onClick={() => {
                    closeMobileMenu();
                    handleAuthMode('signup');
                  }}
                  className="mt-1 flex items-center gap-2 rounded-xl bg-[#2D6A4F] px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#24583F]"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};