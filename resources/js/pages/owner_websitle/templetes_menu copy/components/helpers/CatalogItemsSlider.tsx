import React from 'react';
import type { StoreRow } from '@/api/owner/stores';
import { CardProduct } from './CardProduct';

interface CatalogItemsSliderProps {
  items: any[];
  ownerUserId?: number | string;
  stores?: StoreRow;
  storeName: string;
  onNavigate?: (to: string) => void;
  addToCart: (item: any) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string, name: string) => void;
}

export const CatalogItemsSlider: React.FC<CatalogItemsSliderProps> = ({
  items,
  ownerUserId,
  stores,
  storeName,
  onNavigate,
  addToCart,
  favorites,
  toggleFavorite,
}) => {
  return (
    <>
      {items.map((item, idx) => (
        <div 
          key={item.id} 
          className="w-[260px] sm:w-[290px] md:w-[305px] shrink-0 animate-fade-in-up"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <CardProduct
            item={item}
            ownerUserId={ownerUserId}
            stores={stores}
            storeName={storeName}
            onNavigate={onNavigate}
            addToCart={addToCart}
            isFavorited={!!favorites[String(item.id)]}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      ))}
    </>
  );
};


