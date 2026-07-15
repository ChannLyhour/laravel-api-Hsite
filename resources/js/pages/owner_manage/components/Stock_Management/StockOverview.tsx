import React, { useState } from 'react';
import { FiBox, FiAlertTriangle, FiLayers, FiEdit2 } from 'react-icons/fi';
import type { MenuItem, ProductVariant } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import { HelperTable, type HelperTableColumn } from '../../helper/HelperTable';
import '@/pages/owner_manage/style/font.css';

interface StockOverviewProps {
  items: MenuItem[];
  onQuickRestock: (variant: ProductVariant, productName: string) => void;
  onNavigateToTab: (view: 'items' | 'low' | 'movements' | 'abc') => void;
}

export const StockOverview: React.FC<StockOverviewProps> = ({
  items,
  onQuickRestock,
  onNavigateToTab,
}) => {
  // Aggregate stats
  const totalProducts = items.length;
  
  let totalVariants = 0;
  let totalStockUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const lowStockItems: Array<{
    productName: string;
    productImage: string;
    variant: ProductVariant;
  }> = [];

  items.forEach(item => {
    const itemVariants = item.variants || [];
    if (itemVariants.length === 0) {
      // Single product count fallback (should normally have default variant but in case)
      totalVariants += 1;
      const stock = 0;
      totalStockUnits += stock;
      outOfStockCount += 1;
    } else {
      itemVariants.forEach(v => {
        totalVariants += 1;
        totalStockUnits += v.stock_qty;
        
        const threshold = v.low_stock_threshold ?? 5;
        if (v.stock_qty === 0) {
          outOfStockCount += 1;
          lowStockItems.push({
            productName: item.name,
            productImage: item.display_image || item.image || '',
            variant: v,
          });
        } else if (v.stock_qty <= threshold) {
          lowStockCount += 1;
          lowStockItems.push({
            productName: item.name,
            productImage: item.display_image || item.image || '',
            variant: v,
          });
        }
      });
    }
  });

  // Sort low stock by stock_qty asc so out of stock is first
  lowStockItems.sort((a, b) => a.variant.stock_qty - b.variant.stock_qty);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const totalItems = lowStockItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = lowStockItems.slice(indexOfFirstItem, indexOfLastItem);

  const columns: HelperTableColumn[] = [
    { key: 'product', label: 'Product' },
    { key: 'sku', label: 'Variant SKU' },
    { key: 'qty', label: 'Stock Qty', align: 'center' },
    { key: 'threshold', label: 'Safety Limit', align: 'center' },
    { key: 'action', label: 'Action', align: 'right' }
  ];

  const renderRow = (row: typeof lowStockItems[0], index: number) => {
    const isOutOfStock = row.variant.stock_qty === 0;
    return (
      <tr key={row.variant.id} className="hover:bg-slate-50/30 transition-colors">
        <td className="py-3 px-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-[4px] overflow-hidden bg-slate-50 border border-slate-150 shrink-0">
              <img 
                src={resolveImageUrl(row.variant.image_url || row.productImage)} 
                alt={row.productName} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                }}
              />
            </div>
            <div>
              <div className="text-[12px] font-extrabold text-slate-800 leading-tight">{row.productName}</div>
              {row.variant.variant_sku !== row.productName && (
                <div className="text-slate-400 text-4xs font-bold mt-0.5">{row.variant.variant_sku}</div>
              )}
            </div>
          </div>
        </td>
        <td className="py-3 px-5 text-[11px] font-semibold text-slate-500">{row.variant.variant_sku}</td>
        <td className="py-3 px-5 text-center">
          <span className={`px-2 py-0.5 rounded-[4px] text-3xs font-black ${
            isOutOfStock 
              ? 'bg-rose-50 text-rose-500 border border-rose-100' 
              : 'bg-amber-50 text-amber-600 border border-amber-100'
          }`}>
            {row.variant.stock_qty}
          </span>
        </td>
        <td className="py-3 px-5 text-center text-[11px] font-bold text-slate-400">
          {row.variant.low_stock_threshold ?? 5}
        </td>
        <td className="py-3 px-5 text-right">
          <button
            onClick={() => onQuickRestock(row.variant, row.productName)}
            className="p-2 border border-blue-200/80 text-blue-600 hover:bg-blue-50 rounded-[5px] transition-colors cursor-pointer flex items-center justify-center ml-auto"
            title="Restock"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center space-x-4.5 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-600 shrink-0 shadow-3xs group-hover:scale-110 duration-300 transition-transform">
            <FiLayers className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Products</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{totalProducts}</h3>
            <p className="text-slate-450 text-4xs font-bold mt-0.5">{totalVariants} unique variants</p>
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center space-x-4.5 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0 shadow-3xs group-hover:scale-110 duration-300 transition-transform">
            <FiBox className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stock Qty</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{totalStockUnits}</h3>
            <p className="text-slate-450 text-4xs font-bold mt-0.5">Physical items in hand</p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div 
          onClick={() => onNavigateToTab('low')}
          className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center space-x-4.5 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-300 group hover:border-amber-300"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-600 shrink-0 shadow-3xs group-hover:scale-110 duration-300 transition-transform">
            <FiAlertTriangle className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Items</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{lowStockCount}</h3>
            <p className="text-amber-600 text-4xs font-bold mt-0.5 group-hover:underline flex items-center gap-0.5">Requires Attention &rarr;</p>
          </div>
        </div>

        {/* Out of Stock */}
        <div 
          onClick={() => onNavigateToTab('low')}
          className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center space-x-4.5 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-300 group hover:border-rose-350"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center text-rose-600 shrink-0 shadow-3xs group-hover:scale-110 duration-300 transition-transform">
            <FiAlertTriangle className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out of Stock</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{outOfStockCount}</h3>
            <p className="text-rose-600 text-4xs font-bold mt-0.5 group-hover:underline flex items-center gap-0.5">Needs Reorder &rarr;</p>
          </div>
        </div>
      </div>

      <HelperTable<typeof lowStockItems[0]>
        columns={columns}
        data={currentRows}
        title="Critical Alerts & Quick Restock"
        count={totalItems}
        addButton={{
          label: 'View All Alerts',
          onClick: () => onNavigateToTab('low')
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
        emptyStateText="All stock levels are optimal!"
        emptyStateSubtext="No items are currently below low stock thresholds."
      />
    </div>
  );
};
