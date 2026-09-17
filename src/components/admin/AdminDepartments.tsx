import React, { useState } from 'react';
import { Department, Employee, Position } from '../../types.ts';
import { api } from '../../utils/api.ts';
import { toPersianDigits } from '../../utils/shamsi.ts';
import { MeteorAvatar } from '../MeteorAvatar.tsx';
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Info,
  Printer,
  Award,
  Phone,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface AdminDepartmentsProps {
  departments: Department[];
  employees: Employee[];
  positions?: Position[];
  onRefresh: () => void;
}

export const AdminDepartments: React.FC<AdminDepartmentsProps> = ({
  departments,
  employees,
  positions = [],
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [targetReassignDeptId, setTargetReassignDeptId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Employee Print Order State
  const [orderingDept, setOrderingDept] = useState<Department | null>(null);
  const [deptEmployeesList, setDeptEmployeesList] = useState<Employee[]>([]);
  const [isOrderingSaving, setIsOrderingSaving] = useState(false);
  const [orderingSuccess, setOrderingSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    code: '',
    display_order: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const posMap = new Map(positions.map((p) => [p.id, p]));

  // Calculate employee count per department
  const empCountMap = new Map<string, number>();
  employees.forEach((emp) => {
    if (emp.department_id) {
      empCountMap.set(emp.department_id, (empCountMap.get(emp.department_id) || 0) + 1);
    }
  });

  const openAddModal = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: `D${(departments.length + 1).toString().padStart(2, '0')}`,
      display_order: departments.length + 1,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      display_order: dept.display_order ?? (departments.findIndex((d) => d.id === dept.id) + 1),
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEmployeeOrderModal = (dept: Department) => {
    setOrderingDept(dept);
    const inDept = employees.filter((e) => e.department_id === dept.id);
    const sorted = [...inDept].sort((a, b) => {
      const orderA = a.print_order !== undefined && a.print_order !== null ? a.print_order : 99999;
      const orderB = b.print_order !== undefined && b.print_order !== null ? b.print_order : 99999;
      if (orderA !== orderB) return orderA - orderB;
      const extA = parseInt((a.extension || '').replace(/\D/g, ''), 10) || 99999;
      const extB = parseInt((b.extension || '').replace(/\D/g, ''), 10) || 99999;
      if (extA !== extB) return extA - extB;
      return (a.last_name || '').localeCompare(b.last_name || '', 'fa');
    });
    setDeptEmployeesList(sorted);
    setOrderingSuccess(null);
    setError(null);
  };

  const moveEmpOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= deptEmployeesList.length) return;
    const newList = [...deptEmployeesList];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    setDeptEmployeesList(newList);
  };

  const sortEmployeesByExt = () => {
    const sorted = [...deptEmployeesList].sort((a, b) => {
      const extA = parseInt((a.extension || '').replace(/\D/g, ''), 10) || 99999;
      const extB = parseInt((b.extension || '').replace(/\D/g, ''), 10) || 99999;
      if (extA !== extB) return extA - extB;
      return (a.last_name || '').localeCompare(b.last_name || '', 'fa');
    });
    setDeptEmployeesList(sorted);
  };

  const sortEmployeesByName = () => {
    const sorted = [...deptEmployeesList].sort((a, b) =>
      (a.last_name || '').localeCompare(b.last_name || '', 'fa')
    );
    setDeptEmployeesList(sorted);
  };

  const moveManagerToTop = () => {
    if (!orderingDept) return;
    // Find manager if department has manager_id
    const mgrId = orderingDept.manager_id;
    if (!mgrId) return;
    const mgrIndex = deptEmployeesList.findIndex((e) => e.id === mgrId);
    if (mgrIndex <= 0) return;
    const newList = [...deptEmployeesList];
    const [mgr] = newList.splice(mgrIndex, 1);
    newList.unshift(mgr);
    setDeptEmployeesList(newList);
  };

  const handleSaveEmployeeOrder = async () => {
    if (!orderingDept) return;
    setIsOrderingSaving(true);
    setError(null);
    try {
      const orderedIds = deptEmployeesList.map((e) => e.id);
      await api.updateDepartmentEmployeeOrder(orderingDept.id, orderedIds);
      setOrderingSuccess(`اولویت چاپ کارکنان واحد «${orderingDept.name}» با موفقیت ذخیره شد.`);
      onRefresh();
      setTimeout(() => {
        setOrderingDept(null);
        setOrderingSuccess(null);
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره ترتیب کارکنان در چاپ');
    } finally {
      setIsOrderingSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: formData.name?.trim(),
        code: formData.code?.trim(),
        display_order: formData.display_order ? Number(formData.display_order) : departments.length + 1,
      };

      if (editingDept) {
        await api.updateDepartment(editingDept.id, payload);
        setSuccess(`واحد سازمانی «${formData.name}» با موفقیت به‌روزرسانی شد.`);
      } else {
        await api.createDepartment(payload);
        setSuccess(`واحد سازمانی جدید «${formData.name}» با موفقیت ایجاد گردید.`);
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت واحد سازمانی');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (dept: Department) => {
    setDeptToDelete(dept);
    setTargetReassignDeptId('');
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteDepartment(deptToDelete.id, {
        targetDepartmentId: targetReassignDeptId || undefined,
      });
      setSuccess(`واحد سازمانی «${deptToDelete.name}» با موفقیت حذف گردید.`);
      setDeptToDelete(null);
      onRefresh();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف واحد سازمانی');
    } finally {
      setIsDeleting(false);
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= departments.length) return;

    const newOrder = [...departments];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    try {
      await api.reorderDepartments(newOrder.map((d) => d.id));
      onRefresh();
    } catch (err: any) {
      setError('خطا در ذخیره ترتیب واحدها');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Priority & Architecture Notice */}
      <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0">
          <Printer className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
            اولویت‌بندی واحدهای سازمانی و چینش کارکنان در چاپ
          </h4>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5 leading-relaxed">
            واحدهای سازمانی با رتبه بالاتر در دفترچه تلفن چاپی زودتر از سایر واحدها چاپ می‌شوند. علاوه بر این، با کلیک روی دکمه «ترتیب کارکنان در چاپ»، می‌توانید اولویت و رتبه تک‌تک نفرات هر واحد را مشخص کنید تا در خروجی چاپی دقیقاً به همان ترتیبی که مدنظرتان است (مثلاً مدیر و مسئولین در صدر) قرار گیرند.
          </p>
        </div>
      </div>

      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            فهرست واحدهای سازمانی ({toPersianDigits(departments.length)} واحد)
          </h3>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف واحد جدید</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Departments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <th className="py-3 px-3.5 text-center w-20">ترتیب چاپ</th>
                <th className="py-3 px-3.5 w-24">کد واحد</th>
                <th className="py-3 px-3.5">نام واحد سازمانی</th>
                <th className="py-3 px-3.5 text-center w-24">رتبه اولویت</th>
                <th className="py-3 px-3.5 text-center w-48">اولویت نفرات در چاپ</th>
                <th className="py-3 px-3.5 text-center w-24">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {departments.map((dept, index) => {
                const count = empCountMap.get(dept.id) || 0;
                const orderVal = dept.display_order ?? (index + 1);
                return (
                  <tr key={dept.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Order up/down */}
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveOrder(index, 'up')}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-20 cursor-pointer"
                          title="انتقال به بالا (اولویت بیشتر در چاپ)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === departments.length - 1}
                          onClick={() => moveOrder(index, 'down')}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-20 cursor-pointer"
                          title="انتقال به پایین (اولویت کمتر در چاپ)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {dept.code}
                    </td>

                    <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">
                      {dept.name}
                    </td>

                    {/* Department Order Badge */}
                    <td className="py-2.5 px-3.5 text-center">
                      <span className="inline-flex items-center font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                        {toPersianDigits(orderVal)}
                      </span>
                    </td>

                    {/* Set Employee Order in Print Button */}
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => openEmployeeOrderModal(dept)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200/60 dark:border-indigo-800/60 transition-all cursor-pointer shadow-2xs"
                        title="مشخص کردن ترتیب و رتبه کارکنان این واحد در خروجی چاپی"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>ترتیب کارکنان در چاپ ({toPersianDigits(count)})</span>
                      </button>
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(dept)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                          title="ویرایش مشخصات و اولویت واحد"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(dept)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                          title="حذف واحد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Order in Print Modal */}
      {orderingDept && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Printer className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    تنظیم اولویت و ترتیب کارکنان در چاپ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    واحد سازمانی: <span className="font-bold text-indigo-600 dark:text-indigo-400">{orderingDept.name}</span> ({toPersianDigits(deptEmployeesList.length)} نفر)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderingDept(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation & Quick Action Tools */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <p className="text-indigo-900 dark:text-indigo-200 leading-relaxed">
                کارکنانی که در ردیف‌های بالاتر قرار می‌گیرند (رتبه ۱، ۲، ...)، در دفترچه تلفن چاپی زودتر و بالاتر از بقیه اعضای این واحد چاپ خواهند شد.
              </p>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {orderingDept.manager_id && (
                  <button
                    type="button"
                    onClick={moveManagerToTop}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer text-[11px] flex items-center gap-1"
                    title="انتقال مدیر به ابتدای فهرست"
                  >
                    <Award className="w-3 h-3 text-amber-500" />
                    <span>مدیر به اول</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={sortEmployeesByExt}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 cursor-pointer text-[11px] flex items-center gap-1"
                  title="چیدمان بر اساس شماره داخلی"
                >
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>بر اساس داخلی</span>
                </button>
                <button
                  type="button"
                  onClick={sortEmployeesByName}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 cursor-pointer text-[11px] flex items-center gap-1"
                  title="چیدمان الفبایی بر اساس نام خانوادگی"
                >
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  <span>الفبایی</span>
                </button>
              </div>
            </div>

            {orderingSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{orderingSuccess}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Employee List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              {deptEmployeesList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  هیچ کارمندی در این واحد سازمانی ثبت نشده است.
                </div>
              ) : (
                deptEmployeesList.map((emp, idx) => {
                  const pos = posMap.get(emp.position_id || '');
                  const isManager = emp.id === orderingDept.manager_id || emp.is_head_of_department;
                  return (
                    <div
                      key={emp.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-white dark:hover:bg-slate-800/80 transition-colors"
                    >
                      {/* Left: Rank & Move Buttons */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center justify-center">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveEmpOrder(idx, 'up')}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-20 cursor-pointer"
                            title="یک رتبه بالاتر در چاپ"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === deptEmployeesList.length - 1}
                            onClick={() => moveEmpOrder(idx, 'down')}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-20 cursor-pointer"
                            title="یک رتبه پایین‌تر در چاپ"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Rank Badge */}
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-bold font-mono text-xs flex items-center justify-center">
                          {toPersianDigits(idx + 1)}
                        </div>
                      </div>

                      {/* Center: Employee Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <MeteorAvatar
                          src={emp.avatar}
                          name={`${emp.first_name || ''} ${emp.last_name || ''}`}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {emp.first_name} {emp.last_name}
                            </span>
                            {isManager && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200/60 dark:border-amber-800/40">
                                <Award className="w-3 h-3 text-amber-500" />
                                مدیر واحد
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{pos?.title || emp.custom_fields?.job_title || 'کارمند'}</span>
                            {emp.personnel_code && (
                              <>
                                <span>•</span>
                                <span className="font-mono">کد: {toPersianDigits(emp.personnel_code)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Phone Extensions */}
                      <div className="flex items-center gap-2 text-left shrink-0">
                        {emp.extension ? (
                          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                            داخلی {toPersianDigits(emp.extension)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">-</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ترتیب فوق مستقیماً در تولید صفحات چاپ، PDF و دفترچه تلفن اعمال می‌گردد.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderingDept(null)}
                  disabled={isOrderingSaving}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveEmployeeOrder}
                  disabled={isOrderingSaving || deptEmployeesList.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isOrderingSaving ? 'در حال ذخیره ترتیب...' : 'ذخیره اولویت‌های چاپ'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingDept ? `ویرایش واحد: ${editingDept.name}` : 'تعریف واحد سازمانی جدید'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام واحد سازمانی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: مدیریت فناوری اطلاعات و امنیت فضای مجازی"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  کد واحد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    رتبه و اولویت واحد در چاپ
                  </label>
                  <span className="text-[10px] text-slate-400">
                    عدد کمتر = اولویت بالاتر در چاپ
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={formData.display_order ?? ''}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 1 })}
                  placeholder="مثال: ۱"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  واحدهای سازمانی با اولویت کمتر، در دفترچه تلفن چاپی زودتر از سایر واحدها چاپ می‌شوند.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'در حال ثبت...' : editingDept ? 'ذخیره تغییرات' : 'ایجاد واحد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  حذف واحد سازمانی «{deptToDelete.name}»
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {(empCountMap.get(deptToDelete.id) || 0) > 0 ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                  <span className="font-bold block mb-1">
                    توجه: این واحد سازمانی شامل {toPersianDigits(empCountMap.get(deptToDelete.id) || 0)} نفر از کارکنان است.
                  </span>
                  می‌توانید کارکنان این واحد را به یکی دیگر از واحدهای سازمانی منتقل کنید، یا در صورت تمایل آنها را بدون واحد (آزاد) بگذارید.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    انتقال کارکنان به واحد سازمانی:
                  </label>
                  <select
                    value={targetReassignDeptId}
                    onChange={(e) => setTargetReassignDeptId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="">بدون واحد (تخلیه واحد و عدم انتقال به واحد دیگر)</option>
                    {departments
                      .filter((d) => d.id !== deptToDelete.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                آیا از حذف کامل واحد سازمانی «<span className="font-bold text-slate-800 dark:text-slate-200">{deptToDelete.name}</span>» با کد «{deptToDelete.code}» اطمینان دارید؟
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeleting ? 'در حال حذف...' : 'تأیید و حذف واحد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
