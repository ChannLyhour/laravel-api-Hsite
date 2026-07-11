import React, { useState } from 'react';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
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

    return (
      <tr key={row.variant.id} className="hover:bg-slate-50/20 transition-colors">
        <td className="py-3.5 px-5 text-center text-[12px] font-bold text-slate-400">{sl}</td>
        <td className="py-3.5 px-5">
          <div className="flex items-center space-x-3">
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
              className="w-16 px-1.5 py-1 text-center border rounded-[4px] outline-none text-xs font-bold text-slate-800"
            />
          ) : (
            <span className={`px-2.5 py-0.5 rounded-[4px] text-xs font-black ${isOutOfStock
                ? 'bg-rose-50 text-rose-500 border border-rose-100'
                : isLowStock
                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
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
              className="w-16 px-1.5 py-1 text-center border rounded-[4px] outline-none text-xs font-bold text-slate-800"
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
                className="p-2 border border-emerald-200/85 text-emerald-600 hover:bg-emerald-50 rounded-[5px] transition-colors cursor-pointer flex items-center justify-center"
                title="Save Changes"
              >
                <FiCheck className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={isSaving}
                onClick={handleCancelEdit}
                className="p-2 border border-slate-200/80 text-slate-500 hover:bg-slate-50 rounded-[5px] transition-colors cursor-pointer flex items-center justify-center"
                title="Cancel"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleStartEdit(row)}
              className="p-2 border border-blue-200/80 text-blue-600 hover:bg-blue-50 rounded-[5px] transition-colors cursor-pointer flex items-center justify-center ml-auto"
              title="Quick Edit"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </td>
      </tr>
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
