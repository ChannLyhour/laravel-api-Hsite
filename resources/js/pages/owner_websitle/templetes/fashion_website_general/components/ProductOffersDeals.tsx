import React, { useState, useEffect, useMemo } from 'react';
import { FiTag, FiClock, FiPercent, FiCopy, FiCheck, FiChevronRight, FiGift } from 'react-icons/fi';
import { CardProduct } from './helpers/CardProduct';
import { TextSp } from './helpers/TextSp';
import type { StoreRow } from '@/api/owner/stores';
import type { CouponRow } from '@/api/owner/coupons';
import type { FlashDealRow } from '@/api/owner/flashDeals';
import type { FeaturedDealRow } from '@/api/owner/featuredDeals';
import type { ClearanceSaleRow } from '@/api/owner/clearanceSales';
import { toast } from '../utils/toast';
import { mapToUIItem } from '../utils/priceUtils';
import { SkeletonGrid } from './helpers/SkeletonSt';

export interface ProductOffersDealsProps {
     coupons?: CouponRow[];
     flashDeals?: FlashDealRow[];
     featuredDeals?: FeaturedDealRow[];
     clearanceSales?: ClearanceSaleRow[];
     ownerUserId?: number | string;
     storeName?: string;
     stores?: StoreRow;
     onNavigate?: (to: string) => void;
     addToCart?: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
     favorites?: Record<string, boolean>;
     toggleFavorite?: (id: string, name: string) => void;
     isLoading?: boolean;
}

