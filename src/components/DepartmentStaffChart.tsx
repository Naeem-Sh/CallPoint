import React, { useMemo } from 'react';
import { Department, Employee } from '../types.ts';
import { toPersianDigits } from '../utils/shamsi.ts';
import { AnimatedCounter } from './common/AnimatedCounter.tsx';
import {
  Building2,
  Users,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface DepartmentStaffChartProps {
  departments: Department[];
  employees: Employee[];
  selectedDepartmentId?: string;
  onSelectDepartment: (deptId: string) => void;
  onResetFilter?: () => void;
}

// Cohesive and elegant palette
const DEPT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#a855f7', // Fuchsia
  '#f97316', // Orange
];

export const DepartmentStaffChart: React.FC<DepartmentStaffChartProps> = ({
  departments = [],
  employees = [],
  selectedDepartmentId,
  onSelectDepartment,
  onResetFilter,
}) => {
  // Compute department breakdown statistics
  const deptData = useMemo(() => {
    const totalStaff = employees.length || 1;
    const activeDepts = departments.filter((d) => d.active !== false);

    // Map counts
    const countMap: Record<string, number> = {};
    employees.forEach((emp) => {
      if (emp.department_id) {
        countMap[emp.department_id] = (countMap[emp.department_id] || 0) + 1;
      }
    });

    return activeDepts
      .map((d, index) => {
        const count = countMap[d.id] || 0;
        const percentage = Math.round((count / totalStaff) * 100);
        const color = DEPT_COLORS[index % DEPT_COLORS.length];
        return {
          id: d.id,
          name: d.name,
          code: d.code,
          count,
          percentage,
          color,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [departments, employees]);

  const totalEmployeesCount = employees.length;

  const activeDepartment = useMemo(() => {
    if (!selectedDepartmentId || selectedDepartmentId === 'all') return null;
    return deptData.find((d) => d.id === selectedDepartmentId) || null;
  }, [selectedDepartmentId, deptData]);

  const isAllSelected = !selectedDepartmentId || selectedDepartmentId === 'all';

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">
            فیلتر واحد سازمانی
          </h3>
        </div>

        {activeDepartment && (
          <button
            type="button"
            onClick={() => {
              if (onResetFilter) onResetFilter();
              else onSelectDepartment('all');
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-xl border border-rose-200/60 dark:border-rose-900/60 transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-3 h-3" />
            <span>حذف فیلتر</span>
          </button>
        )}
      </div>

      {/* Concise, Compact Department Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {/* 'All Departments' Button Card */}
        <button
          type="button"
          onClick={() => {
            if (onResetFilter) onResetFilter();
            else onSelectDepartment('all');
          }}
          className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden select-none ${
            isAllSelected
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
              : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Users className={`w-3.5 h-3.5 ${isAllSelected ? 'text-indigo-200' : 'text-slate-400'}`} />
              <span className="text-xs font-bold truncate">همه واحدها</span>
            </div>
            {isAllSelected && (
              <span className="p-0.5 rounded-full bg-white/20 text-white shrink-0">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between text-[11px]">
            <span className={isAllSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}>
              تعداد:
            </span>
            <span className={`font-bold font-mono ${isAllSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              <AnimatedCounter value={employees.length} suffix="نفر" />
            </span>
          </div>

          {/* 100% visual progress indicator for all staff */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isAllSelected ? 'bg-white' : 'bg-indigo-600'
              }`}
              style={{ width: '100%' }}
            />
          </div>
        </button>

        {/* Individual Department Cards */}
        {deptData.map((dept) => {
          const isSelected = selectedDepartmentId === dept.id;
          // Percentage of personnel in this department out of total company personnel
          const fillRatio = totalEmployeesCount > 0 ? (dept.count / totalEmployeesCount) * 100 : 0;

          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => onSelectDepartment(dept.id)}
              className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden select-none group ${
                isSelected
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
              }`}
            >
              {/* Top Accent Line */}
              <div
                className="absolute top-0 inset-x-0 h-0.5 transition-all"
                style={{
                  backgroundColor: dept.color,
                  opacity: isSelected ? 1 : 0.5,
                }}
              />

              <div className="mb-1.5">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span
                      className={`text-xs font-bold truncate transition-colors ${
                        isSelected
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`}
                      title={dept.name}
                    >
                      {dept.name}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="p-0.5 rounded-full bg-indigo-600 text-white shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-0.5">
                    <AnimatedCounter
                      value={dept.count}
                      className={`text-sm font-black ${
                        isSelected
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">نفر</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    ٪{toPersianDigits(dept.percentage)}
                  </span>
                </div>
              </div>

              {/* Proportional visual progress indicator representing % of total company personnel */}
              <div
                className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden"
                title={`${toPersianDigits(dept.percentage)}٪ از کل کارکنان شرکت (${toPersianDigits(dept.count)} از ${toPersianDigits(totalEmployeesCount)} نفر)`}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${fillRatio}%`,
                    backgroundColor: dept.color,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
