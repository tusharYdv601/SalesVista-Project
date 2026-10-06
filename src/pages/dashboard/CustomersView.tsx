import React from 'react';
import { Users } from 'lucide-react';

export const CustomersView: React.FC = () => {
  return (
    <div className="space-y-6" id="customers-tab">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-1">
          <Users className="w-3.5 h-3.5 text-blue-600" />
          Customer Research Domain
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Customer Behavior &amp; Segments</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Purchasing trends, basket sizes, recurring visits, and client retention patterns.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-5 rounded-xl border border-slate-100 bg-[#f8faf9] space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">Purchase Frequency</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluate returning vs first-time shoppers to derive engagement metrics.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-slate-100 bg-[#f8faf9] space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">Average Order Value</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Analyze ticket sizes across different customer tiers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
