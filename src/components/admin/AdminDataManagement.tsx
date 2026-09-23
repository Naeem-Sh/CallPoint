import React, { useState } from 'react';
import { Department, DynamicFieldDefinition } from '../../types.ts';
import { AdminExcel } from './AdminExcel.tsx';
import { AdminBackup } from './AdminBackup.tsx';
import { BatchPhotoImport } from './BatchPhotoImport.tsx';
import { api } from '../../utils/api.ts';
import {
  FileSpreadsheet,
  Download,
  Upload,
  HardDrive,
  FileDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Camera
} from 'lucide-react';

export interface AdminDataManagementProps {
  departments: Department[];
  fields: DynamicFieldDefinition[];
  onRefreshAll: () => void;
  initialSubTab?: 'export' | 'import' | 'photos' | 'backup';
}

export const AdminDataManagement: React.FC<AdminDataManagementProps> = ({
  departments,
  fields,
  onRefreshAll,
  initialSubTab = 'export',
}) => {
  const [subTab, setSubTab] = useState<'export' | 'import' | 'photos' | 'backup'>(initialSubTab);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDownloadTemplate = async () => {
    setTemplateLoading(true);
    setToastMessage(null);
    try {
      await api.downloadExcelTemplate();
      setToastMessage({
        type: 'success',
        text: 'قالب استاندارد اکسل با موفقیت دانلود شد.',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'خطا در دانلود قالب نمونه اکسل',
      });
    } finally {
      setTemplateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Consolidated Master Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
            {subTab === 'backup' ? (
              <HardDrive className="w-6 h-6" />
            ) : (
              <FileSpreadsheet className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                ورود، خروجی و پشتیبان‌گیری
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                مرکز تبادل داده
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              خروجی استاندارد اکسل، واردسازی هوشمند دسته‌ای و مدیریت نسخه‌های پشتیبان کامل سامانه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          {/* Direct Template Download Button (Visible for Excel tabs) */}
          {(subTab === 'export' || subTab === 'import') && (
            <button
              type="button"
              disabled={templateLoading}
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="دانلود فایل نمونه اکسل جهت مشاهده ساختار استاندارد ستون‌ها"
            >
              {templateLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span>دانلود قالب نمونه اکسل</span>
            </button>
          )}

          {/* Consolidated Sub-Tab Switchers */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSubTab('export')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'export'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی اکسل</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('import')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'import'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ورود از اکسل</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('photos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'photos'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>عکس‌های پرسنلی (کد پرسنلی)</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('backup')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'backup'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>پشتیبان‌گیری و بازیابی (ZIP)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Tab Views */}
      {(subTab === 'export' || subTab === 'import') && (
        <AdminExcel
          departments={departments}
          fields={fields}
          onRefresh={onRefreshAll}
          activeTab={subTab}
          onTabChange={(t) => setSubTab(t)}
          hideHeaderCard={true}
        />
      )}

      {subTab === 'photos' && (
        <BatchPhotoImport onPhotosImported={onRefreshAll} />
      )}

      {subTab === 'backup' && (
        <AdminBackup onRefreshAll={onRefreshAll} />
      )}
    </div>
  );
};
