import React, { useState } from 'react';
import { FiAlertTriangle, FiCheck, FiX, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import type { MenuItem, ProductVariant } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';

interface StockLowAlertsProps {
  items: MenuItem[];
  onUpdateStock: (variantId: number, qty: number, threshold: number | null) => Promise<void>;
  loading: boolean;
}

export const StockLowAlerts: React.FC<StockLowAlertsProps> = ({
  items,
  onUpdateStock,
  loading,
}) => {
  // Inline restock edit state
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Flatten and filter for low stock items only
  const lowStockRows: Array<{
    productId: number;
    productName: string;
    productImage: string;
    hasOptions: boolean;
    variant: ProductVariant;
    isOutOfStock: boolean;
  }> = [];

  items.forEach(item => {
    const vars = item.variants || [];
    vars.forEach(v => {
      const threshold = v.low_stock_threshold ?? 5;
      const isOutOfStock = v.stock_qty === 0;
      const isLowStock = v.stock_qty <= threshold;
      
      if (isOutOfStock || isLowStock) {
        lowStockRows.push({
          productId: item.id,
          productName: item.name,
          productImage: item.display_image || item.image || '',
          hasOptions: !!item.has_options,
          variant: v,
          isOutOfStock,
        });
      }
    });
  });

  // Sort: Out of stock first, then by quantity ascending
  lowStockRows.sort((a, b) => {
    if (a.isOutOfStock && !b.isOutOfStock) return -1;
    if (!a.isOutOfStock && b.isOutOfStock) return 1;
    return a.variant.stock_qty - b.variant.stock_qty;
  });

  const handleQuickAdd = async (variant: ProductVariant, addAmt: number) => {
    try {
      setSavingId(variant.id || null);
      const newQty = variant.stock_qty + addAmt;
      await onUpdateStock(variant.id!, newQty, variant.low_stock_threshold);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const handleStartEdit = (variantId: number, currentQty: number) => {
    setEditingVariantId(variantId);
    setEditQty(currentQty);
  };

  const handleSaveEdit = async (variant: ProductVariant) => {
    try {
      setSavingId(variant.id || null);
      await onUpdateStock(variant.id!, editQty, variant.low_stock_threshold);
      setEditingVariantId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">
      {/* Overview/Warning Alert Header */}
      <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 flex items-start space-x-4 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.02)]">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0 shadow-3xs">
          <FiAlertTriangle className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold text-rose-800">Critical Stock Warning!</h4>
          <p className="text-slate-500 text-3xs font-semibold leading-relaxed mt-1">
            The items listed below have fallen below safety threshold limits or are completely out of stock. Customers will not be able to purchase out-of-stock items, which could cause a decrease in store revenue. Please update stock levels immediately.
          </p>
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 bg-white border rounded-2xl">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading critical alerts...</p>
        </div>
      ) : lowStockRows.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-2 text-slate-400 bg-white border rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
          <FiAlertCircle className="w-10 h-10 opacity-30 text-emerald-500" />
          <p className="text-xs font-bold text-slate-500">Perfect Status! No stock alerts found</p>
          <p className="text-3xs text-slate-400">All of your product variants have optimal quantity levels.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {lowStockRows.map((row) => {
            const isEditing = editingVariantId === row.variant.id;
            const isSaving = savingId === row.variant.id;
            const threshold = row.variant.low_stock_threshold ?? 5;
            const suggestedReorder = threshold * 2 + 20; // Suggest reordering double the threshold + 20 units

            return (
              <div 
                key={row.variant.id} 
                className={`bg-white border rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all flex flex-col justify-between space-y-4 hover:-translate-y-0.5 hover:shadow-md duration-300 ${
                  row.isOutOfStock 
                    ? 'border-l-4 border-l-rose-500 border-rose-100/70' 
                    : 'border-l-4 border-l-amber-500 border-amber-100/70'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-150 shrink-0 shadow-3xs">
                      <img
                        src={resolveImageUrl(row.variant.image_url || row.productImage)}
                        alt={row.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-slate-800 leading-tight">{row.productName}</h4>
                      <p className="text-slate-400 text-4xs font-semibold mt-0.5">SKU: {row.variant.variant_sku}</p>
                      {row.hasOptions && row.variant.attribute_values && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {row.variant.attribute_values.map((av: any, aIdx: number) => (
                            <span 
                              key={aIdx} 
                              className="px-1.5 py-0.5 rounded-[3px] bg-slate-50 text-slate-500 text-[8px] font-black border border-slate-200"
                            >
                              {av.attribute?.name || 'Attr'}: {av.value?.includes('|') ? av.value.split('|')[0] : av.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-[4px] text-4xs font-black uppercase tracking-wider ${
                    row.isOutOfStock 
                      ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {row.isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                  </span>
                </div>

                {/* Stock values summary */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100/70 text-center">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Qty</p>
                    <p className={`text-sm sm:text-base font-black mt-0.5 ${row.isOutOfStock ? 'text-rose-600' : 'text-amber-650'}`}>
                      {row.variant.stock_qty}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Safety Limit</p>
                    <p className="text-sm sm:text-base font-black text-slate-650 mt-0.5">{threshold}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Suggested Add</p>
                    <p className="text-sm sm:text-base font-black text-emerald-600 mt-0.5">+{suggestedReorder}</p>
                  </div>
                </div>

                {/* Actions row */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Inline Edit Quantity */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <input
                        type="number"
                        min="0"
                        value={editQty}
                        onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24 px-2 py-1.5 text-center border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-md outline-none text-xs font-bold text-slate-800 transition-all"
                        placeholder="Quantity"
                      />
                      <button
                        disabled={isSaving}
                        onClick={() => handleSaveEdit(row.variant)}
                        className="w-9 h-9 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-md flex items-center justify-center cursor-pointer border-none shadow-3xs hover:scale-105 active:scale-95 duration-150 transition-all"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                      <button
                        disabled={isSaving}
                        onClick={() => setEditingVariantId(null)}
                        className="w-9 h-9 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-500 rounded-md flex items-center justify-center cursor-pointer border-none hover:scale-105 active:scale-95 duration-150 transition-all"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(row.variant.id!, row.variant.stock_qty)}
                      className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-4xs font-black cursor-pointer bg-white transition-all hover:scale-105 active:scale-95 duration-150 flex items-center justify-center gap-1.5 w-full sm:w-auto shadow-3xs"
                    >
                      <FiRefreshCw className="w-3 h-3 text-slate-500 animate-spin-hover" />
                      <span>Custom Restock</span>
                    </button>
                  )}

                  {/* Smart Reorder Options */}
                  {!isEditing && (
                    <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                      <button
                        disabled={isSaving}
                        onClick={() => handleQuickAdd(row.variant, suggestedReorder)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-50 text-white rounded-lg text-4xs font-black shadow-sm shadow-orange-500/10 cursor-pointer border-none text-center flex-1 sm:flex-initial"
                      >
                        {isSaving ? 'Processing...' : `Add Suggested (+${suggestedReorder})`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
