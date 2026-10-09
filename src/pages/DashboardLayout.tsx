import React, { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { DashboardHeader } from '../components/DashboardHeader';
import { PageLoader } from '../components/PageLoader';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();

  // Collapsed state persisted in localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sales-dashboard-sidebar-collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Determine active tab based on pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeTab = pathParts.length > 1 ? pathParts[1] : 'dashboard';

  // Get tab title and subtitle for top header
  const getTabInfo = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Sales performance overview across stores, customers and demographics.'
        };
      case 'stores':
        return {
          title: 'Stores Analysis',
          subtitle: 'Comparative multi-branch retail sales and store performance benchmarks.'
        };
      case 'customers':
        return {
          title: 'Customer Insights',
          subtitle: 'Customer purchasing behavior, visit frequency and retention trends.'
        };
      case 'demographics':
        return {
          title: 'Demographics Segmentation',
          subtitle: 'Geographic and age group distribution across customer populations.'
        };
      case 'reports':
        return {
          title: 'Reports & Analytics',
          subtitle: 'Consolidated research reports and comparative analytics synthesis.'
        };
      case 'forecasting':
        return {
          title: 'Sales Forecasting (AI)',
          subtitle: 'Predictive modeling and revenue trends based on historical series.'
        };
      case 'segmentation':
        return {
          title: 'Customer Segmentation (ML)',
          subtitle: 'K-Means clustering and RFM-based behavioral customer segmentation.'
        };
      case 'anomalies':
        return {
          title: 'Anomaly Detection',
          subtitle: 'Statistical outlier detection for unexpected sales spikes and variances.'
        };
      case 'settings':
        return {
          title: 'Workspace Settings',
          subtitle: 'Manage user session authentication and workspace parameters.'
        };
      case 'import':
        return {
          title: 'Data Import Center',
          subtitle: 'Insert new transactions, upload CSVs, and manage your dataset.'
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Sales performance overview across stores, customers and demographics.'
        };
    }
  };

  const currentTabInfo = getTabInfo(activeTab);

  return (
    <div className="min-h-screen bg-[#f3f7f4] text-slate-900 flex overflow-x-hidden" id="dashboard-container">
      {/* ================= FIXED COLLAPSIBLE LEFT SIDEBAR ================= */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* ================= MAIN SCROLLABLE CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto" id="dashboard-main-area">
        
        {/* ================= TOP HEADER COMPONENT ================= */}
        <DashboardHeader
          title={currentTabInfo.title}
          subtitle={currentTabInfo.subtitle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileDrawer={() => setIsMobileOpen(true)}
        />

        {/* ================= MAIN BODY CONTAINER (MAX-WIDTH 1400PX) ================= */}
        <main className="flex-1 p-5 sm:p-7 lg:p-8 max-w-[1400px] w-full mx-auto space-y-7" id="dashboard-content">
          <Suspense fallback={<PageLoader fullScreen={false} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};
