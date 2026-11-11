import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  Copy,
  Check,
  Sliders,
  Grid,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  PieChart,
  Pie,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  ExecutiveMetric, 
  ExecutiveTakeaway, 
  VarianceDataPoint, 
  StorePerformanceRanking, 
  AnomalyAuditItem,
  CrossDimensionCell
} from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

type StoreRow = { id: number; store_code: string; store_name: string; region: string | null };
type CustomerRow = { id: number; customer_segment: string | null };
type TxRow = {
  store_id: number | null;
  customer_id: number | null;
  total_amount: number | null;
  transaction_date: string;
  status: string | null;
};

const DAY_MS = 86400000;
const EXCLUDED_STATUSES = ['cancelled', 'canceled', 'refunded'];
const REGION_PALETTE = ['#4f46e5', '#059669', '#d97706', '#0891b2', '#db2777', '#7c3aed'];

// There is no audit table yet, so this log is sample data (labelled as such in the UI).
const SAMPLE_AUDIT_ITEMS: AnomalyAuditItem[] = [
  {
    id: 'ANM-902',
    date: '2026-11-04',
    storeName: 'Noida City Center Mall',
    metric: 'Gross Margin Drop (-14%)',
    deviation: '-14.3%',
    suspectedCause: 'Excessive promotional discounts stacked at POS register.',
    status: 'Action Needed'
  },
  {
    id: 'ANM-884',
    date: '2026-11-07',
    storeName: 'Mumbai Bandra West Outlet',
    metric: 'Transactions Drop (-28%)',
    deviation: '-28.1%',
    suspectedCause: 'POS terminal gateway timeout between 2:00 PM - 5:30 PM.',
    status: 'Investigating'
  },
  {
    id: 'ANM-870',
    date: '2026-11-09',
    storeName: 'Delhi Flagship',
    metric: 'Unusual Volume Spike (+42%)',
    deviation: '+42.5%',
    suspectedCause: 'Corporate bulk festival gifting order logged.',
    status: 'Resolved'
  }
];

const formatMoney = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
};

const formatChange = (pct: number | null) =>
  pct === null ? 'n/a' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;

