import React from 'react';
import { Employee, AppSettings, LocationItem } from '../types.ts';
import { toPersianDigits } from '../utils/shamsi.ts';
import { getEmployeeUnitAndFloor } from '../utils/location.ts';

export type PageSize = 'A4' | 'A3';
export type Orientation = 'portrait' | 'landscape';
export type ColumnCount = 2 | 3 | 4;
export type Density = 'ultra' | 'compact' | 'normal';

export interface PageGroupItem {
  buildingName: string;
  deptName: string;
  employees: Employee[];
  isContinuation?: boolean;
}

export interface PaginatedPageData {
  pageNumber: number;
  groups: PageGroupItem[];
  columnsData?: PageGroupItem[][];
  totalEmployees: number;
}

export interface DirectoryPageSheetProps {
  pageIndex: number;
  totalPages: number;
  pageData: PaginatedPageData;
  settings: AppSettings | null;
  currentDatePersian: string;
  pageSize: PageSize;
  orientation: Orientation;
  columns: ColumnCount;
  fontSizePt: number;
  density: Density;
  marginMm: number;
  showDirect: boolean;
  showMobile: boolean;
  showPosition: boolean;
  showFax: boolean;
  showUnit?: boolean;
  showFloor?: boolean;
  locMap?: Map<string, LocationItem>;
  cellPaddingStyle: React.CSSProperties;
  headerPaddingStyle: React.CSSProperties;
  sectionMarginStyle: React.CSSProperties;
  posMap: Map<string, { id: string; title: string }>;
  getEmployeePhones: (emp: Employee) => {
    extensions: string[];
    directPhones: string[];
    mobilenums: string[];
    faxes: string[];
  };
  getPaperDimensionsStyle: () => React.CSSProperties;
}

