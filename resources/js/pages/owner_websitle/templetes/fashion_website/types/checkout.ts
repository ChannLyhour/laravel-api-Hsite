export interface PaymentMethodItem {
  key: string;
  logo: string | React.ReactNode;
  name: string;
  desc: string | React.ReactNode;
}

export interface QRPayload {
  qrString?: string;
  qrImage?: string;
  abapayDeeplink?: string;
  transactionId?: string;
  merchantName?: string;
  currency?: 'USD' | 'KHR';
  amount?: number;
}

export type PaymentTransactionStatus = 'idle' | 'loading' | 'pending' | 'paid' | 'failed' | 'cancelled';

export interface PaywayQRResponse {
  success: boolean;
  qrString?: string;
  qrImage?: string;
  abapay_deeplink?: string;
  transaction_id?: string;
  message?: string;
}

export interface CheckTransactionResult {
  success: boolean;
  payment_status: 'Paid' | 'Unpaid' | 'Failed';
  message: string;
  customer_token?: string;
  raw?: any;
}

export interface CheckoutOrderSummaryProps {
  subtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  usePointsDiscount?: number;
  totalAmount: number;
  currency?: string;
  itemCount?: number;
}
