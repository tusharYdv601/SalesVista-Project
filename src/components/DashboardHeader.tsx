import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  userFullName: string;
  userEmail: string;
  initialLetter: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenMobileDrawer: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  userFullName,
  userEmail,
  initialLetter,
  searchQuery,
  onSearchChange,
  onOpenMobileDrawer,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs shrink-0" id="dashboard-header">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger Button for Mobile Drawer */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          id="mobile-drawer-toggle"
          aria-label="Open navigation"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Header Title and Subtitle */}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
            {title}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Header Actions: Search, Notification, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Search Input (Hidden on extra small screens) */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search analytics..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#2d6a4f] focus:border-[#2d6a4f] transition-all"
          />
        </div>

        {/* Notification Bell Icon */}
        <button
          type="button"
          id="header-notification-btn"
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2d6a4f]"></span>
        </button>

        {/* User Avatar & Name */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200" id="header-user-status">
          <div 
            className="w-8 h-8 rounded-full bg-[#2d6a4f] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0"
            title={`${userFullName} (${userEmail})`}
          >
            {initialLetter}
          </div>
          <div className="hidden sm:block text-left max-w-[130px]">
            <div className="text-xs font-bold text-slate-800 truncate" title={userFullName}>
              {userFullName}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
