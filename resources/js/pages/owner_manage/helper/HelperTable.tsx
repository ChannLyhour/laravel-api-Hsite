import React from 'react';
import { FiSearch, FiDownload, FiSliders, FiPlus, FiChevronLeft, FiChevronRight, FiGrid, FiList } from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';
import { useTranslation } from '@/pages/owner_manage/lang/i18n';

export interface HelperTableColumn {
  key: string;
  label: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
  filterable?: boolean;
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
  
  // Column specific filters
  columnFilters?: Record<string, string>;
  onColumnFilterChange?: (key: string, value: string) => void;

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

  // Optional Selection configuration
  selectedIds?: any[];
  onSelectionChange?: (selectedIds: any[]) => void;
  getRowId?: (item: T) => any;
  bulkActions?: Array<{
    label: string;
    onClick: (selectedIds: any[]) => void;
    className?: string;
  }>;
  renderCard?: (item: T, index: number, isSelected: boolean, onSelect: (checked: boolean) => void) => React.ReactNode;
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
  columnFilters,
  onColumnFilterChange,
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
  selectedIds,
  onSelectionChange,
  getRowId,
  bulkActions,
  renderCard,
}: HelperTableProps<T>) {
  
  const { t } = useTranslation();
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table');
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
      <div className="custom-card-container rounded-[5px] shadow-xs overflow-hidden border">
        {/* Top bar inside the card */}
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between custom-card-header-bar">
          {/* Left: Title & Count */}
          <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto">
            {title && (
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                {title}
              </h3>
            )}
            {count !== undefined && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-2xs font-extrabold bg-primary/10 text-primary rounded-full">
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
                  className="w-full pl-3 pr-10 py-1.5 bg-transparent border rounded-l-[5px] text-xs focus:outline-none transition-all placeholder-slate-400 font-medium"
                />
                <button 
                  type="button"
                  className="px-3 border-y border-r rounded-r-[5px] flex items-center justify-center transition-colors cursor-pointer bg-black/[0.03] hover:bg-black/[0.08]"
                >
                  <FiSearch className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              {filterButton && (
                <button
                  type="button"
                  onClick={filterButton.onClick}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#0f53a1] border border-[#0f53a1] rounded-[5px] text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95 duration-200 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <FiSliders className="w-3.5 h-3.5" />
                  <span>{filterButton.label}</span>
                </button>
              )}

              {exportButton && (
                <button
                  type="button"
                  onClick={exportButton.onClick}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#0f53a1] border border-[#0f53a1] rounded-[5px] text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95 duration-200 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>{exportButton.label}</span>
                </button>
              )}



              {renderCard && (
                <button
                  type="button"
                  onClick={() => setViewMode(prev => prev === 'table' ? 'grid' : 'table')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#0f53a1] border border-[#0f53a1] rounded-[5px] text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95 duration-200 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  {viewMode === 'table' ? (
                    <>
                      <FiGrid className="w-3.5 h-3.5" />
                      <span>{t('menu.grid_view') || 'Grid View'}</span>
                    </>
                  ) : (
                    <>
                      <FiList className="w-3.5 h-3.5" />
                      <span>{t('menu.table_view') || 'Table View'}</span>
                    </>
                  )}
                </button>
              )}

              {addButton && (
                <button
                  type="button"
                  onClick={addButton.onClick}
                  className="px-3.5 py-1.5 bg-[#0f53a1] hover:bg-[#0b4789] text-white rounded-[5px] text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all duration-200 cursor-pointer border-none shrink-0 whitespace-nowrap"
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
            {/* Bulk Selection Info Banner */}
            {selectedIds && onSelectionChange && getRowId && selectedIds.length > 0 && (
              <div className="bg-primary/5 px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in font-kuntomruy">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-extrabold text-primary">
                    {selectedIds.length} items selected
                  </span>
                  {bulkActions && bulkActions.length > 0 && (
                    <div className="flex items-center gap-2">
                      {bulkActions.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => action.onClick(selectedIds)}
                          className={`px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-[5px] text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer shadow-3xs hover:border-slate-300 ${action.className || ''}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectionChange([])}
                  className="text-xs font-extrabold text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            )}

            {viewMode === 'grid' && renderCard ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 p-2 md:p-4 bg-slate-50/30 max-h-[600px] overflow-y-auto rounded-[8px] border border-slate-100">
                {data.map((item, index) => {
                  const rowId = getRowId ? getRowId(item) : null;
                  const isChecked = selectedIds && rowId ? selectedIds.includes(rowId) : false;
                  const handleSelect = (checked: boolean) => {
                    if (!selectedIds || !onSelectionChange || !rowId) return;
                    if (checked) {
                      onSelectionChange([...selectedIds, rowId]);
                    } else {
                      onSelectionChange(selectedIds.filter(id => id !== rowId));
                    }
                  };
                  return (
                    <React.Fragment key={rowId || index}>
                      {renderCard(item, index, isChecked, handleSelect)}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar p-1 md:p-0 bg-slate-50/30 md:bg-transparent">
                <table className="w-full text-left border-collapse block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="text-slate-500 text-xs uppercase font-extrabold tracking-wider">
                      {/* Checkbox column header */}
                      {selectedIds && onSelectionChange && getRowId && (
                        <th className="sticky top-0 z-10 py-4 px-5 bg-slate-50/95 backdrop-blur-[1px] border-b border-slate-100 text-center w-10">
                          <input
                            type="checkbox"
                            checked={data.length > 0 && data.every(item => selectedIds.includes(getRowId(item)))}
                            onChange={(e) => {
                              const currentIds = data.map(getRowId);
                              if (e.target.checked) {
                                const newSelected = Array.from(new Set([...selectedIds, ...currentIds]));
                                onSelectionChange(newSelected);
                              } else {
                                const newSelected = selectedIds.filter(id => !currentIds.includes(id));
                                onSelectionChange(newSelected);
                              }
                            }}
                            className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/20 accent-primary cursor-pointer"
                          />
                        </th>
                      )}
                      {columns.map((col) => {
                        const alignClass = 
                          col.align === 'center' ? 'text-center' :
                          col.align === 'right' ? 'text-right' : 'text-left';
                        const hasFilter = col.filterable && onColumnFilterChange;
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
                  <tbody className="divide-y divide-slate-100 text-slate-900 text-[12px] sm:text-[14px] block md:table-row-group space-y-3.5 md:space-y-0">
                    {data.map((item, index) => {
                      const rowElement = renderRow(item, index);
                      if (React.isValidElement(rowElement)) {
                        const validRowElement = rowElement as React.ReactElement<any>;
                        const rowId = getRowId ? getRowId(item) : null;
                        const isChecked = selectedIds && rowId ? selectedIds.includes(rowId) : false;

                        // Get original children (tds) of the tr
                        const originalChildren = React.Children.toArray(validRowElement.props.children) as React.ReactElement<any>[];

                        // Enhance tds with mobile responsive labels and flex styles
                        const enhancedChildren = originalChildren.map((child, colIdx) => {
                          if (!React.isValidElement(child)) return child;

                          // Check if it's the checkbox / selection column
                          const isSelection = child.key === 'selection' || (selectedIds && colIdx === 0 && originalChildren.length > columns.length);
                          
                          // Map correct column label
                          const colConfigIdx = selectedIds ? (isSelection ? -1 : colIdx - 1) : colIdx;
                          const label = colConfigIdx >= 0 && columns[colConfigIdx] ? columns[colConfigIdx].label : (t('menu.select') || 'Select');

                          return React.cloneElement(child, {
                            'data-label': label,
                            className: `flex md:table-cell py-2.5 md:py-3.5 px-0 md:px-5 border-none md:border-b md:border-slate-100/50 items-center justify-between md:justify-start before:content-[attr(data-label)] before:md:hidden before:font-extrabold before:text-[10px] before:text-slate-400 before:uppercase before:tracking-wider before:mr-4 text-right md:text-left ${(child.props as any).className || ''}`
                          } as any);
                        });

                        // If selection is enabled but not in the original row children, prepend selection column
                        let finalChildren = enhancedChildren;
                        if (selectedIds && onSelectionChange && getRowId && !originalChildren.some(c => c.key === 'selection')) {
                          const rowIdVal = getRowId(item);
                          const isCheckedVal = selectedIds.includes(rowIdVal);
                          const selectionCell = (
                            <td 
                              key="selection" 
                              data-label={t('menu.select') || 'Select'}
                              className="flex md:table-cell py-2.5 md:py-3.5 px-0 md:px-5 border-none md:border-b border-slate-100/50 items-center justify-between md:justify-start before:content-[attr(data-label)] before:md:hidden before:font-extrabold before:text-[10px] before:text-slate-400 before:uppercase before:tracking-wider before:mr-4 text-right md:text-left"
                            >
                              <input
                                type="checkbox"
                                checked={isCheckedVal}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    onSelectionChange([...selectedIds, rowIdVal]);
                                  } else {
                                    onSelectionChange(selectedIds.filter(id => id !== rowIdVal));
                                  }
                                }}
                                className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/20 accent-primary cursor-pointer"
                              />
                            </td>
                          );
                          finalChildren = [selectionCell, ...enhancedChildren];
                        }

                        return React.cloneElement(validRowElement, {
                          className: `block md:table-row bg-white border border-slate-200/60 md:border-none rounded-[8px] p-4 shadow-sm md:shadow-none mb-3.5 md:mb-0 md:bg-transparent ${validRowElement.props.className || ''}`
                        } as any, finalChildren);
                      }
                      return rowElement;
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Pagination Footer ─────────────────────────────── */}
            <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 custom-card-header-bar">
              <div className="flex items-center space-x-4">
                <div className="text-xs font-semibold">
                  Showing <span className="font-extrabold">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-extrabold">
                    {Math.min(indexOfLastItem, totalItems)}
                  </span>{' '}
                  of <span className="font-extrabold">{totalItems}</span> records
                </div>
                {onItemsPerPageChange && (
                  <div className="hidden sm:flex items-center space-x-1.5">
                    <label className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                      className="px-2 py-1 bg-transparent border rounded-lg text-2xs font-extrabold focus:outline-none"
                    >
                      <option className="bg-white text-slate-800" value="5">5</option>
                      <option className="bg-white text-slate-800" value="10">10</option>
                      <option className="bg-white text-slate-800" value="20">20</option>
                      <option className="bg-white text-slate-800" value="50">50</option>
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
                    className="p-2 border rounded-[5px] bg-transparent hover:bg-black/[0.04] disabled:opacity-40 disabled:pointer-events-none transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
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
                          : 'bg-transparent hover:bg-black/[0.04]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border rounded-[5px] bg-transparent hover:bg-black/[0.04] disabled:opacity-40 disabled:pointer-events-none transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
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
