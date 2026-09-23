import React, { useState } from 'react';
import {
  Employee,
  DynamicFieldDefinition,
  Department,
  Position,
  LocationItem,
  SystemStatistics,
  SystemHealth,
  AppSettings,
  AppUser,
} from '../../types.ts';
import { AdminOverview } from './AdminOverview.tsx';
import { AdminEmployees } from './AdminEmployees.tsx';
import { AdminDepartments } from './AdminDepartments.tsx';
import { AdminLocations } from './AdminLocations.tsx';
import { AdminDataManagement } from './AdminDataManagement.tsx';
import { AdminAuditAndHealth } from './AdminAuditAndHealth.tsx';
import { AdminSettingsAndUsers } from './AdminSettingsAndUsers.tsx';
import { api } from '../../utils/api.ts';
import {
  LayoutDashboard,
  Users,
  Building,
  MapPin,
  FileSpreadsheet,
  HardDrive,
  ShieldAlert,
  Settings,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  LogOut,
  UserCheck,
} from 'lucide-react';

interface AdminPanelProps {
  employees: Employee[];
  fields: DynamicFieldDefinition[];
  departments: Department[];
  positions: Position[];
  locations: LocationItem[];
  stats: SystemStatistics | null;
  health: SystemHealth | null;
  settings: AppSettings | null;
  currentUser: AppUser | null;
  onRefreshAll: () => void;
  onCloseAdmin: () => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  employees,
  fields,
  departments,
  positions,
  locations,
  stats,
  health,
  settings,
  currentUser,
  onRefreshAll,
  onCloseAdmin,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [dataSubTab, setDataSubTab] = useState<'export' | 'import' | 'backup'>('export');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [backupBeforeReset, setBackupBeforeReset] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const allTabs = [
    { id: 'overview', label: 'پیشخوان و سلامت', icon: LayoutDashboard, adminOnly: false },
    { id: 'employees', label: 'مدیریت کارکنان', icon: Users, adminOnly: false },
    { id: 'departments', label: 'واحدهای سازمانی', icon: Building, adminOnly: false },
    { id: 'locations', label: 'محل‌های استقرار', icon: MapPin, adminOnly: false },
    { id: 'data', label: 'ورود، خروجی و پشتیبان‌گیری', icon: FileSpreadsheet, adminOnly: true },
    { id: 'audit', label: 'ثبت وقایع (Audit)', icon: ShieldAlert, adminOnly: true },
    { id: 'settings', label: 'تنظیمات و کاربران', icon: Settings, adminOnly: true },
  ];

  const tabs = allTabs.filter((tab) => !tab.adminOnly || isAdmin);

  // Safety fallback if active tab is restricted
  const effectiveActiveTab = tabs.some((t) => t.id === activeTab)
    ? activeTab
    : (activeTab === 'excel' || activeTab === 'backup') ? 'data' : 'overview';

  const handleNavigateTab = (tab: string, subTab?: 'export' | 'import' | 'backup') => {
    if (tab === 'excel') {
      setActiveTab('data');
      setDataSubTab(subTab || 'export');
    } else if (tab === 'backup') {
      setActiveTab('data');
      setDataSubTab('backup');
    } else {
      setActiveTab(tab);
      if (subTab) setDataSubTab(subTab);
    }
  };

  const handleExecuteReset = async () => {
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await api.resetDatabase(backupBeforeReset);
      setResetMessage({
        type: 'success',
        text: res.message || 'پایگاه داده کارکنان با موفقیت پاکسازی شد.',
      });
      await onRefreshAll();
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetMessage(null);
        setActiveTab('data');
        setDataSubTab('import'); // Lead admin directly to Excel Import tab!
      }, 1500);
    } catch (err: any) {
      setResetMessage({
        type: 'error',
        text: err.message || 'خطا در بازنشانی پایگاه داده',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Admin Panel Header & Subnav */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  سامانه مدیریت دفتر تلفن سازمان
                </h2>
                {currentUser && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'مدیر ارشد' : 'ویرایشگر'}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                پایگاه ذخیره‌سازی داده‌های ساخت‌یافته JSON • کاربر: {currentUser?.name || currentUser?.username || 'مدیر'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={onCloseAdmin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <span>فهرست عمومی</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
                title="خروج از حساب کاربری"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={onCloseAdmin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            <span>بازگشت به راهنمای تلفن و جستجو</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 font-bold text-xs transition-colors cursor-pointer"
              title="خروج از حساب و بازگشت به حالت کاربر عادی"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج از حساب</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = effectiveActiveTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div>
        {effectiveActiveTab === 'overview' && (
          <AdminOverview
            stats={stats}
            health={health}
            currentUser={currentUser}
            employees={employees}
            locations={locations}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {effectiveActiveTab === 'employees' && (
          <AdminEmployees
            employees={employees}
            fields={fields}
            departments={departments}
            positions={positions}
            locations={locations}
            onRefresh={onRefreshAll}
          />
        )}

        {effectiveActiveTab === 'departments' && (
          <AdminDepartments
            departments={departments}
            employees={employees}
            positions={positions}
            onRefresh={onRefreshAll}
          />
        )}

        {effectiveActiveTab === 'locations' && (
          <AdminLocations
            locations={locations}
            employees={employees}
            onRefresh={onRefreshAll}
          />
        )}

        {(effectiveActiveTab === 'data' || effectiveActiveTab === 'excel' || effectiveActiveTab === 'backup') && isAdmin && (
          <AdminDataManagement
            departments={departments}
            fields={fields}
            onRefreshAll={onRefreshAll}
            initialSubTab={effectiveActiveTab === 'backup' ? 'backup' : dataSubTab}
          />
        )}

        {effectiveActiveTab === 'audit' && isAdmin && <AdminAuditAndHealth />}

        {effectiveActiveTab === 'settings' && isAdmin && (
          <AdminSettingsAndUsers
            settings={settings}
            onRefreshSettings={onRefreshAll}
            onOpenResetModal={() => setIsResetModalOpen(true)}
          />
        )}
      </div>

      {/* ================= RESET ALL CONFIRMATION MODAL ================= */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <div className="p-2 rounded-2xl bg-rose-100 dark:bg-rose-950/80">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  پاکسازی و بازنشانی کلی دیتابیس (Reset All)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isResetting && setIsResetModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                آیا از پاکسازی کلیه اطلاعات پایگاه داده اطمینان کامل دارید؟
              </p>
              <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900 text-rose-800 dark:text-rose-200 space-y-1.5">
                <p className="font-bold">• تمامی رکوردهای کارکنان، شماره‌ها، واحدهای سازمانی، سمت‌ها و محل‌های استقرار به طور کامل پاک خواهند شد.</p>
                <p>• حساب‌های کاربری مدیر و تنظیمات پایه جهت ادامه کار حفظ می‌شوند.</p>
                <p>• این عملیات جهت آماده‌سازی پایگاه داده برای ورود تازه شماره‌ها و کارکنان از طریق فایل اکسل طراحی شده است.</p>
              </div>

              {/* Option to create backup first */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={backupBeforeReset}
                  onChange={(e) => setBackupBeforeReset(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  ایجاد فایل پشتیبان خودکار (Backup ZIP) پیش از پاکسازی داده‌ها (توصیه شده)
                </span>
              </label>

              {resetMessage && (
                <div
                  className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                    resetMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {resetMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{resetMessage.text}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleExecuteReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال پاکسازی پایگاه داده...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تأیید و پاکسازی کامل (Reset All)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

