import React from 'react';
import type { CouponRow } from '@/api/owner/coupons';
import { toast } from '../../utils/toast';

interface CouponHomePageProps {
     coupons: CouponRow[];
     locale?: 'en' | 'km';
}

const KHMER_MONTHS = [
     'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
     'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

const formatCouponDate = (dateStr: string, isKhmer: boolean) => {
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

export const CouponHomePage: React.FC<CouponHomePageProps> = ({ coupons = [], locale = 'en' }) => {
     if (!coupons || coupons.length === 0) return null;

     return (
          <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-6 lg:px-8 overflow-hidden select-none">
               <div
                    className="flex items-center gap-4 overflow-x-auto pb-3 scroll-smooth -mx-4 px-4 sm:-mx-0 sm:px-0"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
               >
                    {coupons.map((coupon) => {
                         const discountValue = coupon.discount_type === 'percentage'
                              ? `${parseFloat(String(coupon.discount_amount))}%`
                              : `$${parseFloat(String(coupon.discount_amount))}`;

                         return (
                              <div
                                   key={coupon.id}
                                   onClick={() => {
                                        navigator.clipboard.writeText(coupon.code);
                                        toast.success(locale === 'km' ? 'បានចម្លងកូដបញ្ចុះតម្លៃ!' : 'Coupon code copied!', {
                                             style: { background: '#1c1c1c', color: '#fff', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }
                                        });
                                   }}
                                   className="group relative flex items-center bg-white border border-stone-200/80 rounded-[6px] shadow-3xs hover:shadow-2xs transition-all duration-300 w-[350px] h-[70px] shrink-0 cursor-pointer p-2.5 px-3.5 select-none overflow-hidden gap-3"
                              >
                                   {/* Left Side: Ticket Icon Stub */}
                                   <div className="w-10 h-[25px] rounded bg-[#a21b50] flex flex-col justify-between items-center py-0.5 shrink-0 relative overflow-hidden">
                                        <div className="w-1 h-1 rounded-full bg-white opacity-90" />
                                        <div className="w-1 h-1 rounded-full bg-white opacity-90" />
                                        <div className="w-1 h-1 rounded-full bg-white opacity-90" />
                                        {/* Inner notches on ticket icon */}
                                        <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-2 bg-white rounded-r-full" />
                                        <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-2 bg-white rounded-l-full" />
                                   </div>

                                   {/* Right Side: Title, Details, Separator & Bottom Section */}
                                   <div className="min-w-0 flex-grow flex flex-col justify-between h-full text-left">
                                        {/* Top: Title details */}
                                        <div>
                                             <h4 className="text-[11px] font-bold text-stone-850 leading-tight truncate">
                                                  {coupon.title || (locale === 'km' ? 'ទទួលបានការបញ្ចុះតម្លៃពិសេស' : 'Enjoy exclusive savings')}
                                             </h4>
                                             <div className="flex items-center gap-1.5 mt-0.5">
                                                  <span className="text-[11px] font-black text-stone-950 leading-none">
                                                       {discountValue}
                                                  </span>
                                                  <span className="text-[8.5px] text-stone-400 font-bold leading-none select-none">
                                                       ⓘ
                                                  </span>
                                                  <span className="text-[9px] font-mono font-bold text-stone-500 bg-stone-100/60 px-1 py-0.5 rounded leading-none uppercase tracking-wider">
                                                       {coupon.code}
                                                  </span>
                                             </div>
                                        </div>

                                        {/* Dashed Separator Line */}
                                        <div className="w-full border-t border-dashed border-stone-200/80 my-0.5 relative" />

                                        {/* Bottom Section: Minimum Purchase & Use Now */}
                                        <div className="flex items-center justify-between gap-2">
                                             {/* Limits capsule */}
                                             <div className="bg-stone-50 border border-stone-200/40 rounded-[5px] px-2 py-0.5 text-[8px] font-semibold text-stone-550 tracking-wide truncate max-w-[72%]">
                                                  {locale === 'km' ? (
                                                       <>ការចំណាយតិចបំផុត $${parseFloat(String(coupon.minimum_purchase || 0)).toFixed(0)} • បានប្រើដោយ {formatCouponDate(coupon.expire_date, true)}</>
                                                  ) : (
                                                       <>Min. spend ${parseFloat(String(coupon.minimum_purchase || 0)).toFixed(0)} • Exp. {formatCouponDate(coupon.expire_date, false)}</>
                                                  )}
                                             </div>

                                             {/* Use Now Khmer Text link */}
                                             <span className="text-[9px] font-black uppercase text-[#a21b50] group-hover:text-[#7f113b] transition-colors tracking-wide shrink-0">
                                                  {locale === 'km' ? 'ប្រើឥឡូវនេះ' : 'Use Now'}
                                             </span>
                                        </div>
                                   </div>

                                   {/* Ticket notches on the card edges */}
                                   <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-stone-50 border border-stone-255 rounded-full z-10" />
                                   <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-stone-50 border border-stone-255 rounded-full z-10" />
                              </div>
                         );
                    })}
               </div>
          </div>
     );
};
