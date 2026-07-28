import { client } from '@/api/client';
import type {
  PaymentMethodItem,
  PaywayQRResponse,
  CheckTransactionResult,
} from '../types/checkout';

export const paywayService = {
  /**
   * Fetch active payment methods configured for this store owner.
   */
  async getActiveMethods(ownerId: number | string): Promise<PaymentMethodItem[]> {
    return client.get<PaymentMethodItem[]>(`/payments/active-methods?owner_id=${ownerId}`);
  },

  /**
   * Generate PayWay / ABA KHQR payment payload.
   */
  async generateQrCode(orderId: number | string, currency = 'USD'): Promise<PaywayQRResponse> {
    return client.post<PaywayQRResponse>('/payments/generate-qr', {
      order_id: Number(orderId),
      currency,
    });
  },

  /**
   * Verify payment transaction status.
   */
  async checkTransactionStatus(
    transactionId: string,
    confirm = false,
    isBakong = false
  ): Promise<CheckTransactionResult> {
    const url = isBakong ? '/owner/khqr-bakong/check' : '/payments/check-transaction';
    return client.post<CheckTransactionResult>(url, {
      transaction_id: transactionId,
      confirm,
    });
  },
};
