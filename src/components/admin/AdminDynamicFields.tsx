import React, { useState } from 'react';
import { DynamicFieldDefinition, FieldType } from '../../types.ts';
import { api } from '../../utils/api.ts';
import { toPersianDigits } from '../../utils/shamsi.ts';
import {
  Sliders,
  Plus,
  ArrowUp,
  ArrowDown,
  Lock,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Settings2,
} from 'lucide-react';

interface AdminDynamicFieldsProps {
  fields: DynamicFieldDefinition[];
  onRefresh: () => void;
}

export const AdminDynamicFields: React.FC<AdminDynamicFieldsProps> = ({ fields, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New field form state
  const [newField, setNewField] = useState({
    internal_name: '',
    persian_label: '',
    type: 'text' as FieldType,
    required: false,
    searchable: true,
    filterable: true,
    visible: true,
    importable: true,
    exportable: true,
    active: true,
    optionsText: '',
  });

  const sortedFields = [...fields].sort((a, b) => a.display_order - b.display_order);

  const handleToggle = async (field: DynamicFieldDefinition, key: keyof DynamicFieldDefinition) => {
    try {
      const updatedVal = !field[key];
      await api.updateField(field.id, { [key]: updatedVal });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'خطا در به‌روزرسانی وضعیت فیلد');
    }
  };

  const moveField = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedFields.length) return;

    const reordered = [...sortedFields];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    try {
      await api.reorderFields(reordered.map((f) => f.id));
      onRefresh();
    } catch (err: any) {
      alert('خطا در ذخیره ترتیب فیلدها');
    }
  };

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const options =
        newField.type === 'select' || newField.type === 'multi_select'
          ? newField.optionsText.split('\n').map((s) => s.trim()).filter(Boolean)
          : undefined;

      await api.createField({
        internal_name: newField.internal_name.trim().toLowerCase().replace(/\s+/g, '_'),
        persian_label: newField.persian_label.trim(),
        type: newField.type,
        required: newField.required,
        searchable: newField.searchable,
        filterable: newField.filterable,
        visible: newField.visible,
        importable: newField.importable,
        exportable: newField.exportable,
        active: newField.active,
        options,
      });

      setSuccess(`فیلد جدید «${newField.persian_label}» با موفقیت افزوده شد.`);
      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'خطا در ایجاد فیلد پویا');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (field: DynamicFieldDefinition) => {
    if (field.is_system) {
      alert('فیلدهای سیستمی پایه غیرقابل حذف می‌باشند.');
      return;
    }
    if (!confirm(`آیا از حذف فیلد «${field.persian_label}» اطمینان دارید؟`)) return;

    try {
      await api.deleteField(field.id);
      setSuccess(`فیلد «${field.persian_label}» حذف شد.`);
      onRefresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در حذف فیلد');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>مدیریت ساختار فیلدهای پویا (Dynamic Fields Engine)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تغییر ترتیب نمایش، قابلیت جستجو، فیلتر و افزودن فیلدهای سفارشی بدون نیاز به کدنویسی
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewField({
              internal_name: '',
              persian_label: '',
              type: 'text',
              required: false,
              searchable: true,
              filterable: true,
              visible: true,
              importable: true,
              exportable: true,
              active: true,
              optionsText: '',
            });
            setError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف فیلد جدید</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Fields Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <th className="py-3 px-3 text-center w-14">ترتیب</th>
                <th className="py-3 px-3.5">عنوان فارسی</th>
                <th className="py-3 px-3.5">کلید انگلیسی</th>
                <th className="py-3 px-3.5">نوع فیلد</th>
                <th className="py-3 px-2 text-center">نمایش در لیست</th>
                <th className="py-3 px-2 text-center">قابل جستجو</th>
                <th className="py-3 px-2 text-center">قابل فیلتر</th>
                <th className="py-3 px-2 text-center">اجباری</th>
                <th className="py-3 px-2 text-center">فعال</th>
                <th className="py-3 px-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedFields.map((field, index) => (
                <tr key={field.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Order controls */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveField(index, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="انتقال به بالا"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === sortedFields.length - 1}
                        onClick={() => moveField(index, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="انتقال به پایین"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      {field.is_system && (
                        <span title="فیلد سیستمی">
                          <Lock className="w-3 h-3 text-slate-400" />
                        </span>
                      )}
                      <span>{field.persian_label}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3.5 font-mono text-slate-500 dark:text-slate-400">
                    {field.internal_name}
                  </td>

                  <td className="py-2.5 px-3.5 font-semibold text-purple-600 dark:text-purple-400">
                    {field.type}
                  </td>

                  {/* Visible switch */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(field, 'visible')}
                      className={`p-1 rounded-lg ${
                        field.visible ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'text-slate-300'
                      }`}
                    >
                      {field.visible ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Searchable switch */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(field, 'searchable')}
                      className={`p-1 rounded-lg ${
                        field.searchable ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'text-slate-300'
                      }`}
                    >
                      {field.searchable ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Filterable switch */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(field, 'filterable')}
                      className={`p-1 rounded-lg ${
                        field.filterable ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' : 'text-slate-300'
                      }`}
                    >
                      {field.filterable ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Required switch */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      disabled={field.is_system && ['full_name', 'department_id'].includes(field.internal_name)}
                      onClick={() => handleToggle(field, 'required')}
                      className={`p-1 rounded-lg ${
                        field.required ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' : 'text-slate-300'
                      }`}
                    >
                      {field.required ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Active switch */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(field, 'active')}
                      className={`p-1 rounded-lg ${
                        field.active ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'text-slate-300'
                      }`}
                    >
                      {field.active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3.5 text-center">
                    {!field.is_system ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="حذف فیلد سفارشی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">سیستمی</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for creating custom field */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">تعریف فیلد پویای جدید</h3>
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

            <form onSubmit={handleCreateField} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان فارسی فیلد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newField.persian_label}
                  onChange={(e) => setNewField({ ...newField, persian_label: e.target.value })}
                  placeholder="مثال: کد ملی، شناسه پرسنلی قدیم، مدرک تحصیلی..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام کلید انگلیسی (شناسه) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newField.internal_name}
                    onChange={(e) => setNewField({ ...newField, internal_name: e.target.value })}
                    placeholder="مثال: national_code"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع داده (Field Type) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newField.type}
                    onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="text">متن کوتاه (Text)</option>
                    <option value="long_text">متن چندخطی (Long Text)</option>
                    <option value="number">عدد (Number)</option>
                    <option value="phone">تلفن ثابت (Phone)</option>
                    <option value="mobile">شماره همراه (Mobile)</option>
                    <option value="email">پست الکترونیک (Email)</option>
                    <option value="url">پیوند اینترنتی (URL)</option>
                    <option value="date">تاریخ (Date)</option>
                    <option value="datetime">تاریخ و زمان (DateTime)</option>
                    <option value="boolean">بله / خیر (Boolean)</option>
                    <option value="select">انتخاب تک‌گزینه‌ای (Select)</option>
                    <option value="multi_select">چند انتخابی (Multi Select)</option>
                  </select>
                </div>
              </div>

              {(newField.type === 'select' || newField.type === 'multi_select') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    گزینه‌ها (هر خط یک گزینه)
                  </label>
                  <textarea
                    rows={3}
                    value={newField.optionsText}
                    onChange={(e) => setNewField({ ...newField, optionsText: e.target.value })}
                    placeholder="کارشناسی&#10;کارشناسی ارشد&#10;دکتری"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
              )}

              {/* Switches */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.visible}
                    onChange={(e) => setNewField({ ...newField, visible: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>نمایش در جدول اصلی</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.searchable}
                    onChange={(e) => setNewField({ ...newField, searchable: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>قابل جستجو</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.filterable}
                    onChange={(e) => setNewField({ ...newField, filterable: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>قابل فیلتر پویا</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>تکمیل فیلد اجباری است</span>
                </label>
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
                  {loading ? 'در حال ایجاد...' : 'افزودن فیلد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
