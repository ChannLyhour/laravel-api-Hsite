import React, { useMemo } from 'react';
import type { StoreRow } from '@/api/owner/stores';
import { CardProduct } from './CardProduct';
import { useOwnerURL } from '@/app/OwnerURL';

interface ProductBagdeGridProps {
  items: any[];
  ownerUserId?: number | string;
  stores?: StoreRow;
  storeName: string;
  onNavigate?: (to: string) => void;
  addToCart: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
  favorites?: Record<string, boolean>;
  toggleFavorite?: (id: string, name: string) => void;
}

interface BadgeSliderRowProps {
  badgeName: string;
  items: any[];
  ownerUserId?: number | string;
  stores?: StoreRow;
  storeName: string;
  onNavigate?: (to: string) => void;
  addToCart: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
  favorites?: Record<string, boolean>;
  toggleFavorite?: (id: string, name: string) => void;
}

const getHeaderTextColor = (name: string) => {
  switch (name.toLowerCase()) {
    case 'new':
    case 'new arrival':
      return 'text-emerald-600';
    case 'sale':
    case 'discount':
      return 'text-rose-600';
    case 'trending':
    case 'hot':
      return 'text-amber-600';
    case 'popular':
    case 'best seller':
      return 'text-violet-600';
    default:
      return 'text-stone-900';
  }
};

const BadgeSliderRow: React.FC<BadgeSliderRowProps> = ({
  badgeName,
  items,
  ownerUserId,
  stores: _stores,
  storeName,
  onNavigate,
  addToCart,
  favorites = {},
  toggleFavorite,
}) => {
  const { buildLink } = useOwnerURL(
    ownerUserId || _stores?.created_by || _stores?.owner_id || _stores?.hashid,
    storeName || _stores?.store_name
  );

  return (
    <div className="space-y-6 w-full text-left">
      {/* Header (Title on Left, SHOP MORE on Right) */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/40">
        <h2 className={`text-xs sm:text-sm font-black tracking-widest uppercase font-sans ${getHeaderTextColor(badgeName)}`}>
          {badgeName}
        </h2>
        <a
          href={buildLink('/menu')}
          onClick={(e) => {
            if (onNavigate) {
              e.preventDefault();
              onNavigate(buildLink('/menu'));
            }
          }}
          className="text-stone-900 hover:text-stone-600 text-[10px] font-black uppercase tracking-widest no-underline transition-colors cursor-pointer"
        >
          Shop More
        </a>
      </div>

      {/* Product Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-10 w-full">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <CardProduct
              item={item}
              ownerUserId={ownerUserId}
              storeName={storeName}
              onNavigate={onNavigate}
              addToCart={addToCart}
              isFavorited={!!favorites[String(item.id)]}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProductBagdeGrid: React.FC<ProductBagdeGridProps> = ({
  items,
  ownerUserId,
  stores,
  storeName,
  onNavigate,
  addToCart,
  favorites = {},
  toggleFavorite,
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

  // Group products dynamically by their badges
  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};

    activeItems.forEach((item) => {
      let badgeName = '';
      if (item.badge && item.badge.name) {
        // Only group by badge if the badge itself is active
        const bStatus = item.badge.status;
        const isBadgeActive = 
          bStatus !== false && 
          bStatus !== 'false' && 
          bStatus !== 0 && 
          bStatus !== '0' && 
          bStatus !== 'inactive' && 
          bStatus !== 'Inactive';
        
        if (isBadgeActive) {
          badgeName = item.badge.name;
        }
      }
      
      // Fallback: If no active badge, check if item is on sale
      if (!badgeName) {
        const priceVal = parseFloat(item.price) || 0;
        const comparePrice = item.compare_at_price ? parseFloat(item.compare_at_price) : 0;
        if (comparePrice > priceVal) {
          badgeName = 'Sale';
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

  if (activeItems.length === 0) {
    return (
      <div className="text-center py-20 space-y-3 border border-dashed border-stone-200 rounded-[4px] w-full">
        <span className="text-3xl">🥗</span>
        <div>
          <h4 className="font-extrabold text-stone-800 text-xs uppercase tracking-wider">
            No dishes available
          </h4>
          <p className="text-stone-400 text-2xs font-semibold mt-1">
            Check back later for newly added culinary items!
          </p>
        </div>
      </div>
    );
  }

  // Fallback if no items have specific badges/sale tags - show a general section
  if (badgeKeys.length === 0) {
    return (
      <BadgeSliderRow
        badgeName="Chef's Specials"
        items={activeItems}
        ownerUserId={ownerUserId}
        stores={stores}
        storeName={storeName}
        onNavigate={onNavigate}
        addToCart={addToCart}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />
    );
  }

  return (
    <div className="space-y-16 sm:space-y-20 w-full">
      {badgeKeys.map((badgeName) => (
        <BadgeSliderRow
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
        />
      ))}
    </div>
  );
};
