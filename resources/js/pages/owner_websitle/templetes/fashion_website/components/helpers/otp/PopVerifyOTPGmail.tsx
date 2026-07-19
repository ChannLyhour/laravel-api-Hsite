import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiMail } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { client } from '@/api/client';

interface PopVerifyOTPGmailProps {
     isOpen: boolean;
     onClose: () => void;
     orderId: number | string | null;
     onSuccess: (token: string | null) => void;
     email?: string | null;
}

export const PopVerifyOTPGmail: React.FC<PopVerifyOTPGmailProps> = ({
     isOpen,
     onClose,
     orderId,
     onSuccess,
     email
}) => {
     const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [hasError, setHasError] = useState(false);
     const [errorMsg, setErrorMsg] = useState<string | null>(null);
     const inputRefs = useRef<HTMLInputElement[]>([]);

     useEffect(() => {
          // Focus first input on open
          if (isOpen && inputRefs.current[0]) {
               setTimeout(() => {
                    inputRefs.current[0]?.focus();
               }, 100);
          }
     }, [isOpen]);

     if (!isOpen) return null;

     const maskEmail = (emailStr: string | null | undefined) => {
          if (!emailStr) return 'your email';
          const parts = emailStr.split('@');
          if (parts.length !== 2) return emailStr;
          const [local, domain] = parts;
          if (local.length <= 3) {
               return `${local.substring(0, 1)}***@${domain}`;
          }
          return `${local.substring(0, 3)}***@${domain}`;
     };

     const handleChange = (element: HTMLInputElement, index: number) => {
          if (hasError) setHasError(false);
          if (errorMsg) setErrorMsg(null);
          const val = element.value.replace(/[^0-9]/g, '');
          if (!val) return;

          const newOtp = [...otp];
          newOtp[index] = val.substring(val.length - 1);
          setOtp(newOtp);

          // Auto focus next input
          if (index < 5 && inputRefs.current[index + 1]) {
               inputRefs.current[index + 1].focus();
          }
     };

     const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
          if (hasError) setHasError(false);
          if (errorMsg) setErrorMsg(null);
          if (e.key === 'Backspace') {
               const newOtp = [...otp];
               newOtp[index] = '';
               setOtp(newOtp);

               // Focus previous input on backspace
               if (index > 0 && inputRefs.current[index - 1]) {
                    inputRefs.current[index - 1].focus();
               }
          }
     };

     const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
          if (hasError) setHasError(false);
          if (errorMsg) setErrorMsg(null);
          e.preventDefault();
          const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').substring(0, 6);
          if (pastedData.length === 6) {
               const newOtp = pastedData.split('');
               setOtp(newOtp);
               inputRefs.current[5]?.focus();
          }
     };

     const handleSubmit = async (e?: React.FormEvent) => {
          if (e) e.preventDefault();
          setHasError(false);
          setErrorMsg(null);
          const code = otp.join('');
          if (code.length !== 6) {
               setHasError(true);
               setErrorMsg('Please enter the full 6-digit OTP code.');
               return;
          }

          setIsSubmitting(true);
          const loadingToast = toast.loading('Verifying code...');

          try {
               const res = await client.post<{ success: boolean; token: string; message?: string }>(
                    `/orders/${orderId}/verify-otp`,
                    { otp: code }
               );

               toast.dismiss(loadingToast);

               if (res.success) {
                    toast.success('Email verified successfully!');
                    onSuccess(res.token);
               } else {
                    setHasError(true);
                    setErrorMsg(res.message || 'Verification failed. Please check the code.');
               }
          } catch (err: any) {
               toast.dismiss(loadingToast);
               setHasError(true);
               const errMsg = err.details?.message || err.message || 'Incorrect OTP code. Please try again.';
               setErrorMsg(errMsg);
          } finally {
               setIsSubmitting(false);
          }
     };

     return (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/45 backdrop-blur-2xs p-4 font-kuntomruy animate-fade-in">
               <div className="fixed inset-0 cursor-default" onClick={onClose} />
               <div className="bg-white p-6 sm:p-10 rounded-[6px] border border-stone-200/60 shadow-2xl max-w-md w-full text-center space-y-6 relative z-10 animate-modal-zando">
                    {/* Header Close */}
                    <button
                         onClick={onClose}
                         className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors bg-none border-none cursor-pointer p-1"
                    >
                         <FiX className="w-5 h-5" />
                    </button>

                    {/* Email / Verification Icon */}
                    <div className="w-16 h-16 bg-[#EA4335]/10 text-[#EA4335] rounded-full flex items-center justify-center mx-auto shadow-sm">
                         <FiMail className="w-8 h-8" />
                    </div>

                    <div className="space-y-3">
                         <h2 className="text-lg font-black text-stone-900 uppercase tracking-widest">
                              Gmail OTP Verification
                         </h2>
                         <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                              We have sent a <strong className="font-extrabold text-stone-800">6-digit verification code</strong> to <strong className="text-[#EA4335] font-extrabold">{maskEmail(email)}</strong>. Please enter the code below to complete your checkout.
                         </p>
                    </div>

                    {/* Form Inputs */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                         {errorMsg && (
                              <div className="text-xs font-semibold text-[#E61E25] bg-[#E61E25]/5 border border-[#E61E25]/10 py-2.5 px-4 rounded-[4px] text-center max-w-xs mx-auto animate-fade-in leading-relaxed">
                                   {errorMsg}
                              </div>
                         )}

                         <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
                              {otp.map((digit, idx) => (
                                   <input
                                        key={idx}
                                        ref={(el) => {
                                             if (el) {
                                                  inputRefs.current[idx] = el;
                                             }
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(e.target, idx)}
                                        onKeyDown={(e) => handleKeyDown(e, idx)}
                                        className={`w-12 h-12 text-center text-xl font-bold rounded-[4px] border focus:!outline-none focus-visible:!outline-none transition-all ${
                                             hasError
                                                  ? 'border-red-500 text-red-600 focus:!border-red-500 focus:!ring-2 focus:!ring-red-500/20'
                                                  : 'border-stone-200 text-stone-900 focus:!border-[#ff6b35] focus:!ring-2 focus:!ring-[#ff6b35]/20'
                                        }`}
                                   />
                              ))}
                         </div>

                         <div className="pt-2 flex flex-col gap-2.5">
                              <button
                                   type="submit"
                                   disabled={isSubmitting || otp.join('').length !== 6}
                                   className="w-full py-3.5 bg-stone-900 hover:bg-stone-850 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white rounded-[4px] font-black text-xs uppercase tracking-widest border-none transition-all cursor-pointer shadow-sm focus:outline-none"
                              >
                                   Verify & Complete Order
                              </button>
                              <button
                                   type="button"
                                   onClick={onClose}
                                   className="w-full py-3.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-500 rounded-[4px] font-black text-xs uppercase tracking-widest transition-all cursor-pointer focus:outline-none"
                              >
                                   Back to Checkout
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
};
