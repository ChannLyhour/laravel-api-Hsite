import React, { useState, useEffect } from 'react';
import {
     FiShoppingBag,
     FiChevronRight,
     FiArrowLeft,
     FiPackage,
     FiCreditCard,
     FiClock,
     FiCheckCircle,
     FiXCircle,
} from 'react-icons/fi';
import { toast } from '../../../utils/toast';
import { customerOrdersService } from '@/api/created_by/getOrderCustomerbyid';
import type { Order } from '@/pages/owner_manage/components/order/show';
import { useTranslation } from '../../../utils/translate';
import { OrderHistoryShow, resolveItemImage } from './show';

interface OrderHistoryIndexProps {
     user: any;
     ownerUserId?: number | string;
     locale?: string;
}

const formatOrderDate = (timeStr: string): string => {
     try {
          const d = new Date(timeStr);
          if (isNaN(d.getTime())) return timeStr;
          return new Intl.DateTimeFormat('en-US', {
               year: 'numeric', month: 'short', day: 'numeric',
               hour: 'numeric', minute: '2-digit'
          }).format(d);
     } catch {
          return timeStr;
     }
};

const playGentleNotificationChime = () => {
     try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          const now = ctx.currentTime;

          // Tone 1: E5 (659.25 Hz)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(659.25, now);
          gain1.gain.setValueAtTime(0, now);
          gain1.gain.linearRampToValueAtTime(0.1, now + 0.05);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);

          // Tone 2: A5 (880.00 Hz)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880.00, now + 0.1);
          gain2.gain.setValueAtTime(0, now + 0.1);
          gain2.gain.linearRampToValueAtTime(0.1, now + 0.15);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          osc1.start(now);
          osc1.stop(now + 0.3);
          osc2.start(now + 0.1);
          osc2.stop(now + 0.4);
     } catch (error) {
          console.warn('Audio chime failed to play', error);
     }
};

