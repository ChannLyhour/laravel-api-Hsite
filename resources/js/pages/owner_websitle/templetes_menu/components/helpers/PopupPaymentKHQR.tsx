import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheck, FiLoader, FiSmartphone } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
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
     
     let themeColor = '#0B3B5B'; // ABA default dark blue
     let buttonBg = 'bg-[#005D7E] hover:bg-[#004b66]';
     let titleText = isHttpUrl ? 'ABA PAY' : 'ABA KHQR';
     let payButtonText = 'Pay in ABA Mobile';
     
     if (methodKey === 'bakong') {
          themeColor = '#b30006';
          buttonBg = 'bg-[#b30006] hover:bg-[#8f0005]';
          titleText = 'Bakong KHQR';
          payButtonText = 'Pay in Bakong App';
     } else if (methodKey === 'acleda') {
          themeColor = '#0D3B66'; // ACLEDA navy blue
          buttonBg = 'bg-[#0D3B66] hover:bg-[#0a2c4d]';
          titleText = 'ACLEDA KHQR';
          payButtonText = 'Pay in ACLEDA Mobile';
     } else if (methodKey === 'wing') {
          themeColor = '#84bd00'; // Wing green
          buttonBg = 'bg-[#84bd00] hover:bg-[#6a9700]';
          titleText = 'Wing KHQR';
          payButtonText = 'Pay in Wing Bank App';
     } else if (methodKey === 'chipmong') {
          themeColor = '#009b72'; // Chip Mong teal
          buttonBg = 'bg-[#009b72] hover:bg-[#007c5b]';
          titleText = 'Chip Mong KHQR';
          payButtonText = 'Pay in Chip Mong App';
     } else if (methodKey === 'transfer') {
          themeColor = '#475569'; // Slate
          buttonBg = 'bg-[#475569] hover:bg-[#334155]';
          titleText = 'Bank Transfer KHQR';
          payButtonText = 'Open Banking App';
     } else if (methodKey === 'cod') {
          themeColor = '#0f172a'; // Dark slate
          buttonBg = 'bg-[#0f172a] hover:bg-[#1e293b]';
          titleText = 'Cash on Delivery';
          payButtonText = 'Confirm COD';
     }

     const scanInstructionText = isHttpUrl
          ? 'Scan with your Phone Camera or Google Lens to pay'
          : 'Scan with any Mobile Banking App supporting KHQR to pay';

     if (!isOpen) return null;

     return createPortal(
          <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in font-sans">
               <div className="bg-white w-full max-w-[380px] rounded-[5px] shadow-2xl overflow-hidden relative animate-scale-in">
                    {/* Header with Theme Color */}
                    <div 
                         className="px-5 py-4 flex items-center justify-between text-white"
                         style={{ backgroundColor: themeColor }}
                    >
                         <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                   <FiSmartphone className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                   <h2 className="text-sm font-black tracking-tight leading-none">{titleText}</h2>
                                   <p className="text-[10px] font-bold opacity-70 mt-1 uppercase tracking-wider">Digital Payment</p>
                              </div>
                         </div>
                         <button 
                              onClick={onClose}
                              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors border-none bg-transparent text-white cursor-pointer"
                         >
                              <FiX className="w-5 h-5" />
                         </button>
                    </div>

                    <div className="p-8 flex flex-col items-center">
                         {/* Ticket Header (Red KHQR tag with diagonal cut) */}
                         <div 
                              className="w-[calc(100%+40px)] bg-[#E61E25] py-3.5 px-4 flex justify-center items-center -mt-5 mb-5 select-none"
                              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 72%, 92% 100%, 0 100%)' }}
                         >
                              <span className="text-white font-sans font-black tracking-[0.2em] text-[15px] flex items-center justify-center">
                                   KHQR
                              </span>
                         </div>

                         {/* Merchant & Amount Info Section */}
                         <div className="w-full text-center space-y-1 mt-1">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-full">
                                   {merchantName}
                              </p>
                              <div className="flex items-baseline justify-center gap-1.5 mt-2">
                                   <span className="text-3.5xl font-black text-slate-800 tracking-tight leading-none">
                                        {currency === 'USD' ? amount.toFixed(2) : new Intl.NumberFormat('km-KH').format(Math.round(amount * 4100))}
                                   </span>
                                   <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                        {currency}
                                   </span>
                              </div>
                         </div>

                         {/* Left and Right Ticket Cutouts and Dashed Separator */}
                         <div className="w-full relative my-5 flex items-center justify-between select-none">
                              <div className="absolute -left-[30px] w-5 h-5 bg-white border border-slate-200/60 rounded-[5px] z-10" />
                              <div className="w-full border-t border-dashed border-slate-300" />
                              <div className="absolute -right-[30px] w-5 h-5 bg-white border border-slate-200/60 rounded-[5px] z-10" />
                         </div>

                         {/* QR Code Container */}
                         <div className="relative w-56 h-56 my-2 flex items-center justify-center bg-white p-2 select-none border border-slate-100 rounded-[5px] shadow-sm">
                              {isLoadingQr ? (
                                   <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <FiLoader className="w-8 h-8 animate-spin text-[#005D7E]" />
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
                                        <button
                                             onClick={refreshQr}
                                             title="Generate new QR"
                                             className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors cursor-pointer shadow-sm"
                                             style={{ fontSize: 12 }}
                                        >↻</button>
                                   </div>
                              ) : (
                                   <div className="text-slate-400 text-2xs uppercase tracking-wider font-bold">No QR Code</div>
                              )}
                         </div>

                    {/* Scan instructions text */}
                    <p className="text-[11px] font-semibold text-slate-400 text-center leading-relaxed max-w-[240px] mt-5 mb-1 select-none">
                         {scanInstructionText}
                    </p>

                    {/* Control Actions */}
                    <div className="w-full flex flex-col gap-2.5 mt-6">
                         {abapayDeeplink && (
                              <a
                                   href={abapayDeeplink}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className={`w-full py-3 ${buttonBg} text-white rounded-[5px] text-xs font-bold uppercase tracking-wider text-center no-underline shadow-sm transition-all duration-200 flex items-center justify-center gap-2 border-none cursor-pointer active:scale-[0.98]`}
                              >
                                   <FiSmartphone className="w-4 h-4" />
                                   {payButtonText}
                              </a>
                         )}
                         <button
                              onClick={handleVerify}
                              disabled={isVerifying || isLoadingQr}
                              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-[5px] text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm focus:outline-none flex items-center justify-center gap-2 border-none disabled:opacity-50 active:scale-[0.98]"
                         >
                              {isVerifying ? (
                                   <>
                                        <FiLoader className="w-4 h-4 animate-spin" />
                                        Verifying...
                                   </>
                              ) : (
                                   <>
                                        <FiCheck className="w-4 h-4 stroke-[3]" />
                                        Confirm Sandbox Payment
                                   </>
                              )}
                         </button>
                     </div>
                </div>
           </div>
      </div>,
          document.body
     );
};
