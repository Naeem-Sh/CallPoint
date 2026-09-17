import React, { useMemo } from 'react';
import { SystemStatistics, Employee, Department, LocationItem, Position } from '../types.ts';
import { toPersianDigits, formatPersianDateTime } from '../utils/shamsi.ts';
import { AnimatedCounter } from './common/AnimatedCounter.tsx';
import { DepartmentStaffChart } from './DepartmentStaffChart.tsx';
import {
  Users,
  Building,
  PhoneCall,
  Image as ImageIcon,
  Search,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';

interface StatisticsBoxProps {
  stats: SystemStatistics | null;
  employees?: Employee[];
  departments?: Department[];
  locations?: LocationItem[];
  positions?: Position[];
  loading?: boolean;
  selectedDepartmentId?: string;
  onSelectDepartment?: (deptId: string) => void;
  onResetFilter?: () => void;
}

export const StatisticsBox: React.FC<StatisticsBoxProps> = ({
  stats,
  employees = [],
  departments = [],
  loading = false,
  selectedDepartmentId,
  onSelectDepartment,
  onResetFilter,
}) => {
  // Compute live statistics with high resilience
  const effectiveStats: SystemStatistics = useMemo(() => {
    if (stats) {
      return stats;
    }

    const total = employees.length;
    const withPhoto = employees.filter((e) => Boolean(e.avatar)).length;
    let totalPhones = 0;
    employees.forEach((e) => {
      if (e.phones && e.phones.length > 0) totalPhones += e.phones.length;
      else {
        if (e.extension) totalPhones++;
        if (e.direct_phone) totalPhones++;
        if (e.mobile) totalPhones++;
      }
    });

    return {
      total_employees: total,
      active_employees: total,
      inactive_employees: 0,
      departments_count: departments.length,
      total_phone_numbers: totalPhones,
      employees_with_photo: withPhoto,
      employees_without_photo: total - withPhoto,
      total_searches: 0,
      searches_last_24h: 0,
      searches_last_7d: 0,
      last_update: new Date().toISOString(),
      last_backup: 'ثبت نشده',
    };
  }, [stats, employees, departments]);

  const statItems = [
    {
      title: 'کل کارکنان',
      type: 'counter',
      numericValue: effectiveStats.total_employees,
      sub: 'سامانه تلفن',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50/80 dark:bg-blue-950/40',
      borderColor: 'border-blue-200/80 dark:border-blue-800/60',
    },
    {
      title: 'واحدها',
      type: 'counter',
      numericValue: effectiveStats.departments_count,
      sub: 'واحدهای فعال',
      icon: Building,
      color: 'from-purple-500 to-violet-600',
      textColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50/80 dark:bg-purple-950/40',
      borderColor: 'border-purple-200/80 dark:border-purple-800/60',
    },
    {
      title: 'خطوط فعال',
      type: 'counter',
      numericValue: effectiveStats.total_phone_numbers,
      sub: 'داخلی، مستقیم، همراه',
      icon: PhoneCall,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-200/80 dark:border-emerald-800/60',
    },
    {
      title: 'تصاویر',
      type: 'fraction',
      num1: effectiveStats.employees_with_photo,
      num2: effectiveStats.total_employees,
      sub:
        effectiveStats.employees_without_photo === 0
          ? '۱۰۰٪ دارای تصویر'
          : `${toPersianDigits(effectiveStats.employees_without_photo)} بدون تصویر`,
      icon: ImageIcon,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50/80 dark:bg-amber-950/40',
      borderColor: 'border-amber-200/80 dark:border-amber-800/60',
    },
    {
      title: 'جستجوها',
      type: 'counter',
      numericValue: effectiveStats.total_searches,
      sub: `${toPersianDigits(effectiveStats.searches_last_24h)} در ۲۴ ساعت`,
      icon: Search,
      color: 'from-sky-500 to-cyan-600',
      textColor: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50/80 dark:bg-sky-950/40',
      borderColor: 'border-sky-200/80 dark:border-sky-800/60',
    },
    {
      title: 'به‌روزرسانی',
      type: 'text',
      value: formatPersianDateTime(effectiveStats.last_update).split(' - ')[1] || 'هم‌اکنون',
      sub: formatPersianDateTime(effectiveStats.last_update).split(' - ')[0] || 'امروز',
      icon: CalendarCheck,
      color: 'from-rose-500 to-pink-600',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50/80 dark:bg-rose-950/40',
      borderColor: 'border-rose-200/80 dark:border-rose-800/60',
    },
  ];

  return (
    <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              آمار کارکنان
            </h2>
          </div>
        </div>
      </div>

      {/* 6 Metric Cards with Smooth Animated Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border ${item.borderColor} ${item.bgColor} flex flex-col justify-between transition-all hover:scale-[1.02] shadow-2xs`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {item.title}
                </span>
                <div className={`p-1.5 rounded-lg text-white bg-gradient-to-br ${item.color} shadow-xs`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {item.type === 'counter' && item.numericValue !== undefined ? (
                    <AnimatedCounter value={item.numericValue} />
                  ) : item.type === 'fraction' && item.num1 !== undefined && item.num2 !== undefined ? (
                    <div className="flex items-baseline gap-1">
                      <AnimatedCounter value={item.num1} />
                      <span className="text-slate-400 font-normal text-sm">/</span>
                      <AnimatedCounter value={item.num2} className="text-slate-500 text-base" />
                    </div>
                  ) : (
                    item.value
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-1">
                  {item.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Department Staffing Chart */}
      {departments.length > 0 && onSelectDepartment && (
        <DepartmentStaffChart
          departments={departments}
          employees={employees}
          selectedDepartmentId={selectedDepartmentId}
          onSelectDepartment={onSelectDepartment}
          onResetFilter={onResetFilter}
        />
      )}
    </section>
  );
};
