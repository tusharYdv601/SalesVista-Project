import React, { useState } from 'react';
import { 
  Sparkles,
  Building2,
  Users,
  PieChart,
  TrendingUp,
  Sliders,
  LogOut,
  BarChart3,
  Layers,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Store,
  ShieldCheck,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar, NavItemKey } from '../components/Sidebar';
import { DashboardHeader } from '../components/DashboardHeader';
import { KpiCard } from '../components/KpiCard';
import { AnalysisCard } from '../components/AnalysisCard';
import { ResearchCard } from '../components/ResearchCard';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  // Collapsed state persisted in localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sales-dashboard-sidebar-collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<NavItemKey>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Authenticated user values directly from Supabase session
  const userFullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'hello';
  const userEmail = user?.email || 'Authenticated User';
  const initialLetter = (userFullName.trim().charAt(0) || userEmail.trim().charAt(0) || 'H').toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Get tab title and subtitle for top header
  const getTabInfo = (tab: NavItemKey) => {
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
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* ================= MAIN SCROLLABLE CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto" id="dashboard-main-area">
        
        {/* ================= TOP HEADER COMPONENT ================= */}
        <DashboardHeader
          title={currentTabInfo.title}
          subtitle={currentTabInfo.subtitle}
          userFullName={userFullName}
          userEmail={userEmail}
          initialLetter={initialLetter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileDrawer={() => setIsMobileOpen(true)}
        />

        {/* ================= MAIN BODY CONTAINER (MAX-WIDTH 1400PX) ================= */}
        <main className="flex-1 p-5 sm:p-7 lg:p-8 max-w-[1400px] w-full mx-auto space-y-7" id="dashboard-content">
          
          {/* ================= TAB 1: MAIN DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-7" id="dashboard-main-view">
              
              {/* 1. BALANCED WELCOME HERO CARD (TWO-COLUMN DESKTOP LAYOUT) */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 lg:p-8 border border-slate-200/80 shadow-xs" id="welcome-card">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Left Column: Title, description, actions */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f3ed] border border-emerald-200/60 text-[#2d6a4f] text-xs font-semibold" id="authenticated-session-badge">
                      <Sparkles className="w-3.5 h-3.5 text-[#2d6a4f]" />
                      Authenticated Session Active
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-900 tracking-tight">
                        Welcome to Sales Analysis Dashboard
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                        Comparative Sales Analysis of Stores, Customers and Demographics using Supabase and React.js
                      </p>
                    </div>

                    {/* Action buttons hierarchy */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      {/* Primary action */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('stores')}
                        id="welcome-stores-btn"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#23533e] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Stores Analysis</span>
                      </button>

                      {/* Secondary action */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('customers')}
                        id="welcome-customers-btn"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-slate-600" />
                        <span>Customer Data</span>
                      </button>

                      {/* AI Forecasting badge-style action */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('forecasting')}
                        id="welcome-forecasting-btn"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#e8f3ed] hover:bg-emerald-100 text-[#2d6a4f] border border-emerald-300/60 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>AI Forecasting</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Balanced welcome status panel */}
                  <div className="lg:col-span-4 bg-[#f8faf9] border border-slate-200/80 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Session Info
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2d6a4f]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Supabase
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        Welcome back, {userFullName} 👋
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Your sales analytics workspace is ready.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Status</span>
                      <span className="font-semibold text-emerald-700">Authenticated &amp; Ready</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* 2. KEY PERFORMANCE INDICATORS (4 CARDS ROW WITH NO FAKE DATA) */}
              <div className="space-y-3.5" id="kpi-section">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Key Performance Indicators
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-[11px] font-medium text-slate-500 shadow-2xs">
                    <Database className="w-3 h-3 text-[#2d6a4f]" />
                    <span>Data status: Ready</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5" id="kpi-cards-grid">
                  <KpiCard
                    id="kpi-total-sales"
                    title="Total Sales"
                    value="--"
                    description="Revenue generated"
                    statusText="No data"
                    icon={DollarSign}
                    iconBgColor="bg-[#e8f3ed]"
                    iconTextColor="text-[#2d6a4f]"
                  />

                  <KpiCard
                    id="kpi-total-orders"
                    title="Total Orders"
                    value="--"
                    description="Completed transactions"
                    statusText="No data"
                    icon={ShoppingCart}
                    iconBgColor="bg-blue-50"
                    iconTextColor="text-blue-600"
                  />

                  <KpiCard
                    id="kpi-total-customers"
                    title="Total Customers"
                    value="--"
                    description="Registered customers"
                    statusText="No data"
                    icon={Users}
                    iconBgColor="bg-purple-50"
                    iconTextColor="text-purple-600"
                  />

                  <KpiCard
                    id="kpi-active-stores"
                    title="Active Stores"
                    value="--"
                    description="Stores in dataset"
                    statusText="No data"
                    icon={Store}
                    iconBgColor="bg-amber-50"
                    iconTextColor="text-amber-600"
                  />
                </div>
              </div>

              {/* 3. QUICK ANALYSIS CARDS (EQUAL HEIGHT, SMOOTH HOVER) */}
              <div className="space-y-3.5" id="quick-analysis-section">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Quick Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" id="quick-analysis-grid">
                  <AnalysisCard
                    id="card-quick-stores"
                    title="Store-Wise Analysis"
                    description="Compare sales performance across different stores, branches and retail locations."
                    icon={Building2}
                    iconBgColor="bg-[#e8f3ed]"
                    iconTextColor="text-[#2d6a4f]"
                    accentHoverBorder="hover:border-[#2d6a4f]/50"
                    actionText="Open Analysis"
                    actionTextColor="text-[#2d6a4f]"
                    onClick={() => setActiveTab('stores')}
                  />

                  <AnalysisCard
                    id="card-quick-customers"
                    title="Customer Insights"
                    description="Evaluate purchasing behaviors, order frequency, and customer retention trends."
                    icon={Users}
                    iconBgColor="bg-blue-50"
                    iconTextColor="text-blue-600"
                    accentHoverBorder="hover:border-blue-400"
                    actionText="Open Insights"
                    actionTextColor="text-blue-600"
                    onClick={() => setActiveTab('customers')}
                  />

                  <AnalysisCard
                    id="card-quick-demographics"
                    title="Demographic Analysis"
                    description="Segment datasets across age groups, geographic territories, and demographic brackets."
                    icon={PieChart}
                    iconBgColor="bg-purple-50"
                    iconTextColor="text-purple-600"
                    accentHoverBorder="hover:border-purple-400"
                    actionText="Open Demographics"
                    actionTextColor="text-purple-600"
                    onClick={() => setActiveTab('demographics')}
                  />
                </div>
              </div>

              {/* 4. RESEARCH & AI INSIGHTS SECTION (B.TECH CSE RESEARCH MODULES) */}
              <div className="space-y-3.5" id="research-ai-section">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Research &amp; AI Insights
                  </h3>
                  <span className="text-[11px] font-semibold text-[#2d6a4f] bg-[#e8f3ed] px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    B.Tech CSE Project Modules
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" id="research-ai-grid">
                  <ResearchCard
                    id="card-ai-forecasting"
                    title="Sales Forecasting"
                    description="Predict future sales using historical sales patterns and time-series analysis."
                    badge="AI Forecasting"
                    badgeColor="bg-emerald-100 text-emerald-800"
                    icon={TrendingUp}
                    iconBgColor="bg-emerald-50"
                    iconTextColor="text-[#2d6a4f]"
                    accentHoverBorder="hover:border-[#2d6a4f]/50"
                    actionTextColor="text-[#2d6a4f]"
                    onClick={() => setActiveTab('forecasting')}
                  />

                  <ResearchCard
                    id="card-ml-segmentation"
                    title="Customer Segmentation"
                    description="Group customers based on purchasing behavior and demographic characteristics."
                    badge="Machine Learning"
                    badgeColor="bg-blue-100 text-blue-800"
                    icon={Layers}
                    iconBgColor="bg-blue-50"
                    iconTextColor="text-blue-600"
                    accentHoverBorder="hover:border-blue-400"
                    actionTextColor="text-blue-600"
                    onClick={() => setActiveTab('segmentation')}
                  />

                  <ResearchCard
                    id="card-analytics-anomalies"
                    title="Anomaly Detection"
                    description="Identify unusual sales patterns, unexpected spikes, and potential outlier transactions."
                    badge="Analytics"
                    badgeColor="bg-amber-100 text-amber-800"
                    icon={AlertTriangle}
                    iconBgColor="bg-amber-50"
                    iconTextColor="text-amber-600"
                    accentHoverBorder="hover:border-amber-400"
                    actionTextColor="text-amber-600"
                    onClick={() => setActiveTab('anomalies')}
                  />
                </div>
              </div>

              {/* 5. ANALYTICS OVERVIEW SECTION (POLISHED EMPTY STATES READY FOR LIVE DATA) */}
              <div className="space-y-3.5" id="analytics-overview-section">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Analytics Overview
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="analytics-overview-grid">
                  {/* Sales Trend */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#2d6a4f]" />
                        <h4 className="font-bold text-slate-900 text-sm">Sales Trend</h4>
                      </div>
                      <span className="text-[11px] text-slate-400">Time-series</span>
                    </div>

                    {/* Empty State */}
                    <div className="h-44 rounded-xl border border-dashed border-slate-200 bg-[#f8faf9] flex flex-col items-center justify-center p-6 text-center space-y-2">
                      <BarChart3 className="w-8 h-8 text-slate-300" />
                      <div className="text-xs font-bold text-slate-700">No sales data available yet</div>
                      <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                        Add sales records to generate analytics and time-series projections.
                      </p>
                    </div>
                  </div>

                  {/* Sales Distribution */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-purple-600" />
                        <h4 className="font-bold text-slate-900 text-sm">Sales Distribution</h4>
                      </div>
                      <span className="text-[11px] text-slate-400">Category breakdown</span>
                    </div>

                    {/* Empty State */}
                    <div className="h-44 rounded-xl border border-dashed border-slate-200 bg-[#f8faf9] flex flex-col items-center justify-center p-6 text-center space-y-2">
                      <PieChart className="w-8 h-8 text-slate-300" />
                      <div className="text-xs font-bold text-slate-700">No sales data available yet</div>
                      <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                        Configure store and demographic categories to visualize categorical distribution.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 2: STORES ================= */}
          {activeTab === 'stores' && (
            <div className="space-y-6" id="stores-tab">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8f3ed] text-[#2d6a4f] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <Building2 className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  Store Research Domain
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Comparative Store Performance</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Multi-branch sales distribution, revenue benchmarks, and store-wise transaction volume.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-slate-100 bg-[#f8faf9] space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Branch Outlets</span>
                    <h4 className="text-base font-bold text-slate-800">Regional Footprint</h4>
                    <p className="text-xs text-slate-500">North, South, Central &amp; Metro branches</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-[#f8faf9] space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Sales Metrics</span>
                    <h4 className="text-base font-bold text-slate-800">Transaction Index</h4>
                    <p className="text-xs text-slate-500">Peak shopping hours &amp; weekly trends</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-[#f8faf9] space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Growth Delta</span>
                    <h4 className="text-base font-bold text-slate-800">Comparative Growth</h4>
                    <p className="text-xs text-slate-500">Quarterly growth across retail units</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: CUSTOMERS ================= */}
          {activeTab === 'customers' && (
            <div className="space-y-6" id="customers-tab">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  Customer Research Domain
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Customer Behavior &amp; Segments</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Purchasing trends, basket sizes, recurring visits, and client retention patterns.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 rounded-xl border border-slate-100 bg-[#f8faf9] space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">Purchase Frequency</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Evaluate returning vs first-time shoppers to derive engagement metrics.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-slate-100 bg-[#f8faf9] space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">Average Order Value</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Analyze ticket sizes across different customer tiers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: DEMOGRAPHICS ================= */}
          {activeTab === 'demographics' && (
            <div className="space-y-6" id="demographics-tab">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <PieChart className="w-3.5 h-3.5 text-purple-600" />
                  Demographic Research Domain
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Demographic Segmentation</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Analyze customer populations based on age brackets, geographic territories, and socio-economic variables.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
                    <h4 className="font-bold text-purple-900 text-sm">Age Brackets</h4>
                    <p className="text-xs text-purple-800/80">Young adults, working professionals, and families.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
                    <h4 className="font-bold text-purple-900 text-sm">Geographic Clusters</h4>
                    <p className="text-xs text-purple-800/80">Urban centers, suburban areas, and regional zones.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
                    <h4 className="font-bold text-purple-900 text-sm">Preference Affinity</h4>
                    <p className="text-xs text-purple-800/80">Category preferences mapped against demographic profiles.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: REPORTS & ANALYTICS ================= */}
          {activeTab === 'reports' && (
            <div className="space-y-6" id="reports-tab">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8f3ed] text-[#2d6a4f] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  Analytics &amp; Reporting
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Comparative Research Reports</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Comprehensive analytical synthesis for academic and practical sales intelligence evaluation.
                </p>

                <div className="p-5 rounded-xl border border-slate-200 bg-[#f8faf9] space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">B.Tech CSE Project Deliverable</h4>
                    <span className="text-xs bg-emerald-100 text-[#2d6a4f] font-semibold px-2.5 py-0.5 rounded-full">
                      Phase Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Designed to demonstrate comparative analysis methodologies leveraging Supabase cloud authentication and responsive React component architectures.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 6: SALES FORECASTING (AI) ================= */}
          {activeTab === 'forecasting' && (
            <div className="space-y-6" id="forecasting-tab">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  Research Module • AI Forecasting
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Sales Forecasting Engine</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Predictive regression and ARIMA modeling for projecting store-level demand curves.
                </p>

                <div className="p-6 rounded-xl border border-dashed border-emerald-200 bg-[#f8faf9] text-center space-y-2">
                  <TrendingUp className="w-8 h-8 text-[#2d6a4f] mx-auto opacity-70" />
                  <h4 className="text-sm font-bold text-slate-800">Forecasting Model Pipeline Ready</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Once transaction records are accumulated in the Supabase database, predictive forecasts will compute historical regressions here.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 7: CUSTOMER SEGMENTATION (ML) ================= */}
          {activeTab === 'segmentation' && (
            <div className="space-y-6" id="segmentation-tab">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Research Module • Machine Learning
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Customer Segmentation (K-Means / RFM)</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Clustering shoppers into High-Value, Champions, At-Risk, and Occasional clusters based on Recency, Frequency, and Monetary scores.
                </p>

                <div className="p-6 rounded-xl border border-dashed border-blue-200 bg-[#f8faf9] text-center space-y-2">
                  <Layers className="w-8 h-8 text-blue-600 mx-auto opacity-70" />
                  <h4 className="text-sm font-bold text-slate-800">Segmentation Cluster Engine</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    K-Means clustering algorithm configured to segment purchase datasets into behavioral groups.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 8: ANOMALY DETECTION ================= */}
          {activeTab === 'anomalies' && (
            <div className="space-y-6" id="anomalies-tab">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Research Module • Outlier Detection
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Anomaly &amp; Outlier Detection</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Detecting unusual transaction spikes, irregular store returns, and stock deviation events.
                </p>

                <div className="p-6 rounded-xl border border-dashed border-amber-200 bg-[#f8faf9] text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto opacity-70" />
                  <h4 className="text-sm font-bold text-slate-800">Anomaly Scanner Active</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Statistical z-score and Isolation Forest outlier modules configured for sales data streams.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 9: SETTINGS ================= */}
          {activeTab === 'settings' && (
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
          )}

        </main>
      </div>
    </div>
  );
};
