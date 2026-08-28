import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ResearchCardProps {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconTextColor?: string;
  accentHoverBorder?: string;
  actionTextColor?: string;
  onClick: () => void;
}

export const ResearchCard: React.FC<ResearchCardProps> = ({
  id,
  title,
  description,
  badge,
  badgeColor = 'bg-emerald-100 text-emerald-800',
  icon: Icon,
  iconBgColor = 'bg-emerald-50',
  iconTextColor = 'text-[#2d6a4f]',
  accentHoverBorder = 'hover:border-[#2d6a4f]/50',
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
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium">Research Module</span>
        <span className={`font-semibold ${actionTextColor} inline-flex items-center gap-1 group-hover:underline`}>
          Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
};
