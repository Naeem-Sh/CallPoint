import { getSettings, saveSettings, createBackupZip, enforceBackupRetention, logAudit } from './storage.ts';
import { AppSettings } from '../src/types.ts';

let schedulerInterval: NodeJS.Timeout | null = null;
let isBackupRunning = false;

/**
 * Calculates the next scheduled date for automatic backup based on settings
 */
export function calculateNextAutoBackup(settings: AppSettings): Date {
  const now = new Date();
  const targetTime = settings.auto_backup_time || '02:00';
  const [targetHourStr, targetMinStr] = targetTime.split(':');
  const targetHour = parseInt(targetHourStr, 10) || 2;
  const targetMin = parseInt(targetMinStr, 10) || 0;

  const frequency = settings.auto_backup_frequency || 'weekly';
  const targetDayOfWeek = settings.auto_backup_day_of_week !== undefined ? settings.auto_backup_day_of_week : 5; // 5: Friday (جمعه)

  const next = new Date(now);
  next.setHours(targetHour, targetMin, 0, 0);

  if (frequency === 'daily') {
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  if (frequency === 'monthly') {
    // 1st of next month
    if (next.getTime() <= now.getTime()) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
    }
    return next;
  }

  // Weekly (default)
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  let daysUntilTarget = (targetDayOfWeek - currentDay + 7) % 7;

  if (daysUntilTarget === 0 && next.getTime() <= now.getTime()) {
    daysUntilTarget = 7;
  }

  next.setDate(now.getDate() + daysUntilTarget);
  return next;
}

/**
 * Checks if a backup is due based on settings and last run timestamp
 */
export function isBackupDue(settings: AppSettings): boolean {
  if (settings.auto_backup_enabled === false) {
    return false;
  }

  const now = new Date();
  const frequency = settings.auto_backup_frequency || 'weekly';
  const targetTime = settings.auto_backup_time || '02:00';
  const [targetHourStr, targetMinStr] = targetTime.split(':');
  const targetHour = parseInt(targetHourStr, 10) || 2;
  const targetMin = parseInt(targetMinStr, 10) || 0;
  const targetDayOfWeek = settings.auto_backup_day_of_week !== undefined ? settings.auto_backup_day_of_week : 5; // Friday

  const lastBackupStr = settings.last_auto_backup;
  const lastBackupTime = lastBackupStr ? new Date(lastBackupStr).getTime() : 0;
  const hoursSinceLast = (now.getTime() - lastBackupTime) / (1000 * 3600);

  // If never backed up automatically, trigger if server has been running or if past scheduled hour
  if (!lastBackupTime) {
    return true;
  }

  if (frequency === 'daily') {
    // Due if at or past target hour and at least 20 hours have passed since last auto backup
    const isPastHour = now.getHours() > targetHour || (now.getHours() === targetHour && now.getMinutes() >= targetMin);
    return isPastHour && hoursSinceLast >= 20;
  }

  if (frequency === 'monthly') {
    return hoursSinceLast >= 28 * 24;
  }

  // Weekly mode (default):
  // Due if today is target day of week, at or past target hour, and not executed in the last 6 days (or > 140 hours)
  const isTargetDay = now.getDay() === targetDayOfWeek;
  const isPastTime = now.getHours() > targetHour || (now.getHours() === targetHour && now.getMinutes() >= targetMin);

  if (isTargetDay && isPastTime && hoursSinceLast >= 24) {
    return true;
  }

  // Fail-safe: if more than 7.5 days have elapsed without any auto backup
  if (hoursSinceLast >= 7.5 * 24) {
    return true;
  }

  return false;
}

/**
 * Executes the automatic backup process and records logs/timestamps
 */
