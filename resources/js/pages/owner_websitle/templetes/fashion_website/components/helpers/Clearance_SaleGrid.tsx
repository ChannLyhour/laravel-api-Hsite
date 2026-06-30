import React from 'react';
import { FiPackage, FiClock, FiArrowRight } from 'react-icons/fi';
import type { StoreRow } from '@/api/owner/stores';
import { CardProduct } from './CardProduct';
import { SkeletonCard } from './SkeletonSt';

interface Clearance_SaleGridProps {
  sale?: any; // ClearanceSaleRow
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

export const Clearance_SaleGrid: React.FC<Clearance_SaleGridProps> = (props) => {
  if (props.isLoading) {
    return (
      <div className="space-y-5 text-left animate-pulse">
        {/* Sale header placeholder */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-250/20 pb-3">
          <div className="space-y-1 w-1/3">
            <div className="h-5 bg-stone-200 dark:bg-stone-850 rounded w-full" />
            <div className="h-3 bg-stone-200 dark:bg-stone-850 rounded w-2/3" />
          </div>
        </div>
        {/* Products grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-10">
          {Array.from({ length: 5 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    );
  }
  return <Clearance_SaleGridInner {...props} />;
};

const Clearance_SaleGridInner: React.FC<Clearance_SaleGridProps> = ({
  sale,
  displayItems = [],
  ownerUserId,
  stores,
  storeName = '',
  onNavigate,
  addToCart,
  favorites = {},
  toggleFavorite,
}) => {
  const products = React.useMemo(() => {
    const rawProducts = sale.products || [];
    return [...rawProducts].sort((a, b) => {
      const idA = a.pivot?.id ?? 0;
      const idB = b.pivot?.id ?? 0;
      if (idA !== idB) return idA - idB;
      return a.id - b.id;
    });
  }, [sale.products]);

  const getProductClearancePrice = (product: any) => {
    const pivot = product.pivot;
    const basePrice = parseFloat(String(product.price)) || 0;
    if (!pivot) return { price: basePrice, comparePrice: null, discountLabel: null };
    const discAmt = parseFloat(String(pivot.discount_amount)) || 0;
    if (pivot.discount_type === 'percent') {
      const newPrice = basePrice * (1 - discAmt / 100);
      return { price: newPrice, comparePrice: basePrice, discountLabel: `-${discAmt}%` };
    }
    // flat
    const newPrice = Math.max(0, basePrice - discAmt);
    return { price: newPrice, comparePrice: basePrice, discountLabel: `-$${discAmt.toFixed(2)}` };
  };

  if (products.length === 0) return null;

  return (
    <div className="space-y-5 text-left">
      {/* Sale header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-250/20 pb-3">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide flex items-center gap-2 select-none">
            <FiPackage className="text-[#E61E25] w-4 h-4" />
            {sale.title}
          </h3>
          {(sale.start_date || sale.end_date) && (
            <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold select-none">
              <FiClock className="w-3 h-3" />
              <span>{sale.start_date.slice(0, 10)}</span>
              <span className="text-stone-300">→</span>
              <span>{sale.end_date.slice(0, 10)}</span>
            </div>
          )}
        </div>
        {sale.discount_type === 'flat' && sale.discount_amount && (
          <div className="self-start sm:self-center px-3 py-1 bg-[#E61E25]/10 border border-[#E61E25]/20 rounded-[3px] text-[#E61E25] text-[10px] font-black uppercase tracking-wider select-none">
            {sale.discount_amount_type === 'percent'
              ? `${sale.discount_amount}% OFF all items`
              : `$${Number(sale.discount_amount).toFixed(2)} OFF all items`}
          </div>
        )}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-10">
        {products.slice(0, 10).map((product: any) => {
          const { price, comparePrice } = getProductClearancePrice(product);
          const isFavorited = !!favorites[String(product.id)];
          const fullProduct = displayItems.find(item => item.id === product.id) || product;
          return (
            <CardProduct
              key={product.id}
              item={fullProduct}
              ownerUserId={ownerUserId}
              stores={stores}
              storeName={storeName}
              onNavigate={onNavigate}
              addToCart={addToCart}
              customPrice={price}
              customComparePrice={comparePrice}
              isFavorited={isFavorited}
              onToggleFavorite={toggleFavorite}
            />
          );
        })}
      </div>
    </div>
  );
};
