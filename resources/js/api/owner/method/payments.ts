import { client } from '../../client';

export interface GenerateQrResponse {
    success: boolean;
    qrString?: string;
    qrImage?: string;
    abapay_deeplink?: string;
    transaction_id?: string;
    message?: string;
}

export interface CheckTransactionResponse {
    success: boolean;
    payment_status: 'Paid' | 'Unpaid' | 'Failed';
    message: string;
    raw?: any;
}

export const paymentsService = {
    /**
     * Generate PayWay KHQR / Bakong payment credentials.
     */
    async generateQr(orderId: number | string, currency = 'USD'): Promise<GenerateQrResponse> {
        return client.post<GenerateQrResponse>('/payments/generate-qr', {
            order_id: Number(orderId),
            currency,
        });
    },

    /**
     * Verify payment transaction status.
     */
    async checkTransaction(transactionId: string, confirm = false, isBakong = false): Promise<CheckTransactionResponse> {
        const url = isBakong ? '/owner/khqr-bakong/check' : '/payments/check-transaction';
        return client.post<CheckTransactionResponse>(url, {
            transaction_id: transactionId,
            confirm,
        });
    }
};
