import React from 'react';
import { TrendingUp } from 'lucide-react';

export const ForecastingView: React.FC = () => {
  return (
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
  );
};
