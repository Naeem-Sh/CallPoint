import React, { useState, useEffect, useCallback } from 'react';
import {
  Employee,
  DynamicFieldDefinition,
  Department,
  Position,
  LocationItem,
  SystemStatistics,
  SystemHealth,
  AppSettings,
  AppUser,
} from './types.ts';
import { api, getStoredUser, setAuthToken, setStoredUser } from './utils/api.ts';
import { Header } from './components/Header.tsx';
import { StatisticsBox } from './components/StatisticsBox.tsx';
import { SearchAndFilters } from './components/SearchAndFilters.tsx';
import { EmployeeDirectory } from './components/EmployeeDirectory.tsx';
import { RecentlyUpdatedBox } from './components/RecentlyUpdatedBox.tsx';
import { MostSearchedBox } from './components/MostSearchedBox.tsx';
import { EmployeeProfileModal } from './components/EmployeeProfileModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { AdminPanel } from './components/admin/AdminPanel.tsx';
import { PrintDirectoryModal } from './components/PrintDirectoryModal.tsx';
import { Shield, Sparkles, Heart } from 'lucide-react';
import { toPersianDigits } from './utils/shamsi.ts';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('org_directory_theme') as 'light' | 'dark') || 'light';
  });

  // Auth & View Mode
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getStoredUser());
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Core Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fields, setFields] = useState<DynamicFieldDefinition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [stats, setStats] = useState<SystemStatistics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Highlight boxes
  const [recentlyUpdated, setRecentlyUpdated] = useState<Employee[]>([]);
  const [mostSearched, setMostSearched] = useState<Employee[]>([]);

  // Modals & Selection
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('org_directory_selected_filters');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [sortField, setSortField] = useState<string>(() => {
    return localStorage.getItem('org_directory_sort_field') || 'department_id';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    return (localStorage.getItem('org_directory_sort_order') as 'asc' | 'desc') || 'asc';
  });
  const [loading, setLoading] = useState(true);

  // Sync theme with document class and localStorage
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('org_directory_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('org_directory_theme', nextTheme);
      } catch {
        // ignore
      }
      return nextTheme;
    });
  }, []);

  // Verify auth session on load
  useEffect(() => {
    api
      .getMe()
      .then((res) => {
        setCurrentUser(res.user);
        setStoredUser(res.user);
      })
      .catch(() => {
        setCurrentUser(null);
        setStoredUser(null);
        setAuthToken(null);
      });
  }, []);

  // Fetch core metadata (fields, departments, positions, locations, settings)
  const fetchMetadata = useCallback(async () => {
    try {
      const [fData, dData, pData, lData, sData, statsData, healthData] = await Promise.all([
        api.getFields(),
        api.getDepartments(),
        api.getPositions(),
        api.getLocations(),
        api.getSettings(),
        api.getStatistics(),
        api.getHealth(),
      ]);

      setFields(Array.isArray(fData) ? fData : (fData?.fields || []));
      setDepartments(Array.isArray(dData) ? dData : (dData?.departments || []));
      setPositions(Array.isArray(pData) ? pData : (pData?.positions || []));
      setLocations(Array.isArray(lData) ? lData : (lData?.locations || []));
      setSettings(sData?.settings || sData || null);
      setStats(statsData?.statistics || statsData || null);
      setHealth(healthData || null);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  }, []);

  // Fetch Highlights (Recently Updated & Most Searched)
  const fetchHighlights = useCallback(async () => {
    try {
      const [recentData, mostData] = await Promise.all([
        api.getRecentlyUpdated(),
        api.getMostSearched(),
      ]);
      setRecentlyUpdated(Array.isArray(recentData) ? recentData : (recentData?.employees || []));
      setMostSearched(Array.isArray(mostData) ? mostData : (mostData?.employees || []));
    } catch (err) {
      console.error('Failed to fetch highlights:', err);
    }
  }, []);

  // Fetch Employees based on search and filters
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        sort_by: sortField,
        sort_order: sortOrder,
      };

      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }

      // Append dynamic filters
      Object.entries(selectedFilters || {}).forEach(([k, v]) => {
        if (v && v !== 'all') {
          params[k] = v;
        }
      });

      const res = await api.getEmployees(params);
      setEmployees(res.employees || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedFilters, sortField, sortOrder]);

  // Initial load
  useEffect(() => {
    fetchMetadata();
    fetchHighlights();
  }, [fetchMetadata, fetchHighlights]);

  // Refetch employees when search, filter or sort changes
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleFilterChange = (key: string, value: string) => {
    setSelectedFilters((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };
      localStorage.setItem('org_directory_selected_filters', JSON.stringify(next));
      return next;
    });
  };

  const handleResetFilters = () => {
    setSelectedFilters({});
    setSearchQuery('');
    localStorage.removeItem('org_directory_selected_filters');
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      localStorage.setItem('org_directory_sort_order', newOrder);
    } else {
      setSortField(field);
      setSortOrder('asc');
      localStorage.setItem('org_directory_sort_field', field);
      localStorage.setItem('org_directory_sort_order', 'asc');
    }
  };

  const handleEmployeeClick = async (emp: Employee) => {
    setSelectedEmployee(emp);
    // Fetch fresh single employee details (which increments search_count on server)
    try {
      const single = await api.getEmployee(emp.id);
      if (single) {
        setSelectedEmployee(single.employee || single);
      }
      // Silently refresh highlights and stats in background
      fetchHighlights();
      api.getStatistics().then((res) => {
        if (res) setStats(res.statistics || res);
      });
    } catch {
      // keep current
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setAuthToken(null);
    setStoredUser(null);
    setCurrentUser(null);
    setIsAdminView(false);
  };

  const refreshAll = async () => {
    await Promise.allSettled([
      fetchMetadata(),
      fetchHighlights(),
      fetchEmployees(),
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        settings={settings}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onToggleAdmin={() => setIsAdminView(!isAdminView)}
        isAdminView={isAdminView}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPrint={() => setIsPrintModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isAdminView && currentUser ? (
          <AdminPanel
            employees={employees}
            fields={fields}
            departments={departments}
            positions={positions}
            locations={locations}
            stats={stats}
            health={health}
            settings={settings}
            currentUser={currentUser}
            onRefreshAll={refreshAll}
            onCloseAdmin={() => setIsAdminView(false)}
            onLogout={handleLogout}
          />
        ) : (
          <div className="space-y-6">
            {/* Top Statistics Box */}
            <StatisticsBox
              stats={stats}
              employees={employees}
              departments={departments}
              locations={locations}
              positions={positions}
              loading={loading}
            />

            {/* Main Content Layout with Left Column for Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Right Main Column (RTL Start) */}
              <div className="lg:col-span-9 xl:col-span-9 space-y-6 min-w-0">
                {/* Dynamic Search & Filters Section */}
                <SearchAndFilters
                  fields={fields}
                  departments={departments}
                  positions={positions}
                  locations={locations}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedFilters={selectedFilters}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  totalResults={employees.length}
                  loading={loading}
                />

                {/* Central Employee Directory (All employees, dynamic columns, sortable) */}
                <EmployeeDirectory
                  employees={employees}
                  fields={fields}
                  departments={departments}
                  positions={positions}
                  locations={locations}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                  onSelectEmployee={handleEmployeeClick}
                  loading={loading}
                  onOpenPrint={() => setIsPrintModalOpen(true)}
                />
              </div>

              {/* Left Column (RTL End) - Narrower, Compact Column at Top Left */}
              <aside className="lg:col-span-3 xl:col-span-3 space-y-3.5 lg:sticky lg:top-20">
                {/* آخرین تغییرات */}
                <RecentlyUpdatedBox
                  employees={recentlyUpdated}
                  departments={departments}
                  positions={positions}
                  onSelectEmployee={handleEmployeeClick}
                />

                {/* پرجستجوترین همکاران */}
                <MostSearchedBox
                  employees={mostSearched}
                  departments={departments}
                  positions={positions}
                  onSelectEmployee={handleEmployeeClick}
                />
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
          Developed by: N.Shaaeri
        </div>
      </footer>

      {/* Print Directory Modal */}
      {isPrintModalOpen && (
        <PrintDirectoryModal
          employees={employees}
          departments={departments}
          locations={locations}
          positions={positions}
          settings={settings}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          fields={fields}
          departments={departments}
          positions={positions}
          locations={locations}
          onClose={() => setSelectedEmployee(null)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Admin Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsAdminView(true);
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
