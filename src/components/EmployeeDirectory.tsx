import React, { useState } from 'react';
import { Employee, DynamicFieldDefinition, Department, Position, LocationItem } from '../types.ts';
import { toPersianDigits, formatPersianDateTime } from '../utils/shamsi.ts';
import { formatEmployeeLocation } from '../utils/location.ts';
import { MeteorAvatar } from './MeteorAvatar.tsx';
import {
  Phone,
  Mail,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  User,
  Building,
  Briefcase,
  MapPin,
  ExternalLink,
  PhoneCall,
  Smartphone,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';

interface EmployeeDirectoryProps {
  employees: Employee[];
  fields: DynamicFieldDefinition[];
  departments: Department[];
  positions: Position[];
  locations: LocationItem[];
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  onSelectEmployee: (employee: Employee) => void;
  loading?: boolean;
  onOpenPrint?: () => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  employees,
  fields,
  departments,
  positions,
  locations,
  sortField,
  sortOrder,
  onSortChange,
  onSelectEmployee,
  loading,
  onOpenPrint,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    const saved = localStorage.getItem('org_directory_view_mode');
    if (saved === 'cards' || saved === 'table') {
      return saved;
    }
    return 'table'; // Default is table view as requested
  });

  const handleViewModeChange = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('org_directory_view_mode', mode);
  };

  const deptMap = new Map<string, Department>(departments.map((d) => [d.id, d]));
  const posMap = new Map<string, string>(positions.map((p) => [p.id, p.title]));
  const locMap = new Map<string, string>(locations.map((l) => [l.id, l.name]));
  const locItemMap = new Map<string, LocationItem>(locations.map((l) => [l.id, l]));

  // Default fallback fields in case dynamic fields haven't loaded
  const fallbackTableFields: DynamicFieldDefinition[] = [
    { id: 'f-avatar', internal_name: 'avatar', persian_label: 'تصویر', type: 'image', required: false, active: true, visible: true, searchable: false, filterable: false, importable: true, exportable: true, display_order: 1 },
    { id: 'f-code', internal_name: 'personnel_code', persian_label: 'شماره پرسنلی', type: 'text', required: true, active: true, visible: true, searchable: true, filterable: false, importable: true, exportable: true, display_order: 2 },
    { id: 'f-name', internal_name: 'full_name', persian_label: 'نام و نام خانوادگی', type: 'text', required: true, active: true, visible: true, searchable: true, filterable: false, importable: true, exportable: true, display_order: 3 },
    { id: 'f-dept', internal_name: 'department_id', persian_label: 'واحد سازمانی', type: 'department', required: true, active: true, visible: true, searchable: false, filterable: true, importable: true, exportable: true, display_order: 4 },
    { id: 'f-pos', internal_name: 'position_id', persian_label: 'سمت سازمانی', type: 'position', required: true, active: true, visible: true, searchable: false, filterable: true, importable: true, exportable: true, display_order: 5 },
    { id: 'f-ext', internal_name: 'extension', persian_label: 'شماره داخلی', type: 'phone', required: false, active: true, visible: true, searchable: true, filterable: false, importable: true, exportable: true, display_order: 6 },
    { id: 'f-dir', internal_name: 'direct_phone', persian_label: 'تلفن مستقیم', type: 'phone', required: false, active: true, visible: true, searchable: true, filterable: false, importable: true, exportable: true, display_order: 7 },
    { id: 'f-mob', internal_name: 'mobile', persian_label: 'همراه', type: 'phone', required: false, active: true, visible: true, searchable: true, filterable: false, importable: true, exportable: true, display_order: 8 },
    { id: 'f-email', internal_name: 'email', persian_label: 'پست الکترونیک', type: 'email', required: false, active: true, visible: true, searchable: true, filterable: false, importable: true, exportable: true, display_order: 9 },
    { id: 'f-room', internal_name: 'room', persian_label: 'اتاق / استقرار', type: 'text', required: false, active: true, visible: true, searchable: false, filterable: false, importable: true, exportable: true, display_order: 10 },
  ];

  // Active & visible fields ordered by display_order (excluding status)
  const loadedFields = (fields || []).filter((f) => f.active && f.visible && f.internal_name !== 'status');
  const visibleFields = loadedFields.length >= 3
    ? loadedFields.sort((a, b) => a.display_order - b.display_order)
    : fallbackTableFields;

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const renderFieldValue = (emp: Employee, field: DynamicFieldDefinition) => {
    const internal = field.internal_name;

    // 1. Avatar field
    if (field.type === 'image' || internal === 'avatar') {
      return (
        <div className="flex items-center justify-center">
          <MeteorAvatar
            src={emp.avatar}
            name={emp.full_name || `${emp.first_name} ${emp.last_name}`}
            size="sm"
            shape="circle"
          />
        </div>
      );
    }

    // 2. Full Name / Name
    if (internal === 'full_name' || internal === 'first_name' || internal === 'last_name') {
      return (
        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>{emp.full_name || `${emp.first_name} ${emp.last_name}`}</span>
        </div>
      );
    }

    // 3. Personnel Code
    if (internal === 'personnel_code') {
      return (
        <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 text-xs">
          {toPersianDigits(emp.personnel_code)}
        </span>
      );
    }

    // 4. Department
    if (field.type === 'department' || internal === 'department_id') {
      const dept = deptMap.get(emp.department_id);
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 text-xs font-semibold">
          <Building className="w-3 h-3 text-purple-500 shrink-0" />
          <span className="truncate max-w-[160px]">{dept ? dept.name : '-'}</span>
        </span>
      );
    }

    // 5. Position
    if (field.type === 'position' || internal === 'position_id') {
      const posTitle = posMap.get(emp.position_id) || '-';
      return (
        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium text-xs">
          <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{posTitle}</span>
        </span>
      );
    }

    // 6. Extension
    if (internal === 'extension') {
      if (!emp.extension) return <span className="text-slate-300 dark:text-slate-600">-</span>;
      const copyKey = `ext-${emp.id}`;
      return (
        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-xl font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          <span>{toPersianDigits(emp.extension)}</span>
          <button
            type="button"
            onClick={(e) => handleCopy(e, emp.extension!, copyKey)}
            title="کپی شماره داخلی"
            className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {copiedId === copyKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
          </button>
        </div>
      );
    }

    // 7. Direct Phone
    if (internal === 'direct_phone') {
      if (!emp.direct_phone) return <span className="text-slate-300 dark:text-slate-600">-</span>;
      const copyKey = `dir-${emp.id}`;
      return (
        <div className="inline-flex items-center gap-1 text-xs">
          <a
            href={`tel:${emp.direct_phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-emerald-700 dark:text-emerald-400 hover:underline font-mono"
            title="تماس مستقیم"
          >
            {toPersianDigits(emp.direct_phone)}
          </a>
          <button
            type="button"
            onClick={(e) => handleCopy(e, emp.direct_phone!, copyKey)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            title="کپی شماره مستقیم"
          >
            {copiedId === copyKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      );
    }

    // 8. Mobile
    if (field.type === 'mobile' || internal === 'mobile') {
      if (!emp.mobile) return <span className="text-slate-300 dark:text-slate-600">-</span>;
      const copyKey = `mob-${emp.id}`;
      return (
        <div className="inline-flex items-center gap-1 text-xs">
          <a
            href={`tel:${emp.mobile}`}
            onClick={(e) => e.stopPropagation()}
            className="text-blue-700 dark:text-blue-400 hover:underline font-mono"
            title="تماس با همراه"
          >
            {toPersianDigits(emp.mobile)}
          </a>
          <button
            type="button"
            onClick={(e) => handleCopy(e, emp.mobile!, copyKey)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            title="کپی شماره همراه"
          >
            {copiedId === copyKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      );
    }

    // 9. Email
    if (field.type === 'email' || internal === 'email') {
      if (!emp.email) return <span className="text-slate-300 dark:text-slate-600">-</span>;
      const copyKey = `eml-${emp.id}`;
      return (
        <div className="inline-flex items-center gap-1 text-xs">
          <a
            href={`mailto:${emp.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono truncate max-w-[140px]"
            title="ارسال ایمیل"
          >
            {emp.email}
          </a>
          <button
            type="button"
            onClick={(e) => handleCopy(e, emp.email!, copyKey)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            title="کپی ایمیل"
          >
            {copiedId === copyKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      );
    }

    // 10. Location
    if (field.type === 'location' || internal === 'location_id') {
      const locText = formatEmployeeLocation(emp, locItemMap) || '-';
      return (
        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 text-xs" title={locText}>
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate max-w-[160px]">{locText}</span>
        </span>
      );
    }

    // 11. Generic / Custom field
    let val = (emp as any)[internal];
    if (val === undefined && emp.custom_fields) {
      val = emp.custom_fields[internal];
    }
    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-300 dark:text-slate-600">-</span>;
    }
    if (typeof val === 'boolean') {
      return val ? 'بله' : 'خیر';
    }
    return <span className="text-xs text-slate-700 dark:text-slate-300">{String(val)}</span>;
  };

  return (
    <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              فهرست کارکنان
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              {toPersianDigits(employees.length)} نفر
            </span>
          </div>
        </div>

        {/* Actions & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-end">
          {/* View Mode Switcher: Cards vs Table */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>نمایش کارتی</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>نمایش جدولی</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">در حال دریافت فهرست کارکنان...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          <User className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            هیچ رکوردی مطابق با فیلترها و جستجوی شما یافت نشد.
          </p>
          <p className="text-xs text-slate-400 mt-1">عبارت جستجو یا فیلترهای اعمال‌شده را تغییر دهید.</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* ================= CARDS VIEW ================= */
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp) => {
            const dept = deptMap.get(emp.department_id);
            const posTitle = posMap.get(emp.position_id) || '-';
            const formattedLocation = formatEmployeeLocation(emp, locItemMap);

            return (
              <div
                key={emp.id}
                onClick={() => onSelectEmployee(emp)}
                className="bg-white dark:bg-slate-950/70 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group cursor-pointer relative"
              >
                {/* Top Accent Line */}
                <div className="absolute top-0 inset-x-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-70 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Top row: Avatar + Name + Personnel Code */}
                  <div className="flex items-start gap-3 mb-3">
                    <MeteorAvatar
                      src={emp.avatar}
                      name={emp.full_name || `${emp.first_name} ${emp.last_name}`}
                      alt={emp.full_name}
                      size="md"
                      shape="rounded"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                        </h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold shrink-0">
                          {toPersianDigits(emp.personnel_code)}
                        </span>
                      </div>

                      <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate mt-0.5">
                        {posTitle}
                      </div>
                    </div>
                  </div>

                  {/* Department Badge */}
                  <div className="mb-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 truncate max-w-full">
                      <Building className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="truncate">{dept ? dept.name : '-'}</span>
                    </span>
                  </div>

                  {/* Room and Location info if available */}
                  {formattedLocation && (
                    <div
                      className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5"
                      title={formattedLocation}
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500/80 dark:text-rose-400/80 shrink-0" />
                      <span className="truncate">{formattedLocation}</span>
                    </div>
                  )}

                  {/* Key Contact Information */}
                  {(() => {
                    const extensions = Array.from(
                      new Set(
                        [
                          emp.extension,
                          ...(emp.phones?.filter((p) => p.type === 'extension').map((p) => p.number) || []),
                        ]
                          .map((s) => s?.trim())
                          .filter(Boolean) as string[]
                      )
                    );

                    const directPhones = Array.from(
                      new Set(
                        [
                          emp.direct_phone,
                          ...(emp.phones?.filter((p) => p.type === 'office' || p.type === 'direct' || p.type === 'phone').map((p) => p.number) || []),
                        ]
                          .map((s) => s?.trim())
                          .filter(Boolean) as string[]
                      )
                    );

                    const mobiles = Array.from(
                      new Set(
                        [
                          emp.mobile,
                          ...(emp.phones?.filter((p) => p.type === 'mobile').map((p) => p.number) || []),
                        ]
                          .map((s) => s?.trim())
                          .filter(Boolean) as string[]
                      )
                    );

                    const emails = Array.from(
                      new Set(
                        [
                          ...(emp.email ? emp.email.split(/[\n,;]+/).map((e: string) => e.trim()) : []),
                          ...(Array.isArray((emp as any).emails) ? (emp as any).emails.map((e: string) => e.trim()) : []),
                          ...(emp.custom_fields?.email ? String(emp.custom_fields.email).split(/[\n,;]+/).map((e: string) => e.trim()) : []),
                        ].filter(Boolean) as string[]
                      )
                    );

                    return (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        {/* Internal Extensions */}
                        {extensions.length > 0 && (
                          <div className="p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/50 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                                <Phone className="w-3.5 h-3.5 text-indigo-500" />
                                <span>داخلی</span>
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {extensions.map((ext, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200/70 dark:border-indigo-800/70 shadow-2xs"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                                    <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm">
                                      {toPersianDigits(ext)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopy(e, ext, `card-ext-${emp.id}-${i}`)}
                                    className="p-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-500 hover:text-indigo-700 cursor-pointer"
                                    title="کپی داخلی"
                                  >
                                    {copiedId === `card-ext-${emp.id}-${i}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Direct Phones */}
                        {directPhones.length > 0 && (
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-1.5 border border-slate-100 dark:border-slate-800">
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold px-0.5">
                              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                              <span>مستقیم</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              {directPhones.map((dir, i) => (
                                <div key={i} className="flex items-center justify-between text-xs px-0.5 py-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <PhoneCall className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <a
                                      href={`tel:${dir}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline text-xs"
                                      dir="ltr"
                                    >
                                      {toPersianDigits(dir)}
                                    </a>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopy(e, dir, `card-dp-${emp.id}-${i}`)}
                                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="کپی شماره مستقیم"
                                  >
                                    {copiedId === `card-dp-${emp.id}-${i}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mobiles */}
                        {mobiles.length > 0 && (
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-1.5 border border-slate-100 dark:border-slate-800">
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-bold px-0.5">
                              <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                              <span>همراه</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              {mobiles.map((mob, i) => (
                                <div key={i} className="flex items-center justify-between text-xs px-0.5 py-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <Smartphone className="w-3 h-3 text-amber-500 shrink-0" />
                                    <a
                                      href={`tel:${mob}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="font-mono text-amber-600 dark:text-amber-400 hover:underline text-xs"
                                      dir="ltr"
                                    >
                                      {toPersianDigits(mob)}
                                    </a>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopy(e, mob, `card-mob-${emp.id}-${i}`)}
                                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="کپی شماره همراه"
                                  >
                                    {copiedId === `card-mob-${emp.id}-${i}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Emails */}
                        {emails.length > 0 && (
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 space-y-1.5 border border-slate-100 dark:border-slate-800">
                            <div className="text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1.5 font-bold px-0.5">
                              <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span>ایمیل</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              {emails.map((eml, i) => (
                                <div key={i} className="flex items-center justify-between text-xs px-0.5 py-0.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Mail className="w-3 h-3 text-sky-500 shrink-0" />
                                    <a
                                      href={`mailto:${eml}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="font-mono text-sky-600 dark:text-sky-400 hover:underline text-xs truncate"
                                      dir="ltr"
                                    >
                                      {eml}
                                    </a>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopy(e, eml, `card-eml-${emp.id}-${i}`)}
                                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                                    title="کپی ایمیل"
                                  >
                                    {copiedId === `card-eml-${emp.id}-${i}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Card Action Link removed as requested */}
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE VIEW (2-ROW LAYOUT PER EMPLOYEE) ================= */
        <div className="w-full">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold select-none">
                  <th
                    onClick={() => onSortChange('full_name')}
                    className="py-3 px-3.5 text-right w-[27%] hover:bg-slate-200/70 dark:hover:bg-slate-700/70 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>نام و نام خانوادگی</span>
                      {sortField === 'full_name' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 opacity-25" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => onSortChange('department_id')}
                    className="py-3 px-3.5 text-right w-[25%] hover:bg-slate-200/70 dark:hover:bg-slate-700/70 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>واحد و سمت</span>
                      {sortField === 'department_id' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 opacity-25" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => onSortChange('extension')}
                    className="py-3 px-2 text-center w-[12%] hover:bg-slate-200/70 dark:hover:bg-slate-700/70 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>داخلی</span>
                      {sortField === 'extension' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 opacity-25" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => onSortChange('direct_phone')}
                    className="py-3 px-2 text-center w-[13%] hover:bg-slate-200/70 dark:hover:bg-slate-700/70 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>خط مستقیم</span>
                      {sortField === 'direct_phone' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 opacity-25" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => onSortChange('mobile')}
                    className="py-3 px-2 text-center w-[14%] hover:bg-slate-200/70 dark:hover:bg-slate-700/70 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>همراه</span>
                      {sortField === 'mobile' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 opacity-25" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-2 text-center w-[9%]">اقدامات</th>
                </tr>
              </thead>

              {employees.map((emp, idx) => {
                const dept = deptMap.get(emp.department_id);
                const posTitle = posMap.get(emp.position_id);
                const formattedLocation = formatEmployeeLocation(emp, locItemMap);
                const isEven = idx % 2 === 1;

                const extensions = Array.from(
                  new Set(
                    [
                      emp.extension,
                      ...(emp.phones?.filter((p) => p.type === 'extension').map((p) => p.number) || []),
                    ]
                      .map((s) => s?.trim())
                      .filter(Boolean) as string[]
                  )
                );

                const directPhones = Array.from(
                  new Set(
                    [
                      emp.direct_phone,
                      ...(emp.phones?.filter((p) => p.type === 'office' || p.type === 'direct' || p.type === 'phone').map((p) => p.number) || []),
                    ]
                      .map((s) => s?.trim())
                      .filter(Boolean) as string[]
                  )
                );

                const mobiles = Array.from(
                  new Set(
                    [
                      emp.mobile,
                      ...(emp.phones?.filter((p) => p.type === 'mobile').map((p) => p.number) || []),
                    ]
                      .map((s) => s?.trim())
                      .filter(Boolean) as string[]
                  )
                );

                const emails = Array.from(
                  new Set(
                    [
                      ...(emp.email ? emp.email.split(/[\n,;]+/).map((e: string) => e.trim()) : []),
                      ...(Array.isArray((emp as any).emails) ? (emp as any).emails.map((e: string) => e.trim()) : []),
                      ...(emp.custom_fields?.email ? String(emp.custom_fields.email).split(/[\n,;]+/).map((e: string) => e.trim()) : []),
                    ].filter(Boolean) as string[]
                  )
                );

                return (
                  <tbody
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp)}
                    className={`border-b border-slate-200 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer group ${
                      isEven ? 'bg-slate-50/50 dark:bg-slate-900/30' : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    {/* ===== ROW 1: Main identity & primary phone lines ===== */}
                    <tr className="border-b-0">
                      {/* Col 1: Avatar + Name + Personnel Code */}
                      <td className="pt-3 pb-1 px-3.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <MeteorAvatar
                            src={emp.avatar}
                            name={emp.full_name || `${emp.first_name} ${emp.last_name}`}
                            alt={emp.full_name}
                            size="sm"
                            shape="circle"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate flex items-center gap-1.5">
                              <span>{emp.full_name || `${emp.first_name} ${emp.last_name}`}</span>
                              {emp.personnel_code && (
                                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium">
                                  {toPersianDigits(emp.personnel_code)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Department & Position */}
                      <td className="pt-3 pb-1 px-3.5 align-middle">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 truncate flex items-center gap-1">
                            <Building className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>{dept?.name || '-'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{posTitle || '-'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Col 3: Extension(s) */}
                      <td className="pt-3 pb-1 px-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        {extensions.length > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            {extensions.map((ext, i) => (
                              <div
                                key={i}
                                title="داخلی"
                                className="inline-flex items-center justify-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border border-indigo-200/60 dark:border-indigo-800/60 transition-transform hover:scale-102"
                              >
                                <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>{toPersianDigits(ext)}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(e, ext, `ext-${emp.id}-${i}`)}
                                  title="کپی داخلی"
                                  className="p-0.5 hover:text-indigo-900 dark:hover:text-white transition-colors cursor-pointer mr-0.5"
                                >
                                  {copiedId === `ext-${emp.id}-${i}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-indigo-400" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                        )}
                      </td>

                      {/* Col 4: Direct Phone(s) */}
                      <td className="pt-3 pb-1 px-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        {directPhones.length > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            {directPhones.map((dir, i) => (
                              <div
                                key={i}
                                title="مستقیم"
                                className="inline-flex items-center justify-center gap-1.5 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60 transition-transform hover:scale-102"
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <a
                                  href={`tel:${dir}`}
                                  className="hover:underline"
                                  title={`تماس مستقیم: ${dir}`}
                                  dir="ltr"
                                >
                                  {toPersianDigits(dir)}
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(e, dir, `dir-${emp.id}-${i}`)}
                                  title="کپی شماره مستقیم"
                                  className="p-0.5 text-emerald-600/70 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 cursor-pointer mr-0.5"
                                >
                                  {copiedId === `dir-${emp.id}-${i}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                        )}
                      </td>

                      {/* Col 5: Irancell Mobile(s) */}
                      <td className="pt-3 pb-1 px-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        {mobiles.length > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            {mobiles.map((mob, i) => (
                              <div
                                key={i}
                                title="همراه"
                                className="inline-flex items-center justify-center gap-1.5 bg-amber-50/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border border-amber-200/60 dark:border-amber-800/60 transition-transform hover:scale-102"
                              >
                                <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <a
                                  href={`tel:${mob}`}
                                  className="hover:underline"
                                  title={`تماس با شماره همراه: ${mob}`}
                                  dir="ltr"
                                >
                                  {toPersianDigits(mob)}
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(e, mob, `mob-${emp.id}-${i}`)}
                                  title="کپی شماره همراه"
                                  className="p-0.5 text-amber-600/70 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 cursor-pointer mr-0.5"
                                >
                                  {copiedId === `mob-${emp.id}-${i}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                        )}
                      </td>

                      {/* Col 6: Quick Action Icons */}
                      <td className="pt-3 pb-1 px-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {emp.extension && (
                            <a
                              href={`tel:${emp.extension}`}
                              title={`تماس داخلی: ${emp.extension}`}
                              className="p-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 transition-colors"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </a>
                          )}
                          {emp.email && (
                            <a
                              href={`mailto:${emp.email}`}
                              title={`ارسال ایمیل: ${emp.email}`}
                              className="p-1 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300 transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectEmployee(emp)}
                            title="مشاهده شناسنامه کامل"
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ===== ROW 2: Location, Building/Room, Email, Status & Profile link ===== */}
                    <tr className="text-xs text-slate-600 dark:text-slate-400">
                      {/* Col 1 & 2 (colspan 2): Formatted Location */}
                      <td colSpan={2} className="pb-3 pt-0.5 px-3.5 align-middle">
                        {formattedLocation ? (
                          <div
                            className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400"
                            title={formattedLocation}
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-500/80 dark:text-rose-400/80 shrink-0" />
                            <span className="font-medium truncate max-w-[320px] sm:max-w-md">{formattedLocation}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Col 3, 4 & 5 (colspan 3): Email & Notes */}
                      <td colSpan={3} className="pb-3 pt-0.5 px-2 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                        {emails.length > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-1 text-[11px]">
                            {emails.map((eml, ei) => (
                              <div key={ei} className="inline-flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <a
                                  href={`mailto:${eml}`}
                                  className="text-indigo-600 dark:text-indigo-400 font-mono hover:underline truncate max-w-[220px]"
                                  title={`ارسال ایمیل: ${eml}`}
                                  dir="ltr"
                                >
                                  {eml}
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(e, eml, `eml-${emp.id}-${ei}`)}
                                  title="کپی ایمیل"
                                  className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  {copiedId === `eml-${emp.id}-${ei}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : emp.notes ? (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[240px] inline-block">
                            {emp.notes}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Col 6: Empty spacer for alignment */}
                      <td className="pb-3 pt-0.5 px-2 text-center align-middle"></td>
                    </tr>
                  </tbody>
                );
              })}
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
