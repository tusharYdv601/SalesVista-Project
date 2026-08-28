import React from 'react';
import { Menu, Search, Bell, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenMobileDrawer: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  onOpenMobileDrawer,
}) => {
  const { user } = useAuth();
  const userFullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';
  const userEmail = user?.email || 'Authenticated User';
  const initialLetter = (userFullName.trim().charAt(0) || userEmail.trim().charAt(0) || 'U').toUpperCase();

  return (
    <header
      className="sticky top-0 z-30 w-full bg-[#f3f7f4] pt-3 sm:pt-4 pb-3 sm:pb-4 transition-all shrink-0"
      id="dashboard-header"
    >
      {/* Floating Glass Navigation Container matching Home Header language */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.05)] px-4 sm:px-6 py-2.5 min-h-[64px] flex items-center justify-between gap-3 sm:gap-4 transition-all">

        
        {/* LEFT: Mobile Menu Toggle, Analytics Icon & Title/Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger Button for Mobile Drawer */}
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            id="mobile-drawer-toggle"
            aria-label="Open navigation"
            className="lg:hidden p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F3F8F5] transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Green Analytics Indicator Badge */}
          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[#EAF4EE] border border-[#2D6A4F]/15 items-center justify-center text-[#2D6A4F] shrink-0 transition-transform duration-200 hover:scale-105 shadow-2xs">
            <BarChart3 className="w-4 h-4 text-[#2D6A4F]" />
          </div>

          {/* Header Title and Subtitle */}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-[21px] font-bold text-[#0F172A] tracking-tight leading-tight truncate">
              {title}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#64748B] font-medium hidden sm:block truncate mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* RIGHT: Utility Area (Search, Notification Bell, Divider, User Profile) */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Search Input */}
          <div className="relative hidden md:block w-48 lg:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none transition-colors" />
            <input
              type="text"
              placeholder="Search analytics..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 h-[38px] bg-[#F8FAFC] hover:bg-[#F1F5F9]/70 focus:bg-white border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 transition-all duration-150"
            />
          </div>

          {/* Notification Bell Button */}
          <button
            type="button"
            id="header-notification-btn"
            aria-label="Notifications"
            className="relative w-[38px] h-[38px] flex items-center justify-center rounded-xl text-[#64748B] hover:text-[#2D6A4F] bg-white hover:bg-[#F3F8F5] border border-[#E2E8F0] hover:border-[#2D6A4F]/20 transition-all duration-150 cursor-pointer hover:scale-105 shadow-2xs"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#2D6A4F] ring-2 ring-white" />
          </button>

          {/* Subtle Vertical Divider */}
          <div className="h-7 w-px bg-[#E2E8F0] mx-0.5" />

          {/* User Profile Section */}
          <div
            className="flex items-center gap-2.5 px-2 py-1 rounded-xl hover:bg-[#F3F8F5] transition-all duration-150 cursor-default"
            id="header-user-status"
          >
            {/* Avatar */}
            <div
              className="w-[38px] h-[38px] rounded-full bg-[#2D6A4F] text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 transition-transform duration-150 hover:scale-105"
              title={`${userFullName} (${userEmail})`}
            >
              {initialLetter}
            </div>

            {/* Username and Online indicator */}
            <div className="hidden sm:block text-left max-w-[130px]">
              <div
                className="text-xs sm:text-sm font-semibold text-[#0F172A] truncate leading-tight"
                title={userFullName}
              >
                {userFullName}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#2D6A4F] font-medium truncate mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] shrink-0"></span>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </header>
  );
};

