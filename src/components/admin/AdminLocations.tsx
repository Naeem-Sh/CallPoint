import React, { useState } from 'react';
import { LocationItem, Employee } from '../../types.ts';
import { api } from '../../utils/api.ts';
import { toPersianDigits } from '../../utils/shamsi.ts';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Users,
  Search,
  Building2,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowUp,
  ArrowDown,
  Printer,
  Info,
} from 'lucide-react';

interface AdminLocationsProps {
  locations: LocationItem[];
  employees: Employee[];
  onRefresh: () => void;
}

export const AdminLocations: React.FC<AdminLocationsProps> = ({
  locations,
  employees,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<LocationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<Partial<LocationItem>>({
    building: '',
    display_order: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Employee count per location
  const empCountMap = new Map<string, number>();
  employees.forEach((emp) => {
    if (emp.location_id) {
      empCountMap.set(emp.location_id, (empCountMap.get(emp.location_id) || 0) + 1);
    }
  });

  const filteredLocations = locations.filter((loc) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (loc.building && loc.building.toLowerCase().includes(term)) ||
      (loc.name && loc.name.toLowerCase().includes(term))
    );
  });

  const openAddModal = () => {
    setEditingLocation(null);
    setFormData({
      building: '',
      display_order: locations.length + 1,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (loc: LocationItem) => {
    setEditingLocation(loc);
    setFormData({
      building: loc.building || loc.name || '',
      display_order: loc.display_order ?? (locations.findIndex((l) => l.id === loc.id) + 1),
    });
    setError(null);
    setIsModalOpen(true);
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= locations.length) return;

    const newOrder = [...locations];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    try {
      await api.reorderLocations(newOrder.map((l) => l.id));
      onRefresh();
    } catch (err: any) {
      setError('خطا در ذخیره ترتیب ساختمان‌ها');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const b = formData.building?.trim() || '';

    if (!b) {
      setError('نام ساختمان را وارد کنید.');
      return;
    }

    const payload = {
      name: b,
      building: b,
      unit: '',
      floor: '',
      room: '',
      display_order: formData.display_order ? Number(formData.display_order) : locations.length + 1,
      active: true,
    };

    setError(null);
    setLoading(true);

    try {
      if (editingLocation) {
        await api.updateLocation(editingLocation.id, payload);
        setSuccess(`محل استقرار با موفقیت ویرایش شد.`);
      } else {
        await api.createLocation(payload);
        setSuccess(`محل استقرار جدید با موفقیت افزوده شد.`);
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت محل استقرار');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!locationToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteLocation(locationToDelete.id);
      setSuccess(`محل استقرار با موفقیت حذف گردید.`);
      setLocationToDelete(null);
      onRefresh();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف محل استقرار');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalStationed = employees.filter((e) => Boolean(e.location_id)).length;
  const distinctBuildings = new Set(locations.map((l) => l.building?.trim()).filter(Boolean)).size;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Notifications */}
      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && !isModalOpen && !locationToDelete && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1">
              کل محل‌های استقرار
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {toPersianDigits(locations.length)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1">
              تعداد ساختمان‌ها
            </span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {toPersianDigits(distinctBuildings)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1">
              پرسنل مستقر در محل‌ها
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {toPersianDigits(totalStationed)} نفر
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Priority & Print Guidance Banner */}
      <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0">
          <Printer className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
            اولویت‌بندی ساختمان‌ها در چاپ و خروجی‌ها
          </h4>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5 leading-relaxed">
            ترتیب ساختمان‌ها و محل‌های استقرار تعیین‌کننده چینش آن‌ها در دفترچه تلفن چاپی است. هرچه رتبه ساختمانی بالاتر باشد (ردیف‌های بالاتر)، در چاپ زودتر و بالاتر نمایش داده خواهد شد. با استفاده از دکمه‌های بالا / پایین یا ویرایش رتبه عددی می‌توانید اولویت دلخواه را تنظیم کنید.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Actions Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام ساختمان..."
              className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن محل استقرار جدید</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-3 px-4 w-24 text-center">ترتیب چاپ</th>
                <th className="py-3 px-4">نام ساختمان / محل استقرار</th>
                <th className="py-3 px-4 text-center w-28">رتبه اولویت</th>
                <th className="py-3 px-4 text-center">تعداد پرسنل مستقر</th>
                <th className="py-3 px-4 text-center w-28">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    محل استقراری یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc, idx) => {
                  const empCount = empCountMap.get(loc.id) || 0;
                  const orderVal = loc.display_order ?? (idx + 1);
                  return (
                    <tr
                      key={loc.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Order Controls */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0 || searchTerm.trim() !== ''}
                            onClick={() => moveOrder(idx, 'up')}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-20 cursor-pointer"
                            title="انتقال به بالا (اولویت بیشتر در چاپ)"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === filteredLocations.length - 1 || searchTerm.trim() !== ''}
                            onClick={() => moveOrder(idx, 'down')}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-20 cursor-pointer"
                            title="انتقال به پایین (اولویت کمتر در چاپ)"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {loc.building || loc.name || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Display Order Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                          {toPersianDigits(orderVal)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <Users className="w-3 h-3 text-slate-400" />
                          {toPersianDigits(empCount)} نفر
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(loc)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                            title="ویرایش محل استقرار و اولویت"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLocationToDelete(loc);
                              setError(null);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                            title="حذف محل استقرار"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <MapPin className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingLocation ? 'ویرایش محل استقرار' : 'افزودن محل استقرار جدید'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
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

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام ساختمان / محل استقرار <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.building || ''}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="مثال: ساختمان مرکزی / ساختمان فنی / سوله تدارکات"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    رتبه و اولویت در چاپ
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  ساختمان‌هایی که عدد اولویت کمتری دارند در چاپ و گزارش‌ها زودتر نمایش داده می‌شوند.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'در حال ثبت...' : editingLocation ? 'ذخیره تغییرات' : 'افزودن محل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {locationToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  حذف محل استقرار «{locationToDelete.building || locationToDelete.name}»
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLocationToDelete(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(empCountMap.get(locationToDelete.id) || 0) > 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                <span className="font-bold block mb-1">
                  توجه: تعداد {toPersianDigits(empCountMap.get(locationToDelete.id) || 0)} پرسنل در این محل مستقر هستند.
                </span>
                با حذف این محل استقرار، فیلد محل استقرار این پرسنل به‌صورت خودکار خالی می‌شود.
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                آیا از حذف کامل محل استقرار «<span className="font-bold text-slate-800 dark:text-slate-200">{locationToDelete.building || locationToDelete.name}</span>» اطمینان دارید؟
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setLocationToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'در حال حذف...' : 'تأیید و حذف محل استقرار'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
