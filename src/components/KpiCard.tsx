import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  id: string;
  title: string;
  value?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconTextColor?: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  title,
  value = '--',
  description,
  icon: Icon,
  iconBgColor = 'bg-[#e8f3ed]',
  iconTextColor = 'text-[#2d6a4f]',
  trend,
  trendDirection = 'up',
}) => {
  return (
    <div 
      id={id}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">
          {title}
        </h3>
        <div className={`w-10 h-10 rounded-[14px] ${iconBgColor} ${iconTextColor} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-3xl font-black text-[#1e293b] tracking-tight">
          {value}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-slate-500 font-medium truncate">{description}</span>
          
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
              trendDirection === 'up' 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-rose-100 text-rose-700'
            }`}>
              {trendDirection === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
