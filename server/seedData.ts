import { Department, DynamicFieldDefinition, Position, LocationItem, Employee, AppSettings, AppUser, PhoneNumber } from '../src/types.ts';
import bcrypt from 'bcryptjs';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'مدیریت عامل و حوزه ریاست', code: '100', display_order: 1, active: true, phone_prefix: '10', manager_name: 'دکتر علیرضا رستگار', description: 'هدایت راهبردی، امور حاکمیتی و سیاست‌گذاری کلان سازمان' },
  { id: 'dept-2', name: 'فناوری اطلاعات و ارتباطات (فاوا)', code: '200', display_order: 2, active: true, phone_prefix: '20', manager_name: 'مهندس وحید کاظمی', description: 'زیرساخت شبکه، سامانه‌های نرم‌افزاری، امنیت داده و هلپ‌دسک' },
  { id: 'dept-3', name: 'منابع انسانی و امور اداری', code: '300', display_order: 3, active: true, phone_prefix: '30', manager_name: 'خانم مریم سعیدی', description: 'مدیریت سرمایه انسانی، جذب، آموزش، رفاه و خدمات اداری' },
  { id: 'dept-4', name: 'مالی، بودجه و حسابداری', code: '400', display_order: 4, active: true, phone_prefix: '40', manager_name: 'آقای بهروز کریمی', description: 'بودجه و اعتبارات، خزانه‌داری، حسابداری مالی و امور مالیاتی' },
  { id: 'dept-5', name: 'بازرگانی، فروش و قراردادها', code: '500', display_order: 5, active: true, phone_prefix: '50', manager_name: 'آقای مسعود شایگان', description: 'توسعه بازار، فروش سازمانی، مدیریت مشتریان و امور حقوقی' },
  { id: 'dept-6', name: 'تحقیق، توسعه و نوآوری', code: '600', display_order: 6, active: true, phone_prefix: '60', manager_name: 'دکتر احسان میرزایی', description: 'پژوهش‌های فناورانه، طراحی سامانه‌های هوشمند و هوش مصنوعی' },
  { id: 'dept-7', name: 'روابط عمومی و امور بین‌الملل', code: '700', display_order: 7, active: true, phone_prefix: '70', manager_name: 'خانم نگار سهرابی', description: 'ارتباطات رسانه‌ای، پورتال سازمانی، تشریفات و همایش‌ها' },
  { id: 'dept-8', name: 'حراست، حفاظت فیزیکی و بازرسی', code: '800', display_order: 8, active: true, phone_prefix: '80', manager_name: 'آقای جلال نوری', description: 'امنیت اماکن، کنترل تردد، مانیتورینگ و بازرسی عمومی' },
  { id: 'dept-9', name: 'برنامه‌ریزی و تعالی سازمانی', code: '900', display_order: 9, active: true, phone_prefix: '90', manager_name: 'مهندس کیانوش راد', description: 'مدیریت فرآیندها، کنترل پروژه‌ها، استانداردها و استقرار ایزو' },
  { id: 'dept-10', name: 'پشتیبانی، ترابری و خدمات رفاهی', code: '1000', display_order: 10, active: true, phone_prefix: '95', manager_name: 'آقای حسن دادرس', description: 'تدارکات عمومی، امور انبارها، ترابری سازمانی و نگهداری ابنیه' },
];

export const INITIAL_POSITIONS: Position[] = [
  { id: 'pos-1', title: 'مدیرعامل', active: true },
  { id: 'pos-2', title: 'قائم‌مقام مدیرعامل', active: true },
  { id: 'pos-3', title: 'مدیر واحد', active: true },
  { id: 'pos-4', title: 'رئیس اداره', active: true },
  { id: 'pos-5', title: 'سرپرست تیم', active: true },
  { id: 'pos-6', title: 'کارشناس ارشد', active: true },
  { id: 'pos-7', title: 'کارشناس', active: true },
  { id: 'pos-8', title: 'کاردان فنی', active: true },
  { id: 'pos-9', title: 'مسئول دفتر', active: true },
  { id: 'pos-10', title: 'مشاور عالی', active: true },
  { id: 'pos-11', title: 'کارشناس حقوقی و قراردادها', active: true },
  { id: 'pos-12', title: 'سرپرست بایگانی و دبیرخانه', active: true },
  { id: 'pos-13', title: 'کارشناس هوش مصنوعی و داده', active: true },
  { id: 'pos-14', title: 'کارشناس روابط عمومی و رسانه', active: true },
  { id: 'pos-15', title: 'سرپرست کنترل تردد و حراست', active: true },
];