export const OrderHistoryIndex: React.FC<OrderHistoryIndexProps> = ({ user, ownerUserId, locale }) => {
     const { t } = useTranslation(locale);
     const [orders, setOrders] = useState<Order[]>([]);
     const [isLoadingOrders, setIsLoadingOrders] = useState(false);
     const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

     useEffect(() => {
          if (orders.length > 0) {
               const params = new URLSearchParams(window.location.search);
               const orderNoParam = params.get('order_no') || params.get('order_id');
               if (orderNoParam) {
                    const foundOrder = orders.find(o => 
                         (o.order_no && String(o.order_no) === String(orderNoParam)) || 
                         String(o.id) === String(orderNoParam)
                    );
                    if (foundOrder) {
                         setSelectedOrderId(String(foundOrder.id));
                    }
               }
          }
     }, [orders]);

     useEffect(() => {
          const handleUrlChange = () => {
               const params = new URLSearchParams(window.location.search);
               const orderNoParam = params.get('order_no') || params.get('order_id');
               if (orderNoParam) {
                    const foundOrder = orders.find(o => 
                         (o.order_no && String(o.order_no) === String(orderNoParam)) || 
                         String(o.id) === String(orderNoParam)
                    );
                    setSelectedOrderId(foundOrder ? String(foundOrder.id) : null);
               } else {
                    setSelectedOrderId(null);
               }
          };

          window.addEventListener('popstate', handleUrlChange);
          window.addEventListener('navigation_changed', handleUrlChange);
          return () => {
               window.removeEventListener('popstate', handleUrlChange);
               window.removeEventListener('navigation_changed', handleUrlChange);
          };
     }, [orders]);

     const handleSelectOrder = (order: any) => {
          setSelectedOrderId(String(order.id));
          const url = new URL(window.location.href);
          url.searchParams.delete('order_id');
          url.searchParams.set('order_no', String(order.order_no || order.id));
          window.history.pushState({}, '', url.toString());
     };

     const handleBackToList = () => {
          setSelectedOrderId(null);
          const url = new URL(window.location.href);
          url.searchParams.delete('order_id');
          url.searchParams.delete('order_no');
          window.history.pushState({}, '', url.toString());
     };

     const fetchOrders = () => {
          setIsLoadingOrders(true);
          customerOrdersService.getOrdersByCustomerId(user?.id, ownerUserId)
               .then((data: any[]) => {
                    setOrders(data || []);
               })
               .catch((err: any) => {
                    console.error('Failed to load orders', err);
                    toast.error('Could not load order history');
                    setOrders([]);
               })
               .finally(() => setIsLoadingOrders(false));
     };

     useEffect(() => {
          if (!user) {
               setOrders([]);
               return;
          }

          // Fetch initial orders with loading state
          fetchOrders();

          // Establish background polling interval
          const intervalId = setInterval(() => {
               customerOrdersService.getOrdersByCustomerId(user.id, ownerUserId)
                    .then((data: any[]) => {
                         if (!data) return;

                         setOrders(prevOrders => {
                              if (prevOrders.length === 0) {
                                   return data;
                              }

                              let stateChanged = false;
                              const newOrdersList = [...prevOrders];

                              data.forEach(latestOrder => {
                                   const matchIdx = newOrdersList.findIndex(o => o.id === latestOrder.id);
                                   if (matchIdx !== -1) {
                                        const oldOrder = newOrdersList[matchIdx];
                                        const statusChanged = oldOrder.status !== latestOrder.status;
                                        const paymentChanged = oldOrder.paymentStatus !== latestOrder.paymentStatus;

                                        if (statusChanged || paymentChanged) {
                                             newOrdersList[matchIdx] = latestOrder;
                                             stateChanged = true;

                                             if (statusChanged) {
                                                  playGentleNotificationChime();
                                                  toast.custom((t: any) => (
                                                       <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border border-stone-200 p-4 flex items-start gap-3`}>
                                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-800">
                                                                 <FiPackage className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1">
                                                                 <p className="text-xs font-bold text-stone-900 text-left">Order #{latestOrder.order_no || latestOrder.id} Update</p>
                                                                 <p className="text-[11px] text-stone-500 mt-0.5 text-left">
                                                                      Status updated to <span className="font-semibold text-stone-800 capitalize">{latestOrder.status}</span>.
                                                                 </p>
                                                            </div>
                                                       </div>
                                                  ), { duration: 5000 });
                                             }

                                             if (paymentChanged) {
                                                  if (!statusChanged) {
                                                       playGentleNotificationChime();
                                                  }
                                                  toast.custom((t: any) => (
                                                       <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border border-stone-200 p-4 flex items-start gap-3`}>
                                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                                 <FiCreditCard className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1">
                                                                 <p className="text-xs font-bold text-stone-900 text-left">Payment Update</p>
                                                                 <p className="text-[11px] text-stone-500 mt-0.5 text-left">
                                                                      Order #{latestOrder.order_no || latestOrder.id} payment is now <span className="font-semibold text-emerald-600 capitalize">{latestOrder.paymentStatus}</span>.
                                                                 </p>
                                                            </div>
                                                       </div>
                                                  ), { duration: 5000 });
                                             }
                                        }
                                   } else {
                                        // New order placed
                                        newOrdersList.unshift(latestOrder);
                                        stateChanged = true;
                                   }
                              });

                              return stateChanged ? newOrdersList : prevOrders;
                         });
                    })
                    .catch(err => {
                         console.warn('Silent orders poll error:', err);
                    });
          }, 10000); // 10 seconds

          return () => {
               clearInterval(intervalId);
          };
     }, [user, ownerUserId]);

     const getStatusConfig = (status: string) => {
          const s = status.toLowerCase();
          if (s.includes('pending')) return { color: 'bg-amber-100 text-amber-800', icon: <FiClock className="w-3 h-3" />, label: t('orders.pending') };
          if (s.includes('confirm')) return { color: 'bg-indigo-100 text-indigo-800', icon: <FiCheckCircle className="w-3 h-3" />, label: t('orders.confirmed') };
          if (s.includes('process')) return { color: 'bg-blue-100 text-blue-800', icon: <FiPackage className="w-3 h-3" />, label: t('orders.processing') };
          if (s.includes('complete') || s.includes('deliver')) return { color: 'bg-emerald-100 text-emerald-800', icon: <FiCheckCircle className="w-3 h-3" />, label: t('orders.delivered') };
          if (s.includes('cancel')) return { color: 'bg-rose-100 text-rose-800', icon: <FiXCircle className="w-3 h-3" />, label: t('orders.cancelled') };
          return { color: 'bg-stone-100 text-stone-800', icon: <FiPackage className="w-3 h-3" />, label: status };
     };

     if (selectedOrderId) {
          const selectedOrder = orders.find(o => String(o.id) === String(selectedOrderId));
          if (selectedOrder) {
               return (
                    <div className="space-y-8 animate-fade-in text-left">
                         {/* Sticky Detail Header */}
                         <div className="sticky top-14 z-30 bg-white -mx-4 px-4 sm:-mx-5 sm:px-5 pt-4 pb-4 border-b border-stone-200 flex items-center gap-3">
                              <button
                                   onClick={handleBackToList}
                                   className="p-1.5 hover:bg-stone-100 rounded-full text-stone-700 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center animate-fade-in"
                                   title={t('orders.backToOrders')}
                              >
                                   <FiArrowLeft className="w-5 h-5" />
                              </button>
                              <div>
                                   <h2 className="text-lg font-black text-stone-900 tracking-tight">Order #{selectedOrder.order_no || selectedOrder.id}</h2>
                                   <p className="text-xs text-stone-500 mt-0.5 font-medium">{t('orders.placedOn')} {formatOrderDate(selectedOrder.time)}</p>
                              </div>
                         </div>

                         <OrderHistoryShow order={selectedOrder} locale={locale} />
                    </div>
               );
          }
     }

     return (
          <div className="space-y-8 animate-fade-in text-left">
               {/* Header */}
               <div className="sticky top-14 z-30 bg-white -mx-4 px-4 sm:-mx-5 sm:px-5 pt-4 pb-4 border-b border-stone-200 flex items-center gap-3">
                    <div className="p-2 bg-stone-100 rounded-full text-stone-800">
                         <FiShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                         <h2 className="text-lg font-black text-stone-900 tracking-tight">{t('orders.title')}</h2>
                         <p className="text-xs text-stone-500 mt-0.5">{t('orders.subtitle')}</p>
                    </div>
               </div>

               {/* Content */}
               {isLoadingOrders ? (
                    <div className="py-20 flex flex-col justify-center items-center gap-4">
                         <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                         <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t('orders.loading')}</p>
                    </div>
               ) : orders.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center bg-stone-50/50 rounded-xl border border-stone-200/50 border-dashed">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                              <FiShoppingBag className="w-6 h-6 text-stone-300" />
                         </div>
                         <h3 className="text-sm font-bold text-stone-900 mb-1">{t('orders.noOrders')}</h3>
                         <p className="text-xs text-stone-500 max-w-[250px]">{t('orders.noOrdersDesc')}</p>
                    </div>
               ) : (
                    <div className="space-y-4">
                         {orders.map(order => {
                              const statusConfig = getStatusConfig(order.status);
                              const totalItemsCount = order.items.reduce((acc, item) => acc + (parseInt(item.qty as any) || 1), 0);

                              return (
                                   <div
                                        key={order.id}
                                        onClick={() => handleSelectOrder(order)}
                                        className="group rounded-[7px] border border-stone-200 shadow-sm hover:border-stone-300 hover:shadow-md cursor-pointer transition-all duration-300 bg-white"
                                   >
                                        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                             {/* Left: Info */}
                                             <div className="flex items-center gap-5">
                                                  {/* Thumbnail cluster (show up to 2 items) */}
                                                  <div className="hidden sm:flex items-center -space-x-2">
                                                       {order.items.slice(0, 2).map((item, idx) => {
                                                            return (
                                                                 <img
                                                                      key={idx}
                                                                      src={resolveItemImage(item)}
                                                                      alt={item.name}
                                                                      className="w-12 h-12 rounded-[5px] object-cover border-2 border-white bg-stone-100 shadow-sm"
                                                                 />
                                                            );
                                                       })}
                                                       {order.items.length > 2 && (
                                                            <div className="w-12 h-12 rounded-[5px] border-2 border-white bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-600 shadow-sm z-10">
                                                                 +{order.items.length - 2}
                                                            </div>
                                                       )}
                                                  </div>

                                                  <div className="space-y-1.5 text-left">
                                                       <div className="flex items-center gap-2">
                                                            <span className="text-sm font-black text-stone-900 font-mono tracking-tight">#{order.order_no || order.id}</span>
                                                       </div>
                                                       <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                                                            <span>{formatOrderDate(order.time)}</span>
                                                            <span className="w-1 h-1 bg-stone-300 rounded-full" />
                                                            <span>{totalItemsCount} {totalItemsCount === 1 ? t('orders.item') : t('orders.items')}</span>
                                                       </div>
                                                  </div>
                                             </div>

                                             {/* Right: Price & Action */}
                                             <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-stone-100 pt-3 sm:pt-0">
                                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusConfig.color}`}>
                                                       {statusConfig.icon}
                                                       {statusConfig.label}
                                                  </span>

                                                  <div className="flex items-center gap-6">
                                                       <div className="text-left sm:text-right">
                                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">{t('orders.totalAmount')}</p>
                                                            <p className="text-base font-black text-stone-900 font-mono">${parseFloat(order.total).toFixed(2)}</p>
                                                       </div>

                                                       <div className="p-2 text-stone-400 group-hover:text-stone-700 transition-colors">
                                                            <FiChevronRight className="w-5 h-5" />
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              );
                         })}
                    </div>
               )}
          </div>
     );
};
