import React from 'react';
import { BackgroundThemePicker } from './BackgroundThemePicker.tsx';
import { AppSettings, AppUser } from '../types.ts';
import { Phone, ShieldCheck, Sun, Moon, LogIn, LogOut, UserCheck, Building2, Printer } from 'lucide-react';

interface HeaderProps {
  settings: AppSettings | null;
  currentUser: AppUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onToggleAdmin: () => void;
  isAdminView: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenPrint?: () => void;
  bgThemeId?: string;
  onSelectBgTheme?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  onOpenLogin,
  onLogout,
  onToggleAdmin,
  isAdminView,
  theme,
  onToggleTheme,
  onOpenPrint,
  bgThemeId,
  onSelectBgTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo & Titles */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="لوگوی سازمان"
                  referrerPolicy="no-referrer"
                  className="h-14 w-auto max-w-[90px] sm:h-18 sm:max-w-[120px] object-contain shrink-0 select-none transition-transform hover:scale-105"
                />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 border-2 border-indigo-500/30 shrink-0 transition-transform hover:scale-105">
                  <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-100" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center flex-wrap gap-x-2">
                    <span>{settings?.header_title || 'دفتر تلفن'}</span>
                    {settings?.organization_name ? (
                      <span className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">
                        | {settings.organization_name}
                      </span>
                    ) : null}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold mt-0.5 max-w-[260px] sm:max-w-lg">
                  {settings?.subtitle || (settings?.organization_name ? 'سامانه جامع راهنمای تلفن و اطلاعات کارکنان' : 'سامانه جامع راهنمای تلفن و اطلاعات کارکنان')}
                </p>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-1.5 lg:hidden flex-wrap justify-end">
              {onOpenPrint && (
                <button
                  type="button"
                  onClick={onOpenPrint}
                  aria-label="چاپ"
                  className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 transition-colors"
                  title="چاپ"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}
              {onSelectBgTheme && (
                <BackgroundThemePicker
                  currentThemeId={bgThemeId || 'slate-grid'}
                  onSelectTheme={onSelectBgTheme}
                  isDarkMode={theme === 'dark'}
                  compact
                />
              )}
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="تغییر پوسته"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              {currentUser ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onToggleAdmin}
                    className="text-xs px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold shadow-xs hover:bg-indigo-700"
                  >
                    {isAdminView ? 'فهرست' : 'مدیریت'}
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-xs p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
                    title="خروج"
                    aria-label="خروج"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="text-xs px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-xs"
                >
                  ورود
                </button>
              )}
            </div>
          </div>

          {/* Actions: Theme Switcher & Admin Auth */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Print Button */}
            {onOpenPrint && (
              <button
                type="button"
                onClick={onOpenPrint}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer shadow-xs active:scale-95"
                title="چاپ"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>چاپ</span>
              </button>
            )}

            {/* Background Color & Pattern Selector */}
            {onSelectBgTheme && (
              <BackgroundThemePicker
                currentThemeId={bgThemeId || 'slate-grid'}
                onSelectTheme={onSelectBgTheme}
                isDarkMode={theme === 'dark'}
              />
            )}

            {/* Theme Toggle Switch */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="relative inline-flex items-center h-8 w-14 rounded-full bg-slate-200 dark:bg-slate-800 p-0.5 transition-colors border border-slate-300/80 dark:border-slate-700/80 cursor-pointer shadow-xs"
              title={theme === 'dark' ? 'پوسته روشن' : 'پوسته تاریک'}
              aria-label="تغییر پوسته"
            >
              <span className="sr-only">تغییر تم</span>
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow-sm transition-all transform ${
                  theme === 'dark' ? '-translate-x-6 text-indigo-400' : 'translate-x-0 text-amber-500'
                }`}
              >
                {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </span>
              <span className="absolute left-1.5 text-slate-400 dark:text-indigo-400 pointer-events-none">
                {theme !== 'dark' && <Moon className="w-3 h-3 text-slate-400" />}
              </span>
              <span className="absolute right-1.5 text-slate-400 pointer-events-none">
                {theme === 'dark' && <Sun className="w-3 h-3 text-amber-400/70" />}
              </span>
            </button>

            {/* Admin status & toggle */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleAdmin}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                    isAdminView
                      ? 'bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAdminView ? 'فهرست' : 'مدیریت'}</span>
                </button>

                {/* User Profile Badge */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-bold text-xs">{currentUser.name || currentUser.username}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'مدیر ارشد' : 'ویرایشگر'}
                  </span>
                </div>

                {/* Clear Logout Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 text-xs font-bold transition-colors cursor-pointer"
                  title="خروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                title="ورود"
              >
                <LogIn className="w-4 h-4" />
                <span>ورود</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
