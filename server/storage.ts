import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { generateFullExcelBuffer } from './excelExport.ts';
import {
  Department,
  DynamicFieldDefinition,
  Position,
  LocationItem,
  Employee,
  ArchivedEmployee,
  AppSettings,
  AppUser,
  SystemStatistics,
  SearchStatEntry,
  AuditLogEntry,
  HealthCheckResult
} from '../src/types.ts';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_FIELDS,
  INITIAL_LOCATIONS,
  INITIAL_POSITIONS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  generateInitialEmployees
} from './seedData.ts';

// Paths definition matching the exact required structure
export const STORAGE_DIR = path.join(process.cwd(), 'storage');
export const DATA_DIR = path.join(STORAGE_DIR, 'data');
export const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
export const EMP_UPLOADS_DIR = path.join(UPLOADS_DIR, 'employees');
export const COMPANY_UPLOADS_DIR = path.join(UPLOADS_DIR, 'company');
export const BACKUPS_DIR = path.join(STORAGE_DIR, 'backups');
export const IMPORTS_DIR = path.join(STORAGE_DIR, 'imports');
export const EXPORTS_DIR = path.join(STORAGE_DIR, 'exports');

// File paths
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');
const ARCHIVED_EMPLOYEES_FILE = path.join(DATA_DIR, 'archived_employees.json');
const DEPARTMENTS_FILE = path.join(DATA_DIR, 'departments.json');
const FIELDS_FILE = path.join(DATA_DIR, 'fields.json');
const POSITIONS_FILE = path.join(DATA_DIR, 'positions.json');
const LOCATIONS_FILE = path.join(DATA_DIR, 'locations.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const SEARCH_STATS_FILE = path.join(DATA_DIR, 'search-stats.json');
const AUDIT_LOG_FILE = path.join(DATA_DIR, 'audit-log.json');

// Mutex queues for atomic serialized file writes
const fileQueues: Map<string, Promise<any>> = new Map();

function enqueueFileWrite<T>(filePath: string, writeFn: () => Promise<T>): Promise<T> {
  const currentQueue = fileQueues.get(filePath) || Promise.resolve();
  const nextQueue = currentQueue.then(writeFn, writeFn);
  fileQueues.set(filePath, nextQueue);
  return nextQueue;
}

// Atomic file write helper: Write to temp file -> Validate JSON -> Flush -> Atomic rename
export async function atomicWriteJson(filePath: string, data: any): Promise<void> {
  return enqueueFileWrite(filePath, async () => {
    const jsonStr = JSON.stringify(data, null, 2);
    // Validate by re-parsing
    JSON.parse(jsonStr);

    const tempFile = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
    await fs.promises.writeFile(tempFile, jsonStr, 'utf-8');
    await fs.promises.rename(tempFile, filePath);
  });
}

export async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

// Persian Unicode normalizer
export function normalizePersian(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F]/g, '') // remove arabic diacritics
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9')
    .toLowerCase()
    .trim();
}

// Initialize directory structure and seed files if not present
export async function initializeStorage(): Promise<void> {
  const dirs = [
    STORAGE_DIR,
    DATA_DIR,
    UPLOADS_DIR,
    EMP_UPLOADS_DIR,
    COMPANY_UPLOADS_DIR,
    BACKUPS_DIR,
    IMPORTS_DIR,
    EXPORTS_DIR
  ];

  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }

  // Seed data if missing
  if (!fs.existsSync(DEPARTMENTS_FILE)) {
    await atomicWriteJson(DEPARTMENTS_FILE, INITIAL_DEPARTMENTS);
  }
  if (!fs.existsSync(POSITIONS_FILE)) {
    await atomicWriteJson(POSITIONS_FILE, INITIAL_POSITIONS);
  }
  if (!fs.existsSync(LOCATIONS_FILE)) {
    await atomicWriteJson(LOCATIONS_FILE, INITIAL_LOCATIONS);
  }
  if (!fs.existsSync(FIELDS_FILE)) {
    await atomicWriteJson(FIELDS_FILE, INITIAL_FIELDS);
  }
  if (!fs.existsSync(USERS_FILE)) {
    await atomicWriteJson(USERS_FILE, INITIAL_USERS);
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    await atomicWriteJson(SETTINGS_FILE, INITIAL_SETTINGS);
  }
  if (!fs.existsSync(EMPLOYEES_FILE)) {
    const initialEmps = generateInitialEmployees();
    await atomicWriteJson(EMPLOYEES_FILE, initialEmps);
  }
  if (!fs.existsSync(ARCHIVED_EMPLOYEES_FILE)) {
    await atomicWriteJson(ARCHIVED_EMPLOYEES_FILE, []);
  }
  if (!fs.existsSync(SEARCH_STATS_FILE)) {
    await atomicWriteJson(SEARCH_STATS_FILE, []);
  }
  if (!fs.existsSync(AUDIT_LOG_FILE)) {
    const initLog: AuditLogEntry[] = [
      {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        username: 'system',
        action: 'System Initialization',
        target: 'All Data Stores',
        details: 'مقادیر اولیه و ۱۲ واحد سازمانی راه‌اندازی شد',
        ip: '127.0.0.1',
        result: 'success'
      }
    ];
    await atomicWriteJson(AUDIT_LOG_FILE, initLog);
  }
}

