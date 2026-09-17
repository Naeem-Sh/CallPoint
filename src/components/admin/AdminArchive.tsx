import React, { useState, useEffect } from 'react';
import { ArchivedEmployee, Department, Position, LocationItem } from '../../types.ts';
import { api } from '../../utils/api.ts';
import { toPersianDigits, formatPersianDateTime } from '../../utils/shamsi.ts';
import { formatEmployeeLocation } from '../../utils/location.ts';
import { ProfileCompletenessCircle } from '../ProfileCompletenessCircle.tsx';
import { MeteorAvatar } from '../MeteorAvatar.tsx';
import { EmployeeProfileModal } from '../EmployeeProfileModal.tsx';
import {
  Archive,
  RotateCcw,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  Check,
  Building,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  HelpCircle,
  DoorOpen,
  Sliders,
  ChevronLeft
} from 'lucide-react';

interface AdminArchiveProps {
  departments: Department[];
  positions: Position[];
  locations: LocationItem[];
  onRefreshAll: () => void;
  onSwitchToActive?: () => void;
}

export const AdminArchive: React.FC<AdminArchiveProps> = ({
  departments,
  positions,
  locations,
  onRefreshAll,
  onSwitchToActive,
}) => {
  const [archivedList, setArchivedList] = useState<ArchivedEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewEmp, setPreviewEmp] = useState<ArchivedEmployee | null>(null);

  // Confirmation Modals
  const [restoreModalItem, setRestoreModalItem] = useState<ArchivedEmployee | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<ArchivedEmployee | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isBatchRestoreModalOpen, setIsBatchRestoreModalOpen] = useState(false);
  const [isEmptyArchiveModalOpen, setIsEmptyArchiveModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    try {
      return (localStorage.getItem('admin_archive_view_mode') as 'cards' | 'table') || 'cards';
    } catch {
      return 'cards';
    }
  });

  const handleSetViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('admin_archive_view_mode', mode);
    } catch {}
  };

  const deptMap = new Map<string, string>(departments.map((d) => [d.id, d.name]));
  const posMap = new Map<string, string>(positions.map((p) => [p.id, p.title]));
  const locMap = new Map<string, string>(locations.map((l) => [l.id, l.name]));

  const loadArchived = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getArchivedEmployees();
      setArchivedList(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت لیست آرشیو');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchived();
  }, []);

  // Filtered list
  const filtered = archivedList.filter((emp) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const deptName = (emp.original_department_name || deptMap.get(emp.department_id) || '').toLowerCase();
    const posTitle = (emp.original_position_title || posMap.get(emp.position_id) || '').toLowerCase();
    const locName = (locMap.get(emp.location_id || '') || '').toLowerCase();

    return (
      (emp.full_name && emp.full_name.toLowerCase().includes(term)) ||
      (emp.personnel_code && emp.personnel_code.includes(term)) ||
      (emp.extension && emp.extension.includes(term)) ||
      (emp.mobile && emp.mobile.includes(term)) ||
      (emp.direct_phone && emp.direct_phone.includes(term)) ||
      (emp.email && emp.email.toLowerCase().includes(term)) ||
      (emp.building && emp.building.toLowerCase().includes(term)) ||
      (emp.room && emp.room.includes(term)) ||
      (emp.archive_reason && emp.archive_reason.toLowerCase().includes(term)) ||
      (emp.archived_by && emp.archived_by.toLowerCase().includes(term)) ||
      deptName.includes(term) ||
      posTitle.includes(term) ||
      locName.includes(term)
    );
  });

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((e) => e.id));
    }
  };

  // Single Restore
  const handleConfirmRestore = async () => {
    if (!restoreModalItem) return;
    try {
      setActionLoading(true);
      const res = await api.restoreArchivedEmployee(restoreModalItem.id);
      setSuccess(res.message || `پرونده «${restoreModalItem.full_name}» با موفقیت بازیابی شد.`);
      setRestoreModalItem(null);
      await loadArchived();
      onRefreshAll();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'خطا در بازیابی پرونده از آرشیو');
    } finally {
      setActionLoading(false);
    }
  };

  // Single Permanent Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    try {
      setActionLoading(true);
      const res = await api.permanentlyDeleteArchivedEmployee(deleteModalItem.id);
      setSuccess(res.message || `پرونده «${deleteModalItem.full_name}» به صورت دائمی حذف شد.`);
      setDeleteModalItem(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteModalItem.id));
      await loadArchived();
      onRefreshAll();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف دائمی پرونده');
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Restore
  const handleConfirmBatchRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      const res = await api.batchRestoreArchivedEmployees(selectedIds);
      setSuccess(res.message || `${toPersianDigits(selectedIds.length)} پرونده با موفقیت بازیابی شدند.`);
      setIsBatchRestoreModalOpen(false);
      setSelectedIds([]);
      await loadArchived();
      onRefreshAll();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'خطا در بازیابی گروهی');
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Permanent Delete
  const handleConfirmBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      const res = await api.batchPermanentlyDeleteArchivedEmployees(selectedIds);
      setSuccess(res.message || `${toPersianDigits(selectedIds.length)} پرونده به صورت دائمی حذف شدند.`);
      setIsBatchDeleteModalOpen(false);
      setSelectedIds([]);
      await loadArchived();
      onRefreshAll();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف گروهی');
    } finally {
      setActionLoading(false);
    }
  };

  // Empty Archive
  const handleConfirmEmptyArchive = async () => {
    try {
      setActionLoading(true);
      const res = await api.emptyArchive();
      setSuccess(res.message || 'کلیه پرونده‌های آرشیو پاک‌سازی شدند.');
      setIsEmptyArchiveModalOpen(false);
      setSelectedIds([]);
      await loadArchived();
      onRefreshAll();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'خطا در تخلیه کامل آرشیو');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informative Archive Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/70 text-white border border-amber-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Archive className="w-3.5 h-3.5" />
              <span>مخزن بایگانی و سطل بازیافت پرسنل</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>{toPersianDigits(archivedList.length)} پرونده نگهداری‌شده</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              آرشیو و مدیریت پرونده‌های بایگانی‌شده
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              هنگامی که کاربری حذف می‌شود، ابتدا به این بخش منتقل می‌گردد. این پرونده‌ها از صفحه اصلی، جستجوی همگانی و دفتر تلفن سازمان پنهان هستند اما به طور کامل در <strong>نسخه‌های پشتیبان خودکار و دستی (ZIP)</strong> حفظ شده و هر زمان با یک کلیک قابل بازیابی به لیست فعال می‌باشند.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onSwitchToActive && (
              <button
                type="button"
                onClick={onSwitchToActive}
                className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>مشاهده همکاران فعال</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={loadArchived}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تازه‌سازی لیست</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Controls & Batch Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در آرشیو (نام، کد پرسنلی، واحد، داخلی، همراه، سمت...)"
            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Action Buttons & View Mode */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
          {/* Select all check */}
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={selectAll}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                {selectedIds.length === filtered.length && filtered.length > 0
                  ? 'لغو انتخاب همه'
                  : `انتخاب همه (${toPersianDigits(filtered.length)})`}
              </span>
            </button>
          )}

          {/* Batch Actions when items are selected */}
          {selectedIds.length > 0 && (
            <div className="inline-flex items-center gap-2 p-1 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/50">
              <button
                type="button"
                onClick={() => setIsBatchRestoreModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازیابی {toPersianDigits(selectedIds.length)} مورد</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف قطعی {toPersianDigits(selectedIds.length)} مورد</span>
              </button>
            </div>
          )}

          {/* Empty Archive button if items exist */}
          {archivedList.length > 0 && selectedIds.length === 0 && (
            <button
              type="button"
              onClick={() => setIsEmptyArchiveModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-bold text-xs border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تخلیه کامل سطل بازیافت</span>
            </button>
          )}

          {/* View mode toggle */}
          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleSetViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="نمایش کارتی"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">کارت‌ها</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="نمایش جدولی"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">جدول</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main List Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-xs font-bold">در حال فراخوانی اطلاعات آرشیو...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Archive className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {searchTerm ? 'موردی با مشخصات جستجوشده در آرشیو یافت نشد' : 'سطل بازیافت و آرشیو خالی است'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              {searchTerm
                ? 'عبارت جستجو را تغییر دهید یا فیلتر را پاک کنید.'
                : 'هر زمان که کاربری از بخش مدیریت کاربران حذف شود، ابتدا در این قسمت بایگانی شده و نگهداری می‌گردد.'}
            </p>
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              پاک‌سازی جستجو
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((emp) => {
            const isSelected = selectedIds.includes(emp.id);
            const deptName = emp.original_department_name || deptMap.get(emp.department_id) || 'بدون واحد';
            const posTitle = emp.original_position_title || posMap.get(emp.position_id) || 'بدون سمت';
            const locationStr = formatEmployeeLocation(emp, locations);

            return (
              <div
                key={emp.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800/80'
                }`}
              >
                {/* Card Top & Selection Header */}
                <div className="p-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(emp.id)}
                        className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-amber-400'
                        }`}
                        title={isSelected ? 'لغو انتخاب' : 'انتخاب'}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <MeteorAvatar
                        name={emp.full_name}
                        avatarUrl={emp.avatar}
                        size="sm"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {emp.full_name}
                          </h4>
                          <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            کد: {toPersianDigits(emp.personnel_code || '---')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          <span className="truncate">{posTitle}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{deptName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Completeness Ring */}
                    <ProfileCompletenessCircle
                      employee={emp}
                      locations={locations}
                      size="sm"
                      showBadge={false}
                    />
                  </div>
                </div>

                {/* Card Body - Details & Metadata */}
                <div className="p-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-300 flex-1">
                  {/* Phone numbers row */}
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[9.5px] text-slate-400 block mb-0.5">شماره داخلی</span>
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {emp.extension ? toPersianDigits(emp.extension) : 'ثبت نشده'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[9.5px] text-slate-400 block mb-0.5">تلفن مستقیم / همراه</span>
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 truncate block">
                        {emp.direct_phone || emp.mobile
                          ? toPersianDigits(emp.direct_phone || emp.mobile || '')
                          : 'ثبت نشده'}
                      </span>
                    </div>
                  </div>

                  {/* Location row */}
                  {locationStr && (
                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{locationStr}</span>
                    </div>
                  )}

                  {/* Archive metadata box */}
                  <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[10.5px] space-y-1">
                    <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>تاریخ بایگانی:</span>
                      </span>
                      <span className="font-mono">{formatPersianDateTime(emp.archived_at)}</span>
                    </div>
                    {emp.archived_by && (
                      <div className="text-slate-600 dark:text-slate-400 flex items-center justify-between">
                        <span>بایگانی توسط:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{emp.archived_by}</span>
                      </div>
                    )}
                    {emp.archive_reason && (
                      <div className="text-slate-500 dark:text-slate-400 pt-0.5 border-t border-amber-200/40 dark:border-amber-900/30 text-[9.5px]">
                        علت: {emp.archive_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="py-2 px-3 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewEmp(emp)}
                    className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="مشاهده اطلاعات کامل"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>مشاهده پرونده</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRestoreModalItem(emp)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      title="بازیابی به لیست پرسنل فعال"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>بازیابی</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteModalItem(emp)}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title="حذف قطعی و دائمی از آرشیو"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-2 px-2.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={selectAll}
                      className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all mx-auto cursor-pointer ${
                        selectedIds.length === filtered.length && filtered.length > 0
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {selectedIds.length === filtered.length && filtered.length > 0 && (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </button>
                  </th>
                  <th className="py-2 px-2.5">همکار / مشخصات</th>
                  <th className="py-2 px-2.5">کد پرسنلی</th>
                  <th className="py-2 px-2.5">واحد و سمت</th>
                  <th className="py-2 px-2.5">شماره‌های تماس</th>
                  <th className="py-2 px-2.5">تاریخ و زمان بایگانی</th>
                  <th className="py-2 px-2.5 text-center">کیفیت پرونده</th>
                  <th className="py-2 px-2.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((emp) => {
                  const isSelected = selectedIds.includes(emp.id);
                  const deptName = emp.original_department_name || deptMap.get(emp.department_id) || 'بدون واحد';
                  const posTitle = emp.original_position_title || posMap.get(emp.position_id) || 'بدون سمت';

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-amber-50/30 dark:bg-amber-950/30' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelect(emp.id)}
                          className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all mx-auto cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      </td>

                      <td className="py-1.5 px-2.5">
                        <div className="flex items-center gap-2">
                          <MeteorAvatar name={emp.full_name} avatarUrl={emp.avatar} size="sm" />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-xs">
                              {emp.full_name}
                            </span>
                            {emp.email && (
                              <span className="text-[10.5px] text-slate-400 font-mono block">
                                {emp.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-1.5 px-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {toPersianDigits(emp.personnel_code || '---')}
                      </td>

                      <td className="py-1.5 px-2.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                          {deptName}
                        </span>
                        <span className="text-[10.5px] text-slate-400 block">{posTitle}</span>
                      </td>

                      <td className="py-1.5 px-2.5 font-mono text-slate-700 dark:text-slate-300">
                        {emp.extension && (
                          <div className="text-xs">
                            <span className="text-slate-400 text-[10px]">داخلی: </span>
                            <span className="font-bold">{toPersianDigits(emp.extension)}</span>
                          </div>
                        )}
                        {(emp.direct_phone || emp.mobile) && (
                          <div className="text-[10.5px] text-slate-500">
                            {toPersianDigits(emp.direct_phone || emp.mobile || '')}
                          </div>
                        )}
                      </td>

                      <td className="py-1.5 px-2.5 text-[10.5px]">
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 block">
                          {formatPersianDateTime(emp.archived_at)}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block">
                          توسط: {emp.archived_by || 'مدیر'}
                        </span>
                      </td>

                      <td className="py-1.5 px-2.5 text-center">
                        <div className="inline-flex items-center justify-center">
                          <ProfileCompletenessCircle
                            employee={emp}
                            locations={locations}
                            size="sm"
                            showBadge={false}
                          />
                        </div>
                      </td>

                      <td className="py-1.5 px-2.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewEmp(emp)}
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="مشاهده پرونده"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRestoreModalItem(emp)}
                            className="p-1 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                            title="بازیابی به لیست پرسنل فعال"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModalItem(emp)}
                            className="p-1 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                            title="حذف دائمی"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Details Modal for previewing archived employee */}
      {previewEmp && (
        <EmployeeProfileModal
          employee={previewEmp}
          locations={locations}
          departments={departments}
          positions={positions}
          onClose={() => setPreviewEmp(null)}
        />
      )}

      {/* 1. Single Restore Confirmation Modal */}
      {restoreModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  بازیابی پرونده به لیست فعال
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  بازگردانی کارمند به دفتر تلفن و جستجوی همگانی
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از بازیابی پرونده <strong>«{restoreModalItem.full_name}»</strong> (کد پرسنلی: {restoreModalItem.personnel_code || '---'}) اطمینان دارید؟ این کارمند بلافاصله در صفحه اصلی و لیست پرسنل فعال قابل مشاهده خواهد بود.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRestoreModalItem(null)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>تأیید و بازیابی پرونده</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Single Permanent Delete Confirmation Modal */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-rose-200 dark:border-rose-900/50 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  حذف قطعی و دائمی پرونده
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  این عملیات غیرقابل بازگشت است
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از حذف دائمی پرونده <strong>«{deleteModalItem.full_name}»</strong> از سطل بازیافت اطمینان دارید؟ با این کار پرونده به طور کامل از دیتابیس سامانه پاک خواهد شد.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>حذف قطعی و نهایی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Batch Restore Modal */}
      {isBatchRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  بازیابی گروهی پرونده‌ها
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  بازگردانی {toPersianDigits(selectedIds.length)} پرونده به لیست فعال
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از بازیابی همزمان <strong>{toPersianDigits(selectedIds.length)}</strong> پرونده انتخاب‌شده اطمینان دارید؟
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchRestoreModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchRestore}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>تأیید و بازیابی همه</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Batch Delete Modal */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-rose-200 dark:border-rose-900/50 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  حذف قطعی و دائمی گروهی
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  غیرقابل بازگشت
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از حذف دائمی <strong>{toPersianDigits(selectedIds.length)}</strong> پرونده انتخاب‌شده از آرشیو اطمینان دارید؟
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>حذف قطعی موارد انتخاب‌شده</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Empty Archive Modal */}
      {isEmptyArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-rose-300 dark:border-rose-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  تخلیه کامل سطل بازیافت و آرشیو
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  تمام {toPersianDigits(archivedList.length)} پرونده حذف خواهند شد
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا مطمئن هستید که می‌خواهید <strong>کلیه پرونده‌های موجود در سطل بازیافت</strong> ({toPersianDigits(archivedList.length)} مورد) را به صورت قطعی و دائمی پاک‌سازی نمایید؟
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEmptyArchiveModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmEmptyArchive}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>تأیید و تخلیه کامل آرشیو</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
