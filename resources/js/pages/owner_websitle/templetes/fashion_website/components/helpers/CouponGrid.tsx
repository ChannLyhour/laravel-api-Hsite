import React, { useState } from 'react';
import { FiGift, FiCopy, FiCheck } from 'react-icons/fi';
import { toast } from '../../utils/toast';
import type { CouponRow } from '@/api/owner/coupons';

const KHMER_MONTHS = [
     'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
     'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

const formatDate = (dateStr: string, isKhmer: boolean) => {
     const d = new Date(dateStr);
     if (isNaN(d.getTime())) return dateStr;
     if (isKhmer) {
          const day = d.getDate();
          const month = KHMER_MONTHS[d.getMonth()];
          const year = d.getFullYear();
          return `${day} ខែ${month} ${year}`;
     }
     return d.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
     });
};

interface CouponGridProps {
     coupons: CouponRow[];
     locale?: 'en' | 'km';
}

export const CouponGrid: React.FC<CouponGridProps> = ({ coupons, locale = 'en' }) => {
     const [copiedCode, setCopiedCode] = useState<string | null>(null);

     const isKhmer = locale === 'km';
     const t = {
          title: isKhmer ? 'ប័ណ្ណចំណាយ និងការផ្តល់ជូនពិសេស' : 'Exclusive Coupons & Offers',
          subtitle: isKhmer ? 'ចម្លងកូដបញ្ចុះតម្លៃខាងក្រោម ដើម្បីទទួលបានការបញ្ចុះតម្លៃបន្ថែម' : 'Copy code and apply at checkout to save on your runway order.',
          minPurchase: isKhmer ? 'ការចំណាយតិចបំផុត' : 'Min. spend',
          validUntil: isKhmer ? 'សុពលភាពដល់' : 'Expires',
          copy: isKhmer ? 'ចម្លងកូដ' : 'Copy',
          copied: isKhmer ? 'បានចម្លង!' : 'Copied!',
          toastSuccess: isKhmer ? 'បានចម្លងកូដបញ្ចុះតម្លៃជោគជ័យ!' : 'Coupon code copied to clipboard!',
          freeDelivery: isKhmer ? 'ដឹកជញ្ជូនឥតគិតថ្លៃ' : 'Free Delivery',
     };

     const handleCopy = (code: string) => {
          navigator.clipboard.writeText(code);
          setCopiedCode(code);
          toast.success(t.toastSuccess, {
               style: {
                    background: '#1c1c1c',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRadius: '2px',
               },
               iconTheme: {
                    primary: '#E61E25',
                    secondary: '#ffffff',
               },
          });
          setTimeout(() => setCopiedCode(null), 2500);
     };

     if (!coupons || coupons.length === 0) return null;

     return (
          <div className="w-full text-left py-4 border-b border-stone-200/40 font-sans">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-2">
                    <div className="space-y-1">
                         <h2 className="text-lg sm:text-xl font-black text-stone-900 uppercase tracking-tight flex items-center gap-2 select-none">
                              <FiGift className="text-[#E61E25] w-5 h-5" />
                              {t.title}
                         </h2>
                         <p className="text-stone-400 text-2xs font-semibold uppercase tracking-wider leading-normal">
                              {t.subtitle}
                         </p>
                    </div>
               </div>

               {/* ── Mobile: horizontal scroll of ticket cards ── */}
               <div
                    className="flex sm:hidden gap-3.5 overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
               >
                    {coupons.map((coupon) => {
                         const discountValue = coupon.discount_type === 'percentage'
                              ? `${parseFloat(String(coupon.discount_amount))}%`
                              : `$${parseFloat(String(coupon.discount_amount))}`;
                         const isCopied = copiedCode === coupon.code;
                         const formattedExpireDate = formatDate(coupon.expire_date, isKhmer);

                         return (
                              <div
                                   key={coupon.id}
                                   className="group shrink-0 w-[275px] h-[105px] bg-white border border-stone-200/60 rounded-lg shadow-3xs overflow-hidden flex relative"
                              >
                                   {/* Left Stub — Discount Badge */}
                                   <div className="w-[32%] shrink-0 bg-[#E61E25] text-white flex flex-col items-center justify-center p-2 relative select-none">
                                        <span className="text-base font-black leading-none font-mono tracking-tight text-center">
                                             {discountValue}
                                        </span>
                                        <span className="text-[7px] font-black text-white/80 uppercase tracking-widest mt-1 text-center">
                                             {coupon.coupon_type === 'free_delivery' ? 'FREE SHIP' : 'OFF'}
                                        </span>
                                        <div className="absolute -bottom-1 -right-1 opacity-10 pointer-events-none">
                                             <FiGift className="w-9 h-9" />
                                        </div>
                                   </div>

                                   {/* Ticket Notches */}
                                   <div className="absolute top-0 left-[32%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-stone-200/60 z-10" />
                                   <div className="absolute bottom-0 left-[32%] -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white rounded-full border border-stone-200/60 z-10" />

                                   {/* Dashed Line */}
                                   <div className="absolute top-2 bottom-2 left-[32%] -translate-x-1/2 border-l border-dashed border-stone-200 z-5" />

                                   {/* Right Section — Info */}
                                   <div className="flex-grow p-3 flex flex-col justify-between min-w-0">
                                        <div className="space-y-1">
                                             <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-wide leading-tight truncate">
                                                  {coupon.title || (coupon.coupon_type === 'free_delivery' ? t.freeDelivery : 'Runway Offer')}
                                             </h3>
                                             <div className="inline-flex items-center gap-1 bg-stone-50 border border-stone-200/50 rounded px-1.5 py-0.5 max-w-full">
                                                  <span className="text-[8px] font-mono font-black text-stone-700 tracking-wider truncate uppercase">
                                                       {coupon.code}
                                                  </span>
                                             </div>
                                        </div>

                                        <div className="flex items-end justify-between gap-1.5 pt-1.5 border-t border-stone-100">
                                             <div className="min-w-0">
                                                  <p className="text-[7.5px] text-stone-400 font-bold uppercase tracking-tight leading-none truncate">
                                                       {t.minPurchase}: ${parseFloat(String(coupon.minimum_purchase || 0)).toFixed(0)}
                                                  </p>
                                                  <p className="text-[7.5px] text-stone-400 font-bold uppercase tracking-tight leading-none mt-1 truncate">
                                                       {t.validUntil} {formattedExpireDate}
                                                  </p>
                                             </div>

                                             <button
                                                  onClick={() => handleCopy(coupon.code)}
                                                  className={`px-2 py-0.5 rounded-[3px] text-[8px] font-black uppercase tracking-wider cursor-pointer border transition-all duration-200 flex items-center justify-center gap-1 shrink-0 ${isCopied
                                                       ? 'bg-stone-900 text-white border-stone-900'
                                                       : 'bg-white hover:bg-stone-900 hover:text-white text-stone-900 border-stone-900/40 hover:border-stone-900'
                                                       }`}
                                             >
                                                  {isCopied ? <FiCheck className="w-2 h-2" /> : <FiCopy className="w-2 h-2" />}
                                                  <span>{isCopied ? t.copied : t.copy}</span>
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         );
                    })}
               </div>

               {/* ── Desktop: Compact Ticket Card Grid ── */}
               <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {coupons.map((coupon) => {
                         const discountValue = coupon.discount_type === 'percentage'
                              ? `${parseFloat(String(coupon.discount_amount))}%`
                              : `$${parseFloat(String(coupon.discount_amount))}`;
                         const isCopied = copiedCode === coupon.code;
                         const formattedExpireDate = formatDate(coupon.expire_date, isKhmer);

                         return (
                              <div
                                   key={coupon.id}
                                   className="group relative bg-white border border-stone-200/60 rounded-lg shadow-3xs overflow-hidden flex h-[105px] hover:shadow-md hover:border-stone-300 transition-all duration-300"
                              >
                                   {/* Left Stub — Discount Badge */}
                                   <div className="w-[32%] shrink-0 bg-[#E61E25] text-white flex flex-col items-center justify-center p-2.5 relative select-none">
                                        <span className="text-lg font-black leading-none font-mono tracking-tight text-center">
                                             {discountValue}
                                        </span>
                                        <span className="text-[7.5px] font-black text-white/80 uppercase tracking-widest mt-1 text-center">
                                             {coupon.coupon_type === 'free_delivery' ? 'FREE SHIP' : 'OFF'}
                                        </span>
                                        <div className="absolute -bottom-1 -right-1 opacity-10 pointer-events-none">
                                             <FiGift className="w-10 h-10" />
                                        </div>
                                   </div>

                                   {/* Ticket Notches */}
                                   <div className="absolute top-0 left-[32%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-stone-200/60 z-10" />
                                   <div className="absolute bottom-0 left-[32%] -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white rounded-full border border-stone-200/60 z-10" />

                                   {/* Dashed Line */}
                                   <div className="absolute top-2 bottom-2 left-[32%] -translate-x-1/2 border-l border-dashed border-stone-200 z-5" />

                                   {/* Right Section — Info */}
                                   <div className="flex-grow p-3.5 flex flex-col justify-between min-w-0">
                                        <div className="space-y-1">
                                             <h3 className="text-xs font-black text-stone-900 uppercase tracking-wide leading-tight truncate">
                                                  {coupon.title || (coupon.coupon_type === 'free_delivery' ? t.freeDelivery : 'Runway Offer')}
                                             </h3>
                                             <div className="inline-flex items-center gap-1 bg-stone-50 border border-stone-200/50 rounded px-2 py-0.5 max-w-full">
                                                  <span className="text-[9px] font-mono font-black text-stone-750 tracking-wider truncate uppercase">
                                                       {coupon.code}
                                                  </span>
                                             </div>
                                        </div>

                                        <div className="flex items-end justify-between gap-1.5 pt-1.5 border-t border-stone-100">
                                             <div className="min-w-0">
                                                  <p className="text-[8.5px] text-stone-400 font-bold uppercase tracking-tight leading-none truncate">
                                                       {t.minPurchase}: ${parseFloat(String(coupon.minimum_purchase || 0)).toFixed(0)}
                                                  </p>
                                                  <p className="text-[8.5px] text-stone-400 font-bold uppercase tracking-tight leading-none mt-1 truncate">
                                                       {t.validUntil} {formattedExpireDate}
                                                  </p>
                                             </div>

                                             <button
                                                  onClick={() => handleCopy(coupon.code)}
                                                  className={`px-3 py-1 rounded-[3px] text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all duration-200 flex items-center justify-center gap-1 shrink-0 ${isCopied
                                                       ? 'bg-stone-900 text-white border-stone-900'
                                                       : 'bg-white hover:bg-stone-900 hover:text-white text-stone-900 border-stone-900/40 hover:border-stone-900'
                                                       }`}
                                             >
                                                  {isCopied ? <FiCheck className="w-2.5 h-2.5" /> : <FiCopy className="w-2.5 h-2.5" />}
                                                  <span>{isCopied ? t.copied : t.copy}</span>
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         );
                    })}
               </div>
          </div>
     );
};
