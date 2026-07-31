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
                                        <svg viewBox="13.4 3.95 6.3 1.6" className="h-8 sm:h-9 w-auto drop-shadow-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                                             <path d="M17.435 4.55882V5.03676H16.9654C16.9184 5.03676 16.8832 5.00091 16.8832 4.95312V4.55882C16.8832 4.51103 16.9184 4.47518 16.9654 4.47518H17.3411C17.3998 4.46324 17.435 4.51103 17.435 4.55882Z" fill="white"/>
                                             <path d="M13.7104 4.6662L14.3677 3.99725H14.6841L13.98 4.71405L14.7202 5.50311H14.3911L13.7104 4.79803V5.50311H13.4399V3.99725H13.7104V4.6662ZM15.2007 4.63007H15.9526V3.99725H16.2104V5.50311H15.9526V4.84589H15.2007V5.50311H14.9312V3.99725H15.2007V4.63007ZM18.9351 3.99725C19.3459 3.9973 19.6743 4.33203 19.6743 4.75018H19.4399C19.4399 4.46346 19.2168 4.23656 18.9351 4.23651C18.712 4.23651 18.5241 4.37984 18.4536 4.59491C18.442 4.64267 18.4302 4.70247 18.4302 4.75018V5.50311H18.4185C18.2893 5.50311 18.1948 5.39506 18.1948 5.27557V4.75018C18.1948 4.54706 18.2775 4.34376 18.4302 4.20038C18.5711 4.06896 18.7472 3.99725 18.9351 3.99725ZM19.6743 5.50311H19.3462L19.2632 5.41913L19.0874 5.23944L18.8413 4.98846H19.1694L19.6743 5.50311ZM17.7378 3.99725C17.8549 3.9975 17.9602 4.09277 17.9604 4.22382V5.34784L17.7261 5.10858V4.39178C17.7261 4.30814 17.655 4.23651 17.5728 4.23651H16.8687C16.7865 4.23651 16.7163 4.30814 16.7163 4.39178V5.10858C16.7164 5.19215 16.7865 5.26385 16.8687 5.26385H17.5728L17.8081 5.49042H16.7163C16.5989 5.49042 16.4927 5.39523 16.4927 5.26385V4.22382C16.4929 4.1045 16.5873 3.99725 16.7163 3.99725H17.7378Z" fill="white"/>
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
