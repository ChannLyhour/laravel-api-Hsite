import React from 'react';
import { resolveImageUrl, getCategoryImage } from '../utils/imageUtils';
import type { Category } from '@/api/owner/categories';
import type { StoreRow } from '@/api/owner/stores';
import { FASHION_ROUTES } from '../routes';

interface CategoriesGridProps {
     categories: Category[];
     ownerUserId?: number | string;
     storeName: string;
     stores?: StoreRow;
     onNavigate?: (to: string) => void;
     locale?: string;
     items?: any[];
     coupons?: any[];
     onCouponClick?: () => void;
}

const getCategoryGridStyle = (idx: number): React.CSSProperties => {
     const styles: React.CSSProperties[] = [
          { gridColumnStart: 1, gridRowStart: 1, gridRowEnd: 'span 7' }, // Index 0: Col 1, tall
          { gridColumnStart: 1, gridRowStart: 8, gridRowEnd: 'span 5' }, // Index 1: Col 1, short
          { gridColumnStart: 2, gridRowStart: 1, gridRowEnd: 'span 5' }, // Index 2: Col 2, short
          { gridColumnStart: 2, gridRowStart: 6, gridRowEnd: 'span 7' }, // Index 3: Col 2, tall
          { gridColumnStart: 1, gridRowStart: 13, gridRowEnd: 'span 7' }, // Index 4: Col 1, tall
          { gridColumnStart: 2, gridRowStart: 13, gridRowEnd: 'span 7' }, // Index 5: Col 2, tall
     ];
     return styles[idx] || {};
};

export const CategoriesGrid: React.FC<CategoriesGridProps> = ({
     categories = [],
     ownerUserId,
     storeName,
     stores,
     onNavigate,
     locale = 'en',
}) => {
     const [activeIndex, setActiveIndex] = React.useState<number>(0);
     const [isHovered, setIsHovered] = React.useState<boolean>(false);

     // Filter top-level categories (no parent_id)
     const displayCategories = React.useMemo(() => {
          if (!categories || categories.length === 0) return [];
          const active = categories.filter(c => c.status === 1 || String(c.status) === '1');
          const topLevel = active.filter(c => !c.parent_id);
          const list = topLevel.length > 0 ? topLevel : active;
          return list.slice(0, 6); // Limit to 6 categories for the mosaic grid
     }, [categories]);

     const totalCount = displayCategories.length;

     React.useEffect(() => {
          if (totalCount <= 1 || isHovered) return;

          const interval = setInterval(() => {
               setActiveIndex((prev) => (prev + 1) % totalCount);
          }, 3000); // Highlight next category card every 3 seconds

          return () => clearInterval(interval);
     }, [totalCount, isHovered]);

     const handleCategoryClick = (e: React.MouseEvent, cat: Category) => {
          if (!onNavigate) return;
          e.preventDefault();
          const hash = `#${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
          onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { hash }));
     };

     return (
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 overflow-hidden select-none animate-fade-in from-rose-50/70 via-pink-50/50 to-rose-100/40 rounded-[24px] border border-pink-100/30">

               {/* Premium Luxury Editorial Header */}
               <div className="text-center mb-6 sm:mb-8">
                    <h1 className="font-sans text-2xl sm:text-4xl font-black tracking-tight text-stone-900 uppercase">
                         {locale === 'km' ? 'ស្វែងរកតាមប្រភេទ' : 'Shop by Category'}
                    </h1>
               </div>
               {/* Mosaic Grid Layout */}
               <div
                    style={{
                         display: 'grid',
                         gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                         gridTemplateRows: totalCount <= 4 ? 'repeat(12, minmax(0, 1fr))' : 'repeat(19, minmax(0, 1fr))',
                    }}
                    className={`gap-4 sm:gap-6 w-full transition-all duration-500 ${totalCount <= 4
                         ? 'h-[400px] sm:h-[580px] md:h-[680px]'
                         : 'h-[600px] sm:h-[850px] md:h-[1000px]'
                         }`}
               >
                    {displayCategories.map((cat, idx) => {
                         const imgUrl = cat.image ? resolveImageUrl(cat.image) : getCategoryImage(cat.name);
                         const isActive = idx === activeIndex;
                         return (
                              <a
                                   key={cat.id}
                                   href={`/shop#${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                   onClick={(e) => handleCategoryClick(e, cat)}
                                   onMouseEnter={() => {
                                        setIsHovered(true);
                                        setActiveIndex(idx);
                                   }}
                                   onMouseLeave={() => setIsHovered(false)}
                                   style={getCategoryGridStyle(idx)}
                                   className={`group relative rounded-[5px] overflow-hidden border border-transparent bg-stone-100/50 flex flex-col justify-end no-underline transition-all duration-700 ease-out shadow-[0_4px_24px_rgba(0,0,0,0.015)] hover:shadow-[0_20px_35px_rgba(0,0,0,0.06)] hover:-translate-y-1 focus:outline-none ${isActive
                                        ? 'border-[#E61E25]/40 shadow-[0_15px_30px_rgba(230,30,37,0.08)] scale-[1.005] z-10'
                                        : 'hover:border-[#E61E25]/20'
                                        }`}
                              >
                                   {/* Full Cover Background Image */}
                                   <div className="absolute inset-0 w-full h-full overflow-hidden bg-stone-50 dark:bg-stone-900">
                                        <img
                                             src={imgUrl || ''}
                                             alt={cat.name}
                                             className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-out ${isActive ? 'scale-106' : 'scale-100 group-hover:scale-106'
                                                  }`}
                                        />
                                   </div>

                                   {/* Luxury Ambient Overlay Gradient */}
                                   <div className={`absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/20 to-transparent transition-opacity duration-700 ${isActive ? 'opacity-95' : 'opacity-80 group-hover:opacity-90'
                                        }`} />

                                   {/* Top-Left Category Title */}
                                   <div className="absolute inset-x-0 top-0 p-4 sm:p-5 flex justify-start items-start z-10">
                                        <div className="px-3.5 py-2 bg-stone-950/45 backdrop-blur-xs rounded-[4px] border border-white/10 transition-all duration-500 group-hover:bg-stone-950/60 max-w-[90%]">
                                             <h3 className="text-white text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-left truncate select-none leading-none">
                                                  {cat.name}
                                             </h3>
                                        </div>
                                   </div>
                              </a>
                         );
                    })}
               </div>
          </section>
     );
};