export const INITIAL_LOCATIONS: LocationItem[] = [
  { id: 'loc-1', name: 'ساختمان مرکزی - طبقه ۵ (دفتر ریاست)', building: 'ساختمان مرکزی', display_order: 1, unit: '501', floor: '۵', room: '12', active: true },
  { id: 'loc-2', name: 'ساختمان فناوری و نوآوری - طبقه ۳', building: 'ساختمان فناوری', display_order: 2, unit: '302', floor: '۳', room: '08', active: true },
  { id: 'loc-3', name: 'ساختمان مرکزی - طبقه ۲ (اداری و مالی)', building: 'ساختمان مرکزی', display_order: 3, unit: '201', floor: '۲', room: '15', active: true },
  { id: 'loc-4', name: 'برج بازرگانی و فروش - طبقه ۴', building: 'برج بازرگانی', display_order: 4, unit: '401', floor: '۴', room: '21', active: true },
  { id: 'loc-5', name: 'پردیس پژوهش و توسعه', building: 'پردیس فناوری', display_order: 5, unit: '105', floor: '۱', room: '04', active: true },
  { id: 'loc-6', name: 'مجتمع خدمات و پشتیبانی - طبقه ۱', building: 'مجتمع خدمات', display_order: 6, unit: '101', floor: '۱', room: '02', active: true },
];

export const INITIAL_FIELDS: DynamicFieldDefinition[] = [
  { id: 'f-avatar', internal_name: 'avatar', persian_label: 'عکس', type: 'image', required: false, searchable: false, filterable: false, visible: true, importable: true, exportable: true, display_order: 1, active: true },
  { id: 'f-first-name', internal_name: 'first_name', persian_label: 'نام', type: 'text', placeholder: 'مثال: علی', required: true, searchable: true, filterable: false, visible: false, importable: true, exportable: true, display_order: 2, active: true },
  { id: 'f-last-name', internal_name: 'last_name', persian_label: 'نام خانوادگی', type: 'text', placeholder: 'مثال: محمدی', required: true, searchable: true, filterable: false, visible: false, importable: true, exportable: true, display_order: 3, active: true },
  { id: 'f-full-name', internal_name: 'full_name', persian_label: 'نام و نام خانوادگی', type: 'text', placeholder: 'نام کامل', required: true, searchable: true, filterable: false, visible: true, importable: true, exportable: true, display_order: 4, active: true },
  { id: 'f-personnel-code', internal_name: 'personnel_code', persian_label: 'شماره پرسنلی', type: 'text', placeholder: 'مثال: 1042', required: true, searchable: true, filterable: false, visible: true, importable: true, exportable: true, display_order: 5, active: true },
  { id: 'f-dept', internal_name: 'department_id', persian_label: 'واحد سازمانی', type: 'department', required: true, searchable: true, filterable: true, visible: true, importable: true, exportable: true, display_order: 6, active: true },
  { id: 'f-pos', internal_name: 'position_id', persian_label: 'سمت سازمانی', type: 'position', required: true, searchable: true, filterable: true, visible: true, importable: true, exportable: true, display_order: 7, active: true },
  { id: 'f-ext', internal_name: 'extension', persian_label: 'شماره داخلی', type: 'phone', placeholder: 'مثال: 104', required: false, searchable: true, filterable: false, visible: true, importable: true, exportable: true, display_order: 8, active: true },
  { id: 'f-direct', internal_name: 'direct_phone', persian_label: 'تلفن محل کار', type: 'phone', placeholder: 'مثال: 021-88990011', required: false, searchable: true, filterable: false, visible: true, importable: true, exportable: true, display_order: 9, active: true },
  { id: 'f-mobile', internal_name: 'mobile', persian_label: 'تلفن همراه', type: 'mobile', placeholder: 'مثال: 09121234567', required: false, searchable: true, filterable: false, visible: true, importable: true, exportable: true, display_order: 10, active: true },
  { id: 'f-email', internal_name: 'email', persian_label: 'ایمیل سازمانی', type: 'email', placeholder: 'مثال: user@org.ir', required: false, searchable: true, filterable: false, visible: true, importable: true, exportable: true, display_order: 11, active: true },
  { id: 'f-loc', internal_name: 'location_id', persian_label: 'محل استقرار', type: 'location', required: false, searchable: true, filterable: true, visible: true, importable: true, exportable: true, display_order: 12, active: true },
  { id: 'f-unit', internal_name: 'unit', persian_label: 'واحد', type: 'text', placeholder: 'مثال: ۵۰۱', required: false, searchable: true, filterable: false, visible: true, importable: true, exportable: true, display_order: 13, active: true },
  { id: 'f-room', internal_name: 'room', persian_label: 'اتاق', type: 'text', placeholder: 'مثال: ۱۲', required: false, searchable: true, filterable: false, visible: true, importable: true, exportable: true, display_order: 14, active: true },
  { id: 'f-notes', internal_name: 'notes', persian_label: 'توضیحات', type: 'longtext', placeholder: 'توضیحات تکمیلی...', required: false, searchable: true, filterable: false, visible: false, importable: true, exportable: true, display_order: 15, active: true },
  
  // System Fields (Locked)
  { id: 'f-sys-id', internal_name: 'id', persian_label: 'شناسه سیستم', type: 'text', required: true, searchable: false, filterable: false, visible: false, importable: false, exportable: false, display_order: 90, active: true, is_system: true },
  { id: 'f-sys-created', internal_name: 'created_at', persian_label: 'تاریخ ایجاد', type: 'datetime', required: false, searchable: false, filterable: false, visible: false, importable: false, exportable: true, display_order: 91, active: true, is_system: true },
  { id: 'f-sys-updated', internal_name: 'updated_at', persian_label: 'آخرین به‌روزرسانی', type: 'datetime', required: false, searchable: false, filterable: false, visible: false, importable: false, exportable: true, display_order: 92, active: true, is_system: true },
  { id: 'f-sys-search-count', internal_name: 'search_count', persian_label: 'تعداد جستجو', type: 'number', required: false, searchable: false, filterable: false, visible: false, importable: false, exportable: true, display_order: 93, active: true, is_system: true },
];

