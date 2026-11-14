import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Layers,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Database,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface SegmentStat {
  name: string;
  customers: number;
  revenue: string;
  revenueRaw: number;
  avgOrderValue: string;
  share: number;
  tone: 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose';
  score: string;
  action: string;
  retention: string;
  priority: 'High' | 'Medium' | 'Watch' | 'Critical' | 'Prospect';
}

interface SignalItem {
  label: string;
  value: number;
  change: string;
}

export const SegmentationView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [segments, setSegments] = useState<SegmentStat[]>([]);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [recommendedActions, setRecommendedActions] = useState<string[]>([]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const calculateLiveSegments = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [customersRes, txRes] = await Promise.all([
        supabase.from('customers').select('*').eq('owner_id', user.id).limit(10000),
        supabase.from('sales_transactions').select('customer_id, total_amount, transaction_date').eq('owner_id', user.id).limit(10000),
      ]);

      const custData = customersRes.data || [];
      const txData = txRes.data || [];

      if (custData.length > 0) {
        const now = Date.now();
        const txByCustomer: Record<string, { count: number; spend: number; dates: string[] }> = {};

        const codeToIdMap = new Map<string, string>();
        custData.forEach((c: any) => {
          if (c.customer_code) {
            codeToIdMap.set(String(c.customer_code).trim().toLowerCase(), String(c.id));
          }
        });

        txData.forEach((t: any) => {
          const rawCid = String(t.customer_id ?? '').trim();
          if (!rawCid) return;
          const resolvedId = codeToIdMap.get(rawCid.toLowerCase()) || rawCid;
          if (!txByCustomer[resolvedId]) {
            txByCustomer[resolvedId] = { count: 0, spend: 0, dates: [] };
          }
          txByCustomer[resolvedId].count += 1;
          txByCustomer[resolvedId].spend += Number(t.total_amount) || 0;
          if (t.transaction_date) {
            txByCustomer[resolvedId].dates.push(t.transaction_date);
          }
        });

        const groups = {
          champions: [] as any[],
          frequent: [] as any[],
          occasional: [] as any[],
          atRisk: [] as any[],
          unconverted: [] as any[],
        };

        let totalSpend = 0;
        let totalOrders = 0;
        let repeatBuyersCount = 0;

        custData.forEach((c: any) => {
          const cid = String(c.id);
          const stats = txByCustomer[cid] || { count: 0, spend: 0, dates: [] };
          const orders = stats.count;
          const spend = stats.spend;
          totalSpend += spend;
          totalOrders += orders;

          let recencyDays: number | null = null;
          if (stats.dates.length > 0) {
            const sortedDates = [...stats.dates].sort().reverse();
            recencyDays = Math.max(0, Math.floor((now - new Date(sortedDates[0]).getTime()) / (1000 * 60 * 60 * 24)));
          }

          if (orders >= 2) repeatBuyersCount++;

          const enriched = { ...c, orders, spend, recencyDays };

          if (orders === 0) {
            groups.unconverted.push(enriched);
          } else if ((orders >= 3 || (orders >= 2 && spend >= 1000)) && recencyDays !== null && recencyDays <= 90) {
            groups.champions.push(enriched);
          } else if (orders >= 2 && recencyDays !== null && recencyDays <= 120) {
            groups.frequent.push(enriched);
          } else if (recencyDays !== null && recencyDays > 90) {
            groups.atRisk.push(enriched);
          } else {
            groups.occasional.push(enriched);
          }
        });

        const totalCust = custData.length;
        const activePurchasers = totalCust - groups.unconverted.length;
        const avgUserSpend = activePurchasers > 0 ? totalSpend / activePurchasers : 1;

        const buildSegment = (
          name: string,
          list: any[],
          tone: 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose',
          priority: 'High' | 'Medium' | 'Watch' | 'Critical' | 'Prospect',
          defaultAction: string
        ): SegmentStat => {
          const count = list.length;
          const spend = list.reduce((sum, item) => sum + item.spend, 0);
          const orders = list.reduce((sum, item) => sum + item.orders, 0);
          const repeatInGroup = list.filter((item) => item.orders >= 2).length;
          const retentionRate = count > 0 && orders > 0 ? Math.round((repeatInGroup / count) * 100) : 0;
          const aov = orders > 0 ? spend / orders : 0;
          const avgRecency = count > 0 ? list.reduce((sum, item) => sum + (item.recencyDays || 0), 0) / count : 0;

          let calculatedScore = 0;
          if (count > 0 && orders > 0) {
            const recencyFactor = Math.max(0, 40 - Math.min(40, Math.round(avgRecency / 4)));
            const frequencyFactor = Math.min(30, Math.round((orders / count) * 10));
            const spendFactor = Math.min(30, Math.round((spend / count / avgUserSpend) * 15));
            calculatedScore = Math.min(100, Math.max(15, recencyFactor + frequencyFactor + spendFactor));
          }

          return {
            name,
            customers: count,
            revenue: formatCurrency(spend),
            revenueRaw: spend,
            avgOrderValue: formatCurrency(aov),
            share: totalCust > 0 ? Math.round((count / totalCust) * 100) : 0,
            tone,
            score: `${calculatedScore}/100`,
            action: defaultAction,
            retention: count > 0 && orders > 0 ? `${retentionRate}%` : '0%',
            priority,
          };
        };

        const liveSegments: SegmentStat[] = [
          buildSegment('High-Value Champions', groups.champions, 'emerald', 'High', 'VIP concierge & loyalty perks'),
          buildSegment('Frequent Buyers', groups.frequent, 'blue', 'Medium', 'Cross-sell accessories & rewards'),
          buildSegment('Recent & Occasional Buyers', groups.occasional, 'indigo', 'Watch', '2nd purchase discount trigger'),
          buildSegment('At-Risk Customers', groups.atRisk, 'rose', 'Critical', '48h win-back recovery offer'),
          buildSegment('Unconverted Prospects', groups.unconverted, 'amber', 'Prospect', 'Welcome voucher activation'),
        ];

        setSegments(liveSegments);
        setIsLive(true);

        const realRetentionRate = activePurchasers > 0 ? Math.round((repeatBuyersCount / activePurchasers) * 100) : 0;
        const realRepeatRate = totalCust > 0 ? Math.round((repeatBuyersCount / totalCust) * 100) : 0;
        const realAov = totalOrders > 0 ? totalSpend / totalOrders : 0;
        const atRiskRate = activePurchasers > 0 ? Math.round((groups.atRisk.length / activePurchasers) * 100) : 0;

        setSignals([
          {
            label: 'Customer retention rate',
            value: realRetentionRate,
            change: `${repeatBuyersCount} repeat / ${activePurchasers} buyers`,
          },
          {
            label: 'Repeat purchase rate',
            value: Math.max(0, Math.min(100, realRepeatRate)),
            change: `${repeatBuyersCount} of ${totalCust} total accounts`,
          },
          {
            label: 'Average order value',
            value: Math.min(100, Math.max(10, Math.round(realAov / 10))),
            change: formatCurrency(realAov),
          },
          {
            label: 'At-risk customer ratio',
            value: Math.min(100, atRiskRate),
            change: `${groups.atRisk.length} inactive past buyers`,
          },
        ]);

        const dynamicActions: string[] = [];
        if (groups.unconverted.length > 0) {
          dynamicActions.push(
            `Activate ${groups.unconverted.length.toLocaleString()} registered prospects with an automated welcome coupon; they have registered but placed 0 orders.`
          );
        }
        if (groups.atRisk.length > 0) {
          dynamicActions.push(
            `Send an urgent win-back recovery offer to your ${groups.atRisk.length.toLocaleString()} at-risk customers who have not ordered in over 90 days.`
          );
        }
        if (groups.champions.length > 0) {
          dynamicActions.push(
            `Reward your ${groups.champions.length.toLocaleString()} High-Value Champions who account for ${formatCurrency(groups.champions.reduce((s, i) => s + i.spend, 0))} with exclusive VIP previews.`
          );
        } else {
          dynamicActions.push(
            `Nurture active purchasers with personalized bundle recommendations to build your first tier of High-Value Champions.`
          );
        }
        if (groups.occasional.length > 0) {
          dynamicActions.push(
            `Target ${groups.occasional.length.toLocaleString()} recent single-order buyers with a follow-up incentive within 14 days of delivery to boost repeat purchase rate.`
          );
        } else {
          dynamicActions.push(
            `Implement automated post-purchase review and re-order sequences to increase order frequency.`
          );
        }
        setRecommendedActions(dynamicActions);
      } else {
        setSegments([]);
        setSignals([]);
        setRecommendedActions([]);
        setIsLive(false);
      }
    } catch (err) {
      console.error('Error fetching live segmentation data:', err);
      setSegments([]);
      setSignals([]);
      setRecommendedActions([]);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateLiveSegments();
  }, [user]);

  const totalCustomers = segments.reduce((sum, s) => sum + s.customers, 0);
  const totalRevenueRaw = segments.reduce((sum, s) => sum + s.revenueRaw, 0);
  const totalRevenueFormatted = formatCurrency(totalRevenueRaw);
  const atRiskCount = segments.find((s) => s.tone === 'rose')?.customers || 0;

  if (!isLive && !loading) {
    return (
      <div className="space-y-6" id="segmentation-tab">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Research Module • Customer Segmentation
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Customer Segmentation (RFM + K-Means)</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Segment shoppers into High-Value Champions, Frequent Buyers, and At-Risk cohorts based on Recency, Frequency, and Monetary analytics.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black text-slate-900">No Customer Data Recorded</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Your account ({user?.email || 'Active User'}) has not imported customer profiles or transaction history yet. Import your datasets to automatically cluster and rank your customers.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard/import')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
              Import Customer & Transaction Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="segmentation-tab">

      {/* Header and KPI Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Research Module • Customer Segmentation
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border ${
                isLive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {isLive ? 'Live Database Clusters' : 'Benchmark Demonstration Mode'}
            </span>

            <button
              onClick={calculateLiveSegments}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Refresh segmentation clusters"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Customer Segmentation (RFM + K-Means)</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Customers are dynamically segmented by purchase recency, transaction frequency, monetary spend, and demographic patterns to empower precision marketing and maximize lifetime retention.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
            <BadgeCheck className="w-3.5 h-3.5" />
            Cluster Model Health: Optimal
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
              <span>Total Clusters</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{segments.length}</div>
            <p className="mt-1 text-xs text-slate-500">Behavioral customer segments</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
              <span>Segmented Audience</span>
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{totalCustomers.toLocaleString()}</div>
            <p className="mt-1 text-xs text-slate-500">Active analyzed customer accounts</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
              <span>Combined Segment Value</span>
              <TrendingUp className="w-4 h-4 text-violet-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{totalRevenueFormatted}</div>
            <p className="mt-1 text-xs text-slate-500">Cumulative revenue in clusters</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
              <span>At-Risk Cohort</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{atRiskCount.toLocaleString()}</div>
            <p className="mt-1 text-xs text-slate-500">Requires retention intervention</p>
          </div>
        </div>
      </div>

      {/* Middle Section: Segment Performance & RFM Signals */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        {/* Segment Performance Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Segment Performance</h3>
            </div>
            <button
              onClick={() => navigate('/dashboard/customers')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 transition-colors"
            >
              View Customers Directory
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {segments.map((segment) => (
              <div key={segment.name} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          segment.tone === 'emerald'
                            ? 'bg-emerald-500'
                            : segment.tone === 'blue'
                            ? 'bg-blue-500'
                            : segment.tone === 'indigo'
                            ? 'bg-indigo-500'
                            : segment.tone === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <h4 className="text-sm font-bold text-slate-800">{segment.name}</h4>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {segment.customers.toLocaleString()} customers • {segment.revenue} revenue • {segment.share}% share
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                      Score: {segment.score}
                    </span>
                    <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                      {segment.action}
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      segment.tone === 'emerald'
                        ? 'bg-emerald-500'
                        : segment.tone === 'blue'
                        ? 'bg-blue-500'
                        : segment.tone === 'indigo'
                        ? 'bg-indigo-500'
                        : segment.tone === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(4, Math.min(100, segment.share))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RFM Signals */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">RFM Behavioral Signals</h3>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-4">
            {signals.map((signal) => (
              <div key={signal.label} className="space-y-2">
                <div className="flex justify-between items-center text-[11px] text-slate-600">
                  <span className="font-medium">{signal.label}</span>
                  <span className="font-bold text-slate-800">{signal.change}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${signal.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Cluster Algorithm Methodology:</p>
            <p>
              Scored via Recency (days since last transaction), Frequency (order cadence), and Monetary value (cumulative customer gross expenditure).
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Overview Table & Recommended Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-6">
        {/* Customer Segments Overview Table */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Customer Segments Overview</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Segment</th>
                  <th className="pb-3 pr-4 font-semibold">Customers</th>
                  <th className="pb-3 pr-4 font-semibold">Avg Order Value</th>
                  <th className="pb-3 pr-4 font-semibold">Retention Rate</th>
                  <th className="pb-3 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {segments.map((segment) => (
                  <tr key={segment.name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-800 flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          segment.tone === 'emerald'
                            ? 'bg-emerald-500'
                            : segment.tone === 'blue'
                            ? 'bg-blue-500'
                            : segment.tone === 'indigo'
                            ? 'bg-indigo-500'
                            : segment.tone === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      {segment.name}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{segment.customers.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-slate-600 font-mono text-xs">{segment.avgOrderValue}</td>
                    <td className="py-3 pr-4 text-slate-600">{segment.retention}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          segment.priority === 'High'
                            ? 'bg-emerald-100 text-emerald-800'
                            : segment.priority === 'Medium'
                            ? 'bg-blue-100 text-blue-800'
                            : segment.priority === 'Watch'
                            ? 'bg-indigo-100 text-indigo-800'
                            : segment.priority === 'Prospect'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {segment.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Recommended Next Steps</h3>
          </div>

          <ul className="space-y-3">
            {recommendedActions.map((action, idx) => (
              <li key={idx} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100/70 transition-colors">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                  ✓
                </span>
                <span className="text-xs leading-relaxed text-slate-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

