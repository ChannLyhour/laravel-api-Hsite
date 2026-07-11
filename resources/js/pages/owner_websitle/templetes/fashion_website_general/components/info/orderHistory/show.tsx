import React, { useState, useEffect } from 'react';
import { deliveryMethodsService } from '@/api/owner/deliveryMethods';
import {
     FiPackage,
     FiMapPin,
     FiCreditCard,
     FiClock,
     FiCheckCircle,
     FiXCircle,
     FiCheck,
     FiTag,
     FiTruck,
} from 'react-icons/fi';
import { resolveImageUrl } from '@/api/imageUtils';
import type { Order } from '@/pages/owner_manage/components/order/show';
import { useTranslation } from '../../../utils/translate';

// Fallback images for fashion/boutique
const getItemFallbackImage = (name?: string): string => {
     if (!name) return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=150&q=80';

     const lowercase = name.toLowerCase();
     if (lowercase.includes('shirt') || lowercase.includes('tee')) {
          return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80';
     }
     if (lowercase.includes('dress')) {
          return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=150&q=80';
     }
     if (lowercase.includes('pants') || lowercase.includes('jeans')) {
          return 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=150&q=80';
     }
     if (lowercase.includes('bag')) {
          return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=150&q=80';
     }
     if (lowercase.includes('shoe') || lowercase.includes('sneaker')) {
          return 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=150&q=80';
     }
     return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=150&q=80';
};

export const resolveItemImage = (item: any): string => {
     if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
          return resolveImageUrl(item.image);
     }
     return getItemFallbackImage(item.name);
};

const getActiveStepIndex = (status: string): number => {
     const s = status.toLowerCase();
     if (s.includes('complete')) return 4;
     if (s.includes('deliver') || s.includes('shipped') || s.includes('out_for_delivery')) return 3;
     if (s.includes('process')) return 2;
     if (s.includes('confirm')) return 1;
     return 0; // Default/pending
};

interface OrderHistoryShowProps {
     order: Order;
     locale?: string;
}

