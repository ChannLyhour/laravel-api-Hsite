import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { StoreRow } from '@/api/owner/stores';
import { CardProduct } from './CardProduct';
import { FASHION_ROUTES } from '../../routes';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { TextSp } from './TextSp';
import AOS from 'aos';
import { SkeletonGrid } from './SkeletonSt';

interface ProductBagdeGridProps {
  items: any[];
  isLoading?: boolean;
  categories?: any[];
  ownerUserId?: number | string;
  stores?: StoreRow;
  storeName: string;
  onNavigate?: (to: string) => void;
  addToCart: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string, name: string) => void;
  gridCols?: number;
}

interface BadgeGridRowProps {
  badgeName: string;
  items: any[];
  ownerUserId?: number | string;
  stores?: StoreRow;
  storeName: string;
  onNavigate?: (to: string) => void;
  addToCart: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string, name: string) => void;
  gridCols?: number;
}

const getHeaderTextColor = (name: string) => {
  switch (name.toLowerCase()) {
    case 'new':
    case 'new arrival':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'sale':
    case 'discount':
      return 'text-rose-600 dark:text-rose-400';
    case 'trending':
    case 'hot':
      return 'text-amber-600 dark:text-amber-400';
    case 'popular':
    case 'best seller':
      return 'text-violet-600 dark:text-violet-400';
    default:
      return 'text-stone-900 dark:text-stone-100';
  }
};

const getGridColsClass = (cols: number) => {
  switch (cols) {
    case 2:
      return 'grid-cols-2 gap-4 sm:gap-6';
    case 3:
      return 'grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6';
    case 4:
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6';
    case 5:
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6';
    case 6:
    default:
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6';
  }
};

