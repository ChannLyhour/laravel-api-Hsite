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
     onEdit?: () => void;
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
     onEdit,
}) => {
     const hasError = !!(validationError?.field === 'payment');
     const isCompleted = !isActive && !!selectedPayment;

     return (
          <div className={`bg-white rounded-3xl border transition-all duration-300 ${isActive ? (hasError ? 'border-red-500 ring-1 ring-red-500/10 shadow-[0_8px_30px_rgba(239,68,68,0.035)] p-6' : 'border-stone-955 shadow-[0_8px_30px_rgba(0,0,0,0.035)] p-6') : 'border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-6'}`}>
               {/* Header */}
               <div 
                    onClick={isCompleted && onEdit ? onEdit : undefined}
                    className={`flex items-center justify-between pb-4 border-b border-stone-100 ${isCompleted ? 'cursor-pointer select-none' : ''}`}
               >
                    <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[10px] transition-colors duration-300 shadow-2xs ${isActive ? 'bg-stone-950 text-white' : isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-stone-200 text-stone-500'}`}>
                              {isCompleted ? <FiCheck className="w-4 h-4 stroke-[3]" /> : '3'}
                         </div>
                         <div>
                              <h2 className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${isActive || isCompleted ? 'text-stone-955' : 'text-stone-400'}`}>
                                   3. Payment & Notes
                              </h2>
                              {!isActive && (
                                   <p className="text-[10px] text-stone-500 font-bold mt-0.5 animate-fade-in">
                                        {isCompleted ? `Method: ${paymentMethods.find(m => m.key === selectedPayment)?.name || selectedPayment}` : 'Select payment method and enter order notes'}
                                   </p>
                              )}
                         </div>
                    </div>
                    {isActive ? (
                         <span className="text-[10px] bg-stone-50 border border-stone-100 text-stone-600 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                              Step 3 of 3
                         </span>
                    ) : isCompleted ? (
                         <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-emerald-100">
                                   Complete
                              </span>
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit?.();
                                   }}
                                   className="text-[9px] font-black text-stone-500 hover:text-stone-955 hover:bg-stone-50 uppercase tracking-widest border border-stone-250 hover:border-stone-955 px-3.5 py-1.5 rounded-full bg-transparent cursor-pointer transition-all duration-200"
                              >
                                   Modify
                              </button>
                         </div>
                    ) : null}
               </div>

               {/* Content with smooth slide-down dropdown transition */}
               <div className={`grid transition-all duration-300 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`} style={{ gridTemplateRows: isActive ? '1fr' : '0fr' }}>
                    <div className="overflow-hidden">
                         <div className="space-y-6 mt-6">
                              {/* Payment options */}
                              <div className="space-y-4">
                                   <h3 className="text-xs font-black text-stone-950 uppercase tracking-widest flex items-center gap-2">
                                        <FiCreditCard className="w-3.5 h-3.5 text-stone-955 stroke-[2.5]" />
                                        Select Payment Method
                                   </h3>

                                   <div className="space-y-3">
                                        {paymentMethods.length === 0 ? (
                                             <div className="text-center py-6 text-stone-400 text-xs font-bold uppercase tracking-wider bg-stone-50 border border-stone-100 rounded-2xl">
                                                  No payment methods available
                                             </div>
                                        ) : (
                                             paymentMethods.map((p, idx) => (
                                                  <label
                                                       key={p.key}
                                                       className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all duration-200 ${selectedPayment === p.key
                                                            ? 'border-stone-950 bg-stone-50/40 shadow-xs'
                                                            : validationError?.field === 'payment'
                                                                 ? 'border-red-300 hover:border-red-400 hover:bg-stone-50'
                                                                 : 'border-stone-150 hover:bg-stone-50'
                                                            }`}
                                                  >
                                                       <input
                                                            type="radio"
                                                            name="payment"
                                                            ref={idx === 0 ? paymentRef : undefined}
                                                            checked={selectedPayment === p.key}
                                                            onChange={() => setSelectedPayment(p.key)}
                                                            className={`w-4 h-4 text-stone-900 border-stone-300 focus:ring-0 cursor-pointer shrink-0 ${validationError?.field === 'payment' ? 'accent-red-500 text-red-500' : 'accent-stone-950'}`}
                                                       />
                                                       {p.logo}
                                                       <div className="text-xs">
                                                            <h4 className="font-extrabold text-stone-955 text-sm uppercase tracking-wider">{p.name}</h4>
                                                            <div className="text-[10px] text-stone-400 font-semibold mt-0.5">{p.desc}</div>
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
                                   <h3 className="text-xs font-black text-stone-955 uppercase tracking-widest">
                                        Add Note to Order (Optional)
                                   </h3>
                                   <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Note"
                                        rows={4}
                                        className="w-full p-4 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-955/10 focus:border-stone-955 resize-none transition-all duration-200"
                                   />
                              </div>

                              {/* Submit order */}
                              <div className="pt-6 border-t border-stone-100 flex justify-end">
                                   <button
                                        onClick={onSubmit}
                                        disabled={isCheckingOut || !selectedPayment}
                                        className={`px-8 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-widest border-none transition-all duration-200 flex items-center gap-2.5 shadow-md focus:outline-none ${(isCheckingOut || !selectedPayment) ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.15)]'}`}
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
