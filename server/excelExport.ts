import * as XLSX from 'xlsx';
import {
  Employee,
  Department,
  Position,
  LocationItem,
  DynamicFieldDefinition
} from '../src/types.ts';

const xlsxLib: any = (XLSX as any).default || XLSX;

// Helper to convert date to Persian Shamsi string
export function toShamsiDateString(isoStr?: string | null): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const gy = d.getFullYear();
    const gm = d.getMonth() + 1;
    const gd = d.getDate();
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    let gy2 = gy <= 1600 ? gy - 621 : gy - 1600;
    let days = (365 * gy2) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100)) + (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
    let jy2 = jy + 33 * (Math.floor(days / 12053));
    days %= 12053;
    jy2 += 4 * (Math.floor(days / 1461));
    days %= 1461;
    if (days > 365) {
      jy2 += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? (days % 31) : ((days - 186) % 30));
    const toFa = (n: number) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
    return `${toFa(jy2)}/${toFa(jm).padStart(2, '۰')}/${toFa(jd).padStart(2, '۰')}`;
  } catch {
    return '';
  }
}

export function getEmployeeEmails(emp: Employee): string[] {
  const list: string[] = [];
  if (emp.email) {
    const parts = emp.email.split(/[,;\n/|]/).map(s => s.trim()).filter(Boolean);
    for (const p of parts) if (!list.includes(p)) list.push(p);
  }
  if (emp.custom_fields) {
    for (const [k, v] of Object.entries(emp.custom_fields)) {
      if (typeof v === 'string' && (k.toLowerCase().includes('email') || k.includes('ایمیل'))) {
        const parts = v.split(/[,;\n/|]/).map(s => s.trim()).filter(Boolean);
        for (const p of parts) if (!list.includes(p)) list.push(p);
      }
    }
  }
  if (emp.phones) {
    for (const p of emp.phones) {
      if (p.number && p.number.includes('@') && !list.includes(p.number.trim())) {
        list.push(p.number.trim());
      }
    }
  }
  return list;
}

export function getEmployeeExtensions(emp: Employee): string[] {
  const list: string[] = [];
  if (emp.extension) {
    const parts = String(emp.extension).split(/[,;\n/|،]/).map(s => s.trim()).filter(Boolean);
    for (const p of parts) if (!list.includes(p)) list.push(p);
  }
  if (emp.phones) {
    for (const p of emp.phones) {
      if (p.type === 'extension' && p.number) {
        const parts = String(p.number).split(/[,;\n/|،]/).map(s => s.trim()).filter(Boolean);
        for (const p of parts) if (!list.includes(p)) list.push(p);
      }
    }
  }
  return list;
}

export function getEmployeeDirectPhones(emp: Employee): string[] {
  const list: string[] = [];
  if (emp.direct_phone) {
    const parts = String(emp.direct_phone).split(/[,;\n/|،]/).map(s => s.trim()).filter(Boolean);
    for (const p of parts) if (!list.includes(p)) list.push(p);
  }
  if (emp.phones) {
    for (const p of emp.phones) {
      if ((p.type === 'office' || p.type === 'other') && p.number && !p.number.includes('@')) {
        const parts = String(p.number).split(/[,;\n/|،]/).map(s => s.trim()).filter(Boolean);
        for (const p of parts) if (!list.includes(p)) list.push(p);
      }
    }
  }
  return list;
}

export function getEmployeeMobiles(emp: Employee): string[] {
  const list: string[] = [];
  if (emp.mobile) {
    const parts = String(emp.mobile).split(/[,;\n/|،]/).map(s => s.trim()).filter(Boolean);
    for (const p of parts) if (!list.includes(p)) list.push(p);
  }
  if (emp.phones) {
    for (const p of emp.phones) {
      if (p.type === 'mobile' && p.number) {
        const parts = String(p.number).split(/[,;\n/|،]/).map(s => s.trim()).filter(Boolean);
        for (const p of parts) if (!list.includes(p)) list.push(p);
      }
    }
  }
  return list;
}

export interface ExcelExportOptions {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  locations: LocationItem[];
  fields: DynamicFieldDefinition[];
  isTemplate?: boolean;
}

/**
 * Generates an Excel workbook Buffer representing full comprehensive directory data.
 * Formatted with RTL, column widths, and complete fields matching the Excel export feature.
 */