export const OrderHistoryShow: React.FC<OrderHistoryShowProps> = ({ order, locale }) => {
     const { t } = useTranslation(locale);
     const [deliveryMethods, setDeliveryMethods] = useState<any[]>([]);

     useEffect(() => {
          const searchParams = new URLSearchParams(window.location.search);
          const ownerId = searchParams.get('id') || String(order.storeId || '');
          if (ownerId) {
               deliveryMethodsService.getPublicDeliveryMethods(ownerId)
                    .then(data => setDeliveryMethods(data || []))
                    .catch(err => console.error('Failed to fetch delivery methods in OrderHistoryShow:', err));
          }
     }, [order.storeId]);

     const activeStep = getActiveStepIndex(order.status);
     const isCanceled = order.status.toLowerCase().includes('cancel');

     const steps = [
          { title: t('checkout.orderPlaced').replace('!', ''), desc: t('orders.orderPlacedDesc'), icon: <FiClock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
          { title: t('orders.confirmed'), desc: t('orders.confirmedDesc'), icon: <FiCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
          { title: t('orders.processing'), desc: t('orders.processingDesc'), icon: <FiPackage className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
          { title: t('orders.delivering') || 'Delivering', desc: t('orders.deliveringDesc') || 'Out for delivery', icon: <FiTruck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
          { title: t('orders.delivered'), desc: t('orders.deliveredDesc'), icon: <FiCheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> }
     ];

     return (
          <div className="p-1 sm:p-2 space-y-6 animate-fade-in text-left">
               {/* Status Timeline */}
               {isCanceled ? (
                    <div className="bg-white p-3 sm:p-5 border-0 sm:border border-stone-200/80 rounded-none sm:rounded-xl shadow-none sm:shadow-xs">
                         <div className="flex items-center gap-4">
                              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-rose-50 border-2 border-rose-500 text-rose-600 flex items-center justify-center shrink-0">
                                   <FiXCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                              </div>
                              <div>
                                   <h4 className="text-[10px] sm:text-xs font-black text-rose-950 uppercase tracking-widest">{t('orders.orderCancelled')}</h4>
                                   <p className="text-[9px] sm:text-[10px] text-stone-500 font-medium mt-0.5">{t('orders.cancelledDesc')}</p>
                              </div>
                         </div>
                    </div>
               ) : (
                    <div className="bg-white p-3 sm:p-6 border-0 sm:border border-stone-200/80 rounded-none sm:rounded-xl shadow-none sm:shadow-xs">
                         <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4">

                              {/* Progress bar line for Desktop */}
                              <div className="hidden md:block absolute top-5 left-[8%] right-[8%] h-[2px] bg-stone-100 -z-0">
                                   <div
                                        className="h-full bg-stone-900 transition-all duration-500 ease-out"
                                        style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                                   />
                              </div>

                              {steps.map((step, idx) => {
                                   const isCompleted = idx < activeStep || (activeStep === 4 && idx === 4);
                                   const isCurrent = idx === activeStep && activeStep < 4;
                                   const isPending = idx > activeStep;

                                   return (
                                        <div key={idx} className="flex md:flex-col items-center md:text-center gap-4 md:gap-3 flex-1 w-full relative z-10">
                                             {/* Mobile vertical line connecting step circles */}
                                             {idx > 0 && (
                                                  <div className="md:hidden absolute -top-4 left-3.5 w-[2px] h-4 bg-stone-100" />
                                             )}

                                             <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${isCompleted
                                                  ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                                                  : isCurrent
                                                       ? 'bg-white border-stone-900 text-stone-900 ring-2 sm:ring-4 ring-stone-100 shadow-sm scale-105'
                                                       : 'bg-white border-stone-200 text-stone-400'
                                                  }`}>
                                                  {isCompleted ? <FiCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : step.icon}
                                             </div>

                                             <div className="space-y-0.5 text-left md:text-center">
                                                  <h4 className={`text-[10px] sm:text-xs font-black tracking-tight leading-tight ${isCurrent ? 'text-stone-900' : isPending ? 'text-stone-400' : 'text-stone-700'}`}>
                                                       {step.title}
                                                  </h4>
                                                  <p className="text-[9px] sm:text-[10px] text-stone-400 font-medium leading-normal">{step.desc}</p>
                                             </div>
                                        </div>
                                   );
                              })}
                         </div>
                    </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Items List */}
                    <div className="space-y-4">
                         <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest border-b border-stone-200 pb-2">{t('orders.orderItems')}</h4>
                         <div className="space-y-3">
                              {order.items.map((item, idx) => (
                                   <div key={idx} className="flex items-center gap-3">
                                        <img
                                             src={resolveItemImage(item)}
                                             alt={item.name}
                                             className="w-10 h-10 rounded-md object-cover bg-stone-100 border border-stone-200 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0 text-left">
                                             <p className="text-xs font-bold text-stone-850 truncate">{item.name}</p>
                                             <p className="text-[10px] font-medium text-stone-500 mt-0.5">{(t('orders.qty') || 'Qty')}: {item.qty}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                             <p className="text-xs font-bold text-stone-900 font-mono">${parseFloat(item.price).toFixed(2)}</p>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </div>

                    {/* Details & Info */}
                    <div className="space-y-6">
                         {/* Delivery Info */}
                         <div className="space-y-3">
                              <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest border-b border-stone-200 pb-2">{t('orders.deliveryDetails')}</h4>
                              <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm space-y-3.5">
                                   <div className="flex items-start gap-2 text-stone-600">
                                        <FiMapPin className="w-4.5 h-4.5 text-stone-400 shrink-0 mt-0.5" />
                                        <div>
                                             <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Shipping Address</p>
                                             <span className="text-xs font-medium leading-relaxed mt-0.5 block">{order.address}</span>
                                        </div>
                                   </div>

                                   {(() => {
                                        const notesStr = order.notes || '';
                                        const deliveryMethodName = notesStr.match(/^\[Delivery:\s*([^\]]+)\]/) 
                                             ? notesStr.match(/^\[Delivery:\s*([^\]]+)\]/)![1] 
                                             : null;
                                        if (!deliveryMethodName) return null;

                                        const matchedMethod = deliveryMethods.find(
                                             m => m.name.toLowerCase() === deliveryMethodName.toLowerCase()
                                        );

                                        return (
                                             <div className="flex flex-col gap-2.5 pt-3.5 border-t border-stone-100 animate-fade-in text-left">
                                                  <div className="flex items-start gap-3 text-stone-600">
                                                       {matchedMethod?.image ? (
                                                            <img
                                                                 src={resolveImageUrl(matchedMethod.image)}
                                                                 alt={matchedMethod.name}
                                                                 className="w-10 h-10 object-contain rounded-md bg-stone-50 border border-stone-100 shrink-0 p-1"
                                                            />
                                                       ) : (
                                                            <div className="w-10 h-10 rounded-md bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
                                                                 <FiTruck className="w-4.5 h-4.5 text-stone-400" />
                                                            </div>
                                                       )}
                                                       <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Delivery Method</p>
                                                            <span className="text-xs font-bold text-stone-900 mt-0.5 block truncate">{deliveryMethodName}</span>
                                                            {matchedMethod && (
                                                                 <span className="inline-block mt-1 text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                                                      EST: {matchedMethod.estimated_days_min} - {matchedMethod.estimated_days_max} Days
                                                                 </span>
                                                            )}
                                                       </div>
                                                  </div>
                                                  
                                             </div>
                                        );
                                   })()}
                              </div>
                         </div>

                         {/* Payment Info */}
                         <div className="space-y-3">
                              <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest border-b border-stone-200 pb-2">{t('orders.paymentInfo')}</h4>
                              <div className="px-6 py-5 border border-stone-150 bg-stone-50 rounded-sm space-y-4">
                                   <div className="flex items-center justify-between pb-4 border-b border-stone-200/60">
                                        <div className="flex items-center gap-2 text-stone-600">
                                             <FiCreditCard className="w-4 h-4 text-stone-400" />
                                             <span className="text-xs font-bold">{order.paymentMethod === 'cod' ? t('orders.cashOnDelivery') : order.paymentMethod}</span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${order.paymentStatus?.toLowerCase() === 'paid'
                                             ? 'bg-emerald-100 text-emerald-700'
                                             : 'bg-amber-100 text-amber-700'
                                             }`}>
                                             {order.paymentStatus}
                                        </span>
                                   </div>

                                   {/* Price Breakdown */}
                                   <div className="space-y-2.5 pt-1">
                                        {(() => {
                                             const itemsSubtotal = order.items.reduce((acc, item) => acc + (parseFloat(item.price) * (item.qty || 1)), 0);
                                             const discount = parseFloat(order.discountAmount || '0');
                                             const totalPaid = parseFloat(order.total) || 0;
                                             let shippingVal = order.shippingFee !== undefined && order.shippingFee !== null
                                                  ? parseFloat(order.shippingFee)
                                                  : 0;
                                             if (shippingVal === 0 && totalPaid > 0 && Math.abs(totalPaid - (itemsSubtotal - discount)) > 0.01) {
                                                  shippingVal = Math.max(0, totalPaid - itemsSubtotal + discount);
                                             }
                                             return (
                                                  <>
                                                       <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                                                            <span>Subtotal</span>
                                                            <span>US ${itemsSubtotal.toFixed(2)}</span>
                                                       </div>
                                                       {(order.couponCode || (order.discountAmount && parseFloat(order.discountAmount) > 0)) && (
                                                            <div className="flex justify-between items-center text-xs font-bold text-[#E61E25]">
                                                                 <span className="flex items-center gap-1">
                                                                      <FiTag className="w-3.5 h-3.5" />
                                                                      {order.couponCode ? `Coupon (${order.couponCode})` : 'Discount'}
                                                                 </span>
                                                                 <span>- US ${discount.toFixed(2)}</span>
                                                            </div>
                                                       )}
                                                       <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                                                            <span>Shipping</span>
                                                            <span>{shippingVal > 0 ? `US $${shippingVal.toFixed(2)}` : 'FREE'}</span>
                                                       </div>
                                                  </>
                                             );
                                        })()}
                                   </div>

                                   <div className="flex justify-between items-center text-sm font-black text-stone-900 border-t border-stone-200/60 pt-3">
                                        <span>{t('orders.amountPaid')}</span>
                                        <span className="text-base font-black">US ${parseFloat(order.total).toFixed(2)}</span>
                                   </div>
                              </div>
                         </div>

                    </div>

               </div>
          </div>
     );
};
