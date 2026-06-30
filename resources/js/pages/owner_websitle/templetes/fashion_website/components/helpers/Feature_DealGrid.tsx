import React, { useMemo, useEffect } from 'react';
import type { StoreRow } from '@/api/owner/stores';
import AOS from 'aos';
import { CardProduct } from './CardProduct';
import { resolveImageUrl } from '../../utils/imageUtils';
import { FiStar } from 'react-icons/fi';
import { SkeletonCard } from './SkeletonSt';

interface Feature_DealGridProps {
     deal?: any; // FeaturedDealRow
     displayItems?: any[];
     ownerUserId?: number | string;
     stores?: StoreRow;
     storeName?: string;
     onNavigate?: (to: string) => void;
     addToCart?: (item: any, qty?: number, size?: string, color?: string) => void;
     favorites?: Record<string, boolean>;
     toggleFavorite?: (id: string, name: string) => void;
     isLoading?: boolean;
}

export const Feature_DealGrid: React.FC<Feature_DealGridProps> = ({
     deal,
     displayItems = [],
     ownerUserId,
     stores,
     storeName,
     onNavigate,
     addToCart,
     favorites = {},
     toggleFavorite,
     isLoading = false,
}) => {
     const products = useMemo(() => {
          if (isLoading || !deal) return [];
          const rawProducts = deal.products || [];
          return [...rawProducts].sort((a, b) => {
               const idA = a.pivot?.id ?? 0;
               const idB = b.pivot?.id ?? 0;
               if (idA !== idB) return idA - idB;
               return a.id - b.id;
          });
     }, [deal?.products, isLoading]);

     useEffect(() => {
          if (!isLoading) {
               AOS.refresh();
          }
     }, [products, isLoading]);

     if (isLoading) {
          return (
               <div className="w-full text-left py-4 border-b border-stone-200/40 animate-pulse">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                         {/* Left Column: Visual Banner Placeholder */}
                         <div className="w-full lg:w-[320px] shrink-0 rounded-[6px] relative overflow-hidden flex flex-col justify-end p-6 min-h-[280px] lg:min-h-[420px] bg-stone-200 dark:bg-stone-850 shadow-sm" />

                         {/* Right Column: Products Vertical Grid Placeholder */}
                         <div className="flex-grow w-full">
                              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 sm:gap-y-10 w-full">
                                   {Array.from({ length: 3 }).map((_, idx) => (
                                        <SkeletonCard key={idx} />
                                   ))}
                              </div>
                         </div>
                    </div>
               </div>
          );
     }

     const resolvedBannerImg = deal?.image ? resolveImageUrl(deal.image) : null;

     if (products.length === 0) return null;

     return (
          <div className="w-full text-left py-4 border-b border-stone-200/40">
               <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* Left Column: Visual Banner (Sticky) */}
                    <div
                         data-aos="fade-right"
                         className="w-full lg:w-[320px] shrink-0 rounded-[6px] relative overflow-hidden flex flex-col justify-end p-6 min-h-[280px] lg:min-h-[420px] shadow-sm select-none lg:sticky lg:top-[90px] self-start group cursor-pointer"
                         onClick={() => {
                              if (onNavigate) {
                                   onNavigate(`/shop?deal=featured_deals`);
                              }
                         }}
                    >
                         {/* Zooming Background Image/Gradient */}
                         <div
                              className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                              style={{
                                   background: resolvedBannerImg
                                        ? `linear-gradient(to top, rgba(10, 10, 10, 0.9) 0%, rgba(10, 10, 10, 0.2) 60%), url(${resolvedBannerImg}) center/cover no-repeat`
                                        : 'linear-gradient(135deg, #1c1c1c 0%, #3a0d16 100%)'
                              }}
                         />

                         {/* Subtle glow/flare */}
                         {!resolvedBannerImg && (
                              <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#E61E25]/10 rounded-full blur-2xl z-0" />
                         )}

                         <div className="space-y-3 relative z-10">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E61E25] text-white text-[9px] font-black uppercase tracking-widest rounded-full leading-none shadow-xs">
                                   <FiStar className="w-2.5 h-2.5 fill-current" />
                                   <span>Featured Collection</span>
                              </div>

                              <div className="space-y-1">
                                   <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight leading-tight">
                                        {deal.title}
                                   </h3>
                                   {deal.meta_description && (
                                        <p className="text-stone-300 text-2xs font-semibold leading-relaxed tracking-wide uppercase line-clamp-3">
                                             {deal.meta_description}
                                        </p>
                                   )}
                              </div>

                              <button
                                   onClick={() => {
                                        if (onNavigate) {
                                             // Direct to shop catalog pre-filtered by this featured deal type
                                             onNavigate(`/shop?deal=featured_deals`);
                                        }
                                   }}
                                   className="px-4 py-2 border border-white hover:bg-white hover:text-stone-950 text-white text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer rounded-[2px]"
                              >
                                   Discover Collection
                              </button>
                         </div>
                    </div>

                    {/* Right Column: Products Vertical Grid */}
                    <div className="flex-grow w-full">
                         <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 sm:gap-y-10 w-full">
                              {products.map((product: any, idx: number) => {
                                   const isFavorited = !!favorites[String(product.id)];
                                   const fullProduct = displayItems.find(item => item.id === product.id) || product;

                                   return (
                                        <div
                                             key={product.id}
                                             className="w-full"
                                        >
                                             <CardProduct
                                                  item={fullProduct}
                                                  ownerUserId={ownerUserId}
                                                  stores={stores}
                                                  storeName={storeName}
                                                  onNavigate={onNavigate}
                                                  addToCart={addToCart}
                                                  isFavorited={isFavorited}
                                                  onToggleFavorite={toggleFavorite}
                                                  aosDelay={(idx % 3) * 100}
                                             />
                                        </div>
                                   );
                              })}
                         </div>
                    </div>

               </div>
          </div>
     );
};
