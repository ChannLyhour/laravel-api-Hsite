import { useState, useEffect, useCallback } from 'react';
import { paywayService } from '../services/paywayService';
import type { PaymentTransactionStatus, CheckTransactionResult } from '../types/checkout';
import { toast } from '../utils/toast';

interface UsePaymentStatusOptions {
  transactionId: string | null;
  isOpen: boolean;
  onSuccess?: (result: CheckTransactionResult) => void;
  pollingIntervalMs?: number;
}

export function usePaymentStatus({
  transactionId,
  isOpen,
  onSuccess,
  pollingIntervalMs = 3000,
}: UsePaymentStatusOptions) {
  const [status, setStatus] = useState<PaymentTransactionStatus>('idle');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastResponse, setLastResponse] = useState<CheckTransactionResult | null>(null);

  const checkStatus = useCallback(async () => {
    if (!transactionId || !isOpen) return;

    try {
      const response = await paywayService.checkTransactionStatus(transactionId);
      setLastResponse(response);

      const isPaid =
        response.success &&
        (response.payment_status === 'Paid' || String(response.payment_status).toUpperCase() === 'PAID');

      if (isPaid) {
        setStatus('paid');
        if (response.customer_token) {
          localStorage.setItem('aura_customer_token', response.customer_token);
          window.dispatchEvent(new Event('aura_token_changed'));
        }
        toast.success('Payment Received Successfully!');
        onSuccess?.(response);
      }
    } catch (err) {
      console.error('[usePaymentStatus] Error checking transaction status:', err);
    }
  }, [transactionId, isOpen, onSuccess]);

  useEffect(() => {
    if (!isOpen || !transactionId || status === 'paid') return;

    setStatus('pending');
    const interval = setInterval(checkStatus, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [isOpen, transactionId, status, checkStatus, pollingIntervalMs]);

  const verifyManually = useCallback(async () => {
    if (!transactionId) return;
    setIsVerifying(true);
    try {
      const response = await paywayService.checkTransactionStatus(transactionId, true);
      setLastResponse(response);

      if (response.success && (response.payment_status === 'Paid' || String(response.payment_status).toUpperCase() === 'PAID')) {
        setStatus('paid');
        if (response.customer_token) {
          localStorage.setItem('aura_customer_token', response.customer_token);
          window.dispatchEvent(new Event('aura_token_changed'));
        }
        toast.success('Payment Confirmed!');
        onSuccess?.(response);
      } else {
        toast.error('Payment not yet received.');
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  }, [transactionId, onSuccess]);

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setLastResponse(null);
    setIsVerifying(false);
  }, []);

  return {
    status,
    isVerifying,
    lastResponse,
    verifyManually,
    resetStatus,
  };
}
