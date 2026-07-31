import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiRefreshCw, FiCheckCircle, FiCopy, FiExternalLink, FiLoader, FiShield, FiSmartphone } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from '@/pages/owner_manage/utils/toast';
import { client } from '@/api/client';

interface CustomKHQRProps {
     qrString: string | null;
     size?: number;
     currency?: string;
}

const CustomKHQR: React.FC<CustomKHQRProps> = ({ qrString, size = 192, currency = 'USD' }) => {
     if (!qrString) return null;
     return (
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
               <QRCodeSVG
                    value={qrString}
                    size={size}
                    level="H"
                    className="w-full h-full object-contain"
               />
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
     );
};

export interface AbaBankQrSandboxProps {
     isOpen?: boolean;
     onClose?: () => void;
     onSuccess?: (response?: any) => void;
     amount: number;
     currency?: 'USD' | 'KHR';
     merchantName?: string;
     orderId?: number | string | null;
     paywayLink?: string;
}

export const AbaBankQrSandbox: React.FC<AbaBankQrSandboxProps> = ({
     isOpen = true,
     onClose,
     onSuccess,
     amount,
     currency = 'USD',
     merchantName = 'Store Owner',
     orderId,
     paywayLink,
}) => {
     const [loading, setLoading] = useState<boolean>(false);
     const [verifying, setVerifying] = useState<boolean>(false);
     const [qrImage, setQrImage] = useState<string | null>(null);
     const [qrString, setQrString] = useState<string | null>(null);
     const [transactionId, setTransactionId] = useState<string | null>(null);
     const [deeplink, setDeeplink] = useState<string | null>(paywayLink || null);
     const [purchaseData, setPurchaseData] = useState<any>(null);
     const [purchaseUrl, setPurchaseUrl] = useState<string>('https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase');
     const [errorMessage, setErrorMessage] = useState<string | null>(null);
     const [isPaid, setIsPaid] = useState<boolean>(false);
     const [countdown, setCountdown] = useState<number>(1800); // 30 minutes

     const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

     // Format time MM:SS
     const formatTime = (seconds: number) => {
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
     };

     // Generate ABA Sandbox QR & Purchase Payload
     const fetchSandboxQr = async () => {
          setLoading(true);
          setErrorMessage(null);
          try {
               // 1. Fetch QR payload, image & deeplink
               const khqrRes = await client.post<any>('/payments/generate-qr', {
                    order_id: orderId ? Number(orderId) : null,
                    amount: amount,
                    currency: currency,
                    payment_method: 'aba',
               });

               if (khqrRes) {
                    if (khqrRes.qrImage) setQrImage(khqrRes.qrImage);
                    if (khqrRes.qrString) setQrString(khqrRes.qrString);

                    const extractedTranId = khqrRes.status?.tran_id || khqrRes.transaction_id || khqrRes.tran_id;
                    if (extractedTranId) setTransactionId(extractedTranId);

                    if (khqrRes.abapay_deeplink) setDeeplink(khqrRes.abapay_deeplink);
               }

               // 2. Fetch purchase payload for PayWay Portal form submission
               const res = await client.post<any>('/payments/aba/create-purchase', {
                    order_id: orderId ? Number(orderId) : null,
                    amount: amount,
                    currency: currency,
                    payment_option: 'abapay_khqr',
               });

               if (res && res.success && res.data) {
                    setPurchaseData(res.data);
                    if (res.purchase_url) {
                         setPurchaseUrl(res.purchase_url);
                    }
                    if (res.data.tran_id) {
                         setTransactionId(res.data.tran_id);
                    }
               }
          } catch (err: any) {
               console.error('[ABA Sandbox] Error generating QR:', err);
               setErrorMessage(err?.message || 'Failed to connect to ABA PayWay Sandbox server');
          } finally {
               setLoading(false);
          }
     };

     // Submit Form to Official ABA PayWay Checkout Page
     const handleOpenPaywayCheckout = () => {
          if (!purchaseData) {
               toast.error('ABA Purchase parameters not ready yet.');
               return;
          }
          try {
               const form = document.createElement('form');
               form.method = 'POST';
               form.action = purchaseUrl || 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';
               form.target = '_blank';

               Object.keys(purchaseData).forEach(key => {
                    if (purchaseData[key] !== undefined && purchaseData[key] !== null) {
                         const input = document.createElement('input');
                         input.type = 'hidden';
                         input.name = key;
                         input.value = String(purchaseData[key]);
                         form.appendChild(input);
                    }
               });

               document.body.appendChild(form);
               form.submit();
               document.body.removeChild(form);
               toast.info('Opened official ABA PayWay Sandbox Portal! This transaction is now logged in merchant dashboard.');
          } catch (e: any) {
               toast.error('Failed to submit form to ABA PayWay Portal');
          }
     };

     // Initial load
     useEffect(() => {
          if (isOpen) {
               fetchSandboxQr();
               setCountdown(1800);
          }
          return () => {
               if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          };
     }, [isOpen, orderId, amount, currency]);

     // Countdown Timer
     useEffect(() => {
          if (!isOpen || isPaid || countdown <= 0) return;
          const timer = setInterval(() => {
               setCountdown(prev => prev - 1);
          }, 1000);
          return () => clearInterval(timer);
     }, [isOpen, isPaid, countdown]);

     // Auto-check Payment Status (Polling every 4 seconds)
     useEffect(() => {
          if (!isOpen || !transactionId || isPaid) return;

          const checkStatus = async () => {
               try {
                    const res = await client.post<any>('/payments/check-transaction', {
                         transaction_id: transactionId,
                    });

                    if (res && (res.paid || res.payment_status === 'Paid' || res.status === 'Paid')) {
                         setIsPaid(true);
                         toast.success('ABA Payment verified successfully!');
                         if (onSuccess) onSuccess(res);
                    }
               } catch (e) {
                    // Silent check error during polling
               }
          };

          pollingTimerRef.current = setInterval(checkStatus, 4000);
          return () => {
               if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          };
     }, [isOpen, transactionId, isPaid]);

     // Manual Verify Payment Button
     const handleManualVerify = async () => {
          if (!transactionId) {
               toast.error('Transaction ID missing');
               return;
          }
          setVerifying(true);
          try {
               const res = await client.post<any>('/payments/check-transaction', {
                    transaction_id: transactionId,
                    confirm: true,
               });

               if (res && (res.paid || res.payment_status === 'Paid' || res.success)) {
                    setIsPaid(true);
                    toast.success('ABA Payment confirmed!');
                    if (onSuccess) onSuccess(res);
               } else {
                    toast.info(res?.message || 'Payment not detected yet. Please scan & pay on ABA App.');
               }
          } catch (err: any) {
               toast.error('Error verifying transaction');
          } finally {
               setVerifying(false);
          }
     };

     // Copy QR string payload
     const handleCopyPayload = () => {
          if (qrString || transactionId) {
               navigator.clipboard.writeText(qrString || transactionId || '');
               toast.success('Payment Payload copied to clipboard!');
          }
     };

     // Handle ABA Mobile Deeplink click
     const handleOpenAbamobile = (e: React.MouseEvent) => {
          if (!deeplink) return;
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          if (!isMobile) {
               toast.info('ABA Mobile App deeplink (`abamobilebank://`) works on smartphones. On PC, please scan the KHQR code using your ABA App!');
          }
     };

     if (!isOpen) return null;

                         const modalContent = (
          <div className="fixed inset-0 z-[99999] bg-[#081B37]/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 select-none animate-fade-in font-kuntomruy">
               
               {/* ABA PAYWAY Floating Header Logo (Top Right Aligned) */}
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
                    <div className="px-6 pt-5 pb-4 flex items-center justify-between bg-white">
                         <h2 className="text-sm font-black text-stone-900 tracking-tight">ABA KHQR</h2>
                         {onClose && (
                              <button 
                                   onClick={onClose}
                                   className="text-[#0BBCD4] hover:text-[#0999ac] transition-colors p-1 border-none bg-transparent cursor-pointer flex items-center justify-center"
                              >
                                   <FiX className="w-5 h-5 stroke-[2.5]" />
                              </button>
                         )}
                    </div>

                    {/* Inner Ticket Card & Footer Area */}
                    <div className="px-5 pb-6">
                         {/* Ticket Card Box */}
                         <div className="w-full bg-white rounded-3xl border border-stone-200/80 shadow-md overflow-hidden flex flex-col items-center relative">
                              {isPaid ? (
                                   <div className="py-14 flex flex-col items-center justify-center text-emerald-600 gap-2">
                                        <FiCheckCircle className="w-14 h-14" />
                                        <span className="text-sm font-black">Payment Complete!</span>
                                   </div>
                              ) : errorMessage ? (
                                   <div className="py-12 flex flex-col items-center justify-center text-center p-4 text-red-500 gap-2">
                                        <span className="text-3xl">⚠️</span>
                                        <span className="text-xs font-bold leading-tight">{errorMessage}</span>
                                        <button
                                             onClick={fetchSandboxQr}
                                             className="mt-2 text-xs font-bold uppercase tracking-wider text-blue-600 underline border-none bg-transparent cursor-pointer"
                                        >Retry</button>
                                   </div>
                              ) : (
                                   <div className="w-full flex flex-col items-center">
                                        {/* Red KHQR Header Banner (#E21A1A with exact notch cut) */}
                                        <div className="w-full h-14 bg-white rounded-t-3xl relative flex items-center justify-center text-white select-none overflow-hidden">
                                             <div 
                                                  className="absolute inset-0 bg-[#E21A1A]"
                                                  style={{
                                                       clipPath: 'polygon(0 0, 100% 0, 100% 100%, 85% 68%, 0 68%)'
                                                  }}
                                             />
                                             <div className="relative z-10 flex items-center justify-center pb-3">
                                                  <svg viewBox="13.4 3.95 6.3 1.6" className="h-4 sm:h-4 w-auto drop-shadow-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                       <path d="M17.435 4.55882V5.03676H16.9654C16.9184 5.03676 16.8832 5.00091 16.8832 4.95312V4.55882C16.8832 4.51103 16.9184 4.47518 16.9654 4.47518H17.3411C17.3998 4.46324 17.435 4.51103 17.435 4.55882Z" fill="white"/>
                                                       <path d="M13.7104 4.6662L14.3677 3.99725H14.6841L13.98 4.71405L14.7202 5.50311H14.3911L13.7104 4.79803V5.50311H13.4399V3.99725H13.7104V4.6662ZM15.2007 4.63007H15.9526V3.99725H16.2104V5.50311H15.9526V4.84589H15.2007V5.50311H14.9312V3.99725H15.2007V4.63007ZM18.9351 3.99725C19.3459 3.9973 19.6743 4.33203 19.6743 4.75018H19.4399C19.4399 4.46346 19.2168 4.23656 18.9351 4.23651C18.712 4.23651 18.5241 4.37984 18.4536 4.59491C18.442 4.64267 18.4302 4.70247 18.4302 4.75018V5.50311H18.4185C18.2893 5.50311 18.1948 5.39506 18.1948 5.27557V4.75018C18.1948 4.54706 18.2775 4.34376 18.4302 4.20038C18.5711 4.06896 18.7472 3.99725 18.9351 3.99725ZM19.6743 5.50311H19.3462L19.2632 5.41913L19.0874 5.41913L18.8413 4.98846H19.1694L19.6743 5.50311ZM17.7378 3.99725C17.8549 3.9975 17.9602 4.09277 17.9604 4.22382V5.34784L17.7261 5.10858V4.39178C17.7261 4.30814 17.655 4.23651 17.5728 4.23651H16.8687C16.7865 4.23651 16.7163 4.30814 16.7163 4.39178V5.10858C16.7164 5.19215 16.7865 5.26385 16.8687 5.26385H17.5728L17.8081 5.49042H16.7163C16.5989 5.49042 16.4927 5.39523 16.4927 5.26385V4.22382C16.4929 4.1045 16.5873 3.99725 16.7163 3.99725H17.7378Z" fill="white"/>
                                                  </svg>
                                             </div>
                                        </div>

                                        {/* Merchant Name & Amount (Left Aligned) */}
                                        <div className="w-full text-left px-6 pt-4 pb-1">
                                             <p className="text-[11px] font-bold text-stone-600 uppercase tracking-wider truncate max-w-full">
                                                  {merchantName}
                                             </p>
                                             <div className="flex items-baseline justify-start gap-1 mt-1">
                                                  <span className="text-2xl font-black text-stone-900 tracking-tight leading-none">
                                                       $ {currency === 'USD' ? amount.toFixed(2) : new Intl.NumberFormat('km-KH').format(Math.round(amount * 4100))}
                                                  </span>
                                             </div>
                                        </div>

                                        {/* Dashed Separator Line */}
                                        <div className="w-full border-t border-dashed border-stone-300/80 my-4" />

                                        {/* QR Code Container with Black Badge */}
                                        <div className="relative w-52 h-52 mb-6 flex items-center justify-center bg-white p-2 select-none">
                                             {loading ? (
                                                  <div className="flex flex-col items-center justify-center text-stone-400 gap-2">
                                                       <FiLoader className="w-7 h-7 animate-spin text-stone-600" />
                                                       <span className="text-[10px] font-bold tracking-wider uppercase">Generating...</span>
                                                  </div>
                                             ) : qrString ? (
                                                  <CustomKHQR
                                                       qrString={qrString}
                                                       size={192}
                                                       currency={currency}
                                                  />
                                             ) : (
                                                  <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                                                       <img
                                                            src={qrImage || ''}
                                                            alt="ABA KHQR"
                                                            className="w-full h-auto object-contain pointer-events-none"
                                                            style={{
                                                                 clipPath: 'inset(38% 5% 12% 5%)',
                                                                 transform: 'scale(1.5)',
                                                            }}
                                                       />
                                                  </div>
                                             )}
                                        </div>
                                   </div>
                              )}
                         </div>

                         {/* Bottom Footer Info Outside Card */}
                         <div className="w-full pt-4 pb-1 text-center">
                              <p className="text-[11px] font-medium text-stone-500 leading-relaxed">
                                   Scan with Bakong App or Mobile Banking app<br />that support KHQR
                              </p>
                         </div>

                         {/* Sandbox Verification (DEV only) */}
                         {import.meta.env.DEV && !isPaid && (
                              <div className="mt-3 text-center">
                                   <button
                                        onClick={handleManualVerify}
                                        disabled={verifying || loading}
                                        className="text-[11px] font-bold text-stone-400 hover:text-stone-900 underline border-none bg-transparent cursor-pointer transition-colors disabled:opacity-50"
                                   >
                                        {verifying ? 'Verifying Sandbox Payment...' : '✓ Confirm Sandbox Payment'}
                                   </button>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );

     return createPortal(modalContent, document.body);
};

export default AbaBankQrSandbox;