export function generateFullExcelBuffer(options: ExcelExportOptions): Buffer {
  const {
    employees,
    departments,
    positions,
    locations,
    fields,
    isTemplate = false
  } = options;

  const deptMap = new Map(departments.map(d => [d.id, d.name]));
  const deptCodeMap = new Map(departments.map(d => [d.id, d.code]));
  const posMap = new Map(positions.map(p => [p.id, p.title]));
  const posLevelMap = new Map(positions.map(p => [p.id, p.level || '']));
  const locMap = new Map(locations.map(l => [l.id, l.name]));
  const locBuildingMap = new Map(locations.map(l => [l.id, l.building || '']));
  const locFloorMap = new Map(locations.map(l => [l.id, l.floor || '']));
  const locUnitMap = new Map(locations.map(l => [l.id, l.unit || '']));

  // Filter custom non-system fields
  const customFieldDefs = fields.filter(f =>
    !f.is_system &&
    ![
      'first_name', 'last_name', 'full_name', 'personnel_code',
      'extension', 'direct_phone', 'mobile', 'email', 'room', 'notes',
      'department_id', 'position_id', 'location_id', 'avatar', 'print_order'
    ].includes(f.internal_name)
  );

  const toFaDigit = (n: number) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);

  // Calculate dynamic maximum number of columns across all exported employees
  const maxExtCols = Math.max(3, ...employees.map(e => getEmployeeExtensions(e).length));
  const maxDirCols = Math.max(2, ...employees.map(e => getEmployeeDirectPhones(e).length));
  const maxMobCols = Math.max(2, ...employees.map(e => getEmployeeMobiles(e).length));
  const maxEmailCols = Math.max(3, ...employees.map(e => getEmployeeEmails(e).length));

  let rows: Record<string, any>[] = [];

  if (isTemplate) {
    // Template rows
    const templateRow1: Record<string, any> = {
      'ردیف': 1,
      'کد پرسنلی': '1001',
      'نام': 'علیرضا',
      'نام خانوادگی': 'رستگار',
      'نام و نام خانوادگی': 'علیرضا رستگار',
      'واحد سازمانی': 'مدیریت و حوزه ریاست',
      'کد واحد سازمانی': '100',
      'سمت سازمانی': 'مدیر عامل و رئیس هیئت مدیره',
      'سطح سمت سازمانی': 'مدیریت ارشد',
    };

    for (let i = 1; i <= maxExtCols; i++) {
      templateRow1[`شماره داخلی ${toFaDigit(i)}`] = i === 1 ? '101' : i === 2 ? '111' : i === 3 ? '121' : '';
    }
    for (let i = 1; i <= maxDirCols; i++) {
      templateRow1[`تلفن مستقیم ${toFaDigit(i)}`] = i === 1 ? '021-88901001' : i === 2 ? '021-88901002' : '';
    }
    for (let i = 1; i <= maxMobCols; i++) {
      templateRow1[`شماره همراه ${toFaDigit(i)}`] = i === 1 ? '09121110011' : i === 2 ? '09191110011' : '';
    }
    for (let i = 1; i <= maxEmailCols; i++) {
      templateRow1[`آدرس ایمیل ${toFaDigit(i)}`] = i === 1 ? 'a.rastegar@org.ir' : i === 2 ? 'ceo.office@org.ir' : i === 3 ? 'rastegar@gmail.com' : '';
    }

    templateRow1['محل استقرار / ساختمان'] = 'ساختمان مرکزی - طبقه ۵ (دفتر مدیرعامل)';
    templateRow1['ساختمان'] = 'ساختمان مرکزی';
    templateRow1['طبقه'] = '۵';
    templateRow1['شماره اتاق / واحد'] = 'اتاق ۵۰۱';
    templateRow1['توضیحات و یادداشت‌ها'] = 'دکترای مدیریت استراتژیک، جلسات با هماهنگی حوزه ریاست';
    templateRow1['اولویت نمایش و چاپ'] = 1;
    templateRow1['تعداد دفعات جستجو و مشاهده'] = 185;
    templateRow1['نشانی تصویر پرسنلی'] = '/api/uploads/employees/emp_emp-1.jpg';
    templateRow1['شناسه سیستمی'] = 'emp-1';
    templateRow1['تاریخ ثبت (شمسی)'] = '۱۴۰۳/۰۱/۱۵';
    templateRow1['تاریخ ثبت (میلادی)'] = '2024-04-03T08:00:00.000Z';
    templateRow1['تاریخ آخرین ویرایش (شمسی)'] = '۱۴۰۳/۰۶/۱۸';
    templateRow1['تاریخ آخرین ویرایش (میلادی)'] = '2024-09-08T09:30:00.000Z';

    customFieldDefs.forEach(f => {
      templateRow1[f.persian_label] = f.default_value ? String(f.default_value) : '';
    });

    rows = [templateRow1];
  } else {
    // Full export of all employees
    rows = employees.map((emp, idx) => {
      const exts = getEmployeeExtensions(emp);
      const directs = getEmployeeDirectPhones(emp);
      const mobs = getEmployeeMobiles(emp);
      const emails = getEmployeeEmails(emp);

      const firstName = emp.first_name || (emp.full_name ? emp.full_name.split(' ')[0] : '');
      const lastName = emp.last_name || (emp.full_name ? emp.full_name.split(' ').slice(1).join(' ') : '');

      const deptName = deptMap.get(emp.department_id) || emp.department_id || '';
      const deptCode = deptCodeMap.get(emp.department_id) || '';
      const posTitle = posMap.get(emp.position_id) || emp.position_id || '';
      const posLevel = posLevelMap.get(emp.position_id) || '';
      const locName = locMap.get(emp.location_id) || emp.location_id || '';
      const building = emp.building || locBuildingMap.get(emp.location_id) || '';
      const floor = emp.floor || locFloorMap.get(emp.location_id) || '';
      const room = emp.room || emp.unit || locUnitMap.get(emp.location_id) || '';

      const row: Record<string, any> = {
        'ردیف': idx + 1,
        'کد پرسنلی': emp.personnel_code || '',
        'نام': firstName,
        'نام خانوادگی': lastName,
        'نام و نام خانوادگی': emp.full_name || `${firstName} ${lastName}`.trim(),
        'واحد سازمانی': deptName,
        'کد واحد سازمانی': deptCode,
        'سمت سازمانی': posTitle,
        'سطح سمت سازمانی': posLevel,
      };

      // Separate column for each extension number
      for (let i = 1; i <= maxExtCols; i++) {
        row[`شماره داخلی ${toFaDigit(i)}`] = exts[i - 1] || '';
      }

      // Separate column for each direct phone
      for (let i = 1; i <= maxDirCols; i++) {
        row[`تلفن مستقیم ${toFaDigit(i)}`] = directs[i - 1] || '';
      }

      // Separate column for each mobile phone
      for (let i = 1; i <= maxMobCols; i++) {
        row[`شماره همراه ${toFaDigit(i)}`] = mobs[i - 1] || '';
      }

      // Separate column for each email
      for (let i = 1; i <= maxEmailCols; i++) {
        row[`آدرس ایمیل ${toFaDigit(i)}`] = emails[i - 1] || '';
      }

      row['محل استقرار / ساختمان'] = locName;
      row['ساختمان'] = building;
      row['طبقه'] = floor;
      row['شماره اتاق / واحد'] = room;
      row['توضیحات و یادداشت‌ها'] = emp.notes || '';
      row['اولویت نمایش و چاپ'] = emp.print_order !== undefined && emp.print_order !== null ? emp.print_order : '';
      row['تعداد دفعات جستجو و مشاهده'] = emp.search_count || 0;
      row['نشانی تصویر پرسنلی'] = emp.avatar || '';
      row['شناسه سیستمی'] = emp.id;
      row['تاریخ ثبت (شمسی)'] = toShamsiDateString(emp.created_at);
      row['تاریخ ثبت (میلادی)'] = emp.created_at || '';
      row['تاریخ آخرین ویرایش (شمسی)'] = toShamsiDateString(emp.updated_at);
      row['تاریخ آخرین ویرایش (میلادی)'] = emp.updated_at || '';

      // Append all custom fields
      customFieldDefs.forEach(f => {
        const val = emp.custom_fields?.[f.internal_name];
        row[f.persian_label] = val !== undefined && val !== null ? val : '';
      });

      return row;
    });
  }

  const wb = xlsxLib.utils.book_new();
  const ws = xlsxLib.utils.json_to_sheet(rows);

  // Sheet formatting: Right-to-Left (RTL) for perfect Persian layout
  ws['!views'] = [{ rightToLeft: true }];

  // Calculate auto column widths
  if (rows.length > 0) {
    const colNames = Object.keys(rows[0] || {});
    ws['!cols'] = colNames.map(col => {
      let maxLen = col.length;
      for (let i = 0; i < Math.min(rows.length, 50); i++) {
        const cellVal = String(rows[i][col] ?? '');
        if (cellVal.length > maxLen) {
          maxLen = cellVal.length;
        }
      }
      return { wch: Math.min(Math.max(maxLen + 3, 13), 42) };
    });
  }

  const sheetTitle = isTemplate ? 'قالب نمونه اکسل' : 'کارکنان و راهنمای تلفن';
  xlsxLib.utils.book_append_sheet(wb, ws, sheetTitle);

  return xlsxLib.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
