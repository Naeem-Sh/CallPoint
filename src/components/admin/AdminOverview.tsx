import React from 'react';
import { SystemStatistics, SystemHealth, AppUser, Employee, LocationItem } from '../../types.ts';
import { toPersianDigits } from '../../utils/shamsi.ts';
import { calculateEmployeesCompletenessStats } from '../../utils/completeness.ts';
import { AnimatedCounter } from '../common/AnimatedCounter.tsx';
import {
  Users,
  Building2,
  PhoneCall,
  Image,
  Database,
  Search,
  FolderArchive,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  UserPlus,
  HardDriveDownload,
  Sparkles,
  Layers,
  PieChart,
  Clock,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

interface AdminOverviewProps {
  stats: SystemStatistics | null;
  health: SystemHealth | null;
  currentUser: AppUser | null;
  employees?: Employee[];
  locations?: LocationItem[];
  onNavigateTab: (tab: string, subTab?: 'export' | 'import' | 'backup') => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  stats,
  health,
  currentUser,
  employees = [],
  locations = [],
  onNavigateTab,
}) => {
  const isHealthy = health?.status === 'ok' || health?.status === 'healthy';

  const completenessStats = React.useMemo(() => {
    return calculateEmployeesCompletenessStats(employees, locations);
  }, [employees, locations]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-2.5 border border-white/15 text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>پیشخوان مدیریت و راهبری دفتر تلفن سازمان</span>
              <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
              <span className="text-white font-bold">{currentUser?.name || currentUser?.username}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              خوش آمدید، {currentUser?.name || 'مدیر گرامی'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              مرکز مدیریت اطلاعات همکاران، ساختار واحدهای سازمانی، تبادل فایل‌های اکسل و مدیریت نسخه‌های پشتیبان.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('employees')}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>افزودن همکار جدید</span>
            </button>
            {currentUser?.role === 'admin' ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateTab('data', 'export')}
                  className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>ورود و خروجی اکسل</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('data', 'backup')}
                  className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <HardDriveDownload className="w-4 h-4" />
                  <span>پشتیبان‌گیری داده‌ها</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateTab('departments')}
                  className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>واحدهای سازمانی</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('locations')}
                  className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>محل‌های استقرار</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div
          onClick={() => onNavigateTab('employees')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
              مدیریت کارکنان ←
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            <AnimatedCounter value={stats?.total_employees ?? 0} />
          </div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
            کل کارکنان ثبت‌شده در سامانه
          </div>
        </div>

        {/* Departments */}
        <div
          onClick={() => onNavigateTab('departments')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 group-hover:underline">
              مشاهده واحدها ←
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            <AnimatedCounter value={stats?.departments_count ?? 0} />
          </div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
            واحدهای سازمانی فعال
          </div>
        </div>

        {/* Phone Numbers */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              داخلی و مستقیم
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            <AnimatedCounter value={stats?.total_phone_numbers ?? 0} />
          </div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
            خطوط و شماره‌های تماس ثبت‌شده
          </div>
        </div>

        {/* Photos */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Image className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              تصاویر کارکنان
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            <AnimatedCounter value={stats?.employees_with_photo ?? 0} />
          </div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
            کارکنان دارای تصویر اختصاصی
          </div>
        </div>

        {/* Archived & Recycled Profiles */}
        {(stats?.archived_employees_count ?? 0) > 0 && (
          <div
            onClick={() => onNavigateTab('employees')}
            className="p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400 cursor-pointer transition-all shadow-xs group col-span-1 sm:col-span-2 lg:col-span-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      بایگانی و سطل بازیافت کارکنان:
                    </span>
                    <span className="text-lg font-black font-mono text-amber-700 dark:text-amber-300">
                      {toPersianDigits(stats?.archived_employees_count ?? 0)} پرونده
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    این پرونده‌ها از دید همگانی و صفحه اصلی خارج شده‌اند و در بکاپ‌ها حفظ می‌گردند.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 group-hover:underline flex items-center gap-1">
                <span>ورود به مدیریت و آرشیو</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Profile Completeness Quick Health Banner */}
      {employees.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm border border-indigo-200/60 dark:border-indigo-800/60">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  شاخص آماری تکمیل پرونده‌های کارکنان
                </h3>
                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  میانگین: {toPersianDigits(completenessStats.averagePercentage)}٪
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                ارزیابی پرونده‌ها بر اساس ۱۱ فیلد ضروری (نام، نام خانوادگی، شماره پرسنلی، واحد، سمت، داخلی، مستقیم، ساختمان، واحد، طبقه و اتاق).
              </p>

              {/* Mini distribution pill tags */}
              <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تکمیل ۱۰۰٪: {toPersianDigits(completenessStats.completeCount)} نفر ({toPersianDigits(completenessStats.completePercent)}٪)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>در حال تکمیل: {toPersianDigits(completenessStats.partialCount)} نفر</span>
                </span>
                {completenessStats.incompleteCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>نیازمند تکمیل فوری: {toPersianDigits(completenessStats.incompleteCount)} نفر</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end">
            <button
              type="button"
              onClick={() => onNavigateTab('employees')}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>مشاهده و تحلیل پرونده‌ها</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Streamlined System Diagnostics Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                وضعیت سلامت و پایایی سامانه
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                پایش یکپارچه پایگاه داده، موتور جستجو و سرویس‌های فایل
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isHealthy ? 'کلیه زیرسیستم‌ها عملیاتی و پایدار' : 'بررسی زیرسیستم‌ها'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">پایگاه داده JSON</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              ذخیره‌سازی اتمیک و امن فایل‌های ساختاریافته بدون نیاز به سرور سنگین خارجی
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">موتور جستجو</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              ایندکس بهینه‌سازی‌شده برای جستجوی فوری نام، شماره‌ها، سمت و سازمان
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">مخزن فایل‌ها و تصاویر</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              دایرکتوری‌های آپلود امن و نگهداری آواتارها و اسناد پیوست
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">سامانه پشتیبان‌گیری</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              بسته‌های ZIP خودکار شامل دیتابیس، تصاویر کارکنان و خروجی اکسل جامع
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
