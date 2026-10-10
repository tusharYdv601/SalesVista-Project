import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  Award,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  ArrowUpDown,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Tag,
  Repeat,
  Sparkles,
  ExternalLink,
  Info
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
import { CustomerRecord, CustomerAnalyticsRecord } from '../../types';

// Theme tokens
const BRAND_GREEN = '#2D6A4F';
const DARK_GREEN = '#1E4836';
const LIGHT_MINT = '#EAF3ED';
const TEXT_PRIMARY = '#17231D';
const TEXT_SECONDARY = '#647067';
const BORDER_COLOR = '#E3E9E4';

const PALETTE = ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#5A7D6C'];

const SEGMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Champions': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Loyal Customers': { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  'Potential Loyalists': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'New Customers': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  'At Risk': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Cannot Yet Classify': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export const CustomersView: React.FC = () => {
  const { user } = useAuth();

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
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState<string>('all');
  const [selectedFrequencyFilter, setSelectedFrequencyFilter] = useState<string>('all');
  const [selectedRecencyFilter, setSelectedRecencyFilter] = useState<string>('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState<'all' | 'purchasers' | 'registered_only'>('all');
  const [sortBy, setSortBy] = useState<'spend_desc' | 'spend_asc' | 'orders_desc' | 'date_desc' | 'name_asc'>('spend_desc');

  // Pagination for Customer Directory
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Selected customer for modal detail view
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAnalyticsRecord | null>(null);

  // Data Loading & State
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [transactions, setTransactions] = useState<Array<{
    id: number;
    transaction_code: string;
    customer_id: number | null;
    store_id: number;
    total_amount: number;
    transaction_date: string;
    status: string;
    payment_method: string | null;
    sales_channel: string | null;
  }>>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Data Fetching Logic
  // -------------------------------------------------------------
  const loadCustomerData = useCallback(async (isRefreshAction = false) => {
    if (!user) return;

    if (isRefreshAction) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      // 1. Fetch customer records (strictly scoped to authenticated user)
      let customerQuery = supabase
        .from('customers')
        .select('*')
        .order('full_name', { ascending: true })
        .limit(10000);

      if (user?.id) {
        customerQuery = customerQuery.eq('owner_id', user.id);
      }

      const { data: customerData, error: customerError } = await customerQuery;

      if (customerError) {
        throw new Error(`Failed to load customer profiles: ${customerError.message}`);
      }

      // 2. Fetch transactions (strictly scoped to authenticated user)
      let txQuery = supabase
        .from('sales_transactions')
        .select('id, transaction_code, customer_id, store_id, total_amount, transaction_date, status, payment_method, sales_channel')
        .not('customer_id', 'is', null)
        .limit(10000);

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
        throw new Error(`Failed to load customer transactions: ${txError.message}`);
      }

      setCustomers(customerData || []);
      setTransactions((txData as any) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred while querying customer analytics.';
      console.error('CustomersView fetch error:', err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    loadCustomerData(false);
  }, [loadCustomerData]);

  // Keyboard shortcut (Escape) to close detail modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCustomer) {
        setSelectedCustomer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCustomer]);

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
  // Enriched Customer Analytics & Aggregation
  // -------------------------------------------------------------
  const {
    enrichedCustomers,
    totalCustomerRevenue,
    totalCustomerOrders,
    overallAov,
    repeatCustomerCount,
    repeatCustomerRate,
    activePurchasersCount,
    avgPurchaseFrequency,
    frequencyDistribution,
    spendingDistribution,
    segmentStats,
    retentionSplit,
    recencyDistribution,
    topLeaderboard
  } = useMemo(() => {
    const now = new Date().getTime();

    // Group transactions by customer_id (strictly validating against user's customer records)
    const validCustomerIds = new Set(customers.map((c) => String(c.id)));
    const validCustomerCodes = new Map<string, string>();
    customers.forEach((c) => {
      if (c.customer_code) {
        validCustomerCodes.set(c.customer_code.trim().toLowerCase(), String(c.id));
      }
    });

    const customerTxMap = new Map<string, {
      totalSpend: number;
      orders: number;
      dates: string[];
    }>();

    let totalSpendSum = 0;
    let totalOrdersSum = 0;

    transactions.forEach((tx) => {
      // Exclude explicitly cancelled or refunded orders if status exists
      if (tx.status && ['cancelled', 'canceled', 'refunded'].includes(tx.status.toLowerCase())) {
        return;
      }
      if (tx.customer_id === null || tx.customer_id === undefined) return;
      const rawCid = String(tx.customer_id).trim();
      if (!rawCid) return;

      // Anti-mismatch guard: Verify transaction belongs to one of the current user's customer records
      const isOwnedCustomer = validCustomerIds.has(rawCid) || validCustomerCodes.has(rawCid.toLowerCase());
      if (!isOwnedCustomer) return;

      const amount = Number(tx.total_amount) || 0;

      totalSpendSum += amount;
      totalOrdersSum += 1;

      const existing = customerTxMap.get(rawCid) || { totalSpend: 0, orders: 0, dates: [] };
      existing.totalSpend += amount;
      existing.orders += 1;
      if (tx.transaction_date) {
        existing.dates.push(tx.transaction_date);
      }
      customerTxMap.set(rawCid, existing);

      // If customer_id has a case-insensitive string format (e.g. CUST0001), also index lowercase
      if (rawCid.toLowerCase() !== rawCid) {
        customerTxMap.set(rawCid.toLowerCase(), existing);
      }
    });

    // Enrich each customer
    const enriched: CustomerAnalyticsRecord[] = customers.map((c) => {
      // Match by numeric string ID, raw id, or customer_code
      const agg =
        customerTxMap.get(String(c.id)) ||
        (c.customer_code ? customerTxMap.get(String(c.customer_code).trim()) : undefined) ||
        (c.customer_code ? customerTxMap.get(String(c.customer_code).trim().toLowerCase()) : undefined);

      const spend = agg ? agg.totalSpend : 0;
      const orders = agg ? agg.orders : 0;
      const aov = orders > 0 ? spend / orders : 0;

      let firstDate: string | null = null;
      let lastDate: string | null = null;
      let recencyDays: number | null = null;

      if (agg && agg.dates.length > 0) {
        const sortedDates = [...agg.dates].sort();
        firstDate = sortedDates[0];
        lastDate = sortedDates[sortedDates.length - 1];
        const lastTime = new Date(lastDate).getTime();
        recencyDays = Math.max(0, Math.floor((now - lastTime) / (1000 * 60 * 60 * 24)));
      }

      // RFM Rule-based Classification:
      let segment: CustomerAnalyticsRecord['derived_segment'] = 'Cannot Yet Classify';

      if (orders === 0) {
        segment = 'Cannot Yet Classify';
      } else if (orders >= 4 && recencyDays !== null && recencyDays <= 60) {
        segment = 'Champions';
      } else if (orders >= 2 && recencyDays !== null && recencyDays <= 90) {
        segment = 'Loyal Customers';
      } else if (orders === 1 && recencyDays !== null && recencyDays <= 60) {
        segment = 'New Customers';
      } else if (recencyDays !== null && recencyDays > 90) {
        segment = 'At Risk';
      } else {
        segment = 'Potential Loyalists';
      }

      return {
        ...c,
        total_spend: spend,
        total_orders: orders,
        avg_order_value: aov,
        first_purchase_date: firstDate,
        last_purchase_date: lastDate,
        recency_days: recencyDays,
        frequency: orders,
        monetary: spend,
        derived_segment: segment,
        is_repeat: orders >= 2,
      };
    });

    // Sort by spend descending for rank assignment
    enriched.sort((a, b) => b.total_spend - a.total_spend);
    enriched.forEach((item, index) => {
      item.rank = index + 1;
    });

    // KPI Calculations
    const activePurchasers = enriched.filter((c) => c.total_orders > 0).length;
    const repeatCount = enriched.filter((c) => c.is_repeat).length;
    const repeatRate = activePurchasers > 0 ? (repeatCount / activePurchasers) * 100 : 0;
    const aovOverall = totalOrdersSum > 0 ? totalSpendSum / totalOrdersSum : 0;
    const avgFreq = activePurchasers > 0 ? totalOrdersSum / activePurchasers : 0;

    // 1. Purchase Frequency Distribution
    const freqBrackets = [
      { name: '1 Order', label: 'One-time', count: 0 },
      { name: '2–3 Orders', label: 'Occasional', count: 0 },
      { name: '4–6 Orders', label: 'Regular', count: 0 },
      { name: '7+ Orders', label: 'Frequent', count: 0 },
      { name: '0 Orders', label: 'Inactive', count: 0 }
    ];

    enriched.forEach((c) => {
      if (c.total_orders === 0) freqBrackets[4].count += 1;
      else if (c.total_orders === 1) freqBrackets[0].count += 1;
      else if (c.total_orders <= 3) freqBrackets[1].count += 1;
      else if (c.total_orders <= 6) freqBrackets[2].count += 1;
      else freqBrackets[3].count += 1;
    });

    // 2. Customer Spending Distribution (Real Tiers in ₹)
    const spendBands = [
      { band: '< ₹100', count: 0, revenue: 0 },
      { band: '₹100–₹250', count: 0, revenue: 0 },
      { band: '₹250–₹500', count: 0, revenue: 0 },
      { band: '₹500–₹1,000', count: 0, revenue: 0 },
      { band: '₹1,000+', count: 0, revenue: 0 },
    ];

    enriched.filter((c) => c.total_orders > 0).forEach((c) => {
      if (c.total_spend < 100) {
        spendBands[0].count += 1;
        spendBands[0].revenue += c.total_spend;
      } else if (c.total_spend < 250) {
        spendBands[1].count += 1;
        spendBands[1].revenue += c.total_spend;
      } else if (c.total_spend < 500) {
        spendBands[2].count += 1;
        spendBands[2].revenue += c.total_spend;
      } else if (c.total_spend < 1000) {
        spendBands[3].count += 1;
        spendBands[3].revenue += c.total_spend;
      } else {
        spendBands[4].count += 1;
        spendBands[4].revenue += c.total_spend;
      }
    });

    // 3. Customer Segments (RFM Stats)
    const segmentMap: Record<string, { count: number; revenue: number; description: string }> = {
      'Champions': { count: 0, revenue: 0, description: 'High frequency & recent high-ticket spenders' },
      'Loyal Customers': { count: 0, revenue: 0, description: 'Consistent repeat buyers with high lifetime engagement' },
      'Potential Loyalists': { count: 0, revenue: 0, description: 'Promising repeat shoppers primed for loyalty cultivation' },
      'New Customers': { count: 0, revenue: 0, description: 'First-time buyers registered and transacted recently' },
      'At Risk': { count: 0, revenue: 0, description: 'Lapsed accounts with no recorded purchases in > 90 days' },
      'Cannot Yet Classify': { count: 0, revenue: 0, description: 'Registered customers awaiting their first order' },
    };

    enriched.forEach((c) => {
      if (segmentMap[c.derived_segment]) {
        segmentMap[c.derived_segment].count += 1;
        segmentMap[c.derived_segment].revenue += c.total_spend;
      }
    });

    const segmentsList = Object.entries(segmentMap).map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
      description: data.description,
      customerPct: customers.length > 0 ? (data.count / customers.length) * 100 : 0,
      revenuePct: totalSpendSum > 0 ? (data.revenue / totalSpendSum) * 100 : 0,
    }));

    // 4. Retention & Loyalty Split
    const firstTimeCount = enriched.filter((c) => c.total_orders === 1).length;
    const noPurchaseCount = enriched.filter((c) => c.total_orders === 0).length;

    const retentionPieData = [
      { name: 'Repeat Shoppers (2+)', value: repeatCount, color: BRAND_GREEN },
      { name: 'First-Time (1)', value: firstTimeCount, color: '#52B788' },
      { name: 'No Orders Yet', value: noPurchaseCount, color: '#CBD5E1' },
    ].filter((item) => item.value > 0);

    // 5. Purchase Recency Cadence
    const recencyBrackets = [
      { range: '< 30d', label: 'Recent', count: 0 },
      { range: '30–60d', label: 'Moderate', count: 0 },
      { range: '60–90d', label: 'Cooling', count: 0 },
      { range: '90d+', label: 'Dormant', count: 0 },
    ];

    enriched.filter((c) => c.recency_days !== null).forEach((c) => {
      const days = c.recency_days!;
      if (days < 30) recencyBrackets[0].count += 1;
      else if (days <= 60) recencyBrackets[1].count += 1;
      else if (days <= 90) recencyBrackets[2].count += 1;
      else recencyBrackets[3].count += 1;
    });

    // Top Leaderboard (top 5 spenders)
    const leaderboard = enriched.filter((c) => c.total_orders > 0).slice(0, 5);

    return {
      enrichedCustomers: enriched,
      totalCustomerRevenue: totalSpendSum,
      totalCustomerOrders: totalOrdersSum,
      overallAov: aovOverall,
      repeatCustomerCount: repeatCount,
      repeatCustomerRate: repeatRate,
      activePurchasersCount: activePurchasers,
      avgPurchaseFrequency: avgFreq,
      frequencyDistribution: freqBrackets,
      spendingDistribution: spendBands,
      segmentStats: segmentsList,
      retentionSplit: retentionPieData,
      recencyDistribution: recencyBrackets,
      topLeaderboard: leaderboard,
    };
  }, [customers, transactions]);

  // -------------------------------------------------------------
  // Filtered Directory Computation
  // -------------------------------------------------------------
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter((c) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.full_name?.toLowerCase().includes(q);
        const matchCode = c.customer_code?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchCity = c.city?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchEmail && !matchPhone && !matchCity) {
          return false;
        }
      }

      // Account Type filter (Purchasers vs Registered only)
      if (accountTypeFilter === 'purchasers' && c.total_orders === 0) return false;
      if (accountTypeFilter === 'registered_only' && c.total_orders > 0) return false;

      // Segment filter
      if (selectedSegmentFilter !== 'all') {
        if (c.derived_segment !== selectedSegmentFilter) return false;
      }

      // Frequency filter
      if (selectedFrequencyFilter !== 'all') {
        if (selectedFrequencyFilter === '0' && c.total_orders !== 0) return false;
        if (selectedFrequencyFilter === '1' && c.total_orders !== 1) return false;
        if (selectedFrequencyFilter === '2-3' && (c.total_orders < 2 || c.total_orders > 3)) return false;
        if (selectedFrequencyFilter === '4+' && c.total_orders < 4) return false;
      }

      // Recency filter
      if (selectedRecencyFilter !== 'all') {
        if (selectedRecencyFilter === 'active30' && (c.recency_days === null || c.recency_days > 30)) return false;
        if (selectedRecencyFilter === 'active90' && (c.recency_days === null || c.recency_days <= 30 || c.recency_days > 90)) return false;
        if (selectedRecencyFilter === 'dormant' && (c.recency_days === null || c.recency_days <= 90)) return false;
        if (selectedRecencyFilter === 'never' && c.recency_days !== null) return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'spend_desc':
          return b.total_spend - a.total_spend;
        case 'spend_asc':
          return a.total_spend - b.total_spend;
        case 'orders_desc':
          return b.total_orders - a.total_orders;
        case 'date_desc':
          return (b.last_purchase_date || '').localeCompare(a.last_purchase_date || '');
        case 'name_asc':
          return (a.full_name || '').localeCompare(b.full_name || '');
        default:
          return 0;
      }
    });
  }, [enrichedCustomers, searchQuery, accountTypeFilter, selectedSegmentFilter, selectedFrequencyFilter, selectedRecencyFilter, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, accountTypeFilter, selectedSegmentFilter, selectedFrequencyFilter, selectedRecencyFilter, sortBy]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setAccountTypeFilter('all');
    setSelectedSegmentFilter('all');
    setSelectedFrequencyFilter('all');
    setSelectedRecencyFilter('all');
    setSortBy('spend_desc');
  }, []);

  const hasActiveFilters =
    searchQuery !== '' ||
    accountTypeFilter !== 'all' ||
    selectedSegmentFilter !== 'all' ||
    selectedFrequencyFilter !== 'all' ||
    selectedRecencyFilter !== 'all';

  // -------------------------------------------------------------
  // CSV Export
  // -------------------------------------------------------------
  const handleExportCSV = useCallback(() => {
    if (filteredCustomers.length === 0) return;

    const headers = [
      'Customer ID',
      'Customer Code',
      'Full Name',
      'Email',
      'Phone',
      'Segment',
      'Total Orders',
      'Total Spend (₹)',
      'Average Order Value (₹)',
      'Last Purchase Date',
      'Recency (Days)',
      'City',
      'State',
      'Region'
    ];

    const escapeCSV = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const rows = filteredCustomers.map((c) => [
      escapeCSV(c.id),
      escapeCSV(c.customer_code),
      escapeCSV(c.full_name || 'Anonymous'),
      escapeCSV(c.email || 'N/A'),
      escapeCSV(c.phone || 'N/A'),
      escapeCSV(c.derived_segment),
      escapeCSV(c.total_orders),
      escapeCSV(c.total_spend.toFixed(2)),
      escapeCSV(c.avg_order_value.toFixed(2)),
      escapeCSV(c.last_purchase_date || 'None'),
      escapeCSV(c.recency_days !== null ? c.recency_days : 'N/A'),
      escapeCSV(c.city || 'N/A'),
      escapeCSV(c.state || 'N/A'),
      escapeCSV(c.region || 'N/A'),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `retailmax_customer_insights_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredCustomers]);

  // Customer Transaction History for Detail Modal
  const selectedCustomerTxHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    return transactions
      .filter((tx) => {
        if (tx.customer_id === null || tx.customer_id === undefined) return false;
        const txCid = String(tx.customer_id).trim();
        return (
          txCid === String(selectedCustomer.id) ||
          (selectedCustomer.customer_code &&
            txCid.toLowerCase() === selectedCustomer.customer_code.trim().toLowerCase())
        );
      })
      .sort((a, b) => (b.transaction_date || '').localeCompare(a.transaction_date || ''));
  }, [selectedCustomer, transactions]);

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  return (
    <div className="space-y-7 pb-16" id="customer-insights-dashboard">
      
      {/* ========================================================= */}
      {/* 1. HEADER & EXECUTIVE ACTION BAR                          */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3E9E4] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3ED] text-[#2D6A4F] text-[11px] font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-[#2D6A4F]" />
              Customer Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17231D] tracking-tight">
              Customer Behavior &amp; Segments
            </h1>
            <p className="text-xs sm:text-sm text-[#647067] max-w-2xl font-normal leading-relaxed">
              Understand purchasing patterns, customer lifetime value, RFM behavioral segments, and customer retention metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Date Range Selector */}
            <DateRangePicker
              currentRange={dateRange}
              onChange={(newRange) => setDateRange(newRange)}
            />

            {/* Refresh Action */}
            <button
              onClick={() => loadCustomerData(true)}
              disabled={loading || isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E3E9E4] rounded-xl hover:bg-slate-50 text-[#17231D] text-xs sm:text-sm font-semibold transition-all shadow-xs disabled:opacity-50"
              title="Refresh customer database records"
            >
              <RefreshCw className={`w-4 h-4 text-[#647067] ${isRefreshing ? 'animate-spin text-[#2D6A4F]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              disabled={filteredCustomers.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E3E9E4] rounded-xl hover:bg-slate-50 text-[#17231D] text-xs sm:text-sm font-semibold transition-all shadow-xs disabled:opacity-40"
              title="Export filtered customer directory to CSV"
            >
              <Download className="w-4 h-4 text-[#647067]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ERROR ALERT BANNER                                        */}
      {/* ========================================================= */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-900">Database Query Notice</h4>
              <p className="text-xs text-rose-700 font-medium leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => loadCustomerData(false)}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg transition-colors shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CUSTOMER KPI CARDS (6 REAL METRICS)                    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E9E4] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-[#647067] uppercase tracking-wider">Total Customers</span>
            <div className="w-8 h-8 rounded-xl bg-[#EAF3ED] text-[#2D6A4F] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#17231D] tracking-tight">
              {loading ? '...' : customers.length.toLocaleString()}
            </div>
            <p className="text-xs text-[#647067] mt-1 truncate">
              {customers.length === 0 ? 'No customers registered' : `${activePurchasersCount} with purchase history`}
            </p>
          </div>
        </div>

        {/* KPI 2: Repeat Customer Rate */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E9E4] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-[#647067] uppercase tracking-wider">Repeat Rate</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#17231D] tracking-tight">
              {loading ? '...' : activePurchasersCount > 0 ? `${repeatCustomerRate.toFixed(1)}%` : '—'}
            </div>
            <p className="text-xs text-[#647067] mt-1 truncate">
              {activePurchasersCount > 0 ? `${repeatCustomerCount} placed 2+ orders` : 'No order history'}
            </p>
          </div>
        </div>

        {/* KPI 3: Total Customer Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E9E4] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-[#647067] uppercase tracking-wider">Customer Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#2D6A4F] flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#17231D] tracking-tight truncate">
              {loading ? '...' : formatCurrency(totalCustomerRevenue)}
            </div>
            <p className="text-xs text-[#647067] mt-1 truncate">
              Attributable completed sales
            </p>
          </div>
        </div>

        {/* KPI 4: Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E9E4] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-[#647067] uppercase tracking-wider">Avg Order Value</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#17231D] tracking-tight truncate">
              {loading ? '...' : totalCustomerOrders > 0 ? formatCurrency(overallAov, 2) : '—'}
            </div>
            <p className="text-xs text-[#647067] mt-1 truncate">
              Basket size across {totalCustomerOrders} orders
            </p>
          </div>
        </div>

        {/* KPI 5: Average Purchase Frequency */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E9E4] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-[#647067] uppercase tracking-wider">Avg Frequency</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#17231D] tracking-tight">
              {loading ? '...' : activePurchasersCount > 0 ? `${avgPurchaseFrequency.toFixed(1)} orders` : '—'}
            </div>
            <p className="text-xs text-[#647067] mt-1 truncate">
              Orders per active buyer
            </p>
          </div>
        </div>

        {/* KPI 6: Customer Retention */}
        <div className="bg-white p-5 rounded-2xl border border-[#E3E9E4] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-[#647067] uppercase tracking-wider">Retention Health</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#17231D] tracking-tight">
              {loading ? '...' : activePurchasersCount > 0 ? `${repeatCustomerRate.toFixed(1)}%` : '—'}
            </div>
            <p className="text-xs text-[#647067] mt-1 truncate">
              {activePurchasersCount > 0 ? 'Multi-order client baseline' : 'Awaiting repeat data'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PURCHASING BEHAVIOR & SPENDING DISTRIBUTION CHARTS     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Purchase Frequency Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-[#E3E9E4] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EAF3ED] text-[#2D6A4F] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#17231D] uppercase tracking-wider">
                  Purchase Frequency Distribution
                </h3>
              </div>
              <span className="text-xs text-[#647067]">Order volume clusters</span>
            </div>
            <p className="text-xs text-[#647067]">
              Categorizes customers by lifetime completed transactions.
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            {activePurchasersCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: number) => [`${val} customers`, 'Count']}
                    labelFormatter={(label) => `Group: ${label}`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #E3E9E4',
                      boxShadow: '0 8px 20px -4px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="count" fill={BRAND_GREEN} radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {frequencyDistribution.map((_, index) => (
                      <Cell key={`cell-freq-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#647067]">
                No customer transaction records available for frequency calculation.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {frequencyDistribution.slice(0, 4).map((f) => (
              <div key={f.name} className="p-2 bg-slate-50/80 rounded-xl">
                <span className="text-[#647067] block truncate">{f.label}</span>
                <span className="font-extrabold text-[#17231D] text-xs">{f.count} buyers</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Customer Spending Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-[#E3E9E4] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#2D6A4F] flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#17231D] uppercase tracking-wider">
                  Customer Spending Bands
                </h3>
              </div>
              <span className="text-xs text-[#647067]">Monetary yield</span>
            </div>
            <p className="text-xs text-[#647067]">
              Customer population and revenue generated across monetary spending brackets.
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            {totalCustomerRevenue > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="band" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      name === 'count' ? `${val} customers` : formatCurrency(val),
                      name === 'count' ? 'Customers' : 'Total Revenue'
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #E3E9E4',
                      boxShadow: '0 8px 20px -4px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="count" name="count" fill="#40916C" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {spendingDistribution.map((_, index) => (
                      <Cell key={`cell-spend-${index}`} fill={PALETTE[(index + 1) % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#647067]">
                No customer spend records available in the selected window.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
            {spendingDistribution.map((s) => (
              <div key={s.band} className="p-1.5 bg-slate-50/80 rounded-xl text-center">
                <span className="text-[#647067] block text-[10px] truncate">{s.band}</span>
                <span className="font-extrabold text-[#17231D]">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. CUSTOMER SEGMENTATION (RFM BEHAVIORAL ANALYSIS)         */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3E9E4] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2D6A4F]">
              <Sparkles className="w-3.5 h-3.5" />
              RFM Behavioral Segmentation
            </div>
            <h3 className="text-lg font-extrabold text-[#17231D] tracking-tight">
              Customer Cohorts &amp; Value Tiers
            </h3>
            <p className="text-xs text-[#647067]">
              Multi-dimensional analysis combining purchase Recency, transaction Frequency, and total Monetary spend.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#647067] self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            Click segment card to filter directory
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segmentStats.map((seg) => {
            const isSelected = selectedSegmentFilter === seg.name;
            const styling = SEGMENT_COLORS[seg.name] || SEGMENT_COLORS['Cannot Yet Classify'];

            return (
              <div
                key={seg.name}
                onClick={() => {
                  setSelectedSegmentFilter(isSelected ? 'all' : seg.name);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3.5 ${
                  isSelected
                    ? 'border-[#2D6A4F] bg-[#EAF3ED]/40 shadow-xs ring-2 ring-[#2D6A4F]/20'
                    : 'border-[#E3E9E4] hover:border-[#2D6A4F] bg-white hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${styling.bg} ${styling.text} ${styling.border}`}>
                      {seg.name}
                    </span>
                    <p className="text-[11px] text-[#647067] leading-relaxed mt-1">
                      {seg.description}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-[#2D6A4F] bg-white px-2 py-0.5 rounded border border-[#2D6A4F] shrink-0">
                      FILTERED
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#647067] uppercase tracking-wider block">Customer Base</span>
                    <div className="text-base font-black text-[#17231D]">
                      {seg.count.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-[#647067]">({seg.customerPct.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#647067] uppercase tracking-wider block">Revenue Contribution</span>
                    <div className="text-sm font-bold text-[#2D6A4F]">
                      {formatCurrency(seg.revenue)}{' '}
                      <span className="text-[11px] text-[#647067]">({seg.revenuePct.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. CUSTOMER RETENTION & LOYALTY ANALYTICS                  */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3E9E4] shadow-xs space-y-6">
        <div className="space-y-1 border-b border-slate-100 pb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2D6A4F]">
            <Repeat className="w-3.5 h-3.5" />
            Loyalty &amp; Churn Prevention
          </div>
          <h3 className="text-lg font-extrabold text-[#17231D] tracking-tight">
            Customer Retention &amp; Purchase Recency
          </h3>
          <p className="text-xs text-[#647067]">
            Monitor customer return rates and recency cadence to detect lapsing shopper risk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Repeat vs First Time Donut */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#647067] uppercase tracking-wider">
              Repeat vs. First-Time Buyer Distribution
            </h4>
            <p className="text-xs text-[#647067]">
              Measures customer conversion from single-transaction testers into retained multi-purchase accounts.
            </p>

            <div className="h-64 w-full flex items-center justify-center">
              {retentionSplit.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={retentionSplit}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {retentionSplit.map((entry, index) => (
                        <Cell key={`cell-ret-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${val} customers`, 'Count']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '14px',
                        border: '1px solid #E3E9E4',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-[#647067]">No customer records available.</div>
              )}
            </div>
          </div>

          {/* Purchase Recency Cadence */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#647067] uppercase tracking-wider">
              Purchase Recency Distribution
            </h4>
            <p className="text-xs text-[#647067]">
              Tracks days elapsed since the customer&apos;s latest completed checkout.
            </p>

            <div className="h-64 w-full">
              {activePurchasersCount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recencyDistribution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(val: number) => [`${val} customers`, 'Count']}
                      labelFormatter={(label) => `Window: ${label}`}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '14px',
                        border: '1px solid #E3E9E4',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="count" fill={BRAND_GREEN} radius={[6, 6, 0, 0]} maxBarSize={45}>
                      <Cell fill="#2D6A4F" />
                      <Cell fill="#52B788" />
                      <Cell fill="#F59E0B" />
                      <Cell fill="#EF4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#647067]">
                  No purchase recency data available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. TOP CUSTOMERS LEADERBOARD                              */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3E9E4] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#17231D] uppercase tracking-wider">
                Top Value Customers Leaderboard
              </h3>
              <p className="text-xs text-[#647067]">Highest cumulative revenue contributors</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#647067]">Ranked by total spending</span>
        </div>

        {topLeaderboard.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[#647067] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4 text-right">Orders</th>
                  <th className="py-3 px-4 text-right">Avg Order</th>
                  <th className="py-3 px-4 text-right">Total Spend</th>
                  <th className="py-3 px-4">Last Order</th>
                  <th className="py-3 px-4 w-16 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {topLeaderboard.map((c) => {
                  const segStyle = SEGMENT_COLORS[c.derived_segment] || SEGMENT_COLORS['Cannot Yet Classify'];

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                          c.rank === 1 ? 'bg-amber-400 text-amber-950' :
                          c.rank === 2 ? 'bg-slate-200 text-slate-800' :
                          c.rank === 3 ? 'bg-amber-700/20 text-amber-900' :
                          'text-slate-500'
                        }`}>
                          #{c.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#17231D] group-hover:text-[#2D6A4F] transition-colors">
                          {c.full_name || 'Anonymous Customer'}
                        </div>
                        <div className="text-[11px] text-[#647067] font-mono mt-0.5">
                          {c.customer_code} · {c.city ? `${c.city}, ${c.state || ''}` : 'Location unlisted'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${segStyle.bg} ${segStyle.text} ${segStyle.border}`}>
                          {c.derived_segment}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#17231D]">
                        {c.total_orders.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#647067]">
                        {formatCurrency(c.avg_order_value, 2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-[#17231D]">
                        {formatCurrency(c.total_spend)}
                      </td>
                      <td className="py-3.5 px-4 text-[#647067]">
                        {formatDate(c.last_purchase_date)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-200/60 text-[#647067] hover:text-[#2D6A4F] transition-colors"
                          title="View customer profile"
                          aria-label={`Inspect ${c.full_name}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#647067]">
            No completed customer transactions recorded.
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 7. SEARCHABLE CUSTOMER DIRECTORY                           */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3E9E4] shadow-xs space-y-6">
        {/* Directory Title & Subtitle */}
        <div>
          <h3 className="text-lg font-extrabold text-[#17231D] tracking-tight">
            Customer Account Directory
          </h3>
          <p className="text-xs text-[#647067]">
            Search customer accounts, filter by purchasing status or behavioral tier, and inspect individual order histories.
          </p>
        </div>

        {/* Quick Account Status Tabs & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAccountTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                accountTypeFilter === 'all'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              All Profiles
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                accountTypeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {customers.length.toLocaleString()}
              </span>
            </button>

            <button
              onClick={() => setAccountTypeFilter('purchasers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                accountTypeFilter === 'purchasers'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Active Buyers (1+ Orders)
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                accountTypeFilter === 'purchasers' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activePurchasersCount.toLocaleString()}
              </span>
            </button>

            <button
              onClick={() => setAccountTypeFilter('registered_only')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                accountTypeFilter === 'registered_only'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Registered (0 Orders)
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                accountTypeFilter === 'registered_only' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {(customers.length - activePurchasersCount).toLocaleString()}
              </span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors self-start sm:self-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, code, email, city..."
              className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-[#E3E9E4] rounded-xl text-xs sm:text-sm text-[#17231D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] transition-all"
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

          {/* Segment Filter */}
          <div>
            <select
              value={selectedSegmentFilter}
              onChange={(e) => setSelectedSegmentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-[#E3E9E4] rounded-xl text-xs sm:text-sm text-[#17231D] focus:outline-none focus:border-[#2D6A4F]"
            >
              <option value="all">All Segments</option>
              <option value="Champions">Champions</option>
              <option value="Loyal Customers">Loyal Customers</option>
              <option value="Potential Loyalists">Potential Loyalists</option>
              <option value="New Customers">New Customers</option>
              <option value="At Risk">At Risk</option>
              <option value="Cannot Yet Classify">Cannot Yet Classify (0 Orders)</option>
            </select>
          </div>

          {/* Frequency Filter */}
          <div>
            <select
              value={selectedFrequencyFilter}
              onChange={(e) => setSelectedFrequencyFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-[#E3E9E4] rounded-xl text-xs sm:text-sm text-[#17231D] focus:outline-none focus:border-[#2D6A4F]"
            >
              <option value="all">All Order Frequencies</option>
              <option value="4+">4+ Orders (Frequent)</option>
              <option value="2-3">2–3 Orders (Occasional)</option>
              <option value="1">1 Order (Single Purchase)</option>
              <option value="0">0 Orders (Never Purchased)</option>
            </select>
          </div>

          {/* Recency Filter */}
          <div>
            <select
              value={selectedRecencyFilter}
              onChange={(e) => setSelectedRecencyFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-[#E3E9E4] rounded-xl text-xs sm:text-sm text-[#17231D] focus:outline-none focus:border-[#2D6A4F]"
            >
              <option value="all">All Activity Recency</option>
              <option value="active30">Active recently (&lt; 30 days)</option>
              <option value="active90">Moderately active (30–90 days)</option>
              <option value="dormant">Dormant / Lapsed (&gt; 90 days)</option>
              <option value="never">No purchase history</option>
            </select>
          </div>
        </div>

        {/* Counter and Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#647067] pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-bold text-[#17231D]">{filteredCustomers.length}</span> of {customers.length} customer records
            {hasActiveFilters && <span className="text-[#2D6A4F] font-semibold ml-1.5">(Filtered)</span>}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 bg-white border border-[#E3E9E4] rounded-lg text-xs font-semibold text-[#17231D] focus:outline-none focus:border-[#2D6A4F]"
            >
              <option value="spend_desc">Total Spend: High to Low</option>
              <option value="spend_asc">Total Spend: Low to High</option>
              <option value="orders_desc">Orders Count: High to Low</option>
              <option value="date_desc">Last Purchase: Most Recent</option>
              <option value="name_asc">Customer Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[#647067] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Customer Account</th>
                <th className="py-3.5 px-4">Contact &amp; Location</th>
                <th className="py-3.5 px-4">RFM Segment</th>
                <th className="py-3.5 px-4 text-right">Orders</th>
                <th className="py-3.5 px-4 text-right">Avg Ticket</th>
                <th className="py-3.5 px-4 text-right">Total Revenue</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 w-16 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedCustomers.map((c) => {
                const segStyle = SEGMENT_COLORS[c.derived_segment] || SEGMENT_COLORS['Cannot Yet Classify'];

                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#17231D] group-hover:text-[#2D6A4F] transition-colors">
                        {c.full_name || 'Anonymous Customer'}
                      </div>
                      <div className="text-[11px] text-[#647067] font-mono mt-0.5">
                        {c.customer_code}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[#17231D] truncate max-w-[180px]">{c.email || 'No email registered'}</div>
                      <div className="text-[11px] text-[#647067]">{c.city ? `${c.city}, ${c.state || ''}` : 'Location unlisted'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.total_orders > 0 ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${segStyle.bg} ${segStyle.text} ${segStyle.border}`}>
                          {c.derived_segment}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border bg-slate-100 text-slate-600 border-slate-200" title="Registered customer profile with no orders completed yet">
                          Registered / Lead
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.total_orders > 0 ? (
                        <span className="font-bold text-[#17231D]">{c.total_orders}</span>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-400">0</span>
                          <div className="text-[10px] text-slate-400">No purchases</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#647067]">
                      {c.total_orders > 0 ? formatCurrency(c.avg_order_value, 2) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.total_spend > 0 ? (
                        <span className="font-black text-[#17231D]">{formatCurrency(c.total_spend)}</span>
                      ) : (
                        <span className="text-slate-400 font-semibold">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#647067]">
                      {c.last_purchase_date ? (
                        <div>
                          <div>{formatDate(c.last_purchase_date)}</div>
                          <div className="text-[10px] text-slate-400">{c.recency_days}d ago</div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-400 italic">No orders</span>
                          {c.registration_date && (
                            <div className="text-[10px] text-slate-400">Joined {formatDate(c.registration_date)}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(c);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-200/60 text-[#647067] hover:text-[#2D6A4F] transition-colors"
                        title="View Customer Profile"
                        aria-label={`Inspect ${c.full_name}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Directory Pagination Bar */}
        {filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between pt-2 text-xs text-[#647067]">
            <div>
              Page <span className="font-bold text-[#17231D]">{currentPage}</span> of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E3E9E4] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-[#17231D]"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E3E9E4] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-[#17231D]"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty Search Results */}
        {filteredCustomers.length === 0 && !loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#17231D]">No customers match your criteria</h4>
            <p className="text-xs text-[#647067] max-w-sm mx-auto">
              Try adjusting your search terms or clearing the segment/recency filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#2D6A4F] text-white text-xs font-bold rounded-xl hover:bg-[#1E4836] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 8. INTERACTIVE CUSTOMER DETAIL MODAL / DRAWER             */}
      {/* ========================================================= */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedCustomer(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-detail-title"
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E3E9E4] shadow-2xl p-6 sm:p-7 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {selectedCustomer.customer_code}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${SEGMENT_COLORS[selectedCustomer.derived_segment]?.bg} ${SEGMENT_COLORS[selectedCustomer.derived_segment]?.text} ${SEGMENT_COLORS[selectedCustomer.derived_segment]?.border}`}>
                    {selectedCustomer.derived_segment}
                  </span>
                  {selectedCustomer.is_repeat && (
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Repeat Customer
                    </span>
                  )}
                </div>
                <h2 id="customer-detail-title" className="text-xl sm:text-2xl font-extrabold text-[#17231D]">
                  {selectedCustomer.full_name || 'Anonymous Customer'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#EAF3ED]/60 border border-[#2D6A4F]/20">
                <span className="text-[10px] font-bold text-[#647067] uppercase tracking-wider block">Total Spend</span>
                <span className="text-base font-black text-[#2D6A4F] mt-0.5 block">
                  {formatCurrency(selectedCustomer.total_spend)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/60">
                <span className="text-[10px] font-bold text-[#647067] uppercase tracking-wider block">Total Orders</span>
                <span className="text-base font-black text-blue-900 mt-0.5 block">
                  {selectedCustomer.total_orders.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                <span className="text-[10px] font-bold text-[#647067] uppercase tracking-wider block">Avg Order Value</span>
                <span className="text-base font-black text-amber-900 mt-0.5 block">
                  {formatCurrency(selectedCustomer.avg_order_value, 2)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/60">
                <span className="text-[10px] font-bold text-[#647067] uppercase tracking-wider block">Recency</span>
                <span className="text-base font-black text-purple-900 mt-0.5 block">
                  {selectedCustomer.recency_days !== null ? `${selectedCustomer.recency_days}d ago` : 'None'}
                </span>
              </div>
            </div>

            {/* Customer Contact & Profile Details */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-[#647067] uppercase tracking-wider">Account Identity &amp; Profile</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Email:</strong> {selectedCustomer.email || 'Unlisted'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Phone:</strong> {selectedCustomer.phone || 'Unlisted'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Territory:</strong> {selectedCustomer.city || 'N/A'}, {selectedCustomer.state || 'N/A'} ({selectedCustomer.region || 'Unassigned'})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Member Since:</strong> {formatDate(selectedCustomer.registration_date)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Orders History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#647067] uppercase tracking-wider">
                Completed Transactions History ({selectedCustomerTxHistory.length})
              </h4>
              {selectedCustomerTxHistory.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[#647067] font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Receipt Code</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Channel</th>
                        <th className="py-2.5 px-3">Payment</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedCustomerTxHistory.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-700">{tx.transaction_code}</td>
                          <td className="py-2.5 px-3 text-[#647067]">{formatDate(tx.transaction_date)}</td>
                          <td className="py-2.5 px-3 text-slate-700">{tx.sales_channel || 'In-Store'}</td>
                          <td className="py-2.5 px-3 text-slate-700">{tx.payment_method || 'Standard'}</td>
                          <td className="py-2.5 px-3 text-right font-black text-[#17231D]">{formatCurrency(tx.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#647067] bg-slate-50 rounded-xl">
                  No completed sales receipts linked to this customer account.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Ranked #{selectedCustomer.rank} in customer lifetime value
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
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

