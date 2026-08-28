import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Building2, Users, TrendingUp, ShieldCheck, Database, DollarSign, ShoppingCart, Store, PieChart, Layers, AlertTriangle, BarChart3 } from 'lucide-react';
import { KpiCard } from '../../components/KpiCard';
import { AnalysisCard } from '../../components/AnalysisCard';
import { ResearchCard } from '../../components/ResearchCard';
import { useAuth } from '../../context/AuthContext';

export const MainView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userFullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'hello';

  return (
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
              <button
                type="button"
                onClick={() => navigate('/dashboard/stores')}
                id="welcome-stores-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#23533e] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Stores Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard/customers')}
                id="welcome-customers-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-slate-600" />
                <span>Customer Data</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard/forecasting')}
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

      {/* 2. KEY PERFORMANCE INDICATORS */}
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

      {/* 3. QUICK ANALYSIS CARDS */}
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
            onClick={() => navigate('/dashboard/stores')}
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
            onClick={() => navigate('/dashboard/customers')}
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
            onClick={() => navigate('/dashboard/demographics')}
          />
        </div>
      </div>

      {/* 4. RESEARCH & AI INSIGHTS SECTION */}
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
            onClick={() => navigate('/dashboard/forecasting')}
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
            onClick={() => navigate('/dashboard/segmentation')}
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
            onClick={() => navigate('/dashboard/anomalies')}
          />
        </div>
      </div>

      {/* 5. ANALYTICS OVERVIEW SECTION */}
      <div className="space-y-3.5" id="analytics-overview-section">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Analytics Overview
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="analytics-overview-grid">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2d6a4f]" />
                <h4 className="font-bold text-slate-900 text-sm">Sales Trend</h4>
              </div>
              <span className="text-[11px] text-slate-400">Time-series</span>
            </div>

            <div className="h-44 rounded-xl border border-dashed border-slate-200 bg-[#f8faf9] flex flex-col items-center justify-center p-6 text-center space-y-2">
              <BarChart3 className="w-8 h-8 text-slate-300" />
              <div className="text-xs font-bold text-slate-700">No sales data available yet</div>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                Add sales records to generate analytics and time-series projections.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600" />
                <h4 className="font-bold text-slate-900 text-sm">Sales Distribution</h4>
              </div>
              <span className="text-[11px] text-slate-400">Category breakdown</span>
            </div>

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
  );
};
