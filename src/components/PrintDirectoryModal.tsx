import React, { useState, useMemo } from 'react';
import { Employee, Department, LocationItem, Position, AppSettings } from '../types.ts';
import { toPersianDigits, formatPersianDate } from '../utils/shamsi.ts';
import {
  Printer,
  X,
  Building,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

interface PrintDirectoryModalProps {
  employees: Employee[];
  departments: Department[];
  locations: LocationItem[];
  positions: Position[];
  settings: AppSettings | null;
  onClose: () => void;
}

type Orientation = 'landscape' | 'portrait';
type PageSize = 'A4' | 'A3';
type FontSize = 'compact' | 'normal' | 'large';
type ColumnCount = 1 | 2 | 3 | 4;

export const PrintDirectoryModal: React.FC<PrintDirectoryModalProps> = ({
  employees,
  departments,
  locations,
  positions,
  settings,
  onClose,
}) => {
  const [pageSize, setPageSizeState] = useState<PageSize>(() => {
    return (localStorage.getItem('org_directory_print_page_size') as PageSize) || 'A4';
  });
  const [orientation, setOrientationState] = useState<Orientation>(() => {
    return (localStorage.getItem('org_directory_print_orientation') as Orientation) || 'landscape';
  });
  const [columns, setColumnsState] = useState<ColumnCount>(() => {
    const saved = localStorage.getItem('org_directory_print_columns');
    const parsed = saved ? parseInt(saved, 10) : 3;
    return ([1, 2, 3, 4].includes(parsed) ? parsed : 3) as ColumnCount;
  });
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('org_directory_print_font_size') as FontSize) || 'compact';
  });
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const setPageSize = (val: PageSize) => {
    setPageSizeState(val);
    localStorage.setItem('org_directory_print_page_size', val);
  };

  const setOrientation = (val: Orientation) => {
    setOrientationState(val);
    localStorage.setItem('org_directory_print_orientation', val);
  };

  const setColumns = (val: ColumnCount) => {
    setColumnsState(val);
    localStorage.setItem('org_directory_print_columns', String(val));
  };

  const setFontSize = (val: FontSize) => {
    setFontSizeState(val);
    localStorage.setItem('org_directory_print_font_size', val);
  };

  // Maps for fast lookups
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);
  const locMap = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);
  const posMap = useMemo(() => new Map(positions.map((p) => [p.id, p])), [positions]);

  // Building Priority / display_order map
  const buildingOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    locations.forEach((loc, idx) => {
      const bName = (loc.building || loc.name || 'سایر ساختمان‌ها').trim();
      const order = loc.display_order ?? (idx + 1);
      if (!map.has(bName) || order < map.get(bName)!) {
        map.set(bName, order);
      }
    });
    return map;
  }, [locations]);

  // Unique buildings list ordered by building display_order
  const uniqueBuildings = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((loc) => {
      if (loc.building && loc.building.trim()) set.add(loc.building.trim());
      else if (loc.name) set.add(loc.name.trim());
    });
    return Array.from(set).sort((a, b) => {
      const orderA = buildingOrderMap.get(a) ?? 9999;
      const orderB = buildingOrderMap.get(b) ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b, 'fa');
    });
  }, [locations, buildingOrderMap]);

  // Extract contact helper: First entered has highest priority, limited to max 2 items
  const getEmployeePhones = (emp: Employee) => {
    const extensions: string[] = [];
    const directPhones: string[] = [];
    const mobilenums: string[] = [];
    const faxes: string[] = [];
    const emails: string[] = [];

    // First entered values (from direct employee fields) have first priority
    if (emp.extension && emp.extension.trim()) extensions.push(emp.extension.trim());
    if (emp.direct_phone && emp.direct_phone.trim()) directPhones.push(emp.direct_phone.trim());
    if (emp.mobile && emp.mobile.trim()) mobilenums.push(emp.mobile.trim());
    if (emp.email && emp.email.trim()) {
      for (const e of emp.email.split(/[\n,;]+/)) {
        const tr = e.trim();
        if (tr && !emails.includes(tr)) emails.push(tr);
      }
    }
    if (Array.isArray((emp as any).emails)) {
      for (const e of (emp as any).emails) {
        const tr = String(e).trim();
        if (tr && !emails.includes(tr)) emails.push(tr);
      }
    }

    // Additional phones array
    if (emp.phones && Array.isArray(emp.phones)) {
      for (const p of emp.phones) {
        if (!p.number || !p.number.trim()) continue;
        const num = p.number.trim();
        if (p.type === 'extension' && !extensions.includes(num)) {
          extensions.push(num);
        } else if ((p.type === 'office' || (p.type as any) === 'direct') && !directPhones.includes(num)) {
          directPhones.push(num);
        } else if (p.type === 'mobile' && !mobilenums.includes(num)) {
          mobilenums.push(num);
        } else if (p.type === 'fax' && !faxes.includes(num)) {
          faxes.push(num);
        }
      }
    }

    if (emp.custom_fields) {
      if (emp.custom_fields.fax && !faxes.includes(String(emp.custom_fields.fax).trim())) {
        faxes.push(String(emp.custom_fields.fax).trim());
      }
      if (emp.custom_fields.email && !emails.includes(String(emp.custom_fields.email).trim())) {
        emails.push(String(emp.custom_fields.email).trim());
      }
    }

    // Return max 2 items each as requested by user
    return {
      extensions: extensions.slice(0, 2),
      directPhones: directPhones.slice(0, 2),
      mobilenums: mobilenums.slice(0, 2),
      faxes: faxes.slice(0, 2),
      emails: emails.slice(0, 2),
    };
  };

  // Helper for numeric extension extraction for sorting
  const getSmallestExtensionNumber = (emp: Employee): number => {
    const nums: number[] = [];
    if (emp.extension) {
      const parsed = parseInt(emp.extension.replace(/\D/g, ''), 10);
      if (!isNaN(parsed)) nums.push(parsed);
    }
    if (emp.phones) {
      for (const p of emp.phones) {
        if (p.type === 'extension' && p.number) {
          const parsed = parseInt(p.number.replace(/\D/g, ''), 10);
          if (!isNaN(parsed)) nums.push(parsed);
        }
      }
    }
    return nums.length > 0 ? Math.min(...nums) : 999999;
  };

  // SORTING SPECIFIED BY USER:
  // 1. اول بر اساس اولویت و رتبه ساختمان (هرچه رتبه بالاتر باشد زودتر نمایش داده می‌شود)
  // 2. بعد اولویت و رتبه واحد سازمانی (هرچه رتبه بالاتر باشد زودتر نمایش داده می‌شود)
  // 3. درون هر واحد، اولویت مشخص شده برای نفرات در چاپ (print_order)
  // 4. در صورت نبود یا برابری، شماره داخلی کمتر (Ascending Extension)
  // 5. نام خانوادگی
  const sortedEmployees = useMemo(() => {
    let list = employees.slice();

    if (selectedBuilding !== 'all') {
      list = list.filter((emp) => {
        const loc = locMap.get(emp.location_id || '');
        const b = loc?.building || loc?.name || 'سایر ساختمان‌ها';
        return b === selectedBuilding;
      });
    }

    return list.sort((a, b) => {
      // 1. ساختمان (Building) بر اساس اولویت و رتبه
      const locA = locMap.get(a.location_id || '');
      const locB = locMap.get(b.location_id || '');
      const bldgA = locA?.building || locA?.name || 'سایر ساختمان‌ها';
      const bldgB = locB?.building || locB?.name || 'سایر ساختمان‌ها';

      const bldgOrderA = buildingOrderMap.get(bldgA) ?? (locA?.display_order ?? 9999);
      const bldgOrderB = buildingOrderMap.get(bldgB) ?? (locB?.display_order ?? 9999);
      if (bldgOrderA !== bldgOrderB) return bldgOrderA - bldgOrderB;

      const bldgDiff = bldgA.localeCompare(bldgB, 'fa');
      if (bldgDiff !== 0) return bldgDiff;

      // 2. واحد سازمانی (Department) بر اساس اولویت و رتبه
      const deptA = deptMap.get(a.department_id);
      const deptB = deptMap.get(b.department_id);
      const deptOrderA = deptA?.display_order ?? 9999;
      const deptOrderB = deptB?.display_order ?? 9999;
      if (deptOrderA !== deptOrderB) return deptOrderA - deptOrderB;

      const deptNameA = deptA?.name || '';
      const deptNameB = deptB?.name || '';
      const deptDiff = deptNameA.localeCompare(deptNameB, 'fa');
      if (deptDiff !== 0) return deptDiff;

      // 3. اولویت نفرات هر واحد در چاپ (Employee print_order)
      const printOrderA = a.print_order !== undefined && a.print_order !== null ? a.print_order : 99999;
      const printOrderB = b.print_order !== undefined && b.print_order !== null ? b.print_order : 99999;
      if (printOrderA !== printOrderB) return printOrderA - printOrderB;

      // 4. شماره داخلی کمتر
      const extA = getSmallestExtensionNumber(a);
      const extB = getSmallestExtensionNumber(b);
      if (extA !== extB) return extA - extB;

      // 5. نام خانوادگی
      return (a.last_name || '').localeCompare(b.last_name || '', 'fa');
    });
  }, [employees, selectedBuilding, locMap, deptMap, buildingOrderMap]);

  // Grouped employees: Groups by Building -> Department
  const groupedSingleSheet = useMemo(() => {
    interface GroupItem {
      buildingName: string;
      deptName: string;
      deptCode: string;
      employees: Employee[];
    }

    const groups: GroupItem[] = [];
    let currentKey = '';
    let currentGroup: GroupItem | null = null;

    sortedEmployees.forEach((emp) => {
      const loc = locMap.get(emp.location_id || '');
      const bldg = loc?.building || loc?.name || 'ساختمان مرکزی';
      const dept = deptMap.get(emp.department_id);
      const deptName = dept?.name || 'عمومی';
      const key = `${bldg}__${deptName}`;

      if (key !== currentKey || !currentGroup) {
        currentKey = key;
        currentGroup = {
          buildingName: bldg,
          deptName,
          deptCode: dept?.code || '',
          employees: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.employees.push(emp);
    });

    return groups;
  }, [sortedEmployees, locMap, deptMap]);

  const handlePrint = () => {
    window.print();
  };

  const currentDatePersian = formatPersianDate(new Date());

  // Font size styles
  const fontClass =
    fontSize === 'compact'
      ? 'text-[8.8px] leading-tight'
      : fontSize === 'normal'
      ? 'text-[10px] leading-normal'
      : 'text-[11.5px] leading-relaxed';

  // Paper Dimensions for the Preview Card
  const getPaperDimensionsStyle = () => {
    if (pageSize === 'A3') {
      return orientation === 'landscape'
        ? { width: '420mm', minHeight: '297mm', padding: '8mm' }
        : { width: '297mm', minHeight: '420mm', padding: '8mm' };
    }
    // A4 Default
    return orientation === 'landscape'
      ? { width: '297mm', minHeight: '210mm', padding: '6mm 8mm' }
      : { width: '210mm', minHeight: '297mm', padding: '6mm 8mm' };
  };

  const columnLabel = columns === 1 ? '۱ ستون' : `${toPersianDigits(columns)} ستون`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:bg-white">
      {/* Dynamic Page Settings for Print Engine */}
      <style>{`
        @page {
          size: ${pageSize} ${orientation};
          margin: 4mm;
        }
      `}</style>

      {/* Top Floating Control Bar (Hidden on print) */}
      <div className="w-full max-w-7xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 mb-4 sticky top-2 z-40 print:hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Title & Info */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>تنظیم و چاپ برگه رومیزی پرسنل</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  {pageSize} • {orientation === 'landscape' ? 'افقی' : 'عمودی'} • {columnLabel}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                مرتب‌سازی هوشمند: ۱. ساختمان | ۲. واحد سازمانی | ۳. شماره داخلی کمتر
              </p>
            </div>
          </div>

          {/* Quick Options Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Paper Size: A4 vs A3 */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <span className="text-[10px] text-slate-400 px-1 font-semibold">اندازه کاغذ:</span>
              <button
                type="button"
                onClick={() => setPageSize('A4')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  pageSize === 'A4'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => setPageSize('A3')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  pageSize === 'A3'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                A3
              </button>
            </div>

            {/* Building Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none text-[11px]"
              >
                <option value="all">همه ساختمان‌ها</option>
                {uniqueBuildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  orientation === 'portrait'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                عمودی
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  orientation === 'landscape'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                افقی
              </button>
            </div>

            {/* Columns: 1, 2, 3, 4 */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <span className="text-[10px] text-slate-400 px-1 font-semibold">ستون‌ها:</span>
              {([1, 2, 3, 4] as ColumnCount[]).map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColumns(col)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                    columns === col
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  {col === 1 ? '۱ ستون' : `${toPersianDigits(col)} ستون`}
                </button>
              ))}
            </div>

            {/* Font size */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <span className="text-[10px] text-slate-400 px-1 font-semibold">قلم:</span>
              <button
                type="button"
                onClick={() => setFontSize('compact')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  fontSize === 'compact'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                فشرده
              </button>
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  fontSize === 'normal'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                متوسط
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  fontSize === 'large'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                بزرگ
              </button>
            </div>

            {/* Zoom preview */}
            <div className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.max(z - 10, 50))}
                className="p-1 hover:text-indigo-600"
                title="کوچک‌نمایی پیش‌نمایش"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold w-9 text-center">{toPersianDigits(previewZoom)}%</span>
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.min(z + 10, 140))}
                className="p-1 hover:text-indigo-600"
                title="بزرگ‌نمایی پیش‌نمایش"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(100)}
                className="p-1 hover:text-indigo-600 text-[10px]"
                title="بازنشانی زوم"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>ارسال به چاپگر (Print / PDF)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tip banner */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              نکته چاپ: در پنجره چاپگر، گزینه <strong>Headers and footers</strong> (سربرگ و پاورقی مرورگر) را بردارید تا صفحه کاملاً تمیز چاپ شود.
            </span>
          </div>
        </div>
      </div>

      {/* ================= PRINT PREVIEW CONTAINER ================= */}
      <div
        className="w-full flex justify-center overflow-auto print:overflow-visible print:w-full print:m-0 print:p-0 pb-12"
        style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
      >
        <div
          id="printable-directory-sheet"
          dir="rtl"
          className="bg-white text-slate-950 shadow-2xl print:shadow-none print:w-full print:h-auto rounded-sm border border-slate-200 print:border-none"
          style={{
            ...getPaperDimensionsStyle(),
            fontFamily: "'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif",
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Bar: Logo + Organization Title + Live Date */}
          <header className="border-b-2 border-slate-900 pb-2.5 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="لوگو"
                  className="h-11 w-auto max-w-[120px] max-h-11 object-contain select-none"
                />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm select-none">
                  🏢
                </div>
              )}
              <div>
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  {settings?.organization_name || 'دفتر تلفن و راهنمای خطوط ارتباطی سازمان'}
                </h1>
                <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                  فهرست شماره‌های مستقیم، داخلی و همراه پرسنل و واحدهای سازمانی
                </p>
              </div>
            </div>

            <div className="text-left text-[9.5px] text-slate-600 leading-tight">
              <div>تاریخ به‌روزرسانی: <span className="font-bold text-slate-900">{currentDatePersian}</span></div>
              <div className="text-slate-400 mt-0.5">تعداد پرسنل: <span className="font-bold text-slate-700">{toPersianDigits(sortedEmployees.length)} نفر</span></div>
            </div>
          </header>

          {/* Multi-Column Desk Table Flow */}
          <main
            className="w-full"
            style={{
              columnCount: columns,
              columnGap: '14px',
              columnRule: columns > 1 ? '1px dashed #cbd5e1' : 'none',
            }}
          >
            {groupedSingleSheet.map((grp, gIdx) => (
              <section
                key={gIdx}
                className="mb-3 break-inside-avoid border border-slate-300 rounded-md overflow-hidden bg-white shadow-none"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                {/* Building & Department Header Strip */}
                <div className="bg-slate-900 text-white px-2.5 py-1.5 flex items-center justify-between text-[10px] font-bold">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>🏢 {grp.buildingName}</span>
                    <span className="text-slate-400 font-normal">|</span>
                    <span>🏛️ {grp.deptName}</span>
                  </div>
                </div>

                {/* Table of Employees */}
                <table className={`w-full text-right border-collapse ${fontClass}`}>
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[9px]">
                      <th className="py-1 px-1.5 border-l border-slate-200">نام و نام خانوادگی</th>
                      <th className="py-1 px-1 border-l border-slate-200 text-center bg-indigo-50/80 font-black text-indigo-950 w-16">
                        داخلی
                      </th>
                      <th className="py-1 px-1 border-l border-slate-200 text-center w-20">مستقیم</th>
                      <th className="py-1 px-1 border-l border-slate-200 text-center w-22">همراه</th>
                      <th className="py-1 px-1 text-center w-16">فکس</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grp.employees.map((emp, empIdx) => {
                      const { extensions, directPhones, mobilenums, faxes } = getEmployeePhones(emp);

                      return (
                        <tr
                          key={emp.id}
                          className={`border-b border-slate-200/80 ${
                            empIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                          }`}
                        >
                          {/* Name (Positions omitted for clean print) */}
                          <td className="py-1 px-1.5 border-l border-slate-200">
                            <div className="font-bold text-slate-900 leading-tight">
                              {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                            </div>
                          </td>

                          {/* Extensions (Highlighted) */}
                          <td className="py-1 px-1 border-l border-slate-200 text-center bg-indigo-50/40">
                            {extensions.length > 0 ? (
                              <div className="font-black text-indigo-800 text-[10px]">
                                {extensions.map((ext, idx) => (
                                  <span key={idx} className={idx > 0 ? 'mr-1' : ''}>
                                    {toPersianDigits(ext)}
                                    {idx < extensions.length - 1 && '، '}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Direct Phones */}
                          <td className="py-1 px-1 border-l border-slate-200 text-center text-slate-700 text-[9px] direction-ltr">
                            {directPhones.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {directPhones.map((dp, idx) => (
                                  <span key={idx}>{toPersianDigits(dp)}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Mobile / همراه */}
                          <td className="py-1 px-1 border-l border-slate-200 text-center text-slate-800 text-[9px] direction-ltr">
                            {mobilenums.length > 0 ? (
                              <div className="flex flex-col gap-0.5 font-semibold">
                                {mobilenums.map((m, idx) => (
                                  <span key={idx}>{toPersianDigits(m)}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Fax */}
                          <td className="py-1 px-1 text-center text-slate-600 text-[8.5px] direction-ltr">
                            {faxes.length > 0 ? (
                              faxes.map((f, idx) => (
                                <span key={idx}>{toPersianDigits(f)}</span>
                              ))
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            ))}
          </main>

          {/* Clean Footer */}
          <footer className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-600 font-medium">
            <div className="font-bold text-slate-800">Developed by: N.Shaaeri</div>
            <div>چاپ‌شده در: {currentDatePersian}</div>
          </footer>
        </div>
      </div>
    </div>
  );
};
