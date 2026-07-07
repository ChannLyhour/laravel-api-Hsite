import React, { useState } from 'react';
import { FiHeart, FiShoppingCart, FiPlus, FiMinus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import type { Root2 } from '@/api/owner/categories';

export interface ProductCardProps {
  product: Root2;
  onAddToCart?: (product: Root2, quantity?: number, selectedVariantId?: number) => void;
  onBuyNow?: (product: Root2, selectedVariantId?: number) => void;
  isWishlisted?: boolean;
  onWishlistToggle?: (productId: number) => void;
}

export const SupermarketsCardGrocery: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onBuyNow,
  isWishlisted = false,
  onWishlistToggle,
}) => {
  const [wishlist, setWishlist] = useState(isWishlisted);
  const [quantity, setQuantity] = useState(1);

  const discount = product.compare_at_price
    ? Math.round(
        ((parseFloat(product.compare_at_price) - parseFloat(product.price)) /
          parseFloat(product.compare_at_price)) *
          100
      )
    : 0;

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(!wishlist);
    if (onWishlistToggle) {
      onWishlistToggle(product.id);
    } else {
      toast.success(!wishlist ? 'Added to shopping list!' : 'Removed from shopping list!');
    }
  };

  const handleQtyChange = (val: number) => {
    setQuantity(Math.max(1, quantity + val));
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
    } else {
      toast.success(`Added ${quantity}x ${product.name} to basket!`);
    }
  };

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(product);
    } else {
      toast.success(`Checking out with ${quantity}x ${product.name}!`);
    }
  };

  return (
    <div className="product-card group bg-white border border-emerald-100/60 rounded-[5px] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-lg w-full max-w-sm mx-auto flex flex-col justify-between font-sans">
      
      {/* Image Header */}
      <div className="relative overflow-hidden aspect-[4/3] bg-emerald-50/10 shrink-0 border-b border-emerald-50/50">
        <img
          src={product.display_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
        />

        {/* Fresh Badge */}
        {product.is_special && (
          <div className="absolute top-2.5 left-2.5 bg-white text-[9px] font-bold px-2 py-0.5 rounded-[3px] shadow-xs flex items-center gap-1 select-none border border-emerald-100">
            <span className="text-emerald-500">🍏</span>
            <span className="text-emerald-700 uppercase tracking-widest">Fresh</span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-xs hover:bg-emerald-50/50 hover:scale-105 active:scale-95 transition-all border-none cursor-pointer"
        >
          <FiHeart
            className={`w-3.5 h-3.5 transition-colors ${
              wishlist ? 'text-emerald-600 fill-emerald-600' : 'text-slate-350 group-hover:text-emerald-600'
            }`}
          />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-3 flex-grow flex flex-col justify-between">
        
        <div>
          {/* Brand & Category */}
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">
              {product.brand?.name || 'GROCERY • FRESH PRODUCE'}
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase">
              {product.sku || 'Fresh'}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-extrabold text-sm leading-snug text-slate-800 line-clamp-1 min-h-[1.25rem] tracking-tight group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>

          {/* Pricing Block */}
          <div className="flex items-baseline gap-1.5 mt-1 mb-2">
            <span className="text-base font-black text-slate-900">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price) && (
              <>
                <span className="text-[10px] text-slate-400 line-through font-semibold">
                  ${parseFloat(product.compare_at_price).toFixed(2)}
                </span>
                <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 py-0.2 rounded-[3px] font-bold border border-emerald-100">
                  -{discount}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Footer info & Actions */}
        <div className="mt-3">
          {/* Quantity Counter Block */}
          <div className="flex items-center justify-between gap-2 bg-slate-50 p-1.5 rounded-[3px] border border-slate-200/60 mb-2 select-none">
            <span className="text-[9px] font-black text-slate-550 uppercase tracking-wider pl-1">Qty</span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleQtyChange(-1)}
                className="w-5.5 h-5.5 rounded-[3px] bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer font-bold"
              >
                <FiMinus className="w-2.5 h-2.5" />
              </button>
              <span className="font-extrabold text-[11px] text-slate-800 w-4 text-center">{quantity}</span>
              <button
                onClick={() => handleQtyChange(1)}
                className="w-5.5 h-5.5 rounded-[3px] bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer font-bold"
              >
                <FiPlus className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all text-white font-extrabold py-2 rounded-[3px] text-[10px] flex items-center justify-center gap-1 border-none cursor-pointer uppercase tracking-wider shadow-xs"
            >
              <FiShoppingCart className="w-3 h-3" />
              <span>Add to Basket</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-white hover:bg-emerald-50/50 active:scale-98 transition-all text-emerald-600 font-extrabold py-2 rounded-[3px] text-[10px] border border-emerald-200 cursor-pointer uppercase tracking-wider"
            >
              <span>Buy Now</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