export const ProductOffersDeals: React.FC<ProductOffersDealsProps> = ({
     coupons = [],
     flashDeals = [],
     featuredDeals = [],
     clearanceSales = [],
     ownerUserId,
     storeName = '',
     stores,
     onNavigate,
     addToCart,
     favorites = {},
     toggleFavorite,
     isLoading = false,
}) => {
     const [activeTab, setActiveTab] = useState<'all' | 'coupons' | 'flash' | 'featured' | 'clearance'>('all');
     const [copiedCode, setCopiedCode] = useState<string>('');

     useEffect(() => {
          const handleTabChange = () => {
               const params = new URLSearchParams(window.location.search);
               const tab = params.get('tab');
               if (tab && ['all', 'coupons', 'flash', 'featured', 'clearance'].includes(tab)) {
                    setActiveTab(tab as any);
               }
          };

          window.addEventListener('popstate', handleTabChange);
          window.addEventListener('navigation_changed', handleTabChange);
          handleTabChange();

          return () => {
               window.removeEventListener('popstate', handleTabChange);
               window.removeEventListener('navigation_changed', handleTabChange);
          };
     }, []);

     const handleCopyCode = (code: string) => {
          navigator.clipboard.writeText(code);
          setCopiedCode(code);
          toast.success(`Coupon "${code}" copied to clipboard!`);
          setTimeout(() => {
               setCopiedCode('');
          }, 2000);
     };

     // Countdown timer helper for flash deals
     const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
     });

     const activeFlashDeal = useMemo(() => {
          return flashDeals.find(d => d.status === 'Active' || d.is_published);
     }, [flashDeals]);

     useEffect(() => {
          if (!activeFlashDeal) return;

          const timer = setInterval(() => {
               const now = new Date().getTime();
               const end = activeFlashDeal.end_date ? new Date(activeFlashDeal.end_date).getTime() : 0;
               const diff = end - now;

               if (diff <= 0) {
                    clearInterval(timer);
                    setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
               } else {
                    setTimeLeft({
                         days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                         hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                         minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                         seconds: Math.floor((diff % (1000 * 60)) / 1000),
                    });
               }
          }, 1000);

          return () => clearInterval(timer);
     }, [activeFlashDeal]);

     // Aggregate flash deal products
     const flashProducts = useMemo(() => {
          if (!activeFlashDeal || !activeFlashDeal.products) return [];
          return activeFlashDeal.products.map(p => mapToUIItem(p as any));
     }, [activeFlashDeal]);

     // Aggregate featured deal products
     const featuredProducts = useMemo(() => {
          if (featuredDeals.length === 0) return [];
          const prods: any[] = [];
          featuredDeals.forEach(deal => {
               if (deal.products) {
                    deal.products.forEach(p => {
                         if (!prods.find(exist => exist.id === p.id)) {
                              prods.push(mapToUIItem(p as any));
                         }
                    });
               }
          });
          return prods;
     }, [featuredDeals]);

     // Aggregate clearance products
     const clearanceProducts = useMemo(() => {
          if (clearanceSales.length === 0) return [];
          const prods: any[] = [];
          clearanceSales.forEach(sale => {
               if (sale.products) {
                    sale.products.forEach(p => {
                         if (!prods.find(exist => exist.id === p.id)) {
                              prods.push(mapToUIItem(p as any));
                         }
                    });
               }
          });
          return prods;
     }, [clearanceSales]);

     const hasAnyDeals = coupons.length > 0 || flashProducts.length > 0 || featuredProducts.length > 0 || clearanceProducts.length > 0;

     if (isLoading) {
          return (
               <div className="w-full bg-[#F9F9F9] dark:bg-[#0c0c0c] min-h-[70vh] pb-16">
                    {/* Top Hero Heading */}
                    <div className="bg-white dark:bg-stone-950 border-b border-stone-100 dark:border-stone-900 py-4 sm:py-6">
                         <div className="max-w-7xl mx-auto px-4 sm:px-2 lg:px-8 text-center space-y-4">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/20 text-[#E61E25] text-[10px] font-black uppercase tracking-wider rounded-full">
                                   <FiTag className="w-3.5 h-3.5" /> Exclusive Promotions
                              </div>
                              <TextSp
                                   as="h1"
                                   size={{ mobile: '2xl', tablet: '3xl', desktop: '4xl' }}
                                   weight="black"
                                   color="text-stone-900 dark:text-white"
                                   uppercase
                                   tracking="wider"
                                   className="leading-tight"
                              >
                                   Runway Offers & Deals
                              </TextSp>
                         </div>
                    </div>

                    {/* Tabs Selector Navigation */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                         <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 border-b border-stone-200/60 dark:border-stone-800 scrollbar-hide gap-1 sm:gap-2">
                              {[
                                   { id: 'all', label: 'All Promotions' },
                                   { id: 'coupons', label: 'Vouchers' },
                                   { id: 'flash', label: 'Flash Deals' },
                                   { id: 'featured', label: 'Featured Deals' },
                                   { id: 'clearance', label: 'Clearance Sales' },
                              ].map(tab => {
                                   const isActive = tab.id === 'all';
                                   return (
                                        <button
                                             key={tab.id}
                                             disabled
                                             className={`py-2 px-4 text-xs uppercase font-bold tracking-wider shrink-0 transition-all rounded-full border-none cursor-not-allowed flex items-center gap-1.5 opacity-60 ${isActive
                                                  ? 'bg-stone-950 dark:bg-white text-white dark:text-stone-950 shadow-sm'
                                                  : 'bg-transparent text-stone-500 dark:text-stone-400'
                                                  }`}
                                        >
                                             {tab.label}
                                        </button>
                                   );
                              })}
                         </div>
                    </div>

                    {/* Main Deals Content wrapper */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                         <div className="space-y-10">
                              <SkeletonGrid count={8} />
                         </div>
                    </div>
               </div>
          );
     }

     return (
          <div className="w-full bg-white dark:bg-[#0c0c0c] min-h-[70vh] pb-16">
               {/* Top Hero Heading */}
               <div className="bg-white dark:bg-stone-950 py-8 border-b border-stone-150 dark:border-stone-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-2 lg:px-8 text-center space-y-2 select-none">
                         <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E61E25]">
                              Exclusive Promotions
                         </span>
                         <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white uppercase tracking-wider leading-tight">
                              Runway Offers & Deals
                         </h1>
                    </div>
               </div>

               {/* Tabs Selector Navigation */}
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                    <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 border-b border-stone-150 dark:border-stone-850/60 scrollbar-hide gap-1 sm:gap-2">
                         {[
                              { id: 'all', label: 'All Promotions' },
                              { id: 'coupons', label: 'Vouchers', count: coupons.length },
                              { id: 'flash', label: 'Flash Deals', count: flashProducts.length },
                              { id: 'featured', label: 'Featured Deals', count: featuredProducts.length },
                              { id: 'clearance', label: 'Clearance Sales', count: clearanceProducts.length },
                         ].map(tab => {
                              const isActive = activeTab === tab.id;
                              return (
                                   <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`shrink-0 flex items-center px-3.5 py-1.5 border transition-all duration-300 cursor-pointer text-xs font-semibold rounded-[4px] focus:outline-none ${isActive
                                             ? 'bg-white text-stone-950 border-stone-850 shadow-sm font-semibold'
                                             : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900 shadow-2xs'
                                             }`}
                                   >
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                             <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none ${isActive ? 'bg-[#E61E25] text-white' : 'bg-stone-100 text-stone-450'}`}>
                                                  {tab.count}
                                             </span>
                                        )}
                                   </button>
                              );
                         })}
                    </div>
               </div>

               {/* Main Deals Content wrapper */}
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                    {!hasAnyDeals ? (
                         <div className="text-center py-20 bg-white dark:bg-stone-950 border border-stone-150 dark:border-stone-900 rounded-2xl p-8 max-w-md mx-auto space-y-4">
                              <span className="text-4xl inline-block animate-bounce">🎬</span>
                              <h3 className="font-extrabold text-stone-850 dark:text-stone-100 text-sm uppercase tracking-wider">
                                   No Current Promotions
                              </h3>
                              <p className="text-stone-400 dark:text-stone-500 text-xs leading-relaxed">
                                   We are currently curating the next season of exclusive runway savings. Check back soon for vouchers and special event pricing!
                              </p>
                         </div>
                    ) : (
                         <div className="space-y-16 text-left">
                              {/* 1. VOUCHERS / COUPONS */}
                              {(activeTab === 'all' || activeTab === 'coupons') && coupons.length > 0 && (
                                   <div className="space-y-6">
                                        <div className="space-y-1 select-none text-left">
                                             <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E61E25]">
                                                  Exclusive Offer
                                             </span>
                                             <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight uppercase leading-none">
                                                  Active Coupons & Vouchers
                                             </h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                             {coupons.map((coupon) => {
                                                  const isCopied = copiedCode === coupon.code;
                                                  const discountVal = parseFloat(String(coupon.discount_amount || 0));
                                                  return (
                                                       <div
                                                            key={coupon.id}
                                                            className="relative bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-5 shadow-3xs flex items-center justify-between gap-4 hover:shadow-2xs hover:border-stone-300 dark:hover:border-stone-700 transition-all group"
                                                       >
                                                            {/* Details Area */}
                                                            <div className="text-left">
                                                                 <span className="text-[#E61E25] bg-red-50 dark:bg-red-950/20 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-[4px] inline-block leading-none">
                                                                      {coupon.discount_type === 'percentage' ? `${Math.round(discountVal)}%` : `$${Math.round(discountVal)}`} OFF
                                                                 </span>
                                                                 <h4 className="text-xs font-black uppercase text-stone-900 dark:text-stone-100 tracking-wider mt-2.5 mb-1 leading-tight">
                                                                      {coupon.title || 'Store Discount'}
                                                                 </h4>
                                                                 <p className="text-stone-400 dark:text-stone-500 text-[10px] font-bold uppercase tracking-wider leading-none m-0">
                                                                      Min Spend: ${parseFloat(String(coupon.minimum_purchase || 0)).toFixed(2)}
                                                                 </p>
                                                            </div>

                                                            {/* Code & Copy Area */}
                                                            <div className="flex items-center gap-2 border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 rounded-lg px-3.5 py-2 shrink-0 select-none">
                                                                 <code className="text-2xs font-mono font-black text-stone-800 dark:text-stone-200 uppercase tracking-widest select-all">
                                                                      {coupon.code}
                                                                 </code>
                                                                 <button
                                                                      type="button"
                                                                      onClick={() => handleCopyCode(coupon.code)}
                                                                      className="p-1 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-500 hover:text-[#E61E25] transition-all cursor-pointer focus:outline-none border-none bg-transparent flex items-center justify-center"
                                                                      title={isCopied ? "Copied" : "Copy Code"}
                                                                 >
                                                                      {isCopied ? (
                                                                           <FiCheck className="w-3.5 h-3.5 text-emerald-550" />
                                                                      ) : (
                                                                           <FiCopy className="w-3.5 h-3.5" />
                                                                      )}
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  );
                                             })}
                                        </div>
                                   </div>
                              )}

                              {/* 2. FLASH DEALS */}
                              {(activeTab === 'all' || activeTab === 'flash') && flashProducts.length > 0 && activeFlashDeal && (
                                   <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-150 dark:border-stone-850/60 pb-4">
                                             <div className="space-y-1 text-left">
                                                  <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E61E25]">
                                                       Limited Time Only
                                                  </span>
                                                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight uppercase leading-none">
                                                       {activeFlashDeal.title || 'Flash Deals'}
                                                  </h2>
                                                  <p className="text-stone-400 dark:text-stone-500 text-[11px] font-semibold mt-1">
                                                       {activeFlashDeal.meta_description || ''}
                                                  </p>
                                             </div>

                                             {/* Countdown Timer */}
                                             <div className="flex items-center gap-2 bg-stone-950 dark:bg-white text-white dark:text-stone-950 px-4 py-2 rounded-xl shadow-xs self-start sm:self-center font-mono">
                                                  <FiClock className="w-3.5 h-3.5 text-red-500 dark:text-red-650 animate-pulse shrink-0" />
                                                  <span className="text-[10px] font-bold uppercase tracking-wider mr-1 select-none">Ends in:</span>
                                                  <span className="text-xs font-black">{String(timeLeft.days).padStart(2, '0')}d</span>
                                                  <span className="text-stone-500 dark:text-stone-300 font-extrabold">:</span>
                                                  <span className="text-xs font-black">{String(timeLeft.hours).padStart(2, '0')}h</span>
                                                  <span className="text-stone-500 dark:text-stone-300 font-extrabold">:</span>
                                                  <span className="text-xs font-black">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                                                  <span className="text-stone-500 dark:text-stone-300 font-extrabold">:</span>
                                                  <span className="text-xs font-black text-red-550">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                                             </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                                             {flashProducts.map((product) => (
                                                  <CardProduct
                                                       key={product.id}
                                                       item={product}
                                                       ownerUserId={ownerUserId}
                                                       stores={stores}
                                                       storeName={storeName}
                                                       onNavigate={onNavigate}
                                                       addToCart={addToCart}
                                                       isFavorited={!!favorites[product.id]}
                                                       onToggleFavorite={toggleFavorite}
                                                       showBadge={false}
                                                  />
                                             ))}
                                        </div>
                                   </div>
                              )}

                              {/* 3. FEATURED DEALS */}
                              {(activeTab === 'all' || activeTab === 'featured') && featuredDeals.length > 0 && (
                                   <div className="space-y-12">
                                        {featuredDeals.map((deal) => {
                                             if (!deal.products || deal.products.length === 0) return null;
                                             const mappedProducts = deal.products.map(p => mapToUIItem(p as any));
                                             return (
                                                  <div key={deal.id} className="space-y-6">
                                                       <div className="space-y-1 text-left border-b border-stone-150 dark:border-stone-850/60 pb-4">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E61E25]">
                                                                 Curated Collection
                                                            </span>
                                                            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight uppercase leading-none">
                                                                 {deal.title || 'Featured Deals'}
                                                            </h2>
                                                            <p className="text-stone-400 dark:text-stone-500 text-[11px] font-semibold mt-1">
                                                                 {deal.meta_description || ''}
                                                            </p>
                                                       </div>

                                                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                                                            {mappedProducts.map((product) => (
                                                                 <CardProduct
                                                                      key={product.id}
                                                                      item={product}
                                                                      ownerUserId={ownerUserId}
                                                                      stores={stores}
                                                                      storeName={storeName}
                                                                      onNavigate={onNavigate}
                                                                      addToCart={addToCart}
                                                                      isFavorited={!!favorites[product.id]}
                                                                      onToggleFavorite={toggleFavorite}
                                                                      showBadge={false}
                                                                 />
                                                            ))}
                                                       </div>
                                                  </div>
                                             );
                                        })}
                                   </div>
                              )}

                              {/* 4. CLEARANCE SALES */}
                              {(activeTab === 'all' || activeTab === 'clearance') && clearanceSales.length > 0 && (
                                   <div className="space-y-12">
                                        {clearanceSales.map((sale) => {
                                             if (!sale.products || sale.products.length === 0) return null;
                                             return (
                                                  <div key={sale.id} className="space-y-6">
                                                       <div className="space-y-1 text-left border-b border-stone-150 dark:border-stone-850/60 pb-4">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E61E25]">
                                                                 Last Chance
                                                            </span>
                                                            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight uppercase leading-none">
                                                                 {sale.title || 'Clearance Runway Pieces'}
                                                            </h2>
                                                            <p className="text-stone-400 dark:text-stone-500 text-[11px] font-semibold mt-1">
                                                                 {sale.meta_description || 'Last chance runway pieces and seasonal collections at final clearance rates.'}
                                                            </p>
                                                       </div>

                                                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                                                            {sale.products.map((product) => {
                                                                 const mappedProduct = mapToUIItem(product as any);
                                                                 const pivot = product.pivot;
                                                                 const basePrice = parseFloat(String(product.price)) || 0;
                                                                 let price = basePrice;
                                                                 let comparePrice = product.compare_at_price ? parseFloat(String(product.compare_at_price)) : null;

                                                                 if (pivot) {
                                                                      const discAmt = parseFloat(String(pivot.discount_amount)) || 0;
                                                                      if (pivot.discount_type === 'percent') {
                                                                           price = basePrice * (1 - discAmt / 100);
                                                                           comparePrice = basePrice;
                                                                      } else {
                                                                           price = Math.max(0, basePrice - discAmt);
                                                                           comparePrice = basePrice;
                                                                      }
                                                                 }

                                                                 return (
                                                                      <CardProduct
                                                                           key={product.id}
                                                                           item={mappedProduct}
                                                                           ownerUserId={ownerUserId}
                                                                           stores={stores}
                                                                           storeName={storeName}
                                                                           onNavigate={onNavigate}
                                                                           addToCart={addToCart}
                                                                           customPrice={price}
                                                                           customComparePrice={comparePrice}
                                                                           isFavorited={!!favorites[product.id]}
                                                                           onToggleFavorite={toggleFavorite}
                                                                           showBadge={false}
                                                                      />
                                                                 );
                                                            })}
                                                       </div>
                                                  </div>
                                             );
                                        })}
                                   </div>
                              )}
                         </div>
                    )}
               </div>
          </div>
     );
};
