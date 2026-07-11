import React from 'react';
import type { StoreRow } from '@/api/owner/stores';
import { CardProduct } from './CardProduct';

interface BestSellersGridProps {
  items: any[];
  ownerUserId?: number | string;
  stores?: StoreRow;
  storeName: string;
  onNavigate?: (to: string) => void;
  addToCart: (item: any) => void;
  favorites?: Record<string, boolean>;
  toggleFavorite?: (id: string, name: string) => void;
}

export const BestSellersGrid: React.FC<BestSellersGridProps> = ({
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-10 flex-grow">
      {items.map((item, idx) => {


        return (
          <div key={item.id}>
            <CardProduct
              item={item}
              ownerUserId={ownerUserId}
              stores={stores}
              storeName={storeName}
              onNavigate={onNavigate}
              addToCart={addToCart}
              isFavorited={favorites ? !!favorites[String(item.id)] : undefined}
              onToggleFavorite={toggleFavorite}
              aosDelay={(idx % 4) * 100}
            />
          </div>
        );
      })}
    </div>
  );
};


