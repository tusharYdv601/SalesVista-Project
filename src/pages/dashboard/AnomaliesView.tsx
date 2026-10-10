import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookmarkCheck,
  Check,
  CheckCircle2,
  IndianRupee,
  Filter,
  Network,
  Percent,
  RefreshCw,
  Sliders,
  TrendingDown,
  TrendingUp,
  Trees,
  Users,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TimelinePoint {
  date: string;
  sku_id: string;
  category: string;
  observed_sales: number;
  baseline: number;
  upper_bound: number;
  lower_bound: number;
  residual: number;
  z_score: number;
  peer_median: number;
  peer_discrepancy_score: number;
  revenue?: number;
  margin_pct?: number;
  aov?: number;
  isolation_score?: number;
  feedback_status?: 'UNREVIEWED' | 'EXPECTED' | 'CONFIRMED_ISSUE' | 'RESOLVED';
  feedback_notes?: string;
  anomaly_type:
    | 'DISCOUNT_MARGIN_COLLAPSE'
    | 'MARGIN_COMPRESSION'
    | 'ISOLATED_ENTITY_SHOCK'
    | 'CATEGORY_WIDE_TREND'
    | 'PEER_DIVERGENCE'
    | 'MULTI_DIMENSIONAL_OUTLIER'
    | 'NORMAL';
  severity: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  direction: 'SPIKE' | 'DROP' | 'NORMAL';
  is_anomaly: boolean;
}

interface AnomalyResponse {
  status: string;
  metadata: {
    window_days: number;
    threshold_sigma: number;
    peer_threshold_ratio: number;
    min_margin_pct_threshold?: number;
    contamination_rate?: number;
    total_points: number;
    anomalies_count: number;
    margin_collapses?: number;
    isolated_shocks: number;
    category_surges: number;
  };
  timeline: TimelinePoint[];
  anomalies: TimelinePoint[];
}

