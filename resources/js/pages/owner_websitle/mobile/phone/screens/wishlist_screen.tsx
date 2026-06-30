import React, { useState } from 'react';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import type { Root2, ProductVariant } from '@/api/owner/categories';

interface WishlistScreenProps {
  isDarkTheme: boolean;
  activeTheme: {
    primaryBg: string;
    primaryText: string;
    primaryHover: string;
    shadowClass: string;
  };
  wishlist: number[];
  categories: any[];
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  topSellingItems: Root2[];
  handleToggleWishlist: (e: React.MouseEvent, id: number) => void;
  handleAddToCart: (product: Root2, variant?: ProductVariant | null) => void;
  handleOpenDetail: (product: Root2) => void;
  getProductImage: (product: Root2, variant?: ProductVariant | null) => string;
  locale: 'en' | 'km';
  getTranslation: (item: Root2, currentLocale?: 'en' | 'km') => { name: string; description: string };
}

export const WishlistScreen: React.FC<WishlistScreenProps> = ({
  isDarkTheme,
  activeTheme,
  wishlist,
  categories,
  selectedCategory,
  setSelectedCategory,
  topSellingItems,
  handleToggleWishlist,
  handleAddToCart,
  handleOpenDetail,
  getProductImage,
  locale,
  getTranslation,
}) => {
  // Local state to keep track of variant selection for each product card
  const [selectedVariants, setSelectedVariants] = useState<Record<number, ProductVariant>>({});

  const getVariantLabel = (variantOrSku: any, baseSku?: string) => {
    if (!variantOrSku) return 'Standard';
    if (typeof variantOrSku === 'object') {
      const attributeValues = variantOrSku.attribute_values;
      if (attributeValues && attributeValues.length > 0) {
        return attributeValues.map((av: any) => {
          const attrName = av.attribute?.name || '';
          const attrVal = av.value?.split('|')[0] || '';
          if (attrName && attrVal) {
            return `${attrName}: ${attrVal}`;
          }
          return attrVal || attrName;
        }).join(', ');
      }
      variantOrSku = variantOrSku.variant_sku;
    }
    const sku = String(variantOrSku);
    if (baseSku && sku.startsWith(baseSku)) {
      const suffix = sku.replace(baseSku, '').replace(/^-/, '');
      if (suffix) return suffix.replace(/-/g, ' ');
    }
    const parts = sku.split('-');
    if (parts.length > 2) {
      return parts.slice(2).join(' ');
    }
    return sku;
  };

  return (
    <div className="p-4 space-y-5 flex-grow flex flex-col pb-20 animate-fade-in overflow-hidden">
      <h2 className={`text-base font-black flex items-center space-x-2 shrink-0 ${isDarkTheme ? 'text-white' : 'text-slate-905'}`}>
        <FiHeart className="text-rose-500 fill-current" />
        <span>My Wishlist ({wishlist.length})</span>
      </h2>

      {/* Wishlist category filter swiper */}
      {wishlist.length > 0 && (
        <div className="flex space-x-3.5 overflow-x-auto pb-1.5 scrollbar-none select-none shrink-0 border-b border-slate-100/10">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.name;
            return (
              <button
                key={`wishlist-cat-${c.name}`}
                onClick={() => setSelectedCategory(c.name)}
                className={`px-3.5 py-1.5 rounded-[7px] text-[9px] font-black uppercase tracking-wider shrink-0 transition-all duration-200 cursor-pointer ${isSelected
                    ? `${activeTheme.primaryBg} text-white shadow-3xs`
                    : isDarkTheme
                      ? 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700/50'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-slate-900 border border-slate-200/50'
                  }`}
              >
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-grow pb-8 scrollbar-none">
          {topSellingItems
            .filter(x => wishlist.includes(x.id))
            .filter(item => {
              if (selectedCategory === 'All') return true;
              const categoryLower = selectedCategory.toLowerCase();
              return item.name.toLowerCase().includes(categoryLower) ||
                (item.description && item.description.toLowerCase().includes(categoryLower)) ||
                (item.sku || '').toLowerCase().startsWith(categoryLower.substring(0, 3));
            })
            .map((item) => {
              const activeVariant = selectedVariants[item.id] || (item.variants && item.variants.length > 0 ? item.variants[0] : null);
              const price = activeVariant ? parseFloat(activeVariant.retail_price) : parseFloat(item.price);
              const { name: itemDisplayName } = getTranslation(item, locale);
              const variantLabel = activeVariant
                ? ` (${getVariantLabel(activeVariant, item.sku)})`
                : '';

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className={`rounded-[7px] p-3 flex flex-col justify-between border cursor-pointer relative ${isDarkTheme ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'
                    }`}
                >
                  <button
                    onClick={(e) => handleToggleWishlist(e, item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-[7px] bg-rose-50 text-rose-500 z-10 cursor-pointer"
                  >
                    <FiHeart className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <div className="h-24 w-full overflow-hidden rounded-[7px] bg-slate-50 border border-slate-100/10">
                    <img src={getProductImage(item, activeVariant)} alt={itemDisplayName} className="w-full h-full object-cover" />
                  </div>

                  <div className="pt-2 space-y-1">
                    <h4 className={`text-xs font-black line-clamp-1 ${isDarkTheme ? 'text-white' : 'text-slate-850'}`}>
                      {itemDisplayName}{variantLabel}
                    </h4>
                    <span className={`text-xs font-black block ${activeTheme.primaryText}`}>${price.toFixed(2)}</span>

                    {/* Mini Variants selection pills directly inside Wishlist Card */}
                    {item.variants && item.variants.length > 0 && (
                      <div className="pt-1.5 pb-1 space-y-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block">Custom size:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.variants.map((v) => {
                            const isSelected = activeVariant?.variant_sku === v.variant_sku;
                            return (
                              <button
                                key={v.variant_sku}
                                onClick={() => {
                                  setSelectedVariants(prev => ({ ...prev, [item.id]: v }));
                                }}
                                className={`px-1.5 py-0.5 rounded-[3px] text-[7px] font-extrabold border transition-all cursor-pointer ${isSelected
                                    ? `${activeTheme.primaryBg} border-transparent text-white`
                                    : isDarkTheme
                                      ? 'bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-700'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                              >
                                {getVariantLabel(v, item.sku)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item, activeVariant);
                      }}
                      className={`w-full py-1.5 rounded-[7px] text-[9px] font-black text-white mt-1.5 cursor-pointer flex items-center justify-center space-x-1.5 ${activeTheme.primaryBg}`}
                    >
                      <FiShoppingCart className="w-3 h-3" />
                      <span>Add To Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="text-center py-20 space-y-3 flex-grow flex flex-col justify-center items-center">
          <FiHeart className="text-slate-400 w-12 h-12 stroke-[1.5]" />
          <div>
            <h4 className={`text-sm font-black ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>Your Wishlist is Empty</h4>
            <p className="text-slate-400 text-[10px] font-semibold mt-1">Tap hearts on foods to save items here!</p>
          </div>
        </div>
      )}
    </div>
  );
};