const BadgeGridRow: React.FC<BadgeGridRowProps> = ({
  badgeName,
  items,
  ownerUserId,
  stores,
  storeName,
  onNavigate,
  addToCart,
  favorites,
  toggleFavorite,
  gridCols,
}) => {
  const displayedItems = items.slice(0, 10);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(displayedItems.length > 4);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (sliderRef.current && !gridCols) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      const isScrollableX = scrollWidth > 0 ? scrollWidth - clientWidth > 80 : displayedItems.length > 4;
      setShowLeftArrow(isScrollableX && scrollLeft > 15);

      const isAtEnd = scrollWidth > 0
        ? scrollLeft + clientWidth >= scrollWidth - 40
        : false;
      setShowRightArrow(isScrollableX && !isAtEnd);
      setIsScrollable(isScrollableX);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current && !gridCols) {
      const { clientWidth, scrollLeft, scrollWidth } = sliderRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;

      if (direction === 'right' && scrollLeft + clientWidth >= scrollWidth - 15) {
        sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      if (direction === 'left' && scrollLeft <= 5) {
        sliderRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
        return;
      }

      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (gridCols) {
      setIsScrollable(false);
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }
    handleScroll();
    const timer = setTimeout(handleScroll, 100);
    window.addEventListener('resize', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleScroll);
    };
  }, [displayedItems.length, gridCols]);

  useEffect(() => {
    if (isHovered || gridCols) return;
    if (displayedItems.length <= 1 || !isScrollable) return;

    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered, displayedItems.length, isScrollable, gridCols]);

  useEffect(() => {
    if (gridCols || !sliderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = (entry.target.firstElementChild || entry.target) as HTMLElement;
          if (entry.isIntersecting) {
            target.classList.add('aos-animate');
          } else {
            target.classList.remove('aos-animate');
          }
        });
      },
      {
        root: sliderRef.current,
        threshold: 0.05,
        rootMargin: '0px 20px 0px 20px',
      }
    );

    const children = sliderRef.current.children;
    for (let i = 0; i < children.length; i++) {
      observer.observe(children[i]);
    }

    return () => observer.disconnect();
  }, [displayedItems, gridCols]);

  const elementId = badgeName.toLowerCase().replace(/\s+/g, '-');
  return (
    <div
      id={elementId}
      className="space-y-6 w-full max-w-full text-left overflow-hidden relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sibling Div 1: Header (Title on Left, SHOP MORE on Right) */}
      <div className="flex items-center justify-between border-b border-stone-500/40">
        <TextSp
          as="h2"
          size={{ mobile: 'lg', tablet: 'xl' }}
          weight="black"
          font="kontomruy"
          color={getHeaderTextColor(badgeName)}
          uppercase
          tracking="wider"
        >
          {badgeName}
        </TextSp>
        <a
          href="/shop"
          onClick={(e) => {
            if (onNavigate) {
              e.preventDefault();
              const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
              onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug));
            }
          }}
          className="no-underline transition-colors cursor-pointer"
        >
          <TextSp
            size={{ mobile: 'xs', tablet: 'base' }}
            weight="black"
            font="kontomruy"
            color="text-stone-900 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-400"
            uppercase
            tracking="widest"
          >
            Shop More
          </TextSp>
        </a>
      </div>

      {/* Slider Viewport Container */}
      <div className="relative group/slider flex-1 min-w-0">
        {/* Navigation Chevron Left */}
        {displayedItems.length > 4 && !gridCols && (
          <button
            onClick={() => scroll('left')}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white hidden sm:flex items-center justify-center transition-all duration-300 shadow-lg z-10 border-none cursor-pointer focus:outline-none opacity-0 -translate-x-4 ${showLeftArrow
              ? 'group-hover/slider:opacity-100 group-hover/slider:translate-x-0 pointer-events-auto'
              : 'pointer-events-none'
              }`}
            type="button"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Navigation Chevron Right */}
        {displayedItems.length > 4 && !gridCols && (
          <button
            onClick={() => scroll('right')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white hidden sm:flex items-center justify-center transition-all duration-300 shadow-lg z-10 border-none cursor-pointer focus:outline-none opacity-0 translate-x-4 ${showRightArrow
              ? 'group-hover/slider:opacity-100 group-hover/slider:translate-x-0 pointer-events-auto'
              : 'pointer-events-none'
              }`}
            type="button"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        )}
        {/* Responsive Layout: Grid columns when gridCols is provided, otherwise dynamic grid or horizontal slider */}
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          className={
            gridCols
              ? `grid ${getGridColsClass(gridCols)}`
              : displayedItems.length <= 4
                ? 'grid grid-cols-2 gap-4 sm:grid sm:grid-cols-4 sm:gap-x-6 sm:gap-y-10 w-full'
                : 'grid grid-cols-2 gap-4 sm:flex sm:overflow-x-auto sm:overflow-y-hidden scrollbar-none sm:scroll-smooth w-full sm:snap-x sm:gap-x-6 sm:gap-y-10'
          }
          style={
            gridCols || displayedItems.length <= 4
              ? undefined
              : {
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }
          }
        >
          {displayedItems.map((item, idx) => (
            <div
              key={item.id}
              className={
                gridCols || displayedItems.length <= 4
                  ? 'w-full'
                  : 'w-full sm:w-[calc((100%-16px)/3)] lg:w-[calc((100%-24px)/4)] sm:shrink-0 sm:snap-start'
              }
            >
              <div data-aos="fade-up" data-aos-duration="200" data-aos-offset="10">
                <CardProduct
                  item={item}
                  ownerUserId={ownerUserId}
                  stores={stores}
                  storeName={storeName}
                  onNavigate={onNavigate}
                  addToCart={addToCart}
                  isFavorited={!!favorites[String(item.id)]}
                  onToggleFavorite={toggleFavorite}
                  font="kontomruy"
                  aosDelay={(idx % 3) * 100}
                  disableAos={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shop More button at the bottom if there are more than 10 products */}
      {items.length > 10 && (
        <div className="flex justify-center pt-8">
          <a
            href="/shop"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
                onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug));
              }
            }}
            className="px-8 py-3 bg-stone-900 dark:bg-stone-100 hover:bg-stone-855 dark:hover:bg-stone-200 text-white dark:text-stone-900 no-underline transition-all rounded-[4px] shadow-sm hover:shadow"
          >
            <TextSp
              size="xs"
              weight="black"
              uppercase
              tracking="widest"
            >
              Shop More
            </TextSp>
          </a>
        </div>
      )}
    </div>
  );
};

