import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiTag, FiX, FiChevronUp } from 'react-icons/fi';

interface SummaryOrderProps {
     claimCode: string;
     setClaimCode: (code: string) => void;
     appliedCoupon: any;
     setAppliedCoupon: (coupon: any) => void;
     handleApplyCode: () => void;
     setIsVoucherDrawerOpen: (open: boolean) => void;
     subtotal: number;
     totalDiscount: number;
     deliveryFee: number;
     stores: any;
     storeSettings: any;
     totalAmount: number;
     isCheckingOut: boolean;
     currentStep: number;
     displayCartItems: any[];
     selectedPayment: string | null;
     handleSubtotalAction: () => void;
     coupons: any[];
}

export const SummaryOrder: React.FC<SummaryOrderProps> = ({
     claimCode,
     setClaimCode,
     appliedCoupon,
     setAppliedCoupon,
     handleApplyCode,
     setIsVoucherDrawerOpen,
     subtotal,
     totalDiscount,
     deliveryFee,
     stores,
     storeSettings,
     totalAmount,
     isCheckingOut,
     currentStep,
     displayCartItems,
     selectedPayment,
     handleSubtotalAction,
     coupons,
}) => {
     const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

     const actionButtonLabel = isCheckingOut ? (
          'Processing...'
     ) : currentStep === 1 ? (
          'Proceed to Delivery'
     ) : currentStep === 2 ? (
          'Proceed to Payment'
     ) : (
          'Place Order'
     );

     const isActionButtonDisabled =
          isCheckingOut ||
          (currentStep === 1 && displayCartItems.length === 0) ||
          (currentStep === 3 && !selectedPayment);

     // Render the inner content of the summary card (reused for desktop and mobile modal)
     const renderSummaryCardContent = (isModal: boolean = false) => (
          <div className="px-6 py-6 border border-stone-100 bg-stone-50 rounded-3xl space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.025)] relative">
               {isModal && (
                    <button
                         onClick={() => setIsMobileModalOpen(false)}
                         className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-500 border-none bg-transparent cursor-pointer z-20 transition-all duration-200"
                    >
                         <FiX className="w-4 h-4" />
                    </button>
               )}

               {/* Claim code inputs inside summary card */}
               <div className="space-y-3 pb-4 border-b border-stone-200/60">
                    <h2 className="text-xs font-black text-stone-950 uppercase tracking-widest">
                         Claim code
                    </h2>
                    <div className="flex gap-2">
                         <input
                              type="text"
                              value={claimCode}
                              onChange={(e) => {
                                   setClaimCode(e.target.value);
                                   if (appliedCoupon && appliedCoupon.code !== e.target.value) {
                                        setAppliedCoupon(null);
                                   }
                              }}
                              placeholder="Claim code"
                              className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 uppercase placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950 bg-white transition-all"
                         />
                         <button
                              onClick={handleApplyCode}
                              disabled={!claimCode.trim()}
                              className="px-5 py-2.5 bg-white border border-stone-200 hover:bg-stone-950 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider text-stone-900 transition-all cursor-pointer disabled:bg-stone-50 disabled:text-stone-300 disabled:border-stone-150"
                         >
                              Apply
                         </button>
                    </div>

                    <button
                         type="button"
                         onClick={() => {
                              if (isModal) setIsMobileModalOpen(false);
                              setIsVoucherDrawerOpen(true);
                         }}
                         className="ProductDetailsDescription_apply_voucher_txt__2Iss6 relative flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-stone-100 rounded-xl text-[10px] font-black uppercase tracking-wider text-stone-700 hover:text-stone-955 transition-all border border-stone-200 cursor-pointer shrink-0 select-none focus:outline-none w-fit"
                    >
                         <span>{appliedCoupon ? `Code: ${appliedCoupon.code}` : 'Free Voucher'}</span>
                         <svg className="w-3.5 h-3.5 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                              <line x1="13" y1="5" x2="13" y2="19" />
                         </svg>
                         <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-[#E61E25] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs">
                              {appliedCoupon ? '✓' : coupons.length}
                         </span>
                    </button>
               </div>

               <div className="space-y-2.5 pt-1">
                    <div className="flex justify-between items-center text-xs font-bold text-stone-500">
                         <span>Subtotal</span>
                         <span className="font-mono font-bold text-stone-900">${subtotal.toFixed(2)}</span>
                    </div>

                    {totalDiscount > 0 && (
                         <div className="flex justify-between items-center text-xs font-bold text-[#E61E25]">
                              <span className="flex items-center gap-1">
                                   <FiTag className="w-3.5 h-3.5" />
                                   Save
                              </span>
                              <span className="font-mono">- ${totalDiscount.toFixed(2)}</span>
                         </div>
                    )}

                    <div className="flex justify-between items-center text-xs font-bold text-stone-500">
                         <span className="flex items-center gap-1">
                              <span>Delivery fee</span>
                              {appliedCoupon?.coupon_type === 'free_delivery' && (
                                   <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded-sm uppercase font-bold">Coupon</span>
                              )}
                         </span>
                         <span className="font-mono font-bold text-stone-900">{deliveryFee === 0 ? 'FREE' : `US $${deliveryFee.toFixed(2)}`}</span>
                    </div>
               </div>

               <div className="flex justify-between items-center text-sm font-black text-stone-950 border-t border-stone-200/60 pt-3">
                    <span>Amount to pay</span>
                    <span className="text-base font-black font-mono">${totalAmount.toFixed(2)}</span>
               </div>

               <button
                    onClick={() => {
                         if (isModal) setIsMobileModalOpen(false);
                         handleSubtotalAction();
                    }}
                    disabled={isActionButtonDisabled}
                    className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest border-none transition-all duration-200 shadow-sm mt-2 focus:outline-none ${isActionButtonDisabled
                         ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none'
                         : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.15)]'
                         }`}
               >
                    {actionButtonLabel}
               </button>
          </div>
     );

     return (
          <>
               {/* Desktop Layout: Sticky Sidebar */}
               <div className="hidden lg:block sticky top-8 space-y-6">
                    {renderSummaryCardContent(false)}
               </div>

               {/* Mobile Layout: Sleek Sticky Bottom Action Bar */}
               <div className="lg:hidden bg-white w-full px-5 py-4 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col text-left" onClick={() => setIsMobileModalOpen(true)}>
                         <span className="text-[9px] text-stone-400 uppercase font-black tracking-wider flex items-center gap-0.5 cursor-pointer">
                              Total Amount <FiChevronUp className="w-3.5 h-3.5 animate-bounce" />
                         </span>
                         <span className="text-base font-black font-mono text-stone-950">
                              ${totalAmount.toFixed(2)}
                         </span>
                    </div>
                    <button
                         onClick={() => {
                              // On final step review, fade up modal first for review before placing order
                              if (currentStep === 3 && !isMobileModalOpen) {
                                   setIsMobileModalOpen(true);
                              } else {
                                   handleSubtotalAction();
                              }
                         }}
                         disabled={isActionButtonDisabled}
                         className={`px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest border-none transition-all duration-200 shrink-0 ${isActionButtonDisabled
                              ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.15)]'
                              }`}
                    >
                         {actionButtonLabel}
                    </button>
               </div>

               {/* Mobile Order Summary Fade-Up Modal in Center */}
               {isMobileModalOpen && createPortal(
                    <div className="fixed inset-0 z-[99999] max-w-md mx-auto left-0 right-0 flex items-center justify-center p-4 lg:hidden font-kuntomruy">
                         {/* Backdrop */}
                         <div
                              className="absolute inset-0 bg-stone-950/40 backdrop-blur-2xs"
                              onClick={() => setIsMobileModalOpen(false)}
                         />

                         {/* Modal Content */}
                         <div className="relative z-10 w-full max-w-sm rounded-3xl bg-stone-50 overflow-hidden shadow-2xl animate-fade-in">
                              {renderSummaryCardContent(true)}
                         </div>
                    </div>,
                    document.body
               )}
          </>
     );
};
