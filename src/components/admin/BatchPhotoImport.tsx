import React, { useState, useRef } from 'react';
import { api } from '../../utils/api.ts';
import { toPersianDigits } from '../../utils/shamsi.ts';
import {
  FolderArchive,
  Upload,
  CheckCircle2,
  AlertCircle,
  Users,
  Image,
  RefreshCw,
  Info,
  Sparkles,
  FileCheck,
  AlertTriangle
} from 'lucide-react';

interface BatchPhotoImportProps {
  onPhotosImported: () => void;
}

interface MatchResult {
  filename: string;
  personnel_code: string;
  matched: boolean;
  employee_name?: string;
  employee_id?: string;
  size_kb: number;
}

export const BatchPhotoImport: React.FC<BatchPhotoImportProps> = ({ onPhotosImported }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{
    matched: MatchResult[];
    unmatched: MatchResult[];
    total: number;
  } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setResults(null);
      setMessage(null);
    }
  };

  const handleUploadPhotos = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });

    try {
      const res = await api.importBatchPhotos(formData);
      setResults({
        matched: res.matched || [],
        unmatched: res.unmatched || [],
        total: res.total || selectedFiles.length,
      });
      setMessage({
        type: 'success',
        text: `عملیات تطبیق انجام شد: ${toPersianDigits(res.matched?.length || 0)} تصویر با موفقیت به پروفایل پرسنل متصل گردید.`,
      });
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onPhotosImported();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'خطا در بارگذاری تصاویر پرسنلی',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informative Guidance Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-3xl p-5 border border-blue-200/80 dark:border-blue-800/60 flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20 shrink-0">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>بارگذاری دسته‌ای عکس‌های پرسنلی بر اساس شماره پرسنلی</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              شما می‌توانید عکس‌های پرسنل را با نام شماره پرسنلی آنها (مثلاً <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">1042.jpg</code> یا <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">98012.png</code> یا فرمت <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">1042_نام.jpg</code>) به‌صورت یکجا یا در قالب فایل فشرده ZIP انتخاب و بارگذاری نمایید.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              سامانه به‌طور خودکار شماره پرسنلی را از نام فایل استخراج کرده و عکس را مستقیماً در کارت و پروفایل فرد متناظر قرار می‌دهد.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100/70 dark:bg-blue-900/50 border border-blue-300/80 dark:border-blue-700 text-blue-900 dark:text-blue-200 text-xs font-bold self-start md:self-auto">
          <Info className="w-4 h-4 text-blue-700 dark:text-blue-300" />
          <span>پشتیبانی از JPG, PNG, WEBP و بسته‌های ZIP</span>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Image className="w-4 h-4 text-blue-600" />
          <span>انتخاب فایل‌ها یا بسته تصاویر</span>
        </h4>

        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 dark:bg-slate-950/50">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,.zip"
            onChange={handleFileChange}
            className="hidden"
            id="batch-photo-input"
          />
          <label
            htmlFor="batch-photo-input"
            className="cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 dark:text-slate-200 block">
                برای انتخاب عکس‌های پرسنل یا بسته ZIP کلیک کنید
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                می‌توانید چند صد عکس را هم‌زمان انتخاب کرده یا یک فایل زیپ حاوی تمام عکس‌ها را ارسال کنید
              </span>
            </div>
          </label>

          {selectedFiles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800">
                {toPersianDigits(selectedFiles.length)} فایل برای بارگذاری انتخاب شده است
              </span>
              <button
                type="button"
                disabled={isUploading}
                onClick={handleUploadPhotos}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال تطبیق و ذخیره‌سازی...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>شروع اتصال خودکار تصاویر به پرسنل</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alert Notifications */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          )}
          <span className="font-semibold leading-relaxed">{message.text}</span>
        </div>
      )}

      {/* Detailed Match Results */}
      {results && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>نتیجه بررسی و اتصال تصاویر</span>
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                متصل شده: {toPersianDigits(results.matched.length)}
              </span>
              {results.unmatched.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                  تطبیق نیافته: {toPersianDigits(results.unmatched.length)}
                </span>
              )}
            </div>
          </div>

          {/* Matched Photos List */}
          {results.matched.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                تصاویر متصل‌شده به پرسنل:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                {results.matched.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate">
                      <strong className="block text-slate-800 dark:text-slate-200 truncate font-bold">
                        {m.employee_name || 'پرسنل'}
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        کد: {m.personnel_code}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold shrink-0">
                      متصل شد
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmatched Photos List */}
          {results.unmatched.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>تصاویری که شماره پرسنلی آنها در سامانه یافت نشد:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-40 overflow-y-auto p-1">
                {results.unmatched.map((u, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {u.filename}
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-bold shrink-0">
                      کد یافت نشد
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
