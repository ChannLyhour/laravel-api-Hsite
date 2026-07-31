import React from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiDownload, FiShoppingBag } from 'react-icons/fi';
import { FASHION_ROUTES } from '../../routes';

interface OrderPlacedPopupProps {
     orderSuccess: boolean;
     t: (key: string) => string;
     stores: any;
     storeSettings: any;
     pendingOrderNo: string | null;
     pendingOrderId: number | string | null;
     ownerUserId: number | string | null;
     onNavigate?: (to: string) => void;
     telegramBotLink: string | null;
     locale: string;
}

export const OrderPlacedPopup: React.FC<OrderPlacedPopupProps> = ({
     orderSuccess,
     t,
     stores,
     storeSettings,
     pendingOrderNo,
     pendingOrderId,
     ownerUserId,
     onNavigate,
     telegramBotLink,
     locale,
}) => {
     if (!orderSuccess) return null;

     const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');

     return createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/45 backdrop-blur-xs p-4 font-kuntomruy animate-fade-in">
               <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full text-center overflow-hidden relative z-10 animate-scale-in border border-stone-100 font-kuntomruy">
                    {/* Top Vector Banner Background (Sky & Green Flag) */}
                    <div className="w-full bg-gradient-to-b from-[#E0F2FE] to-[#F0FDFA] py-8 flex flex-col items-center justify-center relative overflow-hidden">
                         {/* Subtle Background Elements */}
                         <div className="absolute top-2 left-6 text-sky-200 text-3xl font-black opacity-40">☁️</div>
                         <div className="absolute top-4 right-8 text-sky-200 text-2xl font-black opacity-40">☁️</div>
                         
                         {/* Main Green Checkmark Badge */}
                         <div className="relative z-10 w-16 h-16 bg-[#34D399] rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-bounce-short">
                              <FiCheck className="w-9 h-9 stroke-[3]" />
                         </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 space-y-3">
                         <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Success</h1>
                         <p className="text-xs text-stone-400 font-medium leading-relaxed max-w-[260px] mx-auto">
                              Order confirmation details sent to your contact: <br />
                              <span className="font-semibold text-stone-700">{pendingOrderNo ? `Order #${pendingOrderNo}` : `Order #${pendingOrderId || 'Completed'}`}</span>
                         </p>

                         {/* Action Buttons */}
                         <div className="pt-4 space-y-3">
                              {/* Download Receipt Button */}
                              <button
                                   onClick={() => {
                                        const orderParam = pendingOrderNo ? `&order_no=${pendingOrderNo}` : (pendingOrderId ? `&order_id=${pendingOrderId}` : '');
                                        const targetUrl = FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'orders') + orderParam;
                                        onNavigate?.(targetUrl);
                                   }}
                                   className="w-full py-3.5 bg-white border border-emerald-400 hover:bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 focus:outline-none"
                              >
                                   <FiDownload className="w-4 h-4 text-emerald-500" />
                                   Download Receipt
                              </button>

                              {/* Continue Shopping Button */}
                              <button
                                   onClick={() => {
                                        onNavigate?.(FASHION_ROUTES.getShop(ownerUserId, storeSlug));
                                   }}
                                   className="w-full py-3.5 bg-[#34D399] hover:bg-emerald-600 text-white rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 border-none focus:outline-none"
                              >
                                   <FiShoppingBag className="w-4 h-4 text-white" />
                                   Continue Shopping
                              </button>
                         </div>
                    </div>
               </div>
          </div>,
          document.body
     );
};
