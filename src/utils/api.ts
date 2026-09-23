// Client API Client

export function getAuthToken(): string | null {
  return localStorage.getItem('org_directory_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('org_directory_token', token);
  } else {
    localStorage.removeItem('org_directory_token');
  }
}

export function getStoredUser(): any | null {
  const u = localStorage.getItem('org_directory_user');
  if (!u) return null;
  try {
    return JSON.parse(u);
  } catch {
    return null;
  }
}

export function setStoredUser(user: any | null): void {
  if (user) {
    localStorage.setItem('org_directory_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('org_directory_user');
  }
}

async function request(url: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type to JSON if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    throw new Error('خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.');
  }

  // Handle blob responses (e.g. export or backup download)
  const contentType = response.headers.get('content-type') || '';
  if (
    contentType.includes('spreadsheet') ||
    contentType.includes('zip') ||
    contentType.includes('octet-stream')
  ) {
    if (!response.ok) {
      throw new Error('خطا در دریافت فایل خروجی از سرور.');
    }
    return response.blob();
  }

  const text = await response.text();

  if (!response.ok) {
    let errMessage = 'خطایی در ارتباط با سرور رخ داد.';
    if (text) {
      try {
        const errData = JSON.parse(text);
        errMessage = errData.error || errData.message || errMessage;
      } catch {
        if (text.includes('warmup') || text.includes('starts') || text.trim().startsWith('<')) {
          errMessage = 'سرور در حال راه‌اندازی یا به‌روزرسانی است. لطفاً چند لحظه دیگر مجدداً امتحان کنید.';
        }
      }
    }
    throw new Error(errMessage);
  }

  if (!text || text.trim() === '') {
    return null;
  }

  // Detect HTML response masquerading as 200 OK (e.g. Nginx warmup intercept or SPA fallback)
  const trimmed = text.trim();
  if (trimmed.startsWith('<') || contentType.includes('text/html')) {
    if (trimmed.includes('warmup') || trimmed.includes('starts') || trimmed.includes('Please wait')) {
      throw new Error('سرور در حال راه‌اندازی است. لطفاً چند ثانیه تأمل نموده و دوباره دکمه را بزنید.');
    }
    throw new Error('پاسخ سرور در قالب نامعتبر دریافت شد. لطفاً دوباره تلاش فرمایید.');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('قالب پاسخ سرور نامعتبر است.');
  }
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getMe: () => request('/api/auth/me'),

  // Employees
  getEmployees: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return request(`/api/employees?${q.toString()}`);
  },
  getEmployee: (id: string) => request(`/api/employees/${id}`),
  createEmployee: (data: any) => request('/api/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: any) => request(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id: string, reason?: string) =>
    request(`/api/employees/${id}`, {
      method: 'DELETE',
      body: reason ? JSON.stringify({ reason }) : undefined,
    }),
  duplicateEmployee: (id: string) => request(`/api/employees/${id}/duplicate`, { method: 'POST' }),
  batchArchiveEmployees: (ids: string[], reason?: string) =>
    request('/api/employees/batch-archive', {
      method: 'POST',
      body: JSON.stringify({ ids, reason }),
    }),

  // Employee Archive & Recycle Bin
  getArchivedEmployees: () => request('/api/archive/employees'),
  restoreArchivedEmployee: (id: string) =>
    request(`/api/archive/employees/${id}/restore`, { method: 'POST' }),
  batchRestoreArchivedEmployees: (ids: string[]) =>
    request('/api/archive/employees/batch-restore', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  permanentlyDeleteArchivedEmployee: (id: string) =>
    request(`/api/archive/employees/${id}`, { method: 'DELETE' }),
  batchPermanentlyDeleteArchivedEmployees: (ids: string[]) =>
    request('/api/archive/employees/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  emptyArchive: () => request('/api/archive/employees/empty', { method: 'POST' }),

  // Quick Search & Highlights
  quickSearch: (q: string) => request(`/api/search?q=${encodeURIComponent(q)}`),
  getRecentlyUpdated: () => request('/api/recently-updated'),
  getMostSearched: () => request('/api/most-searched'),

  // Departments (Flat 12)
  getDepartments: () => request('/api/departments'),
  createDepartment: (data: any) => request('/api/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id: string, data: any) => request(`/api/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepartment: (id: string, options?: { targetDepartmentId?: string }) =>
    request(`/api/departments/${id}`, {
      method: 'DELETE',
      body: options ? JSON.stringify(options) : undefined,
    }),
  reorderDepartments: (orderedIds: string[]) => request('/api/departments/reorder/batch', { method: 'PUT', body: JSON.stringify({ orderedIds }) }),
  updateDepartmentEmployeeOrder: (departmentId: string, orderedEmployeeIds: string[]) =>
    request(`/api/departments/${departmentId}/employee-order`, {
      method: 'PUT',
      body: JSON.stringify({ orderedEmployeeIds }),
    }),

  // Positions & Locations
  getPositions: () => request('/api/positions'),
  createPosition: (data: any) => request('/api/positions', { method: 'POST', body: JSON.stringify(data) }),
  updatePosition: (id: string, data: any) => request(`/api/positions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePosition: (id: string) => request(`/api/positions/${id}`, { method: 'DELETE' }),

  getLocations: () => request('/api/locations'),
  createLocation: (data: any) => request('/api/locations', { method: 'POST', body: JSON.stringify(data) }),
  updateLocation: (id: string, data: any) => request(`/api/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLocation: (id: string) => request(`/api/locations/${id}`, { method: 'DELETE' }),
  reorderLocations: (orderedIds: string[]) => request('/api/locations/reorder/batch', { method: 'PUT', body: JSON.stringify({ orderedIds }) }),

  // Dynamic Fields
  getFields: () => request('/api/fields'),
  createField: (data: any) => request('/api/fields', { method: 'POST', body: JSON.stringify(data) }),
  updateField: (id: string, data: any) => request(`/api/fields/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteField: (id: string) => request(`/api/fields/${id}`, { method: 'DELETE' }),
  reorderFields: (orderedIds: string[]) => request('/api/fields/reorder/batch', { method: 'PUT', body: JSON.stringify({ orderedIds }) }),

  // Statistics
  getStatistics: () => request('/api/statistics'),
  getSearchStats: () => request('/api/search-statistics'),

  // Excel
  previewExcel: (formData: FormData) => request('/api/import/preview', { method: 'POST', body: formData }),
  confirmExcel: (data: any) => request('/api/import/confirm', { method: 'POST', body: JSON.stringify(data) }),
  exportExcel: async (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params);
    const blob = await request(`/api/export?${q.toString()}`);
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `دفتر_تلفن_جامع_سازمان_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  },
  downloadExcelTemplate: async () => {
    const blob = await request('/api/export?template=true');
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'قالب_نمونه_اکسل_دفتر_تلفن_سازمان.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  },

  // Backup & Restore & Reset All
  resetDatabase: (createBackup = true) =>
    request('/api/admin/reset-database', {
      method: 'POST',
      body: JSON.stringify({ create_backup: createBackup }),
    }),
  seedDummyData: () => request('/api/admin/seed-dummy-data', { method: 'POST' }),
  createBackup: (comment?: string) => request('/api/backup', { method: 'POST', body: JSON.stringify({ comment }) }),
  getBackupList: () => request('/api/backup/list'),
  downloadBackup: async (filename: string) => {
    const token = getAuthToken();
    const res = await fetch(`/api/backup/download/${encodeURIComponent(filename)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let msg = 'خطا در دانلود فایل پشتیبان';
      try {
        const err = await res.json();
        if (err?.error) msg = err.error;
      } catch (_) {}
      throw new Error(msg);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  },
  deleteBackup: (filename: string) =>
    request(`/api/backup/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
  restoreBackup: (formDataOrBody: FormData | { filename: string }) => {
    if (formDataOrBody instanceof FormData) {
      return request('/api/restore', { method: 'POST', body: formDataOrBody });
    }
    return request('/api/restore', { method: 'POST', body: JSON.stringify(formDataOrBody) });
  },

  // Audit Log & Health
  getAuditLogs: (level?: string) => request(`/api/audit-log${level ? `?level=${level}` : ''}`),
  getTroubleshootReport: () => request('/api/audit-log/troubleshoot-report'),
  getHealth: () => request('/api/health'),

  // Settings, Logo & Default Avatar
  getSettings: () => request('/api/settings'),
  updateSettings: (data: any) => request('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: (formData: FormData) => request('/api/logo', { method: 'POST', body: formData }),
  deleteLogo: () => request('/api/logo', { method: 'DELETE' }),
  uploadDefaultAvatar: (formData: FormData) => request('/api/default-avatar', { method: 'POST', body: formData }),
  deleteDefaultAvatar: () => request('/api/default-avatar', { method: 'DELETE' }),

  // Upload Employee Avatar
  uploadAvatar: (formData: FormData) => request('/api/upload/photo', { method: 'POST', body: formData }),
  importBatchPhotos: (formData: FormData) => request('/api/employees/batch-photos', { method: 'POST', body: formData }),

  // Users
  getUsers: () => request('/api/users'),
  createUser: (data: any) => request('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/api/users/${id}`, { method: 'DELETE' }),
};