export const AnomaliesView: React.FC = () => {
  const [windowDays, setWindowDays] = useState<number>(7);
  const [thresholdSigma, setThresholdSigma] = useState<number>(2.5);
  const [peerThreshold, setPeerThreshold] = useState<number>(2.0);
  const [minMarginThreshold, setMinMarginThreshold] = useState<number>(15.0);
  const [contaminationRate, setContaminationRate] = useState<number>(0.05);
  const [selectedSku, setSelectedSku] = useState<string>('SKU-001');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AnomalyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnomalies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          window_days: windowDays,
          threshold_sigma: thresholdSigma,
          peer_threshold_ratio: peerThreshold,
          min_margin_pct_threshold: minMarginThreshold,
          contamination_rate: contaminationRate,
          history: [],
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const json: AnomalyResponse = await res.json();
      setData(json);

      // Auto-select first available SKU if current is not in list
      if (json.timeline && json.timeline.length > 0) {
        const skus = Array.from(new Set(json.timeline.map((item) => item.sku_id)));
        if (!skus.includes(selectedSku) && skus[0]) {
          setSelectedSku(skus[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Python anomaly service');
    } finally {
      setLoading(false);
    }
  };

  // Feature 5: Acknowledge & submit operational feedback
  const handleAcknowledgeAnomaly = async (sku_id: string, date: string, status: string) => {
    try {
      await fetch('http://127.0.0.1:8000/api/anomalies/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku_id,
          date,
          feedback_status: status,
          notes: 'Marked by manager via dashboard',
        }),
      });
      fetchAnomalies();
    } catch (err) {
      console.error('Failed to submit feedback', err);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [windowDays, thresholdSigma, peerThreshold, minMarginThreshold, contaminationRate]);

  const availableSkus = useMemo(() => {
    if (!data?.timeline) return [];
    return Array.from(new Set(data.timeline.map((item) => item.sku_id)));
  }, [data]);

  const filteredTimeline = useMemo(() => {
    if (!data?.timeline) return [];
    return data.timeline.filter((item) => item.sku_id === selectedSku);
  }, [data, selectedSku]);

  const filteredAnomalies = useMemo(() => {
    if (!data?.anomalies) return [];
    return data.anomalies.filter((item) => item.sku_id === selectedSku);
  }, [data, selectedSku]);

  const anomalyChartPoints = useMemo(() => {
    return filteredTimeline
      .filter((d) => d.is_anomaly)
      .map((d) => ({
        date: d.date,
        observed_sales: d.observed_sales,
        severity: d.severity,
      }));
  }, [filteredTimeline]);

  return (
    <div className="space-y-6" id="anomalies-tab">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Network className="w-3.5 h-3.5 text-indigo-600" />
              Feature 1, 2, 3, 4 &amp; 5 • Residuals + Peer Discrepancy + Elasticity + IsoForest + Human-in-the-Loop Review
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Cross-Entity Outlier Attribution</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Differentiating localized inventory and store shocks from category-wide market trends using cohort dispersion and operator feedback loops.
            </p>
          </div>

          <button
            onClick={fetchAnomalies}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recompute Baseline
          </button>
        </div>

        {/* Hyperparameter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                Rolling Window: {windowDays}d
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Baseline temporal smoothing span</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                Z-Threshold: {thresholdSigma.toFixed(1)}σ
              </span>
            </div>
            <input
              type="range"
              min={1.5}
              max={4.0}
              step={0.1}
              value={thresholdSigma}
              onChange={(e) => setThresholdSigma(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Robust MAD trigger boundary</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Peer Discrepancy: {peerThreshold.toFixed(1)}x IQR
              </span>
            </div>
            <input
              type="range"
              min={1.2}
              max={4.0}
              step={0.1}
              value={peerThreshold}
              onChange={(e) => setPeerThreshold(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Category peer divergence trigger</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-slate-500" />
                Margin Floor: {minMarginThreshold}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={minMarginThreshold}
              onChange={(e) => setMinMarginThreshold(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Discount &amp; margin erosion floor</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Trees className="w-3.5 h-3.5 text-slate-500" />
                IsoForest Contamination: {(contaminationRate * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0.01}
              max={0.15}
              step={0.01}
              value={contaminationRate}
              onChange={(e) => setContaminationRate(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Multi-feature tree outlier density</p>
          </div>

          <div className="space-y-1.5 md:col-span-5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              Target Entity
            </label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {availableSkus.map((sku) => (
                <option key={sku} value={sku}>
                  {sku}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">Active evaluation entity</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Anomalies</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {data?.metadata.anomalies_count ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Across analyzed time series</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-500">Margin Collapses</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              {data?.metadata.margin_collapses ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Discount erosion below floor</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Market Surges</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">
              {data?.metadata.category_surges ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Category-wide co-movement</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Latest Peer Median</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">
              {filteredTimeline.slice(-1)[0]?.peer_median ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Daily cohort benchmark</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Entity vs. Category Peer Baseline
            </h3>
            <p className="text-xs text-slate-500">
              Contrasting entity observed sales with historical MAD baseline envelope and category cohort median.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 sm:mt-0">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span> Observed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Temporal Baseline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Peer Cohort Median
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Outlier Point
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Evaluating temporal and peer baselines...
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-xs text-rose-500">
              {error}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={25} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                />

                {/* Dynamic MAD Upper & Lower Bands */}
                <Area
                  type="monotone"
                  dataKey="upper_bound"
                  stroke="none"
                  fill="#fef3c7"
                  fillOpacity={0.6}
                  name="Upper Band"
                />
                <Area
                  type="monotone"
                  dataKey="lower_bound"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name="Lower Band"
                />

                {/* Rolling Baseline */}
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Own Baseline"
                />

                {/* Peer Cohort Baseline */}
                <Line
                  type="monotone"
                  dataKey="peer_median"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                  name="Category Peer Median"
                />

                {/* Actual Sales */}
                <Line
                  type="monotone"
                  dataKey="observed_sales"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={false}
                  name="Observed Sales"
                />

                {/* Detected Outliers */}
                <Scatter
                  data={anomalyChartPoints}
                  dataKey="observed_sales"
                  fill="#ef4444"
                  shape="circle"
                  name="Detected Anomaly"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Attribution Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Root-Cause Attribution Ledger</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {filteredAnomalies.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Observed Sales</th>
                <th className="py-3 px-4">Cohort Median</th>
                <th className="py-3 px-4">Gross Margin %</th>
                <th className="py-3 px-4">Temporal Z-Score</th>
                <th className="py-3 px-4">Peer Discrepancy</th>
                <th className="py-3 px-4">IsoForest Score</th>
                <th className="py-3 px-4">Attribution Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAnomalies.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
                    No anomalies found within the selected thresholds ({thresholdSigma}σ / {peerThreshold}x IQR).
                  </td>
                </tr>
              ) : (
                filteredAnomalies.map((item, idx) => (
                  <tr key={`${item.sku_id}-${item.date}-${idx}`} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{item.date}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{item.sku_id}</span>
                      <span className="text-[10px] text-slate-400 block">{item.category}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.observed_sales}</td>
                    <td className="py-3 px-4 text-indigo-600 font-medium">{item.peer_median}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono font-bold ${
                          (item.margin_pct ?? 45) < minMarginThreshold ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.margin_pct ?? 45}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {item.z_score > 0 ? `+${item.z_score}` : item.z_score}σ
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {item.peer_discrepancy_score > 0 ? `+${item.peer_discrepancy_score}` : item.peer_discrepancy_score}x
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] ${
                          (item.isolation_score ?? 0) >= 0.65 ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {((item.isolation_score ?? 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.anomaly_type === 'DISCOUNT_MARGIN_COLLAPSE'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.anomaly_type === 'ISOLATED_ENTITY_SHOCK'
                            ? 'bg-rose-100 text-rose-800'
                            : item.anomaly_type === 'CATEGORY_WIDE_TREND'
                            ? 'bg-blue-100 text-blue-800'
                            : item.anomaly_type === 'MULTI_DIMENSIONAL_OUTLIER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {item.anomaly_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : item.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.feedback_status === 'EXPECTED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <BookmarkCheck className="w-3 h-3" /> Planned Promo
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledgeAnomaly(item.sku_id, item.date, 'EXPECTED')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Acknowledge event as a known marketing promotion or holiday clearance"
                        >
                          <Check className="w-3 h-3 text-slate-500" /> Mark Planned
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};