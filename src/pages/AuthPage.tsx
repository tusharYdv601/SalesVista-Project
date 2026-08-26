import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { ShowcasePanel } from '../components/ShowcasePanel';
import { FormPanel } from '../components/FormPanel';
import { Shield, Sparkles, Database, Lock, CheckCircle2 } from 'lucide-react';

interface AuthPageProps {
  defaultMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode = 'login' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Detect mode from props or URL
  const initialMode = defaultMode || (location.pathname === '/signup' ? 'signup' : 'login');
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Sync mode with URL if location changes externally
  useEffect(() => {
    if (location.pathname === '/signup' && mode !== 'signup') {
      setMode('signup');
    } else if (location.pathname === '/login' && mode !== 'login') {
      setMode('login');
    }
  }, [location.pathname]);

  // Switch mode and update browser URL without full reload
  const handleToggleMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    if (newMode === 'signup' && location.pathname !== '/signup') {
      navigate('/signup', { replace: false });
    } else if (newMode === 'login' && location.pathname !== '/login') {
      navigate('/login', { replace: false });
    }
  };

  const isLogin = mode === 'login';

  return (
    <div
      className="min-h-screen flex flex-col bg-[#f4faf6] text-slate-900 relative overflow-x-hidden selection:bg-emerald-600 selection:text-white"
      id="auth-page-root"
    >
      {/* Sophisticated Ambient Background with soft radial glows and faint grid/dot patterns */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Upper-left emerald ambient glow */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-emerald-200/35 rounded-full blur-3xl" />
        {/* Lower-right mint/green ambient glow */}
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-teal-100/40 rounded-full blur-3xl" />
        {/* Subtle central glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-100/25 rounded-full blur-3xl" />
        {/* Faint subtle grid/dot texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top Navigation Header */}
      <Header onSelectMode={handleToggleMode} currentMode={mode} />

      {/* Main Authentication Container */}
      <main
        className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 relative z-10 my-auto"
        id="auth-main-content"
      >
        <div className="w-full max-w-[1180px] mx-auto space-y-4">
          
          {/* Mobile Mode Switcher (Visible only on small devices below md) */}
          <div className="md:hidden flex items-center justify-center pb-1">
            <div className="inline-flex p-1.5 bg-slate-200/80 backdrop-blur-xs rounded-2xl shadow-inner border border-slate-300/60">
              <button
                type="button"
                onClick={() => handleToggleMode('login')}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                  isLogin
                    ? 'bg-white text-emerald-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('signup')}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                  !isLogin
                    ? 'bg-white text-emerald-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Elevated Premium Authentication Card */}
          <div
            id="auth-card-container"
            className="w-full bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_25px_70px_-15px_rgba(6,78,59,0.12)] border border-slate-200/80 overflow-hidden relative"
          >
            {/* ================= DESKTOP SPLIT SLIDING CANVAS (md and above) ================= */}
            <div
              className="hidden md:block relative w-full min-h-[680px] h-[680px] overflow-hidden"
              id="desktop-sliding-canvas"
            >
              {/* 
                Form Panel:
                - In Login mode: left = 0, translateX(0) -> occupies Left [0% to 50%]
                - In Signup mode: left = 0, translateX(100%) -> occupies Right [50% to 100%]
              */}
              <div
                id="desktop-form-panel"
                className={`absolute top-0 bottom-0 left-0 w-1/2 z-20 bg-white transition-transform duration-600 ease-[cubic-bezier(0.77,0,0.175,1)] ${
                  isLogin ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                <FormPanel mode={mode} onToggleMode={handleToggleMode} />
              </div>

              {/* 
                Showcase Panel:
                - In Login mode: left = 50%, translateX(0) -> occupies Right [50% to 100%]
                - In Signup mode: left = 50%, -translateX(100%) -> occupies Left [0% to 50%]
              */}
              <div
                id="desktop-showcase-panel"
                className={`absolute top-0 bottom-0 left-1/2 w-1/2 z-10 transition-transform duration-600 ease-[cubic-bezier(0.77,0,0.175,1)] ${
                  isLogin ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                <ShowcasePanel mode={mode} onToggleMode={handleToggleMode} />
              </div>
            </div>

            {/* ================= MOBILE / TABLET STACKED LAYOUT (below md) ================= */}
            <div className="block md:hidden flex flex-col divide-y divide-slate-100" id="mobile-stacked-canvas">
              {/* Primary Form Panel */}
              <div className="w-full bg-white">
                <FormPanel mode={mode} onToggleMode={handleToggleMode} />
              </div>
              
              {/* Showcase Panel Stacked */}
              <div className="w-full">
                <ShowcasePanel mode={mode} onToggleMode={handleToggleMode} />
              </div>
            </div>
          </div>

          {/* Bottom Security / Trust Footer Info */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs font-medium text-slate-500 text-center">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase Cloud PostgreSQL &amp; Auth</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Encrypted Session Tokens</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Comparative Sales Intelligence Foundation</span>
            </span>
          </div>

        </div>
      </main>
    </div>
  );
};
