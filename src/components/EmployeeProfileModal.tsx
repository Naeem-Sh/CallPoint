import React, { useState } from 'react';
import { Employee, DynamicFieldDefinition, Department, Position, LocationItem, PhoneNumber } from '../types.ts';
import { toPersianDigits, formatPersianDateTime } from '../utils/shamsi.ts';
import { formatEmployeeLocation } from '../utils/location.ts';
import { MeteorAvatar } from './MeteorAvatar.tsx';
import { ProfileCompletenessCircle } from './ProfileCompletenessCircle.tsx';
import {
  X,
  Phone,
  Mail,
  Copy,
  Check,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  User,
  Shield,
  FileText,
  PhoneCall,
  Smartphone,
  Printer,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  fields?: DynamicFieldDefinition[];
  departments: Department[];
  positions: Position[];
  locations: LocationItem[];
  onClose: () => void;
  onDuplicate?: (employee: Employee) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  fields = [],
  departments,
  positions,
  locations,
  onClose,
  onDuplicate,
  theme,
  onToggleTheme,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!employee) return null;

  const dept = departments.find((d) => d.id === employee.department_id);
  const pos = positions.find((p) => p.id === employee.position_id);
  const loc = locations.find((l) => l.id === employee.location_id);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handlePrint = () => {
    window.print();
  };

  // Active fields for profile (excluding image which is rendered on top hero)
  const activeFields = fields
    .filter((f) => f.active && f.type !== 'image' && f.internal_name !== 'avatar')
    .sort((a, b) => a.display_order - b.display_order);

  const phoneTypeLabels: Record<string, string> = {
    extension: 'داخلی',
    office: 'مستقیم',
    mobile: 'همراه',
    fax: 'فکس',
    home: 'منزل',
    other: 'تلفن',
  };

  // Consolidate phone list and contact channels
  const extensions = Array.from(
    new Set(
      [
        employee.extension,
        ...(employee.phones?.filter((p) => p.type === 'extension').map((p) => p.number) || []),
      ]
        .map((s) => s?.trim())
        .filter(Boolean) as string[]
    )
  );

  const directPhones = Array.from(
    new Set(
      [
        employee.direct_phone,
        ...(employee.phones?.filter((p) => p.type === 'office' || p.type === 'direct' || p.type === 'phone').map((p) => p.number) || []),
      ]
        .map((s) => s?.trim())
        .filter(Boolean) as string[]
    )
  );

  const mobiles = Array.from(
    new Set(
      [
        employee.mobile,
        ...(employee.phones?.filter((p) => p.type === 'mobile').map((p) => p.number) || []),
      ]
        .map((s) => s?.trim())
        .filter(Boolean) as string[]
    )
  );

  const emails = Array.from(
    new Set(
      [
        ...(employee.email ? employee.email.split(/[\n,;]+/).map((e: string) => e.trim()) : []),
        ...(Array.isArray((employee as any).emails) ? (employee as any).emails.map((e: string) => e.trim()) : []),
        ...(employee.custom_fields?.email ? String(employee.custom_fields.email).split(/[\n,;]+/).map((e: string) => e.trim()) : []),
      ].filter(Boolean) as string[]
    )
  );

  const otherPhones = employee.phones
    ? employee.phones.filter(
        (p) =>
          (p.type === 'fax' || p.type === 'home' || p.type === 'other') &&
          !extensions.includes(p.number) &&
          !directPhones.includes(p.number) &&
          !mobiles.includes(p.number)
      )
    : [];

  return (
    <div
      id="employee-profile-modal-root"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static"
    >
      <div
        id="employee-profile-modal-card"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-slate-300 print:max-w-full"
        dir="rtl"
      >
        {/* Header Ribbon */}
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 relative print:h-16">
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handlePrint}
            aria-label="چاپ"
            className="absolute top-4 left-16 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer print:hidden"
            title="چاپ"
          >
            <Printer className="w-5 h-5" />
          </button>
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              id="profile-ribbon-theme-toggle"
              aria-label="تغییر پوسته"
              className="absolute top-4 left-28 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer flex items-center justify-center active:scale-95 print:hidden"
              title={theme === 'dark' ? 'روشن' : 'تاریک'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-300" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-100" />
              )}
            </button>
          )}
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar & Hero Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14 mb-6 text-center sm:text-right print:-mt-10">
            <div className="ring-4 ring-white dark:ring-slate-900 rounded-3xl shadow-xl bg-white dark:bg-slate-900 z-20 relative">
              <MeteorAvatar
                src={employee.avatar}
                name={employee.full_name || `${employee.first_name} ${employee.last_name}`}
                alt={employee.full_name}
                size="xl"
                shape="rounded"
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {employee.full_name || `${employee.first_name} ${employee.last_name}`}
                </h3>
                <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                  پرسنلی: {toPersianDigits(employee.personnel_code)}
                </span>
                <ProfileCompletenessCircle
                  employee={employee}
                  locations={locations}
                  size="sm"
                  showLabel={true}
                />
                {onToggleTheme && (
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    id="profile-hero-theme-toggle"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 transition-all shadow-2xs cursor-pointer active:scale-95 print:hidden"
                    title="تغییر پوسته"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>روشن</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>تاریک</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                {pos?.title || '-'} • <span className="text-purple-600 dark:text-purple-400">{dept?.name || '-'}</span>
              </p>
            </div>
          </div>

          {/* Quick Contact Box */}
          <div className="bg-slate-50 dark:bg-slate-950/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 mb-6 print:mb-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>تماس</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Extensions Box */}
              {extensions.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>داخلی</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {extensions.map((ext, i) => {
                      const key = `modal-ext-${i}`;
                      const isCopied = copiedKey === key;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30">
                          <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                            {toPersianDigits(ext)}
                          </span>
                          <div className="flex items-center gap-1">
                            <a
                              href={`tel:${ext}`}
                              className="p-1 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 transition-colors"
                              title="تماس"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(ext, key)}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                              title="کپی داخلی"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Direct Phones Box */}
              {directPhones.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>مستقیم</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {directPhones.map((dir, i) => {
                      const key = `modal-dir-${i}`;
                      const isCopied = copiedKey === key;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30">
                          <a
                            href={`tel:${dir}`}
                            className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 hover:underline"
                            dir="ltr"
                          >
                            {toPersianDigits(dir)}
                          </a>
                          <div className="flex items-center gap-1">
                            <a
                              href={`tel:${dir}`}
                              className="p-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                              title="تماس مستقیم"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(dir, key)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                              title="کپی مستقیم"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mobiles Box */}
              {mobiles.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>همراه</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {mobiles.map((mob, i) => {
                      const key = `modal-mob-${i}`;
                      const isCopied = copiedKey === key;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/30">
                          <a
                            href={`tel:${mob}`}
                            className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400 hover:underline"
                            dir="ltr"
                          >
                            {toPersianDigits(mob)}
                          </a>
                          <div className="flex items-center gap-1">
                            <a
                              href={`tel:${mob}`}
                              className="p-1 rounded-lg bg-amber-100/70 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 hover:bg-amber-200 transition-colors"
                              title="تماس همراه"
                            >
                              <Smartphone className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(mob, key)}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
                              title="کپی همراه"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Emails Box */}
              {emails.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>ایمیل</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {emails.map((eml, i) => {
                      const key = `modal-eml-${i}`;
                      const isCopied = copiedKey === key;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-sky-50/50 dark:bg-sky-950/30">
                          <a
                            href={`mailto:${eml}`}
                            className="text-xs font-bold font-mono text-sky-700 dark:text-sky-300 hover:underline truncate max-w-[180px]"
                            dir="ltr"
                          >
                            {eml}
                          </a>
                          <div className="flex items-center gap-1">
                            <a
                              href={`mailto:${eml}`}
                              className="p-1 rounded-lg bg-sky-100/70 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 hover:bg-sky-200 transition-colors"
                              title="ایمیل"
                            >
                              <Mail className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(eml, key)}
                              className="p-1 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors cursor-pointer"
                              title="کپی ایمیل"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Other Phones / Fax Box */}
              {otherPhones.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>سایر خطوط</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {otherPhones.map((ph, i) => {
                      const key = `modal-oth-${i}`;
                      const isCopied = copiedKey === key;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {ph.type === 'fax' ? 'فکس' : (ph.label?.replace(/\s*\d+$/, '') || 'تلفن')}:
                          </span>
                          <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                            {toPersianDigits(ph.number)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(ph.number, key)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="کپی"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Fields Details Grid */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>سایر مشخصات</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-400 block text-[11px] mb-0.5">نام:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {employee.first_name} {employee.last_name}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-400 block text-[11px] mb-0.5">شماره پرسنلی:</span>
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {toPersianDigits(employee.personnel_code)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-400 block text-[11px] mb-0.5">واحد:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dept?.name || '-'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-400 block text-[11px] mb-0.5">سمت:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{pos?.title || '-'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80 sm:col-span-2">
                <span className="text-slate-400 block text-[11px] mb-0.5">محل استقرار:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatEmployeeLocation(employee, locations) || '-'}
                </span>
              </div>

              {/* Custom Dynamic Fields */}
              {employee.custom_fields &&
                typeof employee.custom_fields === 'object' &&
                Object.entries(employee.custom_fields || {}).map(([key, val]) => {
                  const fDef = fields.find((f) => f.internal_name === key);
                  const label = fDef ? fDef.persian_label : key;
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80"
                    >
                      <span className="text-slate-400 block text-[11px] mb-0.5">{label}:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{String(val || '-')}</span>
                    </div>
                  );
                })}
            </div>

            {employee.notes && (
              <div className="mt-3 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-xs">
                <span className="text-amber-700 dark:text-amber-400 font-bold block mb-1">یادداشت:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{employee.notes}</p>
              </div>
            )}
          </div>

          {/* Footer Metadata & Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span>شناسه: {employee.id}</span>
              <span>به‌روزرسانی: {formatPersianDateTime(employee.updated_at)}</span>
              <span>جستجو: {toPersianDigits(employee.search_count || 0)}</span>
            </div>

            {onDuplicate && (
              <button
                type="button"
                onClick={() => onDuplicate(employee)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200/80 dark:border-amber-800 transition-colors cursor-pointer"
                title="کارت مشابه"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>کارت مشابه</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
