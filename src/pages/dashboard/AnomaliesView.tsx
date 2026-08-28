import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const AnomaliesView: React.FC = () => {
  return (
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
  );
};
