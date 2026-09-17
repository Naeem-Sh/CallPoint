import React, { useState } from 'react';
import { Employee, LocationItem } from '../../types.ts';
import {
  calculateEmployeesCompletenessStats,
  EmployeesCompletenessStats,
  FieldMissingStat,
} from '../../utils/completeness.ts';
import { toPersianDigits } from '../../utils/shamsi.ts';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  PieChart,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Sparkles,
  BarChart3,
  Layers,
  HelpCircle,
  Archive,
  ArrowLeft,
} from 'lucide-react';

export type CompletenessFilterType =
  | 'all'
  | 'complete' // 100%
  | 'partial' // 50-99%
  | 'incomplete' // < 50%
  | string; // e.g. "missing:room", "missing:direct_phone"

interface AdminCompletenessStatsProps {
  employees: Employee[];
  locations: LocationItem[];
  activeFilter: CompletenessFilterType;
  onSelectFilter: (filter: CompletenessFilterType) => void;
  archivedCount?: number;
  onViewArchive?: () => void;
}

export const AdminCompletenessStats: React.FC<AdminCompletenessStatsProps> = ({
  employees,
  locations,
  activeFilter,
  onSelectFilter,
  archivedCount = 0,
  onViewArchive,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFieldDetails, setShowFieldDetails] = useState(false);

  const stats: EmployeesCompletenessStats = React.useMemo(() => {
    return calculateEmployeesCompletenessStats(employees, locations);
  }, [employees, locations]);

  if (employees.length === 0) return null;

  // Active filter label for banner
  let activeFilterLabel = '';
  if (activeFilter === 'complete') activeFilterLabel = 'فقط پرونده‌های ۱۰۰٪ کامل';
  else if (activeFilter === 'partial') activeFilterLabel = 'پرونده‌های در حال تکمیل (۵۰٪ تا ۹۹٪)';
  else if (activeFilter === 'incomplete') activeFilterLabel = 'پرونده‌های نیازمند اقدام فوری (زیر ۵۰٪)';
  else if (activeFilter.startsWith('missing:')) {
    const fieldId = activeFilter.replace('missing:', '');
    const found = stats.fieldStats.find((f) => f.id === fieldId);
    activeFilterLabel = found ? `کارکنان بدون ${found.label}` : `فاقد فیلد ${fieldId}`;
  }

  // SVG parameters for big circle
  const size = 68;
  const strokeWidth = 6.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (stats.averagePercentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
      {/* Card Header & Toggle */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-950/60 dark:via-indigo-950/10 dark:to-slate-950/60 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-sm shadow-indigo-600/20">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                آمار و وضعیت تکمیل پرونده‌های کارکنان
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100/70 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                بر مبنای ۱۱ فیلد کلیدی
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              میانگین آمادگی اطلاعات، تفکیک وضعیت‌ها و تحلیل کسری فیلدها در سازمان
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectFilter('all')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold border border-indigo-200/60 dark:border-indigo-800/60 transition-colors cursor-pointer"
              title="حذف فیلتر و نمایش همه"
            >
              <X className="w-3.5 h-3.5" />
              <span>نمایش تمام کارکنان</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? 'بستن پنل آمار' : 'باز کردن پنل آمار'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Overall Average Completeness */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-slate-50 to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  میانگین تکمیل کل کارکنان
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                    {toPersianDigits(stats.averagePercentage)}٪
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    از ۱۱ فیلد
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  مجموع {toPersianDigits(stats.totalEmployees)} نفر کارمند
                </span>
              </div>

              {/* Mini Ring Meter */}
              <div className="relative shrink-0 flex items-center justify-center">
                <svg width={size} height={size} className="-rotate-90">
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className="stroke-slate-200 dark:stroke-slate-800 fill-none"
                    strokeWidth={strokeWidth}
                  />
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className="stroke-indigo-600 dark:stroke-indigo-400 fill-none transition-all duration-700 ease-out"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-black font-mono text-xs text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* 2. 100% Completed Profiles Card (Filterable) */}
            <button
              type="button"
              onClick={() =>
                onSelectFilter(activeFilter === 'complete' ? 'all' : 'complete')
              }
              className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between group ${
                activeFilter === 'complete'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800/80 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                  پرونده‌های ۱۰۰٪ تکمیل
                </span>
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {toPersianDigits(stats.completeCount)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    نفر
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {toPersianDigits(stats.completePercent)}٪ کل
                </span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span>{activeFilter === 'complete' ? 'فیلتر فعال است' : 'کلیک جهت فیلتر'}</span>
                <Filter className="w-3 h-3" />
              </div>
            </button>

            {/* 3. Partial (50%-99%) Profiles Card (Filterable) */}
            <button
              type="button"
              onClick={() =>
                onSelectFilter(activeFilter === 'partial' ? 'all' : 'partial')
              }
              className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between group ${
                activeFilter === 'partial'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800/80 hover:bg-amber-50/30 dark:hover:bg-amber-950/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                  در حال تکمیل (۵۰٪ تا ۹۹٪)
                </span>
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                    {toPersianDigits(stats.partialCount)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    نفر
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  {toPersianDigits(stats.partialPercent)}٪ کل
                </span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <span>{activeFilter === 'partial' ? 'فیلتر فعال است' : 'کلیک جهت فیلتر'}</span>
                <Filter className="w-3 h-3" />
              </div>
            </button>

            {/* 4. Incomplete (<50%) Profiles Card (Filterable) */}
            <button
              type="button"
              onClick={() =>
                onSelectFilter(
                  activeFilter === 'incomplete' ? 'all' : 'incomplete'
                )
              }
              className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between group ${
                activeFilter === 'incomplete'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800/80 hover:bg-rose-50/30 dark:hover:bg-rose-950/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                  نیازمند اقدام فوری (زیر ۵۰٪)
                </span>
                <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                    {toPersianDigits(stats.incompleteCount)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    نفر
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  {toPersianDigits(stats.incompletePercent)}٪ کل
                </span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <span>{activeFilter === 'incomplete' ? 'فیلتر فعال است' : 'کلیک جهت فیلتر'}</span>
                <Filter className="w-3 h-3" />
              </div>
            </button>
          </div>

          {/* Overall Stacked Distribution Bar */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>نمودار توزیع کیفیت پرونده‌ها در سازمان</span>
              </span>
              <button
                type="button"
                onClick={() => setShowFieldDetails(!showFieldDetails)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showFieldDetails ? 'مخفی‌سازی تحلیل کسری‌ها' : 'مشاهده تحلیل فیلدهای خالی'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showFieldDetails ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Horizontal stacked bar */}
            <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              {stats.completePercent > 0 && (
                <div
                  style={{ width: `${stats.completePercent}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`۱۰۰٪ تکمیل: ${stats.completeCount} نفر (${stats.completePercent}٪)`}
                />
              )}
              {stats.partialPercent > 0 && (
                <div
                  style={{ width: `${stats.partialPercent}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`در حال تکمیل: ${stats.partialCount} نفر (${stats.partialPercent}٪)`}
                />
              )}
              {stats.incompletePercent > 0 && (
                <div
                  style={{ width: `${stats.incompletePercent}%` }}
                  className="bg-rose-500 h-full transition-all"
                  title={`ناقص: ${stats.incompleteCount} نفر (${stats.incompletePercent}٪)`}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-1 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>تکمیل ۱۰۰٪ ({toPersianDigits(stats.completeCount)} نفر)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>در حال تکمیل ۵۰٪-۹۹٪ ({toPersianDigits(stats.partialCount)} نفر)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>ناقص زیر ۵۰٪ ({toPersianDigits(stats.incompleteCount)} نفر)</span>
                </span>
              </div>
              <span>معیار: ۱۱ فیلد مشخصات پایه، پرسنلی، ارتباطی و مکانی</span>
            </div>
          </div>

          {/* Archive Status Info Banner in Stats */}
          {archivedCount > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>بایگانی و سطل بازیافت:</span>
                    <span className="font-mono px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 font-black">
                      {toPersianDigits(archivedCount)} پرونده
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                    این پرونده‌ها از دید همگانی و صفحه اصلی خارج شده‌اند و در هر زمان قابل بازیابی یا حذف قطعی هستند.
                  </p>
                </div>
              </div>

              {onViewArchive && (
                <button
                  type="button"
                  onClick={onViewArchive}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>ورود به سطل بازیافت و آرشیو</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Missing Fields Breakdown Section */}
          {showFieldDetails && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    بیشترین کمبودهای اطلاعاتی در سازمان (فیلدهای ثبت‌نشده)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  برای فیلتر کارکنان فاقد هر فیلد، روی آن کلیک کنید
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.fieldStats.map((f: FieldMissingStat) => {
                  const filterKey = `missing:${f.id}`;
                  const isFieldActive = activeFilter === filterKey;

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        onSelectFilter(isFieldActive ? 'all' : filterKey)
                      }
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isFieldActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {f.label}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[11px] font-bold font-mono ${
                              f.missingCount > 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {f.missingCount > 0
                              ? `${toPersianDigits(f.missingCount)} مورد خالی (${toPersianDigits(f.missingPercentage)}٪)`
                              : 'کامل (بدون کسری)'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <span
                          className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                            f.missingCount > 0
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                          }`}
                        >
                          {toPersianDigits(f.filledCount)}/{toPersianDigits(stats.totalEmployees)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Filter Indicator Banner */}
          {activeFilter !== 'all' && (
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-800 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  در حال نمایش کارکنان فیلترشده بر اساس وضعیت تکمیل:{' '}
                  <strong>{activeFilterLabel}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectFilter('all')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-3 h-3" />
                <span>پاک کردن فیلتر تکمیل</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
