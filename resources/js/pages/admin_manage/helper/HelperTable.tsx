import React from 'react';
import { FiSearch, FiDownload, FiSliders, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';

export interface HelperTableColumn {
  key: string;
  label: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface HelperTableProps<T> {
  columns: HelperTableColumn[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  title?: string;
  count?: number;
  
  // Top header action buttons
  exportButton?: {
    label: string;
    onClick: () => void;
  };
  filterButton?: {
    label: string;
    onClick: () => void;
  };
  addButton?: {
    label: string;
    onClick: () => void;
  };

  // Custom row render
  renderRow: (item: T, index: number) => React.ReactNode;

  // Pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;

  // Empty state configs
  emptyStateText?: string;
  emptyStateSubtext?: string;
}

export function HelperTable<T>({
  columns,
  data,
  loading = false,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  title,
  count,
  exportButton,
  filterButton,
  addButton,
  renderRow,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  emptyStateText = 'No Records Found',
  emptyStateSubtext = 'Try adjusting search or filter criteria to view records.',
}: HelperTableProps<T>) {
  
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;

  const tableRef = React.useRef<HTMLDivElement>(null);

  const handlePageChange = (pageNum: number) => {
    onPageChange(pageNum);
    // Smooth scroll to the top of the table component
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={tableRef} className="space-y-4 font-kuntomruy animate-fade-in">
      {/* ── Main Table Card ─────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-[5px] shadow-xs overflow-hidden">
        {/* Top bar inside the card */}
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100">
          {/* Left: Title & Count */}
          <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto">
            {title && (
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
                {title}
              </h3>
            )}
            {count !== undefined && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-2xs font-extrabold text-slate-500 bg-slate-100 rounded-full">
                {count}
              </span>
            )}
          </div>

          {/* Right: Search & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end">
            {/* Search input */}
            {onSearchChange && (
              <div className="relative flex items-stretch w-full sm:w-64">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-200 rounded-l-[5px] text-xs text-slate-800 focus:outline-none focus:border-slate-350 transition-all placeholder-slate-400 font-medium"
                />
                <button 
                  type="button"
                  className="px-3 bg-slate-100 border-y border-r border-slate-200 rounded-r-[5px] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <FiSearch className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {filterButton && (
                <button
                  type="button"
                  onClick={filterButton.onClick}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#0f53a1] border border-[#0f53a1] rounded-[5px] text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95 duration-200 cursor-pointer shadow-2xs"
                >
                  <FiSliders className="w-3.5 h-3.5" />
                  <span>{filterButton.label}</span>
                </button>
              )}

              {exportButton && (
                <button
                  type="button"
                  onClick={exportButton.onClick}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#0f53a1] border border-[#0f53a1] rounded-[5px] text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95 duration-200 cursor-pointer shadow-2xs"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>{exportButton.label}</span>
                </button>
              )}

              {addButton && (
                <button
                  type="button"
                  onClick={addButton.onClick}
                  className="px-3.5 py-1.5 bg-[#0f53a1] hover:bg-[#0b4789] text-white rounded-[5px] text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all duration-200 cursor-pointer border-none shrink-0"
                >
                  <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{addButton.label}</span>
                </button>
              )}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-slate-500 text-sm font-bold">Retrieving active records...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
              <FiSearch className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-slate-500 font-extrabold text-base">{emptyStateText}</span>
            <span className="text-slate-400 text-xs text-center max-w-xs leading-relaxed font-semibold">
              {emptyStateSubtext}
            </span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase font-extrabold tracking-wider">
                    {columns.map((col) => {
                      const alignClass = 
                        col.align === 'center' ? 'text-center' :
                        col.align === 'right' ? 'text-right' : 'text-left';
                      return (
                        <th
                          key={col.key}
                          className={`sticky top-0 z-10 py-4 px-5 bg-slate-50/95 backdrop-blur-[1px] border-b border-slate-100 ${alignClass} ${col.className || ''}`}
                        >
                          {col.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 text-xs sm:text-sm">
                  {data.map((item, index) => renderRow(item, index))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination Footer ─────────────────────────────── */}
            <div className="bg-slate-50/30 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="text-xs text-slate-500 font-semibold">
                  Showing <span className="font-extrabold text-slate-800">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-extrabold text-slate-800">
                    {Math.min(indexOfLastItem, totalItems)}
                  </span>{' '}
                  of <span className="font-extrabold text-slate-800">{totalItems}</span> records
                </div>
                {onItemsPerPageChange && (
                  <div className="hidden sm:flex items-center space-x-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-2xs font-extrabold text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-[5px] bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
                    title="Previous Page"
                  >
                    <FiChevronLeft className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1.5 text-xs font-black rounded-[5px] border transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-primary border-primary text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 rounded-[5px] bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
                    title="Next Page"
                  >
                    <FiChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
