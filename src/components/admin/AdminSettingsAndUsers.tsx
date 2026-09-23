import React, { useState, useEffect } from 'react';
import { AppSettings, AppUser } from '../../types.ts';
import { api } from '../../utils/api.ts';
import { setDefaultAvatar } from '../../utils/image.ts';
import {
  Building2,
  Upload,
  Trash2,
  Users,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Save,
  RotateCcw,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  UserX,
  Lock,
  X,
  User,
  Image as ImageIcon,
  Eye,
  Sun,
  Moon,
  Sparkles,
  Printer,
} from 'lucide-react';

interface AdminSettingsAndUsersProps {
  settings: AppSettings | null;
  onRefreshSettings: () => void;
  onOpenResetModal?: () => void;
}

export const AdminSettingsAndUsers: React.FC<AdminSettingsAndUsersProps> = ({
  settings,
  onRefreshSettings,
  onOpenResetModal,
}) => {
  const [formData, setFormData] = useState<Partial<AppSettings>>({
    header_title: 'دفتر تلفن',
    organization_name: '',
    subtitle: '',
    timezone: 'Asia/Tehran',
    session_timeout_minutes: 60,
    search_debounce_ms: 300,
  });

  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add User Modal State (NO first/last name required)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'editor' as 'admin' | 'editor',
  });

  // Change Password Modal State
  const [passwordModalUser, setPasswordModalUser] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({
        header_title: settings.header_title || 'دفتر تلفن',
        organization_name: settings.organization_name || '',
        subtitle: settings.subtitle || '',
        timezone: settings.timezone || 'Asia/Tehran',
        session_timeout_minutes: settings.session_timeout_minutes || 60,
        search_debounce_ms: settings.search_debounce_ms || 300,
      });
      setPreviewLogoUrl(settings.logo_url || null);
    }
    fetchUsers();
  }, [settings]);

  const fetchUsers = async () => {
    try {
      const res = await api.getUsers();
      if (Array.isArray(res)) {
        setUsers(res);
      } else if (res && Array.isArray(res.users)) {
        setUsers(res.users);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.updateSettings(formData);
      setSuccess('تنظیمات کلی سامانه با موفقیت ذخیره شد.');
      onRefreshSettings();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview for zero-delay visual feedback
    const objectUrl = URL.createObjectURL(file);
    setPreviewLogoUrl(objectUrl);

    const fd = new FormData();
    fd.append('logo', file);

    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadLogo(fd);
      setSuccess('لوگوی سازمان با موفقیت به‌روزرسانی شد.');
      if (res && res.logo_url) {
        setPreviewLogoUrl(res.logo_url);
      }
      onRefreshSettings();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری لوگو');
      setPreviewLogoUrl(settings?.logo_url || null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('آیا از حذف لوگوی اختصاصی سازمان اطمینان دارید؟')) return;

    setPreviewLogoUrl(null);
    setLoading(true);
    setError(null);
    try {
      await api.deleteLogo();
      setSuccess('لوگوی اختصاصی حذف گردید و نشان پیش‌فرض فعال شد.');
      onRefreshSettings();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف لوگو');
      setPreviewLogoUrl(settings?.logo_url || null);
    } finally {
      setLoading(false);
    }
  };

  const handleDefaultAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('default_avatar', file);

    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadDefaultAvatar(fd);
      setDefaultAvatar(res.default_avatar);
      setSuccess('تصویر پیش‌فرض پروفایل کارکنان با موفقیت به‌روزرسانی شد.');
      onRefreshSettings();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری تصویر پیش‌فرض کارکنان');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDefaultAvatar = async () => {
    if (!confirm('آیا از حذف تصویر پیش‌فرض کارکنان و بازگشت به حروف اول نام اطمینان دارید؟')) return;

    setLoading(true);
    setError(null);
    try {
      await api.deleteDefaultAvatar();
      setDefaultAvatar(null);
      setSuccess('تصویر پیش‌فرض حذف شد و حالت نمایش حروف اول نام فعال گردید.');
      onRefreshSettings();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف تصویر پیش‌فرض');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddUser = () => {
    setNewUser({ username: '', password: '', role: 'editor' });
    setIsUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.password.trim()) {
      setError('نام کاربری و کلمه عبور الزامی است.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createUser({
        username: newUser.username.trim(),
        password: newUser.password.trim(),
        role: newUser.role,
      });
      setSuccess(`کاربر «${newUser.username.trim()}» با نقش ${newUser.role === 'admin' ? 'مدیر ارشد' : 'ویرایشگر'} ایجاد شد.`);
      setIsUserModalOpen(false);
      setNewUser({ username: '', password: '', role: 'editor' });
      await fetchUsers();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در ایجاد کاربر');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'editor') => {
    setUpdatingUserId(userId);
    setError(null);
    try {
      await api.updateUser(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setSuccess(`سطح دسترسی کاربر به «${newRole === 'admin' ? 'مدیر ارشد' : 'ویرایشگر'}» تغییر یافت.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'خطا در تغییر نقش کاربر');
      await fetchUsers();
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleUserActive = async (user: AppUser) => {
    const nextState = !user.active;
    setUpdatingUserId(user.id);
    setError(null);
    try {
      await api.updateUser(user.id, { active: nextState });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: nextState } : u))
      );
      setSuccess(`وضعیت حساب «${user.username}» به ${nextState ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'خطا در تغییر وضعیت کاربر');
      await fetchUsers();
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPassword.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await api.updateUser(passwordModalUser.id, { password: newPassword.trim() });
      setSuccess(`رمز عبور کاربر «${passwordModalUser.username}» با موفقیت به‌روزرسانی شد.`);
      setPasswordModalUser(null);
      setNewPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'خطا در تغییر رمز عبور');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (!confirm(`آیا از حذف حساب کاربری «${user.username}» اطمینان کامل دارید؟`)) return;

    setUpdatingUserId(user.id);
    setError(null);
    try {
      await api.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSuccess(`کاربر «${user.username}» با موفقیت حذف گردید.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف کاربر');
      await fetchUsers();
    } finally {
      setUpdatingUserId(null);
    }
  };

  const adminCount = users.filter((u) => u.role === 'admin' && u.active !== false).length;
  const editorCount = users.filter((u) => u.role === 'editor' && u.active !== false).length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-bold">{success}</span>
        </div>
      )}

      {/* ================= LIVE HEADER PREVIEW ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Preview Card Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  پیش‌نمایش زنده هدر صفحه اصلی
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  بروزرسانی همگام
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تغییرات عنوان، نام سازمان و نشان رسمی بلافاصله در پیش‌نمایش زیر قابل مشاهده است
              </p>
            </div>
          </div>

          {/* Theme preview toggle (Light / Dark) */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              بررسی در پوسته:
            </span>
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setPreviewTheme('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewTheme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="نمایش در حالت روشن"
              >
                <Sun className={`w-3.5 h-3.5 ${previewTheme === 'light' ? 'text-amber-500' : ''}`} />
                <span>روشن</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewTheme === 'dark'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="نمایش در حالت تاریک"
              >
                <Moon className={`w-3.5 h-3.5 ${previewTheme === 'dark' ? 'text-indigo-400' : ''}`} />
                <span>تاریک</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Header Simulation Frame */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="mr-2 font-sans font-medium text-slate-500 dark:text-slate-400">سربرگ بالای صفحه اصلی سامانه</span>
            </span>
            <span className="dir-ltr text-slate-400 font-medium">Header Component Preview</span>
          </div>

          <div
            className={`rounded-2xl border transition-colors duration-200 shadow-sm overflow-hidden p-3.5 sm:p-5 ${
              previewTheme === 'dark'
                ? 'bg-slate-900/95 border-slate-800 text-white'
                : 'bg-white/95 border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Logo & Titles */}
              <div className="flex items-center gap-3.5 sm:gap-4 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  {previewLogoUrl ? (
                    <img
                      src={previewLogoUrl}
                      alt="لوگوی سازمان"
                      referrerPolicy="no-referrer"
                      className="h-14 w-auto max-w-[90px] sm:h-16 sm:max-w-[120px] object-contain shrink-0 select-none transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 border-2 border-indigo-500/30 shrink-0 transition-transform hover:scale-105">
                      <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-100" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center flex-wrap gap-x-2">
                        <span>{formData.header_title?.trim() || 'دفتر تلفن'}</span>
                        {formData.organization_name?.trim() ? (
                          <span className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">
                            | {formData.organization_name.trim()}
                          </span>
                        ) : null}
                      </h1>
                    </div>
                    <p
                      className={`text-xs sm:text-sm font-semibold mt-0.5 max-w-[260px] sm:max-w-lg truncate ${
                        previewTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {formData.subtitle?.trim() || (formData.organization_name?.trim() ? 'سامانه جامع راهنمای تلفن و اطلاعات کارکنان' : 'سامانه جامع راهنمای تلفن و اطلاعات کارکنان')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulated Action Controls */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    previewTheme === 'dark'
                      ? 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>چاپ</span>
                </div>

                <div
                  className={`p-2 rounded-xl border ${
                    previewTheme === 'dark'
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {previewTheme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs">
                  مدیریت
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Note */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>با تغییر عنوان، نام سازمان، زیرعنوان یا بارگذاری نشان در فرم زیر، پیش‌نمایش بالا بی‌درنگ به‌روز می‌شود.</span>
          </div>
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            تغییرات با کلیک روی «ذخیره تنظیمات سازمان» نهایی خواهند شد.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Organization Brand & Logo */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                هویت و اطلاعات سازمانی
              </h3>
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/50">
              متصل به پیش‌نمایش زنده
            </span>
          </div>

          {/* 1. Organization Logo */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              نشان و لوگوی رسمی سازمان
            </label>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
              {previewLogoUrl || settings?.logo_url ? (
                <img
                  src={previewLogoUrl || settings?.logo_url || ''}
                  alt="لوگو"
                  className="w-16 h-16 object-contain select-none bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
                  🏢
                </div>
              )}

              <div className="space-y-1.5 min-w-0">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>بارگذاری نشان جدید</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {(previewLogoUrl || settings?.logo_url) && (
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    className="block text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    حذف نشان و استفاده از نشان پیش‌فرض
                  </button>
                )}
                
                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 leading-relaxed pt-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">رزولوشن پیشنهادی:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">500×500</span>
                    <span>یا</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">600×200</span>
                    <span>پیکسل (حداقل 300×300)</span>
                  </div>
                  <div>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">فرمت‌های مجاز:</span>
                    <span className="font-medium mr-1">PNG (پیشنهاد با پس‌زمینه شفاف)، SVG، JPG، WEBP (حداکثر ۱۰ مگابایت)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Default Employee Avatar Upload */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>تصویر پیش‌فرض پروفایل کارکنان (فاقد عکس)</span>
              </label>
              {settings?.default_avatar && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60">
                  فعال
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
              {settings?.default_avatar ? (
                <div className="relative group shrink-0">
                  <img
                    src={settings.default_avatar}
                    alt="تصویر پیش‌فرض کارکنان"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-full text-[9px]">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                  👤
                </div>
              )}

              <div className="space-y-1.5 min-w-0">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>بارگذاری تصویر پیش‌فرض کارکنان</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleDefaultAvatarUpload}
                    className="hidden"
                  />
                </label>

                {settings?.default_avatar && (
                  <button
                    type="button"
                    onClick={handleDeleteDefaultAvatar}
                    className="block text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    حذف تصویر پیش‌فرض و استفاده از حروف اول نام
                  </button>
                )}

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 leading-relaxed pt-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">رزولوشن پیشنهادی:</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">600×600</span>
                    <span>تا</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">800×800</span>
                    <span>پیکسل مربعی (حداقل 400×400)</span>
                  </div>
                  <div>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">فرمت‌های مجاز:</span>
                    <span className="font-medium mr-1">PNG، JPG، WEBP (حداکثر ۱۰ مگابایت)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-0.5">
                    این تصویر برای تمامی همکارانی که در پروفایل خود عکس ندارند یا عکس آن‌ها حذف شده است اعمال می‌شود.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>عنوان اصلی سربرگ (هدر)</span>
                <span className="text-[10px] text-slate-400 font-normal">پیش‌فرض: «دفتر تلفن»</span>
              </label>
              <input
                type="text"
                value={formData.header_title || ''}
                placeholder="دفتر تلفن"
                onChange={(e) => setFormData({ ...formData, header_title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نام رسمی سازمان
              </label>
              <input
                type="text"
                value={formData.organization_name || ''}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                زیرعنوان / شرح سامانه
              </label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  منطقه زمانی
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.timezone || 'Asia/Tehran'}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مدت اعتبار نشست (دقیقه)
                </label>
                <input
                  type="number"
                  value={formData.session_timeout_minutes || 60}
                  onChange={(e) => setFormData({ ...formData, session_timeout_minutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>ذخیره تنظیمات سازمان</span>
            </button>
          </form>
        </div>

        {/* User & Access Management Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  مدیریت کاربران و سطوح دسترسی
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  تغییر مستقیم سطح دسترسی (مدیر ارشد / ویرایشگر)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddUser}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کاربر</span>
            </button>
          </div>

          {/* User Role Statistics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">کل حساب‌ها</div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{users.length}</div>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/60 text-center">
              <div className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">مدیران ارشد</div>
              <div className="text-lg font-black text-purple-900 dark:text-purple-200 mt-0.5">{adminCount}</div>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/60 text-center">
              <div className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">ویرایشگران</div>
              <div className="text-lg font-black text-blue-900 dark:text-blue-200 mt-0.5">{editorCount}</div>
            </div>
          </div>

          {/* User List with Instant Role Switcher */}
          <div className="space-y-2.5">
            {users.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                هیچ کاربری یافت نشد.
              </div>
            ) : (
              users.map((u) => {
                const isBusy = updatingUserId === u.id;
                const isAdmin = u.role === 'admin';
                const isActive = u.active !== false;

                return (
                  <div
                    key={u.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-slate-50/80 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800'
                        : 'bg-slate-100/50 dark:bg-slate-900/50 border-slate-200/40 dark:border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isAdmin
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900 dark:text-white font-mono" dir="ltr">
                              {u.username}
                            </span>
                            {!isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold">
                                غیرفعال
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {isAdmin
                              ? 'دسترسی کامل (مدیریت، فیلدها، کاربران و بکاپ)'
                              : 'دسترسی ویرایش (کارکنان، شماره‌ها و اکسل)'}
                          </div>
                        </div>
                      </div>

                      {/* Role Switcher & Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Direct Segmented Role Switcher */}
                        <div className="inline-flex rounded-xl p-0.5 bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleRoleChange(u.id, 'admin')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                              isAdmin
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300'
                            }`}
                          >
                            مدیر ارشد
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleRoleChange(u.id, 'editor')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                              !isAdmin
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300'
                            }`}
                          >
                            ویرایشگر
                          </button>
                        </div>

                        {/* Password Reset */}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            setPasswordModalUser(u);
                            setNewPassword('');
                          }}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                          title="تغییر کلمه عبور این حساب"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Delete User */}
                        <button
                          type="button"
                          disabled={isBusy || (isAdmin && adminCount <= 1)}
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                          title={isAdmin && adminCount <= 1 ? 'امکان حذف تنها مدیر ارشد سامانه وجود ندارد' : 'حذف کاربر'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
            <span className="font-bold">راهنما:</span> با کلیک روی هر یک از دکمه‌های «مدیر ارشد» یا «ویرایشگر»، سطح دسترسی حساب کاربری بلافاصله به‌روزرسانی خواهد شد.
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Database */}
      {onOpenResetModal && (
        <div className="bg-rose-50/70 dark:bg-rose-950/20 rounded-3xl p-6 border border-rose-200 dark:border-rose-900/60 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-900 dark:text-rose-200">
                  منطقه حساس: بازنشانی کامل پایگاه داده (Reset All)
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-1 max-w-2xl leading-relaxed">
                  این عملیات کلیه کارکنان، شماره‌ها و فیلدهای ثبت‌شده را پاکسازی کرده و سامانه را برای ورود ساختاریافته فایل اکسل جدید آماده می‌کند.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenResetModal}
              className="w-full md:w-auto px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>بازنشانی پایگاه داده (Reset All)</span>
            </button>
          </div>
        </div>
      )}

      {/* Simplified User Create Modal (NO first/last name required) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-200"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  افزودن کاربر جدید
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام کاربری (لاتین)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثلاً modir یا editor2"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  کلمه عبور
                </label>
                <input
                  type="password"
                  required
                  placeholder="رمز عبور کاربر"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نقش دسترسی
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, role: 'editor' })}
                    className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                      newUser.role === 'editor'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center justify-between">
                      <span>ویرایشگر</span>
                      {newUser.role === 'editor' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      مدیریت کارکنان و اکسل
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                    className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                      newUser.role === 'admin'
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center justify-between">
                      <span>مدیر ارشد</span>
                      {newUser.role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      دسترسی کامل و کاربران
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  {loading ? 'در حال ثبت...' : 'ایجاد حساب کاربری'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-200"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  تغییر کلمه عبور «{passwordModalUser.username}»
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  کلمه عبور جدید
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="رمز جدید"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'در حال ذخیره...' : 'ذخیره کلمه عبور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
