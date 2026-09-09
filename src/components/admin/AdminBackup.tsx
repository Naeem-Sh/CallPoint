import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.ts';
import { toPersianDigits, formatPersianDateTime } from '../../utils/shamsi.ts';
import {
  HardDrive,
  Download,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileArchive,
  RefreshCw,
  Upload,
  Trash2,
  Search,
  MessageSquare,
  Loader2,
  X,
  AlertTriangle,
  Layers,
  Users,
  MapPin,
  Camera,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';

interface BackupItem {
  filename: string;
  size: number;
  created_at: string;
  comment?: string;
  employee_count?: number;
  department_count?: number;
  location_count?: number;
  photo_count?: number;
  json_count?: number;
  has_excel_export?: boolean;
}

interface AdminBackupProps {
  onRefreshAll: () => void;
}

export const AdminBackup: React.FC<AdminBackupProps> = ({ onRefreshAll }) => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // In-App Modals State (replaces blocked window.confirm in iframe)
  const [confirmRestoreItem, setConfirmRestoreItem] = useState<BackupItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<BackupItem | null>(null);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBackupList();
      const list = Array.isArray(res) ? res : (res.backups || res.list || []);
      setBackups(list);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت لیست بکاپ‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createBackup(comment.trim() || undefined);
      const fname = res.filename || res.backup?.filename || 'نسخه پشتیبان';
      setSuccess(`نسخه پشتیبان با موفقیت ایجاد شد: ${fname}`);
      setComment('');
      await fetchBackups();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'خطا در ایجاد پشتیبان');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      setDownloading(filename);
      setError(null);
      await api.downloadBackup(filename);
    } catch (err: any) {
      setError(err.message || 'خطا در دانلود فایل پشتیبان');
    } finally {
      setDownloading(null);
    }
  };

  // Execute Restore (called from confirmation modal)
  const executeRestore = async (filename: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.restoreBackup({ filename });
      const detail = res.employee_count !== undefined
        ? ` (${toPersianDigits(res.employee_count)} پرسنل و ${toPersianDigits(res.department_count || 0)} واحد سازمانی بازیابی شدند)`
        : '';
      setSuccess(`پایگاه داده با موفقیت به نسخه «${filename}» بازگردانی شد.${detail}`);
      setConfirmRestoreItem(null);
      await fetchBackups();
      await onRefreshAll();
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err.message || 'خطا در بازیابی نسخه پشتیبان');
    } finally {
      setLoading(false);
    }
  };

  // Execute Delete (called from confirmation modal)
  const executeDelete = async (filename: string) => {
    try {
      setDeleting(filename);
      setError(null);
      await api.deleteBackup(filename);
      setSuccess(`فایل پشتیبان «${filename}» با موفقیت حذف گردید.`);
      setConfirmDeleteItem(null);
      await fetchBackups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف فایل پشتیبان');
    } finally {
      setDeleting(null);
    }
  };

  // File selection for upload & restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingUploadFile(file);
    e.target.value = '';
  };

  // Execute Upload & Restore
  const executeUploadAndRestore = async () => {
    if (!pendingUploadFile) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append('file', pendingUploadFile);

    try {
      const res = await api.restoreBackup(fd);
      const detail = res.employee_count !== undefined
        ? ` (${toPersianDigits(res.employee_count)} پرسنل بازیابی شدند)`
        : '';
      setSuccess(`فایل فشرده با موفقیت بارگذاری و بازیابی گردید.${detail}`);
      setPendingUploadFile(null);
      await fetchBackups();
      await onRefreshAll();
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری و بازیابی فایل ZIP');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '۰ کیلوبایت';
    if (bytes >= 1024 * 1024) {
      return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(2))} مگابایت`;
    }
    return `${toPersianDigits((bytes / 1024).toFixed(1))} کیلوبایت`;
  };

  const filteredBackups = backups.filter((b) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return b.filename.toLowerCase().includes(term) || (b.comment && b.comment.toLowerCase().includes(term));
  });

  const totalBytes = backups.reduce((sum, b) => sum + (b.size || 0), 0);

  return (
    <div className="space-y-6">
      {/* Safety & Retention Notice */}
      <div className="p-4 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <span>سامانه پشتیبان‌گیری اتمیک و خودمحافظت (Self-Healing Storage)</span>
            </h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
              تمامی داده‌ها، تصاویر پرسنل و خروجی جامع اکسل کارکنان در بسته‌های ZIP فشرده ذخیره می‌شوند. قبل از هر بازیابی نیز یک نسخه ایمن به صورت خودکار تهیه می‌شود.
            </p>
          </div>
        </div>

        {/* 20 Max Backups Policy Badge */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/70 dark:bg-amber-900/50 border border-amber-300/80 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold">
          <Layers className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
          <span>سیاست نگهداری: حداکثر ۲۰ نسخه (حذف خودکار از آخر)</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-indigo-600" />
          <span>ایجاد پشتیبان دستی جدید</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="توضیح اختیاری برای این نسخه پشتیبان (مثلاً: قبل از به‌روزرسانی اسامی پرسنل)"
            className="flex-1 w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
          <button
            type="button"
            disabled={loading}
            onClick={handleCreateBackup}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
            <span>ایجاد نسخه پشتیبان فوری</span>
          </button>

          <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>بارگذاری و بازیابی فایل ZIP</span>
            <input type="file" accept=".zip" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <FileArchive className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              نسخه‌های پشتیبان موجود بر روی سرور
            </h4>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/60">
              {toPersianDigits(backups.length)} از حداکثر ۲۰ نسخه
            </span>
            {backups.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                مجموع حجم: {formatSize(totalBytes)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {backups.length > 3 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در نام یا توضیحات..."
                  className="pr-8 pl-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none w-48 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
            <button
              type="button"
              onClick={fetchBackups}
              disabled={loading}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors flex items-center gap-1 text-xs cursor-pointer"
              title="به‌روزرسانی لیست پشتیبان‌ها"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">به‌روزرسانی</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredBackups.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {searchTerm ? 'هیچ نسخه‌ای مطابق با عبارت جستجو یافت نشد.' : 'هیچ نسخه پشتیبانی یافت نشد.'}
            </div>
          ) : (
            filteredBackups.map((b, idx) => (
              <div
                key={b.filename}
                className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 relative">
                    <FileArchive className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center">
                      {toPersianDigits(idx + 1)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 select-all">
                        {b.filename}
                      </span>
                      {b.employee_count !== undefined && (
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg font-bold ${
                          b.employee_count > 0 
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          <Users className="w-3 h-3" />
                          <span>{b.employee_count > 0 ? `${toPersianDigits(b.employee_count)} پرسنل` : 'خالی (۰ پرسنل)'}</span>
                        </span>
                      )}
                      {Boolean(b.department_count && b.department_count > 0) && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                          <Layers className="w-3 h-3" />
                          <span>{toPersianDigits(b.department_count!)} واحد</span>
                        </span>
                      )}
                      {Boolean(b.location_count && b.location_count > 0) && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-medium border border-teal-200 dark:border-teal-800">
                          <MapPin className="w-3 h-3" />
                          <span>{toPersianDigits(b.location_count!)} محل استقرار</span>
                        </span>
                      )}
                      {Boolean(b.photo_count && b.photo_count > 0) && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800">
                          <Camera className="w-3 h-3" />
                          <span>{toPersianDigits(b.photo_count!)} عکس پرسنلی</span>
                        </span>
                      )}
                      {Boolean(b.json_count && b.json_count > 0) && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800">
                          <FileCode className="w-3 h-3" />
                          <span>{toPersianDigits(b.json_count!)} فایل JSON</span>
                        </span>
                      )}
                      {b.has_excel_export && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800" title="دارای فایل گزارش جامع اکسل">
                          <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>اکسل</span>
                        </span>
                      )}
                      {b.comment && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium">
                          <MessageSquare className="w-3 h-3" />
                          <span>{b.comment}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                      <Clock className="w-3 h-3" />
                      <span>{formatPersianDateTime(b.created_at)}</span>
                      <span>•</span>
                      <span>حجم: {formatSize(b.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-center">
                  <button
                    type="button"
                    disabled={downloading === b.filename}
                    onClick={() => handleDownload(b.filename)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="دانلود فایل فشرده ZIP"
                  >
                    {downloading === b.filename ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>دانلود</span>
                  </button>

                  {/* Restore Button (Opens Custom React Modal) */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setConfirmRestoreItem(b)}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 shadow-2xs"
                    title="بازگردانی این نسخه"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بازیابی</span>
                  </button>

                  {/* Delete Button (Opens Custom React Modal) */}
                  <button
                    type="button"
                    disabled={deleting === b.filename}
                    onClick={() => setConfirmDeleteItem(b)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="حذف نسخه پشتیبان"
                  >
                    {deleting === b.filename ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===================== CONFIRM RESTORE MODAL ===================== */}
      {confirmRestoreItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    تأیید بازیابی نسخه پشتیبان
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    بازگردانی کل پایگاه داده به وضعیت این نسخه
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => setConfirmRestoreItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">نام فایل:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    {confirmRestoreItem.filename}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">تاریخ ذخیره:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    {formatPersianDateTime(confirmRestoreItem.created_at)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">حجم فایل:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    {formatSize(confirmRestoreItem.size)}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 dark:text-slate-400">محتوای اطلاعاتی نسخه:</span>
                  <div className="text-left font-bold text-[11px] space-y-0.5">
                    <div className="text-emerald-600 dark:text-emerald-400">
                      {confirmRestoreItem.employee_count !== undefined && confirmRestoreItem.employee_count > 0
                        ? `${toPersianDigits(confirmRestoreItem.employee_count)} پرسنل`
                        : 'بدون پرسنل (۰)'}
                      {confirmRestoreItem.department_count ? ` • ${toPersianDigits(confirmRestoreItem.department_count)} واحد سازمانی` : ''}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[10px] font-medium flex items-center justify-end gap-1.5 flex-wrap">
                      {Boolean(confirmRestoreItem.location_count) && (
                        <span>{toPersianDigits(confirmRestoreItem.location_count!)} محل استقرار</span>
                      )}
                      {Boolean(confirmRestoreItem.photo_count) && (
                        <>
                          <span>•</span>
                          <span>{toPersianDigits(confirmRestoreItem.photo_count!)} عکس</span>
                        </>
                      )}
                      {Boolean(confirmRestoreItem.json_count) && (
                        <>
                          <span>•</span>
                          <span>{toPersianDigits(confirmRestoreItem.json_count!)} فایل JSON</span>
                        </>
                      )}
                      {confirmRestoreItem.has_excel_export && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">شامل اکسل</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {confirmRestoreItem.comment && (
                  <div className="flex justify-between items-start pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">توضیحات:</span>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400 text-[11px] max-w-[220px] text-left">
                      {confirmRestoreItem.comment}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong>هشدار مهم:</strong> با اجرای این عملیات، تمامی اطلاعات فعلی کارکنان، واحدها، محل‌ها و تصاویر با داده‌های نسخه انتخابی جایگزین خواهند شد. (یک نسخه ایمنی اضطراری قبل از اعمال به صورت خودکار ذخیره می‌شود).
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirmRestoreItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => executeRestore(confirmRestoreItem.filename)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال بازگردانی داده‌ها...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>تأیید و اجرای بازیابی</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CONFIRM DELETE MODAL ===================== */}
      {confirmDeleteItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    حذف نسخه پشتیبان
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    آزادسازی فضای دیسک سرور
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                آیا از حذف دائمی فایل پشتیبان زیر اطمینان دارید؟ این عملیات غیرقابل بازگشت است:
              </p>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all font-bold">
                {confirmDeleteItem.filename}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={deleting === confirmDeleteItem.filename}
                  onClick={() => executeDelete(confirmDeleteItem.filename)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleting === confirmDeleteItem.filename ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>حذف قطعی</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CONFIRM UPLOAD & RESTORE MODAL ===================== */}
      {pendingUploadFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    تأیید بارگذاری و بازیابی فایل ZIP
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    اعتبارسنجی و جایگزینی داده‌های پایگاه
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => setPendingUploadFile(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">فایل انتخاب شده:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    {pendingUploadFile.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">حجم:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    {formatSize(pendingUploadFile.size)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  محتوای فایل فشرده اعتبارسنجی شده و جایگزین پایگاه داده فعلی خواهد شد. قبل از اجرا، یک نسخه بکاپ اضطراری به طور خودکار ثبت می‌گردد.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPendingUploadFile(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={executeUploadAndRestore}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال بارگذاری و بازیابی...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>شروع بازیابی فایل</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
