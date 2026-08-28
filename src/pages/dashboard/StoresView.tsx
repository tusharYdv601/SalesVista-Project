import React from 'react';
import { Building2 } from 'lucide-react';

export const StoresView: React.FC = () => {
  return (
    <div className="space-y-6" id="stores-tab">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8f3ed] text-[#2d6a4f] text-[11px] font-bold uppercase tracking-wider mb-1">
          <Building2 className="w-3.5 h-3.5 text-[#2d6a4f]" />
          Store Research Domain
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Comparative Store Performance</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Multi-branch sales distribution, revenue benchmarks, and store-wise transaction volume.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-100 bg-[#f8faf9] space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Branch Outlets</span>
            <h4 className="text-base font-bold text-slate-800">Regional Footprint</h4>
            <p className="text-xs text-slate-500">North, South, Central &amp; Metro branches</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-[#f8faf9] space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Sales Metrics</span>
            <h4 className="text-base font-bold text-slate-800">Transaction Index</h4>
            <p className="text-xs text-slate-500">Peak shopping hours &amp; weekly trends</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-[#f8faf9] space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Growth Delta</span>
            <h4 className="text-base font-bold text-slate-800">Comparative Growth</h4>
            <p className="text-xs text-slate-500">Quarterly growth across retail units</p>
          </div>
        </div>
      </div>
    </div>
  );
};