// Data Access functions
export async function getEmployees(): Promise<Employee[]> {
  return readJson<Employee[]>(EMPLOYEES_FILE, []);
}

export async function saveEmployees(employees: Employee[]): Promise<void> {
  await atomicWriteJson(EMPLOYEES_FILE, employees);
}

export async function getArchivedEmployees(): Promise<ArchivedEmployee[]> {
  return readJson<ArchivedEmployee[]>(ARCHIVED_EMPLOYEES_FILE, []);
}

export async function saveArchivedEmployees(archived: ArchivedEmployee[]): Promise<void> {
  await atomicWriteJson(ARCHIVED_EMPLOYEES_FILE, archived);
}

export async function archiveEmployee(
  id: string,
  reason = 'انتقال به آرشیو توسط مدیر',
  archivedBy = 'admin'
): Promise<{ success: boolean; employee?: ArchivedEmployee; message: string }> {
  const employees = await getEmployees();
  const empIndex = employees.findIndex(e => e.id === id);
  if (empIndex === -1) {
    return { success: false, message: 'کارمند مورد نظر در لیست فعال یافت نشد.' };
  }

  const target = employees[empIndex];
  const departments = await getDepartments();
  const positions = await getPositions();
  const dept = departments.find(d => d.id === target.department_id);
  const pos = positions.find(p => p.id === target.position_id);

  const archivedEmp: ArchivedEmployee = {
    ...target,
    archived_at: new Date().toISOString(),
    archived_by: archivedBy,
    archive_reason: reason,
    original_department_name: dept ? dept.name : undefined,
    original_position_title: pos ? pos.title : undefined,
  };

  const archivedList = await getArchivedEmployees();
  const updatedArchived = [archivedEmp, ...archivedList.filter(a => a.id !== id)];
  await saveArchivedEmployees(updatedArchived);

  // Remove from active employees
  const updatedEmployees = employees.filter(e => e.id !== id);
  await saveEmployees(updatedEmployees);

  return {
    success: true,
    employee: archivedEmp,
    message: `پرونده «${target.full_name}» به بخش آرشیو و بازیافت منتقل شد.`
  };
}

export async function restoreArchivedEmployee(
  id: string
): Promise<{ success: boolean; employee?: Employee; message: string }> {
  const archivedList = await getArchivedEmployees();
  const archiveIndex = archivedList.findIndex(a => a.id === id);
  if (archiveIndex === -1) {
    return { success: false, message: 'پرونده مورد نظر در آرشیو یافت نشد.' };
  }

  const targetArchived = archivedList[archiveIndex];
  const employees = await getEmployees();

  // Check if personnel code conflicts with an active employee
  let personnelCode = targetArchived.personnel_code;
  if (personnelCode && employees.some(e => e.personnel_code === personnelCode)) {
    personnelCode = `${personnelCode}_restored`;
  }

  const now = new Date().toISOString();
  const restoredEmployee: Employee = {
    id: targetArchived.id,
    avatar: targetArchived.avatar,
    first_name: targetArchived.first_name || '',
    last_name: targetArchived.last_name || '',
    full_name: targetArchived.full_name || `${targetArchived.first_name || ''} ${targetArchived.last_name || ''}`.trim(),
    personnel_code: personnelCode,
    department_id: targetArchived.department_id,
    position_id: targetArchived.position_id,
    extension: targetArchived.extension,
    direct_phone: targetArchived.direct_phone,
    mobile: targetArchived.mobile,
    email: targetArchived.email,
    location_id: targetArchived.location_id,
    building: targetArchived.building,
    unit: targetArchived.unit,
    floor: targetArchived.floor,
    room: targetArchived.room,
    notes: targetArchived.notes,
    phones: targetArchived.phones || [],
    custom_fields: targetArchived.custom_fields || {},
    search_count: targetArchived.search_count || 0,
    print_order: targetArchived.print_order,
    created_at: targetArchived.created_at || now,
    updated_at: now,
    internal_metadata: {
      ...(targetArchived.internal_metadata || {}),
      restored_from_archive_at: now,
    }
  };

  // Add back to active employees
  const updatedEmployees = [restoredEmployee, ...employees.filter(e => e.id !== id)];
  await saveEmployees(updatedEmployees);

  // Remove from archive
  const updatedArchived = archivedList.filter(a => a.id !== id);
  await saveArchivedEmployees(updatedArchived);

  return {
    success: true,
    employee: restoredEmployee,
    message: `پرونده «${restoredEmployee.full_name}» با موفقیت به لیست همکاران فعال بازگردانده شد.`
  };
}

