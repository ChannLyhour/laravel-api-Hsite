import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiLoader } from 'react-icons/fi';
import { toast } from '../../utils/toast';
import { client } from '@/api/client';
import { AbaBankQrSandbox } from './option-paid/aba-bank';

interface PopupPaymentKHQRProps {
     isOpen: boolean;
     onClose: () => void;
     onConfirmPayment: () => void;
     amount: number;
     merchantName?: string;
     currency?: 'USD' | 'KHR';
     orderId: number | string | null;
     paymentMethod?: string;
}

export const PopupPaymentKHQR: React.FC<PopupPaymentKHQRProps> = ({
     isOpen,
     onClose,
     onConfirmPayment,
     amount,
     merchantName = 'MY SHOP',
     currency = 'USD',
     orderId,
     paymentMethod = 'aba',
}) => {
     const [isVerifying, setIsVerifying] = useState(false);

     // ABA Payment API States
     const [qrString, setQrString] = useState<string | null>(null);
     const [qrImage, setQrImage] = useState<string | null>(null);
     const [transactionId, setTransactionId] = useState<string | null>(null);
     const [abapayDeeplink, setAbapayDeeplink] = useState<string | null>(null);
     const [isLoadingQr, setIsLoadingQr] = useState(false);
     const [qrError, setQrError] = useState<string | null>(null);
     const [refreshKey, setRefreshKey] = useState(0);

     // Refresh QR manually
     const refreshQr = () => {
          setQrString(null);
          setQrImage(null);
          setTransactionId(null);
          setAbapayDeeplink(null);
          setQrError(null);
          localStorage.removeItem('walkin_payment_qr');
          setRefreshKey(k => k + 1);
     };

     // Fetch ABA QR Code on Open
     useEffect(() => {
          if (!isOpen || !orderId) {
               setQrString(null);
               setQrImage(null);
               setTransactionId(null);
               setAbapayDeeplink(null);
               setQrError(null);
               localStorage.removeItem('walkin_payment_qr');
               return;
          }

          const fetchQrCode = async () => {
               setIsLoadingQr(true);
               setQrError(null);
               localStorage.removeItem('walkin_payment_qr');
               try {
                    const response = await client.post<any>('/payments/generate-qr', {
                         order_id: Number(orderId),
                         currency: currency,
                    });

                    if (response.success) {
                         setQrString(response.qrString);
                         setQrImage(response.qrImage || null);
                         setTransactionId(response.transaction_id);
                         setAbapayDeeplink(response.abapay_deeplink);
                         localStorage.setItem('walkin_payment_qr', JSON.stringify({
                              qrString: response.qrString,
                              qrImage: response.qrImage || null,
                              transactionId: response.transaction_id,
                              abapayDeeplink: response.abapay_deeplink,
                              paymentMethod
                         }));
                    } else {
                         setQrError(response.message || 'Failed to generate QR Code');
                         toast.error(response.message || 'Failed to generate QR Code');
                    }
               } catch (err: any) {
                    console.error('Error fetching QR:', err);
                    const errMsg = err.details?.message || err.message || 'Network error occurred';
                    setQrError(errMsg);
                    toast.error(errMsg);
               } finally {
                    setIsLoadingQr(false);
               }
          };

          fetchQrCode();
     }, [isOpen, orderId, currency, paymentMethod, refreshKey]);

     // Poll transaction status to auto-detect payment completion
     useEffect(() => {
          if (!isOpen || !transactionId) return;

          const checkStatus = async () => {
               try {
                    const response = await client.post<any>('/payments/check-transaction', {
                         transaction_id: transactionId,
                    });
                    const isPaid = response.success && (
                         response.status === 'PAID' ||
                         response.payment_status === 'Paid' ||
                         response.payment_status === 'PAID'
                    );
                    if (isPaid) {
                         if (response.customer_token) {
                              localStorage.setItem('aura_customer_token', response.customer_token);
                              window.dispatchEvent(new Event('aura_token_changed'));
                         }
                         toast.success('Payment Received Successfully!');
                         onConfirmPayment();
                    }
               } catch (err) {
                    console.error('Error checking transaction status:', err);
               }
          };

          const interval = setInterval(checkStatus, 3000);
          return () => clearInterval(interval);
     }, [isOpen, transactionId, onConfirmPayment]);

     const handleVerify = async () => {
          setIsVerifying(true);
          try {
               if (transactionId) {
                    try {
                         const response = await client.post<any>('/payments/check-transaction', {
                              transaction_id: transactionId,
                              confirm: true,
                         });
                         if (response.success && (response.payment_status === 'Paid' || response.payment_status === 'PAID')) {
                              if (response.customer_token) {
                                   localStorage.setItem('aura_customer_token', response.customer_token);
                                   window.dispatchEvent(new Event('aura_token_changed'));
                              }
                              toast.success('Sandbox Payment Confirmed!');
                              onConfirmPayment();
                              return;
                         }
                    } catch (apiErr) {
                         console.warn('API verification failed, falling back to local simulation...', apiErr);
                    }
               }

               await new Promise((resolve) => setTimeout(resolve, 1500));
               toast.success('Sandbox Payment Confirmed (Simulated)!');
               onConfirmPayment();
          } catch (err) {
               toast.error('Verification failed');
          } finally {
               setIsVerifying(false);
          }
     };

     if (!isOpen) return null;

     if (paymentMethod === 'aba' || paymentMethod === 'aba_pay') {
          return (
               <AbaBankQrSandbox
                    isOpen={isOpen}
                    onClose={onClose}
                    onSuccess={onConfirmPayment}
                    amount={amount}
                    currency={currency}
                    merchantName={merchantName}
                    orderId={orderId}
               />
          );
     }

     return createPortal(
          <div className="fixed inset-0 z-[99999] bg-[#081B37]/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 select-none animate-fade-in font-kuntomruy">

               {/* ABA PAYWAY Floating Header Logo */}
               <div className="w-full max-w-[340px] flex justify-end mb-3 select-none pr-1">
                    <img
                         src="/assets/payment_logo/PayWay Logo.svg"
                         alt="ABA PAYWAY"
                         className="h-6 sm:h-7 w-auto object-contain drop-shadow-sm select-none"
                    />
               </div>

               {/* Main White Modal Box Container */}
               <div className="bg-white w-full max-w-[340px] rounded-3xl shadow-2xl overflow-hidden relative animate-scale-in border border-stone-100/50">
                    {/* Modal Header Bar */}
                    <div className="px-6 pt-5 pb-3 flex items-center justify-between bg-white">
                         <h2 className="text-sm font-black text-stone-900 tracking-tight">ABA KHQR</h2>
                         <button
                              onClick={onClose}
                              className="text-[#0BBCD4] hover:text-[#0999ac] transition-colors p-1 border-none bg-transparent cursor-pointer flex items-center justify-center"
                         >
                              <FiX className="w-5 h-5 stroke-[2.5]" />
                         </button>
                    </div>

                    {/* Inner Ticket Card Box */}
                    <div className="px-5 pb-5">
                         <div className="w-full bg-white rounded-2xl border border-stone-200/90 shadow-md overflow-hidden flex flex-col items-center relative">

                              {/* Red KHQR Header Banner (#E21A1A with exact notch cut) */}
                              <div className="w-full h-14 bg-white rounded-t-2xl relative flex items-center justify-center text-white select-none overflow-hidden">
                                   <div
                                        className="absolute inset-0 bg-[#E21A1A]"
                                        style={{
                                             clipPath: 'polygon(0 0, 100% 0, 100% 100%, 84% 74%, 0 74%)'
                                        }}
                                   />
                                   <div className="relative z-10 flex items-center justify-center pb-2">
                                        {/* Official Scaled KHQR White Logo Vector */}
                                        <svg viewBox="14 16 38.6 9" className="h-5 sm:h-5 w-auto drop-shadow-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                                             <path d="M21.9466 24.9996H19.9185L15.6778 20.8083V24.9996H14V16H15.6778V20.0099L19.7525 16H21.7438L17.3188 20.3184L21.9466 24.9996Z" fill="white"/>
                                             <path d="M29.5243 16H31.1652V24.9996H29.5243V21.0986H24.8411V24.9996H23.2002V16H24.8411V19.7559H29.5243V16Z" fill="white"/>
                                             <path d="M39.0751 19.3384V22.1689H36.1988C35.9038 22.1689 35.6826 21.933 35.6826 21.6609V19.3565C35.6826 19.0662 35.9223 18.8485 36.1988 18.8485H38.5404C38.8539 18.8303 39.0751 19.048 39.0751 19.3384Z" fill="white"/>
                                             <path d="M39.5549 23.5662H35.2221C34.6874 23.5662 34.2633 23.1489 34.2633 22.6227V18.3588C34.2633 17.8326 34.6874 17.4153 35.2221 17.4153H39.5549C40.0896 17.4153 40.5137 17.8326 40.5137 18.3588V22.6227L41.9518 24.038V17.379C41.9518 16.6169 41.3249 16 40.5505 16H34.2264C33.4521 16 32.8252 16.6169 32.8252 17.379V23.6025C32.8252 24.3646 33.4521 24.9815 34.2264 24.9815H40.993L39.5549 23.5662Z" fill="white"/>
                                             <path d="M52.5535 20.4817H51.1153C51.1153 18.7942 49.7141 17.4153 47.9994 17.4153C46.635 17.4153 45.4366 18.2862 45.0309 19.5563C44.9387 19.8648 44.8834 20.1732 44.8834 20.4817V24.9815H44.8466C44.0722 24.9815 43.4453 24.3646 43.4453 23.6025V20.4817H43.4637C43.4637 19.2478 43.98 18.0685 44.9019 17.2157C45.75 16.4355 46.8563 16 48.0178 16C50.5253 16 52.5535 18.014 52.5535 20.4817Z" fill="white"/>
                                             <path d="M52.5715 24.9814L50.5433 24.9996L50.0455 24.5097L48.9393 23.421L47.4089 21.915H49.4371L52.5715 24.9814Z" fill="white"/>
                                        </svg>
                                   </div>
                              </div>

                              {/* Merchant & Amount Details */}
                              <div className="w-full text-center px-4 pt-3 pb-1">
                                   <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate max-w-full">
                                        {merchantName}
                                   </p>
                                   <div className="flex items-baseline justify-center gap-1.5 mt-1">
                                        <span className="text-2xl font-black text-stone-900 tracking-tight leading-none">
                                             $ {currency === 'USD' ? amount.toFixed(2) : new Intl.NumberFormat('km-KH').format(Math.round(amount * 4100))}
                                        </span>
                                   </div>
                              </div>

                              {/* Dashed Separator Line */}
                              <div className="w-full border-t border-dashed border-stone-300/80 my-3.5" />

                              {/* QR Code Container with Centered USD ($) Badge */}
                              <div className="relative w-48 h-48 mb-4 flex items-center justify-center bg-white p-2 select-none">
                                   {isLoadingQr ? (
                                        <div className="flex flex-col items-center justify-center text-stone-400 gap-2">
                                             <FiLoader className="w-7 h-7 animate-spin text-stone-600" />
                                             <span className="text-[10px] font-bold tracking-wider uppercase">Generating QR...</span>
                                        </div>
                                   ) : qrError ? (
                                        <div className="flex flex-col items-center justify-center text-center p-2 text-red-500 gap-2">
                                             <span className="text-2xl">⚠️</span>
                                             <span className="text-[10px] font-bold leading-tight">{qrError}</span>
                                             <button
                                                  onClick={refreshQr}
                                                  className="mt-1 text-[9px] font-bold uppercase tracking-wider text-blue-600 underline border-none bg-transparent cursor-pointer"
                                             >Retry</button>
                                        </div>
                                   ) : (qrImage || qrString) ? (
                                        <div className="relative w-full h-full select-none flex items-center justify-center">
                                             <img
                                                  src={qrImage || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString || '')}`}
                                                  alt="ABA KHQR"
                                                  className="w-full h-full object-contain pointer-events-none rounded-lg"
                                             />
                                             {/* Bakong KHQR Badge in center of QR Code */}
                                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                  <div className="w-8 h-8 rounded-full overflow-hidden border-[1.5px] border-white shadow-sm bg-white flex items-center justify-center">
                                                       <img
                                                            src="/assets/payment_enable/bakong-bank.svg"
                                                            alt="KHQR"
                                                            className="w-full h-full object-cover"
                                                       />
                                                  </div>
                                             </div>
                                        </div>
                                   ) : (
                                        <div className="text-stone-400 text-xs uppercase tracking-wider font-bold">No QR Code</div>
                                   )}
                              </div>
                         </div>

                         {/* Instruction text below ticket */}
                         <p className="text-[11px] font-medium text-stone-400 text-center leading-relaxed max-w-[260px] mx-auto mt-4 mb-1 select-none">
                              Scan with Bakong App or Mobile Banking app that support KHQR
                         </p>

                         {/* Sandbox Verification (Subtle link for DEV testing) */}
                         {import.meta.env.DEV && (
                              <div className="mt-3 text-center">
                                   <button
                                        onClick={handleVerify}
                                        disabled={isVerifying || isLoadingQr}
                                        className="text-[11px] font-bold text-stone-400 hover:text-stone-900 underline border-none bg-transparent cursor-pointer transition-colors"
                                   >
                                        {isVerifying ? 'Verifying Sandbox Payment...' : '✓ Confirm Sandbox Payment'}
                                   </button>
                              </div>
                         )}
                    </div>
               </div>
          </div>,
          document.body
     );
};