export const DirectoryPageSheet: React.FC<DirectoryPageSheetProps> = ({
  pageIndex,
  totalPages,
  pageData,
  settings,
  currentDatePersian,
  pageSize,
  orientation,
  columns,
  fontSizePt,
  density,
  showDirect,
  showMobile,
  showPosition,
  showFax,
  showUnit = false,
  showFloor = false,
  locMap,
  cellPaddingStyle,
  headerPaddingStyle,
  sectionMarginStyle,
  posMap,
  getEmployeePhones,
  getPaperDimensionsStyle,
}) => {
  const hasSubsequentCol = {
    name: true,
    ext: showDirect || showMobile || showUnit || showFloor || showFax,
    direct: showMobile || showUnit || showFloor || showFax,
    mobile: showUnit || showFloor || showFax,
    unit: showFloor || showFax,
    floor: showFax,
    fax: false,
  };

  return (
    <div
      id={`printable-directory-page-${pageIndex + 1}`}
      className="printable-directory-page bg-white text-slate-950 shadow-2xl print:shadow-none print:w-full rounded-sm border border-slate-200 print:border-none relative transition-all flex flex-col justify-between"
      style={{
        ...getPaperDimensionsStyle(),
        fontFamily: "'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header: Rendered on EVERY page */}
      <header className="border-b-2 border-slate-900 pb-1.5 mb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt="لوگو"
              className="h-8 w-auto max-w-[95px] max-h-8 object-contain select-none"
            />
          ) : (
            <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs select-none">
              🏢
            </div>
          )}
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight">
              {settings?.organization_name || 'دفتر تلفن سازمان'}
            </h1>
            <p className="text-[8.5px] text-slate-600 font-medium">
              راهنمای خطوط ارتباطی و کارکنان
            </p>
          </div>
        </div>

        <div className="text-left text-[8.5px] text-slate-600 leading-tight">
          <div>
            تاریخ: <span className="font-bold text-slate-900">{currentDatePersian}</span>
          </div>
          <div className="text-slate-500">
            {pageSize} - {orientation === 'landscape' ? 'افقی' : 'عمودی'} | {toPersianDigits(columns)} ستون
          </div>
        </div>
      </header>

      {/* Multi-Column Directory Flow for this page */}
      <main
        className="w-full flex-1 grid items-start"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          columnGap: density === 'ultra' ? '8px' : density === 'compact' ? '10px' : '14px',
          fontSize: `${fontSizePt}pt`,
        }}
      >
        {(pageData.columnsData && pageData.columnsData.length > 0
          ? pageData.columnsData
          : [pageData.groups]
        ).map((colGroups, colIdx) => (
          <div
            key={colIdx}
            className={`flex flex-col min-w-0 ${
              colIdx < columns - 1 ? 'border-l border-dashed border-slate-300 pl-2' : ''
            }`}
            style={{
              gap: density === 'ultra' ? '6px' : density === 'compact' ? '8px' : '10px',
            }}
          >
            {colGroups.map((grp, gIdx) => (
              <section
                key={gIdx}
                className="border border-slate-300 rounded-sm overflow-hidden bg-white shadow-none"
                style={{
                  ...sectionMarginStyle,
                }}
              >
                {/* Building & Department Header Banner */}
                <div
                  className="bg-slate-900 text-white flex items-center justify-between font-black"
                  style={{
                    padding: density === 'ultra' ? '2px 5px' : '3px 6px',
                    fontSize: `${Math.max(fontSizePt * 1.05, 6.5)}pt`,
                  }}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-black text-white">🏢 {grp.buildingName}</span>
                    <span className="text-slate-400 font-normal">|</span>
                    <span className="font-bold text-slate-100" style={{ fontSize: '0.8em' }}>
                      🏛️ {grp.deptName}
                    </span>
                    {grp.isContinuation && (
                      <span className="text-amber-300 font-bold mr-1 text-[8.5px]">
                        - ادامه
                      </span>
                    )}
                  </div>
                  <span className="text-[8.5px] font-mono text-slate-200 font-medium">
                    {toPersianDigits(grp.employees.length)} نفر
                  </span>
                </div>

            {/* Table */}
            <table className="w-full text-right border-collapse" style={{ fontSize: `${fontSizePt}pt` }}>
              <thead>
                <tr
                  className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300"
                  style={{ fontSize: `${Math.max(fontSizePt * 0.95, 5.8)}pt` }}
                >
                  <th className="border-l border-slate-200 font-bold text-slate-800" style={headerPaddingStyle}>
                    نام
                  </th>
                  <th
                    className={`${hasSubsequentCol.ext ? 'border-l' : ''} border-slate-200 text-center bg-indigo-50 font-black text-indigo-950`}
                    style={{ ...headerPaddingStyle, width: '18%' }}
                  >
                    داخلی
                  </th>
                  {showDirect && (
                    <th
                      className={`${hasSubsequentCol.direct ? 'border-l' : ''} border-slate-200 text-center font-bold text-slate-800`}
                      style={{ ...headerPaddingStyle, width: '20%' }}
                    >
                      مستقیم
                    </th>
                  )}
                  {showMobile && (
                    <th
                      className={`${hasSubsequentCol.mobile ? 'border-l' : ''} border-slate-200 text-center font-bold text-slate-800`}
                      style={{ ...headerPaddingStyle, width: '22%' }}
                    >
                      همراه
                    </th>
                  )}
                  {showUnit && (
                    <th
                      className={`${hasSubsequentCol.unit ? 'border-l' : ''} border-slate-200 text-center font-bold text-slate-800`}
                      style={{ ...headerPaddingStyle, width: showFloor ? '11%' : '13%' }}
                    >
                      واحد
                    </th>
                  )}
                  {showFloor && (
                    <th
                      className={`${hasSubsequentCol.floor ? 'border-l' : ''} border-slate-200 text-center font-bold text-slate-800`}
                      style={{ ...headerPaddingStyle, width: showUnit ? '9%' : '11%' }}
                    >
                      طبقه
                    </th>
                  )}
                  {showFax && (
                    <th className="text-center font-bold text-slate-800" style={{ ...headerPaddingStyle, width: '15%' }}>
                      فکس
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {grp.employees.map((emp, empIdx) => {
                  const { extensions, directPhones, mobilenums, faxes } = getEmployeePhones(emp);
                  const pos = emp.position_id ? posMap.get(emp.position_id) : undefined;
                  const { unit: empUnit, floor: empFloor } = getEmployeeUnitAndFloor(emp, locMap);

                  return (
                    <tr
                      key={emp.id}
                      className={`border-b border-slate-200/80 ${
                        empIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                      }`}
                    >
                      {/* Name & optional Position */}
                      <td className="border-l border-slate-200 text-slate-900" style={cellPaddingStyle}>
                        <div className="leading-tight font-bold text-slate-900 truncate">
                          {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                        </div>
                        {showPosition && pos?.title && (
                          <div
                            className="text-slate-600 font-medium truncate mt-0.5 leading-tight"
                            style={{ fontSize: '0.82em' }}
                          >
                            {pos.title}
                          </div>
                        )}
                      </td>

                      {/* Extension */}
                      <td
                        className={`${hasSubsequentCol.ext ? 'border-l' : ''} border-slate-200 text-center bg-indigo-50/50 font-black text-indigo-950`}
                        style={{
                          ...cellPaddingStyle,
                          fontSize: `${Math.max(fontSizePt * 1.05, 6.5)}pt`,
                        }}
                      >
                        {extensions.length > 0 ? (
                          <div className="flex items-center justify-center flex-wrap gap-x-1 font-black text-indigo-950">
                            {extensions.map((ext, idx) => (
                              <span key={idx}>
                                {toPersianDigits(ext)}
                                {idx < extensions.length - 1 && '، '}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </td>

                      {/* Direct */}
                      {showDirect && (
                        <td
                          dir="ltr"
                          className={`${hasSubsequentCol.direct ? 'border-l' : ''} border-slate-200 text-center text-slate-800 font-medium`}
                          style={{
                            ...cellPaddingStyle,
                            fontSize: `${Math.max(fontSizePt * 0.95, 5.8)}pt`,
                          }}
                        >
                          {directPhones.length > 0 ? (
                            <div className="flex flex-col gap-0 leading-tight">
                              {directPhones.map((dp, idx) => (
                                <span key={idx}>{toPersianDigits(dp)}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                      )}

                      {/* Mobile */}
                      {showMobile && (
                        <td
                          dir="ltr"
                          className={`${hasSubsequentCol.mobile ? 'border-l' : ''} border-slate-200 text-center text-slate-900 font-semibold`}
                          style={{
                            ...cellPaddingStyle,
                            fontSize: `${Math.max(fontSizePt * 0.95, 5.8)}pt`,
                          }}
                        >
                          {mobilenums.length > 0 ? (
                            <div className="flex flex-col gap-0 leading-tight">
                              {mobilenums.map((m, idx) => (
                                <span key={idx}>{toPersianDigits(m)}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                      )}

                      {/* Unit */}
                      {showUnit && (
                        <td
                          className={`${hasSubsequentCol.unit ? 'border-l' : ''} border-slate-200 text-center text-slate-800 font-medium`}
                          style={{
                            ...cellPaddingStyle,
                            fontSize: `${Math.max(fontSizePt * 0.95, 5.8)}pt`,
                          }}
                        >
                          {empUnit ? (
                            <span>{empUnit}</span>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                      )}

                      {/* Floor */}
                      {showFloor && (
                        <td
                          className={`${hasSubsequentCol.floor ? 'border-l' : ''} border-slate-200 text-center text-slate-800 font-medium`}
                          style={{
                            ...cellPaddingStyle,
                            fontSize: `${Math.max(fontSizePt * 0.95, 5.8)}pt`,
                          }}
                        >
                          {empFloor ? (
                            <span>{empFloor}</span>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                      )}

                      {/* Fax */}
                      {showFax && (
                        <td
                          dir="ltr"
                          className="text-center text-slate-700 font-normal"
                          style={{
                            ...cellPaddingStyle,
                            fontSize: `${Math.max(fontSizePt * 0.88, 5.5)}pt`,
                          }}
                        >
                          {faxes.length > 0 ? (
                            faxes.map((f, idx) => <span key={idx}>{toPersianDigits(f)}</span>)
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    ))}
  </main>

      {/* Footer: Pinned to bottom of EVERY page with solid black line & page X of Y */}
      <footer
        className="printable-directory-footer mt-auto pt-1.5 border-t border-black flex items-center justify-between text-black font-medium shrink-0"
        style={{ fontSize: `${Math.max(fontSizePt * 0.85, 6)}pt` }}
      >
        <div>{settings?.company_name || 'راهنمای تلفن سازمانی'}</div>
        <div className="text-black font-bold text-[10px]">
          صفحه {toPersianDigits(pageIndex + 1)} از {toPersianDigits(totalPages)}
        </div>
      </footer>
    </div>
  );
};
