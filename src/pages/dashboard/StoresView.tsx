import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Store,
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  PlusCircle,
  LayoutGrid,
  Table as TableIcon,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ExternalLink,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Percent,
  Clock,
  UserCheck,
  Globe
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { DateRangePicker, DateRange } from '../../components/DateRangePicker';
import { StoreRecord, StorePerformanceMetric } from '../../types';

// Theme tokens
const BRAND_GREEN = '#2d6a4f';
const LIGHT_GREEN = '#e8f3ed';
const ACCENT_MINT = '#52b788';
const PALETTE = ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#d8f3dc'];

export const StoresView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // -------------------------------------------------------------
  // Filter & Control States
  // -------------------------------------------------------------
  const [dateRange, setDateRange] = useState<DateRange>({
    preset: 'all',
    label: 'All Time (Full Dataset)',
    startDate: '2000-01-01',
    endDate: '2099-12-31',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'revenue_desc' | 'revenue_asc' | 'orders_desc' | 'name_asc' | 'code_asc'>('revenue_desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'overview' | 'regions' | 'formats' | 'monthly'>('overview');

  // Modal / Detail state
  const [selectedStore, setSelectedStore] = useState<StorePerformanceMetric | null>(null);

  // Data Loading & State
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [transactions, setTransactions] = useState<Array<{
    id: number;
    store_id: number;
    total_amount: number;
    transaction_date: string;
    status: string;
  }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Data Fetching Logic
  // -------------------------------------------------------------
  const loadStoreData = useCallback(async (isRefreshAction = false) => {
    if (!user) return;

    if (isRefreshAction) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      // 1. Fetch stores (strictly scoped to authenticated user)
      let storesQuery = supabase
        .from('stores')
        .select('*')
        .order('store_name', { ascending: true });

      if (user?.id) {
        storesQuery = storesQuery.eq('owner_id', user.id);
      }

      const { data: storesData, error: storesError } = await storesQuery;

      if (storesError) {
        throw new Error(`Failed to load stores: ${storesError.message}`);
      }

      // 2. Fetch completed transactions for the specified date window (strictly scoped to authenticated user)
      let txQuery = supabase
        .from('sales_transactions')
        .select('id, store_id, total_amount, transaction_date, status');

      if (user?.id) {
        txQuery = txQuery.eq('owner_id', user.id);
      }

      if (dateRange.preset !== 'all') {
        txQuery = txQuery
          .gte('transaction_date', `${dateRange.startDate}T00:00:00.000Z`)
          .lte('transaction_date', `${dateRange.endDate}T23:59:59.999Z`);
      }

      const { data: txData, error: txError } = await txQuery;

      if (txError) {
        throw new Error(`Failed to load sales transactions: ${txError.message}`);
      }

      setStores(storesData || []);
      setTransactions(txData || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred while querying the database.';
      console.error('StoresView fetch error:', err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    loadStoreData(false);
  }, [loadStoreData]);

  // Keyboard shortcut (Escape) to close detail modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStore) {
        setSelectedStore(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStore]);

  // -------------------------------------------------------------
  // Formatting Utilities
  // -------------------------------------------------------------
  const formatCurrency = useCallback((val: number, fractionDigits = 0): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(val || 0);
  }, []);

  const formatDate = useCallback((dateStr: string | null): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }, []);

  // -------------------------------------------------------------
  // Aggregated Data Computations
  // -------------------------------------------------------------
  const {
    totalRevenue,
    totalOrders,
    overallAov,
    enrichedStores,
    regionStats,
    formatStats,
    monthlyTimeline,
    momGrowthPct,
    uniqueRegionsCount,
    activeStoresCount,
    inactiveStoresCount,
    activeStorePercentage,
    availableRegions,
    availableFormats,
  } = useMemo(() => {
    let rev = 0;
    let ordersCount = 0;
    const storeAggMap = new Map<number, { sales: number; orders: number; monthly: Record<string, number> }>();
    const monthMap = new Map<string, { month: string; sales: number; orders: number }>();

    // Build set of valid user store IDs & codes to prevent cross-tenant or mismatched transactions
    const validStoreIds = new Set(stores.map((s) => s.id));
    const validStoreCodes = new Map<string, number>();
    stores.forEach((s) => {
      if (s.store_code) {
        validStoreCodes.set(s.store_code.trim().toLowerCase(), s.id);
      }
    });

    transactions.forEach((tx) => {
      if (tx.status && ['cancelled', 'canceled', 'refunded'].includes(tx.status.toLowerCase())) {
        return;
      }

      // Validate store ownership
      let matchedStoreId: number | undefined;
      const numSid = Number(tx.store_id);
      if (validStoreIds.has(numSid)) {
        matchedStoreId = numSid;
      } else if (tx.store_id && validStoreCodes.has(String(tx.store_id).trim().toLowerCase())) {
        matchedStoreId = validStoreCodes.get(String(tx.store_id).trim().toLowerCase());
      }

      // If transaction does not belong to any store of the current user, skip it!
      if (!matchedStoreId) return;

      const amount = Number(tx.total_amount) || 0;
      rev += amount;
      ordersCount += 1;

      // By store
      const sAgg = storeAggMap.get(matchedStoreId) || { sales: 0, orders: 0, monthly: {} };
      sAgg.sales += amount;
      sAgg.orders += 1;

      // By month
      if (tx.transaction_date) {
        const mKey = tx.transaction_date.substring(0, 7); // 'YYYY-MM'
        sAgg.monthly[mKey] = (sAgg.monthly[mKey] || 0) + amount;

        const mAgg = monthMap.get(mKey) || { month: mKey, sales: 0, orders: 0 };
        mAgg.sales += amount;
        mAgg.orders += 1;
        monthMap.set(mKey, mAgg);
      }

      storeAggMap.set(matchedStoreId, sAgg);
    });

    const calculatedAov = ordersCount > 0 ? rev / ordersCount : 0;

    // Enriched stores list
    const enriched: StorePerformanceMetric[] = stores.map((store) => {
      const agg = storeAggMap.get(store.id);
      const storeSales = agg ? agg.sales : 0;
      const storeOrders = agg ? agg.orders : 0;
      const storeAov = storeOrders > 0 ? storeSales / storeOrders : 0;
      const sharePct = rev > 0 ? (storeSales / rev) * 100 : 0;

      return {
        ...store,
        total_sales: storeSales,
        total_orders: storeOrders,
        avg_order_value: storeAov,
        sales_share_pct: sharePct,
      };
    });

    // Sort descending by sales for initial ranking
    enriched.sort((a, b) => b.total_sales - a.total_sales);
    enriched.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Active & Inactive counts
    const activeCount = stores.filter((s) => s.is_active).length;
    const inactiveCount = stores.length - activeCount;
    const activePct = stores.length > 0 ? (activeCount / stores.length) * 100 : 0;

    // Regions list & stats
    const regionMap = new Map<string, { region: string; sales: number; orders: number; storeCount: number; activeCount: number }>();
    enriched.forEach((s) => {
      const r = s.region?.trim() || 'Unassigned';
      const existing = regionMap.get(r) || { region: r, sales: 0, orders: 0, storeCount: 0, activeCount: 0 };
      existing.sales += s.total_sales;
      existing.orders += s.total_orders;
      existing.storeCount += 1;
      if (s.is_active) existing.activeCount += 1;
      regionMap.set(r, existing);
    });

    const regionsList = Array.from(regionMap.values()).map((r) => ({
      ...r,
      revenueShare: rev > 0 ? (r.sales / rev) * 100 : 0,
      aov: r.orders > 0 ? r.sales / r.orders : 0,
    })).sort((a, b) => b.sales - a.sales);

    // Format / Store Type stats
    const formatMap = new Map<string, { format: string; sales: number; orders: number; storeCount: number }>();
    enriched.forEach((s) => {
      const f = s.store_type?.trim() || 'Standard';
      const existing = formatMap.get(f) || { format: f, sales: 0, orders: 0, storeCount: 0 };
      existing.sales += s.total_sales;
      existing.orders += s.total_orders;
      existing.storeCount += 1;
      formatMap.set(f, existing);
    });

    const formatsList = Array.from(formatMap.values()).map((f) => ({
      ...f,
      avgSalesPerStore: f.storeCount > 0 ? f.sales / f.storeCount : 0,
      revenueShare: rev > 0 ? (f.sales / rev) * 100 : 0,
      aov: f.orders > 0 ? f.sales / f.orders : 0,
    })).sort((a, b) => b.sales - a.sales);

    // Monthly Timeline & MoM
    const sortedMonths = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    const formattedTimeline = sortedMonths.map((m) => {
      const [year, monthNum] = m.month.split('-');
      const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const displayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return {
        key: m.month,
        month: displayLabel,
        sales: m.sales,
        orders: m.orders,
      };
    });

    let mom: number | null = null;
    if (sortedMonths.length >= 2) {
      const latest = sortedMonths[sortedMonths.length - 1].sales;
      const previous = sortedMonths[sortedMonths.length - 2].sales;
      if (previous > 0) {
        mom = ((latest - previous) / previous) * 100;
      }
    }

    // Available filter sets
    const distinctRegions = Array.from(new Set(stores.map((s) => s.region).filter(Boolean) as string[])).sort();
    const distinctFormats = Array.from(new Set(stores.map((s) => s.store_type).filter(Boolean) as string[])).sort();

    return {
      totalRevenue: rev,
      totalOrders: ordersCount,
      overallAov: calculatedAov,
      enrichedStores: enriched,
      regionStats: regionsList,
      formatStats: formatsList,
      monthlyTimeline: formattedTimeline,
      momGrowthPct: mom,
      uniqueRegionsCount: distinctRegions.length,
      activeStoresCount: activeCount,
      inactiveStoresCount: inactiveCount,
      activeStorePercentage: activePct,
      availableRegions: distinctRegions,
      availableFormats: distinctFormats,
    };
  }, [stores, transactions]);

  // -------------------------------------------------------------
  // Filtered & Sorted Stores List
  // -------------------------------------------------------------
  const filteredStores = useMemo(() => {
    return enrichedStores.filter((store) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = store.store_name?.toLowerCase().includes(q);
        const matchCode = store.store_code?.toLowerCase().includes(q);
        const matchManager = store.manager_name?.toLowerCase().includes(q);
        const matchCity = store.city?.toLowerCase().includes(q);
        const matchState = store.state?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchManager && !matchCity && !matchState) {
          return false;
        }
      }

      // Region
      if (selectedRegion !== 'all') {
        if ((store.region || 'Unassigned') !== selectedRegion) return false;
      }

      // Format
      if (selectedFormat !== 'all') {
        if ((store.store_type || 'Standard') !== selectedFormat) return false;
      }

      // Status
      if (selectedStatus === 'active' && !store.is_active) return false;
      if (selectedStatus === 'inactive' && store.is_active) return false;

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'revenue_desc':
          return b.total_sales - a.total_sales;
        case 'revenue_asc':
          return a.total_sales - b.total_sales;
        case 'orders_desc':
          return b.total_orders - a.total_orders;
        case 'name_asc':
          return a.store_name.localeCompare(b.store_name);
        case 'code_asc':
          return a.store_code.localeCompare(b.store_code);
        default:
          return 0;
      }
    });
  }, [enrichedStores, searchQuery, selectedRegion, selectedFormat, selectedStatus, sortBy]);

  // Reset filters handler
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRegion('all');
    setSelectedFormat('all');
    setSelectedStatus('all');
    setSortBy('revenue_desc');
  }, []);

  const hasActiveFilters = searchQuery !== '' || selectedRegion !== 'all' || selectedFormat !== 'all' || selectedStatus !== 'all';

  // -------------------------------------------------------------
  // CSV Export Utility (Standard Compliant with Quoting)
  // -------------------------------------------------------------
  const handleExportCSV = useCallback(() => {
    if (filteredStores.length === 0) return;

    const headers = [
      'Store Code',
      'Store Name',
      'Status',
      'Store Type',
      'Region',
      'City',
      'State',
      'Manager',
      'Opening Date',
      'Net Sales Revenue (₹)',
      'Total Orders',
      'Average Order Value (₹)',
      'Brand Revenue Share (%)'
    ];

    const escapeCSV = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const rows = filteredStores.map((s) => [
      escapeCSV(s.store_code),
      escapeCSV(s.store_name),
      escapeCSV(s.is_active ? 'Active' : 'Inactive'),
      escapeCSV(s.store_type || 'Standard'),
      escapeCSV(s.region || 'Unassigned'),
      escapeCSV(s.city || 'N/A'),
      escapeCSV(s.state || 'N/A'),
      escapeCSV(s.manager_name || 'Unassigned'),
      escapeCSV(s.opening_date || 'N/A'),
      escapeCSV(s.total_sales.toFixed(2)),
      escapeCSV(s.total_orders),
      escapeCSV(s.avg_order_value.toFixed(2)),
      escapeCSV(`${s.sales_share_pct.toFixed(2)}%`)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `retailmax_stores_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredStores]);

  // Top 5 stores for chart visualization
  const top10ChartData = useMemo(() => {
    return enrichedStores.slice(0, 8).map((s) => ({
      name: s.store_name.length > 16 ? `${s.store_name.slice(0, 14)}...` : s.store_name,
      fullName: s.store_name,
      revenue: s.total_sales,
      orders: s.total_orders,
      format: s.store_type || 'Standard',
      region: s.region || 'Unassigned',
    }));
  }, [enrichedStores]);

  // Top 3 Stores & Attention Needed
  const topPerformers = useMemo(() => enrichedStores.slice(0, 3), [enrichedStores]);
  const bottomPerformers = useMemo(() => {
    if (enrichedStores.length <= 3) return [];
    return enrichedStores
      .filter((s) => s.is_active)
      .slice(-3)
      .reverse();
  }, [enrichedStores]);

  // Store Monthly Data (for modal inspection)
  const selectedStoreMonthly = useMemo(() => {
    if (!selectedStore) return [];
    const monthlyMap: Record<string, number> = {};

    transactions
      .filter((tx) => tx.store_id === selectedStore.id)
      .forEach((tx) => {
        if (tx.transaction_date) {
          const mKey = tx.transaction_date.substring(0, 7);
          monthlyMap[mKey] = (monthlyMap[mKey] || 0) + (Number(tx.total_amount) || 0);
        }
      });

    return Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mKey, amount]) => {
        const [year, monthNum] = mKey.split('-');
        const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return {
          month: dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: amount,
        };
      });
  }, [selectedStore, transactions]);

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  return (
    <div className="space-y-7 pb-16" id="stores-performance-view">
      
      {/* ========================================================= */}
      {/* 1. HEADER & EXECUTIVE CONTROL BAR                          */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-[0_2px_14px_-4px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f3ed] text-[#2d6a4f] text-[11px] font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-[#2d6a4f]" />
              Enterprise Store Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Stores Performance &amp; Branch Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl font-normal leading-relaxed">
              Multi-branch retail revenue benchmarks, regional coverage distribution, store format comparisons, and granular store diagnostics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Date Range Filter */}
            <DateRangePicker
              currentRange={dateRange}
              onChange={(newRange) => setDateRange(newRange)}
            />

            {/* Refresh Data */}
            <button
              onClick={() => loadStoreData(true)}
              disabled={loading || isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs disabled:opacity-50"
              title="Refresh database records"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${isRefreshing ? 'animate-spin text-[#2d6a4f]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              disabled={filteredStores.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs disabled:opacity-40"
              title="Export current filtered view to CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Navigate to Data Import */}
            <button
              onClick={() => navigate('/dashboard/import')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] hover:bg-[#245640] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Import Stores</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ERROR ALERT BANNER (IF QUERY FAILS)                       */}
      {/* ========================================================= */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-900">Database Query Error</h4>
              <p className="text-xs text-rose-700 font-medium leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => loadStoreData(false)}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg transition-colors shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. EXECUTIVE KPI OVERVIEW (6 KEY BUSINESS METRICS)        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Stores */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Stores</span>
            <div className="w-8 h-8 rounded-xl bg-[#e8f3ed] text-[#2d6a4f] flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {loading ? '...' : stores.length.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {stores.length === 0 ? 'No stores configured' : `${activeStoresCount} active · ${inactiveStoresCount} inactive`}
            </p>
          </div>
        </div>

        {/* KPI 2: Active Store Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {loading ? '...' : `${activeStorePercentage.toFixed(1)}%`}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-slate-500 truncate">
                {activeStoresCount} stores operational
              </p>
            </div>
          </div>
        </div>

        {/* KPI 3: Total Sales Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Period Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight truncate">
              {loading ? '...' : formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {transactions.length === 0 && !loading ? 'No sales in window' : `Net completed revenue`}
            </p>
          </div>
        </div>

        {/* KPI 4: Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Orders</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {loading ? '...' : totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Total checkout receipts
            </p>
          </div>
        </div>

        {/* KPI 5: Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Order Value</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight truncate">
              {loading ? '...' : formatCurrency(overallAov, 2)}
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Basket size per order
            </p>
          </div>
        </div>

        {/* KPI 6: Regions Covered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Territories</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {loading ? '...' : uniqueRegionsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Geographic regions
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PERFORMANCE HIGHLIGHTS (TOP PERFORMERS & ATTENTION)    */}
      {/* ========================================================= */}
      {!loading && stores.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Top Outlets Spotlight */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Top Performing Outlets
                  </h3>
                  <p className="text-xs text-slate-500">Highest grossing retail stores in the selected timeframe</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400">Ranked by revenue</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              {topPerformers.map((st, idx) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStore(st)}
                  className="group relative p-4 rounded-2xl border border-slate-200/80 hover:border-[#2d6a4f] bg-slate-50/50 hover:bg-emerald-50/20 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                      idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                      idx === 1 ? 'bg-slate-300 text-slate-800' :
                      'bg-amber-700/30 text-amber-900'
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {st.store_code}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#2d6a4f] transition-colors truncate">
                      {st.store_name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {st.city || st.region || 'Unknown Location'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sales</span>
                      <span className="text-base font-black text-slate-900">
                        {formatCurrency(st.total_sales)}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#2d6a4f] bg-[#e8f3ed] px-2 py-0.5 rounded-md">
                      {st.sales_share_pct.toFixed(1)}% share
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Underperforming or Attention Needed */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Attention Required
                  </h3>
                  <p className="text-xs text-slate-500">Branches with lowest sales volume</p>
                </div>
              </div>

              <div className="space-y-2.5 mt-4">
                {bottomPerformers.length > 0 ? (
                  bottomPerformers.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStore(st)}
                      className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/50 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate">{st.store_name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{st.region || 'Unassigned'} · {st.manager_name || 'No manager'}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-slate-700">
                          {formatCurrency(st.total_sales)}
                        </div>
                        <div className="text-[10px] font-semibold text-rose-600">
                          {st.total_orders} orders
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                    All operating stores showing strong transaction activity.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Inactive Branches:</span>
              <span className="font-bold text-slate-700">{inactiveStoresCount} locations</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. VISUAL ANALYTICS & BENCHMARKING SUITE                 */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Comparative Performance Visualizations
            </h3>
            <p className="text-xs text-slate-500">
              Deep-dive into branch rankings, territorial sales footprints, store-type yields, and timeline trajectories.
            </p>
          </div>

          {/* Navigation Tabs for Visualizations */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setActiveAnalyticsTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeAnalyticsTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#2d6a4f]" />
              Store Rankings
            </button>
            <button
              onClick={() => setActiveAnalyticsTab('regions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeAnalyticsTab === 'regions'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Regional Yield
            </button>
            <button
              onClick={() => setActiveAnalyticsTab('formats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeAnalyticsTab === 'formats'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              Store Formats
            </button>
            <button
              onClick={() => setActiveAnalyticsTab('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeAnalyticsTab === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              Monthly Trajectory
            </button>
          </div>
        </div>

        {/* TAB 1: STORE RANKINGS */}
        {activeAnalyticsTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Top 8 Retail Branches by Total Sales Revenue</span>
              <span>Values in INR (₹)</span>
            </div>
            {top10ChartData.length > 0 ? (
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10ChartData} margin={{ top: 10, right: 20, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), 'Net Sales']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="revenue" fill={BRAND_GREEN} radius={[8, 8, 0, 0]} maxBarSize={45}>
                      {top10ChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-sm">
                No revenue records found for this timeframe.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGIONAL YIELD */}
        {activeAnalyticsTab === 'regions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Regional Sales Distribution</h4>
              <p className="text-xs text-slate-500 mb-4">
                Comparison of sales volume against store deployment across regions.
              </p>
              <div className="space-y-3">
                {regionStats.map((reg) => (
                  <div key={reg.region} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{reg.region}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {reg.storeCount} stores
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {reg.orders.toLocaleString()} orders · AOV: {formatCurrency(reg.aov, 2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">{formatCurrency(reg.sales)}</div>
                      <span className="text-[11px] font-bold text-[#2d6a4f]">{reg.revenueShare.toFixed(1)}% of total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Pie / Donut Chart */}
            <div className="h-72 w-full flex items-center justify-center">
              {regionStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionStats}
                      dataKey="sales"
                      nameKey="region"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {regionStats.map((_, index) => (
                        <Cell key={`cell-reg-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-xs">No regional records available.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: STORE FORMATS */}
        {activeAnalyticsTab === 'formats' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Performance Benchmarking by Store Format</span>
              <span>Yield per store location</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formatStats.map((fmt) => (
                <div key={fmt.format} className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Store Format</span>
                      <h4 className="text-lg font-black text-slate-900">{fmt.format}</h4>
                    </div>
                    <span className="text-xs font-bold text-[#2d6a4f] bg-[#e8f3ed] px-2.5 py-1 rounded-lg">
                      {fmt.storeCount} Outlets
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Total Format Revenue:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(fmt.sales)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Revenue per Outlet:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(fmt.avgSalesPerStore)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Avg Checkout Ticket:</span>
                      <span className="font-bold text-[#2d6a4f]">{formatCurrency(fmt.aov, 2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Brand Share:</span>
                      <span className="font-bold text-slate-700">{fmt.revenueShare.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MONTHLY TRAJECTORY */}
        {activeAnalyticsTab === 'monthly' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Historical Monthly Sales Trajectory</span>
                {momGrowthPct !== null && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold ${
                    momGrowthPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {momGrowthPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {momGrowthPct >= 0 ? '+' : ''}{momGrowthPct.toFixed(1)}% MoM Growth
                  </span>
                )}
              </div>
              <span>Monthly aggregation across all operational branches</span>
            </div>

            {monthlyTimeline.length > 0 ? (
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTimeline} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorStoreSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND_GREEN} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={BRAND_GREEN} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), 'Monthly Sales']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={BRAND_GREEN}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorStoreSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-sm">
                Insufficient multi-month transaction history in this date window.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 5. STORE DIRECTORY & MANAGEMENT TOOLBAR                   */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Retail Branch Directory
            </h3>
            <p className="text-xs text-slate-500">
              Filter by location, format, status, and rank branch locations by revenue productivity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher: Table vs Grid */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid Cards View"
                aria-label="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Filters Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store name, code, manager, city..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Filter */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2d6a4f]"
            >
              <option value="all">All Regions ({uniqueRegionsCount})</option>
              {availableRegions.map((reg) => (
                <option key={reg} value={reg}>Region: {reg}</option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2d6a4f]"
            >
              <option value="all">All Formats ({availableFormats.length})</option>
              {availableFormats.map((fmt) => (
                <option key={fmt} value={fmt}>Format: {fmt}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2d6a4f]"
            >
              <option value="all">All Status ({stores.length})</option>
              <option value="active">Active Only ({activeStoresCount})</option>
              <option value="inactive">Inactive Only ({inactiveStoresCount})</option>
            </select>
          </div>
        </div>

        {/* Counter & Sort By Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredStores.length}</span> of {stores.length} stores
            {hasActiveFilters && <span className="text-[#2d6a4f] font-semibold ml-1.5">(Filtered)</span>}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2d6a4f]"
            >
              <option value="revenue_desc">Revenue: Highest First</option>
              <option value="revenue_asc">Revenue: Lowest First</option>
              <option value="orders_desc">Orders Volume: High to Low</option>
              <option value="name_asc">Store Name: A to Z</option>
              <option value="code_asc">Store Code: A to Z</option>
            </select>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW MODE: TABLE VIEW                                     */}
        {/* ========================================================= */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Store Outlet</th>
                  <th className="py-3.5 px-4">Territory</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">Branch Manager</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Orders</th>
                  <th className="py-3.5 px-4 text-right">Avg Order</th>
                  <th className="py-3.5 px-4 text-right">Net Revenue</th>
                  <th className="py-3.5 px-4 w-28 text-center">Contribution</th>
                  <th className="py-3.5 px-4 w-16 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStores.map((st) => (
                  <tr
                    key={st.id}
                    onClick={() => setSelectedStore(st)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {st.rank}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 group-hover:text-[#2d6a4f] transition-colors">
                        {st.store_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {st.store_code}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold">{st.region || 'Unassigned'}</div>
                      <div className="text-[11px] text-slate-400">{st.city ? `${st.city}, ${st.state || ''}` : 'Location unlisted'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {st.store_type || 'Standard'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {st.manager_name || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.is_active ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                        {st.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      {st.total_orders.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {formatCurrency(st.avg_order_value, 2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatCurrency(st.total_sales)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2d6a4f] rounded-full"
                            style={{ width: `${Math.min(100, st.sales_share_pct)}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 w-9 text-right">
                          {st.sales_share_pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStore(st);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-[#2d6a4f] transition-colors"
                        title="View Detailed Store Analytics"
                        aria-label={`Inspect ${st.store_name}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW MODE: GRID VIEW                                      */}
        {/* ========================================================= */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStores.map((st) => (
              <div
                key={st.id}
                onClick={() => setSelectedStore(st)}
                className="group p-5 rounded-2xl border border-slate-200/90 hover:border-[#2d6a4f] bg-white hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {st.store_code}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      st.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.is_active ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                      {st.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-base group-hover:text-[#2d6a4f] transition-colors truncate">
                    {st.store_name}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {st.city ? `${st.city}, ${st.state || ''}` : 'Location unlisted'} · {st.region || 'Unassigned'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Revenue</span>
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrency(st.total_sales)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Orders / AOV</span>
                    <span className="text-sm font-bold text-slate-800">
                      {st.total_orders} <span className="text-xs font-normal text-slate-400">({formatCurrency(st.avg_order_value, 0)})</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-400 font-medium">Mgr:</span>
                    <span className="font-semibold text-slate-700 truncate">{st.manager_name || 'Unassigned'}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#2d6a4f] bg-[#e8f3ed] px-2 py-0.5 rounded-md shrink-0">
                    {st.sales_share_pct.toFixed(1)}% share
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ZERO RESULTS FILTER STATE */}
        {filteredStores.length === 0 && !loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No stores match your search criteria</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your query, clearing regional/format filters, or expanding the date window.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white text-xs font-bold rounded-xl hover:bg-[#245640] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 6. INTERACTIVE STORE DETAIL MODAL / DRAWER                */}
      {/* ========================================================= */}
      {selectedStore && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedStore(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="store-detail-title"
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {selectedStore.store_code}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedStore.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedStore.is_active ? 'Active Outlet' : 'Inactive'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {selectedStore.store_type || 'Standard Format'}
                  </span>
                </div>
                <h2 id="store-detail-title" className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {selectedStore.store_name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedStore(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#e8f3ed]/60 border border-[#2d6a4f]/20">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Net Revenue</span>
                <span className="text-base font-black text-[#2d6a4f] mt-0.5 block">
                  {formatCurrency(selectedStore.total_sales)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Transactions</span>
                <span className="text-base font-black text-blue-900 mt-0.5 block">
                  {selectedStore.total_orders.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avg Ticket</span>
                <span className="text-base font-black text-amber-900 mt-0.5 block">
                  {formatCurrency(selectedStore.avg_order_value, 2)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Brand Share</span>
                <span className="text-base font-black text-purple-900 mt-0.5 block">
                  {selectedStore.sales_share_pct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Store Metadata Details Grid */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch Details &amp; Governance</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Location:</strong> {selectedStore.city || 'N/A'}, {selectedStore.state || 'N/A'} ({selectedStore.region || 'Unassigned'})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Manager:</strong> {selectedStore.manager_name || 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Opening Date:</strong> {formatDate(selectedStore.opening_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Coordinates:</strong>{' '}
                    {selectedStore.latitude && selectedStore.longitude ? `${selectedStore.latitude}, ${selectedStore.longitude}` : 'Not mapped'}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Trend for This Store */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Monthly Branch Sales Trend
              </h4>
              {selectedStoreMonthly.length > 0 ? (
                <div className="h-48 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedStoreMonthly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      />
                      <Bar dataKey="revenue" fill={BRAND_GREEN} radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No monthly transactions recorded for this specific branch in this date window.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Ranked #{selectedStore.rank} of {stores.length} outlets
              </span>
              <button
                onClick={() => setSelectedStore(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

