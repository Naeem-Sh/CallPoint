import React, { useState, useEffect } from 'react';
import { AuditLogEntry, SystemHealth } from '../../types.ts';
import { api } from '../../utils/api.ts';
import { toPersianDigits, formatPersianDateTime } from '../../utils/shamsi.ts';
import {
  ShieldCheck,
  Activity,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Terminal,
  Bug,
  Code,
  X,
  Clock,
  Cpu,
  HardDrive
} from 'lucide-react';

export const AdminAuditAndHealth: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedLogDetail, setCopiedLogDetail] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, healthRes] = await Promise.all([api.getAuditLogs(), api.getHealth()]);
      const logItems = Array.isArray(logsRes) ? logsRes : (logsRes.logs || []);
      setLogs(logItems);
      setHealth(healthRes);
    } catch (err) {
      console.error('Failed to fetch audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const errorsCount = logs.filter(
    (l) => l.level === 'ERROR' || l.level === 'FATAL' || l.result === 'failed' || l.status === 'failed'
  ).length;
  const warningsCount = logs.filter((l) => l.level === 'WARN').length;
  const infoCount = logs.length - errorsCount - warningsCount;

  const filteredLogs = logs.filter((log) => {
    // Level filter
    const isError = log.level === 'ERROR' || log.level === 'FATAL' || log.result === 'failed' || log.status === 'failed';
    const isWarn = log.level === 'WARN';
    if (filterLevel === 'error' && !isError) return false;
    if (filterLevel === 'warn' && !isWarn) return false;
    if (filterLevel === 'info' && (isError || isWarn)) return false;

    // Search term
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.username?.toLowerCase().includes(term) ||
      log.ip?.includes(term) ||
      log.target?.toLowerCase().includes(term) ||
      log.error_message?.toLowerCase().includes(term) ||
      log.error_name?.toLowerCase().includes(term) ||
      log.endpoint?.toLowerCase().includes(term) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(term))
    );
  });

  const getLevelBadge = (log: AuditLogEntry) => {
    if (log.level === 'FATAL' || log.level === 'ERROR' || log.result === 'failed' || log.status === 'failed') {
      return {
        label: 'خطا (Error)',
        className: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900',
        icon: AlertCircle
      };
    }
    if (log.level === 'WARN') {
      return {
        label: 'هشدار (Warn)',
        className: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
        icon: AlertTriangle
      };
    }
    return {
      label: 'عادی (Info)',
      className: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900',
      icon: CheckCircle2
    };
  };

  // Create unified troubleshooting report JSON object
  const buildTroubleshootReport = () => {
    const errorLogs = logs.filter(
      (l) => l.level === 'ERROR' || l.level === 'FATAL' || l.result === 'failed' || l.status === 'failed'
    );
    return {
      report_generated_at: new Date().toISOString(),
      report_title: 'سامانه دفتر تلفن - گزارش تشخیصی و ترابلشوتینگ',
      system_status: health?.status || 'unknown',
      uptime_minutes: Math.floor((health?.uptime_seconds || 0) / 60),
      summary: {
        total_recorded_logs: logs.length,
        max_log_capacity: 200,
        errors_count: errorsCount,
        warnings_count: warningsCount,
        info_count: infoCount
      },
      health_subsystems: health?.subsystems || (health as any)?.details || {},
      critical_errors_summary: errorLogs.map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        action: e.action,
        error_name: e.error_name,
        error_message: e.error_message,
        endpoint: e.endpoint,
        http_method: e.http_method,
        http_status: e.http_status,
        error_stack_snippet: e.error_stack ? e.error_stack.split('\n').slice(0, 8).join('\n') : undefined,
        details: e.details
      })),
      all_200_logs: logs
    };
  };

  const handleCopyReport = async () => {
    try {
      const report = buildTroubleshootReport();
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 3000);
    } catch (err) {
      console.error('Failed to copy report to clipboard:', err);
    }
  };

  const handleDownloadReport = () => {
    const report = buildTroubleshootReport();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `troubleshoot_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    dlAnchor.click();
  };

  const handleCopySingleLog = async (log: AuditLogEntry) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      setCopiedLogDetail(true);
      setTimeout(() => setCopiedLogDetail(false), 2000);
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      {/* Troubleshooting Header & Diagnostic Action Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-lg border border-indigo-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/30">
                <Bug className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                سامانه پایش هوشمند و ترابلشوتینگ (۲۰۰ لاگ اخیر)
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              این سیستم با ثبت دقیق ۲۰۰ رویداد و خطای اخیر به همراه استک‌تریس (Stack Trace)، متد و مسیر API، کد وضعیت HTTP و وضعیت حافظه طراحی شده تا با ارائه آن، هرگونه نقص یا ارور سامانه سریعاً شناسایی و برطرف گردد.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyReport}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                copiedReport
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-102'
              }`}
              title="کپی متن کامل گزارش تشخیصی جهت چسباندن و ارسال مستقیم در گفتگو"
            >
              {copiedReport ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedReport ? 'گزارش کپی شد!' : 'کپی گزارش برای ارسال'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
              title="دانلود فایل JSON گزارش تشخیصی"
            >
              <Download className="w-4 h-4" />
              <span>دانلود JSON</span>
            </button>

            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              title="تازه‌سازی لاگ‌ها"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Diagnostic Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">لاگ‌های ثبت شده</div>
              <div className="text-sm font-black text-white">
                {toPersianDigits(logs.length)} <span className="text-[10px] text-slate-400 font-normal">از ۲۰۰</span>
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
            errorsCount > 0
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
              errorsCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-slate-400'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">خطاهای شناسایی‌شده</div>
              <div className={`text-sm font-black ${errorsCount > 0 ? 'text-rose-400' : 'text-white'}`}>
                {toPersianDigits(errorsCount)} رویداد
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">هشدارها</div>
              <div className="text-sm font-black text-white">
                {toPersianDigits(warningsCount)} مورد
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">سلامت سرور</div>
              <div className="text-sm font-black text-emerald-400">
                {health?.status === 'ok' || health?.status === 'healthy' ? 'پایدار و برخط' : 'نیاز به بررسی'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Status Grid */}
      {health && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                وضعیت زیرسیستم‌های سرور (Subsystems)
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              آپ‌تایم: {toPersianDigits(Math.floor((health.uptime_seconds || 0) / 60))} دقیقه
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {Object.entries(health.subsystems || (health as any).details || {}).map(([key, item]: [string, any]) => {
              const name =
                item?.name ||
                (key === 'application'
                  ? 'وب سرور'
                  : key === 'json_storage'
                  ? 'پایگاه داده JSON'
                  : key === 'search_index'
                  ? 'موتور جستجو'
                  : key === 'file_storage'
                  ? 'ذخیره فایل'
                  : key === 'backup'
                  ? 'پشتیبان‌گیری'
                  : key);
              const isWarning = item?.status === 'warning' || item?.status === 'critical' || item?.status === 'error';
              return (
                <div
                  key={key}
                  className={`p-3 rounded-2xl border transition-colors ${
                    isWarning
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/60 dark:border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{name}</span>
                    {isWarning ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item?.message || 'وضعیت پایدار'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Level tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterLevel('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterLevel === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              همه رویدادها ({toPersianDigits(logs.length)})
            </button>
            <button
              type="button"
              onClick={() => setFilterLevel('error')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterLevel === 'error'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>فقط خطاها ({toPersianDigits(errorsCount)})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterLevel('warn')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterLevel === 'warn'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>هشدارها ({toPersianDigits(warningsCount)})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterLevel('info')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterLevel === 'info'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              عادی ({toPersianDigits(infoCount)})
            </button>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            نمایش {toPersianDigits(filteredLogs.length)} مورد
          </span>
        </div>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 right-3.5 my-auto pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در پیام ارور، استک‌تریس، عملیات، کاربر، آدرس IP یا متد API..."
            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <th className="py-3 px-3.5">سطح / زمان</th>
                <th className="py-3 px-3.5">عملیات / رویداد</th>
                <th className="py-3 px-3.5">کاربر & IP</th>
                <th className="py-3 px-3.5">مسیر و متد API</th>
                <th className="py-3 px-3.5">پیام و جزئیات ارور</th>
                <th className="py-3 px-3.5 text-center">ترابلشوت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    رویدادی منطبق بر فیلتر یا جستجوی شما یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => {
                  const badge = getLevelBadge(l);
                  const isErr = badge.label.includes('Error');
                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedLog(l)}
                      className={`transition-colors cursor-pointer ${
                        isErr
                          ? 'bg-rose-50/40 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}
                          >
                            <badge.icon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                          {formatPersianDateTime(l.timestamp)}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        <div>{l.action}</div>
                        {l.target && (
                          <div className="text-[11px] text-slate-500 font-normal truncate max-w-xs">{l.target}</div>
                        )}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{l.username || 'system'}</div>
                        <div className="text-[10px] font-mono text-slate-400">{l.ip}</div>
                      </td>

                      <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap">
                        {l.endpoint ? (
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            {l.http_method && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold">
                                {l.http_method}
                              </span>
                            )}
                            <span className="truncate max-w-[140px]" title={l.endpoint}>
                              {l.endpoint}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-sans text-[11px]">-</span>
                        )}
                        {l.http_status && (
                          <span
                            className={`text-[10px] font-bold ${
                              l.http_status >= 400 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            Status: {l.http_status}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 max-w-xs">
                        {l.error_message ? (
                          <div className="text-rose-600 dark:text-rose-400 font-mono text-[11px] font-semibold truncate" title={l.error_message}>
                            {l.error_message}
                          </div>
                        ) : l.details ? (
                          <div className="text-slate-600 dark:text-slate-400 text-[11px] truncate" title={typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}>
                            {typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(l);
                          }}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 transition-colors"
                        >
                          مشاهده کامل
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Terminal className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    جزئیات کامل تشخیصی رویداد
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedLog.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySingleLog(selectedLog)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {copiedLogDetail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLogDetail ? 'کپی شد' : 'کپی رویداد'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">نوع عملیات</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedLog.action}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">کاربر و دسترسی</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedLog.username}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">زمان رویداد</div>
                  <div className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                    {formatPersianDateTime(selectedLog.timestamp)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">آدرس IP درخواست‌دهنده</div>
                  <div className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                    {selectedLog.ip}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">متد و مسیر API</div>
                  <div className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                    {selectedLog.http_method ? `${selectedLog.http_method} ` : ''}
                    {selectedLog.endpoint || 'Internal'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">وضعیت سیستم (RAM & Uptime)</div>
                  <div className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                    {selectedLog.system_state
                      ? `${selectedLog.system_state.memory_mb || '-'} MB | ${toPersianDigits(
                          Math.floor((selectedLog.system_state.uptime_sec || 0) / 60)
                        )} دقیقه`
                      : '-'}
                  </div>
                </div>
              </div>

              {/* Error Box if exists */}
              {selectedLog.error_message && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>پیام خطا: {selectedLog.error_name || 'Exception'}</span>
                  </div>
                  <p className="text-xs font-mono text-rose-800 dark:text-rose-200 break-words">
                    {selectedLog.error_message}
                  </p>
                </div>
              )}

              {/* Stack Trace Box */}
              {selectedLog.error_stack && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-500" />
                      استک‌تریس سیستمی (Stack Trace برای عیب‌یابی دقیق):
                    </span>
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                    {selectedLog.error_stack}
                  </pre>
                </div>
              )}

              {/* Full Details Payload */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  متن یا پارامترهای رویداد (Details Payload):
                </div>
                <pre className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-[11px] font-mono overflow-x-auto border border-slate-200/60 dark:border-slate-800">
                  {typeof selectedLog.details === 'string'
                    ? selectedLog.details
                    : JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

