import React, { useState, useEffect } from 'react';
import { Department, Position, LocationItem, DynamicFieldDefinition } from '../types.ts';
import { Search, Filter, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { toPersianDigits } from '../utils/shamsi.ts';
import { AnimatedCounter } from './common/AnimatedCounter.tsx';

interface SearchAndFiltersProps {
  fields: DynamicFieldDefinition[];
  departments: Department[];
  positions: Position[];
  locations: LocationItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onResetFilters: () => void;
  totalResults: number;
  loading?: boolean;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  fields,
  departments,
  positions,
  locations,
  searchQuery,
  onSearchChange,
  selectedFilters,
  onFilterChange,
  onResetFilters,
  totalResults,
  loading,
}) => {
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    const saved = localStorage.getItem('org_directory_filters_open');
    if (saved !== null) {
      return saved === 'true';
    }
    return false; // پیش‌فرض بسته است
  });
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleToggleFilters = () => {
    setShowFilters((prev) => {
      const next = !prev;
      localStorage.setItem('org_directory_filters_open', String(next));
      return next;
    });
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 280);
    return () => clearTimeout(handler);
  }, [localSearch, searchQuery, onSearchChange]);

  // Sync external reset
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Filterable fields dynamically determined (excluding status)
  const filterableFields = fields.filter((f) => f.active && f.filterable && f.internal_name !== 'status');
  const activeFiltersCount = Object.values(selectedFilters || {}).filter((v) => v && v !== 'all').length;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6">
      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="جستجو بر اساس نام، داخلی، واحد..."
            className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
            dir="rtl"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          type="button"
          onClick={handleToggleFilters}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-2xl border transition-all cursor-pointer ${
            activeFiltersCount > 0
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>فیلترها</span>
          {activeFiltersCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {toPersianDigits(activeFiltersCount)}
            </span>
          )}
        </button>
      </div>

      {/* Dynamic Filters Section */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filterableFields.map((field) => {
              const currentVal = selectedFilters[field.internal_name] || 'all';

              // Case 1: Department selector
              if (field.type === 'department' || field.internal_name === 'department_id') {
                return (
                  <div key={field.id} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {field.persian_label}
                    </label>
                    <select
                      value={currentVal}
                      onChange={(e) => onFilterChange(field.internal_name, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="all">همه واحدها</option>
                      {departments
                        .filter((d) => d.active)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} (کد {toPersianDigits(d.code)})
                          </option>
                        ))}
                    </select>
                  </div>
                );
              }

              // Case 2: Position selector
              if (field.type === 'position' || field.internal_name === 'position_id') {
                return (
                  <div key={field.id} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {field.persian_label}
                    </label>
                    <select
                      value={currentVal}
                      onChange={(e) => onFilterChange(field.internal_name, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="all">همه سمت‌ها</option>
                      {positions
                        .filter((p) => p.active)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                    </select>
                  </div>
                );
              }

              // Case 3: Location selector
              if (field.type === 'location' || field.internal_name === 'location_id') {
                return (
                  <div key={field.id} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {field.persian_label}
                    </label>
                    <select
                      value={currentVal}
                      onChange={(e) => onFilterChange(field.internal_name, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="all">همه مکان‌ها</option>
                      {locations
                        .filter((l) => l.active)
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                    </select>
                  </div>
                );
              }

              // Case 4: Status or Select with options
              if (field.type === 'select' && field.options && field.options.length > 0) {
                return (
                  <div key={field.id} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {field.persian_label}
                    </label>
                    <select
                      value={currentVal}
                      onChange={(e) => onFilterChange(field.internal_name, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="all">همه</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              // Generic fallback text input filter
              return (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {field.persian_label}
                  </label>
                  <input
                    type="text"
                    value={currentVal === 'all' ? '' : currentVal}
                    onChange={(e) => onFilterChange(field.internal_name, e.target.value || 'all')}
                    placeholder={field.persian_label}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              );
            })}
          </div>

          {/* Reset Filters & Result Count */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {loading ? (
                <span>بارگذاری...</span>
              ) : (
                <span className="flex items-center gap-1">
                  <span>نتایج:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    <AnimatedCounter value={totalResults} />
                  </strong>
                  <span>نفر</span>
                </span>
              )}
            </div>

            {(activeFiltersCount > 0 || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  onResetFilters();
                }}
                className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>پاک کردن فیلترها</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