export const ProductBagdeGrid: React.FC<ProductBagdeGridProps> = ({
  items,
  isLoading = false,
  categories = [],
  ownerUserId,
  stores,
  storeName,
  onNavigate,
  addToCart,
  favorites,
  toggleFavorite,
  gridCols,
}) => {
  // Filter out inactive products
  const activeItems = useMemo(() => {
    return items.filter((item) => {
      if (!item) return false;
      const status = typeof item.status === 'string' ? item.status.toLowerCase() : item.status;
      return (
        status !== false &&
        status !== 'false' &&
        status !== 'inactive' &&
        status !== 'archived' &&
        status !== 'draft'
      );
    });
  }, [items]);

  useEffect(() => {
    AOS.refreshHard();
  }, [activeItems]);

  // Group products dynamically by their badges
  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};

    activeItems.forEach((item) => {
      let badgeName = '';
      if (item.badge && item.badge.name) {
        // Only group by badge if the badge itself is active
        const bStatus = item.badge.status;
        const isBadgeActive =
          bStatus === true ||
          (bStatus as any) === 1 ||
          String(bStatus) === '1' ||
          String(bStatus).toLowerCase() === 'true';

        if (isBadgeActive) {
          badgeName = item.badge.name;
        }
      }

      if (badgeName) {
        if (!groups[badgeName]) {
          groups[badgeName] = [];
        }
        groups[badgeName].push(item);
      }
    });

    return groups;
  }, [activeItems]);

  const badgeKeys = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => {
      const itemA = groupedItems[a][0];
      const itemB = groupedItems[b][0];
      const prioA = itemA?.badge?.priority ?? 0;
      const prioB = itemB?.badge?.priority ?? 0;
      if (prioB !== prioA) return prioB - prioA;
      return a.localeCompare(b);
    });
  }, [groupedItems]);

  // Group products by category name (Category, Sub Category, or Sub-Sub Category)
  const groupedByCategories = useMemo(() => {
    const groups: Record<string, any[]> = {};
    activeItems.forEach(item => {
      let groupName = 'Curated Runway';
      if (item.category?.name) {
        groupName = item.category.name;
      } else if (item.category_id && categories && categories.length > 0) {
        const cat = categories.find(c => c.id === item.category_id);
        if (cat) {
          groupName = cat.name;
        }
      }
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(item);
    });
    return groups;
  }, [activeItems, categories]);

  const categoryKeys = useMemo(() => {
    return Object.keys(groupedByCategories).sort((aName, bName) => {
      const catA = categories.find(c => c.name.toUpperCase() === aName.toUpperCase());
      const catB = categories.find(c => c.name.toUpperCase() === bName.toUpperCase());
      const prioA = (catA?.priority === undefined || catA?.priority === null || catA?.priority === 0) ? Infinity : catA.priority;
      const prioB = (catB?.priority === undefined || catB?.priority === null || catB?.priority === 0) ? Infinity : catB.priority;
      if (prioA !== prioB) return prioA - prioB;
      return aName.localeCompare(bName);
    });
  }, [groupedByCategories, categories]);

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-10">
        <SkeletonGrid count={8} />
      </div>
    );
  }

  if (activeItems.length === 0) {
    return (
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
            Collection is empty
          </TextSp>
          <TextSp
            as="p"
            size="2xs"
            weight="semibold"
            color="text-stone-400"
            className="mt-1"
          >
            Check back later for newly tagged items!
          </TextSp>
        </div>
      </div>
    );
  }

  // Fallback if no items have specific badges/sale tags - show categories
  if (badgeKeys.length === 0) {
    return (
      <div className="w-full max-w-full overflow-hidden">
        {categoryKeys.map((catName) => (
          <BadgeGridRow
            key={catName}
            badgeName={catName}
            items={groupedByCategories[catName]}
            ownerUserId={ownerUserId}
            stores={stores}
            storeName={storeName}
            onNavigate={onNavigate}
            addToCart={addToCart}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            gridCols={gridCols}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      {badgeKeys.map((badgeName) => (
        <BadgeGridRow
          key={badgeName}
          badgeName={badgeName}
          items={groupedItems[badgeName]}
          ownerUserId={ownerUserId}
          stores={stores}
          storeName={storeName}
          onNavigate={onNavigate}
          addToCart={addToCart}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          gridCols={gridCols}
        />
      ))}
    </div>
  );
};

