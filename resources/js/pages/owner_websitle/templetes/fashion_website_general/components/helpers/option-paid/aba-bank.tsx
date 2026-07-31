import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiRefreshCw, FiCheckCircle, FiCopy, FiExternalLink, FiLoader, FiShield, FiSmartphone } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { client } from '@/api/client';

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

     const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-kuntomruy">
               <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200">

                    {/* Top ABA Header Bar */}
                    <div className="bg-[#005D7E] text-white px-6 py-4 flex items-center justify-between">
                         <div className="flex items-center space-x-3">
                              <img
                                   src="/assets/payment_enable/bakong-bank.svg"
                                   alt="ABA Bank"
                                   className="w-8 h-8 rounded-lg bg-white p-0.5 object-contain"
                              />
                              <div>
                                   <div className="flex items-center space-x-2">
                                        <h3 className="font-extrabold text-base tracking-tight">ABA Bank PayWay</h3>
                                        <span className="bg-[#E61E25] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                                             SANDBOX
                                        </span>
                                   </div>
                                   <p className="text-[11px] text-cyan-100 font-medium">Scan KHQR or Pay via ABA App</p>
                              </div>
                         </div>
                         {onClose && (
                              <button
                                   onClick={onClose}
                                   className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
                              >
                                   <FiX className="w-5 h-5" />
                              </button>
                         )}
                    </div>

                    {/* Body Content */}
                    <div className="p-6 space-y-5 text-center">

                         {/* Merchant & Amount Information */}
                         <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 space-y-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                                   Merchant ID: <strong className="text-stone-800 font-mono">ec477316</strong> ({merchantName})
                              </span>
                              <div className="text-2xl font-black text-stone-900 tracking-tight">
                                   {currency === 'KHR' ? `${amount.toLocaleString()} KHR` : `$${amount.toFixed(2)} USD`}
                              </div>
                              {transactionId && (
                                   <span className="text-[10px] text-stone-400 font-medium block font-mono">
                                        Tran ID: {transactionId}
                                   </span>
                              )}
                         </div>

                         {/* QR Code Section */}
                         <div className="flex flex-col items-center justify-center space-y-3">
                              {loading ? (
                                   <div className="w-56 h-56 rounded-2xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center space-y-3">
                                        <FiLoader className="w-8 h-8 text-[#005D7E] animate-spin" />
                                        <span className="text-xs font-bold text-stone-500">Generating ABA KHQR...</span>
                                   </div>
                              ) : isPaid ? (
                                   <div className="w-56 h-56 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center space-y-2 text-emerald-600 animate-scale-up">
                                        <FiCheckCircle className="w-16 h-16" />
                                        <span className="text-sm font-extrabold">Payment Complete!</span>
                                        <span className="text-[11px] text-emerald-700 font-medium">Recorded in ABA Sandbox Dashboard</span>
                                   </div>
                              ) : qrImage ? (
                                   <div className="relative p-3 bg-white border-2 border-[#005D7E]/20 rounded-2xl shadow-md group">
                                        <img
                                             src={qrImage}
                                             alt="ABA Sandbox KHQR Code"
                                             className="w-52 h-52 object-contain rounded-lg"
                                        />
                                        <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-bold text-stone-500">
                                             <span className="flex items-center gap-1 text-[#005D7E]">
                                                  <FiShield className="w-3.5 h-3.5" /> KHQR Valid
                                             </span>
                                             <span className="font-mono text-stone-700 font-bold">{formatTime(countdown)}</span>
                                        </div>
                                   </div>
                              ) : (
                                   <div className="w-56 h-56 rounded-2xl bg-stone-50 border border-dashed border-stone-300 flex flex-col items-center justify-center p-4 text-center space-y-2">
                                        <p className="text-xs font-bold text-stone-500">{errorMessage || 'Unable to display QR code'}</p>
                                        <button
                                             onClick={fetchSandboxQr}
                                             className="px-3 py-1.5 bg-[#005D7E] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer border-none"
                                        >
                                             <FiRefreshCw className="w-3.5 h-3.5" /> Retry
                                        </button>
                                   </div>
                              )}
                         </div>

                         {/* Action Buttons */}
                         {!isPaid && (
                              <div className="space-y-2.5 pt-1">
                                   {/* Official PayWay Form Submission Button */}
                                   <button
                                        type="button"
                                        onClick={handleOpenPaywayCheckout}
                                        disabled={!purchaseData}
                                        className="w-full py-3 bg-[#E61E25] hover:bg-[#c4151b] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-none disabled:opacity-50"
                                   >
                                        <FiExternalLink className="w-4 h-4" />
                                        <span>Open Official PayWay Portal</span>
                                   </button>

                                   {deeplink && (
                                        <a
                                             href={deeplink}
                                             onClick={handleOpenAbamobile}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="w-full py-2.5 bg-[#005D7E] hover:bg-[#004a65] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer no-underline"
                                        >
                                             <FiSmartphone className="w-4 h-4" />
                                             <span>Pay via ABA Mobile App</span>
                                        </a>
                                   )}

                                   <div className="grid grid-cols-2 gap-2">
                                        <button
                                             type="button"
                                             onClick={handleManualVerify}
                                             disabled={verifying || loading}
                                             className="py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none disabled:opacity-50"
                                        >
                                             {verifying ? (
                                                  <>
                                                       <FiLoader className="w-3.5 h-3.5 animate-spin" />
                                                       <span>Checking...</span>
                                                  </>
                                             ) : (
                                                  <>
                                                       <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                       <span>I Have Paid</span>
                                                  </>
                                             )}
                                        </button>

                                        <button
                                             type="button"
                                             onClick={handleCopyPayload}
                                             className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-stone-200"
                                        >
                                             <FiCopy className="w-3.5 h-3.5 text-stone-500" />
                                             <span>Copy Code</span>
                                        </button>
                                   </div>
                              </div>
                         )}

                         {/* Footer Disclaimer */}
                         <div className="text-[10px] text-stone-400 pt-2 border-t border-stone-100 flex items-center justify-center gap-1 font-medium">
                              <FiShield className="w-3 h-3 text-cyan-600" />
                              <span>ABA PayWay Sandbox Merchant ID: ec477316</span>
                         </div>
                    </div>
               </div>
          </div>
     );

     return createPortal(modalContent, document.body);
};

export default AbaBankQrSandbox;
