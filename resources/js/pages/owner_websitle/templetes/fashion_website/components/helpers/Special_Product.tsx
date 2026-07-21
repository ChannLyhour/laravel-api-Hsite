import React, { useMemo, useState, useEffect, useRef } from 'react';
import { FiHeart, FiLayers, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { resolveImageUrl } from '../../utils/imageUtils';
import { CardProduct } from './CardProduct';

interface SpecialProductProps {
  items: any[];
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string, name: string) => void;
  addToCart: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
  ownerUserId?: number | string;
  stores?: any;
  storeName?: string;
  onNavigate?: (to: string) => void;
}

interface AddonSliderProps {
  addons: any[];
  productId: number;
  handleProductClick: (id: number) => void;
}

const AddonSlider: React.FC<AddonSliderProps> = ({
  addons,
  productId,
  handleProductClick,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const { clientWidth } = sliderRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [addons.length]);

  return (
    <div
      className="relative group/slider flex-1 min-w-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Chevron Left */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center transition-all duration-300 shadow-lg z-20 border-none cursor-pointer focus:outline-none opacity-0 -translate-x-3 group-hover/slider:opacity-100 group-hover/slider:translate-x-0"
          type="button"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Navigation Chevron Right */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center transition-all duration-300 shadow-lg z-20 border-none cursor-pointer focus:outline-none opacity-0 translate-x-3 group-hover/slider:opacity-100 group-hover/slider:translate-x-0"
          type="button"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      )}

      <div
        ref={sliderRef}
        onScroll={handleScroll}
        className="grid grid-cols-2 sm:flex sm:overflow-x-auto sm:overflow-y-hidden sm:scrollbar-none sm:scroll-smooth w-full sm:snap-x gap-2 sm:gap-3"
        style={{
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {addons.slice(0, 6).map((addon: any, addonIdx: number) => {
          const addonImgUrl = resolveImageUrl(addon.image);
          const price = parseFloat(String(addon.additional_price)) || 0;
          const discount = parseFloat(String(addon.discount || '0')) || 0;
          const effPrice = addon.discount_type === 'percent'
            ? Math.max(0, price - (price * discount / 100))
            : Math.max(0, price - discount);
          const hasDiscount = discount > 0;

          return (
            <div
              key={addonIdx}
              onClick={() => handleProductClick(productId)}
              className="w-full sm:w-[200px] md:w-[220px] sm:shrink-0 sm:snap-start flex flex-col bg-white dark:bg-stone-955 border border-stone-150 dark:border-stone-800 rounded-md overflow-hidden transition-all duration-300 hover:border-[#E61E25]/45 hover:-translate-y-0.5 cursor-pointer group shadow-3xs"
            >
              {/* Image Box */}
              <div className="relative aspect-[4/5] w-full bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-4 border-b border-stone-100 dark:border-stone-850/50 overflow-hidden">
                {addonImgUrl ? (
                  <img
                    src={addonImgUrl}
                    alt={addon.addon_name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 pointer-events-none select-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-305 dark:text-stone-700 text-[10px] font-bold uppercase select-none">
                    No Image
                  </div>
                )}

                {/* Tiny hover scale dot indicator */}
                <span className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 group-hover:bg-[#E61E25] transition-colors" />
              </div>

              {/* Description box */}
              <div className="flex flex-col py-3 px-3.5 min-h-[56px] text-left w-full justify-between font-sans">
                <span className="font-extrabold text-[10px] sm:text-[11px] text-stone-850 dark:text-stone-200 uppercase leading-snug tracking-wide group-hover:text-[#E61E25] transition-colors line-clamp-1">
                  {addon.addon_name}
                </span>

                {price > 0 && (
                  <div className="flex items-baseline gap-1.5 mt-0.5 select-none font-mono">
                    <span className="text-[10px] sm:text-[11px] text-[#E61E25] font-black">
                      +${effPrice.toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[8px] sm:text-[9px] text-stone-400 dark:text-stone-500 font-bold line-through">
                        +${price.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Special_Product: React.FC<SpecialProductProps> = ({
  items,
  favorites,
  toggleFavorite,
  addToCart,
  ownerUserId,
  stores,
  storeName = '',
  onNavigate,
}) => {
  // Filter out products marked as is_special or is_featured
  const specialProducts = useMemo(() => {
    return items.filter(item => !!item.is_special || !!item.is_featured);
  }, [items]);

  if (specialProducts.length === 0) {
    return null;
  }

  const handleProductClick = (id: number) => {
    window.dispatchEvent(new CustomEvent('open_product_popup', { detail: { productId: String(id) } }));
  };

  return (
    <div className="w-full space-y-8">
      {specialProducts.map((product) => {
        const productPrice = parseFloat(product.price) || 0;
        const isFavorited = !!favorites[String(product.id)];
        const addonsList = product.addons || [];

        return (
          <div key={product.id} className="w-full text-left py-4 border-b border-stone-200/40 last:border-b-0">
            <div className="flex flex-col lg:flex-row gap-6 items-start">

              {/* Left Column: Visual CardProduct (Sticky) */}
              <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-[90px] self-start">
                <CardProduct
                  item={product}
                  ownerUserId={ownerUserId}
                  stores={stores}
                  storeName={storeName}
                  onNavigate={onNavigate}
                  addToCart={addToCart}
                  isFavorited={isFavorited}
                  onToggleFavorite={toggleFavorite}
                />
              </div>

              {/* Right Column: Products details & Addons list */}
              <div className="flex-grow w-full space-y-6">



                {/* Addon header label */}
                <div className="mb-4 text-left select-none">
                  <div className="flex items-center gap-1.5 text-[#E61E25] font-extrabold text-[10px] uppercase tracking-wider">
                    <FiLayers className="w-3.5 h-3.5" />
                    <span>Includes the following items:</span>
                  </div>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold mt-1">
                    Click any item to customize your sizes and complete your outfit bundle.
                  </p>
                </div>

                {addonsList.length === 0 ? (
                  <div className="w-full flex-1 min-h-[220px] border border-dashed border-stone-200 dark:border-stone-850 rounded-md flex items-center justify-center text-stone-400 dark:text-stone-600 text-xs font-bold italic bg-stone-50/10">
                    No matching outfit pieces configured.
                  </div>
                ) : (
                  <AddonSlider
                    addons={addonsList}
                    productId={product.id}
                    handleProductClick={handleProductClick}
                  />
                )}
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
};
