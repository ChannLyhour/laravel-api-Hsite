import { useState } from 'react';
import { ordersService } from '@/api/owner/orders';
import { toast } from '../utils/toast';

interface OrderItemPayload {
    menu_item_id: number;
    product_variant_id?: number | null;
    quantity: number;
    price: number;
}

interface CheckoutData {
    store_id: number;
    total_amount: number;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    payment_method: string;
    notes?: string;
    items: OrderItemPayload[];
    delivery_fee?: number;
    discount_amount?: number;
    coupon_code?: string;
    subtotal?: number;
}

/**
 * Hook to handle order submission (Pending Order) flow.
 */
export const useOrderPending = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitOrder = async (data: CheckoutData, onSuccess?: (order: any) => void) => {
        if (isSubmitting) return;

        // Basic validation
        if (!data.customer_phone) {
            toast.error('Customer phone number is required.');
            return;
        }
        if (!data.customer_address) {
            toast.error('Delivery address is required.');
            return;
        }
        if (data.items.length === 0) {
            toast.error('Your cart is empty.');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Placing your order...');

        try {
            const order = await ordersService.createOrder(data);
            
            if (order && (order as any).token) {
                localStorage.setItem('aura_customer_token', (order as any).token);
                window.dispatchEvent(new Event('aura_token_changed'));
            }

            toast.dismiss(loadingToast);
            toast.success('Checkout successful! Thank you for your order.', {
                duration: 5000,
                position: 'bottom-center',
            });

            if (onSuccess) {
                onSuccess(order);
            }
        } catch (error: any) {
            toast.dismiss(loadingToast);
            console.error('Order Submission Error:', error);
            toast.error(error.details?.message || 'Failed to process order. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        submitOrder,
        isSubmitting,
    };
};