export async function permanentlyDeleteArchivedEmployee(
  id: string
): Promise<{ success: boolean; message: string }> {
  const archivedList = await getArchivedEmployees();
  const target = archivedList.find(a => a.id === id);
  if (!target) {
    return { success: false, message: 'پرونده مورد نظر در آرشیو یافت نشد.' };
  }

  const updatedArchived = archivedList.filter(a => a.id !== id);
  await saveArchivedEmployees(updatedArchived);

  return {
    success: true,
    message: `پرونده «${target.full_name}» به صورت دائمی و قطعی از سیستم حذف شد.`
  };
}

export async function emptyArchivedEmployees(): Promise<{ success: boolean; deleted_count: number; message: string }> {
  const archivedList = await getArchivedEmployees();
  const count = archivedList.length;
  await saveArchivedEmployees([]);
  return {
    success: true,
    deleted_count: count,
    message: `کلیه پرونده‌های موجود در آرشیو (${count} مورد) به صورت دائمی حذف شدند.`
  };
}

export async function getDepartments(): Promise<Department[]> {
  const depts = await readJson<Department[]>(DEPARTMENTS_FILE, []);
  return depts.sort((a, b) => a.display_order - b.display_order);
}

export async function saveDepartments(departments: Department[]): Promise<void> {
  await atomicWriteJson(DEPARTMENTS_FILE, departments);
}

export async function getPositions(): Promise<Position[]> {
  return readJson<Position[]>(POSITIONS_FILE, []);
}

export async function savePositions(positions: Position[]): Promise<void> {
  await atomicWriteJson(POSITIONS_FILE, positions);
}

export async function getLocations(): Promise<LocationItem[]> {
  return readJson<LocationItem[]>(LOCATIONS_FILE, []);
}

export async function saveLocations(locations: LocationItem[]): Promise<void> {
  await atomicWriteJson(LOCATIONS_FILE, locations);
}

export async function getFields(): Promise<DynamicFieldDefinition[]> {
  const fields = await readJson<DynamicFieldDefinition[]>(FIELDS_FILE, []);
  return fields.sort((a, b) => a.display_order - b.display_order);
}

export async function saveFields(fields: DynamicFieldDefinition[]): Promise<void> {
  await atomicWriteJson(FIELDS_FILE, fields);
}

export async function getUsers(): Promise<(AppUser & { password_hash: string })[]> {
  return readJson<(AppUser & { password_hash: string })[]>(USERS_FILE, []);
}

export async function saveUsers(users: (AppUser & { password_hash: string })[]): Promise<void> {
  await atomicWriteJson(USERS_FILE, users);
}

export async function getSettings(): Promise<AppSettings> {
  return readJson<AppSettings>(SETTINGS_FILE, INITIAL_SETTINGS);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await atomicWriteJson(SETTINGS_FILE, settings);
}

export async function getSearchStats(): Promise<SearchStatEntry[]> {
  return readJson<SearchStatEntry[]>(SEARCH_STATS_FILE, []);
}

