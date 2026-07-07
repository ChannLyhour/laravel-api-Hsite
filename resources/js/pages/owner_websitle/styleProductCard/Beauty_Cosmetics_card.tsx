import React, { useState } from 'react';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import type { Root2 } from '@/api/owner/categories';

export interface ProductCardProps {
     product: Root2;
     onAddToCart?: (product: Root2, selectedVariantId?: number) => void;
     onBuyNow?: (product: Root2, selectedVariantId?: number) => void;
     isWishlisted?: boolean;
     onWishlistToggle?: (productId: number) => void;
}

export const BeautyCosmeticsCard: React.FC<ProductCardProps> = ({
     product,
     onAddToCart,
     onBuyNow,
     isWishlisted = false,
     onWishlistToggle,
}) => {
     const [wishlist, setWishlist] = useState(isWishlisted);

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
               toast.success(!wishlist ? 'Added to wishlist!' : 'Removed from wishlist!');
          }
     };

     const handleAddToCart = () => {
          if (onAddToCart) {
               onAddToCart(product);
          } else {
               toast.success(`Added ${product.name} to bag!`);
          }
     };

     const handleBuyNow = () => {
          if (onBuyNow) {
               onBuyNow(product);
          } else {
               toast.success(`Proceeding to checkout with ${product.name}!`);
          }
     };

     return (
          <div className="product-card group bg-white border border-rose-100/60 rounded-[5px] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-lg w-full max-w-sm mx-auto flex flex-col justify-between font-sans">

               {/* Image Header */}
               <div className="relative overflow-hidden aspect-[4/3] bg-rose-50/10 shrink-0 border-b border-rose-50/50">
                    <img
                         src={product.display_image || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80'}
                         alt={product.name}
                         className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />

                    {/* Premium Badge */}
                    {product.is_special && (
                         <div className="absolute top-2.5 left-2.5 bg-white text-[9px] font-bold px-2 py-0.5 rounded-[3px] shadow-xs flex items-center gap-1 select-none border border-rose-100">
                              <span className="text-rose-500">✨</span>
                              <span className="text-rose-600 uppercase tracking-widest">Elite</span>
                         </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                         onClick={handleWishlist}
                         className="absolute top-2.5 right-2.5 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-xs hover:bg-rose-50/50 hover:scale-105 active:scale-95 transition-all border-none cursor-pointer"
                    >
                         <FiHeart
                              className={`w-3.5 h-3.5 transition-colors ${wishlist ? 'text-rose-450 fill-rose-450' : 'text-slate-350 group-hover:text-rose-450'
                                   }`}
                         />
                    </button>
               </div>

               {/* Content Body */}
               <div className="p-3 flex-grow flex flex-col justify-between">
                    <div>
                         {/* Product Name */}
                         <h3 className="font-extrabold text-sm leading-snug text-slate-800 line-clamp-1 min-h-[1.25rem] tracking-tight group-hover:text-rose-500 transition-colors">
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
                                        <span className="text-[8px] bg-rose-50 text-rose-550 px-1 py-0.2 rounded-[3px] font-bold border border-rose-100">
                                             -{discount}%
                                        </span>
                                   </>
                              )}
                         </div>

                    </div>

                    {/* Footer info & Actions */}
                    <div className="mt-3">
                         <div className="flex gap-2">
                              <button
                                   onClick={handleAddToCart}
                                   className="flex-1 bg-rose-500 hover:bg-rose-600 active:scale-98 transition-all text-white font-extrabold py-2 rounded-[3px] text-[10px] flex items-center justify-center gap-1 border-none cursor-pointer uppercase tracking-wider shadow-xs"
                              >
                                   <FiShoppingBag className="w-3 h-3" />
                                   <span>Add to Bag</span>
                              </button>
                              <button
                                   onClick={handleBuyNow}
                                   className="flex-1 bg-white hover:bg-rose-50 active:scale-98 transition-all text-rose-500 font-extrabold py-2 rounded-[3px] text-[10px] border border-rose-200 cursor-pointer uppercase tracking-wider"
                              >
                                   <span>Buy Now</span>
                              </button>
                         </div>
                    </div>

               </div>
          </div>
     );
};
