import React from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiDownload, FiShoppingBag } from 'react-icons/fi';
import { FASHION_ROUTES } from '../../routes';

interface OrderSuccessAbaKhqrProps {
     isOpen: boolean;
     email?: string;
     pendingOrderNo?: string | null;
     pendingOrderId?: number | string | null;
     ownerUserId?: number | string | null;
     stores?: any;
     storeSettings?: any;
     onNavigate?: (to: string) => void;
     onClose?: () => void;
}

export const OrderSuccessAbaKhqr: React.FC<OrderSuccessAbaKhqrProps> = ({
     isOpen,
     email = 'payer@email.com',
     pendingOrderNo,
     pendingOrderId,
     ownerUserId,
     stores,
     storeSettings,
     onNavigate,
     onClose,
}) => {
     if (!isOpen) return null;

     const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');

     const handleDownloadReceipt = () => {
          const orderParam = pendingOrderNo
               ? `&order_no=${pendingOrderNo}`
               : pendingOrderId
                    ? `&order_id=${pendingOrderId}`
                    : '';
          const targetUrl = FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'orders') + orderParam;
          onNavigate?.(targetUrl);
     };

     const handleContinueShopping = () => {
          onNavigate?.(FASHION_ROUTES.getShop(ownerUserId, storeSlug));
     };

     return createPortal(
          <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-stone-950/45 backdrop-blur-xs p-4 font-kuntomruy animate-fade-in select-none">

               {/* ABA PAYWAY Floating Header Logo */}
               <div className="w-full max-w-[380px] flex justify-end mb-3 pr-1">
                    <img
                         src="/assets/payment_logo/PayWay Logo.svg"
                         alt="ABA PAYWAY"
                         className="h-6 sm:h-7 w-auto object-contain drop-shadow-sm"
                    />
               </div>

               {/* Main Success Modal */}
               <div className="bg-white rounded-3xl shadow-2xl max-w-[380px] w-full overflow-hidden relative animate-scale-in border border-stone-100">

                    {/* Scenic Illustration Header */}
                    <div className="w-full relative overflow-hidden" style={{ height: 170 }}>
                         {/* Sky Gradient Background */}
                         <div className="absolute inset-0 bg-gradient-to-b from-[#E8F4FD] via-[#EEF7FC] to-[#F5FAF8]" />

                         {/* Clouds */}
                         <svg className="absolute top-3 left-4 w-16 h-8 text-white/80" viewBox="0 0 64 32" fill="currentColor">
                              <ellipse cx="20" cy="20" rx="18" ry="10" />
                              <ellipse cx="38" cy="16" rx="16" ry="12" />
                              <ellipse cx="50" cy="20" rx="12" ry="8" />
                         </svg>
                         <svg className="absolute top-6 right-6 w-12 h-6 text-white/60" viewBox="0 0 48 24" fill="currentColor">
                              <ellipse cx="16" cy="14" rx="14" ry="8" />
                              <ellipse cx="32" cy="12" rx="12" ry="9" />
                         </svg>
                         <svg className="absolute top-1 right-24 w-10 h-5 text-white/40" viewBox="0 0 40 20" fill="currentColor">
                              <ellipse cx="14" cy="12" rx="12" ry="7" />
                              <ellipse cx="28" cy="10" rx="10" ry="8" />
                         </svg>

                         {/* Ground / Sand Strip */}
                         <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#E8F0ED] to-transparent" />

                         {/* Left Cactus (Trident Shape) */}
                         <svg className="absolute bottom-2 left-[15%] w-10 h-20" viewBox="0 0 40 80" fill="none">
                              {/* Main stem */}
                              <rect x="17" y="15" width="6" height="55" rx="3" fill="#5BA8A0" />
                              {/* Left arm */}
                              <path d="M17 40 Q6 40 6 30 Q6 22 10 22 Q14 22 14 28 L14 40" fill="#5BA8A0" />
                              {/* Right arm */}
                              <path d="M23 35 Q34 35 34 25 Q34 17 30 17 Q26 17 26 23 L26 35" fill="#5BA8A0" />
                         </svg>

                         {/* Flag Pole (Center) */}
                         <svg className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-32" viewBox="0 0 24 128">
                              {/* Pole */}
                              <rect x="10.5" y="0" width="2.5" height="120" fill="#4A7C96" />
                              {/* Ball top */}
                              <circle cx="11.75" cy="3" r="3" fill="#4A7C96" />
                              {/* Flag */}
                              <polygon points="13,6 13,30 2,18" fill="#4A90B8" />
                         </svg>

                         {/* Right Cactus (Short, Round) */}
                         <svg className="absolute bottom-2 right-[14%] w-8 h-14" viewBox="0 0 32 56" fill="none">
                              <rect x="12" y="10" width="7" height="38" rx="3.5" fill="#8FBDB8" opacity="0.7" />
                              <path d="M12 30 Q4 30 4 22 Q4 16 8 16 Q11 16 11 20 L11 30" fill="#8FBDB8" opacity="0.7" />
                              <path d="M19 25 Q27 25 27 18 Q27 12 23 12 Q20 12 20 16 L20 25" fill="#8FBDB8" opacity="0.7" />
                         </svg>

                         {/* Small ground cactus left */}
                         <svg className="absolute bottom-1 left-[38%] w-4 h-8 opacity-30" viewBox="0 0 16 32" fill="#7BABA5">
                              <rect x="6" y="5" width="4" height="22" rx="2" />
                         </svg>

                         {/* Green Checkmark Badge (Centered, overlapping bottom) */}
                         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                              <div className="w-14 h-14 bg-[#34D399] rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 ring-4 ring-white">
                                   <FiCheck className="w-8 h-8 stroke-[3]" />
                              </div>
                         </div>
                    </div>

                    {/* Content Section */}
                    <div className="px-6 pt-4 pb-7 text-center">
                         <h1 className="text-[26px] font-bold text-stone-900 tracking-tight leading-tight">
                              Success
                         </h1>

                         <p className="text-[13px] text-stone-400 font-medium leading-relaxed mt-3 max-w-[280px] mx-auto">
                              Order confirmation details sent to your email:
                              <br />
                              <span className="font-semibold text-stone-700">{email}</span>
                         </p>

                         {/* Action Buttons */}
                         <div className="mt-6 space-y-3">
                              {/* Download Receipt - Outlined */}
                              <button
                                   onClick={handleDownloadReceipt}
                                   className="w-full py-3.5 bg-white border-2 border-emerald-400 hover:bg-emerald-50 text-emerald-500 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 focus:outline-none"
                              >
                                   Download Receipt
                              </button>

                              {/* Continue Shopping - Solid Green */}
                              <button
                                   onClick={handleContinueShopping}
                                   className="w-full py-3.5 bg-[#34D399] hover:bg-emerald-500 text-white rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 border-none focus:outline-none"
                              >
                                   Continue Shopping
                              </button>
                         </div>
                    </div>
               </div>
          </div>,
          document.body
     );
};

export default OrderSuccessAbaKhqr;
