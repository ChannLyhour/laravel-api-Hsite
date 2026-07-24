import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheck, FiLoader, FiSmartphone } from 'react-icons/fi';
import { toast } from '../../utils/toast';
import { client } from '@/api/client';

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
     merchantName = 'Our20s Collection',
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
               // Always clear stale QR before fetching fresh one
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
                         // Sync to walkin display
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

               // Fallback simulation
               await new Promise((resolve) => setTimeout(resolve, 1500));
               toast.success('Sandbox Payment Confirmed (Simulated)!');
               onConfirmPayment();
          } catch (err) {
               toast.error('Verification failed');
          } finally {
               setIsVerifying(false);
          }
     };

     const methodKey = paymentMethod?.toLowerCase() || 'aba';
     const isHttpUrl = qrString && (qrString.startsWith('http://') || qrString.startsWith('https://'));
     
     let titleText = isHttpUrl ? 'ABA PAY' : 'ABA KHQR';
     let payButtonText = 'Pay in ABA Mobile';
     let buttonBg = 'bg-[#005D7E] hover:bg-[#004b66]';
     
     if (methodKey === 'bakong') {
          titleText = 'Bakong KHQR';
          payButtonText = 'Pay in Bakong App';
          buttonBg = 'bg-[#b30006] hover:bg-[#8f0005]';
     } else if (methodKey === 'acleda') {
          titleText = 'ACLEDA KHQR';
          payButtonText = 'Pay in ACLEDA Mobile';
          buttonBg = 'bg-[#0D3B66] hover:bg-[#0a2c4d]';
     } else if (methodKey === 'wing') {
          titleText = 'Wing KHQR';
          payButtonText = 'Pay in Wing Bank App';
          buttonBg = 'bg-[#84bd00] hover:bg-[#6a9700]';
     } else if (methodKey === 'chipmong') {
          titleText = 'Chip Mong KHQR';
          payButtonText = 'Pay in Chip Mong App';
          buttonBg = 'bg-[#009b72] hover:bg-[#007c5b]';
     }

     const scanInstructionText = `Scan with ${methodKey === 'aba' ? 'ABA Mobile' : (methodKey === 'bakong' ? 'Bakong App' : 'Mobile Banking')}, or other Mobile Banking App supporting KHQR`;

     if (!isOpen) return null;

     return createPortal(
          <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in font-sans">
               <div className="bg-white w-full max-w-[360px] rounded-[20px] shadow-2xl overflow-hidden relative animate-scale-in border border-slate-100">
                    {/* Header */}
                    <div className="px-6 pt-5 pb-2 flex items-center justify-between text-slate-800">
                         <h2 className="text-base font-semibold text-slate-800 tracking-tight">{titleText}</h2>
                         <button 
                              onClick={onClose}
                              className="text-cyan-500 hover:text-cyan-600 transition-colors p-1 border-none bg-transparent cursor-pointer flex items-center justify-center"
                         >
                              <FiX className="w-5 h-5 stroke-[2.5]" />
                         </button>
                    </div>

                    <div className="px-6 pt-2 pb-6 flex flex-col items-center">
                         {/* Ticket Card Container */}
                         <div className="w-full bg-white rounded-[16px] border border-slate-200/80 shadow-md overflow-hidden flex flex-col items-center relative">
                              {/* Top Red KHQR Header */}
                              <div className="w-full bg-[#E61E25] py-2.5 flex justify-center items-center text-white select-none">
                                   <span className="font-sans font-black tracking-[0.2em] text-sm leading-none">
                                        KHQR
                                   </span>
                              </div>

                              {/* Merchant & Amount Details */}
                              <div className="w-full text-center px-4 pt-4">
                                   <p className="text-[12px] font-medium text-slate-600 truncate max-w-full">
                                        {merchantName}
                                   </p>
                                   <div className="flex items-baseline justify-center gap-1.5 mt-1">
                                        <span className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                                             {currency === 'USD' ? amount.toFixed(2) : new Intl.NumberFormat('km-KH').format(Math.round(amount * 4100))}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                             {currency}
                                        </span>
                                   </div>
                              </div>

                              {/* Dashed Separator */}
                              <div className="w-full border-t border-dashed border-slate-200 my-3.5" />

                              {/* QR Code Display Area */}
                              <div className="relative w-48 h-48 mb-4 flex items-center justify-center bg-white p-1 select-none">
                                   {isLoadingQr ? (
                                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                             <FiLoader className="w-7 h-7 animate-spin text-slate-600" />
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
                                        <div className="relative w-full h-full select-none">
                                             <img
                                                  src={qrImage || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString || '')}`}
                                                  alt={titleText}
                                                  className="w-full h-full object-contain pointer-events-none"
                                             />
                                        </div>
                                   ) : (
                                        <div className="text-slate-400 text-xs uppercase tracking-wider font-bold">No QR Code</div>
                                   )}
                              </div>
                         </div>

                         {/* Instruction text below ticket */}
                         <p className="text-[11px] font-normal text-slate-400 text-center leading-relaxed max-w-[240px] mt-4 mb-1 select-none">
                              {scanInstructionText}
                         </p>

                         {/* Optional Deep-link or Sandbox controls */}
                         {abapayDeeplink && (
                              <a
                                   href={abapayDeeplink}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className={`w-full mt-3 py-2.5 ${buttonBg} text-white rounded-[10px] text-xs font-bold uppercase tracking-wider text-center no-underline shadow-xs transition-all duration-200 flex items-center justify-center gap-2 border-none cursor-pointer active:scale-[0.98]`}
                              >
                                   <FiSmartphone className="w-4 h-4" />
                                   {payButtonText}
                              </a>
                         )}

                         {import.meta.env.DEV && (
                              <button
                                   onClick={handleVerify}
                                   disabled={isVerifying || isLoadingQr}
                                   className="w-full mt-2.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[10px] text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-xs focus:outline-none flex items-center justify-center gap-2 border-none disabled:opacity-50 active:scale-[0.98]"
                              >
                                   {isVerifying ? (
                                        <>
                                             <FiLoader className="w-4 h-4 animate-spin" />
                                             Verifying...
                                        </>
                                   ) : (
                                        <>
                                             <FiCheck className="w-4 h-4 stroke-[2.5]" />
                                             Confirm Sandbox Payment
                                        </>
                                   )}
                              </button>
                         )}
                    </div>
               </div>
          </div>,
          document.body
     );
};
