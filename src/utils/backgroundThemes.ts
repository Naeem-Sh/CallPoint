import type { CSSProperties } from 'react';

export interface BackgroundTheme {
  id: string;
  name: string;
  patternName: string;
  swatchColor: string;
  category: string;
  lightStyle: CSSProperties;
  darkStyle: CSSProperties;
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  // 1. فیلی اداری (شبکه مهندسی نقطه‌ای)
  {
    id: 'slate-grid',
    name: 'فیلی اداری',
    patternName: 'شبکه مهندسی ریز',
    swatchColor: '#64748b',
    category: 'رسمی',
    lightStyle: {
      backgroundColor: '#f1f5f9',
      backgroundImage: 'radial-gradient(#94a3b8 1.4px, transparent 1.4px)',
      backgroundSize: '18px 18px',
    },
    darkStyle: {
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(#334155 1.4px, transparent 1.4px)',
      backgroundSize: '18px 18px',
    },
  },
  // 2. صورتی شکوفه (خال‌های صورتی تیره Polka)
  {
    id: 'rose-polka',
    name: 'صورتی شکوفه',
    patternName: 'خال‌های صورتی تیره (Polka)',
    swatchColor: '#f43f5e',
    category: 'شاد و فانتزی',
    lightStyle: {
      backgroundColor: '#fff1f2',
      backgroundImage: 'radial-gradient(#f43f5e 3px, transparent 3px)',
      backgroundSize: '22px 22px',
    },
    darkStyle: {
      backgroundColor: '#200a15',
      backgroundImage: 'radial-gradient(#fb7185 2.5px, transparent 2.5px)',
      backgroundSize: '22px 22px',
    },
  },
  // 3. فیروزه‌ای آسمان (خطوط مورب)
  {
    id: 'sky-stripes',
    name: 'فیروزه‌ای آسمان',
    patternName: 'خطوط مورب ظریف',
    swatchColor: '#0284c7',
    category: 'پویا',
    lightStyle: {
      backgroundColor: '#f0f9ff',
      backgroundImage:
        'repeating-linear-gradient(45deg, rgba(14, 165, 233, 0.16), rgba(14, 165, 233, 0.16) 2px, transparent 2px, transparent 14px)',
    },
    darkStyle: {
      backgroundColor: '#061524',
      backgroundImage:
        'repeating-linear-gradient(45deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.2) 2px, transparent 2px, transparent 14px)',
    },
  },
  // 4. سبز زمردی (لوزی‌های آرژیل هندسی)
  {
    id: 'mint-diamonds',
    name: 'سبز زمردی',
    patternName: 'لوزی‌های آرژیل هندسی',
    swatchColor: '#10b981',
    category: 'طبیعت',
    lightStyle: {
      backgroundColor: '#ecfdf5',
      backgroundImage:
        'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 25%, transparent 25%), linear-gradient(225deg, rgba(16, 185, 129, 0.16) 25%, transparent 25%), linear-gradient(315deg, rgba(16, 185, 129, 0.16) 25%, transparent 25%), linear-gradient(45deg, rgba(16, 185, 129, 0.16) 25%, transparent 25%)',
      backgroundPosition: '-12px 0, -12px 0, 0 0, 0 0',
      backgroundSize: '24px 24px',
    },
    darkStyle: {
      backgroundColor: '#041c14',
      backgroundImage:
        'linear-gradient(135deg, rgba(52, 211, 153, 0.18) 25%, transparent 25%), linear-gradient(225deg, rgba(52, 211, 153, 0.18) 25%, transparent 25%), linear-gradient(315deg, rgba(52, 211, 153, 0.18) 25%, transparent 25%), linear-gradient(45deg, rgba(52, 211, 153, 0.18) 25%, transparent 25%)',
      backgroundPosition: '-12px 0, -12px 0, 0 0, 0 0',
      backgroundSize: '24px 24px',
    },
  },
  // 5. طلایی کهربایی (کندوی عسل شش‌ضلعی)
  {
    id: 'amber-honeycomb',
    name: 'طلایی کهربایی',
    patternName: 'کندوی عسل (شش‌ضلعی)',
    swatchColor: '#d97706',
    category: 'گرم',
    lightStyle: {
      backgroundColor: '#fffbeb',
      backgroundImage:
        'radial-gradient(circle at 100% 50%, transparent 20%, rgba(217, 119, 6, 0.15) 21%, rgba(217, 119, 6, 0.15) 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, rgba(217, 119, 6, 0.15) 21%, rgba(217, 119, 6, 0.15) 34%, transparent 35%, transparent)',
      backgroundPosition: '0 0, 0 -13px',
      backgroundSize: '26px 26px',
    },
    darkStyle: {
      backgroundColor: '#1c1303',
      backgroundImage:
        'radial-gradient(circle at 100% 50%, transparent 20%, rgba(245, 158, 11, 0.18) 21%, rgba(245, 158, 11, 0.18) 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, rgba(245, 158, 11, 0.18) 21%, rgba(245, 158, 11, 0.18) 34%, transparent 35%, transparent)',
      backgroundPosition: '0 0, 0 -13px',
      backgroundSize: '26px 26px',
    },
  },
  // 6. یاسی شاهوار (امواج ریتمیک)
  {
    id: 'violet-waves',
    name: 'یاسی شاهوار',
    patternName: 'امواج ریتمیک ملایم',
    swatchColor: '#8b5cf6',
    category: 'آرامش‌بخش',
    lightStyle: {
      backgroundColor: '#f5f3ff',
      backgroundImage:
        'radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.18) 8px, transparent 9px), radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.18) 8px, transparent 9px)',
      backgroundPosition: '0 0, 14px 0',
      backgroundSize: '28px 28px',
    },
    darkStyle: {
      backgroundColor: '#160b24',
      backgroundImage:
        'radial-gradient(circle at 50% 100%, rgba(167, 139, 250, 0.2) 8px, transparent 9px), radial-gradient(circle at 50% 0%, rgba(167, 139, 250, 0.2) 8px, transparent 9px)',
      backgroundPosition: '0 0, 14px 0',
      backgroundSize: '28px 28px',
    },
  },
  // 7. سورمه‌ای دیپلمات (چهارخانه تارتان)
  {
    id: 'indigo-plaid',
    name: 'سورمه‌ای دیپلمات',
    patternName: 'چهارخانه اداری (تارتان)',
    swatchColor: '#4f46e5',
    category: 'رسمی',
    lightStyle: {
      backgroundColor: '#eef2ff',
      backgroundImage:
        'linear-gradient(rgba(79, 70, 229, 0.14) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(79, 70, 229, 0.14) 1.5px, transparent 1.5px)',
      backgroundSize: '22px 22px',
    },
    darkStyle: {
      backgroundColor: '#0b0f27',
      backgroundImage:
        'linear-gradient(rgba(129, 140, 248, 0.18) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(129, 140, 248, 0.18) 1.5px, transparent 1.5px)',
      backgroundSize: '22px 22px',
    },
  },
  // 8. مرجانی گرم (زیگزاگ شورون)
  {
    id: 'coral-chevron',
    name: 'مرجانی گرم',
    patternName: 'زیگزاگ مدرن (شورون)',
    swatchColor: '#ea580c',
    category: 'گرم',
    lightStyle: {
      backgroundColor: '#fff7ed',
      backgroundImage:
        'linear-gradient(135deg, rgba(234, 88, 12, 0.16) 25%, transparent 25%), linear-gradient(225deg, rgba(234, 88, 12, 0.16) 25%, transparent 25%), linear-gradient(315deg, rgba(234, 88, 12, 0.16) 25%, transparent 25%), linear-gradient(45deg, rgba(234, 88, 12, 0.16) 25%, transparent 25%)',
      backgroundPosition: '-12px 0, -12px 0, 0 0, 0 0',
      backgroundSize: '24px 24px',
    },
    darkStyle: {
      backgroundColor: '#220e04',
      backgroundImage:
        'linear-gradient(135deg, rgba(251, 146, 60, 0.18) 25%, transparent 25%), linear-gradient(225deg, rgba(251, 146, 60, 0.18) 25%, transparent 25%), linear-gradient(315deg, rgba(251, 146, 60, 0.18) 25%, transparent 25%), linear-gradient(45deg, rgba(251, 146, 60, 0.18) 25%, transparent 25%)',
      backgroundPosition: '-12px 0, -12px 0, 0 0, 0 0',
      backgroundSize: '24px 24px',
    },
  },
  // 9. یشمی درباری (حلقه‌های اسلیمی)
  {
    id: 'teal-rings',
    name: 'یشمی درباری',
    patternName: 'حلقه‌های اسلیمی متقاطع',
    swatchColor: '#0d9488',
    category: 'کلاسیک',
    lightStyle: {
      backgroundColor: '#f0fdfa',
      backgroundImage:
        'radial-gradient(circle, transparent 20%, rgba(13, 148, 136, 0.15) 21%, rgba(13, 148, 136, 0.15) 24%, transparent 25%, transparent)',
      backgroundSize: '26px 26px',
    },
    darkStyle: {
      backgroundColor: '#041715',
      backgroundImage:
        'radial-gradient(circle, transparent 20%, rgba(45, 212, 191, 0.18) 21%, rgba(45, 212, 191, 0.18) 24%, transparent 25%, transparent)',
      backgroundSize: '26px 26px',
    },
  },
  // 10. موکا و قهوه (تار و پود بافته)
  {
    id: 'mocha-crosshatch',
    name: 'موکا و قهوه',
    patternName: 'تار و پود بافته (Crosshatch)',
    swatchColor: '#78716c',
    category: 'طبیعی',
    lightStyle: {
      backgroundColor: '#fafaf9',
      backgroundImage:
        'repeating-linear-gradient(0deg, rgba(120, 113, 108, 0.15) 0px, rgba(120, 113, 108, 0.15) 1.5px, transparent 1.5px, transparent 12px), repeating-linear-gradient(90deg, rgba(120, 113, 108, 0.15) 0px, rgba(120, 113, 108, 0.15) 1.5px, transparent 1.5px, transparent 12px)',
    },
    darkStyle: {
      backgroundColor: '#171412',
      backgroundImage:
        'repeating-linear-gradient(0deg, rgba(168, 162, 158, 0.18) 0px, rgba(168, 162, 158, 0.18) 1.5px, transparent 1.5px, transparent 12px), repeating-linear-gradient(90deg, rgba(168, 162, 158, 0.18) 0px, rgba(168, 162, 158, 0.18) 1.5px, transparent 1.5px, transparent 12px)',
    },
  },
  // 11. یاقوتی اناری (شکوفه‌های هندسی یاقوتی)
  {
    id: 'ruby-blossom',
    name: 'یاقوتی اناری',
    patternName: 'شکوفه‌های هندسی ریز',
    swatchColor: '#e11d48',
    category: 'گرم',
    lightStyle: {
      backgroundColor: '#fef2f2',
      backgroundImage:
        'radial-gradient(circle at 0 0, rgba(225, 29, 72, 0.16) 3px, transparent 3.5px), radial-gradient(circle at 14px 14px, rgba(225, 29, 72, 0.16) 3px, transparent 3.5px), radial-gradient(circle at 7px 7px, rgba(225, 29, 72, 0.22) 2px, transparent 2.5px)',
      backgroundSize: '28px 28px',
    },
    darkStyle: {
      backgroundColor: '#20070c',
      backgroundImage:
        'radial-gradient(circle at 0 0, rgba(251, 113, 133, 0.18) 3px, transparent 3.5px), radial-gradient(circle at 14px 14px, rgba(251, 113, 133, 0.18) 3px, transparent 3.5px), radial-gradient(circle at 7px 7px, rgba(251, 113, 133, 0.25) 2px, transparent 2.5px)',
      backgroundSize: '28px 28px',
    },
  },
  // 12. تالاب فیروزه (حباب‌های شناور دوار)
  {
    id: 'cyan-bubbles',
    name: 'تالاب فیروزه',
    patternName: 'حباب‌های شناور دوار',
    swatchColor: '#06b6d4',
    category: 'خنک',
    lightStyle: {
      backgroundColor: '#ecfeff',
      backgroundImage:
        'radial-gradient(circle at 6px 6px, rgba(8, 145, 178, 0.18) 3px, transparent 4px), radial-gradient(circle at 18px 18px, rgba(8, 145, 178, 0.12) 5px, transparent 6px)',
      backgroundSize: '26px 26px',
    },
    darkStyle: {
      backgroundColor: '#04171f',
      backgroundImage:
        'radial-gradient(circle at 6px 6px, rgba(34, 211, 238, 0.2) 3px, transparent 4px), radial-gradient(circle at 18px 18px, rgba(34, 211, 238, 0.15) 5px, transparent 6px)',
      backgroundSize: '26px 26px',
    },
  },
  // 13. لیمویی تابستانی (شبکه شطرنجی مورب)
  {
    id: 'lime-mesh',
    name: 'لیمویی تابستانی',
    patternName: 'شطرنجی مورب',
    swatchColor: '#84cc16',
    category: 'شاداب',
    lightStyle: {
      backgroundColor: '#f7fee7',
      backgroundImage:
        'linear-gradient(45deg, rgba(101, 163, 13, 0.14) 25%, transparent 25%), linear-gradient(-45deg, rgba(101, 163, 13, 0.14) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(101, 163, 13, 0.14) 75%), linear-gradient(-45deg, transparent 75%, rgba(101, 163, 13, 0.14) 75%)',
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    },
    darkStyle: {
      backgroundColor: '#0d1a03',
      backgroundImage:
        'linear-gradient(45deg, rgba(163, 230, 53, 0.16) 25%, transparent 25%), linear-gradient(-45deg, rgba(163, 230, 53, 0.16) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(163, 230, 53, 0.16) 75%), linear-gradient(-45deg, transparent 75%, rgba(163, 230, 53, 0.16) 75%)',
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    },
  },
  // 14. سرخابی درخشان (ستاره‌های ستاره‌باران)
  {
    id: 'fuchsia-stars',
    name: 'سرخابی درخشان',
    patternName: 'نقاط ستاره‌ای درخشان',
    swatchColor: '#c026d3',
    category: 'فانتزی',
    lightStyle: {
      backgroundColor: '#fdf4ff',
      backgroundImage:
        'radial-gradient(rgba(192, 38, 211, 0.18) 2px, transparent 2px), radial-gradient(rgba(217, 70, 239, 0.14) 1.5px, transparent 1.5px)',
      backgroundPosition: '0 0, 11px 11px',
      backgroundSize: '22px 22px',
    },
    darkStyle: {
      backgroundColor: '#1d0524',
      backgroundImage:
        'radial-gradient(rgba(232, 121, 249, 0.22) 2px, transparent 2px), radial-gradient(rgba(240, 171, 252, 0.16) 1.5px, transparent 1.5px)',
      backgroundPosition: '0 0, 11px 11px',
      backgroundSize: '22px 22px',
    },
  },
  // 15. دودی فیبر کربن (بافت گرافیتی مدرن)
  {
    id: 'charcoal-carbon',
    name: 'دودی گرافیتی',
    patternName: 'بافت کربن مدرن',
    swatchColor: '#475569',
    category: 'مدرن',
    lightStyle: {
      backgroundColor: '#f8fafc',
      backgroundImage:
        'radial-gradient(rgba(71, 85, 105, 0.2) 2px, transparent 2.5px), radial-gradient(rgba(51, 65, 85, 0.15) 1.5px, transparent 2px)',
      backgroundPosition: '0 0, 8px 8px',
      backgroundSize: '16px 16px',
    },
    darkStyle: {
      backgroundColor: '#0b0f17',
      backgroundImage:
        'radial-gradient(rgba(148, 163, 184, 0.22) 2px, transparent 2.5px), radial-gradient(rgba(100, 116, 139, 0.18) 1.5px, transparent 2px)',
      backgroundPosition: '0 0, 8px 8px',
      backgroundSize: '16px 16px',
    },
  },
];

export const DEFAULT_BG_THEME_ID = 'slate-grid';

export function getBackgroundTheme(id?: string | null): BackgroundTheme {
  const found = BACKGROUND_THEMES.find((t) => t.id === id);
  return found || BACKGROUND_THEMES[0];
}
