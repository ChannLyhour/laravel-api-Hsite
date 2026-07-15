import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiPrinter, FiX } from 'react-icons/fi';
import type { Order } from '@/pages/owner_manage/components/order/show';
import { TextSp } from '../../../helpers/TextSp';
import { adminSettingApi } from '@/api/admin/setting';
import { storesService } from '@/api/owner/stores';
import { resolveImageUrl } from '@/api/imageUtils';
import { useTranslation } from '../../../../utils/translate';

interface ReceiptProps {
     isOpen: boolean;
     onClose: () => void;
     order: Order | null;
     locale?: string;
}

interface StoreDetails {
     name: string;
     phone: string;
     address: string;
     email: string;
     logoUrl?: string | null;
}

export const Receipt: React.FC<ReceiptProps> = ({ isOpen, onClose, order, locale = 'en' }) => {
     const { t } = useTranslation(locale);
     const [platformName, setPlatformName] = useState<string>('BiteFlow');
     const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null);

     // Prevent scroll on body when open
     useEffect(() => {
          if (isOpen && order) {
               document.body.style.overflow = 'hidden';
          } else {
               document.body.style.overflow = '';
          }
          return () => {
               document.body.style.overflow = '';
          };
     }, [isOpen, order]);

     // Fetch platform settings for branding name
     useEffect(() => {
          if (isOpen && order) {
               adminSettingApi.getSettings()
                    .then((settings) => {
                         if (settings && settings.platform_name) {
                              setPlatformName(settings.platform_name);
                         }
                    })
                    .catch((err) => {
                         console.warn('Failed to load platform settings for receipt branding:', err);
                    });
          }
     }, [isOpen, order]);

     // Fetch store details for receipt header
     useEffect(() => {
          if (isOpen && order) {
               if (order.storeId) {
                    storesService.getStore(Number(order.storeId))
                         .then((sData) => {
                              if (sData) {
                                   setStoreDetails({
                                        name: sData.store_name || order.store || '---',
                                        phone: sData.store_phone || order.storePhone || '---',
                                        address: sData.store_address || order.storeAddress || '---',
                                        email: sData.store_email || '---',
                                        logoUrl: sData.logo_url ? resolveImageUrl(sData.logo_url) : null
                                   });
                              } else {
                                   setStoreDetails({
                                        name: order.store || '---',
                                        phone: order.storePhone || '---',
                                        address: order.storeAddress || '---',
                                        email: '---',
                                        logoUrl: null
                                   });
                              }
                         })
                         .catch((err) => {
                              setStoreDetails({
                                   name: order.store || '---',
                                   phone: order.storePhone || '---',
                                   address: order.storeAddress || '---',
                                   email: '---',
                                   logoUrl: null
                              });
                         });
               } else {
                    setStoreDetails({
                         name: order.store || '---',
                         phone: order.storePhone || '---',
                         address: order.storeAddress || '---',
                         email: '---',
                         logoUrl: null
                    });
               }
          }
     }, [isOpen, order]);

     if (!isOpen || !order) return null;
     if (typeof document === 'undefined') return null;

     // Extract & calculate fields from order model
     const orderId = order.order_no || order.id;
     const customer = order.customerName || order.customer_name || order.customer || '---';
     const paymentMethod = order.paymentMethod || '---';

     const notesStr = order.notes || '';
     const deliveryMatch = notesStr.match(/^\[Delivery:\s*([^\]]+)\]/);
     const deliveryMethod = deliveryMatch ? deliveryMatch[1] : null;

     const formatDate = (timeStr?: string): string => {
          if (!timeStr) return '';
          try {
               const d = new Date(timeStr);
               if (isNaN(d.getTime())) return timeStr;
               return new Intl.DateTimeFormat('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: 'numeric', minute: '2-digit'
               }).format(d);
          } catch {
               return timeStr;
          }
     };
     const date = formatDate(order.time || order.created_at);

     const items = (order.items || []).map(item => ({
          id: item.id,
          name: item.name,
          quantity: Number(item.qty || item.quantity || 1),
          price: Number(item.price)
     }));

     const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
     const couponDiscount = Number(order.discountAmount || 0);
     const shippingFee = Number(order.shippingFee || 0);
     const taxPercentage = order.taxPercentage !== undefined ? Number(order.taxPercentage) : 0;
     const tax = Number(order.tax || 0);
     const total = Number(order.total);

     return createPortal(
          <div id="print-modal-container" className="fixed inset-0 z-[9999] bg-white overflow-y-auto select-none animate-fade-in">
               <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                         @page {
                              size: auto;
                              margin: 0mm;
                         }
                         body > *:not(#print-modal-container) {
                              display: none !important;
                         }
                         .no-print {
                              display: none !important;
                         }
                         #print-modal-container {
                              position: absolute !important;
                              left: 0 !important;
                              top: 0 !important;
                              width: 100% !important;
                              height: auto !important;
                              background: transparent !important;
                              padding: 0 !important;
                              margin: 0 !important;
                              overflow: visible !important;
                         }
                         #print-modal-container > div {
                              padding: 0 !important;
                              margin: 0 !important;
                              max-width: 100% !important;
                         }
                         .print-no-border {
                              border: none !important;
                              box-shadow: none !important;
                              background: transparent !important;
                              max-width: 100% !important;
                         }
                         #printable-receipt, #printable-receipt * {
                              visibility: visible;
                         }
                         #printable-receipt {
                              position: absolute;
                              left: 0;
                              top: 0;
                              width: 100%;
                              max-height: none !important;
                              overflow: visible !important;
                              padding: 24px !important;
                              box-sizing: border-box;
                              background: white !important;
                         }
                    }
               `}} />

               {/* Header Bar matching image_detail_product.tsx */}
               <div className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-6 py-4 no-print">
                    <TextSp
                         as="span"
                         weight="black"
                         color="text-stone-950"
                         uppercase
                         tracking="widest"
                         className="font-kontomruy text-[10px] sm:text-xs"
                    >
                         {`${t('invoice.title') || 'Invoice'} #${orderId}`}
                    </TextSp>
                    <button
                         onClick={onClose}
                         className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer focus:outline-none"
                         aria-label={t('invoice.close') || 'Close invoice'}
                    >
                         <FiX className="w-5 h-5" />
                    </button>
               </div>

               {/* Main Content Area matching image_detail_product.tsx */}
               <div className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center gap-8">
                    {/* Printable Receipt Block */}
                    <div className="w-full max-w-md bg-stone-50 rounded-lg overflow-hidden flex flex-col border border-stone-100 shadow-3xs print-no-border">
                         <div id="printable-receipt" className="p-5 flex-1 space-y-4 text-stone-700 font-mono text-[11px] leading-tight bg-white">

                              {/* 2-Column Store Brand Header */}
                              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-dashed border-stone-200">
                                   {/* Col 1: Logo & Name */}
                                   <div className="flex flex-col items-start gap-2 text-left">
                                        {storeDetails?.logoUrl ? (
                                             <img
                                                  src={storeDetails.logoUrl}
                                                  alt={storeDetails.name}
                                                  className="w-12 h-12 object-contain rounded-md"
                                             />
                                        ) : (
                                             <div className="w-12 h-12 bg-stone-50 rounded-md flex items-center justify-center text-stone-400 font-bold text-[9px] border border-stone-200">
                                                  LOGO
                                             </div>
                                        )}
                                        <h2 className="text-xs font-black tracking-tight text-stone-900 uppercase">
                                             {storeDetails?.name || 'VH OUTLET'}
                                        </h2>
                                   </div>

                                   {/* Col 2: Contacts */}
                                   <div className="flex flex-col items-end justify-end text-right space-y-1 text-[9px] text-stone-500 font-bold">
                                        <div className="text-[10px] font-black text-stone-800 uppercase tracking-wider mb-1">{t('invoice.contactInfo') || 'Contact Info'}</div>
                                        <div>{t('invoice.phone') || 'Phone'}: {storeDetails?.phone || '---'}</div>
                                        <div>{t('invoice.email') || 'Email'}: {storeDetails?.email || '---'}</div>
                                        <div className="max-w-[160px] leading-snug break-words">
                                             {t('invoice.address') || 'Address'}: {storeDetails?.address || '---'}
                                        </div>
                                   </div>
                              </div>

                              <div className="pt-2 space-y-1 text-stone-500 font-bold">
                                   <div className="flex justify-between">
                                        <span>{t('invoice.invoiceNo') || 'INVOICE'}:</span>
                                        <span className="text-stone-800">{orderId}</span>
                                   </div>
                                   <div className="flex justify-between">
                                        <span>{t('invoice.customer') || 'CUSTOMER'}:</span>
                                        <span className="text-stone-800">{customer}</span>
                                   </div>
                                   <div className="flex justify-between">
                                        <span>{t('invoice.payMethod') || 'PAY METHOD'}:</span>
                                        <span className="text-stone-800 uppercase">{paymentMethod}</span>
                                   </div>
                                   {deliveryMethod && (
                                        <div className="flex justify-between">
                                             <span>{t('invoice.deliveryMethod') || 'DELIVERY METHOD'}:</span>
                                             <span className="text-stone-800 uppercase">{deliveryMethod}</span>
                                        </div>
                                   )}
                                   <div className="flex justify-between">
                                        <span>{t('invoice.dateTime') || 'DATE/TIME'}:</span>
                                        <span className="text-stone-800">{date}</span>
                                   </div>
                              </div>

                              {/* Items Table */}
                              <div className="border-t border-b border-dashed border-stone-200 py-3 space-y-2">
                                   <div className="flex justify-between text-stone-800 font-black">
                                        <span>{t('invoice.item') || 'ITEM'}</span>
                                        <span className="w-16 text-right">{t('invoice.price') || 'PRICE'}</span>
                                   </div>
                                   {items.map((item) => (
                                        <div key={item.id} className="flex justify-between text-stone-600 font-semibold">
                                             <span>{item.name} (x{item.quantity})</span>
                                             <span className="w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                   ))}
                              </div>

                              {/* Totals */}
                              <div className="space-y-1 pt-1 font-bold text-stone-500">
                                   <div className="flex justify-between">
                                        <span>{t('invoice.subtotal') || 'SUBTOTAL'}:</span>
                                        <span className="text-stone-800">${subtotal.toFixed(2)}</span>
                                   </div>
                                   {couponDiscount > 0 && (
                                        <div className="flex justify-between">
                                             <span>{t('invoice.couponDiscount') || 'COUPON DISCOUNT'}:</span>
                                             <span className="text-stone-800">-${couponDiscount.toFixed(2)}</span>
                                        </div>
                                   )}
                                   {shippingFee > 0 && (
                                        <div className="flex justify-between">
                                             <span>{t('invoice.shipping') || 'SHIPPING'}:</span>
                                             <span className="text-stone-800">${shippingFee.toFixed(2)}</span>
                                        </div>
                                   )}
                                   {tax > 0 && (
                                        <div className="flex justify-between">
                                             <span>{t('invoice.vatTax') || 'VAT TAX'} ({taxPercentage}%):</span>
                                             <span className="text-stone-800">${tax.toFixed(2)}</span>
                                        </div>
                                   )}
                                   <div className="flex justify-between text-stone-800 font-black text-sm pt-2 border-t border-stone-100">
                                        <span>{t('invoice.totalAmount') || 'TOTAL AMOUNT'}:</span>
                                        <span className="text-primary">${total.toFixed(2)}</span>
                                   </div>
                              </div>

                              <div className="text-center text-stone-400 text-[10px] pt-4 leading-relaxed font-semibold">
                                   {t('invoice.thankYou') || 'Thank you for ordering with us!'}<br />
                                   {t('invoice.poweredBy') || 'Software powered by'} {platformName}.
                              </div>

                         </div>
                    </div>

                    {/* Minimal Actions (Pill Style) */}
                    <div className="flex items-center gap-3 w-full max-w-md no-print">
                         <button
                              onClick={() => { window.print(); }}
                              className="flex-1 flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 duration-100"
                         >
                              <FiPrinter className="w-4 h-4" />
                              <span>{t('invoice.downloadReceipt') || 'Download Receipt'}</span>
                         </button>
                         <button
                              onClick={onClose}
                              className="flex-1 flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-600 py-3 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 duration-100"
                         >
                              <span>{t('invoice.close') || 'Close'}</span>
                         </button>
                    </div>
               </div>
          </div>,
          document.body
     );
};
