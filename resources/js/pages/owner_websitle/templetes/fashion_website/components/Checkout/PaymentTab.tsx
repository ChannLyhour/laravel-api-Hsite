import React from 'react';
import { FiCreditCard, FiCheck } from 'react-icons/fi';
import { type CheckoutValidationError } from '../../validation/CheckoutValidationError';

interface PaymentTabProps {
     selectedPayment: string;
     setSelectedPayment: (payment: string) => void;
     paymentMethods: any[];
     note: string;
     setNote: (note: string) => void;
     isCheckingOut: boolean;
     onSubmit: () => void;
     validationError: CheckoutValidationError | null;
     paymentRef: React.RefObject<HTMLInputElement | null>;
     isActive: boolean;
}

export const PaymentTab: React.FC<PaymentTabProps> = ({
     selectedPayment,
     setSelectedPayment,
     paymentMethods,
     note,
     setNote,
     isCheckingOut,
     onSubmit,
     validationError,
     paymentRef,
     isActive,
}) => {
     const hasError = !!(validationError?.field === 'payment');

     return (
          <div className={`bg-white rounded-sm border transition-all duration-300 shadow-2xs ${isActive ? (hasError ? 'border-red-500 ring-1 ring-red-500/20 p-5' : 'border-stone-900 ring-1 ring-stone-900/10 p-5') : 'border-stone-200/40 p-5 opacity-60'}`}>
               {/* Header */}
               <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-colors duration-300 ${isActive ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'}`}>
                              3
                         </div>
                         <div>
                              <h2 className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>
                                   3. Payment & Notes
                              </h2>
                              {!isActive && (
                                   <p className="text-[11px] text-stone-400 font-bold mt-0.5 animate-fade-in">
                                        Select payment method and enter order notes
                                   </p>
                              )}
                         </div>
                    </div>
                    {isActive && (
                         <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-sm font-black uppercase tracking-wider">
                              Step 3 of 3
                         </span>
                    )}
               </div>

               {/* Content with smooth slide-down dropdown transition */}
               <div className={`grid transition-all duration-300 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`} style={{ gridTemplateRows: isActive ? '1fr' : '0fr' }}>
                    <div className="overflow-hidden">
                         <div className="space-y-6 mt-6">
                              {/* Payment options */}
                              <div className="space-y-4">
                                   <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                                        <FiCreditCard className="w-3.5 h-3.5 text-stone-900 stroke-[2.5]" />
                                        Select Payment Method
                                   </h3>

                                   <div className="space-y-3">
                                        {paymentMethods.length === 0 ? (
                                             <div className="text-center py-6 text-stone-450 text-xs font-bold uppercase tracking-wider bg-stone-50 border border-stone-100 rounded-sm">
                                                  No payment methods available
                                             </div>
                                        ) : (
                                             paymentMethods.map((p, idx) => (
                                                  <label
                                                       key={p.key}
                                                       className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-colors ${selectedPayment === p.key
                                                            ? 'border-stone-900 bg-stone-50/60'
                                                            : validationError?.field === 'payment'
                                                                 ? 'border-red-300 hover:border-red-450 hover:bg-stone-50'
                                                                 : 'border-stone-150 hover:bg-stone-50'
                                                            }`}
                                                  >
                                                       <input
                                                            type="radio"
                                                            name="payment"
                                                            ref={idx === 0 ? paymentRef : undefined}
                                                            checked={selectedPayment === p.key}
                                                            onChange={() => setSelectedPayment(p.key)}
                                                            className={`w-4 h-4 text-stone-900 border-stone-300 focus:ring-0 cursor-pointer shrink-0 ${validationError?.field === 'payment' ? 'accent-red-500 text-red-500' : 'accent-stone-900'}`}
                                                       />
                                                       {p.logo}
                                                       <div className="text-xs">
                                                            <h4 className="font-bold text-stone-900 text-sm">{p.name}</h4>
                                                            <div className="text-[10px] text-stone-400 font-medium mt-0.5">{p.desc}</div>
                                                       </div>
                                                  </label>
                                             ))
                                        )}
                                        {validationError?.field === 'payment' && (
                                             <p className="text-[11px] font-bold text-red-500 animate-fade-in mt-1 flex items-center gap-1">
                                                  <span>⚠️</span>
                                                  <span>{validationError.message}</span>
                                             </p>
                                        )}
                                   </div>
                              </div>

                              {/* Note section */}
                              <div className="border-t border-stone-100 pt-6 space-y-3">
                                   <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest">
                                        Add Note to Order (Optional)
                                   </h3>
                                   <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="E.g., Special instructions for delivery, drop-off, or custom packaging request..."
                                        rows={4}
                                        className="w-full p-4 border border-stone-200 rounded-[3px] text-xs font-bold text-stone-850 placeholder:text-stone-300 focus:outline-none focus:border-stone-955 resize-none transition-colors duration-200"
                                   />
                              </div>

                              {/* Submit order */}
                              <div className="pt-6 border-t border-stone-100 flex justify-end">
                                   <button
                                        onClick={onSubmit}
                                        disabled={isCheckingOut || !selectedPayment}
                                        className={`px-8 py-3.5 rounded-[3px] font-black text-xs uppercase tracking-widest border-none transition-all duration-200 flex items-center gap-2.5 shadow-sm focus:outline-none ${(isCheckingOut || !selectedPayment) ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'}`}
                                   >
                                        {isCheckingOut ? (
                                             <>
                                                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                  Processing...
                                             </>
                                        ) : (
                                             <>
                                                  Place Order
                                             </>
                                        )}
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};
