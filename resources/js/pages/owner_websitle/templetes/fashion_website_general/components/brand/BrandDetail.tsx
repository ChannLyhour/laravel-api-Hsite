import React, { useState, useEffect, useMemo } from 'react';
import { FiChevronLeft, FiTag, FiShoppingBag, FiInfo } from 'react-icons/fi';
import { brandsService, type Brand } from '@/api/owner/brands';
import type { StoreRow } from '@/api/owner/stores';
import type { Root2 } from '@/api/owner/categories';
import { CardProduct } from '../helpers/CardProduct';
import { SkeletonGrid } from '../helpers/SkeletonSt';
import { TextSp } from '../helpers/TextSp';
import { resolveImageUrl } from '../../utils/imageUtils';
import { FASHION_ROUTES } from '../../routes';

export interface BrandDetailProps {
     brandId: number | string;
     onNavigate?: (to: string) => void;
     addToCart: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
     favorites: Record<string, boolean>;
     toggleFavorite: (id: string, name: string) => void;
     storeName?: string;
     stores?: StoreRow;
     ownerUserId?: number | string;
     items?: any[];
     onClose?: () => void;
}

export const BrandDetail: React.FC<BrandDetailProps> = ({
     brandId,
     onNavigate,
     addToCart,
     favorites,
     toggleFavorite,
     storeName = '---',
     stores,
     ownerUserId,
     items = [],
     onClose,
}) => {
     const [brand, setBrand] = useState<Brand | null>(null);
     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
          if (ownerUserId && brandId) {
               setIsLoading(true);
               brandsService
                    .getBrands(100, 0, ownerUserId)
                    .then((res) => {
                         const found = res.find((b) => String(b.id) === String(brandId));
                         setBrand(found || null);
                    })
                    .catch((err) => console.error('[BrandDetail] Failed to load brand details:', err))
                    .finally(() => setIsLoading(false));
          }
     }, [ownerUserId, brandId]);

     // Filter products by brand_id
     const brandProducts = useMemo(() => {
          if (!brand || !items) return [];
          return items.filter((item) => {
               if (!item) return false;
               const status = typeof item.status === 'string' ? item.status.toLowerCase() : item.status;
               const isActive =
                    status !== false &&
                    status !== 'false' &&
                    status !== 'inactive' &&
                    status !== 'archived' &&
                    status !== 'draft';
               return isActive && Number(item.brand_id) === Number(brand.id);
          });
     }, [items, brand]);

     const handleBackClick = () => {
          if (onClose) {
               onClose();
          } else if (onNavigate) {
               const storeSlug = (stores?.store_name || storeName || 'store').replace(/\s+/g, '_');
               onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug));
          } else {
               window.history.back();
          }
     };

     if (isLoading) {
          return (
               <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left animate-pulse">
                    <div className="h-6 w-32 bg-stone-200 dark:bg-stone-850 rounded" />
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-stone-200 dark:border-stone-850">
                         <div className="w-24 h-24 rounded-full bg-stone-200 dark:bg-stone-850 shrink-0" />
                         <div className="space-y-3 flex-grow text-center sm:text-left">
                              <div className="h-8 w-48 bg-stone-200 dark:bg-stone-850 rounded mx-auto sm:mx-0" />
                              <div className="h-4 w-64 bg-stone-200 dark:bg-stone-850 rounded mx-auto sm:mx-0" />
                         </div>
                    </div>
                    <SkeletonGrid count={8} />
               </div>
          );
     }

     if (!brand) {
          return (
               <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-4">
                    <span className="text-4xl">🔍</span>
                    <div>
                         <h4 className="font-extrabold text-stone-850 dark:text-stone-200 text-sm uppercase tracking-wider">
                              Brand not found
                         </h4>
                         <p className="text-stone-400 text-2xs font-semibold mt-1">
                              We couldn't retrieve this styling partner's showcase.
                         </p>
                    </div>
                    <button
                         onClick={handleBackClick}
                         className="px-6 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold uppercase tracking-widest transition-all rounded-[3px] border-none cursor-pointer"
                    >
                         Go Back
                    </button>
               </div>
          );
     }

     const brandLogoUrl = brand.logo ? resolveImageUrl(brand.logo) : null;

     return (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left animate-fade-in space-y-8">
               {/* Breadcrumb / Back Navigation */}
               <div>
                    <button
                         onClick={handleBackClick}
                         className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 uppercase tracking-widest border-none bg-transparent cursor-pointer transition-colors"
                    >
                         <FiChevronLeft className="w-4 h-4" /> Back to Collection
                    </button>
               </div>

               {/* Brand Profile Header Panel */}
               <div className="w-full bg-white dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-lg p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 transition-all duration-300">
                    {/* Brand Logo Container */}
                    <div className="w-24 h-24 rounded-full bg-black border border-stone-200 dark:border-neutral-850 flex items-center justify-center overflow-hidden shrink-0 select-none shadow-md">
                         {brandLogoUrl ? (
                              <img
                                   src={brandLogoUrl}
                                   alt={brand.name}
                                   className="max-h-[70%] max-w-[80%] object-contain"
                              />
                         ) : (
                              <span className="font-sans font-black text-white text-base tracking-wider text-center px-2">
                                   {brand.name.slice(0, 2).toUpperCase()}
                              </span>
                         )}
                    </div>

                    {/* Brand Information Details */}
                    <div className="flex-grow text-center sm:text-left space-y-2.5">
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-center sm:justify-start">
                              <TextSp
                                   as="h1"
                                   size={{ mobile: 'xl', tablet: '2xl' }}
                                   weight="black"
                                   color="text-stone-900 dark:text-stone-100"
                                   uppercase
                                   tracking="widest"
                                   className="font-kontomruy leading-tight"
                              >
                                   {brand.name}
                              </TextSp>
                              <span className="self-center sm:self-auto w-fit bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none">
                                   Official Partner
                              </span>
                         </div>

                         {brand.alt_text ? (
                              <p className="text-stone-500 dark:text-stone-400 text-xs leading-relaxed max-w-2xl font-sans">
                                   {brand.alt_text}
                              </p>
                         ) : (
                              <p className="text-stone-400 text-xs italic font-sans">
                                   Explore the exclusive runway curation of {brand.name}. High-quality pieces made for modern expression.
                              </p>
                         )}

                         {/* Quick Metrics Details */}
                         <div className="flex items-center gap-4 justify-center sm:justify-start pt-1 text-[11px] font-semibold text-stone-400 dark:text-stone-500 font-sans select-none">
                              <span className="flex items-center gap-1.5">
                                   <FiShoppingBag className="w-3.5 h-3.5" />
                                   {brandProducts.length} Items Available
                              </span>
                              {brand.total_order !== undefined && brand.total_order > 0 && (
                                   <span className="flex items-center gap-1.5 border-l border-stone-200 dark:border-stone-800 pl-4">
                                        <FiInfo className="w-3.5 h-3.5" />
                                        {brand.total_order} Collection Orders
                                   </span>
                              )}
                         </div>
                    </div>
               </div>

               {/* Brand Products Showcase */}
               <div className="space-y-6 pt-2">
                    <div className="border-b border-stone-200 dark:border-stone-850 pb-3 flex items-center gap-2">
                         <FiTag className="text-[#E61E25] w-4.5 h-4.5" />
                         <TextSp
                              as="h2"
                              size="sm"
                              weight="black"
                              color="text-stone-900 dark:text-stone-100"
                              uppercase
                              tracking="wider"
                              className="font-kontomruy"
                         >
                              Showcase Collection
                         </TextSp>
                    </div>

                    {brandProducts.length === 0 ? (
                         <div className="text-center py-20 space-y-3 border border-dashed border-stone-200 dark:border-stone-850 rounded-[4px] w-full">
                              <span className="text-3xl">🧥</span>
                              <div>
                                   <TextSp
                                        as="h4"
                                        size="xs"
                                        weight="extrabold"
                                        color="text-stone-800 dark:text-stone-200"
                                        uppercase
                                        tracking="wider"
                                   >
                                        No items found
                                   </TextSp>
                                   <TextSp
                                        as="p"
                                        size="2xs"
                                        weight="semibold"
                                        color="text-stone-400"
                                        className="mt-1"
                                   >
                                        {`Stay tuned! Newly tagged styles from ${brand.name} will drop shortly.`}
                                   </TextSp>
                              </div>
                         </div>
                    ) : (
                         <div className="w-full">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                   {brandProducts.map((item, idx) => (
                                        <div key={item.id} className="w-full">
                                             <CardProduct
                                                  item={item}
                                                  ownerUserId={ownerUserId}
                                                  stores={stores}
                                                  storeName={storeName}
                                                  onNavigate={onNavigate}
                                                  addToCart={(itm, qty, sz, col) => addToCart(itm, qty ?? 1, sz ?? '', col ?? '')}
                                                  isFavorited={!!favorites[String(item.id)]}
                                                  onToggleFavorite={toggleFavorite}
                                                  font="kontomruy"
                                                  aosDelay={(idx % 5) * 100}
                                                  disableAos={false}
                                             />
                                        </div>
                                   ))}
                              </div>
                         </div>
                    )}
               </div>
          </div>
     );
};
