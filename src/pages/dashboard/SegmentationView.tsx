import React from 'react';
import { Layers } from 'lucide-react';

export const SegmentationView: React.FC = () => {
  return (
    <div className="space-y-6" id="segmentation-tab">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold uppercase tracking-wider mb-1">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          Research Module • Machine Learning
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Customer Segmentation (K-Means / RFM)</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Clustering shoppers into High-Value, Champions, At-Risk, and Occasional clusters based on Recency, Frequency, and Monetary scores.
        </p>

        <div className="p-6 rounded-xl border border-dashed border-blue-200 bg-[#f8faf9] text-center space-y-2">
          <Layers className="w-8 h-8 text-blue-600 mx-auto opacity-70" />
          <h4 className="text-sm font-bold text-slate-800">Segmentation Cluster Engine</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            K-Means clustering algorithm configured to segment purchase datasets into behavioral groups.
          </p>
        </div>
      </div>
    </div>
  );
};