export const INITIAL_SETTINGS: AppSettings = {
  header_title: 'دفتر تلفن',
  organization_name: 'سازمان نوآوری و توسعه فناوری',
  sub_title: 'سامانه جامع راهنمای ارتباطات و تلفن پرسنل (شبکه داخلی)',
  subtitle: 'سامانه جامع راهنمای ارتباطات و تلفن پرسنل (شبکه داخلی)',
  logo_url: null,
  default_avatar: null,
  timezone: 'Asia/Tehran',
  default_sort_field: 'full_name',
  default_sort_order: 'asc',
  retention_days: 30,
  theme: 'system',
  contact_info: 'پشتیبانی فنی: داخلی ۲۰۱ | helpdesk@org.ir',
  intranet_banner: 'محرمانه - شبکه داخلی سازمان',
};

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'مدیر ارشد سامانه',
    role: 'admin',
    password_hash: bcrypt.hashSync('123', 10),
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    active: true,
  },
  {
    id: 'usr-editor',
    username: 'editor',
    name: 'ویرایشگر سامانه',
    role: 'editor',
    password_hash: bcrypt.hashSync('123', 10),
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    active: true,
  }
];

// Helper to generate exactly 60 realistic Iranian employee profiles
export function generateInitialEmployees(): Employee[] {
  const rawList = [
    { first: 'علیرضا', last: 'رستگار', dept: 'dept-1', pos: 'pos-1', loc: 'loc-1', code: '1001', ext: '101', dir: '021-88901001', mob: '09121110011', email: 'a.rastegar@org.ir', unit: '501', room: '12', count: 185, notes: 'دکترای مدیریت استراتژیک، جلسات با هماهنگی حوزه ریاست' },
    { first: 'پروانه', last: 'حسینی', dept: 'dept-1', pos: 'pos-2', loc: 'loc-1', code: '1002', ext: '103', dir: '021-88901003', mob: '09121110022', email: 'p.hosseini@org.ir', unit: '501', room: '14', count: 96, notes: 'قائم‌مقام و پیگیری پروژه‌های اولویت‌دار سازمانی' },
    { first: 'نرگس', last: 'کیانی', dept: 'dept-1', pos: 'pos-9', loc: 'loc-1', code: '1003', ext: '100', dir: '021-88901000', mob: '09121110033', email: 'n.kiani@org.ir', unit: '501', room: '10', count: 142, notes: 'هماهنگی وقت ملاقات و برنامه‌ریزی جلسات هیئت‌مدیره' },
    { first: 'وحید', last: 'کاظمی', dept: 'dept-2', pos: 'pos-3', loc: 'loc-2', code: '1004', ext: '201', dir: '021-88902001', mob: '09122220011', email: 'v.kazemi@org.ir', unit: '302', room: '01', count: 215, notes: 'مدیریت فاوا، پاسخگویی موارد اضطراری سرورها و امنیت' },
    { first: 'فرزاد', last: 'صفایی', dept: 'dept-2', pos: 'pos-5', loc: 'loc-2', code: '1005', ext: '202', dir: '021-88902002', mob: '09122220022', email: 'f.safaei@org.ir', unit: '302', room: '02', count: 88, notes: 'سرپرست زیرساخت، دیتاسنتر، سوییچینگ شبکه و فایروال' },
    { first: 'سمانه', last: 'یوسفی', dept: 'dept-2', pos: 'pos-6', loc: 'loc-2', code: '1006', ext: '204', dir: '021-88902004', mob: '09122220033', email: 's.yousefi@org.ir', unit: '302', room: '05', count: 72, notes: 'کارشناس ارشد معماری سامانه‌های نرم‌افزاری و وب سرویس‌ها' },
    { first: 'آرش', last: 'مهرابی', dept: 'dept-2', pos: 'pos-6', loc: 'loc-2', code: '1007', ext: '205', dir: '021-88902005', mob: '09122220044', email: 'a.mehrabi@org.ir', unit: '302', room: '06', count: 65, notes: 'توسعه‌دهنده فرانت‌اند و مدیریت دیتابیس سامانه‌ها' },
    { first: 'مریم', last: 'سعیدی', dept: 'dept-3', pos: 'pos-3', loc: 'loc-3', code: '1008', ext: '301', dir: '021-88903001', mob: '09123330011', email: 'm.saeedi@org.ir', unit: '201', room: '11', count: 128, notes: 'برنامه‌ریزی منابع انسانی، ارزیابی عملکرد و آموزش' },
    { first: 'امیرحسین', last: 'مرادی', dept: 'dept-3', pos: 'pos-4', loc: 'loc-3', code: '1009', ext: '302', dir: '021-88903002', mob: '09123330022', email: 'a.moradi@org.ir', unit: '201', room: '12', count: 74, notes: 'رئیس اداره امور اداری، استخدام، گزینش و رفاه پرسنلی' },
    { first: 'بهناز', last: 'شمس', dept: 'dept-3', pos: 'pos-7', loc: 'loc-3', code: '1010', ext: '304', dir: '021-88903004', mob: '09123330033', email: 'b.shams@org.ir', unit: '201', room: '13', count: 42, notes: 'صدور احکام کارگزینی، ثبت مرخصی‌ها و پرونده پرسنل' },
    { first: 'بهروز', last: 'کریمی', dept: 'dept-4', pos: 'pos-3', loc: 'loc-3', code: '1011', ext: '401', dir: '021-88904001', mob: '09124440011', email: 'b.karimi@org.ir', unit: '204', room: '20', count: 135, notes: 'مدیر مالی و ذی‌حساب، کنترل بودجه و اعتبارات سالانه' },
    { first: 'فاطمه', last: 'دانایی', dept: 'dept-4', pos: 'pos-4', loc: 'loc-3', code: '1012', ext: '402', dir: '021-88904002', mob: '09124440022', email: 'f.danaei@org.ir', unit: '204', room: '21', count: 85, notes: 'رئیس حسابداری مالی، امور بانکی، اسناد و تضامین' },
    { first: 'کامران', last: 'پوریا', dept: 'dept-4', pos: 'pos-6', loc: 'loc-3', code: '1013', ext: '404', dir: '021-88904004', mob: '09124440033', email: 'k.pouria@org.ir', unit: '204', room: '22', count: 53, notes: 'کارشناس ارشد حقوق و دستمزد و بیمه تامین اجتماعی' },
    { first: 'مسعود', last: 'شایگان', dept: 'dept-5', pos: 'pos-3', loc: 'loc-4', code: '1014', ext: '501', dir: '021-88905001', mob: '09125550011', email: 'm.shayegan@org.ir', unit: '401', room: '01', count: 140, notes: 'مدیر بازرگانی و فروش، توسعه بازار و تفاهم‌نامه‌های تجاری' },
    { first: 'الهام', last: 'زارعی', dept: 'dept-5', pos: 'pos-7', loc: 'loc-4', code: '1015', ext: '502', dir: '021-88905002', mob: '09125550022', email: 'e.zarei@org.ir', unit: '401', room: '02', count: 68, notes: 'کارشناس امور مشتریان عمده و ارتباط با نهادها' },
    { first: 'نیما', last: 'اسکندری', dept: 'dept-5', pos: 'pos-7', loc: 'loc-4', code: '1016', ext: '504', dir: '021-88905004', mob: '09125550033', email: 'n.eskandari@org.ir', unit: '401', room: '03', count: 60, notes: 'تحلیل بازار، پیگیری سفارش‌ها و پیش‌فاکتورها' },
    { first: 'پریسا', last: 'دهقان', dept: 'dept-5', pos: 'pos-7', loc: 'loc-4', code: '1017', ext: '505', dir: '021-88905005', mob: '09125550044', email: 'p.dehghan@org.ir', unit: '401', room: '05', count: 48, notes: 'تنظیم قراردادهای تجاری، مناقصات و مزایدات' },
    { first: 'شاهین', last: 'افشار', dept: 'dept-2', pos: 'pos-8', loc: 'loc-2', code: '1018', ext: '207', dir: '021-88902007', mob: '09122220055', email: 'sh.afshar@org.ir', unit: '302', room: '08', count: 110, notes: 'پشتیبانی فنی سیستم‌ها، ماشین‌های اداری و شبکه' },
    { first: 'سمیه', last: 'غفاری', dept: 'dept-5', pos: 'pos-11', loc: 'loc-4', code: '1019', ext: '507', dir: '021-88905007', mob: '09125550055', email: 's.ghaffari@org.ir', unit: '401', room: '06', count: 57, notes: 'مشاور حقوقی و کارشناس رسیدگی به دعاوی و قراردادها' },
    { first: 'کیوان', last: 'صامتی', dept: 'dept-3', pos: 'pos-12', loc: 'loc-3', code: '1020', ext: '305', dir: '021-88903005', mob: '09123330044', email: 'k.sameti@org.ir', unit: '201', room: '15', count: 92, notes: 'سرپرست دبیرخانه و بایگانی اسناد، گردش مکاتبات اداری' },
    { first: 'احسان', last: 'میرزایی', dept: 'dept-6', pos: 'pos-3', loc: 'loc-5', code: '1021', ext: '601', dir: '021-88906001', mob: '09126660011', email: 'e.mirzaei@org.ir', unit: '105', room: '01', count: 115, notes: 'دکترای هوش مصنوعی، راهبری پروژه‌های پژوهشی و فناوری‌های نوین' },
    { first: 'زهرا', last: 'طاهری', dept: 'dept-6', pos: 'pos-13', loc: 'loc-5', code: '1022', ext: '602', dir: '021-88906002', mob: '09126660022', email: 'z.taheri@org.ir', unit: '105', room: '02', count: 78, notes: 'کارشناس ارشد یادگیری ماشین، پردازش داده‌های کلان و بینایی ماشین' },
    { first: 'نگار', last: 'سهرابی', dept: 'dept-7', pos: 'pos-3', loc: 'loc-1', code: '1023', ext: '701', dir: '021-88907001', mob: '09127770011', email: 'n.sohrabi@org.ir', unit: '502', room: '18', count: 130, notes: 'مدیر روابط عمومی، تشریفات، نشست‌های مطبوعاتی و امور بین‌الملل' },
    { first: 'میلاد', last: 'باقری', dept: 'dept-7', pos: 'pos-14', loc: 'loc-1', code: '1024', ext: '702', dir: '021-88907002', mob: '09127770022', email: 'm.bagheri@org.ir', unit: '502', room: '19', count: 64, notes: 'کارشناس رسانه، تولید محتوای دیجیتال و پورتال اطلاع‌رسانی' },
    { first: 'جلال', last: 'نوری', dept: 'dept-8', pos: 'pos-3', loc: 'loc-1', code: '1025', ext: '801', dir: '021-88908001', mob: '09128880011', email: 'j.nouri@org.ir', unit: '102', room: '01', count: 150, notes: 'مدیر حراست، حفاظت فیزیکی، بازرسی و امنیت اماکن سازمانی' },
    { first: 'حسین', last: 'احمدی', dept: 'dept-8', pos: 'pos-15', loc: 'loc-1', code: '1026', ext: '802', dir: '021-88908002', mob: '09128880022', email: 'h.ahmadi@org.ir', unit: '102', room: '02', count: 83, notes: 'سرپرست کنترل تردد و دوربین‌های نظارتی، گشت‌های دوره‌ای' },
    { first: 'کیانوش', last: 'راد', dept: 'dept-9', pos: 'pos-3', loc: 'loc-4', code: '1027', ext: '901', dir: '021-88909001', mob: '09129990011', email: 'k.rad@org.ir', unit: '403', room: '16', count: 95, notes: 'مدیر برنامه‌ریزی، مدیریت استراتژیک، ارزیابی فرآیندها و استانداردهای کیفی' },
    { first: 'شیما', last: 'انصاری', dept: 'dept-9', pos: 'pos-6', loc: 'loc-4', code: '1028', ext: '902', dir: '021-88909002', mob: '09129990022', email: 'sh.ansari@org.ir', unit: '403', room: '17', count: 58, notes: 'کارشناس ارشد تعالی سازمانی، ممیزی داخلی و استقرار استانداردهای ISO' },
    { first: 'حسن', last: 'دادرس', dept: 'dept-10', pos: 'pos-3', loc: 'loc-6', code: '1029', ext: '951', dir: '021-88909501', mob: '09129550011', email: 'h.dadras@org.ir', unit: '101', room: '01', count: 105, notes: 'مدیر خدمات عمومی و پشتیبانی، مدیریت ناوگان ترابری و خدمات رفاهی' },
    { first: 'مهدی', last: 'یعقوبی', dept: 'dept-10', pos: 'pos-7', loc: 'loc-6', code: '1030', ext: '952', dir: '021-88909502', mob: '09129550022', email: 'm.yaghoubi@org.ir', unit: '101', room: '02', count: 70, notes: 'کارشناس انبارداری، مدیریت موجودی کالا و تدارکات مصرفی' },
    
    // Additional 30 employees to reach 60 total
    { first: 'سارا', last: 'کریمی‌پور', dept: 'dept-1', pos: 'pos-10', loc: 'loc-1', code: '1031', ext: '104', dir: '021-88901004', mob: '09121110044', email: 's.karimipour@org.ir', unit: '501', room: '15', count: 52, notes: 'مشاور عالی تحول سازمانی و مدیریت نوآوری' },
    { first: 'محمد', last: 'یزدانی', dept: 'dept-1', pos: 'pos-7', loc: 'loc-1', code: '1032', ext: '105', dir: '021-88901005', mob: '09121110055', email: 'm.yazdani@org.ir', unit: '501', room: '16', count: 41, notes: 'کارشناس امور مجامع، صورتجلسات هیئت‌مدیره و مصوبات' },
    { first: 'رضا', last: 'فرهادی', dept: 'dept-2', pos: 'pos-5', loc: 'loc-2', code: '1033', ext: '208', dir: '021-88902008', mob: '09122220066', email: 'r.farhadi@org.ir', unit: '302', room: '03', count: 89, notes: 'سرپرست امنیت سایبری، ممیزی نفوذ و پایش SOC' },
    { first: 'نیلوفر', last: 'روشن', dept: 'dept-2', pos: 'pos-6', loc: 'loc-2', code: '1034', ext: '209', dir: '021-88902009', mob: '09122220077', email: 'n.roshan@org.ir', unit: '302', room: '04', count: 62, notes: 'کارشناس ارشد دواپس، مدیریت کانتینرها و پایپ‌لاین CI/CD' },
    { first: 'سینا', last: 'پارسا', dept: 'dept-2', pos: 'pos-7', loc: 'loc-2', code: '1035', ext: '210', dir: '021-88902010', mob: '09122220088', email: 's.parsa@org.ir', unit: '302', room: '07', count: 54, notes: 'پشتیبانی سامانه‌های اداری و پورتال کاربران سازمانی' },
    { first: 'الهه', last: 'صالحی', dept: 'dept-3', pos: 'pos-6', loc: 'loc-3', code: '1036', ext: '306', dir: '021-88903006', mob: '09123330055', email: 'e.salehi@org.ir', unit: '201', room: '14', count: 67, notes: 'کارشناس ارشد ارزیابی شایستگی، آموزش و توانمندسازی پرسنل' },
    { first: 'پویان', last: 'افتخاری', dept: 'dept-3', pos: 'pos-7', loc: 'loc-3', code: '1037', ext: '307', dir: '021-88903007', mob: '09123330066', email: 'p.eftekhari@org.ir', unit: '201', room: '16', count: 48, notes: 'کارشناس رفاه، بیمه تکمیلی، سلامت شغلی و تسهیلات' },
    { first: 'فرهاد', last: 'نیک‌نژاد', dept: 'dept-3', pos: 'pos-8', loc: 'loc-3', code: '1038', ext: '308', dir: '021-88903008', mob: '09123330077', email: 'f.niknejad@org.ir', unit: '201', room: '17', count: 35, notes: 'متصدی امور اداری، صدور کارت شناسایی و ثبت تردد پرسنل' },
    { first: 'نسیم', last: 'میرهاشمی', dept: 'dept-4', pos: 'pos-6', loc: 'loc-3', code: '1039', ext: '405', dir: '021-88904005', mob: '09124440044', email: 'n.mirhashemi@org.ir', unit: '204', room: '23', count: 59, notes: 'کارشناس ارشد حسابداری مدیریت، گزارش‌گری مالی و بهای تمام‌شده' },
    { first: 'حمیدرضا', last: 'اکبری', dept: 'dept-4', pos: 'pos-7', loc: 'loc-3', code: '1040', ext: '406', dir: '021-88904006', mob: '09124440055', email: 'h.akbari@org.ir', unit: '204', room: '24', count: 45, notes: 'کارشناس خزانه‌داری، دریافت و پرداخت، صورت‌های بانکی و چک‌ها' },
    { first: 'لاله', last: 'فروتن', dept: 'dept-4', pos: 'pos-7', loc: 'loc-3', code: '1041', ext: '407', dir: '021-88904007', mob: '09124440066', email: 'l.foroutan@org.ir', unit: '204', room: '25', count: 39, notes: 'کارشناس ممیزی اسناد و کنترل صورت‌حساب‌های پیمانکاران' },
    { first: 'امید', last: 'جهانگیری', dept: 'dept-5', pos: 'pos-4', loc: 'loc-4', code: '1042', ext: '508', dir: '021-88905008', mob: '09125550066', email: 'o.jahangiri@org.ir', unit: '401', room: '04', count: 77, notes: 'رئیس اداره بازاریابی و تحلیل رقبا، توسعه سبد محصولات' },
    { first: 'طاهره', last: 'کاوش', dept: 'dept-5', pos: 'pos-7', loc: 'loc-4', code: '1043', ext: '509', dir: '021-88905009', mob: '09125550077', email: 't.kavosh@org.ir', unit: '401', room: '07', count: 43, notes: 'کارشناس فروش سازمانی (B2B) و مذاکرات بازرگانی' },
    { first: 'رامین', last: 'جمشیدی', dept: 'dept-5', pos: 'pos-11', loc: 'loc-4', code: '1044', ext: '510', dir: '021-88905010', mob: '09125550088', email: 'r.jamshidi@org.ir', unit: '401', room: '08', count: 51, notes: 'کارشناس حقوقی، بررسی انطباق قراردادها و ضمانت‌نامه‌ها' },
    { first: 'دانیال', last: 'توکلی', dept: 'dept-6', pos: 'pos-5', loc: 'loc-5', code: '1045', ext: '603', dir: '021-88906003', mob: '09126660033', email: 'd.tavakoli@org.ir', unit: '105', room: '03', count: 82, notes: 'سرپرست تیم معماری داده و مهندسی خطوط پردازش هوش مصنوعی' },
    { first: 'فرشته', last: 'مقدم', dept: 'dept-6', pos: 'pos-13', loc: 'loc-5', code: '1046', ext: '604', dir: '021-88906004', mob: '09126660044', email: 'f.moghaddam@org.ir', unit: '105', room: '04', count: 68, notes: 'پژوهشگر پردازش زبان طبیعی (NLP) و مدل‌های زبانی سازمانی' },
    { first: 'کیومرث', last: 'شیروانی', dept: 'dept-6', pos: 'pos-7', loc: 'loc-5', code: '1047', ext: '605', dir: '021-88906005', mob: '09126660055', email: 'k.shirvani@org.ir', unit: '105', room: '05', count: 47, notes: 'توسعه‌دهنده پایگاه داده‌های برداری و ابزارهای تحلیلی' },
    { first: 'شیدا', last: 'بهبودی', dept: 'dept-7', pos: 'pos-6', loc: 'loc-1', code: '1048', ext: '703', dir: '021-88907003', mob: '09127770033', email: 'sh.behboudi@org.ir', unit: '502', room: '20', count: 71, notes: 'کارشناس ارشد ارتباط با رسانه‌ها، کنفرانس‌های خبری و بیانیه‌ها' },
    { first: 'بابک', last: 'کاووسی', dept: 'dept-7', pos: 'pos-14', loc: 'loc-1', code: '1049', ext: '704', dir: '021-88907004', mob: '09127770044', email: 'b.kavoosi@org.ir', unit: '502', room: '21', count: 56, notes: 'مدیریت شبکه‌های اجتماعی، تدوین ویدیو و گرافیک اطلاع‌رسانی' },
    { first: 'مهسا', last: 'حیدریان', dept: 'dept-7', pos: 'pos-7', loc: 'loc-1', code: '1050', ext: '705', dir: '021-88907005', mob: '09127770055', email: 'm.heidarian@org.ir', unit: '502', room: '22', count: 44, notes: 'کارشناس امور بین‌الملل، ترجمه مکاتبات و هماهنگی هیئت‌های خارجی' },
    { first: 'صادق', last: 'محمودی', dept: 'dept-8', pos: 'pos-4', loc: 'loc-1', code: '1051', ext: '803', dir: '021-88908003', mob: '09128880033', email: 's.mahmoudi@org.ir', unit: '102', room: '03', count: 76, notes: 'رئیس بازرسی و رسیدگی به شکایات، نظارت بر سلامت اداری' },
    { first: 'مجید', last: 'زند', dept: 'dept-8', pos: 'pos-15', loc: 'loc-1', code: '1052', ext: '804', dir: '021-88908004', mob: '09128880044', email: 'm.zand@org.ir', unit: '102', room: '04', count: 63, notes: 'مسئول اتاق مانیتورینگ مرکزی و سیستم‌های هشدار امنیتی' },
    { first: 'عباس', last: 'خسروی', dept: 'dept-8', pos: 'pos-8', loc: 'loc-1', code: '1053', ext: '805', dir: '021-88908005', mob: '09128880055', email: 'a.khosravi@org.ir', unit: '102', room: '05', count: 38, notes: 'تکنسین تجهیزات حفاظتی، گیت‌های ورودی و اکسس کنترل' },
    { first: 'آناهیتا', last: 'صارمی', dept: 'dept-9', pos: 'pos-4', loc: 'loc-4', code: '1054', ext: '903', dir: '021-88909003', mob: '09129990033', email: 'a.saremi@org.ir', unit: '403', room: '18', count: 65, notes: 'رئیس اداره کنترل پروژه و مدیریت پورتفولیوی طرح‌های راهبردی' },
    { first: 'سهراب', last: 'پزشک‌پور', dept: 'dept-9', pos: 'pos-6', loc: 'loc-4', code: '1055', ext: '904', dir: '021-88909004', mob: '09129990044', email: 's.pezeshkpour@org.ir', unit: '403', room: '19', count: 52, notes: 'کارشناس ارشد مهندسی مجدد فرآیندها (BPR) و شاخص‌های KPI' },
    { first: 'منصوره', last: 'دانش', dept: 'dept-9', pos: 'pos-7', loc: 'loc-4', code: '1056', ext: '905', dir: '021-88909005', mob: '09129990055', email: 'm.danesh@org.ir', unit: '403', room: '20', count: 40, notes: 'کارشناس پایش اهداف عملیاتی و گردآوری آمار و داشبوردهای مدیریتی' },
    { first: 'اکبر', last: 'سلیمانی', dept: 'dept-10', pos: 'pos-5', loc: 'loc-6', code: '1057', ext: '953', dir: '021-88909503', mob: '09129550033', email: 'a.soleimani@org.ir', unit: '101', room: '03', count: 79, notes: 'سرپرست ناوگان ترابری و خدمات اعزام خودروهای سازمانی' },
    { first: 'قاسم', last: 'بیات', dept: 'dept-10', pos: 'pos-8', loc: 'loc-6', code: '1058', ext: '954', dir: '021-88909504', mob: '09129550044', email: 'gh.bayat@org.ir', unit: '101', room: '04', count: 55, notes: 'تکنسین ارشد تاسیسات مکانیکی، برق، سرمایش و گرمایش ساختمان‌ها' },
    { first: 'سمیرا', last: 'جعفری', dept: 'dept-10', pos: 'pos-7', loc: 'loc-6', code: '1059', ext: '955', dir: '021-88909505', mob: '09129550055', email: 's.jafari@org.ir', unit: '101', room: '05', count: 46, notes: 'کارشناس تدارکات، خرید ملزومات اداری و پیگیری فاکتورها' },
    { first: 'یوسف', last: 'عطایی', dept: 'dept-10', pos: 'pos-8', loc: 'loc-6', code: '1060', ext: '956', dir: '021-88909506', mob: '09129550066', email: 'y.ataei@org.ir', unit: '101', room: '06', count: 37, notes: 'امور انبارداری، تحویل کالا، پلاک‌کوبی اموال و نگهداری تجهیزات' },
  ];

  const now = new Date().toISOString();

  return rawList.map((item, idx) => {
    const id = `emp-${idx + 1}`;
    const fullName = `${item.first} ${item.last}`;
    const locItem = INITIAL_LOCATIONS.find(l => l.id === item.loc);
    const building = locItem ? locItem.building : '';
    const floor = locItem ? locItem.floor : '';
    const unit = item.unit || (locItem ? locItem.unit : '');
    const room = item.room || (locItem ? locItem.room : '');

    // Contact Numbers collection
    const phones: PhoneNumber[] = [];

    // Primary extension
    phones.push({
      id: `p-${id}-ext1`,
      type: 'extension',
      label: 'داخلی مستقیم',
      number: item.ext,
      primary: true,
    });

    // Primary direct phone
    phones.push({
      id: `p-${id}-dir1`,
      type: 'office',
      label: 'تلفن مستقیم کار',
      number: item.dir,
      primary: true,
    });

    // Primary mobile
    phones.push({
      id: `p-${id}-mob1`,
      type: 'mobile',
      label: 'همراه',
      number: item.mob,
      primary: true,
    });

    // Secondary contact injections (distribution for rich multi-channel contact)
    // 1) Second Extension for selected employees
    if (idx % 3 === 0) {
      const ext2 = String(Number(item.ext) + 10);
      phones.push({
        id: `p-${id}-ext2`,
        type: 'extension',
        label: 'داخلی دوم',
        number: ext2,
        primary: false,
      });
    }

    // 2) Second Direct phone for selected executives and unit managers
    if ([0, 3, 7, 10, 13, 20, 22, 24, 26, 28, 30, 32, 41, 44, 50, 53, 56].includes(idx)) {
      const lastDigit = Number(item.dir.slice(-1));
      const nextDigit = lastDigit === 9 ? 8 : lastDigit + 1;
      const dir2 = item.dir.slice(0, -1) + nextDigit;
      phones.push({
        id: `p-${id}-dir2`,
        type: 'office',
        label: 'مستقیم دوم',
        number: dir2,
        primary: false,
      });
    }

    // 3) Second Mobile for selected employees
    if ([1, 4, 10, 14, 18, 21, 23, 27, 33, 36, 42, 47, 51, 57].includes(idx)) {
      const prefixes = ['0919', '0935', '0990', '0921', '0930'];
      const pref = prefixes[idx % prefixes.length];
      const mob2 = pref + item.mob.slice(4);
      phones.push({
        id: `p-${id}-mob2`,
        type: 'mobile',
        label: 'همراه کاری',
        number: mob2,
        primary: false,
      });
    }

    // 4) Second Email for selected employees
    let emailValue = item.email;
    const emailsList = [item.email];
    if ([0, 2, 6, 14, 20, 22, 31, 35, 43, 49, 55].includes(idx)) {
      const emailPrefix = item.email.split('@')[0];
      const secondDomain = (idx % 2 === 0) ? 'corp.ir' : 'org.ir';
      const secondEmail = `${emailPrefix}.backup@${secondDomain}`;
      emailValue = `${item.email}, ${secondEmail}`;
      emailsList.push(secondEmail);
    }

    return {
      id,
      first_name: item.first,
      last_name: item.last,
      full_name: fullName,
      personnel_code: item.code,
      department_id: item.dept,
      position_id: item.pos,
      extension: item.ext,
      direct_phone: item.dir,
      mobile: item.mob,
      email: emailValue,
      emails: emailsList,
      location_id: item.loc,
      building,
      unit,
      floor,
      room,
      notes: item.notes || '',
      avatar: `/api/uploads/employees/emp_${id}.jpg`,
      phones,
      custom_fields: {},
      search_count: item.count,
      created_at: now,
      updated_at: now,
      internal_metadata: { initial_import: true },
    };
  });
}
