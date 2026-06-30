import { useMemo } from 'react';
import type { CartItem } from '../types';
import { Store_setting } from '@/api/owner/stores';

/**
 * Hook to manage shipping fee calculations based on order method, cart contents, 
 * applied coupons, and store settings.
 */
export const useShippingFee = (
    orderMethod: 'delivery' | 'pickup',
    subtotal: number,
    cart: CartItem[],
    appliedCoupon?: any,
    initialSettings?: any
) => {
    const deliveryFee = useMemo(() => {
        // No delivery fee for pickup or empty cart
        if (orderMethod !== 'delivery' || subtotal === 0) return 0;

        // Check for free delivery coupon (including minimum purchase validation)
        if (appliedCoupon?.coupon_type === 'free_delivery') {
            const minPurchase = appliedCoupon.minimum_purchase ? parseFloat(String(appliedCoupon.minimum_purchase)) : 0;
            if (subtotal >= minPurchase) return 0;
        }

        // 1. Calculate Product-Level Shipping Fees
        // Some products may have their own specific shipping costs
        let totalProductShipping = 0;
        let hasProductShipping = false;

        cart.forEach(ci => {
            const cost = parseFloat(String(ci.item.shipping_cost || 0));
            if (cost > 0) {
                hasProductShipping = true;
                if (ci.item.multiply_qty_shipping) {
                    totalProductShipping += cost * ci.qty;
                } else {
                    totalProductShipping += cost;
                }
            }
        });

        // If any product has a specific shipping cost, we use that sum
        if (hasProductShipping) {
            return totalProductShipping;
        }

        // 2. Calculate Store-Wide Dynamic Delivery Fee
        let fee = 0;
        let threshold = 0;

        // Merge settings: initialSettings (props) takes precedence over Store_setting() (localStorage)
        const localSettings = Store_setting();
        const activeSettings = { ...(localSettings || {}), ...(initialSettings || {}) };

        if (activeSettings) {
            if (activeSettings.shipping_fee !== undefined && activeSettings.shipping_fee !== null) {
                fee = parseFloat(String(activeSettings.shipping_fee)) || 0;
            }
            if (activeSettings.free_shipping_threshold !== undefined && activeSettings.free_shipping_threshold !== null) {
                threshold = parseFloat(String(activeSettings.free_shipping_threshold)) || 0;
            }
        }

        // Apply free shipping threshold if configured
        return (threshold > 0 && subtotal >= threshold) ? 0 : fee;
    }, [orderMethod, subtotal, cart, appliedCoupon, initialSettings]);

    return {
        deliveryFee,
    };
};
