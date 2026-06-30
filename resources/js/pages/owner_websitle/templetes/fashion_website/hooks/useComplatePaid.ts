import { useEffect } from 'react';
import { client } from '@/api/client';
import { toast } from '../utils/toast';

/**
 * Polls payment transaction status every 3s.
 * Calls onSuccess when payment is confirmed.
 */
export const useComplatePaid = (
    transactionId: string | null,
    isOpen: boolean,
    onSuccess: () => void
) => {
    useEffect(() => {
        if (!isOpen || !transactionId) return;

        const checkStatus = async () => {
            try {
                const response = await client.post<any>('/payments/check-transaction', {
                    transaction_id: transactionId,
                });
                const isPaid = response.success && (
                    response.status === 'PAID' ||
                    response.payment_status === 'Paid' ||
                    response.payment_status === 'PAID'
                );
                if (isPaid) {
                    toast.success('Payment Received Successfully!');
                    onSuccess();
                }
            } catch (err) {
                console.error('[useComplatePaid] check failed:', err);
            }
        };

        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, [isOpen, transactionId, onSuccess]);
};
