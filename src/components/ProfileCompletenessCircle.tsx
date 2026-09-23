import React, { useState, useRef, useEffect } from 'react';
import { Employee, LocationItem } from '../types.ts';
import { calculateProfileCompleteness, ProfileCompleteness } from '../utils/completeness.ts';
import { toPersianDigits } from '../utils/shamsi.ts';
import { CheckCircle2, AlertCircle, Check, X, Sparkles, HelpCircle } from 'lucide-react';

interface ProfileCompletenessCircleProps {
  employee: Partial<Employee> | Record<string, any>;
  locations?: LocationItem[];
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const ProfileCompletenessCircle: React.FC<ProfileCompletenessCircleProps> = ({
  employee,
  locations = [],
  size = 'md',
  showLabel = false,
  showBadge = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const completeness: ProfileCompleteness = calculateProfileCompleteness(employee, locations);
  const { percentage, filledCount, totalCount, isComplete, items } = completeness;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Dimension settings
  const config = {
    sm: { size: 36, stroke: 3.2, radius: 14, textClass: 'text-[9px] font-black' },
    md: { size: 46, stroke: 3.8, radius: 18, textClass: 'text-[11px] font-black' },
    lg: { size: 60, stroke: 4.5, radius: 24, textClass: 'text-xs font-black' },
  }[size];

  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Dynamic Color Theme
  let colorScheme = {
    bgStroke: 'stroke-slate-200 dark:stroke-slate-800',
    progressStroke: 'stroke-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    ringGlow: 'hover:ring-rose-400/30',
  };

  if (isComplete || percentage === 100) {
    colorScheme = {
      bgStroke: 'stroke-emerald-100 dark:stroke-emerald-950/80',
      progressStroke: 'stroke-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      ringGlow: 'hover:ring-emerald-400/40',
    };
  } else if (percentage >= 70) {
    colorScheme = {
      bgStroke: 'stroke-indigo-100 dark:stroke-indigo-950/80',
      progressStroke: 'stroke-indigo-600 dark:stroke-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
      ringGlow: 'hover:ring-indigo-400/30',
    };
  } else if (percentage >= 40) {
    colorScheme = {
      bgStroke: 'stroke-amber-100 dark:stroke-amber-950/80',
      progressStroke: 'stroke-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      ringGlow: 'hover:ring-amber-400/30',
    };
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative inline-flex items-center gap-2 select-none ${className}`} ref={popoverRef}>
      {/* Circle Container Button */}
      <button
        type="button"
        onClick={handleToggle}
        title={`تکمیل اطلاعات: ${toPersianDigits(filledCount)} از ${toPersianDigits(totalCount)} فیلد (${toPersianDigits(percentage)}٪)`}
        className={`relative inline-flex items-center justify-center rounded-full transition-transform active:scale-95 focus:outline-none cursor-pointer group ${colorScheme.ringGlow} hover:ring-4`}
        style={{ width: config.size, height: config.size }}
      >
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90 origin-center transition-all duration-500 ease-out"
        >
          {/* Background circle track */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={config.radius}
            fill="transparent"
            strokeWidth={config.stroke}
            className={colorScheme.bgStroke}
          />
          {/* Progress filled arc */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={config.radius}
            fill="transparent"
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorScheme.progressStroke} transition-all duration-700 ease-out`}
          />
        </svg>

        {/* Center Percentage Display */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center text-center font-mono ${config.textClass} ${colorScheme.text}`}>
          <span>{toPersianDigits(percentage)}٪</span>
        </div>

        {/* Small 100% Sparkle Badge */}
        {isComplete && size !== 'sm' && (
          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs border border-white dark:border-slate-900 animate-pulse">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
        )}
      </button>

      {/* Optional Label next to circle */}
      {showLabel && (
        <div className="flex flex-col cursor-pointer" onClick={handleToggle}>
          <span className="text-[10px] text-slate-400 font-medium">تکمیل پرونده</span>
          <span className={`text-xs font-bold font-mono ${colorScheme.text}`}>
            {toPersianDigits(percentage)}٪ ({toPersianDigits(filledCount)}/{toPersianDigits(totalCount)})
          </span>
        </div>
      )}

      {/* Detailed Interactive Popover with 11-field checklist */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 top-full mt-2 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 text-right animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold border ${colorScheme.badgeBg}`}
              >
                {toPersianDigits(percentage)}٪
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  وضعیت تکمیل پرونده کارکنان
                </h4>
                <p className="text-[10px] text-slate-400">
                  {toPersianDigits(filledCount)} از {toPersianDigits(totalCount)} فیلد کلیدی تکمیل شده است
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 11 Fields List */}
          <div className="py-2.5 space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-1.5 px-2 rounded-xl text-xs transition-colors ${
                  item.filled
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 text-slate-800 dark:text-slate-200'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.filled ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                  <span className="font-semibold text-[11px] truncate">{item.label}</span>
                </div>
                <span
                  className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-md ${
                    item.filled
                      ? 'bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'bg-rose-100/70 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {item.filled ? 'تکمیل شد' : 'ثبت‌نشده'}
                </span>
              </div>
            ))}
          </div>

          {/* Popover Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
            {isComplete ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                پرونده این کارمند ۱۰۰٪ کامل و آماده بهره‌برداری است.
              </span>
            ) : (
              <span>برای رسیدن به ۱۰۰٪، فیلدهای قرمز را از دکمه ویرایش تکمیل نمایید.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
