import React from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiEye, FiMessageSquare } from 'react-icons/fi';
import { FaTelegramPlane } from 'react-icons/fa';
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

     return createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/45 backdrop-blur-2xs p-4 font-kuntomruy animate-fade-in">
               <div
                    className="fixed inset-0 cursor-default"
                    onClick={() => {
                         // Keep modal open until they choose an action
                    }}
               />
               <div className="bg-white p-8 sm:p-12 rounded-[6px] border border-stone-200/60 shadow-2xl max-w-md w-full text-center space-y-6 relative z-10 animate-modal-zando">
                    <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center mx-auto text-white shadow-lg ">
                         <FiCheck className="w-10 h-10 stroke-[3]" />
                    </div>

                    <div className="space-y-2">
                         <h1 className="text-xl font-black text-stone-900 uppercase tracking-widest">{t('checkout.orderPlaced')}</h1>
                         <p className="text-sm text-stone-500 leading-relaxed">
                              {t('checkout.thankYou')}
                         </p>
                    </div>

                    {/* Order Status Timeline */}
                    <div className="pt-6 border-t border-stone-100 text-left space-y-4">
                         <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest text-center mb-5">
                              {t('checkout.orderStatusTimeline')}
                         </h3>

                         <div className="relative pl-6 border-l-2 border-stone-900 space-y-5 ml-4">
                              {/* Step 1 */}
                              <div className="relative">
                                   <div className="absolute -left-[33px] top-0.5 w-4.5 h-4.5 bg-stone-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                                        <FiCheck className="w-2.5 h-2.5 stroke-[4]" />
                                   </div>
                                   <div className="text-xs">
                                        <p className="font-black text-stone-900 uppercase tracking-wider">{t('checkout.orderPlaced').replace('!', '')}</p>
                                        <p className="text-stone-500 text-[10px] font-medium">{t('checkout.placedDesc')}</p>
                                   </div>
                              </div>

                              {/* Step 2 */}
                              <div className="relative">
                                   <div className="absolute -left-[33px] top-0.5 w-4.5 h-4.5 bg-stone-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                                        <FiCheck className="w-2.5 h-2.5 stroke-[4]" />
                                   </div>
                                   <div className="text-xs">
                                        <p className="font-black text-stone-900 uppercase tracking-wider">{t('checkout.addressVerified')}</p>
                                        <p className="text-stone-500 text-[10px] font-medium">{t('checkout.addressVerifiedDesc')}</p>
                                   </div>
                              </div>

                              {/* Step 3 */}
                              <div className="relative">
                                   <div className="absolute -left-[33px] top-0.5 w-4.5 h-4.5 bg-stone-150 text-stone-900 rounded-full flex items-center justify-center border-2 border-stone-900 shadow-xs">
                                        <span className="w-2.5 h-2.5 bg-[#E61E25] rounded-full animate-ping absolute" />
                                        <span className="w-2.5 h-2.5 bg-[#E61E25] rounded-full" />
                                   </div>
                                   <div className="text-xs">
                                        <p className="font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                                             {t('checkout.processingOrder')}
                                        </p>
                                        <p className="text-stone-500 text-[10px] font-medium">{t('checkout.processingOrderDesc')}</p>
                                   </div>
                              </div>

                              {/* Step 4 */}
                              <div className="relative">
                                   <div className="absolute -left-[33px] top-0.5 w-4.5 h-4.5 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center border-2 border-stone-200">
                                        <span className="w-1.5 h-1.5 bg-stone-200 rounded-full" />
                                   </div>
                                   <div className="text-xs">
                                        <p className="font-black text-stone-300 uppercase tracking-wider">{t('checkout.outForDelivery')}</p>
                                        <p className="text-stone-300 text-[10px] font-medium">{t('checkout.outForDeliveryDesc')}</p>
                                   </div>
                              </div>
                         </div>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex flex-col gap-3">
                         <button
                              onClick={() => {
                                   const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                                   const orderParam = pendingOrderNo ? `&order_no=${pendingOrderNo}` : (pendingOrderId ? `&order_id=${pendingOrderId}` : '');
                                   const targetUrl = FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'orders') + orderParam;
                                   onNavigate?.(targetUrl);
                              }}
                              className="w-full py-4 bg-stone-900 hover:bg-stone-850 text-white rounded-[3px] font-black text-xs uppercase tracking-widest border-none transition-all cursor-pointer shadow-sm focus:outline-none flex items-center justify-center gap-2"
                         >
                              <FiEye className="w-4 h-4 shrink-0 text-white" />
                              {t('checkout.viewDetail')}
                         </button>
                         {telegramBotLink ? (
                              <a
                                   href={telegramBotLink.includes('?') ? `${telegramBotLink}&start=check_${pendingOrderNo || pendingOrderId}` : `${telegramBotLink}?start=check_${pendingOrderNo || pendingOrderId}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="w-full py-4 bg-white border border-[#24A1DE] hover:bg-[#24A1DE]/5 text-[#24A1DE] rounded-[3px] font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 text-center decoration-none focus:outline-none"
                              >
                                   <FaTelegramPlane className="w-4 h-4 shrink-0 text-[#24A1DE]" />
                                   {locale === 'km' ? 'ឆែកស្ថានភាពតាម Telegram' : 'Check Status via Telegram'}
                              </a>
                         ) : (
                              <button
                                   onClick={() => {
                                        const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                                        onNavigate?.(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'chat'));
                                   }}
                                   className="w-full py-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 rounded-[3px] font-black text-xs uppercase tracking-widest transition-all cursor-pointer focus:outline-none flex items-center justify-center gap-2"
                              >
                                   <FiMessageSquare className="w-4 h-4 shrink-0 text-stone-900" />
                                   {t('checkout.chatToStore')}
                              </button>
                         )}
                    </div>
               </div>
          </div>,
          document.body
     );
};
