export type FieldType =
  | 'text'
  | 'longtext'
  | 'number'
  | 'phone'
  | 'mobile'
  | 'email'
  | 'url'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'department'
  | 'position'
  | 'location'
  | 'image';

export interface DynamicFieldDefinition {
  id: string;
  internal_name: string;
  persian_label: string;
  type: FieldType;
  placeholder?: string;
  default_value?: string | number | boolean | null;
  required: boolean;
  searchable: boolean;
  filterable: boolean;
  visible: boolean;
  importable: boolean;
  exportable: boolean;
  display_order: number;
  active: boolean;
  is_system?: boolean;
  options?: string[]; // For select / multiselect
  help_text?: string;
}

export interface PhoneNumber {
  id: string;
  type: 'extension' | 'office' | 'mobile' | 'fax' | 'home' | 'other';
  label: string;
  number: string;
  description?: string;
  primary: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  display_order: number;
  active: boolean;
  manager_id?: string;
  manager_name?: string;
  phone_prefix?: string;
  description?: string;
}

export interface Position {
  id: string;
  title: string;
  code?: string;
  level?: string;
  active: boolean;
}

export interface LocationItem {
  id: string;
  name: string;
  building: string;
  unit?: string;
  floor?: string;
  room?: string;
  display_order?: number;
  active: boolean;
}

export interface Employee {
  id: string;
  avatar?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  personnel_code: string;
  department_id: string;
  position_id: string;
  extension?: string;
  direct_phone?: string;
  mobile?: string;
  email?: string;
  location_id?: string;
  building?: string;
  unit?: string;
  floor?: string;
  room?: string;
  notes?: string;
  phones?: PhoneNumber[];
  custom_fields?: Record<string, any>;
  search_count: number;
  print_order?: number; // اولویت و رتبه نمایش و چاپ درون واحد سازمانی
  created_at: string;
  updated_at: string;
  internal_metadata?: Record<string, any>;
}

export interface ArchivedEmployee extends Employee {
  archived_at: string;
  archived_by?: string;
  archive_reason?: string;
  original_department_name?: string;
  original_position_title?: string;
}

export interface AppUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: 'admin' | 'editor' | 'viewer';
  password_hash?: string;
  created_at: string;
  last_login?: string;
  active: boolean;
}

export interface AppSettings {
  organization_name: string;
  sub_title?: string;
  subtitle?: string;
  logo_url: string | null;
  default_avatar?: string | null;
  timezone: string;
  default_sort_field: string;
  default_sort_order: 'asc' | 'desc';
  retention_days: number;
  theme: 'light' | 'dark' | 'system';
  contact_info?: string;
  intranet_banner?: string;
  session_timeout_minutes?: number;
  search_debounce_ms?: number;
  // Automatic Scheduled Backup
  auto_backup_enabled?: boolean;
  auto_backup_frequency?: 'weekly' | 'daily' | 'monthly';
  auto_backup_day_of_week?: number; // 0: یکشنبه, 1: دوشنبه, 2: سه‌شنبه, 3: چهارشنبه, 4: پنج‌شنبه, 5: جمعه, 6: شنبه
  auto_backup_time?: string; // e.g. "02:00"
  last_auto_backup?: string; // ISO string of last automated backup
}

export interface SystemStatistics {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  archived_employees_count?: number;
  departments_count: number;
  total_phone_numbers: number;
  employees_with_photo: number;
  employees_without_photo: number;
  total_searches: number;
  searches_last_24h: number;
  searches_last_7d: number;
  last_update: string;
  last_backup: string;
}

export interface SearchStatEntry {
  id: string;
  query: string;
  timestamp: string;
  results_count: number;
  ip?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level?: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  category?: 'AUTH' | 'EMPLOYEES' | 'DEPARTMENTS' | 'LOCATIONS' | 'FIELDS' | 'EXCEL' | 'BACKUP' | 'SYSTEM' | 'API';
  username: string;
  action: string;
  target?: string;
  details?: any;
  ip: string;
  status?: 'success' | 'failed' | string;
  result?: 'success' | 'failed';
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

export interface SystemHealth {
  status: 'ok' | 'degraded' | 'error' | string;
  uptime_seconds: number;
  subsystems: Record<
    string,
    {
      name: string;
      status: 'ok' | 'warning' | 'error';
      message: string;
    }
  >;
}

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical' | 'ok' | 'degraded' | 'error' | string;
  uptime_seconds?: number;
  subsystems?: Record<
    string,
    {
      name: string;
      status: 'ok' | 'warning' | 'error';
      message: string;
    }
  >;
  details?: {
    application?: { status: 'healthy' | 'warning' | 'critical'; message: string };
    json_storage?: { status: 'healthy' | 'warning' | 'critical'; message: string; files_count: number };
    search_index?: { status: 'healthy' | 'warning' | 'critical'; message: string };
    file_storage?: { status: 'healthy' | 'warning' | 'critical'; message: string; uploads_count: number };
    backup?: { status: 'healthy' | 'warning' | 'critical'; message: string; backups_count: number };
    disk_space?: { status: 'healthy' | 'warning' | 'critical'; message: string };
    permissions?: { status: 'healthy' | 'warning' | 'critical'; message: string };
    images?: { status: 'healthy' | 'warning' | 'critical'; message: string };
    configuration?: { status: 'healthy' | 'warning' | 'critical'; message: string };
  };
  checked_at?: string;
}
