import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, RotateCcw, X } from 'lucide-react';
import {
  BACKGROUND_THEMES,
  BackgroundTheme,
  DEFAULT_BG_THEME_ID,
  getBackgroundTheme,
} from '../utils/backgroundThemes.ts';

interface BackgroundThemePickerProps {
  currentThemeId: string;
  onSelectTheme: (id: string) => void;
  isDarkMode: boolean;
  compact?: boolean;
}

export const BackgroundThemePicker: React.FC<BackgroundThemePickerProps> = ({
  currentThemeId,
  onSelectTheme,
  isDarkMode,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTheme = getBackgroundTheme(currentThemeId);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onSelectTheme(id);
  };

  const handleReset = () => {
    onSelectTheme(DEFAULT_BG_THEME_ID);
  };

  const activePreviewStyle = isDarkMode ? activeTheme.darkStyle : activeTheme.lightStyle;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button - Clean & text-free */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="انتخاب طرح پس‌زمینه"
        title={activeTheme.name}
        className={`flex items-center justify-center gap-1.5 h-8 px-2 rounded-xl transition-all cursor-pointer border ${
          compact
            ? 'w-8 p-0'
            : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500'
        } ${
          isOpen
            ? 'ring-2 ring-indigo-500/40 border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-slate-800'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        {/* Pattern & Color Swatch Icon */}
        <span
          className="w-5 h-5 rounded-lg flex-shrink-0 shadow-inner border border-slate-300/80 dark:border-slate-600 relative overflow-hidden flex items-center justify-center transition-transform hover:scale-105"
          style={activePreviewStyle}
        >
          <span
            className="w-2 h-2 rounded-full shadow-xs border border-white dark:border-slate-900"
            style={{ backgroundColor: activeTheme.swatchColor }}
          />
        </span>
        {!compact && <Palette className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
      </button>

      {/* Popover Menu - Pure visual grid of 15 patterns, no text */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-[310px] sm:w-[330px] max-w-[calc(100vw-24px)] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 p-3 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Minimal Controls Bar */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <button
                type="button"
                onClick={handleReset}
                title="بازنشانی به طرح پیش‌فرض"
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Visual Grid of 15 Patterns (5 columns x 3 rows) */}
          <div className="grid grid-cols-5 gap-2 p-0.5">
            {BACKGROUND_THEMES.map((themeItem: BackgroundTheme) => {
              const isSelected = themeItem.id === currentThemeId;
              const previewStyle = isDarkMode ? themeItem.darkStyle : themeItem.lightStyle;

              return (
                <button
                  key={themeItem.id}
                  type="button"
                  onClick={() => handleSelect(themeItem.id)}
                  title={`${themeItem.name} - ${themeItem.patternName}`}
                  className={`aspect-square w-full rounded-xl relative overflow-hidden transition-all duration-150 cursor-pointer flex items-center justify-center border group ${
                    isSelected
                      ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 border-indigo-600 shadow-md scale-102'
                      : 'border-slate-300/80 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 hover:scale-105 hover:shadow-sm'
                  }`}
                  style={previewStyle}
                >
                  {/* Active Indicator or Color Dot */}
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md animate-in zoom-in-75 duration-100">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-xs border border-white/90 dark:border-slate-900 opacity-80 group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: themeItem.swatchColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
