import React from 'react';

interface KpiCardProps {
  id: string;
  title: string;
  value?: string;
  description: string;
  statusText?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconTextColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  title,
  value = '--',
  description,
  statusText = 'No data',
  icon: Icon,
  iconBgColor = 'bg-[#e8f3ed]',
  iconTextColor = 'text-[#2d6a4f]',
}) => {
  return (
    <div 
      id={id}
      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow duration-200 space-y-3 flex flex-col justify-between min-w-0"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 tracking-tight truncate">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-xl ${iconBgColor} ${iconTextColor} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {value}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span className="truncate">{description}</span>
          <span className="text-slate-400 font-medium shrink-0 ml-2">{statusText}</span>
        </div>
      </div>
    </div>
  );
};
