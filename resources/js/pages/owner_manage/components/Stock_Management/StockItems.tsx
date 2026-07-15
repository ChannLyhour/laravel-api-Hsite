import React, { useState } from 'react';
import { FiEdit2, FiCheck, FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import type { MenuItem, ProductVariant } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import { HelperTable, type HelperTableColumn } from '../../helper/HelperTable';
import '@/pages/owner_manage/style/font.css';

interface StockItemsProps {
  items: MenuItem[];
  onUpdateStock: (variantId: number, qty: number, threshold: number | null) => Promise<void>;
  loading: boolean;
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onFilterClick: () => void;
}

export const StockItems: React.FC<StockItemsProps> = ({
  items,
  onUpdateStock,
  loading,
  filters,
  onFilterChange,
  onFilterClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const statusFilter = filters.status || 'all';

  // Inline edit state
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editThreshold, setEditThreshold] = useState<number>(5);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Expanded variant IDs for FIFO batch details
  const [expandedVariantIds, setExpandedVariantIds] = useState<Record<number, boolean>>({});

  const toggleExpandVariant = (variantId: number) => {
    setExpandedVariantIds(prev => ({
      ...prev,
      [variantId]: !prev[variantId]
    }));
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Flatten products into variant rows
  const variantRows: Array<{
    productId: number;
    productName: string;
    productImage: string;
    hasOptions: boolean;
    variant: ProductVariant;
  }> = [];

  items.forEach(item => {
    const vars = item.variants || [];
    if (vars.length === 0) {
      variantRows.push({
        productId: item.id,
        productName: item.name,
        productImage: item.display_image || item.image || '',
        hasOptions: false,
        variant: {
          id: item.id, // Fallback ID
          variant_sku: item.sku || `PROD-${item.id}`,
          region_code: 'GLO',
          currency_code: 'USD',
          purchase_price: '0.00',
          retail_price: item.price,
          compare_at_price: null,
          stock_qty: 0,
          low_stock_threshold: 5,
        }
      });
    } else {
      vars.forEach(v => {
        variantRows.push({
          productId: item.id,
          productName: item.name,
          productImage: item.display_image || item.image || '',
          hasOptions: !!item.has_options,
          variant: v,
        });
      });
    }
  });

  // Filter rows
  const filteredRows = variantRows.filter(row => {
    // 1. Search Query (matches product name or variant SKU)
    const matchesSearch =
      row.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.variant.variant_sku.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Status Filter
    const threshold = row.variant.low_stock_threshold ?? 5;
    const isOut = row.variant.stock_qty === 0;
    const isLow = row.variant.stock_qty > 0 && row.variant.stock_qty <= threshold;

    if (statusFilter === 'out' && !isOut) return false;
    if (statusFilter === 'low' && !isLow) return false;
    if (statusFilter === 'instock' && (isOut || isLow)) return false;

    // 3. Price Filter
    const priceFilter = filters.price || 'all';
    const price = parseFloat(row.variant.retail_price) || 0;
    if (priceFilter === 'under_10' && price >= 10) return false;
    if (priceFilter === '10_to_50' && (price < 10 || price > 50)) return false;
    if (priceFilter === 'over_50' && price <= 50) return false;

    return true;
  });

  // Paginated rows
  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

  const handleStartEdit = (row: typeof variantRows[0]) => {
    setEditingVariantId(row.variant.id || null);
    setEditQty(row.variant.stock_qty);
    setEditThreshold(row.variant.low_stock_threshold ?? 5);
  };

  const handleCancelEdit = () => {
    setEditingVariantId(null);
  };

  const handleSaveEdit = async (variantId: number) => {
    try {
      setSavingId(variantId);
      await onUpdateStock(variantId, editQty, editThreshold);
      setEditingVariantId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const columns: HelperTableColumn[] = [
    { key: 'sl', label: 'SL', align: 'center', className: 'w-12 text-slate-400 font-bold' },
    { key: 'details', label: 'Product Details' },
    { key: 'sku', label: 'Variant SKU' },
    { key: 'qty', label: 'Stock Qty', align: 'center' },
    { key: 'threshold', label: 'Safety Threshold', align: 'center' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'right', className: 'w-36' }
  ];

  const renderRow = (row: typeof variantRows[0], idx: number) => {
    const sl = indexOfFirstItem + idx + 1;
    const isEditing = editingVariantId === row.variant.id;
    const isSaving = savingId === row.variant.id;

    const threshold = row.variant.low_stock_threshold ?? 5;
    const isOutOfStock = row.variant.stock_qty === 0;
    const isLowStock = row.variant.stock_qty > 0 && row.variant.stock_qty <= threshold;

    const isExpanded = !!expandedVariantIds[row.variant.id!];

    return (
      <React.Fragment key={row.variant.id}>
        <tr className="hover:bg-slate-50/20 transition-colors">
          <td className="py-3.5 px-5 text-center text-[12px] font-bold text-slate-400">{sl}</td>
          <td className="py-3.5 px-5">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => toggleExpandVariant(row.variant.id!)}
                className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded transition-all shrink-0 cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-200"
                title="View FIFO Batches"
              >
                {isExpanded ? (
                  <FiChevronDown className="w-4 h-4 text-orange-500" />
                ) : (
                  <FiChevronRight className="w-4 h-4" />
                )}
              </button>
              <div className="w-10 h-10 rounded-[5px] overflow-hidden bg-slate-50 border border-slate-150 shrink-0">
                <img
                  src={resolveImageUrl(row.variant.image_url || row.productImage)}
                  alt={row.productName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                  }}
                />
              </div>
              <div>
                <div className="text-[13px] font-bold text-slate-800 leading-tight">{row.productName}</div>
                {row.hasOptions && row.variant.attribute_values && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {row.variant.attribute_values.map((av: any, aIdx: number) => (
                      <span
                        key={aIdx}
                        className="px-1.5 py-0.5 rounded-[3px] bg-slate-100 text-slate-500 text-[9px] font-bold border border-slate-200"
                      >
                        {av.attribute?.name || 'Attr'}: {av.value?.includes('|') ? av.value.split('|')[0] : av.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
          <td className="py-3.5 px-5 text-[11px] font-bold text-slate-500">{row.variant.variant_sku}</td>

          {/* Stock Qty column */}
          <td className="py-3.5 px-5 text-center">
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editQty}
                onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 px-2 py-1 text-center border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-md outline-none text-xs font-bold text-slate-800 transition-all"
              />
            ) : (
              <span className={`px-2.5 py-0.5 rounded-[4px] text-xs font-black ${isOutOfStock
                  ? 'bg-rose-50 text-rose-550 border border-rose-100'
                  : isLowStock
                    ? 'bg-amber-50 text-amber-650 border border-amber-100'
                    : 'bg-emerald-50 text-emerald-650 border border-emerald-100'
                }`}>
                {row.variant.stock_qty}
              </span>
            )}
          </td>

          {/* Safety Limit Column */}
          <td className="py-3.5 px-5 text-center">
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editThreshold}
                onChange={(e) => setEditThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 px-2 py-1 text-center border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-md outline-none text-xs font-bold text-slate-800 transition-all"
              />
            ) : (
              <span className="text-[12px] font-bold text-slate-400">{threshold}</span>
            )}
          </td>

          {/* Status badge */}
          <td className="py-3.5 px-5 text-center">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider ${isOutOfStock
                ? 'bg-rose-50 text-rose-500'
                : isLowStock
                  ? 'bg-amber-50 text-amber-500'
                  : 'bg-emerald-50 text-emerald-500'
              }`}>
              {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
            </span>
          </td>

          {/* Action buttons */}
          <td className="py-3.5 px-5 text-right w-36">
            {isEditing ? (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  disabled={isSaving}
                  onClick={() => handleSaveEdit(row.variant.id!)}
                  className="p-2 border border-emerald-250/70 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 duration-150 bg-white"
                  title="Save Changes"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={isSaving}
                  onClick={handleCancelEdit}
                  className="p-2 border border-slate-200/80 text-slate-550 hover:bg-slate-100 rounded-lg transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 duration-150 bg-white"
                  title="Cancel"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStartEdit(row)}
                className="p-2 border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg transition-all cursor-pointer flex items-center justify-center ml-auto hover:scale-105 active:scale-95 duration-150 bg-white shadow-3xs"
                title="Quick Edit"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </td>
        </tr>

        {isExpanded && (
          <tr className="bg-slate-50/40 border-l-2 border-orange-500">
            <td colSpan={7} className="py-3 px-6 text-left">
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h5 className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    <span>បាច់ទំនិញលម្អិត FIFO (FIFO Stock Batches)</span>
                  </h5>
                  <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-[4px]">
                    {row.variant.stock_batches?.length || 0} Batches
                  </span>
                </div>

                {!row.variant.stock_batches || row.variant.stock_batches.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-semibold py-2 italic text-center">
                    មិនមានបាច់ទំនិញសកម្មទេ (No active stock batches found)
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-150 text-[9px] font-extrabold text-slate-450 uppercase tracking-tight">
                          <th className="py-2">កាលបរិច្ឆេទ (Date)</th>
                          <th className="py-2 text-center">នាំចូលដំបូង (Initial)</th>
                          <th className="py-2 text-center">នៅសល់ (Remaining)</th>
                          <th className="py-2 text-right">តម្លៃដើម (Cost)</th>
                          <th className="py-2 text-right">ទុនកកស្ទះ (Capital Value)</th>
                          <th className="py-2 text-center">ស្ថានភាព (Status)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[10px] font-bold text-slate-650">
                        {row.variant.stock_batches.map((batch: any, bIdx: number) => {
                          const initialQty = parseInt(batch.initial_qty) || 0;
                          const remainingQty = parseInt(batch.remaining_qty) || 0;
                          const purchasePrice = parseFloat(batch.purchase_price) || 0;
                          const capitalValue = remainingQty * purchasePrice;
                          const isBatchConsumed = remainingQty <= 0;

                          return (
                            <tr key={batch.id || bIdx} className={`${isBatchConsumed ? 'text-slate-350 bg-slate-50/20' : 'text-slate-600'}`}>
                              <td className="py-2 font-normal">
                                {new Date(batch.created_at).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-2 text-center">{initialQty}</td>
                              <td className="py-2 text-center">
                                <span className={isBatchConsumed ? '' : 'font-black text-slate-800 bg-orange-50 px-1.5 py-0.5 rounded text-[10px] text-orange-700'}>
                                  {remainingQty}
                                </span>
                              </td>
                              <td className="py-2 text-right font-extrabold">${purchasePrice.toFixed(2)}</td>
                              <td className="py-2 text-right font-black text-slate-700">${capitalValue.toFixed(2)}</td>
                              <td className="py-2 text-center">
                                <span className={`inline-flex px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase ${
                                  isBatchConsumed 
                                    ? 'bg-slate-100 text-slate-400' 
                                    : remainingQty < initialQty 
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {isBatchConsumed ? 'Consumed' : remainingQty < initialQty ? 'Partial' : 'Active'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">


      <HelperTable<typeof variantRows[0]>
        columns={columns}
        data={currentRows}
        loading={loading}
        title="Stock Inventory"
        count={totalItems}
        searchPlaceholder="Search products or SKUs..."
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        filterButton={{
          label: 'Filter',
          onClick: onFilterClick,
        }}
        renderRow={renderRow}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
        emptyStateText="No stock items found"
        emptyStateSubtext="Try adjusting your search query or status filter."
      />
    </div>
  );
};
