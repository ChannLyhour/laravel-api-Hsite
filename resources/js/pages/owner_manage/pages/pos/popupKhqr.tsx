import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheck, FiLoader, FiSmartphone } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { client } from '@/api/client';
import { QRCodeSVG } from 'qrcode.react';

interface PopupPaymentKHQRProps {
     isOpen: boolean;
     onClose: () => void;
     onConfirmPayment: () => void;
     amount: number;
     merchantName?: string;
     currency?: 'USD' | 'KHR';
     orderId: number | string | null;
     paymentMethod?: string;
     storeId?: number | string;
}

export const PopupPaymentKHQR: React.FC<PopupPaymentKHQRProps> = ({
     isOpen,
     onClose,
     onConfirmPayment,
     amount,
     merchantName = 'BiteFlow Outlet',
     currency = 'USD',
     orderId,
     paymentMethod = 'aba',
     storeId,
}) => {
     const [isVerifying, setIsVerifying] = useState(false);

     // API payment states
     const [qrString, setQrString] = useState<string | null>(null);
     const [qrImage, setQrImage] = useState<string | null>(null);
     const [transactionId, setTransactionId] = useState<string | null>(null);
     const [abapayDeeplink, setAbapayDeeplink] = useState<string | null>(null);
     const [bakongMd5, setBakongMd5] = useState<string | null>(null);
     const [isLoadingQr, setIsLoadingQr] = useState(false);
     const [qrError, setQrError] = useState<string | null>(null);
     const [refreshKey, setRefreshKey] = useState(0);

     // Refresh QR manually
     const refreshQr = () => {
          setQrString(null);
          setQrImage(null);
          setTransactionId(null);
          setAbapayDeeplink(null);
          setBakongMd5(null);
          setQrError(null);
          localStorage.removeItem('walkin_payment_qr');
          setRefreshKey(k => k + 1);
     };

     // Fetch QR Code on Modal Open or manual refresh
     useEffect(() => {
          if (!isOpen) {
               setQrString(null);
               setQrImage(null);
               setTransactionId(null);
               setAbapayDeeplink(null);
               setBakongMd5(null);
               setQrError(null);
               localStorage.removeItem('walkin_payment_qr');
               return;
          }

          const fetchQrCode = async () => {
               setIsLoadingQr(true);
               setQrError(null);
               // Always clear stale QR before fetching a fresh one
               localStorage.removeItem('walkin_payment_qr');
               try {
                    const isBakong = paymentMethod?.toLowerCase() === 'bakong';
                    const url = isBakong ? '/owner/khqr-bakong/generate' : '/payments/generate-qr';

                    const payload: any = {
                         currency: currency,
                    };

                    if (orderId && !String(orderId).startsWith('POS-')) {
                         payload.order_id = Number(orderId);
                    } else {
                         payload.store_id = Number(storeId);
                         payload.amount = Number(amount);
                         payload.payment_method = paymentMethod;
                         payload.bill_no = `TXN-POS-${Date.now()}`;
                    }

                    const response = await client.post<any>(url, payload);

                    if (response.success) {
                         setQrString(response.qrString);
                         setQrImage(response.qrImage || null);
                         setTransactionId(response.transaction_id);
                         setAbapayDeeplink(response.abapay_deeplink);
                         if (response.md5) {
                              setBakongMd5(response.md5);
                         }
                         // Sync to walkin display with fresh QR
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
     }, [isOpen, orderId, amount, currency, paymentMethod, storeId, refreshKey]);

     // Poll transaction status to auto-detect payment completion
     useEffect(() => {
          if (!isOpen || !transactionId) return;

          const checkStatus = async () => {
               try {
                    const isBakong = paymentMethod?.toLowerCase() === 'bakong';
                    const url = isBakong ? '/owner/khqr-bakong/check' : '/payments/check-transaction';

                    const payload: any = {
                         transaction_id: transactionId,
                    };
                    if (isBakong && bakongMd5) {
                         payload.md5 = bakongMd5;
                    }
                    if (storeId) {
                         payload.store_id = Number(storeId);
                    }
                    if (paymentMethod) {
                         payload.payment_method = paymentMethod;
                    }

                    const response = await client.post<any>(url, payload);

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

          const interval = setInterval(checkStatus, 3000); // Check status every 3 seconds
          return () => clearInterval(interval);
     }, [isOpen, transactionId, onConfirmPayment, paymentMethod, bakongMd5, storeId]);

     const handleVerify = async () => {
          setIsVerifying(true);
          try {
               if (transactionId) {
                    try {
                         const isBakong = paymentMethod?.toLowerCase() === 'bakong';
                         const url = isBakong ? '/owner/khqr-bakong/check' : '/payments/check-transaction';

                         const payload: any = {
                              transaction_id: transactionId,
                              confirm: true,
                         };
                         if (isBakong && bakongMd5) {
                              payload.md5 = bakongMd5;
                         }
                         if (storeId) {
                              payload.store_id = Number(storeId);
                         }
                         if (paymentMethod) {
                              payload.payment_method = paymentMethod;
                         }

                         const response = await client.post<any>(url, payload);
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

     if (!isOpen) return null;

     const methodKey = paymentMethod?.toLowerCase() || 'aba';

     let themeColor = '#0B3B5B'; // ABA default dark blue
     let buttonBg = 'bg-[#005D7E] hover:bg-[#004b66]';
     let titleText = 'ABA KHQR';
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

     // Official KHQR star/flower icon in SVG format for the center of the QR code
     const khqrLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#E61E25"/><circle cx="50" cy="50" r="41" fill="none" stroke="#FFFFFF" stroke-width="3"/><path d="M50 24 L55 38 L69 33 L62 47 L76 52 L62 57 L69 71 L55 66 L50 80 L45 66 L31 71 L38 57 L24 52 L38 47 L31 33 L45 38 Z" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><rect x="46" y="46" width="8" height="8" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2.5"/></svg>`;
     const khqrLogoDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(khqrLogoSvg)}`;

     return createPortal(
          <div className="fixed inset-0 z-[99999] bg-[#f3f3f3]/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in font-sans">
               <div className="w-full max-w-[360px] flex flex-col gap-4 animate-scale-in">
                    {/* Top line with payment method name and close button */}
                    <div className="flex items-center justify-between px-1">
                         <span className="text-xs font-bold text-slate-800 tracking-wide">
                              Name : {titleText}
                         </span>
                         <button
                              onClick={onClose}
                              className="w-8 h-8 rounded-full bg-black hover:bg-slate-850 flex items-center justify-center border-none text-white cursor-pointer transition-transform duration-200 active:scale-95 shadow-sm"
                         >
                              <FiX className="w-4 h-4 stroke-[3]" />
                         </button>
                    </div>

                    {/* Ticket Card */}
                    <div className="bg-white rounded-[24px] shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-slate-100/80 overflow-hidden w-full flex flex-col">
                         {/* Red Header Banner with bottom-right diagonal cut */}
                         <div
                              className="w-full bg-[#E61E25] py-4.5 flex justify-center items-center select-none"
                              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 68%, 91% 100%, 0 100%)' }}
                         >
                              {/* Stylized KHQR text SVG */}
                              <svg viewBox="0 0 150 40" className="h-6.5 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
                                   {/* K */}
                                   <path d="M15 8h7v12l11-12h8L29 21l13 11h-8L22 22v10h-7V8z" />
                                   {/* H */}
                                   <path d="M48 8h7v9h12V8h7v24h-7V23H55v9h-7V8z" />
                                   {/* Q */}
                                   <path d="M93 20c0-6.5-5.5-12-12-12s-12 5.5-12 12 5.5 12 12 12c2.5 0 4.8-.8 6.7-2.2l5.6 5.6 4.9-4.9-5.7-5.7c.3-1.5.5-3.1.5-4.8zm-17 0c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5-5-2.2-5-5z" />
                                   {/* R */}
                                   <path d="M104 8h15c5.5 0 9 3.5 9 8 0 3.5-2.5 6.5-7 7.5l8 8.5h-9l-6.5-8h-2.5v8h-7V8zm7 10h7c2.5 0 3.5-1 3.5-2.5s-1-2.5-3.5-2.5h-7v5z" />
                              </svg>
                         </div>

                         {/* Ticket Content */}
                         <div className="p-6.5 pt-4 flex flex-col items-center">
                              {/* Merchant Name */}
                              <h3 className="text-[13px] font-black text-slate-800 tracking-wide uppercase mt-1 mb-2 text-center max-w-full truncate">
                                   {merchantName}
                              </h3>

                              {/* Amount info */}
                              <div className="flex items-baseline justify-center gap-1.5 mb-1.5">
                                   <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                                        {currency === 'USD' ? `$${amount.toFixed(2)}` : `${new Intl.NumberFormat('km-KH').format(Math.round(amount * 4100))} KHR`}
                                   </span>
                              </div>

                              {/* Dashed Separator */}
                              <div className="w-full border-t border-dashed border-slate-200 my-3.5" />

                              {/* QR Code Box */}
                              <div className="relative w-52 h-52 flex items-center justify-center bg-white p-2 select-none">
                                   {isLoadingQr ? (
                                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                             <FiLoader className="w-8 h-8 animate-spin text-[#E61E25]" />
                                             <span className="text-[9px] font-bold tracking-wider uppercase">Generating QR...</span>
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
                                        <>
                                             <div className="relative w-full h-full flex items-center justify-center bg-white">
                                                  {qrImage ? (
                                                       <img
                                                            src={qrImage}
                                                            alt="Payment QR Code"
                                                            className="w-[190px] h-[190px] max-w-full max-h-full object-contain select-none pointer-events-none"
                                                       />
                                                  ) : (
                                                       <QRCodeSVG
                                                            value={qrString || ''}
                                                            size={190}
                                                            className="w-full h-full max-w-full max-h-full object-contain"
                                                            level="H"
                                                            includeMargin={false}
                                                            imageSettings={{
                                                                 src: khqrLogoDataUrl,
                                                                 x: undefined,
                                                                 y: undefined,
                                                                 height: 32,
                                                                 width: 32,
                                                                 excavate: true
                                                            }}
                                                       />
                                                  )}
                                             </div>
                                             {/* Refresh button overlaid outside top-right */}
                                        </>
                                   ) : (
                                        <div className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">No QR Code</div>
                                   )}
                              </div>

                              {/* Time Expire */}
                              <p className="text-[10px] font-bold text-slate-900 mt-4 select-none">
                                   Time Expire : 3 minute
                              </p>
                         </div>
                    </div>

                    {/* Action buttons (Confirm Sandbox Payment, Pay in App) */}
                    <div className="w-full flex flex-col gap-2 px-1">
                         {abapayDeeplink && (
                              <a
                                   href={abapayDeeplink}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className={`w-full py-3 ${buttonBg} text-white rounded-[12px] text-xs font-bold uppercase tracking-wider text-center no-underline shadow-sm transition-all duration-200 flex items-center justify-center gap-2 border-none cursor-pointer active:scale-[0.98]`}
                              >
                                   <FiSmartphone className="w-4 h-4" />
                                   {payButtonText}
                              </a>
                         )}
                         <button
                              onClick={handleVerify}
                              disabled={isVerifying || isLoadingQr}
                              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-[12px] text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm focus:outline-none flex items-center justify-center gap-2 border-none disabled:opacity-50 active:scale-[0.98]">
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
          </div>,
          document.body
     );
};
