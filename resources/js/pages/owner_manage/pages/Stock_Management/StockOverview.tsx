import React, { useState } from 'react';
import { FiBox, FiAlertTriangle, FiLayers, FiEdit2 } from 'react-icons/fi';
import type { MenuItem, ProductVariant } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import { HelperTable, type HelperTableColumn } from '../../helper/HelperTable';
import { useTranslation } from '@/pages/owner_manage/lang/i18n';
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
  const { t } = useTranslation();
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
      {/* Overview Stats Cards - Business Analytics Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="rounded-[12px] border border-blue-500/20 bg-blue-500/10 dark:bg-blue-500/5 p-5 shadow-2xs hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-between">
          <div>
            <p className="text-[13px] sm:text-[14px] font-bold text-slate-800 mb-1.5">{t('stock.total_products')}</p>
            <p className="text-[24px] sm:text-[26px] font-black text-slate-900 tracking-tight leading-none">{totalProducts}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-1.5">{totalVariants} unique variants</p>
          </div>
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 text-blue-600 bg-white/80 dark:bg-slate-900 shadow-2xs">
            <FiLayers className="w-5 h-5" />
          </div>
        </div>

        {/* Total Stock Qty */}
        <div className="rounded-[12px] border border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-500/5 p-5 shadow-2xs hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-between">
          <div>
            <p className="text-[13px] sm:text-[14px] font-bold text-slate-800 mb-1.5">{t('stock.total_stock_qty')}</p>
            <p className="text-[24px] sm:text-[26px] font-black text-slate-900 tracking-tight leading-none">{totalStockUnits}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-1.5">{t('stock.physical_items_in_hand')}</p>
          </div>
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 text-emerald-600 bg-white/80 dark:bg-slate-900 shadow-2xs">
            <FiBox className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Items */}
        <div 
          onClick={() => onNavigateToTab('items')}
          className="rounded-[12px] border border-amber-500/20 bg-amber-500/10 dark:bg-amber-500/5 p-5 shadow-2xs hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-between cursor-pointer group"
        >
          <div>
            <p className="text-[13px] sm:text-[14px] font-bold text-slate-800 mb-1.5">{t('stock.low_stock_items')}</p>
            <p className="text-[24px] sm:text-[26px] font-black text-slate-900 tracking-tight leading-none">{lowStockCount}</p>
            <p className="text-[11px] font-semibold text-amber-600 mt-1.5 group-hover:underline flex items-center gap-0.5">{t('stock.requires_attention')} &rarr;</p>
          </div>
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 text-amber-600 bg-white/80 dark:bg-slate-900 shadow-2xs">
            <FiAlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Out of Stock */}
        <div 
          onClick={() => onNavigateToTab('items')}
          className="rounded-[12px] border border-rose-500/20 bg-rose-500/10 dark:bg-rose-500/5 p-5 shadow-2xs hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-between cursor-pointer group"
        >
          <div>
            <p className="text-[13px] sm:text-[14px] font-bold text-slate-800 mb-1.5">{t('stock.out_of_stock')}</p>
            <p className="text-[24px] sm:text-[26px] font-black text-slate-900 tracking-tight leading-none">{outOfStockCount}</p>
            <p className="text-[11px] font-semibold text-rose-600 mt-1.5 group-hover:underline flex items-center gap-0.5">{t('stock.needs_reorder')} &rarr;</p>
          </div>
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 text-rose-600 bg-white/80 dark:bg-slate-900 shadow-2xs">
            <FiAlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <HelperTable<typeof lowStockItems[0]>
        columns={columns}
        data={currentRows}
        title={t('stock.critical_alerts_title')}
        count={totalItems}
        addButton={{
          label: t('stock.view_all_alerts'),
          onClick: () => onNavigateToTab('items')
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
        emptyStateText={t('stock.perfect_status')}
        emptyStateSubtext={t('stock.perfect_status_sub')}
      />
    </div>
  );
};
