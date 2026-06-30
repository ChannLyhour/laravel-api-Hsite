import React, { useRef, useState, useEffect, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiFilter, FiGrid, FiX } from 'react-icons/fi';
import { resolveImageUrl, getCategoryImage } from '../../utils/imageUtils';
import { LineLoading } from './SkeletonSt';

export interface FilterSfProps {
     /** All categories from the store */
     categories: any[];
     /** All product items (for counting) */
     items: any[];
     /** Currently selected category id */
     selectedCategoryId: number | 'all';
     /** Callback when a category is selected */
     onCategorySelect: (id: number | 'all') => void;
     /** Whether any advanced filters are active */
     hasActiveFilters?: boolean;
     /** Callback to open the filter drawer */
     onOpenFilterDrawer?: () => void;
     /** Active search query */
     searchQuery?: string;
     /** Total filtered product count */
     filteredCount?: number;
     /** Callback to clear search */
     onClearSearch?: () => void;
     /** Active loading state */
     isLoading?: boolean;
}

export const FilterSf: React.FC<FilterSfProps> = ({
     categories,
     items,
     selectedCategoryId,
     onCategorySelect,
     hasActiveFilters = false,
     onOpenFilterDrawer,
     searchQuery = '',
     filteredCount,
     onClearSearch,
     isLoading = false,
}) => {
     const scrollRef = useRef<HTMLDivElement>(null);
     const [canScrollLeft, setCanScrollLeft] = useState(false);
     const [canScrollRight, setCanScrollRight] = useState(false);
     const [navbarVisible, setNavbarVisible] = useState(true);
     const lastScrollYRef = useRef(0);

     // Track navbar visibility (mirrors NavbarPage scroll logic)
     useEffect(() => {
          const handleScroll = () => {
               const currentScrollY = window.scrollY;
               if (currentScrollY > 100) {
                    if (currentScrollY > lastScrollYRef.current) {
                         // Scrolling down — navbar hides
                         setNavbarVisible(false);
                    } else {
                         // Scrolling up — navbar shows
                         setNavbarVisible(true);
                    }
               } else {
                    setNavbarVisible(true);
               }
               lastScrollYRef.current = currentScrollY;
          };
          window.addEventListener('scroll', handleScroll, { passive: true });
          return () => window.removeEventListener('scroll', handleScroll);
     }, []);

     // Top-level categories only
     const topCategories = useMemo(() => {
          if (!categories || categories.length === 0) return [];
          return categories.filter((c: any) => !c.parent_id);
     }, [categories]);

     // Count items per category (including children)
     const getCategoryCount = (catId: number): number => {
          const getChildIds = (id: number): number[] => {
               const children = categories.filter((c: any) => c.parent_id === id);
               let ids = [id];
               children.forEach((child: any) => {
                    ids = [...ids, ...getChildIds(child.id)];
               });
               return ids;
          };
          const activeIds = getChildIds(catId);
          return items.filter((item: any) => item.category_id && activeIds.includes(item.category_id)).length;
     };

     // Check scroll overflow for arrow visibility
     const updateScrollArrows = () => {
          const el = scrollRef.current;
          if (!el) return;
          setCanScrollLeft(el.scrollLeft > 2);
          setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
     };

     useEffect(() => {
          const el = scrollRef.current;
          if (!el) return;
          updateScrollArrows();
          el.addEventListener('scroll', updateScrollArrows, { passive: true });
          const ro = new ResizeObserver(updateScrollArrows);
          ro.observe(el);
          return () => {
               el.removeEventListener('scroll', updateScrollArrows);
               ro.disconnect();
          };
     }, [topCategories]);

     const scroll = (direction: 'left' | 'right') => {
          if (scrollRef.current) {
               const amount = direction === 'left' ? -200 : 200;
               scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
          }
     };

     const activeCategoryName = useMemo(() => {
          if (selectedCategoryId === 'all') return 'All';
          const found = categories.find((c: any) => c.id === selectedCategoryId);
          return found ? found.name : 'All';
     }, [selectedCategoryId, categories]);

     // Compute the navbar height for sticky offset
     const [navbarHeight, setNavbarHeight] = useState(64);

     useEffect(() => {
          const update = () => {
               setNavbarHeight(window.innerWidth >= 1024 ? 80 : 64);
          };
          update();
          window.addEventListener('resize', update);
          return () => window.removeEventListener('resize', update);
     }, []);

     return (
          <div
               className="sticky z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200/60"
               style={{
                    top: navbarVisible ? `${navbarHeight}px` : '0px',
                    transition: 'top 0.3s ease-in-out',
               }}
          >
               <div
                    style={{
                         display: 'flex',
                         gap: '10px',
                         justifyContent: 'space-between',
                         alignItems: 'center',
                         paddingRight: '5px',
                         width: '100%',
                         marginBottom: '0px',
                    }}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5"
               >
                    {/* Left: Filter Button + Active Info */}
                    <div className="flex items-center gap-2.5 shrink-0">
                         {/* Filter Toggle */}
                         {onOpenFilterDrawer && (
                              <button
                                   onClick={onOpenFilterDrawer}
                                   className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-400 rounded-[4px] text-stone-700 hover:text-[#E61E25] transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider shadow-2xs hover:shadow-xs focus:outline-none"
                              >
                                   <FiFilter className="w-3.5 h-3.5" />
                                   <span className="hidden sm:inline">Filter</span>
                                   {hasActiveFilters && (
                                        <span className="w-1.5 h-1.5 bg-[#E61E25] rounded-full animate-pulse" />
                                   )}
                              </button>
                         )}

                         {/* Active Category Badge */}
                         <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-stone-600">
                              <span className="text-stone-400">{activeCategoryName}</span>
                              {filteredCount !== undefined && (
                                   <span className="px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded-full text-[9px] font-bold">
                                        {filteredCount}
                                   </span>
                              )}
                         </div>

                         {/* Search Query Tag */}
                         {searchQuery && (
                              <span className="flex items-center gap-1 text-[10px] text-[#E61E25] font-black bg-red-50 border border-red-100/60 px-2 py-0.5 rounded-full">
                                   "{searchQuery}"
                                   {onClearSearch && (
                                        <FiX
                                             className="w-3 h-3 cursor-pointer hover:text-red-700 transition-colors"
                                             onClick={onClearSearch}
                                        />
                                   )}
                              </span>
                         )}
                    </div>

                    {/* Center: Horizontal Scrollable Categories */}
                    <div className="flex-1 flex items-center gap-1 min-w-0 relative px-1">
                         {/* Left Arrow */}
                         <button
                              onClick={() => scroll('left')}
                              className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-stone-200 text-stone-500 hover:text-[#E61E25] hover:border-[#E61E25] transition-all cursor-pointer shadow-2xs focus:outline-none ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                   }`}
                         >
                              <FiChevronLeft className="w-3.5 h-3.5" />
                         </button>

                         {/* Scrollable Container */}
                         <div
                              ref={scrollRef}
                              className="flex items-center gap-1.5 overflow-x-auto scroll-smooth select-none flex-1"
                              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                         >
                              {/* All Categories Pill */}
                              <button
                                   onClick={() => onCategorySelect('all')}
                                   className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer text-[10px] font-black uppercase tracking-wide whitespace-nowrap focus:outline-none ${selectedCategoryId === 'all'
                                             ? 'bg-stone-950 text-white border-stone-950 shadow-xs'
                                             : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900 shadow-2xs'
                                        }`}
                              >
                                   <FiGrid className="w-3 h-3" />
                                   All
                                   <span className={`text-[8px] font-bold px-1 py-0 rounded-full ${selectedCategoryId === 'all'
                                             ? 'bg-white/20 text-white/80'
                                             : 'bg-stone-100 text-stone-400'
                                        }`}>
                                        {items.length}
                                   </span>
                              </button>

                              {/* Category Pills */}
                              {topCategories.map((cat: any) => {
                                   const count = getCategoryCount(cat.id);
                                   const isSelected = selectedCategoryId === cat.id;
                                   const imgSrc = resolveImageUrl(cat.image) || getCategoryImage(cat.name);

                                   return (
                                        <button
                                             key={cat.id}
                                             onClick={() => onCategorySelect(cat.id)}
                                             className={`shrink-0 flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border transition-all duration-300 cursor-pointer text-[10px] font-black uppercase tracking-wide whitespace-nowrap focus:outline-none ${isSelected
                                                       ? 'bg-stone-950 text-white border-stone-950 shadow-xs'
                                                       : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900 shadow-2xs'
                                                  }`}
                                        >
                                             {/* Mini Category Image */}
                                             {imgSrc && (
                                                  <div className={`w-5 h-5 rounded-full overflow-hidden border shrink-0 ${isSelected ? 'border-white/30' : 'border-stone-200'
                                                       }`}>
                                                       <img
                                                            src={imgSrc}
                                                            alt={cat.name}
                                                            className="w-full h-full object-cover"
                                                       />
                                                  </div>
                                             )}
                                             {cat.name}
                                             <span className={`text-[8px] font-bold px-1 py-0 rounded-full ${isSelected
                                                       ? 'bg-white/20 text-white/80'
                                                       : 'bg-stone-100 text-stone-400'
                                                  }`}>
                                                  {count}
                                             </span>
                                        </button>
                                   );
                              })}
                         </div>

                         {/* Right Arrow */}
                         <button
                              onClick={() => scroll('right')}
                              className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-stone-200 text-stone-500 hover:text-[#E61E25] hover:border-[#E61E25] transition-all cursor-pointer shadow-2xs focus:outline-none ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                   }`}
                         >
                              <FiChevronRight className="w-3.5 h-3.5" />
                         </button>
                    </div>
               </div>
               {/* Sticky filter bar bottom linear loading progress bar */}
               <LineLoading isLoading={isLoading} />
          </div>
     );
};
