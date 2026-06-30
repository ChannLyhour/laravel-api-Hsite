import React from 'react';
import type { Category } from '@/api/owner/categories';
import type { StoreRow } from '@/api/owner/stores';
import { FASHION_ROUTES } from '../../routes';

interface QuickLinksProps {
     categories?: Category[];
     ownerUserId?: number | string;
     storeName?: string;
     stores?: StoreRow;
     onNavigate?: (to: string) => void;
     locale?: string;
     coupons?: any[];
     onCouponClick?: () => void;
     onCategoriesClick?: () => void;
     isDarkTheme?: boolean;
}

export const QuickLinks: React.FC<QuickLinksProps> = ({
     categories = [],
     ownerUserId,
     storeName = '',
     stores,
     onNavigate,
     locale = 'en',
     coupons = [],
     onCouponClick,
     onCategoriesClick,
     isDarkTheme = false,
}) => {
     const isKhmer = locale === 'km';
     const couponsCount = coupons && coupons.length > 0 ? coupons.length : 1;

     const handleShopClick = () => {
          const storeSlug = (stores?.store_name || storeName || 'store').replace(/\s+/g, '_');
          if (onNavigate) {
               onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug));
          }
     };

     const handleCategoriesClick = () => {
          if (onCategoriesClick) {
               onCategoriesClick();
          } else {
               const storeSlug = (stores?.store_name || storeName || 'store').replace(/\s+/g, '_');
               if (onNavigate) {
                    onNavigate(FASHION_ROUTES.getCategories(ownerUserId, storeSlug));
               }
          }
     };

     return (
          <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-6 lg:px-8 py-4 sm:py-6">
               <div className="grid grid-cols-3 gap-3.5 sm:gap-6 w-full">

                    {/* Shop Card */}
                    <div
                         onClick={handleShopClick}
                         className={`relative rounded-[7px] flex flex-col items-center justify-center gap-1.5 p-2 sm:p-4 cursor-pointer select-none text-center transition-all duration-300 active:scale-[0.98] ${isDarkTheme
                              ? 'bg-stone-900 border border-stone-850 text-white'
                              : 'bg-white border border-stone-200/50 text-stone-900 shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
                              }`}
                    >
                         {/* Storefront outline icon */}
                         <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-[#E61E25]">
                              <svg className="w-full h-full filter drop-shadow-[0_1.5px_3.5px_rgba(230,30,37,0.12)]" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                                   <path d="M6 16L24 6L42 16" />
                                   <path d="M9 21V40C9 41.1046 9.89543 42 11 42H37C38.1046 42 39 41.1046 39 40V21" />
                                   <path d="M6 16C6 18.5 8.5 20.5 11 20.5C13.5 20.5 15.5 18.5 15.5 16M15.5 16C15.5 18.5 17.5 20.5 20 20.5C22.5 20.5 24.5 18.5 24.5 16M24.5 16C24.5 18.5 26.5 20.5 29 20.5C31.5 20.5 33.5 18.5 33.5 16M33.5 16C33.5 18.5 35.5 20.5 38 20.5C40.5 20.5 42 18.5 42 16" />
                                   <path d="M20 42V30H28V42" />
                              </svg>
                         </div>

                         <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-[11px] sm:text-[13px] font-black uppercase tracking-wider ${isDarkTheme ? 'text-stone-200' : 'text-stone-850'} leading-none`}>
                                   {isKhmer ? 'ហាង' : 'Shop'}
                              </span>
                              <span className="text-[7px] sm:text-[8.5px] text-stone-400 font-bold uppercase tracking-wider leading-none mt-0.5">
                                   {isKhmer ? 'ហាងលក់ទំនិញ' : 'Enter Boutique'}
                              </span>
                         </div>
                    </div>
                    {/* Categories Card */}
                    <div
                         onClick={handleCategoriesClick}
                         className={`relative rounded-[7px] flex flex-col items-center justify-center gap-1.5 p-2 sm:p-4 cursor-pointer select-none text-center transition-all duration-300 active:scale-[0.98] ${isDarkTheme
                                   ? 'bg-stone-900 border border-stone-850 text-white'
                                   : 'bg-white border border-stone-200/50 text-stone-900 shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
                              }`}
                    >
                         {/* Grid layout categories icon */}
                         <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-[#E61E25]">
                              <svg className="w-full h-full filter drop-shadow-[0_1.5px_3.5px_rgba(230,30,37,0.12)]" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                                   <rect x="7" y="7" width="14" height="14" rx="3" />
                                   <rect x="27" y="7" width="14" height="14" rx="3" />
                                   <rect x="7" y="27" width="14" height="14" rx="3" />
                                   <rect x="27" y="27" width="14" height="14" rx="3" />
                              </svg>
                         </div>

                         <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-[11px] sm:text-[13px] font-black uppercase tracking-wider ${isDarkTheme ? 'text-stone-200' : 'text-stone-850'} leading-none`}>
                                   {isKhmer ? 'ប្រភេទ' : 'Categories'}
                              </span>
                              <span className="text-[7px] sm:text-[8.5px] text-stone-400 font-bold uppercase tracking-wider leading-none mt-0.5">
                                   {isKhmer ? 'ស្វែងរកផលិតផល' : 'Browse Catalog'}
                              </span>
                         </div>
                    </div>

                    
                    {/* Coupon Card */}
                    <div
                         onClick={onCouponClick}
                         className={`relative rounded-[7px] flex flex-col items-center justify-center gap-1.5 p-2 sm:p-4 cursor-pointer select-none text-center transition-all duration-300 active:scale-[0.98] ${isDarkTheme
                              ? 'bg-stone-900 border border-stone-850 text-white'
                              : 'bg-white border border-stone-200/50 text-stone-900 shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
                              }`}
                    >
                         {/* Notification Badge */}
                         {couponsCount > 0 && (
                              <div className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-[#E61E25] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-red-500/10 z-10">
                                   {couponsCount}
                              </div>
                         )}

                         {/* Coupon Ticket Icon */}
                         <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center">
                              <svg className="w-full h-full filter drop-shadow-[0_1.5px_4px_rgba(230,30,37,0.18)]" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                   {/* Red ticket shape with circular side notches */}
                                   <path
                                        d="M4 14C4 11.7909 5.79086 10 8 10H40C42.2091 10 44 11.7909 44 14V19C41.7909 19 40 20.7909 40 23C40 25.2091 41.7909 27 44 27V34C44 36.2091 42.2091 38 40 38H8C5.79086 38 4 36.2091 4 34V27C6.20914 27 8 25.2091 8 23C8 20.7909 6.20914 19 4 19V14Z"
                                        fill="#E61E25"
                                   />
                                   {/* White Percent Diagonal Line */}
                                   <line x1="28" y1="16" x2="20" y2="30" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
                                   {/* Percent circles */}
                                   <circle cx="19" cy="19" r="2.5" stroke="white" strokeWidth="3" fill="none" />
                                   <circle cx="29" cy="27" r="2.5" stroke="white" strokeWidth="3" fill="none" />
                              </svg>
                         </div>

                         <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-[11px] sm:text-[13px] font-black uppercase tracking-wider ${isDarkTheme ? 'text-stone-200' : 'text-stone-850'} leading-none`}>
                                   {isKhmer ? 'ប័ណ្ណ' : 'Coupon'}
                              </span>
                              <span className="text-[7px] sm:text-[8.5px] text-stone-400 font-bold uppercase tracking-wider leading-none mt-0.5">
                                   {isKhmer ? 'ទទួលបានការបញ្ចុះតម្លៃ' : 'Claim savings'}
                              </span>
                         </div>
                    </div>
               </div>



          </div>
     );
};
