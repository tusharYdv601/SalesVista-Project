import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  AlertTriangle,
  Pin,
  Database
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
  | 'settings'
  | 'import';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>> | ((val: boolean) => void);
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
    title: 'DATA MANAGEMENT',
    items: [
      { key: 'import', label: 'Data Import', icon: Database },
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
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeTab = pathParts.length > 1 ? pathParts[1] : 'dashboard';

  const [isHovered, setIsHovered] = React.useState(false);
  const isVisuallyCollapsed = collapsed && !isHovered;

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
      setIsHovered(false);
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`z-50 flex flex-col bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(15,23,42,0.12)] transition-all duration-300 ease-in-out select-none shrink-0 
        border border-[#E2E8F0] rounded-2xl h-[calc(100vh-32px)] top-4
        fixed left-4 lg:sticky lg:left-auto lg:ml-4 lg:mr-2 ${
          /* Desktop width: expanded ~292px, collapsed ~68px */
          isVisuallyCollapsed ? 'lg:w-[68px]' : 'lg:w-[292px]'
        } ${
          /* Mobile off-canvas drawer */
          isMobileOpen ? 'translate-x-0 w-[292px]' : '-translate-x-[calc(100%+16px)] lg:translate-x-0'
        }`}
      >
        {/* ================= 1. BRAND HEADER (TOP) ================= */}
        <div 
          className={`flex items-center px-3.5 py-4 border-b border-[#E2E8F0] min-h-[72px] shrink-0 relative ${isVisuallyCollapsed ? 'lg:justify-center justify-between' : 'justify-between'}`}
          id="sidebar-brand-header"
        >
          <Link
            to="/"
            id="sidebar-logo-link"
            title="Go to Home Page"
            className="flex items-center gap-3 overflow-hidden min-w-0 group cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#2d6a4f]/40 rounded-xl p-1 -m-1 transition-all"
          >
            <div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] flex items-center justify-center text-white shadow-[0_2px_10px_rgba(45,106,79,0.3)] shrink-0 transition-transform duration-200 group-hover:scale-105 group-hover:shadow-[0_4px_15px_rgba(45,106,79,0.4)]"
              title="Comparative Sales Analysis - Go to Home"
            >
              <BarChart3 className="w-5 h-5" />
            </div>

            <div className={`flex flex-col min-w-0 transition-opacity duration-150 ${isVisuallyCollapsed ? 'lg:hidden' : 'block'}`}>
              <span className="font-bold text-slate-900 group-hover:text-[#2d6a4f] text-[13.5px] leading-tight tracking-tight whitespace-nowrap transition-colors">
                Comparative Sales Analysis
              </span>
              <span className="text-[11px] font-semibold text-[#2d6a4f] tracking-tight whitespace-nowrap mt-0.5">
                Stores • Customers • Demographics
              </span>
            </div>
          </Link>

          {!isVisuallyCollapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-1"
              aria-label={collapsed ? 'Pin sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Pin sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <Pin className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}

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
                className={`px-3 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400 transition-opacity duration-150 ${
                  isVisuallyCollapsed ? 'lg:hidden' : 'block'
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
                      <Link
                        to={`/dashboard${item.key === 'dashboard' ? '' : `/${item.key}`}`}
                        onClick={() => {
                          onCloseMobile();
                          setIsHovered(false);
                        }}
                        id={`sidebar-nav-${item.key}`}
                        aria-label={item.label}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-xl text-[13px] font-medium transition-all duration-200 ease-in-out cursor-pointer group/nav ${
                          isActive
                            ? 'bg-[#e8f3ed] text-[#2d6a4f] shadow-sm ring-1 ring-[#2d6a4f]/20 font-semibold'
                            : 'text-slate-600 hover:text-[#0F172A] hover:bg-[#F1F5F9]/70'
                        } ${isVisuallyCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                      >
                        <Icon 
                          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                            isActive ? 'text-[#2d6a4f]' : 'text-slate-400 group-hover/nav:text-slate-700'
                          }`} 
                        />

                        {/* Nav label */}
                        <span className={`truncate text-left flex-1 transition-opacity duration-150 ${isVisuallyCollapsed ? 'lg:hidden' : 'block'}`}>
                          {item.label}
                        </span>

                        {/* Badge for Research & AI items */}
                        {item.badge && !isVisuallyCollapsed && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 hidden lg:inline-block ${item.badgeColor || 'bg-emerald-100 text-emerald-800'}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>

                      {/* Accessible hover tooltip when collapsed on desktop */}
                      {isVisuallyCollapsed && (
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
        <div className="mt-auto border-t border-[#E2E8F0] p-3 bg-slate-50/70 shrink-0 space-y-2.5 rounded-b-2xl" id="sidebar-user-footer">
          {/* User profile card */}
          <div className={`flex items-center gap-2.5 ${isVisuallyCollapsed ? 'lg:justify-center' : ''}`} id="sidebar-user-profile-box">
            {/* Avatar circle with user initial */}
            <div 
              className="w-9 h-9 rounded-full bg-[#2d6a4f] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs"
              title={`${userFullName} (${userEmail})`}
            >
              {initialLetter}
            </div>

            {/* Profile Info */}
            <div className={`flex-1 min-w-0 ${isVisuallyCollapsed ? 'lg:hidden' : 'block'}`}>
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
              className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600 text-[13px] font-medium transition-all duration-200 cursor-pointer hover:shadow-sm hover:-translate-y-px ${
                isVisuallyCollapsed ? 'lg:justify-center lg:px-2' : 'justify-center'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
              <span className={`truncate ${isVisuallyCollapsed ? 'lg:hidden' : 'block'}`}>
                Sign Out
              </span>
            </button>

            {/* Sign Out tooltip when collapsed */}
            {isVisuallyCollapsed && (
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
