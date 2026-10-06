import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateRangePreset = 'all' | '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

interface DateRangePickerProps {
  currentRange: DateRange;
  onChange: (range: DateRange) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ currentRange, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const getDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const getYTDStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  };

  const handlePresetSelect = (preset: DateRangePreset, label: string) => {
    let start = '';
    const end = getTodayStr();

    switch (preset) {
      case 'all':
        start = '2000-01-01'; // Broad enough
        break;
      case '7d':
        start = getDateStr(7);
        break;
      case '30d':
        start = getDateStr(30);
        break;
      case '90d':
        start = getDateStr(90);
        break;
      case 'ytd':
        start = getYTDStr();
        break;
      default:
        return;
    }

    onChange({ preset, label, startDate: start, endDate: end });
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({
        preset: 'custom',
        label: `${customStart} to ${customEnd}`,
        startDate: customStart,
        endDate: customEnd
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm font-semibold text-slate-700"
      >
        <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="min-w-[140px] text-left">{currentRange.label}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Presets</h4>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'All Time (Full Dataset)' },
                { id: '30d', label: 'Last 30 Days' },
                { id: '90d', label: 'Last 90 Days' },
                { id: 'ytd', label: 'Year to Date' },
                { id: '7d', label: 'Last 7 Days' }
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id as DateRangePreset, preset.label)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentRange.preset === preset.id 
                      ? 'bg-emerald-50 text-emerald-700 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50/50">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Custom Range</h4>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 mb-1 block">Start Date</label>
                <input 
                  type="date" 
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 mb-1 block">End Date</label>
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" 
                />
              </div>
            </div>
            <button 
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
              className="w-full bg-[#3d8361] hover:bg-[#2d6a4f] text-white font-bold text-sm py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
