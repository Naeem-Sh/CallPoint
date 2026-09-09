import React from 'react';
import { SystemStatistics, SystemHealth, AppUser } from '../../types.ts';
import { toPersianDigits } from '../../utils/shamsi.ts';
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
} from 'lucide-react';

interface AdminOverviewProps {
  stats: SystemStatistics | null;
  health: SystemHealth | null;
  currentUser: AppUser | null;
  onNavigateTab: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  stats,
  health,
  currentUser,
  onNavigateTab,
}) => {
  const isHealthy = health?.status === 'ok' || health?.status === 'healthy';

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
            <button
              type="button"
              onClick={() => onNavigateTab('excel')}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ورود و خروجی اکسل</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('backup')}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>پشتیبان‌گیری فوری</span>
            </button>
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
              مدیریت پرسنل ←
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(stats?.total_employees ?? 0)}
          </div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
            کل پرسنل ثبت‌شده در سامانه
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
            {toPersianDigits(stats?.departments_count ?? 0)}
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
            {toPersianDigits(stats?.total_phone_numbers ?? 0)}
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
              تصاویر پرسنلی
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(stats?.employees_with_photo ?? 0)}
          </div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
            پرسنل دارای تصویر اختصاصی
          </div>
        </div>
      </div>

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
              بسته‌های ZIP خودکار شامل دیتابیس، تصاویر پرسنل و خروجی اکسل جامع
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
