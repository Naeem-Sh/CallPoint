import React, { useState } from 'react';
import { Employee, DynamicFieldDefinition, Department, Position, LocationItem, PhoneNumber } from '../../types.ts';
import { api } from '../../utils/api.ts';
import { toPersianDigits, formatPersianDateTime } from '../../utils/shamsi.ts';
import { formatEmployeeLocation } from '../../utils/location.ts';
import { MeteorAvatar } from '../MeteorAvatar.tsx';
import { EmployeeProfileModal } from '../EmployeeProfileModal.tsx';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  User,
  Phone,
  Mail,
  Building,
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Eye,
  FileText,
  PhoneCall,
  Copy,
  Loader2,
  LayoutGrid,
  Table as TableIcon,
  Check,
  Smartphone,
  Clock,
  ExternalLink,
  Layers,
  DoorOpen,
} from 'lucide-react';

interface AdminEmployeesProps {
  employees: Employee[];
  fields: DynamicFieldDefinition[];
  departments: Department[];
  positions: Position[];
  locations: LocationItem[];
  onRefresh: () => void;
}

export const AdminEmployees: React.FC<AdminEmployeesProps> = ({
  employees,
  fields,
  departments,
  positions,
  locations,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  const [phonesList, setPhonesList] = useState<PhoneNumber[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Quick Location Creation State
  const [isQuickLocationOpen, setIsQuickLocationOpen] = useState(false);
  const [quickLocationBuilding, setQuickLocationBuilding] = useState('');
  const [quickLocationLoading, setQuickLocationLoading] = useState(false);
  const [selectedProfileEmp, setSelectedProfileEmp] = useState<Employee | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [duplicatedNewEmp, setDuplicatedNewEmp] = useState<Employee | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    try {
      return (localStorage.getItem('admin_emp_view_mode') as 'cards' | 'table') || 'cards';
    } catch {
      return 'cards';
    }
  });

  const handleSetViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('admin_emp_view_mode', mode);
    } catch {}
  };

  const handleCopy = (e: React.MouseEvent, text: string, key: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1600);
  };

  const deptMap = new Map<string, string>(departments.map((d) => [d.id, d.name]));
  const posMap = new Map<string, string>(positions.map((p) => [p.id, p.title]));
  const locMap = new Map<string, string>(locations.map((l) => [l.id, l.name]));

  const openAddModal = () => {
    setEditingEmp(null);
    setFormData({
      first_name: '',
      last_name: '',
      personnel_code: '',
      department_id: departments[0]?.id || '',
      position_id: positions[0]?.id || '',
      location_id: locations[0]?.id || '',
      unit: '',
      floor: '',
      room: '',
      extension: '',
      direct_phone: '',
      mobile: '',
      email: '',
      notes: '',
    });
    setCustomFieldsData({});
    setPhonesList([
      { id: '1', type: 'extension', label: 'داخلی', number: '', primary: true },
      { id: '2', type: 'mobile', label: 'همراه', number: '', primary: false },
    ]);
    setAvatarPreview(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    const loc = locations.find((l) => l.id === emp.location_id);
    setFormData({
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      personnel_code: emp.personnel_code || '',
      department_id: emp.department_id || '',
      position_id: emp.position_id || '',
      location_id: emp.location_id || '',
      unit: (emp as any).unit !== undefined ? (emp as any).unit : (loc?.unit || ''),
      floor: (emp as any).floor !== undefined ? (emp as any).floor : (loc?.floor || ''),
      room: emp.room !== undefined ? emp.room : (loc?.room || ''),
      extension: emp.extension || '',
      direct_phone: emp.direct_phone || '',
      mobile: emp.mobile || '',
      email: emp.email || '',
      notes: emp.notes || '',
    });
    setCustomFieldsData(emp.custom_fields || {});
    setPhonesList(
      emp.phones && emp.phones.length > 0
        ? emp.phones
        : [
            { id: '1', type: 'extension', label: 'داخلی', number: emp.extension || '', primary: true },
            { id: '2', type: 'mobile', label: 'همراه', number: emp.mobile || '', primary: false },
          ]
    );
    setAvatarPreview(emp.avatar || null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('photo', file);

    try {
      setLoading(true);
      const res = await api.uploadAvatar(fd);
      setAvatarPreview(res.url);
      setFormData((prev) => ({ ...prev, avatar: res.url }));
    } catch (err: any) {
      setError(err.message || 'بارگذاری تصویر با خطا مواجه شد.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const selectedLoc = locations.find((l) => l.id === formData.location_id);
      const payload: any = {
        ...formData,
        building: selectedLoc ? (selectedLoc.building || selectedLoc.name) : (formData.building || ''),
        unit: (formData.unit || '').trim(),
        floor: (formData.floor || '').trim(),
        room: (formData.room || '').trim(),
        avatar: avatarPreview || formData.avatar || '',
        phones: phonesList.filter((p) => p.number.trim() !== ''),
        custom_fields: customFieldsData,
      };

      // Sync direct_phone, mobile, extension from primary phones
      const extPhone = phonesList.find((p) => p.type === 'extension');
      if (extPhone && extPhone.number) payload.extension = extPhone.number;
      const mobPhone = phonesList.find((p) => p.type === 'mobile');
      if (mobPhone && mobPhone.number) payload.mobile = mobPhone.number;
      const dirPhone = phonesList.find((p) => p.type === 'office');
      if (dirPhone && dirPhone.number) payload.direct_phone = dirPhone.number;

      if (editingEmp) {
        await api.updateEmployee(editingEmp.id, payload);
        setSuccess('اطلاعات کارمند با موفقیت به‌روزرسانی شد.');
      } else {
        await api.createEmployee(payload);
        setSuccess('کارمند جدید با موفقیت به سامانه افزوده شد.');
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت اطلاعات کارمند');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (emp: Employee) => {
    try {
      setDuplicatingId(emp.id);
      setError(null);
      setSuccess(null);
      const newEmp = await api.duplicateEmployee(emp.id);
      setDuplicatedNewEmp(newEmp);
      setSuccess(`کارت دوم برای «${emp.full_name}» با موفقیت به صورت خودکار ایجاد گردید.`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'خطا در ایجاد کارت دوپلیکیت');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`آیا از حذف کارمند «${emp.full_name}» اطمینان دارید؟`)) return;

    try {
      await api.deleteEmployee(emp.id);
      setSuccess(`کارمند «${emp.full_name}» حذف گردید.`);
      onRefresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در حذف کارمند');
    }
  };

  const filtered = employees.filter((emp) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const deptName = deptMap.get(emp.department_id)?.toLowerCase() || '';
    const posTitle = posMap.get(emp.position_id)?.toLowerCase() || '';
    const locName = locMap.get(emp.location_id)?.toLowerCase() || '';
    return (
      (emp.full_name && emp.full_name.toLowerCase().includes(term)) ||
      (emp.personnel_code && emp.personnel_code.includes(term)) ||
      (emp.extension && emp.extension.includes(term)) ||
      (emp.mobile && emp.mobile.includes(term)) ||
      (emp.direct_phone && emp.direct_phone.includes(term)) ||
      (emp.email && emp.email.toLowerCase().includes(term)) ||
      (emp.building && emp.building.toLowerCase().includes(term)) ||
      (emp.room && emp.room.includes(term)) ||
      (emp.floor && emp.floor.includes(term)) ||
      (emp.unit && emp.unit.includes(term)) ||
      (emp.notes && emp.notes.toLowerCase().includes(term)) ||
      deptName.includes(term) ||
      posTitle.includes(term) ||
      locName.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top action bar with Search, View Mode, and Add Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در نام، شماره پرسنلی، داخلی، همراه، ایمیل، اتاق، سمت..."
            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
          {/* View Mode Toggle: Cards vs Table */}
          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleSetViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="نمایش تمام اطلاعات پرسنل به صورت کارت‌های کامل و تفصیلی"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>کارت‌های کامل پرسنل</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="نمایش فهرست به صورت جدول جامع"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>جدول تفصیلی</span>
            </button>
          </div>

          {/* Add Employee Button */}
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن کارمند جدید</span>
          </button>
        </div>
      </div>

      {/* Counter & Search Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs px-1 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>تعداد پرسنل:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200/50 dark:border-indigo-800/50">
            {toPersianDigits(filtered.length)} نفر
          </span>
          {filtered.length !== employees.length && (
            <span className="text-[11px] text-slate-400">
              (فیلترشده از مجموع {toPersianDigits(employees.length)} پرسنل)
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          {viewMode === 'cards' ? 'نمای کارت‌های کامل با تمام مشخصات، تماس‌ها و امکانات مدیریتی' : 'نمای جدول جامع مشخصات پرسنلی'}
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          {duplicatedNewEmp && (
            <button
              type="button"
              onClick={() => {
                openEditModal(duplicatedNewEmp);
                setDuplicatedNewEmp(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>ویرایش کارت دوم ایجادشده (محل استقرار، داخلی، اتاق...)</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
          <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">هیچ کارمندی با این مشخصات یافت نشد.</p>
          <p className="text-xs">لطفاً واژه جستجو را تغییر دهید یا با دکمه بالا کارمند جدید اضافه کنید.</p>
        </div>
      )}

      {/* ================= VIEW 1: FULL EMPLOYEE CARDS VIEW (ALL CARD INFORMATION IN LIST) ================= */}
      {viewMode === 'cards' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filtered.map((emp) => {
            const deptName = deptMap.get(emp.department_id) || '-';
            const posTitle = posMap.get(emp.position_id) || '-';
            const locFormatted = formatEmployeeLocation(emp, locations);
            const customEntries = emp.custom_fields && typeof emp.custom_fields === 'object'
              ? Object.entries(emp.custom_fields)
              : [];

            return (
              <div
                key={emp.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* 1. Card Top Section: Avatar, Name, Code, Badges & Quick Action Toolbar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <MeteorAvatar
                        src={emp.avatar}
                        name={emp.full_name || `${emp.first_name} ${emp.last_name}`}
                        alt=""
                        size="md"
                        shape="circle"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setSelectedProfileEmp(emp)}
                            className="font-black text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-right cursor-pointer truncate"
                            title="مشاهده شناسنامه و تمام اطلاعات فرد"
                          >
                            {emp.full_name}
                          </button>
                          {emp.internal_metadata?.duplicated_from && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200/60 dark:border-amber-800/60">
                              کارت دوم
                            </span>
                          )}
                        </div>

                        {/* Personnel Code with quick copy */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                          {emp.personnel_code ? (
                            <div className="inline-flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold">
                              <span className="text-slate-400 text-[10px] font-sans">کد پرسنلی:</span>
                              <span className="text-indigo-600 dark:text-indigo-400">{toPersianDigits(emp.personnel_code)}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(e, emp.personnel_code, `code-${emp.id}`)}
                                title="کپی شماره پرسنلی"
                                className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                {copiedKey === `code-${emp.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">فاقد شماره پرسنلی</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons on top right of each card */}
                    <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedProfileEmp(emp)}
                        className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
                        title="مشاهده تمام اطلاعات و شناسنامه فرد"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(emp)}
                        disabled={duplicatingId === emp.id}
                        className="p-1.5 rounded-xl text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors cursor-pointer disabled:opacity-50"
                        title="دوپلیکیت کارت و ایجاد یک کارت جدید با همین مشخصات"
                      >
                        {duplicatingId === emp.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                        title="ویرایش اطلاعات کارت"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(emp)}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        title="حذف این کارت"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Card Body: ALL fields of the employee */}
                <div className="p-4 sm:p-5 space-y-3.5 text-xs flex-1">
                  {/* Department & Position */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block">واحد</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block" title={deptName}>
                          {deptName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block">سمت</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block" title={posTitle}>
                          {posTitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Physical Location (Building, Floor, Room, Unit) */}
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-bold">محل استقرار:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate" title={locFormatted || 'تعیین نشده'}>
                        {locFormatted || 'تعیین نشده'}
                      </span>
                    </div>

                    {(emp.floor || emp.room || emp.unit) && (
                      <div className="flex flex-wrap items-center gap-2 pr-5 text-[11px] text-slate-500 dark:text-slate-400">
                        {emp.floor && (
                          <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                            <Layers className="w-3 h-3 text-slate-400" />
                            <span>طبقه: {toPersianDigits(emp.floor)}</span>
                          </span>
                        )}
                        {emp.room && (
                          <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                            <DoorOpen className="w-3 h-3 text-slate-400" />
                            <span>اتاق: {toPersianDigits(emp.room)}</span>
                          </span>
                        )}
                        {emp.unit && (
                          <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>واحد: {toPersianDigits(emp.unit)}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contact Numbers: Extension, Direct, Mobile */}
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

                    const faxesOrOthers = (emp.phones || []).filter(
                      (p) =>
                        (p.type === 'fax' || p.type === 'other' || p.type === 'home') &&
                        !extensions.includes(p.number.trim()) &&
                        !directPhones.includes(p.number.trim()) &&
                        !mobiles.includes(p.number.trim())
                    );

                    return (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 block">خطوط تماس و ارتباطی:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* شماره داخلی */}
                          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl p-2.5 flex flex-col justify-between min-h-[68px]">
                            <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold mb-1.5 pb-1 border-b border-indigo-200/50 dark:border-indigo-800/50">
                              <span>شماره داخلی</span>
                            </div>
                            <div className="space-y-1.5">
                              {extensions.length > 0 ? (
                                extensions.map((ext, extIdx) => (
                                  <div key={extIdx} className="flex items-center justify-between gap-1">
                                    <a
                                      href={`tel:${ext}`}
                                      className="font-mono font-black text-sm text-indigo-900 dark:text-indigo-200 hover:underline"
                                    >
                                      {toPersianDigits(ext)}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopy(e, ext, `ext-${emp.id}-${extIdx}`)}
                                      className="p-0.5 text-indigo-600/70 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-white cursor-pointer"
                                      title="کپی شماره داخلی"
                                    >
                                      {copiedKey === `ext-${emp.id}-${extIdx}` ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-400 font-normal text-xs">-</span>
                              )}
                            </div>
                          </div>

                          {/* خط مستقیم */}
                          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl p-2.5 flex flex-col justify-between min-h-[68px]">
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mb-1.5 pb-1 border-b border-emerald-200/50 dark:border-emerald-800/50">
                              <span>خط مستقیم</span>
                            </div>
                            <div className="space-y-1.5">
                              {directPhones.length > 0 ? (
                                directPhones.map((dir, dirIdx) => (
                                  <div key={dirIdx} className="flex items-center justify-between gap-1">
                                    <a
                                      href={`tel:${dir}`}
                                      className="font-mono font-bold text-xs text-emerald-900 dark:text-emerald-200 hover:underline truncate"
                                      dir="ltr"
                                    >
                                      {toPersianDigits(dir)}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopy(e, dir, `dir-${emp.id}-${dirIdx}`)}
                                      className="p-0.5 text-emerald-600/70 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-white cursor-pointer shrink-0"
                                      title="کپی شماره مستقیم"
                                    >
                                      {copiedKey === `dir-${emp.id}-${dirIdx}` ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-400 font-normal text-xs">-</span>
                              )}
                            </div>
                          </div>

                          {/* تلفن همراه */}
                          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-xl p-2.5 flex flex-col justify-between min-h-[68px]">
                            <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold mb-1.5 pb-1 border-b border-amber-200/50 dark:border-amber-800/50">
                              <span>تلفن همراه</span>
                            </div>
                            <div className="space-y-1.5">
                              {mobiles.length > 0 ? (
                                mobiles.map((mob, mobIdx) => (
                                  <div key={mobIdx} className="flex items-center justify-between gap-1">
                                    <a
                                      href={`tel:${mob}`}
                                      className="font-mono font-bold text-xs text-amber-900 dark:text-amber-200 hover:underline truncate"
                                      dir="ltr"
                                    >
                                      {toPersianDigits(mob)}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopy(e, mob, `mob-${emp.id}-${mobIdx}`)}
                                      className="p-0.5 text-amber-600/70 hover:text-amber-900 dark:text-amber-400 dark:hover:text-white cursor-pointer shrink-0"
                                      title="کپی تلفن همراه"
                                    >
                                      {copiedKey === `mob-${emp.id}-${mobIdx}` ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-400 font-normal text-xs">-</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* فکس یا شماره‌های دیگر در صورت وجود */}
                        {faxesOrOthers.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {faxesOrOthers.map((ph, pi) => {
                              const typeLabel = ph.type === 'fax' ? 'فکس' : (ph.label?.replace(/\s*\d+$/, '') || 'تلفن');
                              return (
                                <div
                                  key={ph.id || pi}
                                  className="flex items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-[11px] font-mono border border-slate-200/60 dark:border-slate-700"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="text-slate-500 dark:text-slate-400 font-sans">
                                      {typeLabel}:
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate" dir="ltr">
                                      {toPersianDigits(ph.number)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopy(e, ph.number, `oth-${emp.id}-${pi}`)}
                                    className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                                    title="کپی"
                                  >
                                    {copiedKey === `oth-${emp.id}-${pi}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Email - If more than one, listed one under another in the same box */}
                        {emails.length > 0 && (
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 text-[11px]">
                              <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span>ایمیل:</span>
                            </div>
                            <div className="space-y-1.5">
                              {emails.map((eml, emlIdx) => (
                                <div key={emlIdx} className="flex items-center justify-between gap-2">
                                  <a
                                    href={`mailto:${eml}`}
                                    className="text-sky-600 dark:text-sky-400 hover:underline font-mono truncate text-xs"
                                    dir="ltr"
                                  >
                                    {eml}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopy(e, eml, `eml-${emp.id}-${emlIdx}`)}
                                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                                    title="کپی آدرس ایمیل"
                                  >
                                    {copiedKey === `eml-${emp.id}-${emlIdx}` ? (
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

                  {/* Notes / Descriptions */}
                  {emp.notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block mb-0.5">
                          توضیحات و یادداشت:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed break-words">
                          {emp.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Custom Fields */}
                  {customEntries.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                        فیلدهای تکمیلی و اختصاصی:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {customEntries.map(([ck, cv]) => {
                          const fDef = fields.find((f) => f.internal_name === ck);
                          const clabel = fDef ? fDef.persian_label : ck;
                          return (
                            <div
                              key={ck}
                              className="bg-slate-50 dark:bg-slate-950/40 p-1.5 px-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800 text-[11px] flex items-center justify-between gap-1"
                            >
                              <span className="text-slate-500 dark:text-slate-400">{clabel}:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                                {String(cv || '-')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Card Footer Metadata */}
                <div className="p-3 px-4 sm:px-5 bg-slate-50/70 dark:bg-slate-950/70 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-2">
                  <span>شناسه: {emp.id}</span>
                  <span>آخرین به‌روزرسانی: {formatPersianDateTime(emp.updated_at)}</span>
                  <span>دفعات جستجو: {toPersianDigits(emp.search_count || 0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= VIEW 2: COMPREHENSIVE DETAILED TABLE VIEW ================= */}
      {viewMode === 'table' && filtered.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3.5">تصویر</th>
                  <th className="py-3 px-3.5">نام و نام خانوادگی</th>
                  <th className="py-3 px-3.5">شماره پرسنلی</th>
                  <th className="py-3 px-3.5">واحد و سمت</th>
                  <th className="py-3 px-3.5 text-center">داخلی</th>
                  <th className="py-3 px-3.5 text-center">تلفن مستقیم</th>
                  <th className="py-3 px-3.5 text-center">همراه</th>
                  <th className="py-3 px-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              {filtered.map((emp) => {
                const deptName = deptMap.get(emp.department_id) || '-';
                const posTitle = posMap.get(emp.position_id) || '-';
                const locFormatted = formatEmployeeLocation(emp, locations);
                const customEntries = emp.custom_fields && typeof emp.custom_fields === 'object'
                  ? Object.entries(emp.custom_fields)
                  : [];

                return (
                  <tbody
                    key={emp.id}
                    className="divide-y divide-slate-100 dark:divide-slate-800/60 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Row 1: Primary identifiers & core phones */}
                    <tr>
                      <td className="py-2.5 px-3.5">
                        <MeteorAvatar
                          src={emp.avatar}
                          name={emp.full_name || `${emp.first_name} ${emp.last_name}`}
                          alt=""
                          size="sm"
                          shape="circle"
                        />
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setSelectedProfileEmp(emp)}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-right cursor-pointer"
                            title="مشاهده تمام اطلاعات کارت فرد"
                          >
                            {emp.full_name}
                          </button>
                          {emp.internal_metadata?.duplicated_from && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                              دوبل
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {toPersianDigits(emp.personnel_code || '-')}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-300">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{deptName}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{posTitle}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-center">
                        {(() => {
                          const exts = Array.from(
                            new Set(
                              [
                                emp.extension,
                                ...(emp.phones?.filter((p) => p.type === 'extension').map((p) => p.number) || []),
                              ]
                                .map((s) => s?.trim())
                                .filter(Boolean) as string[]
                            )
                          );
                          return exts.length > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              {exts.map((x, xi) => (
                                <span key={xi}>{toPersianDigits(x)}</span>
                              ))}
                            </div>
                          ) : (
                            '-'
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-center">
                        {(() => {
                          const dirs = Array.from(
                            new Set(
                              [
                                emp.direct_phone,
                                ...(emp.phones?.filter((p) => p.type === 'office' || p.type === 'direct' || p.type === 'phone').map((p) => p.number) || []),
                              ]
                                .map((s) => s?.trim())
                                .filter(Boolean) as string[]
                            )
                          );
                          return dirs.length > 0 ? (
                            <div className="flex flex-col items-center gap-1" dir="ltr">
                              {dirs.map((x, xi) => (
                                <span key={xi}>{toPersianDigits(x)}</span>
                              ))}
                            </div>
                          ) : (
                            '-'
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        {(() => {
                          const mobs = Array.from(
                            new Set(
                              [
                                emp.mobile,
                                ...(emp.phones?.filter((p) => p.type === 'mobile').map((p) => p.number) || []),
                              ]
                                .map((s) => s?.trim())
                                .filter(Boolean) as string[]
                            )
                          );
                          return mobs.length > 0 ? (
                            <div className="flex flex-col items-center gap-1" dir="ltr">
                              {mobs.map((x, xi) => (
                                <span key={xi}>{toPersianDigits(x)}</span>
                              ))}
                            </div>
                          ) : (
                            '-'
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProfileEmp(emp)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                            title="مشاهده تمام اطلاعات فرد"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(emp)}
                            disabled={duplicatingId === emp.id}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer disabled:opacity-50"
                            title="دوپلیکیت و ایجاد خودکار کارت دوم با اطلاعات مشابه"
                          >
                            {duplicatingId === emp.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(emp)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Row 2: Comprehensive individual details */}
                    <tr className="bg-slate-50/40 dark:bg-slate-950/30 text-[11px] text-slate-600 dark:text-slate-400">
                      <td colSpan={8} className="py-2.5 px-3.5">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                          {/* محل استقرار و مشخصات مکانی */}
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">محل استقرار:</span>
                            <span>{locFormatted || 'تعیین نشده'}</span>
                            {(emp.floor || emp.room) && (
                              <span className="text-slate-400">
                                ({[emp.floor && `طبقه ${toPersianDigits(emp.floor)}`, emp.room && `اتاق ${toPersianDigits(emp.room)}`].filter(Boolean).join(' - ')})
                              </span>
                            )}
                          </div>

                          {/* ایمیل */}
                          {(() => {
                            const emails = Array.from(
                              new Set(
                                [
                                  ...(emp.email ? emp.email.split(/[\n,;]+/).map((e: string) => e.trim()) : []),
                                  ...(Array.isArray((emp as any).emails) ? (emp as any).emails.map((e: string) => e.trim()) : []),
                                  ...(emp.custom_fields?.email ? String(emp.custom_fields.email).split(/[\n,;]+/).map((e: string) => e.trim()) : []),
                                ].filter(Boolean) as string[]
                              )
                            );
                            if (emails.length === 0) return null;
                            return (
                              <div className="flex items-start gap-1">
                                <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">ایمیل:</span>
                                <div className="flex flex-col gap-0.5">
                                  {emails.map((eml, ei) => (
                                    <span key={ei} className="font-mono text-indigo-600 dark:text-indigo-400" dir="ltr">
                                      {eml}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* فکس یا شماره‌های دیگر */}
                          {emp.phones &&
                            emp.phones
                              .filter((p) => (p.type === 'fax' || p.type === 'other') && p.number !== emp.extension && p.number !== emp.direct_phone && p.number !== emp.mobile)
                              .map((ph, pi) => (
                                <div key={pi} className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {ph.type === 'fax' ? 'فکس' : (ph.label?.replace(/\s*\d+$/, '') || 'تلفن')}:
                                  </span>
                                  <span className="font-mono">{toPersianDigits(ph.number)}</span>
                                </div>
                              ))}

                          {/* توضیحات / یادداشت */}
                          {emp.notes && (
                            <div className="flex items-center gap-1 max-w-lg truncate">
                              <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="font-semibold text-slate-700 dark:text-slate-300">توضیحات:</span>
                              <span className="text-slate-500 dark:text-slate-400 truncate">{emp.notes}</span>
                            </div>
                          )}

                          {/* فیلدهای سفارشی ثبت‌شده */}
                          {customEntries.map(([ck, cv]) => {
                            const fDef = fields.find((f) => f.internal_name === ck);
                            const clabel = fDef ? fDef.persian_label : ck;
                            return (
                              <div key={ck} className="flex items-center gap-1">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{clabel}:</span>
                                <span>{String(cv || '-')}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                );
              })}
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Dynamic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingEmp ? `ویرایش اطلاعات: ${editingEmp.full_name}` : 'افزودن کارمند جدید به سامانه'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="تصویر کارمند"
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xl font-bold">
                    👤
                  </div>
                )}
                <div>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>بارگذاری تصویر پرسنلی</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">فرمت‌های JPG, PNG, WEBP (حداکثر ۲ مگابایت)</p>
                </div>
              </div>

              {/* Standard Primary Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام خانوادگی <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره پرسنلی <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.personnel_code || ''}
                    onChange={(e) => setFormData({ ...formData, personnel_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Department & Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    واحد <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.department_id || ''}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (کد {d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سمت <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.position_id || ''}
                    onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Room Details Block */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>محل استقرار و مشخصات مکانی</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQuickLocationOpen(!isQuickLocationOpen)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    {isQuickLocationOpen ? 'بستن' : '+ افزودن ساختمان جدید'}
                  </button>
                </div>

                {/* Quick building creation if opened */}
                {isQuickLocationOpen && (
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 block">
                      افزودن سریع ساختمان جدید:
                    </span>
                    <div>
                      <input
                        type="text"
                        placeholder="نام ساختمان (مثال: ساختمان سپهر / ساختمان مرکزی / سوله تدارکات)"
                        value={quickLocationBuilding}
                        onChange={(e) => setQuickLocationBuilding(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsQuickLocationOpen(false)}
                        className="px-2.5 py-1 rounded-lg text-xs text-slate-500 cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        disabled={quickLocationLoading || !quickLocationBuilding.trim()}
                        onClick={async () => {
                          if (!quickLocationBuilding.trim()) return;
                          setQuickLocationLoading(true);
                          try {
                            const bName = quickLocationBuilding.trim();
                            const newLoc = await api.createLocation({
                              building: bName,
                              name: bName,
                              unit: '',
                              floor: '',
                              room: '',
                            });
                            onRefresh();
                            setFormData((prev) => ({ ...prev, location_id: newLoc.id }));
                            setQuickLocationBuilding('');
                            setIsQuickLocationOpen(false);
                          } catch (err: any) {
                            setError(err.message || 'خطا در ثبت ساختمان جدید');
                          } finally {
                            setQuickLocationLoading(false);
                          }
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg disabled:opacity-50 cursor-pointer"
                      >
                        {quickLocationLoading ? 'در حال ثبت...' : 'ثبت و انتخاب'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Building Combobox / Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ساختمان (انتخاب از لیست)
                  </label>
                  <select
                    value={formData.location_id || ''}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- بدون انتخاب ساختمان --</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.building || l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Manual Fields: واحد, طبقه, اتاق (Allows both Text and Numbers) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      واحد
                    </label>
                    <input
                      type="text"
                      value={formData.unit || ''}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="مثال: ۱۰۱ یا واحد اداری"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      طبقه
                    </label>
                    <input
                      type="text"
                      value={formData.floor || ''}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      placeholder="مثال: ۲ یا همکف"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اتاق
                    </label>
                    <input
                      type="text"
                      value={formData.room || ''}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      placeholder="مثال: ۲۰۴ یا مدیریت"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-phone numbers */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>دفترچه تلفن‌ها و شماره‌های تماس</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setPhonesList([
                        ...phonesList,
                        { id: Date.now().toString(), type: 'office', label: 'مستقیم', number: '', primary: false },
                      ])
                    }
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    + افزودن شماره دیگر
                  </button>
                </div>

                <div className="space-y-2.5">
                  {phonesList.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <select
                        value={p.type}
                        onChange={(e) => {
                          const updated = [...phonesList];
                          const newType = e.target.value as any;
                          updated[idx].type = newType;
                          updated[idx].label =
                            newType === 'extension'
                              ? 'داخلی'
                              : newType === 'office'
                              ? 'مستقیم'
                              : newType === 'mobile'
                              ? 'همراه'
                              : newType === 'fax'
                              ? 'فکس'
                              : 'تلفن';
                          setPhonesList(updated);
                        }}
                        className="w-28 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      >
                        <option value="extension">داخلی</option>
                        <option value="office">مستقیم</option>
                        <option value="mobile">همراه</option>
                        <option value="fax">فکس</option>
                      </select>

                      <input
                        type="text"
                        placeholder="شماره تماس"
                        value={p.number}
                        onChange={(e) => {
                          const updated = [...phonesList];
                          updated[idx].number = e.target.value;
                          setPhonesList(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono"
                        dir="ltr"
                      />

                      <button
                        type="button"
                        onClick={() => setPhonesList(phonesList.filter((_, i) => i !== idx))}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  پست الکترونیک
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="مثال: name@org.ir"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                  dir="ltr"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  یادداشت و توضیحات تکمیلی
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading ? 'در حال ثبت...' : editingEmp ? 'ذخیره تغییرات' : 'افزودن کارمند'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Profile Modal */}
      {selectedProfileEmp && (
        <EmployeeProfileModal
          employee={selectedProfileEmp}
          fields={fields}
          departments={departments}
          positions={positions}
          locations={locations}
          onClose={() => setSelectedProfileEmp(null)}
          onDuplicate={async (emp) => {
            setSelectedProfileEmp(null);
            await handleDuplicate(emp);
          }}
        />
      )}
    </div>
  );
};
