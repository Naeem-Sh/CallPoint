import React, { useState, useRef } from 'react';
import * as xlsxLib from 'xlsx';
import { Department, DynamicFieldDefinition } from '../../types.ts';
import { api } from '../../utils/api.ts';
import { toPersianDigits } from '../../utils/shamsi.ts';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Table,
  SlidersHorizontal,
  FileDown,
  Sparkles,
  Layers,
  Phone,
  Building2,
  UserCheck,
  HelpCircle,
  Database,
  Trash2,
} from 'lucide-react';

interface AdminExcelProps {
  departments: Department[];
  fields: DynamicFieldDefinition[];
  onRefresh: () => void;
  activeTab?: 'export' | 'import';
  onTabChange?: (tab: 'export' | 'import') => void;
  hideHeaderCard?: boolean;
}

export const AdminExcel: React.FC<AdminExcelProps> = ({
  departments,
  fields,
  onRefresh,
  activeTab: controlledTab,
  onTabChange,
  hideHeaderCard = false,
}) => {
  const [internalTab, setInternalTab] = useState<'export' | 'import'>('export');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = (tab: 'export' | 'import') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Export states
  const [exportDept, setExportDept] = useState<string>('all');
  const [exportLoading, setExportLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Import states
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showMappingTable, setShowMappingTable] = useState(true);
  const [showDataPreview, setShowDataPreview] = useState(true);
  const [conflictResolution, setConflictResolution] = useState<'update' | 'skip' | 'replace_all'>('update');
  const [autoCreateCatalogs, setAutoCreateCatalogs] = useState(true);
  const [createBackup, setCreateBackup] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Status notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available field options categorized for mapping dropdown
  const mappingGroups = [
    {
      group: 'مشخصات هویتی و پرسنلی',
      options: [
        { value: 'personnel_code', label: 'کد / شماره پرسنلی (شناسه اصلی)' },
        { value: 'full_name', label: 'نام و نام خانوادگی (کامل)' },
        { value: 'first_name', label: 'نام' },
        { value: 'last_name', label: 'نام خانوادگی' },
        { value: 'avatar', label: 'نشانی / آدرس تصویر پرسنلی' },
      ],
    },
    {
      group: 'ساختار و جایگاه سازمانی',
      options: [
        { value: 'department_id', label: 'واحد سازمانی (نام یا کد)' },
        { value: 'position_id', label: 'سمت سازمانی / عنوان شغلی' },
        { value: 'print_order', label: 'اولویت نمایش و چاپ سازمانی' },
      ],
    },
    {
      group: 'شماره‌های تماس و ارتباطی',
      options: [
        { value: 'extension', label: 'شماره داخلی ۱ (اصلی)' },
        { value: 'extension_2', label: 'شماره داخلی ۲' },
        { value: 'extension_3', label: 'شماره داخلی ۳' },
        { value: 'direct_phone', label: 'تلفن مستقیم ۱ (اصلی)' },
        { value: 'direct_phone_2', label: 'تلفن مستقیم ۲' },
        { value: 'direct_phone_3', label: 'تلفن مستقیم ۳' },
        { value: 'mobile', label: 'شماره همراه ۱ (اصلی)' },
        { value: 'mobile_2', label: 'شماره همراه ۲' },
        { value: 'mobile_3', label: 'شماره همراه ۳' },
        { value: 'email', label: 'آدرس ایمیل ۱ (اصلی)' },
        { value: 'email_2', label: 'آدرس ایمیل ۲' },
        { value: 'email_3', label: 'آدرس ایمیل ۳' },
      ],
    },
    {
      group: 'موقعیت مکانی و یادداشت‌ها',
      options: [
        { value: 'location_id', label: 'محل استقرار / نام مرکز' },
        { value: 'building', label: 'ساختمان' },
        { value: 'floor', label: 'طبقه' },
        { value: 'room', label: 'شماره اتاق / واحد' },
        { value: 'notes', label: 'توضیحات و یادداشت‌ها' },
      ],
    },
    {
      group: 'فیلدهای پویای سفارشی سازمان',
      options: fields
        .filter(
          (f) =>
            !f.is_system &&
            ![
              'first_name',
              'last_name',
              'full_name',
              'personnel_code',
              'extension',
              'direct_phone',
              'mobile',
              'email',
              'room',
              'notes',
              'department_id',
              'position_id',
              'location_id',
              'avatar',
              'print_order',
            ].includes(f.internal_name)
        )
        .map((f) => ({ value: f.internal_name, label: `${f.persian_label} (پویا)` })),
    },
  ];

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.csv'))) {
      selectFile(droppedFile);
    } else {
      setError('فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل XLSX یا XLS اکسل انتخاب کنید.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      selectFile(selected);
    }
  };

  const selectFile = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewData(null);
    setLocalRows([]);
    setMapping({});
    setError(null);
    setSuccess(null);
  };

  const [localRows, setLocalRows] = useState<any[]>([]);

  // Client-side Excel parser helper for zero-failure preview
  const parseExcelInBrowser = async (excelFile: File) => {
    const arrayBuffer = await excelFile.arrayBuffer();
    const workbook = xlsxLib.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('فایل اکسل شامل برگه معتبری نیست.');
    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[] = xlsxLib.utils.sheet_to_json(sheet, { defval: '' });

    // Collect all detected columns
    const detectedCols: string[] = [];
    if (rawRows.length > 0) {
      Object.keys(rawRows[0]).forEach((col) => {
        const trimmed = String(col || '').trim();
        if (trimmed && !trimmed.startsWith('__EMPTY') && !detectedCols.includes(trimmed)) {
          detectedCols.push(trimmed);
        }
      });
    }

    // Inspect header row range
    if (sheet['!ref']) {
      try {
        const range = xlsxLib.utils.decode_range(sheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = sheet[xlsxLib.utils.encode_cell({ r: range.s.r, c: C })];
          if (cell && cell.v !== undefined && cell.v !== null) {
            const val = String(cell.v).trim();
            if (val && !val.startsWith('__EMPTY') && !detectedCols.includes(val)) {
              detectedCols.push(val);
            }
          }
        }
      } catch {
        // ignore range parsing error
      }
    }

    // Suggested mapping with priority
    const smartMapping: Record<string, string> = {};
    const CLIENT_COLUMN_ALIASES: Record<string, string[]> = {
      personnel_code: ['کد پرسنلی', 'شماره پرسنلی', 'کد', 'کدپرسنلی', 'شماره استخدام', 'شماره پرسنل', 'personnel_code', 'code', 'emp_code'],
      first_name: ['نام', 'نام کوچک', 'first_name', 'firstname', 'fname'],
      last_name: ['نام خانوادگی', 'نام فامیل', 'فامیلی', 'شهرت', 'last_name', 'lastname', 'lname'],
      full_name: ['نام و نام خانوادگی', 'نام کامل', 'پرسنل', 'نام کارمند', 'نام پرسنل', 'full_name', 'fullname'],
      department_id: ['واحد سازمانی', 'نام واحد سازمانی', 'واحد', 'دپارتمان', 'اداره', 'مدیریت', 'بخش', 'سازمان', 'کد واحد سازمانی', 'department', 'dept'],
      position_id: ['سمت سازمانی', 'سمت', 'عنوان شغلی', 'عنوان شغل', 'شغل', 'پست سازمانی', 'پست', 'رده شغلی', 'position', 'job_title'],
      extension: ['شماره داخلی ۱', 'داخلی ۱', 'داخلی 1', 'شماره داخلی اصلی', 'داخلی اصلی', 'شماره داخلی', 'داخلی', 'extension', 'ext', 'ext1'],
      extension_2: ['شماره داخلی ۲', 'داخلی ۲', 'داخلی 2', 'داخلی دوم', 'سایر شماره‌های داخلی', 'extension_2', 'ext2'],
      extension_3: ['شماره داخلی ۳', 'داخلی ۳', 'داخلی 3', 'داخلی سوم', 'extension_3', 'ext3'],
      direct_phone: ['تلفن مستقیم ۱', 'مستقیم ۱', 'مستقیم 1', 'تلفن مستقیم اصلی', 'مستقیم اصلی', 'تلفن مستقیم', 'مستقیم', 'تلفن کار', 'تلفن ثابت', 'direct_phone', 'direct', 'phone'],
      direct_phone_2: ['تلفن مستقیم ۲', 'مستقیم ۲', 'مستقیم 2', 'تلفن مستقیم دوم', 'سایر تلفن‌های مستقیم', 'direct_phone_2', 'direct2'],
      direct_phone_3: ['تلفن مستقیم ۳', 'مستقیم ۳', 'مستقیم 3', 'تلفن مستقیم سوم', 'direct_phone_3', 'direct3'],
      mobile: ['شماره همراه ۱', 'همراه ۱', 'همراه 1', 'موبایل ۱', 'موبایل 1', 'شماره همراه اصلی', 'همراه اصلی', 'شماره همراه', 'تلفن همراه', 'موبایل', 'همراه', 'mobile'],
      mobile_2: ['شماره همراه ۲', 'همراه ۲', 'همراه 2', 'موبایل ۲', 'موبایل 2', 'شماره همراه دوم', 'mobile_2', 'cell2'],
      mobile_3: ['شماره همراه ۳', 'همراه ۳', 'همراه 3', 'موبایل ۳', 'موبایل 3', 'شماره همراه سوم', 'mobile_3', 'cell3'],
      email: ['آدرس ایمیل ۱', 'ایمیل ۱', 'ایمیل 1', 'آدرس ایمیل اصلی', 'ایمیل اصلی', 'آدرس ایمیل', 'ایمیل', 'email', 'email1', 'mail'],
      email_2: ['آدرس ایمیل ۲', 'ایمیل ۲', 'ایمیل 2', 'ایمیل دوم', 'email_2', 'email2'],
      email_3: ['آدرس ایمیل ۳', 'ایمیل ۳', 'ایمیل 3', 'ایمیل سوم', 'email_3', 'email3'],
      location_id: ['محل استقرار / ساختمان', 'محل استقرار', 'موقعیت مکانی', 'محل کار', 'location'],
      building: ['ساختمان', 'نام ساختمان', 'مجتمع', 'برج', 'building'],
      floor: ['طبقه', 'شماره طبقه', 'floor'],
      room: ['شماره اتاق / واحد', 'شماره اتاق', 'اتاق', 'واحد', 'دفتر', 'room', 'unit'],
      status: ['وضعیت', 'وضعیت اشتغال', 'وضعیت همکاری', 'status'],
      notes: ['توضیحات و یادداشت‌ها', 'توضیحات', 'یادداشت', 'notes'],
      print_order: ['اولویت نمایش و چاپ', 'اولویت چاپ', 'اولویت نمایش', 'ترتیب نمایش', 'print_order'],
      avatar: ['نشانی تصویر پرسنلی', 'تصویر پرسنلی', 'عکس پرسنلی', 'avatar'],
    };

    detectedCols.forEach((col) => {
      const norm = col.trim().toLowerCase();
      // Pass 1: exact match
      for (const [field, aliases] of Object.entries(CLIENT_COLUMN_ALIASES)) {
        if (aliases.some((a) => a.trim().toLowerCase() === norm)) {
          smartMapping[col] = field;
          break;
        }
      }
      // Pass 2: dynamic fields
      if (!smartMapping[col]) {
        const df = fields.find(
          (f) => f.persian_label.trim().toLowerCase() === norm || f.internal_name.toLowerCase() === norm
        );
        if (df) smartMapping[col] = df.internal_name;
      }
      // Pass 3: substring only for aliases >= 4 chars
      if (!smartMapping[col]) {
        for (const [field, aliases] of Object.entries(CLIENT_COLUMN_ALIASES)) {
          if (aliases.some((a) => a.length >= 4 && (norm.includes(a.toLowerCase()) || a.toLowerCase().includes(norm)))) {
            smartMapping[col] = field;
            break;
          }
        }
      }
    });

    const previewRows = rawRows.slice(0, 15).map((row, idx) => {
      let fullName = '';
      for (const [c, f] of Object.entries(smartMapping)) {
        if (f === 'full_name' && row[c]) {
          fullName = String(row[c]);
          break;
        }
        if (f === 'first_name' && row[c]) {
          fullName = String(row[c]);
        }
      }
      return {
        rowNumber: idx + 1,
        data: row,
        isDuplicate: false,
        personnel_code: String(row['کد پرسنلی'] || row['کد'] || ''),
        full_name: fullName,
        status: 'new' as const,
      };
    });

    return {
      rawRows,
      detected_columns: detectedCols,
      suggested_mapping: smartMapping,
      preview_rows: previewRows,
      total_rows: rawRows.length,
    };
  };

  // Preview excel file
  const handlePreview = async () => {
    if (!file) return;
    setPreviewLoading(true);
    setError(null);

    // 1. Try server-side preview first
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.previewExcel(fd);
      if (res && res.detected_columns && Array.isArray(res.detected_columns)) {
        setPreviewData(res);
        setLocalRows([]);
        const initialMap: Record<string, string> = {};
        res.detected_columns.forEach((c: string) => {
          initialMap[c] = (res.suggested_mapping && res.suggested_mapping[c]) || '';
        });
        setMapping(initialMap);
        setShowMappingTable(true);
        setShowDataPreview(true);
        setPreviewLoading(false);
        return;
      }
    } catch (serverErr: any) {
      console.warn('Server preview error, activating client-side instant Excel parser:', serverErr);
    }

    // 2. Client-side fallback if server preview fails
    try {
      const localResult = await parseExcelInBrowser(file);
      setLocalRows(localResult.rawRows);
      setPreviewData({
        temp_file: '',
        total_rows: localResult.total_rows,
        detected_columns: localResult.detected_columns,
        suggested_mapping: localResult.suggested_mapping,
        duplicate_count: 0,
        new_count: localResult.total_rows,
        empty_code_count: 0,
        preview_rows: localResult.preview_rows,
      });
      const initialMap: Record<string, string> = {};
      localResult.detected_columns.forEach((c: string) => {
        initialMap[c] = (localResult.suggested_mapping && localResult.suggested_mapping[c]) || '';
      });
      setMapping(initialMap);
      setShowMappingTable(true);
      setShowDataPreview(true);
    } catch (clientErr: any) {
      setError(clientErr.message || 'خطا در بررسی و استخراج ساختار فایل اکسل');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Confirm and execute import
  const handleConfirmImport = async () => {
    const targetTempFile = previewData?.temp_file;
    const hasLocalRows = localRows && localRows.length > 0;

    if (!targetTempFile && !hasLocalRows) {
      setError('اطلاعات فایل در دسترس نیست. لطفاً فایل را مجدداً انتخاب نمایید.');
      return;
    }

    // Filter out unmapped columns (empty string / skip)
    const effectiveMapping: Record<string, string> = {};
    for (const [col, field] of Object.entries(mapping)) {
      const fieldStr = String(field || '').trim();
      if (fieldStr !== '') {
        effectiveMapping[col] = fieldStr;
      }
    }

    // Ensure personnel_code is preserved if suggested mapping detected it and user hasn't explicitly mapped it
    const hasPersonnelCode = Object.values(effectiveMapping).includes('personnel_code');
    if (!hasPersonnelCode && previewData?.suggested_mapping) {
      for (const [col, field] of Object.entries(previewData.suggested_mapping)) {
        if (field === 'personnel_code' && !effectiveMapping[col]) {
          effectiveMapping[col] = 'personnel_code';
          break;
        }
      }
    }

    if (Object.keys(effectiveMapping).length === 0) {
      setError(
        'هیچ ستونی برای واردسازی انتخاب نشده است. تمام ستون‌ها در حالت «صرف‌نظر از این ستون» قرار دارند. لطفاً حداقل ستون‌های کلیدی (مانند کد پرسنلی، نام یا شماره تماس) را مشخص نمایید یا دکمه «تطبیق هوشمند خودکار همه» را بزنید.'
      );
      return;
    }

    if (conflictResolution === 'replace_all') {
      const confirmed = window.confirm(
        'هشدار جدی: با انتخاب گزینه «پاکسازی کامل و جایگزینی»، کلیه کارکنان قبلی از سیستم حذف شده و فقط اطلاعات فایل اکسل جدید درج خواهند شد. آیا مطمئنید؟'
      );
      if (!confirmed) return;
    }

    setImportLoading(true);
    setError(null);

    try {
      const payload: any = {
        mapping: effectiveMapping,
        duplicate_action: conflictResolution,
        conflict_resolution: conflictResolution,
        create_backup_first: createBackup,
        auto_create_catalogs: autoCreateCatalogs,
      };

      if (targetTempFile) {
        payload.temp_file = targetTempFile;
      }
      if (hasLocalRows) {
        payload.rows = localRows;
      }

      const res = await api.confirmExcel(payload);

      setSuccess(
        res.message ||
          `واردسازی با موفقیت انجام شد: ${toPersianDigits(res.inserted ?? res.imported ?? 0)} نفر از کارکنان جدید، ${toPersianDigits(
            res.updated ?? 0
          )} به‌روزرسانی.`
      );
      setFile(null);
      setPreviewData(null);
      setLocalRows([]);
      setMapping({});
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'خطا در واردسازی اکسل');
    } finally {
      setImportLoading(false);
    }
  };

  // Export full Excel with all fields
  const handleExport = async () => {
    setExportLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (exportDept !== 'all') params.department_id = exportDept;

      await api.exportExcel(params);
      setSuccess('فایل اکسل جامع سازمان شامل تمامی فیلدها با موفقیت تولید و دانلود گردید.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت خروجی اکسل');
    } finally {
      setExportLoading(false);
    }
  };

  // Download official Excel template
  const handleDownloadTemplate = async () => {
    setTemplateLoading(true);
    setError(null);
    try {
      await api.downloadExcelTemplate();
      setSuccess('قالب استاندارد اکسل به همراه نمونه سطرهای آزمایشی با موفقیت دانلود شد.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'خطا در دانلود قالب نمونه اکسل');
    } finally {
      setTemplateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      {!hideHeaderCard && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  مدیریت ورود و خروجی اکسل (Excel Hub)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                  شامل تمام فیلدها
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                خروجی استاندارد با کلیه فیلدهای سازمانی، تطبیق هوشمند ستون‌ها و واردسازی دسته‌ای
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
            {/* Direct Template Download Button */}
            <button
              type="button"
              disabled={templateLoading}
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="دانلود فایل نمونه اکسل جهت مشاهده ساختار استاندارد ستون‌ها"
            >
              {templateLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-indigo-500" />}
              <span>دانلود قالب نمونه اکسل (Template)</span>
            </button>

            {/* Tab Switchers */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی اکسل (Export)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'import'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>ورود اکسل (Import)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="flex-1 font-semibold">{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 text-xs"
          >
            بستن
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1 font-semibold">{success}</div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold px-2 py-1 text-xs"
          >
            بستن
          </button>
        </div>
      )}

      {/* ===================== TAB 1: EXPORT (خروجی کامل با همه فیلدها) ===================== */}
      {activeTab === 'export' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    دریافت خروجی جامع اکسل (شامل تمامی فیلدها)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    فایل نهایی حاوی تمامی ۲۸+ ستون رسمی، ساختار راست‌به‌چپ (RTL)، تاریخ‌های شمسی و نام کامل واحدها است.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>بدون حذف هیچ فیلدی (Full Export)</span>
                </span>
              </div>
            </div>

            {/* List of All Fields Included in the Export */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>ستون‌های موجود در فایل خروجی اکسل (Export Fields):</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  تمامی این ستون‌ها به ترتیب منطقی در اکسل درج می‌شوند
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Individual Identity */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                    <span>مشخصات فردی و سازمانی</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">ردیف</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">کد پرسنلی</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">نام</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">نام خانوادگی</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">نام و نام خانوادگی</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">واحد سازمانی</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">کد واحد</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">سمت سازمانی</span>
                  </div>
                </div>

                {/* Telephones */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>شماره‌های تماس و ارتباطی (ستون‌های مجزا)</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">شماره داخلی ۱، ۲، ۳</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">تلفن مستقیم ۱، ۲، ۳</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">شماره همراه ۱، ۲، ۳</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">آدرس ایمیل ۱، ۲، ۳</span>
                  </div>
                </div>

                {/* Location & Details */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>موقعیت مکانی و یادداشت‌ها</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">محل استقرار</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">ساختمان</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">طبقه</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">اتاق / واحد</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">وضعیت</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">توضیحات و یادداشت‌ها</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">اولویت نمایش / چاپ</span>
                  </div>
                </div>

                {/* System and Dates */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-500" />
                    <span>سیستم، تاریخ‌ها و فیلدهای پویا</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">نشانی تصویر پرسنلی</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">شناسه سیستمی</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">تعداد بازدید</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">تاریخ ثبت (شمسی)</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">تاریخ آخرین ویرایش (شمسی)</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">+ کلیه فیلدهای سفارشی</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Options for Export */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                محدوده خروجی بر اساس واحد سازمانی:
              </label>
              <select
                value={exportDept}
                onChange={(e) => setExportDept(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-medium"
              >
                <option value="all">کلیه واحدهای سازمانی (کل دفتر تلفن سازمان)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({toPersianDigits(d.code)})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={exportLoading}
                onClick={handleExport}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {exportLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>دریافت خروجی کامل فایل اکسل (XLSX)</span>
              </button>

              <button
                type="button"
                disabled={templateLoading}
                onClick={handleDownloadTemplate}
                className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {templateLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>دانلود قالب استاندارد با سطر نمونه</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: IMPORT (ورود اکسل با نگاشت هوشمند) ===================== */}
      {activeTab === 'import' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Upload / Drag & Drop Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    مرحله ۱: بارگذاری فایل اکسل کارکنان
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    پشتیبانی از فرمت‌های XLSX و XLS • تطبیق خودکار ستون‌های فارسی و انگلیسی
                  </p>
                </div>
              </div>

              {file && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewData(null);
                    setMapping({});
                  }}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  لغو و انتخاب فایل دیگر
                </button>
              )}
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-8 border-2 border-dashed rounded-3xl text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
                  : file
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:border-indigo-400'
              }`}
            >
              <FileSpreadsheet
                className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                  file ? 'text-emerald-500' : isDragging ? 'text-indigo-600' : 'text-slate-400'
                }`}
              />

              <div className="space-y-2">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {file ? (
                    <span className="text-emerald-700 dark:text-emerald-300">
                      فایل آماده پردازش: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    'فایل اکسل خود را اینجا بکشید یا دکمه زیر را بزنید'
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  شامل ستون‌هایی مثل کد پرسنلی، نام، واحد سازمانی، سمت، داخلی، همراه، ایمیل و ...
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-3">
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>انتخاب فایل از سیستم</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>دریافت نمونه فایل</span>
                </button>
              </div>
            </div>

            {/* Check and Preview Button */}
            {file && !previewData && (
              <button
                type="button"
                disabled={previewLoading}
                onClick={handlePreview}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {previewLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileCheck className="w-4 h-4" />
                )}
                <span>مرحله ۲: بررسی ساختار فایل و پیش‌نمایش نگاشت ستون‌ها</span>
              </button>
            )}

            {/* Detailed Preview & Column Mapping Section */}
            {previewData && (
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block">کل سطرها</span>
                    <span className="text-lg font-black text-indigo-950 dark:text-indigo-200">
                      {toPersianDigits(previewData.total_rows)} سطر
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">کارکنان جدید</span>
                    <span className="text-lg font-black text-emerald-950 dark:text-emerald-200">
                      {toPersianDigits(previewData.new_count ?? (previewData.total_rows - (previewData.duplicate_count || 0)))} نفر
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block">رکوردهای تکراری</span>
                    <span className="text-lg font-black text-amber-950 dark:text-amber-200">
                      {toPersianDigits(previewData.duplicate_count || 0)} نفر
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">ستون‌های شناسایی‌شده</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {toPersianDigits(previewData.detected_columns?.length || 0)} ستون
                    </span>
                  </div>
                </div>

                {/* Column Mapping Section */}
                {previewData.detected_columns && previewData.detected_columns.length > 0 && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          نگاشت هوشمند ستون‌های اکسل به فیلدهای سامانه
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {toPersianDigits(Object.values(mapping).filter((v) => Boolean(String(v || '').trim())).length)} از {toPersianDigits(previewData.detected_columns.length)} ستون متصل شده
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (previewData?.suggested_mapping) {
                              setMapping({ ...previewData.suggested_mapping });
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer flex items-center gap-1 border border-indigo-200/80 dark:border-indigo-800"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>تطبیق هوشمند خودکار همه ستون‌ها</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const resetMap: Record<string, string> = {};
                            previewData?.detected_columns?.forEach((col: string) => {
                              resetMap[col] = '';
                            });
                            setMapping(resetMap);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          <span>صرف‌نظر از همه ستون‌ها</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowMappingTable(!showMappingTable)}
                          className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer mr-1"
                        >
                          <span>{showMappingTable ? 'بستن' : 'مشاهده'}</span>
                          {showMappingTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {showMappingTable && (
                      <div className="p-4 bg-white dark:bg-slate-900 space-y-3 max-h-80 overflow-y-auto">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          به صورت پیش‌فرض همه کامبوباکس‌ها روی <strong>«— صرف‌نظر از این ستون —»</strong> قرار دارند تا داده‌های نامربوط وارد نشوند. لطفاً ستون‌های مورد نظر خود را متصل نمایید یا برای اتصال سریع از دکمه تطبیق خودکار بالا استفاده کنید:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {previewData.detected_columns.map((col: string) => {
                            const sampleVal = previewData.preview_rows?.[0]?.data?.[col] ?? '-';
                            const currentField = mapping[col] !== undefined ? mapping[col] : '';
                            return (
                              <div
                                key={col}
                                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{col}</span>
                                    {currentField && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    نمونه مقدار: {String(sampleVal)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <ArrowRight className="w-3 h-3 text-slate-400 rotate-180" />
                                  <select
                                    value={currentField}
                                    onChange={(e) =>
                                      setMapping((prev) => ({
                                        ...prev,
                                        [col]: e.target.value,
                                      }))
                                    }
                                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium cursor-pointer"
                                  >
                                    <option value="">— صرف‌نظر از این ستون —</option>
                                    {mappingGroups.map((grp) => (
                                      <optgroup key={grp.group} label={grp.group}>
                                        {grp.options.map((opt) => (
                                          <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sample Rows Preview Table */}
                {previewData.preview_rows && previewData.preview_rows.length > 0 && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          پیش‌نمایش داده‌های خوانده‌شده ({toPersianDigits(previewData.preview_rows.length)} سطر نمونه)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDataPreview(!showDataPreview)}
                        className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showDataPreview ? 'بستن پیش‌نمایش جدول' : 'مشاهده جدول سطرهای فایل'}</span>
                        {showDataPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {showDataPreview && (
                      <div className="overflow-x-auto max-h-56">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                            <tr>
                              <th className="p-2.5 w-12 text-center">ردیف</th>
                              <th className="p-2.5">وضعیت شناسایی</th>
                              <th className="p-2.5">کد پرسنلی</th>
                              <th className="p-2.5">نام و نام خانوادگی</th>
                              {previewData.detected_columns.slice(0, 4).map((c: string) => (
                                <th key={c} className="p-2.5">{c}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {previewData.preview_rows.map((pr: any) => (
                              <tr key={pr.rowNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="p-2.5 text-center font-mono text-slate-400">{toPersianDigits(pr.rowNumber)}</td>
                                <td className="p-2.5">
                                  {pr.status === 'new' ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                      کارکنان جدید
                                    </span>
                                  ) : pr.status === 'update' ? (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                                      بروزرسانی تکراری
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                                      بدون کد
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                                  {toPersianDigits(pr.personnel_code)}
                                </td>
                                <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                  {pr.full_name}
                                </td>
                                {previewData.detected_columns.slice(0, 4).map((c: string) => (
                                  <td key={c} className="p-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
                                    {String(pr.data[c] ?? '-')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Import Strategy Options */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                    نحوه اعمال اطلاعات بر روی کارکنان موجود:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setConflictResolution('update')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        conflictResolution === 'update'
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs mb-1">به‌روزرسانی رکوردهای موجود</div>
                      <div className="text-[11px] opacity-80">
                        شماره‌ها و اطلاعات جدید بر روی کارکنان با کد یکسان ثبت می‌شود (پیش‌فرض).
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConflictResolution('skip')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        conflictResolution === 'skip'
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs mb-1">صرف‌نظر از ردیف‌های تکراری</div>
                      <div className="text-[11px] opacity-80">
                        فقط کارکنان با کد جدید اضافه می‌شوند و اطلاعات قبلی دست‌نخورده می‌ماند.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConflictResolution('replace_all')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        conflictResolution === 'replace_all'
                          ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs mb-1 text-rose-700 dark:text-rose-400">پاکسازی کامل و جایگزینی</div>
                      <div className="text-[11px] opacity-80">
                        تمام کارکنان فعلی پاک شده و تنها محتوای این فایل اکسل ثبت می‌گردد.
                      </div>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={createBackup}
                        onChange={(e) => setCreateBackup(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        تهیه نسخه پشتیبان خودکار (Auto Backup) پیش از اعمال تغییرات
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoCreateCatalogs}
                        onChange={(e) => setAutoCreateCatalogs(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        تعریف خودکار واحدها یا سمت‌های جدیدِ ثبت‌شده در اکسل
                      </span>
                    </label>
                  </div>
                </div>

                {/* Final Submission */}
                <button
                  type="button"
                  disabled={importLoading}
                  onClick={handleConfirmImport}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {importLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  <span>تایید نهایی و واردسازی به دفتر تلفن سازمان</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
