import { useState, useEffect } from 'react';
import { paymentsService } from '@/api/owner/method';
import { toast } from 'react-hot-toast';
import { nullOrRequest } from '../nullOrRequest';

/**
 * Hook to poll and verify order payment completion status.
 */
export const useComplatePaid = (
    transactionId: string | null,
    isOpen: boolean,
    onSuccess: () => void
) => {
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        const resolvedTxId = nullOrRequest(transactionId);
        if (!isOpen || !resolvedTxId) {
            setIsPolling(false);
            return;
        }

        setIsPolling(true);
        const checkStatus = async () => {
            try {
                const response = await paymentsService.checkTransaction(resolvedTxId);
                
                // Robust check supporting multiple property naming formats from real/mock payment servers
                const isPaid = response.success && (
                    (response as any).status === 'PAID' ||
                    (response as any).status === 'Paid' ||
                    (response.payment_status as string) === 'Paid' ||
                    (response.payment_status as string) === 'PAID'
                );

                if (isPaid) {
                    toast.success('Payment Received Successfully!');
                    onSuccess();
                }
            } catch (err) {
                console.error('[useComplatePaid] Status check failed:', err);
            }
        };

        // Poll every 3 seconds while payment popup is open
        const interval = setInterval(checkStatus, 3000);
        
        return () => {
            clearInterval(interval);
            setIsPolling(false);
        };
    }, [isOpen, transactionId, onSuccess]);

    return { isPolling };
};
