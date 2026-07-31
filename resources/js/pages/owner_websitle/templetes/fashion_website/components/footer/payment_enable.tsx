import React from 'react';

export interface EnabledPaymentItem {
  key: string;
  name: string;
  logo?: React.ReactNode;
}

export interface PaymentEnableProps {
  enabledPayments?: EnabledPaymentItem[];
  showLabel?: boolean;
  labelText?: string;
  className?: string;
}

// Default payment logo mapping referencing exact design assets from /assets/payment_enable/
const PAYMENT_ASSET_LOGOS: Record<string, { name: string; src: string }> = {
  aba: { name: 'ABA KHQR', src: '/assets/payment_enable/aba.svg' },
  bakong: { name: 'Bakong KHQR', src: '/assets/payment_enable/khqr.svg' },
  khqr: { name: 'Bakong KHQR', src: '/assets/payment_enable/khqr.svg' },
};

/**
 * PaymentEnable Component
 * Renders "We accept:" label and payment gateway badges (50x30px, rounded-6px)
 * exactly matching the design spec image.
 */
export const PaymentEnable: React.FC<PaymentEnableProps> = ({
  enabledPayments = [],
  showLabel = true,
  labelText = 'We accept:',
  className = '',
}) => {
  // If active store owner payment list is provided, map them to design logos.
  // Fall back to standard ABA KHQR and Bakong KHQR logos if list is empty.
  const activeItems =
    enabledPayments && enabledPayments.length > 0
      ? enabledPayments
      : [
          { key: 'aba', name: 'ABA KHQR' },
          { key: 'bakong', name: 'Bakong KHQR' },
        ];

  return (
    <div className={`flex items-center justify-center flex-wrap gap-2.5 select-none animate-fade-in ${className}`}>
      {showLabel && (
        <span className="font-extrabold text-stone-800 text-xs sm:text-sm tracking-tight shrink-0">
          {labelText}
        </span>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {activeItems.map((p) => {
          const keyLower = p.key.toLowerCase();
          const assetLogo = PAYMENT_ASSET_LOGOS[keyLower];

          return (
            <div
              key={p.key}
              title={p.name || assetLogo?.name}
              className="w-[50px] h-[30px] flex items-center justify-center transition-transform duration-200 hover:scale-105 shrink-0"
            >
              {assetLogo ? (
                <img
                  src={assetLogo.src}
                  alt={p.name || assetLogo.name}
                  className="w-[50px] h-[30px] object-contain rounded-[6px] shadow-2xs"
                />
              ) : typeof p.logo === 'string' ? (
                <img
                  src={p.logo}
                  alt={p.name}
                  className="w-[50px] h-[30px] object-contain rounded-[6px] shadow-2xs"
                />
              ) : p.logo ? (
                <div className="w-[50px] h-[30px] flex items-center [&_img]:w-[50px] [&_img]:h-[30px] [&_img]:object-contain [&_img]:rounded-[6px]">
                  {p.logo}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentEnable;
