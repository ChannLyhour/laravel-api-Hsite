import React, { useEffect, useRef } from 'react';
import { toast } from '@/pages/owner_manage/utils/toast';
import { ordersService } from '@/api/owner/orders';
import type { Order } from '@/pages/owner_manage/components/order/show';

// Audio Chime Generator using browser Web Audio API
export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Tone 2: E5 (659.25 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    // Tone 3: G5 (783.99 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(783.99, now + 0.16);
    gain3.gain.setValueAtTime(0, now + 0.16);
    gain3.gain.linearRampToValueAtTime(0.15, now + 0.21);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);

    osc3.start(now + 0.16);
    osc3.stop(now + 0.6);
  } catch (error) {
    console.warn('Web Audio API chime failed to play', error);
  }
};

interface RealTimeOrderPopupProps {
  ownerId?: number | string;
  storeId?: number;
}

export const useRealTimeOrderCheck = (ownerId?: number | string, storeId?: number) => {
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    seenOrderIdsRef.current.clear();

    const fetchInitialOrders = async () => {
      if (!ownerId && !storeId) return;
      try {
        const orders = await ordersService.getMyStoreOrders(
          undefined,
          0,
          50,
          undefined,
          storeId,
          undefined,
          ownerId
        );
        if (!active) return;

        if (orders && Array.isArray(orders)) {
          orders.forEach(o => {
            const isUnpaidGateway = o.paymentStatus === 'Unpaid' && o.paymentMethod !== 'cod' && o.paymentMethod !== 'transfer' && o.paymentMethod !== 'Cash on Delivery';
            if (!isUnpaidGateway) {
              seenOrderIdsRef.current.add(o.id);
            }
          });
        }

        // Start polling after baseline is established
        startPolling();
      } catch (err) {
        console.warn('Failed to load initial orders list for real-time check, retrying...', err);
        // Start polling anyway if failed to initialize, so we don't miss new orders
        if (active) startPolling();
      }
    };

    const checkForNewOrders = async () => {
      if (!ownerId && !storeId) return;
      try {
        const orders = await ordersService.getMyStoreOrders(
          undefined,
          0,
          20,
          undefined,
          storeId,
          undefined,
          ownerId
        );
        if (!active) return;

        if (orders && Array.isArray(orders)) {
          const newOrders: Order[] = [];
          orders.forEach(o => {
            if (!seenOrderIdsRef.current.has(o.id)) {
              // Skip unpaid gateway orders from alerting until paid
              const isUnpaidGateway = o.paymentStatus === 'Unpaid' && o.paymentMethod !== 'cod' && o.paymentMethod !== 'transfer' && o.paymentMethod !== 'Cash on Delivery';
              if (isUnpaidGateway) {
                return;
              }
              // Skip canceled orders, but mark as seen
              if (String(o.status) === 'canceled' || String(o.status) === 'cancelled') {
                seenOrderIdsRef.current.add(o.id);
                return;
              }
              seenOrderIdsRef.current.add(o.id);
              newOrders.push(o);
            }
          });

          if (newOrders.length > 0) {
            // Sort new orders chronologically to notify oldest first
            newOrders.reverse().forEach(newOrder => {
              triggerOrderToast(newOrder);
            });

            // Also notify the active view to update if any order tab is listening
            window.dispatchEvent(new CustomEvent('data_updated'));
          }
        }
      } catch (err) {
        console.warn('Error polling for new orders', err);
      }
    };

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(checkForNewOrders, 10000); // 10 seconds
    };

    fetchInitialOrders();

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ownerId, storeId]);
};

const triggerOrderToast = (order: Order) => {
  // Play sound
  playNotificationChime();

  // Dispatch new notification event to update the notification center dropdown dynamically
  window.dispatchEvent(
    new CustomEvent('new_notification', {
      detail: {
        id: `order-${order.id}`,
        title: `New Order #${order.order_no || order.id}`,
        description: `Pending verification from ${order.customer || 'Customer'} - Total: $${parseFloat(order.total).toFixed(2)}`,
        time: 'Just now',
        read: false,
        type: 'order',
        action: {
          tab: 'orders',
          orderId: order.id
        }
      }
    })
  );

  // Show premium hot-toast
  const itemCount = order.items?.length || 0;
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white/98 backdrop-blur-xl border border-slate-200/60 rounded-[12px] pointer-events-auto flex flex-col overflow-hidden font-kuntomruy transition-all duration-300`}
        style={{
          boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 8px 20px -10px rgba(249, 115, 22, 0.15)'
        }}
      >
        {/* Top gradient accent */}
        <div className="h-1 bg-gradient-to-r from-primary via-orange-400 to-amber-400" />

        <div className="p-4 flex items-start gap-3.5">
          {/* Animated icon */}
          <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-primary to-orange-500 text-white rounded-[10px] flex items-center justify-center shadow-md shadow-orange-500/20 relative">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {/* Ping indicator */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black text-primary tracking-widest uppercase">
                New Order
              </span>
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                {order.time}
              </span>
            </div>
            <h4 className="text-[13px] font-black text-slate-900 mt-0.5 flex items-center gap-2">
              <span>#{order.order_no || order.id}</span>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-[4px] uppercase">
                {order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod}
              </span>
            </h4>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-[11px] text-slate-700 font-bold truncate">
                  {order.customer || 'Walk-in'}
                </span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <span className="text-[11px] text-slate-500 font-semibold shrink-0">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
              <div className="h-3 w-px bg-slate-200" />
              <span className="text-[13px] text-slate-900 font-black shrink-0">
                ${parseFloat(order.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-4 pb-3.5">
          <button
            onClick={() => {
              (window as any).pendingViewOrderId = order.id;
              window.dispatchEvent(
                new CustomEvent('change_admin_tab', { detail: 'orders' })
              );
              window.dispatchEvent(
                new CustomEvent('view_order_details', { detail: { orderId: order.id } })
              );
              toast.dismiss(t.id);
            }}
            className="flex-1 py-2 text-[11px] font-black text-white bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 rounded-[6px] transition-all cursor-pointer border-none text-center select-none outline-none active:scale-[0.97] shadow-sm shadow-orange-500/15 flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200/70 rounded-[6px] transition-all cursor-pointer border-none text-center select-none outline-none active:scale-[0.97]"
          >
            Dismiss
          </button>
        </div>
      </div>
    ),
    { duration: 15000 }
  );
};

export const RealTimeOrderPopup: React.FC<RealTimeOrderPopupProps> = ({ ownerId, storeId }) => {
  useRealTimeOrderCheck(ownerId, storeId);
  return null; // Hook runs in background, renders nothing on its own
};

