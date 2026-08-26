import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, 
  LogOut, 
  User, 
  Mail, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const userFullName = user?.user_metadata?.full_name || 'Sales Analyst';
  const userEmail = user?.email || 'authenticated@user.com';

  return (
    <div className="min-h-screen bg-[#f4f9f6] text-slate-900 flex flex-col" id="dashboard-container">
      {/* Dashboard Top Navigation */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30" id="dashboard-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group" id="dashboard-brand-link">
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

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </Link>
            <button
              onClick={handleLogout}
              id="dashboard-logout-button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-200/60 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center" id="dashboard-main">
        <div className="w-full bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl shadow-emerald-950/5 space-y-8 text-center" id="welcome-dashboard-card">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Authenticated Session Active
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight" id="dashboard-welcome-heading">
              Welcome to Sales Analysis Dashboard
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Comparative Sales Analysis of Stores, Customers and Demographics using Supabase and React.js
            </p>
          </div>

          {/* User Information Profile Box */}
          <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3" id="dashboard-user-info">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-700/20">
                {userFullName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  User Profile
                </div>
                <h3 className="font-bold text-slate-900 text-base truncate">{userFullName}</h3>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-600">
              <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="font-medium truncate">{userEmail}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-700 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Connected via Supabase Auth</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-600" />
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
