import React from 'react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

interface AnalysisCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconTextColor?: string;
  accentHoverBorder?: string;
  actionText?: string;
  actionTextColor?: string;
  onClick: () => void;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  id,
  title,
  description,
  icon: Icon,
  iconBgColor = 'bg-[#e8f3ed]',
  iconTextColor = 'text-[#2d6a4f]',
  accentHoverBorder = 'hover:border-[#2d6a4f]/50',
  actionText = 'Open Analysis',
  actionTextColor = 'text-[#2d6a4f]',
  onClick,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm ${accentHoverBorder} transition-all duration-200 cursor-pointer group flex flex-col justify-between min-w-0`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className={`w-10 h-10 rounded-xl ${iconBgColor} ${iconTextColor} flex items-center justify-center group-hover:scale-105 transition-transform shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <ChevronRight className={`w-4 h-4 text-slate-300 group-hover:${actionTextColor} group-hover:translate-x-1 transition-all shrink-0`} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className={`mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold ${actionTextColor}`}>
        <span>{actionText}</span>
        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </div>
  );
};
