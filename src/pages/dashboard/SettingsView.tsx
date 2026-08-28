import React from 'react';
import { Sliders, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { user, signOut } = useAuth();
  
  const userEmail = user?.email || 'Authenticated User';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="space-y-6" id="settings-tab">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            Configuration &amp; Account
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Workspace Settings</h2>
          <p className="text-xs sm:text-sm text-slate-500">Manage user session credentials and analytical parameters.</p>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="p-4 rounded-xl border border-slate-200 bg-[#f8faf9] space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Authentication Provider</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Supabase Cloud Auth</span>
              <span className="text-xs text-[#2d6a4f] bg-[#e8f3ed] px-2 py-0.5 rounded border border-emerald-200">
                Connected
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-[#f8faf9] space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Authenticated Account</span>
            <div className="text-sm font-semibold text-slate-800">{userEmail}</div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            id="settings-signout-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of This Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
