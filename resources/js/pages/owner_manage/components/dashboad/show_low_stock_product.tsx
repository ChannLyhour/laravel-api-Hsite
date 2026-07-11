import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiPlus, FiBox, FiRefreshCw, FiChevronRight, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { stockManagementService } from '@/api/owner/stockManagement';
import type { MenuItem, ProductVariant } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import { toast } from '@/pages/owner_manage/utils/toast';

interface ShowLowStockProductProps {
     ownerId?: number | string;
     storeId?: number;
}

export const ShowLowStockProduct: React.FC<ShowLowStockProductProps> = ({ ownerId, storeId }) => {
     const [items, setItems] = useState<MenuItem[]>([]);
     const [loading, setLoading] = useState(true);
     const [savingId, setSavingId] = useState<number | null>(null);

     // Inline restock state
     const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
     const [editQty, setEditQty] = useState<number>(0);

     const fetchLowStock = async () => {
          try {
               setLoading(true);
               const data = await stockManagementService.getStockItems(ownerId, storeId);
               setItems(data || []);
          } catch (err) {
               console.error('Failed to fetch low stock items:', err);
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          fetchLowStock();
     }, [ownerId, storeId]);

     // Flatten and filter for low stock items only
     const lowStockRows: Array<{
          productId: number;
          productName: string;
          productImage: string;
          hasOptions: boolean;
          variant: ProductVariant;
          isOutOfStock: boolean;
          threshold: number;
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
                         threshold
                    });
               }
          });
     });

     // Sort: Out of stock first, then by quantity ascending, take first 5
     const displayedRows = lowStockRows
          .sort((a, b) => {
               if (a.isOutOfStock && !b.isOutOfStock) return -1;
               if (!a.isOutOfStock && b.isOutOfStock) return 1;
               return a.variant.stock_qty - b.variant.stock_qty;
          })
          .slice(0, 5);

     const handleQuickAdd = async (variant: ProductVariant, addAmt: number) => {
          if (!variant.id) return;
          try {
               setSavingId(variant.id);
               const newQty = variant.stock_qty + addAmt;
               await stockManagementService.updateVariantStock(variant.id, {
                    stock_qty: newQty,
                    low_stock_threshold: variant.low_stock_threshold
               });
               toast.success('Stock replenished successfully!');

               // Update local state
               setItems(prev => prev.map(item => {
                    if (item.variants && item.variants.some(v => v.id === variant.id)) {
                         return {
                              ...item,
                              variants: item.variants.map(v => v.id === variant.id ? { ...v, stock_qty: newQty } : v)
                         };
                    }
                    return item;
               }));
          } catch (err) {
               console.error(err);
               toast.error('Failed to update stock.');
          } finally {
               setSavingId(null);
          }
     };

     const handleSaveEdit = async (variant: ProductVariant) => {
          if (!variant.id) return;
          try {
               setSavingId(variant.id);
               await stockManagementService.updateVariantStock(variant.id, {
                    stock_qty: editQty,
                    low_stock_threshold: variant.low_stock_threshold
               });
               toast.success('Stock level updated!');
               setEditingVariantId(null);

               // Update local state
               setItems(prev => prev.map(item => {
                    if (item.variants && item.variants.some(v => v.id === variant.id)) {
                         return {
                              ...item,
                              variants: item.variants.map(v => v.id === variant.id ? { ...v, stock_qty: editQty } : v)
                         };
                    }
                    return item;
               }));
          } catch (err) {
               console.error(err);
               toast.error('Failed to update stock.');
          } finally {
               setSavingId(null);
          }
     };

     const triggerStockTab = () => {
          window.dispatchEvent(new CustomEvent('change_admin_tab', { detail: 'stock-low' }));
     };

     return (
          <div className="bg-white rounded-[5px] border overflow-hidden shadow-2xs flex flex-col justify-between custom-card-container w-full text-left font-sans">
               <div>
                    <div className="flex items-center justify-between px-5 py-4 border-b custom-card-header-bar">
                         <div className="flex items-center gap-2">
                              <FiAlertTriangle className="text-red-500 w-4 h-4 shrink-0" />
                              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                   Low Stock Alerts
                              </h3>
                         </div>
                         <span className="text-[10px] font-extrabold text-red-500 tracking-wider bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-100">
                              {lowStockRows.length} items low
                         </span>
                    </div>

                    {loading ? (
                         <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
                              <FiRefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                              <span className="text-xs font-semibold">Loading stock status...</span>
                         </div>
                    ) : displayedRows.length === 0 ? (
                         <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                   <FiBox className="w-5 h-5" />
                              </div>
                              <p className="text-xs font-bold text-slate-700">All Items Well Stocked</p>
                              <p className="text-[10px] text-slate-400 max-w-[200px] leading-normal font-semibold">
                                   No products are currently low or out of stock. Great job!
                              </p>
                         </div>
                    ) : (
                         <div className="divide-y divide-slate-50">
                              {displayedRows.map((row, index) => {
                                   const optionLabels = row.hasOptions && row.variant.attribute_values
                                        ? row.variant.attribute_values.map((av: any) => av.value?.includes('|') ? av.value.split('|')[0] : av.value).join(', ')
                                        : '';
                                   const nameSuffix = optionLabels ? ` (${optionLabels})` : '';
                                   const isSaving = savingId === row.variant.id;
                                   const isEditing = editingVariantId === row.variant.id;

                                   return (
                                        <div key={index} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                                             <div className="flex items-center gap-3 min-w-0 flex-1">
                                                  {/* Image */}
                                                  <div className="w-9 h-9 rounded-[4px] border overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center relative">
                                                       {row.productImage ? (
                                                            <img
                                                                 src={resolveImageUrl(row.productImage)}
                                                                 alt={row.productName}
                                                                 className="w-full h-full object-cover"
                                                            />
                                                       ) : (
                                                            <FiBox className="w-4.5 h-4.5 text-slate-350" />
                                                       )}
                                                       {row.isOutOfStock && (
                                                            <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[7px] text-white font-black uppercase tracking-wider">
                                                                 Out
                                                            </span>
                                                       )}
                                                  </div>

                                                  {/* Meta */}
                                                  <div className="min-w-0">
                                                       <h4 className="text-[12px] font-black text-slate-800 truncate leading-snug">
                                                            {row.productName}{nameSuffix}
                                                       </h4>
                                                       <p className="text-[10px] text-slate-400 mt-0.5 font-semibold flex items-center gap-1">
                                                            <span>SKU: {row.variant.variant_sku || 'N/A'}</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="font-bold text-slate-500">
                                                                 Threshold: {row.threshold}
                                                            </span>
                                                       </p>
                                                  </div>
                                             </div>

                                             {/* Quantity & Replenish Actions */}
                                             <div className="flex items-center gap-2.5 shrink-0">
                                                  <div className="text-right">
                                                       {isEditing ? (
                                                            <div className="flex items-center border border-slate-200 rounded-[5px] bg-white overflow-hidden h-7">
                                                                 <input
                                                                      type="number"
                                                                      value={editQty}
                                                                      onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                                                                      className="w-12 px-2 text-center text-xs font-black text-slate-900 border-none outline-none h-full"
                                                                 />
                                                                 <button
                                                                      onClick={() => handleSaveEdit(row.variant)}
                                                                      disabled={isSaving}
                                                                      className="px-1.5 h-full text-emerald-600 hover:bg-emerald-50 border-l cursor-pointer border-none bg-transparent flex items-center justify-center"
                                                                 >
                                                                      <FiCheck className="w-3.5 h-3.5" />
                                                                 </button>
                                                                 <button
                                                                      onClick={() => setEditingVariantId(null)}
                                                                      className="px-1.5 h-full text-slate-400 hover:bg-slate-50 border-l cursor-pointer border-none bg-transparent flex items-center justify-center"
                                                                 >
                                                                      <FiX className="w-3.5 h-3.5" />
                                                                 </button>
                                                            </div>
                                                       ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                 <span
                                                                      onClick={() => {
                                                                           setEditingVariantId(row.variant.id || null);
                                                                           setEditQty(row.variant.stock_qty);
                                                                      }}
                                                                      className={`text-xs font-black px-2 py-0.5 rounded cursor-pointer select-none hover:bg-slate-100 transition-colors ${row.isOutOfStock
                                                                                ? 'bg-red-50 text-red-650 border border-red-100'
                                                                                : 'bg-amber-50 text-amber-650 border border-amber-100'
                                                                           }`}
                                                                      title="Click to edit stock level"
                                                                 >
                                                                      {row.variant.stock_qty} in stock
                                                                 </span>

                                                                 {/* Quick +10 Restock */}
                                                                 <button
                                                                      onClick={() => handleQuickAdd(row.variant, 10)}
                                                                      disabled={isSaving}
                                                                      className="w-6 h-6 border border-orange-200/80 text-orange-600 hover:bg-orange-50 rounded-[5px] flex items-center justify-center cursor-pointer disabled:opacity-50"
                                                                      title="Quick Restock +10"
                                                                 >
                                                                      <FiPlus className="w-3.5 h-3.5" />
                                                                 </button>
                                                            </div>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>
                                   );
                              })}
                         </div>
                    )}
               </div>

               <div className="border-t p-3 bg-black/[0.015] text-center flex items-center justify-center">
                    <button
                         onClick={triggerStockTab}
                         className="text-[11px] font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 border-none bg-transparent cursor-pointer"
                    >
                         <span>View All Low Stock Items</span>
                         <FiChevronRight className="w-3 h-3" />
                    </button>
               </div>
          </div>
     );
};
