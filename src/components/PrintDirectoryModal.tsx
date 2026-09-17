import React, { useState, useMemo, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { toCanvas } from 'html-to-image';
import { Employee, Department, LocationItem, Position, AppSettings } from '../types.ts';
import { toPersianDigits, formatPersianDate } from '../utils/shamsi.ts';
import { VAZIRMATN_FONT_EMBED_CSS, ensureVazirmatnFontsLoaded } from '../utils/vazirFontEmbedCSS.ts';
import {
  Printer,
  X,
  Building,
  ZoomIn,
  ZoomOut,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  FileDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { DirectoryPageSheet, PaginatedPageData, PageGroupItem } from './DirectoryPageSheet.tsx';

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
type ColumnCount = 2 | 3 | 4;
type Density = 'ultra' | 'compact' | 'normal';

export type LandscapePreset = 'ls_ultra' | 'ls_compact' | 'ls_standard' | 'ls_readable' | 'ls_large';
export type PortraitPreset = 'pt_ultra' | 'pt_compact' | 'pt_standard' | 'pt_readable' | 'pt_large';
export type PrintPreset = LandscapePreset | PortraitPreset;

export interface PresetConfig {
  id: PrintPreset;
  label: string;
  orientation: Orientation;
  columns: ColumnCount;
  fontSizePt: number;
  density: Density;
  marginMm: number;
  showDirect: boolean;
  showMobile: boolean;
  showPosition: boolean;
  showFax: boolean;
  showUnit?: boolean;
  showFloor?: boolean;
  desc: string;
}

// ۵ پروفایل چاپ افقی
export const LANDSCAPE_PRESETS: PresetConfig[] = [
  {
    id: 'ls_ultra',
    label: 'فوق‌فشرده',
    orientation: 'landscape',
    columns: 4,
    fontSizePt: 6.0,
    density: 'ultra',
    marginMm: 2,
    showDirect: true,
    showMobile: true,
    showPosition: false,
    showFax: false,
    desc: 'بیشترین ظرفیت',
  },
  {
    id: 'ls_compact',
    label: 'فشرده',
    orientation: 'landscape',
    columns: 4,
    fontSizePt: 6.8,
    density: 'ultra',
    marginMm: 3,
    showDirect: true,
    showMobile: true,
    showPosition: false,
    showFax: false,
    desc: 'متراکم',
  },
  {
    id: 'ls_standard',
    label: 'استاندارد',
    orientation: 'landscape',
    columns: 3,
    fontSizePt: 7.5,
    density: 'compact',
    marginMm: 4,
    showDirect: true,
    showMobile: true,
    showPosition: false,
    showFax: false,
    desc: 'متوازن اداری',
  },
  {
    id: 'ls_readable',
    label: 'خوانا',
    orientation: 'landscape',
    columns: 3,
    fontSizePt: 8.0,
    density: 'compact',
    marginMm: 4,
    showDirect: true,
    showMobile: true,
    showPosition: true,
    showFax: false,
    desc: 'با سمت',
  },
  {
    id: 'ls_large',
    label: 'درشت',
    orientation: 'landscape',
    columns: 2,
    fontSizePt: 9.0,
    density: 'normal',
    marginMm: 5,
    showDirect: true,
    showMobile: true,
    showPosition: true,
    showFax: false,
    desc: 'قلم درشت',
  },
];

// ۵ پروفایل چاپ عمودی
export const PORTRAIT_PRESETS: PresetConfig[] = [
  {
    id: 'pt_ultra',
    label: 'فوق‌فشرده',
    orientation: 'portrait',
    columns: 3,
    fontSizePt: 6.0,
    density: 'ultra',
    marginMm: 2,
    showDirect: true,
    showMobile: false,
    showPosition: false,
    showFax: false,
    desc: 'بیشترین ظرفیت',
  },
  {
    id: 'pt_compact',
    label: 'فشرده',
    orientation: 'portrait',
    columns: 3,
    fontSizePt: 6.8,
    density: 'ultra',
    marginMm: 3,
    showDirect: true,
    showMobile: true,
    showPosition: false,
    showFax: false,
    desc: 'متراکم',
  },
  {
    id: 'pt_standard',
    label: 'استاندارد',
    orientation: 'portrait',
    columns: 2,
    fontSizePt: 7.5,
    density: 'compact',
    marginMm: 4,
    showDirect: true,
    showMobile: true,
    showPosition: false,
    showFax: false,
    desc: 'متوازن اداری',
  },
  {
    id: 'pt_readable',
    label: 'خوانا',
    orientation: 'portrait',
    columns: 2,
    fontSizePt: 8.2,
    density: 'compact',
    marginMm: 4,
    showDirect: true,
    showMobile: true,
    showPosition: true,
    showFax: false,
    desc: 'با سمت',
  },
  {
    id: 'pt_large',
    label: 'درشت',
    orientation: 'portrait',
    columns: 2,
    fontSizePt: 9.0,
    density: 'normal',
    marginMm: 5,
    showDirect: true,
    showMobile: true,
    showPosition: true,
    showFax: true,
    desc: 'قلم درشت',
  },
];

interface SavedPrintSettings {
  pageSize?: PageSize;
  orientation?: Orientation;
  activePreset?: PrintPreset | null;
  columns?: ColumnCount;
  fontSizePt?: number;
  density?: Density;
  marginMm?: number;
  showDirect?: boolean;
  showMobile?: boolean;
  showPosition?: boolean;
  showFax?: boolean;
  showUnit?: boolean;
  showFloor?: boolean;
  selectedBuilding?: string;
  isOnePageForced?: boolean;
}

const PRINT_SETTINGS_STORAGE_KEY = 'org_directory_saved_print_settings';

// قالب پیش‌فرض طبق درخواست: افقی و استاندارد (متوازن اداری)
export const DEFAULT_PRINT_PRESET: PresetConfig = LANDSCAPE_PRESETS.find((p) => p.id === 'ls_standard')!;

export const PrintDirectoryModal: React.FC<PrintDirectoryModalProps> = ({
  employees,
  departments,
  locations,
  positions,
  settings,
  onClose,
}) => {
  // Paper & Layout state: به‌صورت پیش‌فرض قطع A4، جهت افقی و قالب استاندارد (متوازن اداری)
  const [pageSize, setPageSizeState] = useState<PageSize>('A4');
  const [orientation, setOrientationState] = useState<Orientation>('landscape');
  const [activePreset, setActivePreset] = useState<PrintPreset | null>('ls_standard');

  // بخش «تنظیمات بیشتر» - به صورت پیش‌فرض بسته طبق درخواست کاربر
  const [isMoreSettingsOpen, setIsMoreSettingsOpen] = useState<boolean>(false);

  // Columns: ۳ ستون پیش‌فرض متوازن اداری
  const [columns, setColumnsState] = useState<ColumnCount>(3);

  // Font size: ۷.۵ پیش‌فرض متوازن اداری
  const [fontSizePt, setFontSizePtState] = useState<number>(7.5);

  // Density: فشرده (compact) پیش‌فرض متوازن اداری
  const [density, setDensityState] = useState<Density>('compact');

  // Margins: ۴ میلیمتر پیش‌فرض متوازن اداری
  const [marginMm, setMarginMmState] = useState<number>(4);

  // Table Fields: مستقیم و همراه به‌صورت پیش‌فرض فعال
  const [showDirect, setShowDirectState] = useState<boolean>(true);
  const [showMobile, setShowMobileState] = useState<boolean>(true);
  const [showPosition, setShowPositionState] = useState<boolean>(false);
  const [showFax, setShowFaxState] = useState<boolean>(false);
  const [showUnit, setShowUnitState] = useState<boolean>(false);
  const [showFloor, setShowFloorState] = useState<boolean>(false);

  // Filters & Preview
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [previewZoom, setPreviewZoom] = useState<number>(85);
  const [isOnePageForced, setIsOnePageForced] = useState<boolean>(false);

  // Auto-save all print settings into browser cache (localStorage)
  useEffect(() => {
    const toSave: SavedPrintSettings = {
      pageSize,
      orientation,
      activePreset,
      columns,
      fontSizePt,
      density,
      marginMm,
      showDirect,
      showMobile,
      showPosition,
      showFax,
      showUnit,
      showFloor,
      selectedBuilding,
      isOnePageForced,
    };
    try {
      localStorage.setItem(PRINT_SETTINGS_STORAGE_KEY, JSON.stringify(toSave));
      localStorage.setItem('org_directory_print_page_size', pageSize);
      localStorage.setItem('org_directory_print_orientation', orientation);
      localStorage.setItem('org_directory_print_columns', String(columns));
      localStorage.setItem('org_directory_print_font_size_pt', String(fontSizePt));
      localStorage.setItem('org_directory_print_density', density);
      localStorage.setItem('org_directory_print_margin_mm', String(marginMm));
      localStorage.setItem('org_directory_print_show_direct', String(showDirect));
      localStorage.setItem('org_directory_print_show_mobile', String(showMobile));
      localStorage.setItem('org_directory_print_show_position', String(showPosition));
      localStorage.setItem('org_directory_print_show_fax', String(showFax));
      localStorage.setItem('org_directory_print_show_unit', String(showUnit));
      localStorage.setItem('org_directory_print_show_floor', String(showFloor));
      localStorage.setItem('org_directory_print_building', selectedBuilding);
    } catch (err) {
      console.warn('Failed to save print settings to localStorage:', err);
    }
  }, [
    pageSize,
    orientation,
    activePreset,
    columns,
    fontSizePt,
    density,
    marginMm,
    showDirect,
    showMobile,
    showPosition,
    showFax,
    showUnit,
    showFloor,
    selectedBuilding,
    isOnePageForced,
  ]);

  // Manage print-directory-active on document body for isolated print CSS
  useEffect(() => {
    document.body.classList.add('print-directory-active');
    return () => {
      document.body.classList.remove('print-directory-active');
    };
  }, []);

  // Setters with localStorage persistence
  const setPageSize = (val: PageSize) => {
    setPageSizeState(val);
    setActivePreset(null);
  };
  const setOrientation = (val: Orientation) => {
    setOrientationState(val);
    const target = val === 'landscape'
      ? LANDSCAPE_PRESETS.find((p) => p.id === 'ls_standard')!
      : PORTRAIT_PRESETS.find((p) => p.id === 'pt_standard')!;
    applyPrintPreset(target);
  };
  const setColumns = (val: ColumnCount) => {
    setColumnsState(val);
    setActivePreset(null);
  };
  const setFontSizePt = (val: number) => {
    const clamped = Math.round(Math.min(Math.max(val, 5.0), 12.0) * 10) / 10;
    setFontSizePtState(clamped);
    setActivePreset(null);
  };
  const setDensity = (val: Density) => {
    setDensityState(val);
    setActivePreset(null);
  };
  const setMarginMm = (val: number) => {
    setMarginMmState(val);
    setActivePreset(null);
  };
  const setShowFax = (val: boolean) => {
    setShowFaxState(val);
    setActivePreset(null);
  };
  const setShowMobile = (val: boolean) => {
    setShowMobileState(val);
    setActivePreset(null);
  };
  const setShowDirect = (val: boolean) => {
    setShowDirectState(val);
    setActivePreset(null);
  };
  const setShowPosition = (val: boolean) => {
    setShowPositionState(val);
    setActivePreset(null);
  };
  const setShowUnit = (val: boolean) => {
    setShowUnitState(val);
    setActivePreset(null);
  };
  const setShowFloor = (val: boolean) => {
    setShowFloorState(val);
    setActivePreset(null);
  };

  // 3 Presets for table fields: Minimal (Right), Standard (Center/Default), Full (Left)
  const applyFieldsPreset = (preset: 'minimal' | 'standard' | 'full') => {
    setActivePreset(null);
    if (preset === 'minimal') {
      setShowDirect(false);
      setShowMobile(false);
      setShowFax(false);
      setShowPosition(false);
      setShowUnit(false);
      setShowFloor(false);
    } else if (preset === 'standard') {
      setShowDirect(true);
      setShowMobile(true);
      setShowFax(false);
      setShowPosition(false);
      setShowUnit(false);
      setShowFloor(false);
    } else {
      setShowDirect(true);
      setShowMobile(true);
      setShowFax(true);
      setShowPosition(true);
      setShowUnit(true);
      setShowFloor(true);
    }
  };

  const currentFieldsPreset = useMemo(() => {
    if (!showDirect && !showMobile && !showFax && !showPosition && !showUnit && !showFloor) return 'minimal';
    if (showDirect && showMobile && showFax && showPosition && showUnit && showFloor) return 'full';
    if (showDirect && showMobile && !showFax && !showPosition && !showUnit && !showFloor) return 'standard';
    return 'custom';
  }, [showDirect, showMobile, showFax, showPosition, showUnit, showFloor]);

  // Apply ready-made print preset (5 Landscape & 5 Portrait)
  const applyPrintPreset = (presetConfig: PresetConfig) => {
    setActivePreset(presetConfig.id);
    setOrientationState(presetConfig.orientation);
    localStorage.setItem('org_directory_print_orientation', presetConfig.orientation);

    setColumnsState(presetConfig.columns);
    localStorage.setItem('org_directory_print_columns', String(presetConfig.columns));

    setFontSizePtState(presetConfig.fontSizePt);
    localStorage.setItem('org_directory_print_font_size_pt', String(presetConfig.fontSizePt));

    setDensityState(presetConfig.density);
    localStorage.setItem('org_directory_print_density', presetConfig.density);

    setMarginMmState(presetConfig.marginMm);
    localStorage.setItem('org_directory_print_margin_mm', String(presetConfig.marginMm));

    setShowDirectState(presetConfig.showDirect);
    localStorage.setItem('org_directory_print_show_direct', String(presetConfig.showDirect));

    setShowMobileState(presetConfig.showMobile);
    localStorage.setItem('org_directory_print_show_mobile', String(presetConfig.showMobile));

    setShowPositionState(presetConfig.showPosition);
    localStorage.setItem('org_directory_print_show_position', String(presetConfig.showPosition));

    setShowFaxState(presetConfig.showFax);
    localStorage.setItem('org_directory_print_show_fax', String(presetConfig.showFax));

    setShowUnitState(presetConfig.showUnit ?? false);
    localStorage.setItem('org_directory_print_show_unit', String(presetConfig.showUnit ?? false));

    setShowFloorState(presetConfig.showFloor ?? false);
    localStorage.setItem('org_directory_print_show_floor', String(presetConfig.showFloor ?? false));
  };

  const activePresetConfig = useMemo(() => {
    if (!activePreset) return null;
    return (
      LANDSCAPE_PRESETS.find((p) => p.id === activePreset) ||
      PORTRAIT_PRESETS.find((p) => p.id === activePreset) ||
      null
    );
  }, [activePreset]);

  // بازنشانی مستقیم به قالب پیش‌فرض: افقی و استاندارد (متوازن اداری)
  const handleResetToDefault = () => {
    applyPrintPreset(DEFAULT_PRINT_PRESET);
    setPageSizeState('A4');
    setIsOnePageForced(false);
    setSelectedBuilding('all');
    setPrintNotice({
      text: 'قالب پیش‌فرض افقی و استاندارد (متوازن اداری) اعمال شد.',
      type: 'info',
    });
    setTimeout(() => setPrintNotice(null), 3000);
  };

  // Maps for fast lookups
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);
  const locMap = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);
  const posMap = useMemo(() => new Map(positions.map((p) => [p.id, p])), [positions]);

  // Building Priority map
  const buildingOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    locations.forEach((loc, idx) => {
      const bName = (loc.building || loc.name || 'سایر ساختمان‌ها').trim();
      const order = loc.display_order ?? idx + 1;
      if (!map.has(bName) || order < map.get(bName)!) {
        map.set(bName, order);
      }
    });
    return map;
  }, [locations]);

  // Unique buildings
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

  // Contact helper
  const getEmployeePhones = (emp: Employee) => {
    const extensions: string[] = [];
    const directPhones: string[] = [];
    const mobilenums: string[] = [];
    const faxes: string[] = [];

    if (emp.extension && emp.extension.trim()) extensions.push(emp.extension.trim());
    if (emp.direct_phone && emp.direct_phone.trim()) directPhones.push(emp.direct_phone.trim());
    if (emp.mobile && emp.mobile.trim()) mobilenums.push(emp.mobile.trim());

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

    if (emp.custom_fields && emp.custom_fields.fax && !faxes.includes(String(emp.custom_fields.fax).trim())) {
      faxes.push(String(emp.custom_fields.fax).trim());
    }

    return {
      extensions: extensions.slice(0, 2),
      directPhones: directPhones.slice(0, 2),
      mobilenums: mobilenums.slice(0, 2),
      faxes: faxes.slice(0, 2),
    };
  };

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

  // Sorting
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
      // 1. ساختمان
      const locA = locMap.get(a.location_id || '');
      const locB = locMap.get(b.location_id || '');
      const bldgA = locA?.building || locA?.name || 'سایر ساختمان‌ها';
      const bldgB = locB?.building || locB?.name || 'سایر ساختمان‌ها';

      const bldgOrderA = buildingOrderMap.get(bldgA) ?? (locA?.display_order ?? 9999);
      const bldgOrderB = buildingOrderMap.get(bldgB) ?? (locB?.display_order ?? 9999);
      if (bldgOrderA !== bldgOrderB) return bldgOrderA - bldgOrderB;

      const bldgDiff = bldgA.localeCompare(bldgB, 'fa');
      if (bldgDiff !== 0) return bldgDiff;

      // 2. واحد
      const deptA = deptMap.get(a.department_id);
      const deptB = deptMap.get(b.department_id);
      const deptOrderA = deptA?.display_order ?? 9999;
      const deptOrderB = deptB?.display_order ?? 9999;
      if (deptOrderA !== deptOrderB) return deptOrderA - deptOrderB;

      const deptNameA = deptA?.name || '';
      const deptNameB = deptB?.name || '';
      const deptDiff = deptNameA.localeCompare(deptNameB, 'fa');
      if (deptDiff !== 0) return deptDiff;

      // 3. اولویت چاپ
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

  // Grouped employees
  const groupedSingleSheet = useMemo(() => {
    interface GroupItem {
      buildingName: string;
      deptName: string;
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
          employees: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.employees.push(emp);
    });

    return groups;
  }, [sortedEmployees, locMap, deptMap]);

  // Page Height in mm based on paper size and orientation
  const pageHeightMm = useMemo(() => {
    return pageSize === 'A3'
      ? orientation === 'landscape'
        ? 297
        : 420
      : orientation === 'landscape'
      ? 210
      : 297;
  }, [pageSize, orientation]);

  // Usable Content Height on 1 Page in Pixels at 96 DPI (1mm = 3.78px)
  const targetPageHeightPx = useMemo(() => {
    return (pageHeightMm - marginMm * 2) * 3.78 - 30; // 30px reserved for footer
  }, [pageHeightMm, marginMm]);

  // Smart multi-page and multi-column partitioning engine
  // Accurately fills each column to capacity; if a department table exceeds the remaining space,
  // it automatically splits it into two tables: Table 1 fills the empty space in the current column,
  // and Table 2 (with continuation flag) is placed at the top of the next column!
  const paginatedPages = useMemo<PaginatedPageData[]>(() => {
    if (sortedEmployees.length === 0) {
      return [{
        pageNumber: 1,
        groups: [],
        columnsData: Array.from({ length: columns }, () => []),
        totalEmployees: 0,
      }];
    }

    // Usable column height in mm:
    // Page height minus margins, minus header (~17mm), minus footer (~8mm)
    const usableHeightMm = Math.max(60, pageHeightMm - marginMm * 2 - 25);

    // Row height calculation in mm
    const fontHeightMm = fontSizePt * 0.3528;
    let rowPaddingMm = 0.8;
    if (density === 'ultra') rowPaddingMm = 0.45;
    else if (density === 'compact') rowPaddingMm = 0.9;
    else rowPaddingMm = 1.5;

    const baseRowHeightMm = fontHeightMm * 1.25 + rowPaddingMm * 2 + 0.3;
    const sectionHeaderHeightMm = fontHeightMm * 2.2 + rowPaddingMm * 4 + 6.5; // Banner + thead + gap
    const sectionCostUnits = Math.max(2.2, sectionHeaderHeightMm / baseRowHeightMm);

    // Safe rows/units per column with a 1-row safety buffer to prevent overflow
    let columnCapacityUnits = Math.max(6, Math.floor(usableHeightMm / baseRowHeightMm) - 1);

    // If forced to 1 page, calculate needed capacity per column to hold everything on 1 page
    if (isOnePageForced) {
      let totalUnits = 0;
      groupedSingleSheet.forEach((g) => {
        totalUnits += sectionCostUnits;
        g.employees.forEach((emp) => {
          totalUnits += (showPosition && emp.position_id) ? 1.35 : 1.0;
        });
      });
      const neededPerCol = Math.ceil(totalUnits / columns);
      if (neededPerCol > columnCapacityUnits) {
        columnCapacityUnits = neededPerCol;
      }
    }

    const pages: PaginatedPageData[] = [];
    let currentPageColumns: PageGroupItem[][] = Array.from({ length: columns }, () => []);
    let currentColIdx = 0;
    let remainingUnitsInCol = columnCapacityUnits;

    const pushPage = () => {
      const allGroups = currentPageColumns.flat();
      const totalEmp = allGroups.reduce((acc, g) => acc + g.employees.length, 0);
      pages.push({
        pageNumber: pages.length + 1,
        groups: allGroups,
        columnsData: currentPageColumns,
        totalEmployees: totalEmp,
      });
      currentPageColumns = Array.from({ length: columns }, () => []);
      currentColIdx = 0;
      remainingUnitsInCol = columnCapacityUnits;
    };

    const nextColumn = () => {
      currentColIdx++;
      if (currentColIdx >= columns) {
        if (isOnePageForced && pages.length === 0) {
          // If 1-page forced, wrap around to last column
          currentColIdx = columns - 1;
          remainingUnitsInCol = columnCapacityUnits;
        } else {
          pushPage();
        }
      } else {
        remainingUnitsInCol = columnCapacityUnits;
      }
    };

    for (let gIdx = 0; gIdx < groupedSingleSheet.length; gIdx++) {
      const origGroup = groupedSingleSheet[gIdx];
      let currentDept: PageGroupItem = {
        buildingName: origGroup.buildingName,
        deptName: origGroup.deptName,
        employees: [...origGroup.employees],
        isContinuation: false,
      };

      while (currentDept.employees.length > 0) {
        // Calculate cost of currentDept employees
        let empsCost = 0;
        currentDept.employees.forEach((e) => {
          empsCost += (showPosition && e.position_id) ? 1.35 : 1.0;
        });
        const totalDeptCost = sectionCostUnits + empsCost;

        // Case 1: Entire current department fits in the current column
        if (totalDeptCost <= remainingUnitsInCol) {
          currentPageColumns[currentColIdx].push(currentDept);
          remainingUnitsInCol -= totalDeptCost;
          break; // Done placing this department
        }

        // Case 2: Department does NOT fit completely in the current column.
        // Rule: If space is tight and unit doesn't fit, split it into 2 tables:
        // Table 1 fills the empty space of current column, Table 2 placed in next column.
        const availableUnitsForRows = remainingUnitsInCol - sectionCostUnits;

        // Check if there is enough space for header + at least 1 employee row
        if (availableUnitsForRows >= 1.0 && currentDept.employees.length > 1) {
          let accumulated = 0;
          let splitIdx = 0;
          for (let i = 0; i < currentDept.employees.length; i++) {
            const cost = (showPosition && currentDept.employees[i].position_id) ? 1.35 : 1.0;
            if (accumulated + cost <= availableUnitsForRows) {
              accumulated += cost;
              splitIdx = i + 1;
            } else {
              break;
            }
          }

          // If we can place at least 1 employee in Table 1 and have at least 1 left for Table 2
          if (splitIdx >= 1 && splitIdx < currentDept.employees.length) {
            const table1Emps = currentDept.employees.slice(0, splitIdx);
            const table2Emps = currentDept.employees.slice(splitIdx);

            // Table 1 fills the remaining empty space of the current column
            currentPageColumns[currentColIdx].push({
              buildingName: currentDept.buildingName,
              deptName: currentDept.deptName,
              employees: table1Emps,
              isContinuation: currentDept.isContinuation,
            });

            // Advance to next column (or next page if on last column)
            nextColumn();

            // Table 2 continues in the next column
            currentDept = {
              buildingName: currentDept.buildingName,
              deptName: currentDept.deptName,
              employees: table2Emps,
              isContinuation: true,
            };
            continue;
          }
        }

        // If the remaining space in current column cannot even fit header + 1 employee,
        // advance to next column
        nextColumn();
      }
    }

    // Flush any remaining columns/page
    const hasRemainingContent = currentPageColumns.some((col) => col.length > 0);
    if (hasRemainingContent) {
      pushPage();
    }

    return pages.length > 0 ? pages : [{
      pageNumber: 1,
      groups: [],
      columnsData: Array.from({ length: columns }, () => []),
      totalEmployees: 0,
    }];
  }, [
    sortedEmployees,
    groupedSingleSheet,
    pageHeightMm,
    marginMm,
    fontSizePt,
    density,
    columns,
    showPosition,
    isOnePageForced,
  ]);

  // Accurate Page Count calculation based on actual inner content height
  const isFittingSinglePage = paginatedPages.length === 1;
  const estimatedPages = paginatedPages.length;

  // Auto-fit to 1 Page Engine
  const handleAutoFitToOnePage = () => {
    const count = sortedEmployees.length;
    setOrientationState('landscape');
    setDensityState('ultra');
    setMarginMmState(2);
    setShowFaxState(false);

    if (count <= 25) {
      setColumnsState(2);
      setFontSizePtState(7.5);
    } else if (count <= 55) {
      setColumnsState(3);
      setFontSizePtState(7.0);
    } else {
      setColumnsState(4);
      setFontSizePtState(6.2);
    }

    setIsOnePageForced(true);
    setActivePreset(null);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printNotice, setPrintNotice] = useState<{
    text: string;
    type: 'info' | 'success' | 'warning';
  } | null>(null);

  // اجرای مستقیم دستور چاپ مرورگر
  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);
    setPrintNotice({ text: 'در حال باز کردن پنجره چاپ...', type: 'info' });

    const printDocTitle = `PDF_Print_${pageSize}_${orientation}`;
    const originalDocTitle = document.title;
    document.title = printDocTitle;

    const handleAfterPrint = () => {
      setIsPrinting(false);
      document.title = originalDocTitle;
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);

    let printTriggered = false;
    try {
      window.focus();
      window.print();
      printTriggered = true;
      setPrintNotice({ text: 'پنجره چاپ باز شد.', type: 'success' });
      setTimeout(() => setPrintNotice(null), 3000);
    } catch (err) {
      console.warn('Direct window.print error, attempting popup window:', err);
    }

    // در صورت محدودیت آی‌فریم در مرورگر، باز کردن برگه در پنجره مستقل برای چاپ
    if (!printTriggered) {
      try {
        const sheetsContainer =
          document.getElementById('printable-directory-sheets-container') ||
          document.getElementById('printable-directory-sheet');
        const printWindow = window.open('', '_blank');
        if (printWindow && sheetsContainer) {
          const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map((el) => el.outerHTML)
            .join('\n');
          printWindow.document.open();
          printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8" />
  <title>${printDocTitle}</title>
  ${headStyles}
  <style>
    @page { size: ${pageSize} ${orientation}; margin: ${marginMm}mm; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .printable-directory-page {
      margin: 0 auto !important;
      padding: ${marginMm}mm !important;
      box-shadow: none !important;
      border: none !important;
      width: 100% !important;
      min-height: calc(${pageHeightMm - marginMm * 2}mm) !important;
      height: calc(${pageHeightMm - marginMm * 2}mm) !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
      page-break-after: always !important;
      break-after: page !important;
      overflow: hidden !important;
    }
    .printable-directory-page:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .printable-directory-footer {
      margin-top: auto !important;
      border-top: 1px solid #000000 !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  </style>
</head>
<body>
  ${sheetsContainer.outerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 150);
    };
  <\/script>
</body>
</html>`);
          printWindow.document.close();
          setPrintNotice({ text: 'برگه چاپ در پنجره جدید باز شد.', type: 'success' });
          setTimeout(() => setPrintNotice(null), 3000);
          printTriggered = true;
        }
      } catch (popErr) {
        console.warn('Popup print fallback error:', popErr);
      }
    }

    // در صورت مسدود بودن هر دو روش در محیط امنیتی آی‌فریم، دانلود خودکار PDF
    if (!printTriggered) {
      setPrintNotice({
        text: 'به دلیل محدودیت مرورگر، فایل PDF دانلود شد.',
        type: 'warning',
      });
      handleExportPdf();
      setTimeout(() => setPrintNotice(null), 4000);
    }

    setTimeout(() => setIsPrinting(false), 2000);
  };

  // دانلود مستقیم فایل PDF با تمامی ستون‌ها و اطلاعات کامل
  const handleExportPdf = async () => {
    if (isGeneratingPdf || paginatedPages.length === 0) return;

    try {
      setIsGeneratingPdf(true);
      setPrintNotice({
        text: paginatedPages.length > 1
          ? `در حال ایجاد فایل PDF (${toPersianDigits(paginatedPages.length)} صفحه)...`
          : 'در حال ایجاد فایل PDF...',
        type: 'info',
      });

      // فقط عناصر مخصوص صفحه مانند راهنماها یا دکمه‌های پرینت را فیلتر می‌کنیم
      const filterFn = (node: Node) => {
        if (node instanceof HTMLElement) {
          if (node.classList?.contains('print:hidden') || node.classList?.contains('no-print')) {
            return false;
          }
        }
        return true;
      };

      const isLandscape = orientation === 'landscape';
      const pdfFormat = pageSize.toLowerCase() as 'a4' | 'a3';

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: pdfFormat,
        compress: true,
      });

      const pageWidthMm = isLandscape
        ? (pageSize === 'A3' ? 420 : 297)
        : (pageSize === 'A3' ? 297 : 210);
      const pageHeightMm = isLandscape
        ? (pageSize === 'A3' ? 297 : 210)
        : (pageSize === 'A3' ? 420 : 297);

      // Ensure all Vazirmatn font weights are fully loaded and decoded in browser before rasterization
      await ensureVazirmatnFontsLoaded();

      // Brief yield to allow the browser to complete layout & paint pass
      await new Promise((resolve) => setTimeout(resolve, 80));

      for (let i = 0; i < paginatedPages.length; i++) {
        const pageEl =
          document.getElementById(`printable-directory-page-${i + 1}`) ||
          document.getElementById('printable-directory-sheet');
        if (!pageEl) continue;

        if (i > 0) {
          pdf.addPage(pdfFormat, isLandscape ? 'landscape' : 'portrait');
        }

        let canvas: HTMLCanvasElement;
        try {
          canvas = await toCanvas(pageEl, {
            quality: 1,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            fontEmbedCSS: VAZIRMATN_FONT_EMBED_CSS,
            filter: filterFn,
            style: {
              transform: 'none',
              transformOrigin: 'top center',
              margin: '0',
              boxShadow: 'none',
              border: 'none',
              borderRadius: '0',
            },
          });
        } catch {
          canvas = await toCanvas(pageEl, {
            quality: 1,
            pixelRatio: 1.5,
            backgroundColor: '#ffffff',
            fontEmbedCSS: VAZIRMATN_FONT_EMBED_CSS,
            filter: filterFn,
            style: {
              transform: 'none',
              transformOrigin: 'top center',
              margin: '0',
              boxShadow: 'none',
              border: 'none',
              borderRadius: '0',
            },
          });
        }

        // Use PNG format for lossless, crystal-clear Persian text without compression artifacts
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
      }

      const fileName = `PDF_Print_${pageSize}_${orientation}.pdf`;
      pdf.save(fileName);

      setPrintNotice({ text: 'فایل PDF با موفقیت دانلود شد.', type: 'success' });
      setTimeout(() => setPrintNotice(null), 3500);
    } catch (err) {
      console.error('PDF export failed:', err);
      // Fallback: trigger standard browser print dialog which allows "Save as PDF" natively
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Keyboard shortcut Ctrl+P & Body Print Isolation Class
  useEffect(() => {
    document.body.classList.add('print-directory-active');
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('print-directory-active');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentDatePersian = formatPersianDate(new Date());

  // Paper Dimensions Style
  const getPaperDimensionsStyle = () => {
    const pad = `${marginMm}mm`;
    if (pageSize === 'A3') {
      return orientation === 'landscape'
        ? { width: '420mm', minHeight: '297mm', padding: pad }
        : { width: '297mm', minHeight: '420mm', padding: pad };
    }
    // A4 Default
    return orientation === 'landscape'
      ? { width: '297mm', minHeight: '210mm', padding: pad }
      : { width: '210mm', minHeight: '297mm', padding: pad };
  };

  // Cell padding & spacing
  const cellPaddingStyle = useMemo(() => {
    if (density === 'ultra') return { padding: '1px 3px' };
    if (density === 'compact') return { padding: '2.2px 4px' };
    return { padding: '3.5px 6px' };
  }, [density]);

  const headerPaddingStyle = useMemo(() => {
    if (density === 'ultra') return { padding: '1.5px 3px' };
    if (density === 'compact') return { padding: '2.5px 4px' };
    return { padding: '4px 6px' };
  }, [density]);

  const sectionMarginStyle = useMemo(() => {
    if (density === 'ultra') return { marginBottom: '5px' };
    if (density === 'compact') return { marginBottom: '8px' };
    return { marginBottom: '12px' };
  }, [density]);

  return (
    <div
      dir="rtl"
      id="printable-directory-modal-root"
      className="fixed inset-0 z-50 flex flex-col md:flex-row bg-slate-950/85 backdrop-blur-md overflow-hidden print:p-0 print:bg-white select-none"
    >
      {/* Dynamic Print CSS */}
      <style>{`
        :root {
          --print-sheet-padding: ${marginMm}mm;
        }
        @page {
          size: ${pageSize} ${orientation};
          margin: ${marginMm}mm;
        }
        @media print {
          @page {
            size: ${pageSize} ${orientation};
            margin: ${marginMm}mm;
          }

          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Hide background application elements completely */
          #app-main-shell,
          body.print-directory-active #app-main-shell,
          body > #root > div > *:not(#printable-directory-modal-root) {
            display: none !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          #root,
          #root > div {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          #printable-directory-modal-root {
            position: static !important;
            inset: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
          }
          #printable-directory-sidebar {
            display: none !important;
          }
          #printable-directory-main-scroll {
            position: static !important;
            overflow: visible !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
          }
          #printable-directory-zoom-wrapper {
            transform: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
          }
          #printable-directory-sheets-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .printable-directory-page {
            position: static !important;
            left: auto !important;
            top: auto !important;
            margin: 0 auto !important;
            padding: ${marginMm}mm !important;
            max-width: 100% !important;
            width: 100% !important;
            min-height: calc(${pageHeightMm - marginMm * 2}mm) !important;
            height: calc(${pageHeightMm - marginMm * 2}mm) !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          .printable-directory-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .printable-directory-footer {
            margin-top: auto !important;
            border-top: 1px solid #000000 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ================= RIGHT SIDEBAR: VERTICAL & COMPACT MENU ================= */}
      <aside
        id="printable-directory-sidebar"
        className="w-full md:w-80 lg:w-84 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 z-40 overflow-y-auto p-3.5 print:hidden text-right shadow-2xl"
      >
        {/* Header: Title + Close button */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Printer className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">تنظیمات چاپ</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
            title="بستن (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 📢 DYNAMIC PAGE COUNT CARD */}
        <div className="mt-2.5">
          {isFittingSinglePage ? (
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                    ۱ صفحه
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    تک‌صفحه کامل
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                ۱ صفحه
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAutoFitToOnePage}
              className="w-full p-2 rounded-xl border bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/70 dark:to-orange-950/70 border-amber-300 dark:border-amber-700/80 hover:border-amber-400 dark:hover:border-amber-500 text-amber-950 dark:text-amber-100 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs group text-right"
              title="تنظیم خودکار برای ۱ صفحه"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-amber-600 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <span>{toPersianDigits(estimatedPages)} صفحه</span>
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                    <span>تنظیم ۱ صفحه</span>
                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10.5px] font-black shrink-0 shadow-xs group-hover:brightness-105">
                تک‌صفحه
              </span>
            </button>
          )}
        </div>

        {/* PRIMARY ACTION BUTTONS: PRINT & FAST PDF */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer active:scale-98"
            title="چاپ برگه (با پیش‌نمایش گرافیکی قبل از ارسال)"
          >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  <span>در حال چاپ...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>چاپ</span>
                </>
              )}
            </button>

            {/* Fast PDF export button */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all cursor-pointer active:scale-98"
              title="دانلود PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  <span>در حال ساخت...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 shrink-0" />
                  <span>دانلود PDF</span>
                </>
              )}
            </button>
          </div>

        {/* Print Feedback Notification if active */}
        {printNotice && (
          <div
            className={`mt-2 p-1.5 rounded-lg text-[10.5px] font-bold border transition-all text-center leading-relaxed ${
              printNotice.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : printNotice.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800'
            }`}
          >
            {printNotice.text}
          </div>
        )}

        {/* ================= قالب‌های آماده چاپ ================= */}
        <div className="mt-3 p-2 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
          {/* Header & Orientation Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                قالب‌های آماده
              </span>
              {activePreset === 'ls_standard' && orientation === 'landscape' ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
                  پیش‌فرض فعال
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all font-bold cursor-pointer"
                  title="بازنشانی به قالب پیش‌فرض افقی و استاندارد (متوازن اداری)"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>پیش‌فرض</span>
                </button>
              )}
            </div>
            <div className="flex items-center p-0.5 rounded-xl bg-indigo-100/90 dark:bg-indigo-900/60">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 dark:text-indigo-300 hover:text-indigo-950 dark:hover:text-white'
                }`}
              >
                افقی
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 dark:text-indigo-300 hover:text-indigo-950 dark:hover:text-white'
                }`}
              >
                عمودی
              </button>
            </div>
          </div>

          {/* 5 Presets - Expanded Cards */}
          <div className="space-y-1.5">
            {(orientation === 'landscape' ? LANDSCAPE_PRESETS : PORTRAIT_PRESETS).map((preset) => {
              const isSelected = activePreset === preset.id;
              const isDefaultPreset = preset.id === 'ls_standard';
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPrintPreset(preset)}
                  className={`w-full text-right p-2 rounded-xl transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-indigo-600 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
                      : 'bg-white/70 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-300 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {preset.label}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          ({preset.desc})
                        </span>
                        {isDefaultPreset && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/60">
                            پیش‌فرض
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9.5px] font-mono font-bold shrink-0 px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {toPersianDigits(preset.columns)} ستون • {toPersianDigits(preset.fontSizePt.toFixed(1))}pt
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= تنظیمات دستی ================= */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsMoreSettingsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>تنظیمات دستی</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
              <span>{isMoreSettingsOpen ? 'بستن' : 'تغییر'}</span>
              {isMoreSettingsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {isMoreSettingsOpen && (
            <div className="mt-2.5 space-y-2.5 text-xs animate-in fade-in-50 duration-150">
              {/* 1. اندازه کاغذ */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">کاغذ</span>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPageSize('A4')}
                    className={`py-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                      pageSize === 'A4'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                    }`}
                  >
                    A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageSize('A3')}
                    className={`py-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                      pageSize === 'A3'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                    }`}
                  >
                    A3
                  </button>
                </div>
              </div>

              {/* 2. جهت کاغذ */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">جهت</span>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                    }`}
                  >
                    افقی
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                    }`}
                  >
                    عمودی
                  </button>
                </div>
              </div>

              {/* 3. تعداد ستون */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ستون‌ها</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
                  {([2, 3, 4] as ColumnCount[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColumns(c)}
                      className={`py-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                        columns === c
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                      }`}
                    >
                      {toPersianDigits(c)} ستون
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. اندازه قلم */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">قلم</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFontSizePt(fontSizePt - 0.5)}
                      className="p-0.5 px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-600 cursor-pointer"
                      title="کاهش"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[10.5px] font-mono font-bold text-indigo-600 dark:text-indigo-400 min-w-10 text-center">
                      {toPersianDigits(fontSizePt.toFixed(1))}pt
                    </span>
                    <button
                      type="button"
                      onClick={() => setFontSizePt(fontSizePt + 0.5)}
                      className="p-0.5 px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-600 cursor-pointer"
                      title="افزایش"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
                  {[
                    { label: 'ریز (۶)', pt: 6.0 },
                    { label: 'متوسط (۷.۵)', pt: 7.5 },
                    { label: 'درشت (۹)', pt: 9.0 },
                  ].map((p) => (
                    <button
                      key={p.pt}
                      type="button"
                      onClick={() => setFontSizePt(p.pt)}
                      className={`py-1 rounded-lg text-center font-bold text-[10.5px] transition-all cursor-pointer ${
                        Math.abs(fontSizePt - p.pt) < 0.2
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. تراکم سطرها */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">تراکم</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
                  {[
                    { key: 'ultra', label: 'فوق‌فشرده' },
                    { key: 'compact', label: 'فشرده' },
                    { key: 'normal', label: 'عادی' },
                  ].map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setDensity(d.key as Density)}
                      className={`py-1 rounded-lg text-center font-bold text-[10.5px] transition-all cursor-pointer ${
                        density === d.key
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. حاشیه کاغذ */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">حاشیه</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
                  {[
                    { val: 2, label: 'کم (۲mm)' },
                    { val: 4, label: 'متوسط (۴mm)' },
                    { val: 7, label: 'زیاد (۷mm)' },
                  ].map((m) => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => setMarginMm(m.val)}
                      className={`py-1 rounded-lg text-center font-bold text-[10.5px] transition-all cursor-pointer ${
                        marginMm === m.val
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. اطلاعات جدول */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">فیلدها</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
                  {[
                    { key: 'minimal', label: 'حداقل' },
                    { key: 'standard', label: 'استاندارد' },
                    { key: 'full', label: 'کامل' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyFieldsPreset(p.key as any)}
                      className={`py-1 rounded-lg text-center font-bold text-[10.5px] transition-all cursor-pointer ${
                        currentFieldsPreset === p.key
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* چک‌باکس‌های مستقیم، همراه، واحد، طبقه، سمت، فکس */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-0.5 text-[10.5px]">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showDirect}
                      onChange={(e) => setShowDirect(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                    <span>مستقیم</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showMobile}
                      onChange={(e) => setShowMobile(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                    <span>همراه</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showUnit}
                      onChange={(e) => setShowUnit(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                    <span>واحد</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showFloor}
                      onChange={(e) => setShowFloor(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                    <span>طبقه</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showPosition}
                      onChange={(e) => setShowPosition(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                    <span>سمت</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showFax}
                      onChange={(e) => setShowFax(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                    <span>فکس</span>
                  </label>
                </div>
              </div>

              {/* 8. ساختمان */}
              {uniqueBuildings.length > 1 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ساختمان</span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 px-2 py-1 rounded-xl">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={selectedBuilding}
                      onChange={(e) => setSelectedBuilding(e.target.value)}
                      className="w-full bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none text-[11px] cursor-pointer"
                    >
                      <option value="all">همه ساختمان‌ها</option>
                      {uniqueBuildings.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 9. زوم پیش‌نمایش */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">زوم</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPreviewZoom((z) => Math.max(z - 10, 40))}
              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:text-indigo-600 cursor-pointer"
              title="کوچک‌نمایی"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono font-bold w-9 text-center text-slate-700 dark:text-slate-300">
              {toPersianDigits(previewZoom)}%
            </span>
            <button
              type="button"
              onClick={() => setPreviewZoom((z) => Math.min(z + 10, 140))}
              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:text-indigo-600 cursor-pointer"
              title="بزرگ‌نمایی"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewZoom(85)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-indigo-600 cursor-pointer font-bold mr-1"
            >
              عادی
            </button>
          </div>
        </div>
      </aside>

      {/* ================= PREVIEW WORKSPACE (LEFT / CENTER) ================= */}
      <main
        id="printable-directory-main-scroll"
        className="flex-1 h-full overflow-auto bg-slate-900/60 p-2 sm:p-6 flex flex-col items-center justify-start print:p-0 print:overflow-visible print:bg-white"
      >
        {/* Page Switcher Bar when > 1 page */}
        {paginatedPages.length > 1 && (
          <div className="mb-4 print:hidden flex items-center gap-2 bg-slate-800/90 text-white px-4 py-1.5 rounded-full border border-slate-700 shadow-lg text-xs shrink-0">
            <span className="font-bold text-slate-300">صفحات:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {paginatedPages.map((p, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`printable-directory-page-${pIdx + 1}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-indigo-600 text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                >
                  برگه {toPersianDigits(pIdx + 1)}
                  <span className="mr-1 text-[9.5px] opacity-75">({toPersianDigits(p.totalEmployees)} نفر)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          id="printable-directory-zoom-wrapper"
          style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 print:transform-none pb-12"
        >
          <div id="printable-directory-sheets-container" className="flex flex-col items-center gap-8 print:gap-0">
            {paginatedPages.map((pageData, pageIdx) => (
              <div key={pageIdx} className="flex flex-col items-center w-full">
                {/* Visual Page Divider Badge for screen review */}
                {paginatedPages.length > 1 && (
                  <div className="mb-2 print:hidden flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-800/80 px-3.5 py-1 rounded-full border border-slate-700 shadow-sm">
                    <span>برگه {toPersianDigits(pageIdx + 1)} از {toPersianDigits(paginatedPages.length)}</span>
                    <span className="text-slate-400 font-normal">({toPersianDigits(pageData.totalEmployees)} نفر از کارکنان)</span>
                  </div>
                )}

                <DirectoryPageSheet
                  pageIndex={pageIdx}
                  totalPages={paginatedPages.length}
                  pageData={pageData}
                  settings={settings}
                  currentDatePersian={currentDatePersian}
                  pageSize={pageSize}
                  orientation={orientation}
                  columns={columns}
                  fontSizePt={fontSizePt}
                  density={density}
                  marginMm={marginMm}
                  showDirect={showDirect}
                  showMobile={showMobile}
                  showPosition={showPosition}
                  showFax={showFax}
                  showUnit={showUnit}
                  showFloor={showFloor}
                  locMap={locMap}
                  cellPaddingStyle={cellPaddingStyle}
                  headerPaddingStyle={headerPaddingStyle}
                  sectionMarginStyle={sectionMarginStyle}
                  posMap={posMap}
                  getEmployeePhones={getEmployeePhones}
                  getPaperDimensionsStyle={getPaperDimensionsStyle}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