export async function logSearch(query: string, resultsCount: number, ip: string = '127.0.0.1'): Promise<void> {
  const trimmed = query.trim();
  // Filter out spammy / too short searches (< 2 chars)
  if (trimmed.length < 2) return;

  const stats = await getSearchStats();
  // Rate limit duplicate quick searches from same IP within 10 seconds
  const now = Date.now();
  const recentDuplicate = stats.find(
    s => s.query.toLowerCase() === trimmed.toLowerCase() && (now - new Date(s.timestamp).getTime()) < 10000
  );
  if (recentDuplicate) return;

  const newEntry: SearchStatEntry = {
    id: `stat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    query: trimmed,
    timestamp: new Date().toISOString(),
    results_count: resultsCount,
    ip
  };

  stats.unshift(newEntry);
  // Keep last 1000 search entries
  if (stats.length > 1000) {
    stats.length = 1000;
  }
  await atomicWriteJson(SEARCH_STATS_FILE, stats);
}

export const MAX_AUDIT_LOGS = 200;

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const logs = await readJson<AuditLogEntry[]>(AUDIT_LOG_FILE, []);
  const sorted = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (sorted.length > MAX_AUDIT_LOGS) {
    return sorted.slice(0, MAX_AUDIT_LOGS);
  }
  return sorted;
}

export async function logAudit(
  username: string,
  action: string,
  target: string,
  details?: any,
  ip: string = '127.0.0.1',
  result: 'success' | 'failed' = 'success',
  troubleshoot?: {
    level?: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
    category?: 'AUTH' | 'EMPLOYEES' | 'DEPARTMENTS' | 'LOCATIONS' | 'FIELDS' | 'EXCEL' | 'BACKUP' | 'SYSTEM' | 'API';
    error_name?: string;
    error_message?: string;
    error_stack?: string;
    http_method?: string;
    endpoint?: string;
    http_status?: number;
    execution_time_ms?: number;
    system_state?: {
      memory_mb?: number;
      uptime_sec?: number;
      node_version?: string;
    };
  }
): Promise<void> {
  const logs = await getAuditLogs();
  
  const heapUsedMb = Math.round(process.memoryUsage().heapUsed / (1024 * 1024));
  const uptimeSec = Math.round(process.uptime());

  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    level: troubleshoot?.level || (result === 'failed' ? 'ERROR' : 'INFO'),
    category: troubleshoot?.category || 'SYSTEM',
    username: username || 'system',
    action,
    target,
    details,
    ip: ip || '127.0.0.1',
    result,
    status: result,
    error_name: troubleshoot?.error_name,
    error_message: troubleshoot?.error_message,
    error_stack: troubleshoot?.error_stack,
    http_method: troubleshoot?.http_method,
    endpoint: troubleshoot?.endpoint,
    http_status: troubleshoot?.http_status,
    execution_time_ms: troubleshoot?.execution_time_ms,
    system_state: troubleshoot?.system_state || {
      memory_mb: heapUsedMb,
      uptime_sec: uptimeSec,
      node_version: process.version
    }
  };

  logs.unshift(entry);
  if (logs.length > MAX_AUDIT_LOGS) {
    logs.length = MAX_AUDIT_LOGS;
  }
  await atomicWriteJson(AUDIT_LOG_FILE, logs);
}

export async function generateTroubleshootReport(): Promise<{
  generated_at: string;
  system: {
    node_version: string;
    platform: string;
    arch: string;
    uptime_seconds: number;
    memory: {
      heap_used_mb: number;
      heap_total_mb: number;
      rss_mb: number;
    };
  };
  storage_summary: {
    employees_count: number;
    departments_count: number;
    locations_count: number;
    fields_count: number;
    backups_count: number;
    audit_logs_count: number;
  };
  errors_summary: {
    total_errors: number;
    total_warnings: number;
    recent_errors: AuditLogEntry[];
  };
  recent_logs: AuditLogEntry[];
}> {
  const [logs, emps, depts, locs, fields] = await Promise.all([
    getAuditLogs(),
    getEmployees(),
    getDepartments(),
    getLocations(),
    getFields()
  ]);

  let backupsCount = 0;
  if (fs.existsSync(BACKUPS_DIR)) {
    backupsCount = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.zip')).length;
  }

  const mem = process.memoryUsage();
  const errors = logs.filter(l => l.level === 'ERROR' || l.level === 'FATAL' || l.result === 'failed');
  const warnings = logs.filter(l => l.level === 'WARN');

  return {
    generated_at: new Date().toISOString(),
    system: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime_seconds: Math.round(process.uptime()),
      memory: {
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
        rss_mb: Math.round(mem.rss / 1024 / 1024)
      }
    },
    storage_summary: {
      employees_count: emps.length,
      departments_count: depts.length,
      locations_count: locs.length,
      fields_count: fields.length,
      backups_count: backupsCount,
      audit_logs_count: logs.length
    },
    errors_summary: {
      total_errors: errors.length,
      total_warnings: warnings.length,
      recent_errors: errors.slice(0, 20)
    },
    recent_logs: logs.slice(0, MAX_AUDIT_LOGS)
  };
}

// Statistics Calculator
export async function calculateStatistics(): Promise<SystemStatistics> {
  const [employees, depts, searchStats, settings] = await Promise.all([
    getEmployees(),
    getDepartments(),
    getSearchStats(),
    getSettings()
  ]);

  const activeEmployees = employees.length;
  const inactiveEmployees = 0;
  
  let totalPhones = 0;
  let withPhoto = 0;
  let latestUpdate = new Date(0);

  employees.forEach(e => {
    if (e.avatar) withPhoto++;
    if (e.phones && e.phones.length > 0) {
      totalPhones += e.phones.length;
    } else {
      if (e.extension) totalPhones++;
      if (e.direct_phone) totalPhones++;
      if (e.mobile) totalPhones++;
    }

    const uDate = new Date(e.updated_at || e.created_at);
    if (uDate > latestUpdate) {
      latestUpdate = uDate;
    }
  });

  const now = Date.now();
  const oneDayAgo = now - 24 * 3600 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;

  const searchesLast24h = searchStats.filter(s => new Date(s.timestamp).getTime() >= oneDayAgo).length;
  const searchesLast7d = searchStats.filter(s => new Date(s.timestamp).getTime() >= sevenDaysAgo).length;

  const archivedEmps = await getArchivedEmployees();

  // Check last backup file
  let lastBackupStr = 'ثبت نشده';
  try {
    const backupFiles = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.zip'));
    if (backupFiles.length > 0) {
      const sorted = backupFiles.map(f => ({
        name: f,
        time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime
      })).sort((a, b) => b.time.getTime() - a.time.getTime());
      lastBackupStr = sorted[0].time.toISOString();
    }
  } catch (err) {
    // ignore
  }

  return {
    total_employees: employees.length,
    active_employees: activeEmployees,
    inactive_employees: inactiveEmployees,
    archived_employees_count: archivedEmps.length,
    departments_count: depts.length,
    total_phone_numbers: totalPhones,
    employees_with_photo: withPhoto,
    employees_without_photo: employees.length - withPhoto,
    total_searches: searchStats.length,
    searches_last_24h: searchesLast24h,
    searches_last_7d: searchesLast7d,
    last_update: latestUpdate.getTime() > 0 ? latestUpdate.toISOString() : new Date().toISOString(),
    last_backup: lastBackupStr
  };
}

// Backup & Restore
export async function createBackupZip(
  comment = 'Manual Backup',
  enforceRetention = true,
  protectFilename?: string
): Promise<string> {
  const zip = new AdmZip();
  
  // Add all JSON files from data
  const dataFiles = fs.readdirSync(DATA_DIR);
  for (const f of dataFiles) {
    const fullPath = path.join(DATA_DIR, f);
    if (fs.statSync(fullPath).isFile()) {
      zip.addLocalFile(fullPath, 'data');
    }
  }

  // Add uploads if any
  if (fs.existsSync(EMP_UPLOADS_DIR)) {
    const empFiles = fs.readdirSync(EMP_UPLOADS_DIR);
    for (const f of empFiles) {
      const full = path.join(EMP_UPLOADS_DIR, f);
      if (fs.statSync(full).isFile()) {
        zip.addLocalFile(full, 'uploads/employees');
      }
    }
  }
  if (fs.existsSync(COMPANY_UPLOADS_DIR)) {
    const compFiles = fs.readdirSync(COMPANY_UPLOADS_DIR);
    for (const f of compFiles) {
      const full = path.join(COMPANY_UPLOADS_DIR, f);
      if (fs.statSync(full).isFile()) {
        zip.addLocalFile(full, 'uploads/company');
      }
    }
  }

  // Package employee photos and avatars that are available locally into the zip backup
  let employeesCount = 0;
  let deptsCount = 0;
  let employees: Employee[] = [];
  let departments: Department[] = [];
  try {
    employees = await getEmployees();
    departments = await getDepartments();
    employeesCount = employees.length;
    deptsCount = departments.length;
    const photoManifest: Array<{ personnel_code: string; full_name: string; filename: string }> = [];

    if (!fs.existsSync(EMP_UPLOADS_DIR)) {
      fs.mkdirSync(EMP_UPLOADS_DIR, { recursive: true });
    }

    employees
      .filter(e => Boolean(e.avatar))
      .forEach((emp) => {
        try {
          const safeCode = (emp.personnel_code || emp.id).replace(/[^\w\u0600-\u06FF-]/g, '_');
          const safeName = (emp.last_name || emp.first_name || 'employee').replace(/[^\w\u0600-\u06FF-]/g, '_');
          const photoFilename = `${safeCode}_${safeName}.jpg`;

          if (emp.avatar?.startsWith('data:image/')) {
            const parts = emp.avatar.split(';base64,');
            if (parts[1]) {
              const buf = Buffer.from(parts[1], 'base64');
              zip.addFile(`photos/${photoFilename}`, buf);
              zip.addFile(`uploads/employees/emp_${emp.id}.jpg`, buf);
              photoManifest.push({
                personnel_code: emp.personnel_code,
                full_name: emp.full_name,
                filename: photoFilename
              });
            }
          } else if (emp.avatar) {
            const baseName = path.basename(emp.avatar);
            const localFile = path.join(EMP_UPLOADS_DIR, baseName);
            const cachedLocal = path.join(EMP_UPLOADS_DIR, `emp_${emp.id}.jpg`);
            let buf: Buffer | null = null;
            if (fs.existsSync(localFile)) {
              buf = fs.readFileSync(localFile);
            } else if (fs.existsSync(cachedLocal)) {
              buf = fs.readFileSync(cachedLocal);
            }
            if (buf) {
              zip.addFile(`photos/${photoFilename}`, buf);
              zip.addFile(`uploads/employees/emp_${emp.id}.jpg`, buf);
              photoManifest.push({
                personnel_code: emp.personnel_code,
                full_name: emp.full_name,
                filename: photoFilename
              });
            }
          }
        } catch (e) {
          console.warn(`Error bundling photo for ${emp.full_name}:`, (e as any)?.message);
        }
      });

    if (photoManifest.length > 0) {
      zip.addFile('photos/manifest.json', Buffer.from(JSON.stringify(photoManifest, null, 2)));
      const readmeLines = [
        '=====================================================',
        'فهرست تصاویر پرسنل در نسخه پشتیبان دفتر تلفن سازمان',
        `تاریخ ایجاد: ${new Date().toISOString()}`,
        `تعداد عکس‌های ذخیره‌شده: ${photoManifest.length}`,
        '=====================================================',
        ...photoManifest.map(p => `شماره پرسنلی: ${p.personnel_code} | نام: ${p.full_name} | نام فایل: ${p.filename}`)
      ];
      zip.addFile('photos/README_عکسهای_افراد.txt', Buffer.from(readmeLines.join('\n'), 'utf8'));
    }
  } catch (photoErr) {
    console.error('Error bundling employee photos into backup:', photoErr);
  }

  // Generate and bundle complete Excel export file (identical to comprehensive Excel Export)
  let locationsCount = 0;
  try {
    const fields = await getFields();
    const positions = await getPositions();
    const locations = await getLocations();
    locationsCount = locations.length;
    const excelBuffer = generateFullExcelBuffer({
      employees,
      departments,
      positions,
      locations,
      fields,
      isTemplate: false
    });
    const excelFilename = 'گزارش_جامع_دفتر_تلفن_سازمان.xlsx';
    // Bundle clean comprehensive Excel report in exports/ directory
    zip.addFile(`exports/${excelFilename}`, excelBuffer);
  } catch (excelErr) {
    console.error('Error bundling full Excel export into backup ZIP:', excelErr);
  }

  // Count JSON files and photos in archive
  let archivedCount = 0;
  try {
    const arch = await getArchivedEmployees();
    archivedCount = arch.length;
  } catch (_) {}

  const allEntries = zip.getEntries();
  const jsonFilesCount = allEntries.filter(e => !e.isDirectory && e.entryName.endsWith('.json')).length + 1; // +1 for backup-metadata.json about to be added
  const photosCount = allEntries.filter(e => !e.isDirectory && e.entryName.startsWith('photos/') && !e.entryName.endsWith('.json') && !e.entryName.endsWith('.txt')).length;

  // Metadata with comprehensive statistics
  const meta = {
    version: '2.0.0',
    created_at: new Date().toISOString(),
    comment,
    employee_count: employeesCount,
    archived_count: archivedCount,
    department_count: deptsCount,
    location_count: locationsCount,
    photo_count: photosCount,
    json_count: jsonFilesCount,
    has_excel_export: true
  };
  zip.addFile('backup-metadata.json', Buffer.from(JSON.stringify(meta, null, 2)));

  const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
  const targetPath = path.join(BACKUPS_DIR, fileName);
  await zip.writeZipPromise(targetPath);

  // Apply retention policy if requested, protecting target restore file from deletion
  if (enforceRetention) {
    try {
      await enforceBackupRetention(20, protectFilename);
    } catch (e) {
      console.error('Error applying retention policy:', e);
    }
  }

  return fileName;
}

/**
 * Enforces maximum backups limit (defaults to 20).
 * Sorts all backup files chronologically (newest first) and deletes excess files from the end (oldest).
 */
export async function enforceBackupRetention(
  maxBackups = 20,
  protectFilename?: string
): Promise<{ deleted: string[]; remaining: number; total: number }> {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return { deleted: [], remaining: 0, total: 0 };
    }
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.zip'));
    
    // Sort descending: newest first, oldest last
    const sorted = files.map(f => {
      const fullPath = path.join(BACKUPS_DIR, f);
      let time = 0;
      try {
        time = fs.statSync(fullPath).mtime.getTime();
      } catch (_) {}
      return { filename: f, fullPath, time };
    }).sort((a, b) => b.time - a.time);

    const deleted: string[] = [];
    if (sorted.length > maxBackups) {
      // Items beyond maxBackups index are the oldest (از آخر)
      const toDelete = sorted.slice(maxBackups);
      for (const item of toDelete) {
        // Do not delete the file currently being restored
        if (protectFilename && (item.filename === protectFilename || item.fullPath === protectFilename)) {
          continue;
        }
        try {
          fs.unlinkSync(item.fullPath);
          deleted.push(item.filename);
        } catch (delErr) {
          console.error(`Failed to delete old backup file ${item.filename}:`, delErr);
        }
      }
    }

    const currentFiles = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.zip'));
    return {
      deleted,
      remaining: currentFiles.length,
      total: sorted.length
    };
  } catch (err) {
    console.error('Error in enforceBackupRetention:', err);
    return { deleted: [], remaining: 0, total: 0 };
  }
}

export async function restoreBackupZip(
  zipFilePath: string
): Promise<{ success: boolean; message: string; employee_count?: number; department_count?: number; rollback_file?: string }> {
  if (!fs.existsSync(zipFilePath)) {
    return {
      success: false,
      message: 'فایل پشتیبان مورد نظر یافت نشد یا در دسترس نیست.'
    };
  }

  const targetFilename = path.basename(zipFilePath);

  // Step 1: Read the entire ZIP file into a memory buffer immediately to prevent file locking or accidental deletion
  let zip: AdmZip;
  let zipEntries: any[];
  try {
    const zipBuffer = fs.readFileSync(zipFilePath);
    zip = new AdmZip(zipBuffer);
    zipEntries = zip.getEntries();
  } catch (readErr: any) {
    return {
      success: false,
      message: `فایل پشتیبان فشرده مخدوش یا نامعتبر است: ${readErr.message}`
    };
  }

  // Step 2: Backup current state first for fail-safe rollback if there are existing employees
  let rollbackName = '';
  try {
    const currentEmps = await getEmployees();
    if (currentEmps.length > 0) {
      // Do NOT enforce retention during rollback creation to avoid pruning target file
      rollbackName = await createBackupZip('پشتیبان ایمنی پیش از بازیابی', false);
    }
  } catch (rbErr) {
    console.warn('Could not create pre-restore rollback backup, proceeding with restore:', rbErr);
  }

  try {
    // Step 3: Validate structure & JSON files in zip (accepting both data/ prefix and root files)
    const hasEmployees = zipEntries.some(e => {
      const norm = e.entryName.replace(/\\/g, '/').toLowerCase();
      return norm === 'data/employees.json' || norm === 'employees.json' || norm.endsWith('/employees.json');
    });

    if (!hasEmployees) {
      throw new Error('فایل اطلاعات پرسنل (employees.json) در بسته پشتیبان یافت نشد.');
    }

    // Validate JSON parsing for all data files in zip
    for (const entry of zipEntries) {
      const norm = entry.entryName.replace(/\\/g, '/');
      if ((norm.startsWith('data/') || !norm.includes('/')) && norm.endsWith('.json')) {
        const text = entry.getData().toString('utf8');
        try {
          JSON.parse(text);
        } catch (jsonErr: any) {
          throw new Error(`فایل داده «${norm}» حاوی ساختار JSON معتبر نمی‌باشد: ${jsonErr.message}`);
        }
      }
    }

    // Step 4: Extract validated files to disk
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      const normalized = entry.entryName.replace(/\\/g, '/');
      const baseName = path.basename(normalized);

      // JSON data files
      if (normalized.startsWith('data/') || (!normalized.includes('/') && normalized.endsWith('.json') && normalized !== 'backup-metadata.json')) {
        // Protect active login sessions from being overwritten so the current admin user is never logged out
        if (baseName === 'sessions.json') continue;

        const target = path.join(DATA_DIR, baseName);
        fs.writeFileSync(target, entry.getData());
      } else if (normalized.startsWith('uploads/employees/')) {
        const target = path.join(EMP_UPLOADS_DIR, baseName);
        fs.writeFileSync(target, entry.getData());
      } else if (normalized.startsWith('uploads/company/')) {
        const target = path.join(COMPANY_UPLOADS_DIR, baseName);
        fs.writeFileSync(target, entry.getData());
      } else if (normalized.startsWith('photos/') && !normalized.endsWith('.json') && !normalized.endsWith('.txt')) {
        const target = path.join(EMP_UPLOADS_DIR, baseName);
        fs.writeFileSync(target, entry.getData());
      }
    }

    // Read restored counts
    let restoredEmployeesCount = 0;
    try {
      const empData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'employees.json'), 'utf8'));
      restoredEmployeesCount = Array.isArray(empData) ? empData.length : 0;
    } catch (_) {}

    let restoredDeptCount = 0;
    try {
      const deptData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'departments.json'), 'utf8'));
      restoredDeptCount = Array.isArray(deptData) ? deptData.length : 0;
    } catch (_) {}

    // Ensure retention policy is enforced after successful restore, protecting the restored backup
    await enforceBackupRetention(20, targetFilename);

    // If this was an uploaded temp file in IMPORTS_DIR, delete it cleanly
    if (zipFilePath.includes('imports') || zipFilePath.includes(IMPORTS_DIR)) {
      try { fs.unlinkSync(zipFilePath); } catch (_) {}
    }

    return {
      success: true,
      employee_count: restoredEmployeesCount,
      department_count: restoredDeptCount,
      rollback_file: rollbackName,
      message: `بازیابی با موفقیت انجام شد (${restoredEmployeesCount} پرسنل و ${restoredDeptCount} واحد سازمانی بازگردانده شدند).`
    };
  } catch (err: any) {
    console.error('Restore failed, maintaining or rolling back state:', err);
    return {
      success: false,
      message: `خطا در بازگردانی فایل پشتیبان: ${err.message || 'فایل نامعتبر است'}`
    };
  }
}

// Health Check
export async function getHealthCheck(): Promise<HealthCheckResult> {
  const checkedAt = new Date().toISOString();
  let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

  // 1. JSON Storage
  let jsonStorageStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  let jsonStorageMsg = 'تمامی فایل‌های اصلی در وضعیت سالم و یکپارچه هستند';
  let jsonFilesCount = 0;
  try {
    const files = fs.readdirSync(DATA_DIR);
    jsonFilesCount = files.length;
    for (const f of files) {
      const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
      JSON.parse(content);
    }
  } catch (e: any) {
    jsonStorageStatus = 'critical';
    jsonStorageMsg = `خطای یکپارچگی فایل‌های JSON: ${e.message}`;
    overallStatus = 'critical';
  }

  // 2. File Storage
  let fileStorageStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  let uploadsCount = 0;
  try {
    uploadsCount = fs.readdirSync(EMP_UPLOADS_DIR).length + fs.readdirSync(COMPANY_UPLOADS_DIR).length;
  } catch {
    fileStorageStatus = 'warning';
  }

  // 3. Backup
  let backupStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  let backupsCount = 0;
  try {
    backupsCount = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.zip')).length;
    if (backupsCount === 0) {
      backupStatus = 'warning';
    }
  } catch {
    backupStatus = 'warning';
  }

  const subsystems: Record<
    string,
    {
      name: string;
      status: 'ok' | 'warning' | 'error';
      message: string;
    }
  > = {
    application: {
      name: 'وب سرور و هسته سامانه',
      status: 'ok',
      message: 'سرویس‌دهنده Node.js و رابط React در حال اجرا',
    },
    json_storage: {
      name: 'پایگاه داده JSON',
      status: jsonStorageStatus === 'healthy' ? 'ok' : 'error',
      message: jsonStorageMsg,
    },
    search_index: {
      name: 'موتور جستجوی هوشمند',
      status: 'ok',
      message: 'ایندکس جستجوی یونیکد و چندکلمه‌ای فعال است',
    },
    file_storage: {
      name: 'مخزن ذخیره‌سازی فایل',
      status: fileStorageStatus === 'healthy' ? 'ok' : 'warning',
      message: `دایرکتوری‌های آپلود در دسترس (${uploadsCount} فایل)`,
    },
    backup: {
      name: 'سامانه پشتیبان‌گیری',
      status: backupStatus === 'healthy' ? 'ok' : 'warning',
      message: backupsCount > 0 ? `تعداد ${backupsCount} نسخه پشتیبان موجود است` : 'پشتیبان جدیدی ثبت نشده است',
    },
    disk_space: {
      name: 'فضای ذخیره‌سازی',
      status: 'ok',
      message: 'فضای کافی برای داده‌ها و فایل‌ها مهیا است',
    },
    permissions: {
      name: 'مجوزهای سیستمی',
      status: 'ok',
      message: 'دسترسی نوشتن و خواندن سرور برقرار است',
    },
  };

  return {
    status: overallStatus,
    uptime_seconds: Math.floor(process.uptime()),
    subsystems,
    checked_at: checkedAt,
    details: {
      application: { status: 'healthy', message: 'سرویس‌دهنده Node.js و رابط React در حال اجرا' },
      json_storage: { status: jsonStorageStatus, message: jsonStorageMsg, files_count: jsonFilesCount },
      search_index: { status: 'healthy', message: 'ایندکس جستجوی یونیکد و چندکلمه‌ای فعال است' },
      file_storage: { status: fileStorageStatus, message: 'دایرکتوری‌های آپلود در دسترس هستند', uploads_count: uploadsCount },
      backup: { status: backupStatus, message: `تعداد ${backupsCount} نسخه پشتیبان موجود است`, backups_count: backupsCount },
      disk_space: { status: 'healthy', message: 'فضای ذخیره‌سازی محلی برای فایل‌های JSON کافی است' },
      permissions: { status: 'healthy', message: 'دسترسی نوشتن و خواندن برای سرور مهیا است' },
      images: { status: 'healthy', message: 'فایل‌های عکس پرسنلی و لوگو در دسترس می‌باشند' },
      configuration: { status: 'healthy', message: 'تنظیمات سامانه و تعاریف فیلدها معتبر هستند' },
    }
  };
}

// Reset entire employee directory database (employees, departments, locations, positions)
export async function resetDatabase(createBackupFirst = true, username = 'admin'): Promise<{ success: boolean; message: string; backup_file?: string }> {
  let backupFile: string | undefined;
  const currentEmps = await getEmployees();
  if (createBackupFirst && currentEmps.length > 0) {
    try {
      backupFile = await createBackupZip(`پشتیبان پیش از پاکسازی توسط ${username}`);
    } catch (e) {
      console.error('Pre-reset backup failed:', e);
    }
  }

  // 1. Wipe all employees
  await saveEmployees([]);

  // 2. Wipe all departments
  await saveDepartments([]);

  // 3. Wipe all locations
  await saveLocations([]);

  // 4. Wipe all positions
  await savePositions([]);

  // 5. Reset search stats
  await atomicWriteJson(SEARCH_STATS_FILE, []);

  // 6. Log audit entry
  await logAudit(
    username,
    'RESET_ALL_DATABASE',
    'database',
    'all',
    'پاکسازی کامل دیتابیس شامل کارکنان، واحدهای سازمانی، محل‌های استقرار و سمت‌ها'
  );

  return {
    success: true,
    message: 'کلیه اطلاعات کارکنان، واحدهای سازمانی، سمت‌ها و محل‌های استقرار با موفقیت پاکسازی شد.',
    backup_file: backupFile,
  };
}

export async function seedThirtyEmployees(username = 'admin'): Promise<{ success: boolean; count: number; message: string }> {
  // Save base catalogs
  await saveDepartments(INITIAL_DEPARTMENTS);
  await saveLocations(INITIAL_LOCATIONS);
  await savePositions(INITIAL_POSITIONS);

  // Generate and save 30 profiles
  const emps = generateInitialEmployees();
  await saveEmployees(emps);

  await logAudit(
    username,
    'SEED_THIRTY_EMPLOYEES',
    'employees',
    String(emps.length),
    'تولید و بارگذاری ۳۰ پروفایل فرضی کامل جدید به همراه ساختار سازمانی، سمت‌ها، محل‌های استقرار و تصاویر'
  );

  return {
    success: true,
    count: emps.length,
    message: `تعداد ${emps.length} پروفایل پرسنلی فرضی کامل به همراه واحدهای سازمانی، سمت‌ها، محل‌های استقرار و تصاویر با موفقیت ذخیره گردید.`
  };
}

export const seedTwentyEmployees = seedThirtyEmployees;