export async function performAutoBackup(
  comment = 'پشتیبان خودکار هفتگی سامانه (Automatic Weekly Backup)',
  triggerSource = 'زمان‌بندی خودکار هفتگی'
): Promise<{ success: boolean; filename?: string; message: string; timestamp?: string }> {
  if (isBackupRunning) {
    return {
      success: false,
      message: 'یک عملیات پشتیبان‌گیری هم‌اکنون در حال اجراست.'
    };
  }

  isBackupRunning = true;
  const startTime = Date.now();

  try {
    console.log(`[AUTO BACKUP] Starting scheduled backup triggered by: ${triggerSource}...`);
    const filename = await createBackupZip(comment, true);
    
    // Update settings with last backup time
    const currentSettings = await getSettings();
    const nowIso = new Date().toISOString();
    const updatedSettings = {
      ...currentSettings,
      last_auto_backup: nowIso
    };
    await saveSettings(updatedSettings);

    // Enforce 20 max backups retention
    await enforceBackupRetention(20);

    // Audit Log entry
    await logAudit(
      'سیستم (زمان‌بندی خودکار)',
      'پشتیبان‌گیری خودکار هفتگی',
      filename,
      `پشتیبان‌گیری خودکار هفتگی با موفقیت انجام و ذخیره شد. مبدأ: ${triggerSource} (${Math.round((Date.now() - startTime) / 1000)} ثانیه)`,
      '127.0.0.1',
      'success'
    );

    console.log(`[AUTO BACKUP] Successfully created ${filename} in ${Date.now() - startTime}ms`);

    return {
      success: true,
      filename,
      timestamp: nowIso,
      message: `نسخه پشتیبان خودکار هفتگی «${filename}» با موفقیت ایجاد گردید.`
    };
  } catch (err: any) {
    console.error('[AUTO BACKUP] Error executing scheduled auto backup:', err);
    try {
      await logAudit(
        'سیستم (زمان‌بندی خودکار)',
        'خطا در پشتیبان‌گیری خودکار',
        'Auto Backup Failed',
        err?.message || String(err),
        '127.0.0.1',
        'failed'
      );
    } catch (_) {}

    return {
      success: false,
      message: `خطا در ایجاد پشتیبان خودکار: ${err.message}`
    };
  } finally {
    isBackupRunning = false;
  }
}

/**
 * Gets the current status of the automatic backup subsystem
 */
export async function getAutoBackupStatus(): Promise<{
  enabled: boolean;
  frequency: 'weekly' | 'daily' | 'monthly';
  day_of_week: number;
  day_of_week_name: string;
  time: string;
  last_run: string | null;
  next_run: string;
  is_running: boolean;
}> {
  const settings = await getSettings();
  const enabled = settings.auto_backup_enabled !== false;
  const frequency = settings.auto_backup_frequency || 'weekly';
  const dayOfWeek = settings.auto_backup_day_of_week !== undefined ? settings.auto_backup_day_of_week : 5;
  const time = settings.auto_backup_time || '02:00';
  const lastRun = settings.last_auto_backup || null;
  const nextRun = calculateNextAutoBackup(settings).toISOString();

  const dayNames = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنج‌شنبه',
    'جمعه',
    'شنبه'
  ];

  return {
    enabled,
    frequency,
    day_of_week: dayOfWeek,
    day_of_week_name: dayNames[dayOfWeek] || 'جمعه',
    time,
    last_run: lastRun,
    next_run: nextRun,
    is_running: isBackupRunning
  };
}

/**
 * Starts the background auto-backup daemon timer
 */
export function startAutoBackupScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log('[AUTO BACKUP] Initializing Weekly Auto-Backup Scheduler Daemon...');

  // Periodic check every 60 seconds
  schedulerInterval = setInterval(async () => {
    try {
      const settings = await getSettings();
      if (isBackupDue(settings)) {
        console.log('[AUTO BACKUP] Backup is due according to weekly schedule. Executing now...');
        await performAutoBackup('پشتیبان خودکار هفتگی سامانه (Automatic Weekly Backup)', 'زمان‌بندی خودکار');
      }
    } catch (err) {
      console.error('[AUTO BACKUP] Scheduler tick check error:', err);
    }
  }, 60 * 1000);

  // Initial check 10 seconds after server startup
  setTimeout(async () => {
    try {
      const settings = await getSettings();
      if (isBackupDue(settings)) {
        console.log('[AUTO BACKUP] Initial post-boot check: Backup is due. Executing...');
        await performAutoBackup('پشتیبان خودکار هفتگی سامانه (Automatic Weekly Backup)', 'بررسی پس از راه‌اندازی سرور');
      } else {
        const next = calculateNextAutoBackup(settings);
        console.log(`[AUTO BACKUP] Scheduler active. Next scheduled weekly backup: ${next.toLocaleString('fa-IR')}`);
      }
    } catch (err) {
      console.error('[AUTO BACKUP] Post-boot check error:', err);
    }
  }, 10 * 1000);
}