// Supabase returns at most 1000 rows per request, so page through the table.
async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const rows: T[] = [];
  for (let page = 0; page < 50; page++) {
    const { data, error } = await build(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

export default function ReportsView() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'audit'>('monthly');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [targetMultiplier, setTargetMultiplier] = useState<number>(100); // 100% baseline
  const [copiedToast, setCopiedToast] = useState(false);
  const [activeSegmentFilter, setActiveSegmentFilter] = useState<string>('All');

  const [stores, setStores] = useState<StoreRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load this user's stores, customers and transactions from Supabase
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [storeRows, customerRows, txRows] = await Promise.all([
          fetchAllRows<StoreRow>((from, to) =>
            supabase.from('stores').select('id, store_code, store_name, region').eq('owner_id', user.id).order('id').range(from, to)
          ),
          fetchAllRows<CustomerRow>((from, to) =>
            supabase.from('customers').select('id, customer_segment').eq('owner_id', user.id).order('id').range(from, to)
          ),
          fetchAllRows<TxRow>((from, to) =>
            supabase
              .from('sales_transactions')
              .select('id, store_id, customer_id, total_amount, transaction_date, status')
              .eq('owner_id', user.id)
              .order('id')
              .range(from, to)
          )
        ]);
        if (cancelled) return;
        setStores(storeRows);
        setCustomers(customerRows);
        setTransactions(txRows);
      } catch (err) {
        console.error('ReportsView fetch error:', err);
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load report data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const auditItems = SAMPLE_AUDIT_ITEMS;

  // All report figures derived from the live data. The "target" is the previous period's
  // revenue scaled by the quota slider, since there is no targets table.
  const report = useMemo(() => {
    const days = reportType === 'quarterly' ? 90 : 30;
    const sum = (rows: { amount: number }[]) => rows.reduce((total, t) => total + t.amount, 0);

    const valid = transactions
      .filter(t => !t.status || !EXCLUDED_STATUSES.includes(t.status.toLowerCase()))
      .map(t => ({
        storeId: t.store_id,
        customerId: t.customer_id,
        amount: Number(t.total_amount) || 0,
        ts: new Date(t.transaction_date).getTime()
      }))
      .filter(t => !Number.isNaN(t.ts));

    // Anchor the windows to the newest transaction so imported/historical data still shows up
    const anchor = valid.reduce((latest, t) => Math.max(latest, t.ts), 0);
    const curStart = anchor - days * DAY_MS;
    const prevStart = curStart - days * DAY_MS;
    const current = valid.filter(t => t.ts > curStart);
    const previous = valid.filter(t => t.ts > prevStart && t.ts <= curStart);

    const storeById = new Map(stores.map(s => [s.id, s]));
    const segmentById = new Map(customers.map(c => [c.id, c.customer_segment || 'Unclassified']));
    const regionOf = (storeId: number | null) =>
      (storeId !== null && storeById.get(storeId)?.region) || 'Unassigned';

    const curRev = sum(current);
    const prevRev = sum(previous);
    const growthPct = prevRev > 0 ? ((curRev - prevRev) / prevRev) * 100 : null;
    const target = (prevRev * targetMultiplier) / 100;
    const achievement = target > 0 ? (curRev / target) * 100 : null;

    const activeCustomers = (rows: typeof valid) =>
      new Set(rows.filter(t => t.customerId !== null).map(t => t.customerId)).size;
    const ltvCur = activeCustomers(current) > 0 ? curRev / activeCustomers(current) : 0;
    const ltvPrev = activeCustomers(previous) > 0 ? prevRev / activeCustomers(previous) : 0;
    const ltvChange = ltvPrev > 0 ? ((ltvCur - ltvPrev) / ltvPrev) * 100 : null;

    const executiveMetrics: ExecutiveMetric[] = [
      {
        label: 'Total Revenue Realized',
        value: formatMoney(curRev),
        change: formatChange(growthPct),
        isPositive: growthPct === null || growthPct >= 0,
        subtext: `Last ${days} days vs previous ${days}`
      },
      {
        label: 'Dynamic Achievement',
        value: achievement === null ? '—' : `${achievement.toFixed(1)}%`,
        change: achievement === null ? 'n/a' : formatChange(achievement - 100),
        isPositive: achievement === null || achievement >= 100,
        subtext: `Target = previous period × ${targetMultiplier}%`
      },
      {
        label: 'Audit Risk Flags',
        value: `${auditItems.length} Flags`,
        change: '—',
        isPositive: true,
        subtext: 'Sample audit log (not yet live)'
      },
      {
        label: 'Avg Customer LTV',
        value: `₹${Math.round(ltvCur).toLocaleString('en-IN')}`,
        change: formatChange(ltvChange),
        isPositive: ltvChange === null || ltvChange >= 0,
        subtext: 'Revenue per active customer'
      }
    ];

    // Four equal buckets across the current window, each compared with the matching previous bucket
    const bucketSize = (days * DAY_MS) / 4;
    const simulatedVariance: VarianceDataPoint[] = Array.from({ length: 4 }, (_, i) => {
      const start = curStart + i * bucketSize;
      const prevBucketStart = prevStart + i * bucketSize;
      const actual = sum(current.filter(t => t.ts > start && t.ts <= start + bucketSize));
      const base = sum(previous.filter(t => t.ts > prevBucketStart && t.ts <= prevBucketStart + bucketSize));
      const bucketTarget = Math.round((base * targetMultiplier) / 100);
      return {
        period: new Date(start + DAY_MS).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        target: bucketTarget,
        actual: Math.round(actual),
        variancePct: bucketTarget > 0 ? Number((((actual - bucketTarget) / bucketTarget) * 100).toFixed(2)) : 0
      };
    });

    const storeRankings: StorePerformanceRanking[] = stores
      .map(store => {
        const rev = sum(current.filter(t => t.storeId === store.id));
        const base = (sum(previous.filter(t => t.storeId === store.id)) * targetMultiplier) / 100;
        const pct = base > 0 ? Math.round((rev / base) * 100) : 100;
        return {
          storeId: store.store_code,
          storeName: store.store_name,
          region: store.region || 'Unassigned',
          rev,
          revenue: `₹${Math.round(rev).toLocaleString('en-IN')}`,
          targetAchievementPct: pct,
          status: (pct >= 100 ? 'Exceeded' : pct >= 90 ? 'On Track' : 'Underperforming') as StorePerformanceRanking['status']
        };
      })
      .filter(s => s.rev > 0)
      .sort((a, b) => b.rev - a.rev)
      .map(({ rev, ...ranking }) => ranking);

    const cells = new Map<string, CrossDimensionCell>();
    current.forEach(t => {
      const region = regionOf(t.storeId);
      const segment = (t.customerId !== null && segmentById.get(t.customerId)) || 'Unclassified';
      const key = `${region}|${segment}`;
      const cell = cells.get(key) ?? { region, segment, revenue: 0, orders: 0, health: 'low' as const };
      cell.revenue += t.amount;
      cell.orders += 1;
      cells.set(key, cell);
    });
    const crossDimensionMatrix = Array.from(cells.values());
    const maxCellRevenue = Math.max(1, ...crossDimensionMatrix.map(c => c.revenue));
    crossDimensionMatrix.forEach(c => {
      const share = c.revenue / maxCellRevenue;
      c.health = share >= 0.66 ? 'high' : share >= 0.33 ? 'medium' : 'low';
    });

    const regions = Array.from(new Set(crossDimensionMatrix.map(c => c.region))).sort();
    const segments = Array.from(new Set(crossDimensionMatrix.map(c => c.segment))).sort();

    // Briefing text generated from the same numbers
    const regionTotals = regions
      .map(region => ({
        region,
        revenue: crossDimensionMatrix.filter(c => c.region === region).reduce((total, c) => total + c.revenue, 0)
      }))
      .sort((a, b) => b.revenue - a.revenue);
    const weakest = [...storeRankings].sort((a, b) => a.targetAchievementPct - b.targetAchievementPct)[0];

    const takeaways: ExecutiveTakeaway[] = [
      {
        id: '1',
        type: 'growth',
        title: regionTotals.length ? `${regionTotals[0].region} Region Leads Revenue` : 'No revenue data yet',
        detail: regionTotals.length
          ? `${regionTotals[0].region} contributed ${Math.round((regionTotals[0].revenue / curRev) * 100)}% of ${formatMoney(curRev)} revenue over the last ${days} days.`
          : `No transactions were found in the last ${days} days.`,
        badgeText: 'Primary Growth Driver'
      },
      {
        id: '2',
        type: 'risk',
        title: weakest ? `${weakest.storeName} Below Pace` : 'No store data yet',
        detail: weakest
          ? `${weakest.storeName} is at ${weakest.targetAchievementPct}% of its target (${weakest.revenue} this period).`
          : 'Add stores and transactions to see store-level risks.',
        badgeText: 'Action Required'
      },
      {
        id: '3',
        type: 'milestone',
        title: growthPct === null ? 'Not enough history' : growthPct >= 0 ? 'Revenue Growing' : 'Revenue Contracting',
        detail:
          growthPct === null
            ? `No previous ${days}-day period to compare against yet.`
            : `Revenue is ${formatChange(growthPct)} versus the previous ${days} days (${formatMoney(curRev)} vs ${formatMoney(prevRev)}).`,
        badgeText: 'Period Trend'
      }
    ];

    return { executiveMetrics, simulatedVariance, storeRankings, crossDimensionMatrix, regions, segments, takeaways, hasData: valid.length > 0 };
  }, [transactions, stores, customers, reportType, targetMultiplier]);

  const { executiveMetrics, simulatedVariance, storeRankings, crossDimensionMatrix, regions, segments, takeaways } = report;

  // Filtered views
  const filteredStores = (selectedRegion === 'All'
    ? storeRankings
    : storeRankings.filter(s => s.region === selectedRegion)
  ).slice(0, 8);

  // Chart data (revenue in Lakhs)
  const varianceChartData = simulatedVariance.map(d => ({
    period: d.period,
    Actual: Number((d.actual / 100000).toFixed(1)),
    Target: Number((d.target / 100000).toFixed(1)),
    'Variance %': d.variancePct
  }));

  const STATUS_COLORS: Record<string, string> = {
    Exceeded: '#059669',
    'On Track': '#2563eb',
    Underperforming: '#d97706'
  };

  const storeChartData = filteredStores.map(s => ({
    name: s.storeName.split(' (')[0],
    revenue: Number((Number(s.revenue.replace(/[^\d]/g, '')) / 100000).toFixed(1)),
    fill: STATUS_COLORS[s.status]
  }));

  // Revenue per region (in Lakhs), optionally limited to one segment
  const regionRevenueData = regions
    .map((region, i) => ({
      region,
      fill: REGION_PALETTE[i % REGION_PALETTE.length],
      revenue: Number((
        crossDimensionMatrix
          .filter(c => c.region === region && (activeSegmentFilter === 'All' || c.segment === activeSegmentFilter))
          .reduce((total, c) => total + c.revenue, 0) / 100000
      ).toFixed(1))
    }))
    .filter(r => r.revenue > 0);

  // Copy Brief to Clipboard for Slack/Email
  const handleCopyBrief = () => {
    const briefText = `*SalesVista Strategic Executive Briefing (${reportType.toUpperCase()})*
Generated: ${new Date().toLocaleDateString('en-IN')}

*Core Metrics:*
- Revenue Realized: ${executiveMetrics[0].value} (${executiveMetrics[0].change})
- Target Achievement: ${executiveMetrics[1].value} (${executiveMetrics[1].subtext})
- Unresolved Outliers: ${executiveMetrics[2].value}

*Top Takeaways:*
${takeaways.map(t => `• *[${t.badgeText}]* ${t.title}: ${t.detail}`).join('\n')}

*Audit Status:* ${auditItems.length} active exceptions flagged.`;

    navigator.clipboard.writeText(briefText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvRows = [
      ['Report Section', 'Identifier', 'Primary Value', 'Context / Status'],
      ...executiveMetrics.map(m => ['Executive KPI', m.label, m.value, `${m.change} (${m.subtext})`]),
      ...storeRankings.map(s => ['Store Performance', s.storeName, s.revenue, `${s.targetAchievementPct}% target - ${s.status}`]),
      ...auditItems.map(a => ['Audit Exception', a.id, a.storeName, `${a.metric} | ${a.status}`]),
      ...crossDimensionMatrix.map(c => ['Segment Breakdown', `${c.region} - ${c.segment}`, `₹${(c.revenue / 100000).toFixed(2)}L`, `${c.orders} orders`])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(row => row.map(v => `"${v}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SalesVista_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Top Header & Control Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports & Strategic Analysis</h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              FY26 Active
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Dynamic scenario modeling, cross-dimension customer matrices, and audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Mode Selector */}
          <div className="flex items-center rounded-lg border border-gray-300 bg-white p-1 text-sm shadow-sm">
            {(['monthly', 'quarterly', 'audit'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setReportType(mode)}
                className={`rounded-md px-3 py-1.5 font-medium capitalize transition ${
                  reportType === mode 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'audit' ? 'Risk Audit' : `${mode} View`}
              </button>
            ))}
          </div>

          {/* Copy Brief Button */}
          <button
            type="button"
            onClick={handleCopyBrief}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
            title="Copy Slack/Email Executive Brief"
          >
            {copiedToast ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
            {copiedToast ? 'Copied Brief!' : 'Copy Brief'}
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            CSV
          </button>

          {/* Print/PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          Loading report data from Supabase…
        </div>
      )}
      {loadError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Could not load report data: {loadError}
        </div>
      )}
      {!loading && !loadError && !report.hasData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No sales transactions found for your account yet. Import data to populate this report.
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {executiveMetrics.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{item.label}</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">{item.value}</span>
              <span
                className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  item.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {item.isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {item.change}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">{item.subtext}</p>
          </div>
        ))}
      </div>

      {/* Narrative Executive Strategic Takeaways */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Executive Strategic Briefing</h2>
          </div>
          <span className="text-xs text-gray-400">Heuristic summary from live transaction stream</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {takeaways.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border p-4 transition ${
                item.type === 'growth'
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : item.type === 'risk'
                  ? 'border-rose-200 bg-rose-50/40'
                  : 'border-indigo-200 bg-indigo-50/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    item.type === 'growth'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.type === 'risk'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {item.badgeText}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Target Variance & Real-Time Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Scenario Simulator Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-gray-900">Variance & Quota Simulator</h3>
              </div>
              <span className="text-xs text-gray-400">What-If Analysis</span>
            </div>

            {/* Quota Multiplier Range Slider */}
            <div className="my-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  Target Quota Stress Test:
                </span>
                <span className="font-bold text-indigo-600">{targetMultiplier}% Baseline</span>
              </div>
              <input
                type="range"
                min="70"
                max="130"
                step="5"
                value={targetMultiplier}
                onChange={(e) => setTargetMultiplier(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Conservative (70%)</span>
                <span>Normal (100%)</span>
                <span>Aggressive (130%)</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={varianceChartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}L`} />
                  <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'Variance %' ? `${value}%` : `₹${value}L`
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="rev" dataKey="Target" fill="#c7d2fe" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar yAxisId="rev" dataKey="Actual" fill="#4f46e5" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Line yAxisId="pct" type="monotone" dataKey="Variance %" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
            <span>Quota Multiplier: <strong className="text-gray-800">{targetMultiplier}%</strong></span>
            <button
              onClick={() => setTargetMultiplier(100)}
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
            >
              <RefreshCw className="h-3 w-3" /> Reset Quota
            </button>
          </div>
        </div>

        {/* Store Performance Rankings */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-semibold text-gray-900">Store Performance Matrix</h3>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="text-xs border-gray-300 rounded-md py-1 px-2 border focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeChartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}L`} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `₹${value}L`} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-gray-500">
            {Object.entries(STATUS_COLORS).map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-4 divide-y divide-gray-100">
            {filteredStores.map((store) => (
              <div key={store.storeId} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{store.storeName}</h4>
                  <p className="text-xs text-gray-400">ID: {store.storeId} • Region: {store.region}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{store.revenue}</div>
                  <span
                    className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      store.status === 'Exceeded'
                        ? 'bg-emerald-50 text-emerald-700'
                        : store.status === 'On Track'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {store.targetAchievementPct}% Achievement
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cross-Dimensional Performance Matrix */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-2">
            <Grid className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-semibold text-gray-900">Revenue by Region</h3>
              <p className="text-xs text-gray-500">Total revenue per region, filterable by customer segment</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Filter Segment:</span>
            <select
              value={activeSegmentFilter}
              onChange={(e) => setActiveSegmentFilter(e.target.value)}
              className="text-xs border-gray-300 rounded-md py-1 px-2 border focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Segments</option>
              {segments.map(segment => (
                <option key={segment} value={segment}>{segment}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={regionRevenueData}
                dataKey="revenue"
                nameKey="region"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                label={({ name, value }) => `${name} ₹${value}L`}
                isAnimationActive={false}
              />
              <Tooltip formatter={(value) => `₹${value}L`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomaly & Risk Audit Discrepancies Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <h3 className="text-base font-semibold text-gray-900">Audit Discrepancy & Risk Log</h3>
          </div>
          <span className="text-xs text-gray-400">Sample data — not yet connected to the anomaly service</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 rounded-l-md">Audit ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Outlet</th>
                <th className="py-3 px-4">Observed Metric</th>
                <th className="py-3 px-4">Root Cause Context</th>
                <th className="py-3 px-4 rounded-r-md">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/70 transition">
                  <td className="py-3 px-4 font-mono font-medium text-gray-900">{item.id}</td>
                  <td className="py-3 px-4">{item.date}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{item.storeName}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-rose-600">{item.metric}</span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">{item.suspectedCause}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        item.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'Investigating'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {item.status === 'Resolved' && <CheckCircle2 className="h-3 w-3" />}
                      {item.status === 'Investigating' && <Clock className="h-3 w-3" />}
                      {item.status === 'Action Needed' && <AlertTriangle className="h-3 w-3" />}
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}