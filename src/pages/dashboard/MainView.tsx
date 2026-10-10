import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Building2, Users, TrendingUp, ShieldCheck, Database, IndianRupee, ShoppingCart, Store, PieChart, Layers, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { KpiCard } from '../../components/KpiCard';
import { AnalysisCard } from '../../components/AnalysisCard';
import { ResearchCard } from '../../components/ResearchCard';
import { DateRangePicker, DateRangePreset } from '../../components/DateRangePicker';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const MainView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userFullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';

  const [kpis, setKpis] = useState({ 
    sales: 0, orders: 0, customers: 0, stores: 0, avgOrderValue: 0,
    trends: { sales: 0, orders: 0, customers: 0, aov: 0, show: false }
  });
  const [loading, setLoading] = useState(true);
  const [currentRange, setCurrentRange] = useState({
    preset: 'all',
    label: 'All Time (Full Dataset)',
    startDate: '2000-01-01',
    endDate: '2099-12-31'
  });

  const fetchKpis = async () => {
    setLoading(true);
    try {
      let currentSales = 0;
      let currentOrders = 0;
      let currentCustomers = 0;
      let currentStores = 0;
      let currentAov = 0;

      // 1. Fetch current period via RPC
      const { data, error } = await supabase.rpc('get_kpis', { 
        start_date: currentRange.startDate, 
        end_date: currentRange.endDate 
      });

      if (!error && data && data.length > 0 && (Number(data[0].total_orders) > 0 || Number(data[0].total_stores) > 0)) {
        currentSales = Number(data[0].total_sales) || 0;
        currentOrders = Number(data[0].total_orders) || 0;
        currentCustomers = Number(data[0].total_customers) || 0;
        currentStores = Number(data[0].total_stores) || 0;
        currentAov = Number(data[0].avg_order_value) || 0;
      } else if (user?.id) {
        // Direct multi-tenant query fallback strictly scoped to authenticated user
        let txQ = supabase
          .from('sales_transactions')
          .select('id, total_amount, customer_id, store_id')
          .eq('owner_id', user.id);

        if (currentRange.preset !== 'all') {
          txQ = txQ
            .gte('transaction_date', `${currentRange.startDate}T00:00:00.000Z`)
            .lte('transaction_date', `${currentRange.endDate}T23:59:59.999Z`);
        }

        const [txRes, custRes, storeRes] = await Promise.all([
          txQ,
          supabase.from('customers').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
          supabase.from('stores').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
        ]);

        if (txRes.data) {
          currentOrders = txRes.data.length;
          currentSales = txRes.data.reduce((sum: number, t: any) => sum + (Number(t.total_amount) || 0), 0);
          currentAov = currentOrders > 0 ? currentSales / currentOrders : 0;
        }
        currentCustomers = custRes.count || 0;
        currentStores = storeRes.count || 0;
      }
      
      // 2. Fetch previous period for trend calculation
      let prevData = null;
      if (currentRange.preset !== 'all') {
        const start = new Date(currentRange.startDate);
        const end = new Date(currentRange.endDate);
        const diffDays = Math.round(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        const prevEnd = new Date(start);
        prevEnd.setDate(prevEnd.getDate() - 1);
        
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - diffDays + 1);

        const { data: pData } = await supabase.rpc('get_kpis', { 
          start_date: prevStart.toISOString().split('T')[0], 
          end_date: prevEnd.toISOString().split('T')[0]
        });
        prevData = pData;
      }
      
      let salesTrend = 0;
      let ordersTrend = 0;
      let customersTrend = 0;
      let aovTrend = 0;

      if (prevData && prevData.length > 0) {
        const prevSales = Number(prevData[0].total_sales) || 0;
        const prevOrders = Number(prevData[0].total_orders) || 0;
        const prevCustomers = Number(prevData[0].total_customers) || 0;
        const prevAov = Number(prevData[0].avg_order_value) || 0;

        salesTrend = prevSales > 0 ? ((currentSales - prevSales) / prevSales) * 100 : (currentSales > 0 ? 100 : 0);
        ordersTrend = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : (currentOrders > 0 ? 100 : 0);
        customersTrend = prevCustomers > 0 ? ((currentCustomers - prevCustomers) / prevCustomers) * 100 : (currentCustomers > 0 ? 100 : 0);
        aovTrend = currentAov - prevAov; // Absolute dollar amount for AOV trend
      }

      setKpis({
        sales: currentSales,
        orders: currentOrders,
        customers: currentCustomers,
        stores: currentStores,
        avgOrderValue: currentAov,
        trends: {
          sales: salesTrend,
          orders: ordersTrend,
          customers: customersTrend,
          aov: aovTrend,
          show: currentRange.preset !== 'all' && (salesTrend !== 0 || ordersTrend !== 0 || customersTrend !== 0 || aovTrend !== 0)
        }
      });
    } catch (err) {
      console.error('Error fetching KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchKpis();
    }
  }, [user, currentRange]);

  const formatCurrency = (val: number, fractionDigits: number = 0) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits 
    }).format(val || 0);

  const formatTrendPct = (val: number) => {
    if (val === 0) return undefined;
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  const formatTrendAbs = (val: number) => {
    if (val === 0) return undefined;
    const sign = val > 0 ? '+' : '-';
    return `${sign}${formatCurrency(Math.abs(val), 2)}`;
  };

  return (
    <div className="space-y-7" id="dashboard-main-view">
      
      {/* 1. BALANCED WELCOME HERO CARD */}
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
                onClick={() => navigate('/dashboard/import')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>Import Data</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard/stores')}
                id="welcome-stores-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-slate-600" />
                <span>Stores Analysis</span>
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
                Supabase Connected
              </span>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900">
                Welcome back, {userFullName} 👋
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Your live database connection is active.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Database Status</span>
              <span className="font-semibold text-emerald-700">Online</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. EXECUTIVE PERFORMANCE OVERVIEW & KPIs */}
      <div className="space-y-4" id="kpi-section">
        {/* Header Panel with Date Picker */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Executive Performance Overview
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Querying get_kpis() and active transactions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchKpis}
              disabled={loading}
              className="inline-flex items-center gap-1.5 p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <DateRangePicker 
              currentRange={currentRange as any} 
              onChange={(range) => setCurrentRange(range as any)} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5" id="kpi-cards-grid">
          <KpiCard
            id="kpi-total-sales"
            title="Total Sales"
            value={loading ? '...' : formatCurrency(kpis.sales)}
            description="Net revenue in period"
            icon={IndianRupee}
            iconBgColor="bg-emerald-50"
            iconTextColor="text-emerald-600"
            trend={kpis.trends.show ? formatTrendPct(kpis.trends.sales) : undefined}
            trendDirection={kpis.trends.sales >= 0 ? 'up' : 'down'}
          />

          <KpiCard
            id="kpi-total-orders"
            title="Total Orders"
            value={loading ? '...' : kpis.orders.toLocaleString()}
            description="Completed transactions"
            icon={ShoppingCart}
            iconBgColor="bg-indigo-50"
            iconTextColor="text-indigo-600"
            trend={kpis.trends.show ? formatTrendPct(kpis.trends.orders) : undefined}
            trendDirection={kpis.trends.orders >= 0 ? 'up' : 'down'}
          />

          <KpiCard
            id="kpi-avg-order-value"
            title="Avg Order Value"
            value={loading ? '...' : formatCurrency(kpis.avgOrderValue, 2)}
            description="Basket size per checkout"
            icon={TrendingUp}
            iconBgColor="bg-sky-50"
            iconTextColor="text-sky-600"
            trend={kpis.trends.show ? formatTrendAbs(kpis.trends.aov) : undefined}
            trendDirection={kpis.trends.aov >= 0 ? 'up' : 'down'}
          />

          <KpiCard
            id="kpi-total-customers"
            title="Total Customers"
            value={loading ? '...' : kpis.customers.toLocaleString()}
            description={`Across ${kpis.stores || 0} stores`}
            icon={Users}
            iconBgColor="bg-fuchsia-50"
            iconTextColor="text-fuchsia-600"
            trend={kpis.trends.show ? formatTrendPct(kpis.trends.customers) : undefined}
            trendDirection={kpis.trends.customers >= 0 ? 'up' : 'down'}
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
