import React, { useState, useEffect, useMemo } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, Layers, ShieldCheck, RefreshCw, Sliders, 
  Percent, ArrowUpRight, ArrowDownRight, Package, Download, Clock, Building2, Grid, Tag,
  GitFork, ArrowRightLeft, DollarSign, Activity, BarChart3, AlertCircle
} from 'lucide-react';
import { ForecastDataPoint } from '../../types';

type EchelonLevel = 'sku' | 'category' | 'company';

const CROSS_ELASTICITY_MATRIX: { [key: string]: { [key: string]: number } } = {
  'SKU-001': { 'SKU-001': -1.45, 'SKU-002': 0.12, 'SKU-003': 0.48 },
  'SKU-002': { 'SKU-001': 0.08, 'SKU-002': -1.20, 'SKU-003': 0.15 },
  'SKU-003': { 'SKU-001': 0.52, 'SKU-002': 0.10, 'SKU-003': -1.60 },
};

const SKU_BASE_PRICES: { [key: string]: number } = {
  'SKU-001': 49.99,
  'SKU-002': 199.99,
  'SKU-003': 79.99,
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export const ForecastingView: React.FC = () => {
  const [horizon, setHorizon] = useState<number>(30);
  const [echelon, setEchelon] = useState<EchelonLevel>('sku');
  const [selectedSku, setSelectedSku] = useState<string>('SKU-001');
  const [selectedCategory, setSelectedCategory] = useState<string>('Apparel');
  
  const [data, setData] = useState<ForecastDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Scenario Simulator Controls
  const [simulatedPriceChange, setSimulatedPriceChange] = useState<number>(0);
  const [promoBoostEnabled, setPromoBoostEnabled] = useState<boolean>(false);
  const [enableCannibalization, setEnableCannibalization] = useState<boolean>(true);

  // Inventory Controls
  const [leadTimeDays, setLeadTimeDays] = useState<number>(5);
  const [serviceLevelZ, setServiceLevelZ] = useState<number>(1.65);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horizon_days: horizon, history: [] }),
      signal: controller.signal,
    })
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.detail ?? 'Failed to fetch from AI Forecasting Engine');
        }
        return res.json();
      })
      .then(json => setData(json.data))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(err.message || 'Error connecting to model backend.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort(); // cancel stale request when horizon changes / unmount
  }, [horizon, reloadKey]);

  const availableCategories = useMemo(() => Array.from(new Set(data.map(d => d.category))), [data]);
  const availableSkus = useMemo(() => Array.from(new Set(data.map(d => d.sku_id))), [data]);

  const primaryElasticity = CROSS_ELASTICITY_MATRIX[selectedSku]?.[selectedSku] ?? -1.45;
  const basePrice = SKU_BASE_PRICES[selectedSku] || 50;
  const effectivePrice = basePrice * (1 + simulatedPriceChange / 100);

  const cannibalizationDisplacement = useMemo(() => {
    if (!enableCannibalization || simulatedPriceChange === 0) {
      return availableSkus.map(sku => ({
        sku,
        crossElasticity: CROSS_ELASTICITY_MATRIX[selectedSku]?.[sku] || 0,
        volumeDisplacementPct: 0,
        unitsDisplaced: 0,
        revenueImpact: 0,
      }));
    }

    return availableSkus.map(targetSku => {
      if (targetSku === selectedSku) {
        return {
          sku: targetSku,
          crossElasticity: primaryElasticity,
          volumeDisplacementPct: 0,
          unitsDisplaced: 0,
          revenueImpact: 0,
        };
      }

      const crossE = CROSS_ELASTICITY_MATRIX[selectedSku]?.[targetSku] || 0.2;
      const volumeDisplacementPct = (crossE * (simulatedPriceChange / 100)) * 100;
      
      const targetBaseDemand = data
        .filter(d => d.sku_id === targetSku)
        .reduce((acc, cur) => acc + cur.pred_p50, 0);

      const unitsDisplaced = Math.round(targetBaseDemand * (volumeDisplacementPct / 100));
      const targetPrice = SKU_BASE_PRICES[targetSku] || 50;
      const revenueImpact = Math.round(unitsDisplaced * targetPrice);

      return {
        sku: targetSku,
        crossElasticity: crossE,
        volumeDisplacementPct: Number(volumeDisplacementPct.toFixed(1)),
        unitsDisplaced,
        revenueImpact,
      };
    });
  }, [data, selectedSku, simulatedPriceChange, enableCannibalization, availableSkus, primaryElasticity]);

  const totalCannibalizedUnits = cannibalizationDisplacement.reduce((acc, cur) => acc + cur.unitsDisplaced, 0);
  const totalCannibalizedRevenue = cannibalizationDisplacement.reduce((acc, cur) => acc + cur.revenueImpact, 0);

  const echelonAggregatedData = useMemo(() => {
    if (data.length === 0) return [];

    if (echelon === 'sku') {
      return data.filter(d => d.sku_id === selectedSku);
    }

    if (echelon === 'category') {
      const catData = data.filter(d => d.category === selectedCategory);
      const grouped: { [date: string]: ForecastDataPoint } = {};
      catData.forEach(item => {
        if (!grouped[item.date]) {
          grouped[item.date] = {
            date: item.date,
            sku_id: 'ALL_SKUS',
            category: selectedCategory,
            pred_p10: 0,
            pred_p50: 0,
            pred_p90: 0,
            elasticity: item.elasticity
          };
        }
        grouped[item.date].pred_p10 += item.pred_p10;
        grouped[item.date].pred_p50 += item.pred_p50;
        grouped[item.date].pred_p90 += item.pred_p90;
      });
      return Object.values(grouped);
    }

    const grouped: { [date: string]: ForecastDataPoint } = {};
    data.forEach(item => {
      if (!grouped[item.date]) {
        grouped[item.date] = {
          date: item.date,
          sku_id: 'TOTAL_ENTERPRISE',
          category: 'ALL_CATEGORIES',
          pred_p10: 0,
          pred_p50: 0,
          pred_p90: 0,
          elasticity: -1.35
        };
      }
      grouped[item.date].pred_p10 += item.pred_p10;
      grouped[item.date].pred_p50 += item.pred_p50;
      grouped[item.date].pred_p90 += item.pred_p90;
    });
    return Object.values(grouped);
  }, [data, echelon, selectedSku, selectedCategory]);

  const simulatedData = useMemo(() => {
    const priceRatio = (1 + simulatedPriceChange / 100);
    const elasticityMultiplier = Math.pow(Math.max(priceRatio, 0.01), primaryElasticity);
    const promoMultiplier = promoBoostEnabled ? 1.25 : 1.0;
    const totalMultiplier = elasticityMultiplier * promoMultiplier;

    return echelonAggregatedData.map(item => {
      const simP10 = Math.round(item.pred_p10 * totalMultiplier);
      const simP50 = Math.round(item.pred_p50 * totalMultiplier);
      const simP90 = Math.round(item.pred_p90 * totalMultiplier);

      return {
        ...item,
        pred_p10: simP10,
        pred_p50: simP50,
        pred_p90: simP90,
        baseline_p50: item.pred_p50,
        projected_revenue: Math.round(simP50 * effectivePrice)
      };
    });
  }, [echelonAggregatedData, simulatedPriceChange, promoBoostEnabled, primaryElasticity, effectivePrice]);

  // Aggregate Metrics & Scorecards
  const totalBaseUnits = echelonAggregatedData.reduce((acc, cur) => acc + cur.pred_p50, 0);
  const totalSimUnits = simulatedData.reduce((acc, cur) => acc + cur.pred_p50, 0);
  const totalP10Units = simulatedData.reduce((acc, cur) => acc + cur.pred_p10, 0);
  const totalP90Units = simulatedData.reduce((acc, cur) => acc + cur.pred_p90, 0);
  const grossSimRevenue = simulatedData.reduce((acc, cur) => acc + (cur.projected_revenue || 0), 0);
  const netPortfolioRevenue = grossSimRevenue + totalCannibalizedRevenue;
  const unitDeltaPercent = totalBaseUnits > 0 ? (((totalSimUnits - totalBaseUnits) / totalBaseUnits) * 100).toFixed(1) : "0.0";
  const uncertaintySpreadPct = totalSimUnits > 0 ? (((totalP90Units - totalP10Units) / totalSimUnits) * 100).toFixed(0) : "0";

  // Inventory & Safety Stock Calculations
  const inventoryMetrics = useMemo(() => {
    if (simulatedData.length === 0) return { avgDailyDemand: 0, leadTimeDemand: 0, safetyStock: 0, reorderPoint: 0, leadTimeShare: 50, safetyShare: 50 };

    const avgDailyDemand = totalSimUnits / simulatedData.length;
    const leadTimeDemand = avgDailyDemand * leadTimeDays;
    const avgDailyStdDev = simulatedData.reduce((acc, cur) => acc + ((cur.pred_p90 - cur.pred_p10) / (2 * 1.28)), 0) / simulatedData.length;
    
    const safetyStock = Math.ceil(serviceLevelZ * avgDailyStdDev * Math.sqrt(leadTimeDays));
    const reorderPoint = Math.ceil(leadTimeDemand + safetyStock);

    const totalRop = leadTimeDemand + safetyStock || 1;
    const leadTimeShare = Math.round((leadTimeDemand / totalRop) * 100);
    const safetyShare = 100 - leadTimeShare;

    return {
      avgDailyDemand: Math.round(avgDailyDemand),
      leadTimeDemand: Math.round(leadTimeDemand),
      safetyStock,
      reorderPoint,
      leadTimeShare,
      safetyShare
    };
  }, [simulatedData, leadTimeDays, serviceLevelZ, totalSimUnits]);

  // CSV Export
  const exportForecastToCSV = () => {
    if (simulatedData.length === 0) return;
    const headers = ["Date", "Level", "Identifier", "P10 (Min)", "P50 (Median)", "P90 (Max)", "Baseline P50", "Gross Rev ($)", "Net Portfolio Rev ($)"];
    const rows = simulatedData.map(d => [
      d.date,
      echelon.toUpperCase(),
      echelon === 'sku' ? d.sku_id : echelon === 'category' ? d.category : 'ENTERPRISE',
      d.pred_p10,
      d.pred_p50,
      d.pred_p90,
      d.baseline_p50,
      d.projected_revenue,
      netPortfolioRevenue
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `forecast_${echelon}_${horizon}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="forecasting-tab">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#2d6a4f]" />
              Research Module • AI Forecasting
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Executive Forecasting & Inventory Engine</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Causal elasticity estimation, cross-SKU cannibalization, and coherent hierarchical rollups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              onClick={exportForecastToCSV}
              disabled={simulatedData.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <button 
              onClick={() => setReloadKey(k => k + 1)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] hover:bg-[#245740] text-white rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-run Model
            </button>
          </div>
        </div>

        {/* Echelon Hierarchy Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scope:</span>
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setEchelon('sku')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  echelon === 'sku' ? 'bg-[#2d6a4f] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-3 h-3" />
                Single SKU
              </button>
              <button
                type="button"
                onClick={() => setEchelon('category')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  echelon === 'category' ? 'bg-[#2d6a4f] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3 h-3" />
                Category Total
              </button>
              <button
                type="button"
                onClick={() => setEchelon('company')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  echelon === 'company' ? 'bg-[#2d6a4f] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3 h-3" />
                Company Total
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {echelon === 'sku' && (
              <select 
                value={selectedSku} 
                onChange={(e) => setSelectedSku(e.target.value)}
                className="bg-white text-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {availableSkus.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            {echelon === 'category' && (
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white text-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {availableCategories.map(c => <option key={c} value={c}>{c} Category</option>)}
              </select>
            )}

            <select 
              value={horizon} 
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="bg-white text-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value={14}>14 Days Horizon</option>
              <option value={30}>30 Days Horizon</option>
              <option value={60}>60 Days Horizon</option>
            </select>
          </div>
        </div>

        {/* Highlight KPI Stat Cards Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Total Demand Card */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-linear-to-br from-white to-slate-50 shadow-2xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Projected Demand</span>
              <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
                Number(unitDeltaPercent) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {Number(unitDeltaPercent) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {unitDeltaPercent}%
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalSimUnits.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-medium">units</span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
              <span>Baseline: {totalBaseUnits.toLocaleString()}</span>
              <span className="font-semibold text-slate-700">{totalSimUnits - totalBaseUnits >= 0 ? `+${totalSimUnits - totalBaseUnits}` : totalSimUnits - totalBaseUnits}</span>
            </div>
          </div>

          {/* Net Portfolio Revenue Card */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-linear-to-br from-white to-slate-50 shadow-2xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Portfolio Rev</span>
              <div className="p-1 rounded-md bg-emerald-50 text-[#2d6a4f]">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">${netPortfolioRevenue.toLocaleString()}</span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
              <span>Gross: ${grossSimRevenue.toLocaleString()}</span>
              {totalCannibalizedRevenue !== 0 ? (
                <span className="font-semibold text-amber-700">${totalCannibalizedRevenue.toLocaleString()} cannibalized</span>
              ) : (
                <span className="text-emerald-700 font-semibold">100% Direct</span>
              )}
            </div>
          </div>

          {/* Uncertainty Band Spread Card */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-linear-to-br from-white to-slate-50 shadow-2xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Risk Range (P10 - P90)</span>
              <div className="p-1 rounded-md bg-indigo-50 text-indigo-700">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">&plusmn;{uncertaintySpreadPct}%</span>
              <span className="text-xs text-slate-500 font-medium">volatility</span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
              <span>Min: {totalP10Units.toLocaleString()}</span>
              <span className="font-semibold text-slate-700">Surge: {totalP90Units.toLocaleString()}</span>
            </div>
          </div>

          {/* Reorder Point Card */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-linear-to-br from-white to-slate-50 shadow-2xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reorder Point (ROP)</span>
              <div className="p-1 rounded-md bg-purple-50 text-purple-700">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-900">{inventoryMetrics.reorderPoint.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-medium">units trigger</span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
              <span>Lead: {inventoryMetrics.leadTimeDemand}</span>
              <span className="font-semibold text-emerald-700">Buffer: +{inventoryMetrics.safetyStock}</span>
            </div>
          </div>
        </div>

        {/* Visual Scenario Simulator */}
        <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2d6a4f]" />
              <h3 className="text-sm font-bold text-slate-800">
                Interactive "What-If" Simulator ({echelon.toUpperCase()} Level)
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEnableCannibalization(!enableCannibalization)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  enableCannibalization 
                    ? 'bg-amber-100/80 border-amber-300 text-amber-900' 
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                Cannibalization Guard: {enableCannibalization ? 'ON' : 'OFF'}
              </button>
              <span className="text-xs text-slate-500">
                Own Elasticity (<span className="font-semibold text-[#2d6a4f]">&epsilon; = {primaryElasticity}</span>)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Price Adjustment</span>
                <span className={simulatedPriceChange < 0 ? 'text-emerald-700 font-bold' : simulatedPriceChange > 0 ? 'text-amber-700 font-bold' : 'text-slate-700 font-bold'}>
                  {simulatedPriceChange > 0 ? `+${simulatedPriceChange}%` : `${simulatedPriceChange}%`} (${effectivePrice.toFixed(2)})
                </span>
              </div>
              <input 
                type="range" 
                min="-30" 
                max="30" 
                step="5"
                value={simulatedPriceChange}
                onChange={(e) => setSimulatedPriceChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2d6a4f]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>-30% Markdown</span>
                <span>Base Price</span>
                <span>+30% Premium</span>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-2">
              <span className="text-xs font-semibold text-slate-700">Promotional Campaign</span>
              <button
                type="button"
                onClick={() => setPromoBoostEnabled(!promoBoostEnabled)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  promoBoostEnabled 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{promoBoostEnabled ? 'Active (+25% Lift)' : 'No Campaign'}</span>
                <Percent className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual Volume Comparison Bar */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-700">
                <span>Demand Shift Comparison</span>
                <span className={Number(unitDeltaPercent) >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {Number(unitDeltaPercent) >= 0 ? `+${unitDeltaPercent}%` : `${unitDeltaPercent}%`}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-slate-300 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalBaseUnits / Math.max(totalBaseUnits, totalSimUnits)) * 100)}%` }}
                  title={`Baseline: ${totalBaseUnits}`}
                />
                <div 
                  className={`h-full transition-all duration-300 ${totalSimUnits >= totalBaseUnits ? 'bg-[#2d6a4f]' : 'bg-rose-500'}`}
                  style={{ width: `${Math.abs(Number(unitDeltaPercent))}%` }}
                  title={`Simulated: ${totalSimUnits}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Base: {totalBaseUnits.toLocaleString()}</span>
                <span className="font-semibold text-slate-700">Sim: {totalSimUnits.toLocaleString()} units</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-SKU Cannibalization Matrix Display */}
        {enableCannibalization && (
          <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Cross-SKU Cannibalization Matrix & Displacement Penalty
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                Cross-Elasticity: &epsilon;<sub>ji</sub> = (%&Delta;Q<sub>j</sub>) / (%&Delta;P<sub>i</sub>)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {cannibalizationDisplacement.map(item => (
                <div 
                  key={item.sku} 
                  className={`p-3 rounded-lg border text-xs ${
                    item.sku === selectedSku 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className={item.sku === selectedSku ? 'text-emerald-900' : 'text-slate-800'}>
                      {item.sku} {item.sku === selectedSku ? '(Target Intervention)' : ''}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                      &epsilon; = {item.crossElasticity}
                    </span>
                  </div>
                  
                  {item.sku === selectedSku ? (
                    <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                      Direct Volume Shift: {unitDeltaPercent}% ({totalSimUnits - totalBaseUnits} units)
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                      <div>Displacement: <span className="font-semibold text-amber-800">{item.volumeDisplacementPct}%</span> ({item.unitsDisplaced} units)</div>
                      <div>Displaced Rev: <span className="font-semibold text-slate-700">${item.revenueImpact.toLocaleString()}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Inventory Planning & Safety Stock Progress Bar */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2d6a4f]" />
              <h3 className="text-sm font-bold text-slate-800">
                Inventory Planning & ROP Composition ({echelon === 'sku' ? selectedSku : echelon === 'category' ? selectedCategory : 'Enterprise Total'})
              </h3>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Lead Time:</span>
                <select
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-hidden"
                >
                  <option value={3}>3 Days</option>
                  <option value={5}>5 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={10}>10 Days</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Coverage:</span>
                <select
                  value={serviceLevelZ}
                  onChange={(e) => setServiceLevelZ(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-hidden"
                >
                  <option value={1.28}>90% Coverage</option>
                  <option value={1.65}>95% Coverage</option>
                  <option value={2.05}>98% Coverage</option>
                </select>
              </div>
            </div>
          </div>

          {/* Linear Breakdown Bar of ROP */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-700 inline-block" />
                Lead Time Transit Demand: {inventoryMetrics.leadTimeDemand} units ({inventoryMetrics.leadTimeShare}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                Buffer Safety Stock: +{inventoryMetrics.safetyStock} units ({inventoryMetrics.safetyShare}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3.5 rounded-lg overflow-hidden flex shadow-inner">
              <div 
                className="bg-slate-700 h-full transition-all duration-300"
                style={{ width: `${inventoryMetrics.leadTimeShare}%` }}
              />
              <div 
                className="bg-emerald-600 h-full transition-all duration-300"
                style={{ width: `${inventoryMetrics.safetyShare}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Daily Demand</div>
              <div className="text-lg font-extrabold text-slate-800 mt-0.5">{inventoryMetrics.avgDailyDemand} units/day</div>
              <div className="text-[11px] text-slate-500">Based on P50 median</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lead Time Demand</div>
              <div className="text-lg font-extrabold text-slate-800 mt-0.5">{inventoryMetrics.leadTimeDemand} units</div>
              <div className="text-[11px] text-slate-500">Across {leadTimeDays} transit days</div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Buffer Safety Stock</div>
              <div className="text-lg font-extrabold text-[#2d6a4f] mt-0.5">+{inventoryMetrics.safetyStock} units</div>
              <div className="text-[11px] text-emerald-700">Absorbs P90 surge risks</div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <div className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Reorder Point (ROP)</div>
              <div className="text-lg font-extrabold text-indigo-900 mt-0.5">{inventoryMetrics.reorderPoint} units</div>
              <div className="text-[11px] text-indigo-700">Trigger PO when stock hits ROP</div>
            </div>
          </div>
        </div>

        {/* Feature Research Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8faf9] flex items-start gap-3">
            <div className="p-2 bg-emerald-100/70 rounded-lg text-[#2d6a4f] mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Tobit Demand Imputation</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Stockout days reconstructed using Inverse Mills ratios to avoid inventory-depletion bias.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8faf9] flex items-start gap-3">
            <div className="p-2 bg-emerald-100/70 rounded-lg text-[#2d6a4f] mt-0.5">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Causal Cross-Elasticity</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Disentangles own-elasticity from sister product cannibalization to protect margins.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8faf9] flex items-start gap-3">
            <div className="p-2 bg-emerald-100/70 rounded-lg text-[#2d6a4f] mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Quantile Bounds (P10–P90)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Pinball loss quantiles feed dynamic safety stocks without static buffer assumptions.
              </p>
            </div>
          </div>
        </div>

        {/* Main Forecast Chart */}
        <div className="pt-2">
          {error ? (
            <div className="flex items-center justify-center p-8 text-rose-600 gap-2 border border-rose-200 bg-rose-50/50 rounded-xl text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error} (Ensure your Python backend is running on port 8000)</span>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-slate-200/80 bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Projected Demand Trajectory • {echelon.toUpperCase()} LEVEL
                </span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-2.5 h-0.5 bg-slate-400 inline-block border-t border-dashed" />
                    Baseline (P50)
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="w-2.5 h-1 bg-[#2d6a4f] inline-block rounded-xs" />
                    Simulated Scenario (P50)
                  </span>
                  <span className="text-slate-400 font-medium">
                    Shaded = 80% CI (P10-P90)
                  </span>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={simulatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px' }}
                      labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="pred_p90" stroke="transparent" fill="url(#confidenceBand)" />
                    <Area type="monotone" dataKey="pred_p10" stroke="transparent" fill="#ffffff" />
                    
                    <Line 
                      type="monotone" 
                      dataKey="baseline_p50" 
                      name="Baseline (P50)" 
                      stroke="#94a3b8" 
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />

                    <Line 
                      type="monotone" 
                      dataKey="pred_p50" 
                      name="Simulated Demand (P50)" 
                      stroke="#2d6a4f" 
                      strokeWidth={2.5} 
                      dot={{ fill: '#2d6a4f', strokeWidth: 1.5, r: 2.5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};