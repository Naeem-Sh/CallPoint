import React from 'react';
import { Employee, Department, Position } from '../types.ts';
import { formatPersianDateTime } from '../utils/shamsi.ts';
import { MeteorAvatar } from './MeteorAvatar.tsx';
import { History, Clock, Briefcase, Building2 } from 'lucide-react';

interface RecentlyUpdatedBoxProps {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  onSelectEmployee: (emp: Employee) => void;
}

export const RecentlyUpdatedBox: React.FC<RecentlyUpdatedBoxProps> = ({
  employees,
  departments,
  positions,
  onSelectEmployee,
}) => {
  const deptMap = new Map(departments.map((d) => [d.id, d.name]));
  const posMap = new Map(positions.map((p) => [p.id, p.title]));

  if (employees.length === 0) return null;

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              آخرین تغییرات
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">ویرایش‌های اخیر</p>
          </div>
        </div>
      </div>

      {/* Stacked Cards */}
      <div className="space-y-2">
        {employees.slice(0, 3).map((emp) => {
          const deptName = deptMap.get(emp.department_id) || 'تعیین‌نشده';
          const posTitle = posMap.get(emp.position_id) || 'بدون عنوان';
          const updateDate = formatPersianDateTime(emp.updated_at).split(' - ')[0];

          return (
            <div
              key={emp.id}
              onClick={() => onSelectEmployee(emp)}
              className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 border border-slate-200/70 dark:border-slate-800/80 cursor-pointer transition-all hover:scale-[1.01] group space-y-2 shadow-2xs"
            >
              {/* Row 1: Avatar + Name + Date Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MeteorAvatar
                    src={emp.avatar}
                    name={emp.full_name || `${emp.first_name} ${emp.last_name}`}
                    alt={emp.full_name}
                    size="sm"
                    shape="circle"
                  />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                  </h4>
                </div>

                <span className="inline-flex items-center gap-1 text-[9.5px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                  <Clock className="w-2.5 h-2.5 text-amber-500" />
                  <span>{updateDate}</span>
                </span>
              </div>

              {/* Stacked Details: Position & Department on separate lines */}
              <div className="text-[10.5px] space-y-1 pr-1 bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">سمت:</span>
                  <span className="font-semibold truncate">{posTitle}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">واحد:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate">{deptName}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
