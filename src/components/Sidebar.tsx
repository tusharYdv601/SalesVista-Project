import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  LayoutDashboard, 
  Store, 
  Users, 
  PieChart, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  ShieldCheck, 
  X,
  TrendingUp,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavItemKey = 
  | 'dashboard' 
  | 'stores' 
  | 'customers' 
  | 'demographics' 
  | 'reports' 
  | 'forecasting'
  | 'segmentation'
  | 'anomalies'
  | 'settings';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>> | ((val: boolean) => void);
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItemConfig {
  key: NavItemKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItemConfig[];
}

export const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'stores', label: 'Stores', icon: Store },
      { key: 'customers', label: 'Customers', icon: Users },
      { key: 'demographics', label: 'Demographics', icon: PieChart },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { key: 'reports', label: 'Reports / Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'RESEARCH & AI',
    items: [
      { key: 'forecasting', label: 'Sales Forecasting', icon: TrendingUp, badge: 'AI', badgeColor: 'bg-emerald-100 text-emerald-800' },
      { key: 'segmentation', label: 'Customer Segmentation', icon: Layers, badge: 'ML', badgeColor: 'bg-blue-100 text-blue-800' },
      { key: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle, badge: 'Detection', badgeColor: 'bg-amber-100 text-amber-800' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { key: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user, signOut } = useAuth();

  // Persist sidebar state in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sales-dashboard-sidebar-collapsed', String(collapsed));
    } catch {
      // Ignore storage error
    }
  }, [collapsed]);

  const toggleCollapsed = () => {
    if (typeof setCollapsed === 'function') {
      setCollapsed(!collapsed);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Derive dynamic user details from Supabase auth state
  const userFullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';
  const userEmail = user?.email || 'Authenticated User';
  const initialLetter = (userFullName.trim().charAt(0) || userEmail.trim().charAt(0) || 'U').toUpperCase();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Collapsible Sidebar */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/90 shadow-xs transition-all duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen select-none shrink-0 ${
          /* Desktop width: expanded ~292px, collapsed ~68px */
          collapsed ? 'lg:w-[68px]' : 'lg:w-[292px]'
        } ${
          /* Mobile off-canvas drawer */
          isMobileOpen ? 'translate-x-0 w-[292px]' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* ================= 1. BRAND HEADER (TOP) ================= */}
        <div 
          className="flex items-center justify-between px-3.5 py-4 border-b border-slate-100 min-h-[72px] shrink-0" 
          id="sidebar-brand-header"
        >
          <Link
            to="/"
            id="sidebar-logo-link"
            title="Go to Home Page"
            className="flex items-center gap-3 overflow-hidden min-w-0 group cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#2d6a4f]/40 rounded-xl p-1 -m-1 transition-all"
          >
            {/* Green rounded-square logo */}
            <div 
              className="w-10 h-10 rounded-xl bg-[#2d6a4f] group-hover:bg-[#23533e] flex items-center justify-center text-white shadow-xs shrink-0 transition-transform group-hover:scale-105"
              title="Comparative Sales Analysis - Go to Home"
            >
              <BarChart3 className="w-5 h-5" />
            </div>

            {/* Complete Brand Details - Completely readable without truncation */}
            <div className={`flex flex-col min-w-0 transition-opacity duration-150 ${collapsed ? 'lg:hidden' : 'block'}`}>
              <span className="font-bold text-slate-900 group-hover:text-[#2d6a4f] text-[13.5px] leading-tight tracking-tight whitespace-nowrap transition-colors">
                Comparative Sales Analysis
              </span>
              <span className="text-[11px] font-semibold text-[#2d6a4f] tracking-tight whitespace-nowrap mt-0.5">
                Stores • Customers • Demographics
              </span>
            </div>
          </Link>

          {/* Desktop Collapse / Expand Button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            id="sidebar-collapse-btn"
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-1"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Drawer Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            id="sidebar-mobile-close"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= 2. NAVIGATION LIST (ORGANIZED BY SECTIONS) ================= */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200" id="sidebar-nav-list">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Section Header Label */}
              <div 
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-opacity duration-150 ${
                  collapsed ? 'lg:hidden' : 'block'
                }`}
              >
                {section.title}
              </div>

              {/* Nav Items in Section */}
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;

                  return (
                    <div key={item.key} className="relative group">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab(item.key);
                          onCloseMobile();
                        }}
                        id={`sidebar-nav-${item.key}`}
                        aria-label={item.label}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[42px] rounded-xl text-xs font-medium transition-all duration-150 ease-in-out cursor-pointer relative ${
                          isActive
                            ? 'bg-[#e8f3ed] text-[#2d6a4f] font-semibold border-l-[3px] border-[#2d6a4f]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-[#e8f3ed]/40'
                        } ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}
                      >
                        <Icon 
                          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                            isActive ? 'text-[#2d6a4f]' : 'text-slate-400 group-hover:text-slate-700'
                          }`} 
                        />

                        {/* Nav label */}
                        <span className={`truncate text-left flex-1 transition-opacity duration-150 ${collapsed ? 'lg:hidden' : 'block'}`}>
                          {item.label}
                        </span>

                        {/* Badge for Research & AI items */}
                        {item.badge && !collapsed && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 hidden lg:inline-block ${item.badgeColor || 'bg-emerald-100 text-emerald-800'}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>

                      {/* Accessible hover tooltip when collapsed on desktop */}
                      {collapsed && (
                        <div 
                          role="tooltip"
                          className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none items-center gap-1.5"
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] text-emerald-300 font-normal">({item.badge})</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* ================= 3. USER PROFILE & SIGN OUT (PINNED TO BOTTOM) ================= */}
        <div className="mt-auto border-t border-slate-100 p-3 bg-slate-50/70 shrink-0 space-y-2.5" id="sidebar-user-footer">
          {/* User profile card */}
          <div className={`flex items-center gap-2.5 ${collapsed ? 'lg:justify-center' : ''}`} id="sidebar-user-profile-box">
            {/* Avatar circle with user initial */}
            <div 
              className="w-9 h-9 rounded-full bg-[#2d6a4f] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs"
              title={`${userFullName} (${userEmail})`}
            >
              {initialLetter}
            </div>

            {/* Profile Info */}
            <div className={`flex-1 min-w-0 ${collapsed ? 'lg:hidden' : 'block'}`}>
              <h4 className="text-xs font-bold text-slate-900 truncate" title={userFullName}>
                {userFullName}
              </h4>
              <p className="text-[11px] text-slate-500 truncate" title={userEmail}>
                {userEmail}
              </p>

              {/* Connected badge */}
              <div className="flex items-center gap-1 text-[10px] font-medium text-[#2d6a4f] mt-0.5">
                <ShieldCheck className="w-3 h-3 text-[#2d6a4f] shrink-0" />
                <span className="truncate">Connected via Supabase Auth</span>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="relative group">
            <button
              type="button"
              onClick={handleLogout}
              id="sidebar-signout-button"
              aria-label="Sign out"
              className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                collapsed ? 'lg:justify-center lg:px-2' : 'justify-center'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
              <span className={`truncate ${collapsed ? 'lg:hidden' : 'block'}`}>
                Sign Out
              </span>
            </button>

            {/* Sign Out tooltip when collapsed */}
            {collapsed && (
              <div 
                role="tooltip"
                className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1.5 bg-red-900 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none items-center"
              >
                Sign Out
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
