import React from 'react';
import { PieChart } from 'lucide-react';

export const DemographicsView: React.FC = () => {
  return (
    <div className="space-y-6" id="demographics-tab">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold uppercase tracking-wider mb-1">
          <PieChart className="w-3.5 h-3.5 text-purple-600" />
          Demographic Research Domain
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Demographic Segmentation</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Analyze customer populations based on age brackets, geographic territories, and socio-economic variables.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
            <h4 className="font-bold text-purple-900 text-sm">Age Brackets</h4>
            <p className="text-xs text-purple-800/80">Young adults, working professionals, and families.</p>
          </div>
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
            <h4 className="font-bold text-purple-900 text-sm">Geographic Clusters</h4>
            <p className="text-xs text-purple-800/80">Urban centers, suburban areas, and regional zones.</p>
          </div>
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
            <h4 className="font-bold text-purple-900 text-sm">Preference Affinity</h4>
            <p className="text-xs text-purple-800/80">Category preferences mapped against demographic profiles.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
