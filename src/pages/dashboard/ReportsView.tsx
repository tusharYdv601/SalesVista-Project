import React from 'react';
import { BarChart3 } from 'lucide-react';

export const ReportsView: React.FC = () => {
  return (
    <div className="space-y-6" id="reports-tab">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8f3ed] text-[#2d6a4f] text-[11px] font-bold uppercase tracking-wider mb-1">
          <BarChart3 className="w-3.5 h-3.5 text-[#2d6a4f]" />
          Analytics &amp; Reporting
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Comparative Research Reports</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Comprehensive analytical synthesis for academic and practical sales intelligence evaluation.
        </p>

        <div className="p-5 rounded-xl border border-slate-200 bg-[#f8faf9] space-y-2 mt-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">B.Tech CSE Project Deliverable</h4>
            <span className="text-xs bg-emerald-100 text-[#2d6a4f] font-semibold px-2.5 py-0.5 rounded-full">
              Phase Active
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Designed to demonstrate comparative analysis methodologies leveraging Supabase cloud authentication and responsive React component architectures.
          </p>
        </div>
      </div>
    </div>
  );
};
