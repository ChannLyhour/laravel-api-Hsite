import { useState, useMemo } from 'react';
import { couponsService, type CouponRow } from '@/api/owner/coupons';
import { toast } from 'react-hot-toast';
import { nullOrRequest } from '../nullOrRequest';

/**
 * Hook to manage coupon application and discount calculations.
 * @param subtotal The current cart subtotal to validate minimum purchase requirements.
 */
export const useCoupon = (subtotal: number, userId?: number) => {
    const [appliedCoupon, setAppliedCoupon] = useState<CouponRow | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const resolvedUserId = nullOrRequest(userId);

    /**
     * Validates and applies a coupon code.
     * @param code The coupon code entered by the user.
     */
    const applyCoupon = async (code: string) => {
        if (!code.trim()) return;

        setIsApplyingCoupon(true);
        try {
            const coupon = await couponsService.validateCode(code.trim());

            // Validation: Customer-specific coupon check
            if (coupon.customer_id && coupon.customer_id !== resolvedUserId) {
                toast.error('This coupon is restricted to a different customer.');
                return;
            }

            // Validation: Minimum purchase requirement
            if (coupon.minimum_purchase && subtotal < parseFloat(String(coupon.minimum_purchase))) {
                toast.error(`Minimum purchase of $${parseFloat(String(coupon.minimum_purchase)).toFixed(2)} required.`);
                return;
            }

            setAppliedCoupon(coupon);
            toast.success('Coupon applied!');
        } catch (err: any) {
            const msg = err.details?.message || err.message || 'Coupon validation failed.';
            toast.error(msg);
            console.warn('Coupon application failed:', err);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    /**
     * Removes the currently applied coupon.
     */
    const removeCoupon = () => {
        setAppliedCoupon(null);
    };

    /**
     * Calculates the discount amount based on the applied coupon.
     */
    const discount = useMemo(() => {
        if (!appliedCoupon || subtotal === 0) return 0;

        // Validation: Minimum purchase requirement (continuous validation)
        const minPurchase = appliedCoupon.minimum_purchase ? parseFloat(String(appliedCoupon.minimum_purchase)) : 0;
        if (subtotal < minPurchase) return 0;

        // Free delivery coupons don't reduce the subtotal directly (handled in delivery fee)
        if (appliedCoupon.coupon_type === 'free_delivery') return 0;

        if (appliedCoupon.discount_type === 'percentage') {
            return (subtotal * parseFloat(String(appliedCoupon.discount_amount))) / 100;
        }

        // Flat amount discount
        return Math.min(subtotal, parseFloat(String(appliedCoupon.discount_amount)));
    }, [appliedCoupon, subtotal]);

    return {

        appliedCoupon,
        isApplyingCoupon,
        applyCoupon,
        removeCoupon,
        discount,
    };
};
