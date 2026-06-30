import React from 'react';
import { FiArrowLeft, FiHeart, FiStar, FiShoppingCart } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import type { Root2, ProductVariant } from '@/api/owner/categories';

interface DetailScreenProps {
  selectedProduct: Root2;
  setSelectedProduct: (prod: Root2 | null) => void;
  selectedVariant: ProductVariant | null;
  setSelectedVariant: (v: ProductVariant | null) => void;
  wishlist: number[];
  handleToggleWishlist: (e: React.MouseEvent, id: number) => void;
  handleAddToCart: (product: Root2, variant?: ProductVariant | null) => void;
  getProductImage: (product: Root2, variant?: ProductVariant | null) => string;
  getProductPrice: (product: Root2, variant?: ProductVariant | null) => number;
  getVariantLabel: (variantOrSku: any, baseSku?: string) => string;
  locale: 'en' | 'km';
  getTranslation: (item: Root2, currentLocale?: 'en' | 'km') => { name: string; description: string };
  isDarkTheme: boolean;
  activeTheme: {
    primaryBg: string;
    primaryText: string;
    primaryHover: string;
    shadowClass: string;
  };
  coupons?: any[];
}

export const DetailScreen: React.FC<DetailScreenProps> = ({
  selectedProduct,
  setSelectedProduct,
  selectedVariant,
  setSelectedVariant,
  wishlist,
  handleToggleWishlist,
  handleAddToCart,
  getProductImage,
  getProductPrice,
  getVariantLabel,
  locale,
  getTranslation,
  isDarkTheme,
  activeTheme,
  coupons = [],
}) => {
  // 1. Group all attributes from the product's variants
  const attributeGroups: Record<string, { value: string; isColor: boolean; colorHex?: string }[]> = {};

  selectedProduct.variants?.forEach((v) => {
    v.attribute_values?.forEach((av: any) => {
      const attrName = av.attribute?.name || 'Option';
      const rawVal = av.value?.split('|')[0] || '';

      if (!attrName || !rawVal) return;

      if (!attributeGroups[attrName]) {
        attributeGroups[attrName] = [];
      }

      const exists = attributeGroups[attrName].some((x) => x.value === rawVal);
      if (!exists) {
        const isColorName = attrName.toLowerCase().includes('color') || attrName.toLowerCase().includes('colour');
        const startsWithHash = rawVal.startsWith('#');
        const isColor = isColorName || startsWithHash;

        let colorHex = startsWithHash ? rawVal : undefined;
        if (isColor && !colorHex) {
          const lowerVal = rawVal.toLowerCase();
          const colorMap: Record<string, string> = {
            black: '#1E293B',
            white: '#FFFFFF',
            red: '#EF4444',
            blue: '#3B82F6',
            green: '#22C55E',
            purple: '#A855F7',
            pink: '#EC4899',
            yellow: '#EAB308',
            orange: '#F97316',
            gray: '#64748B',
            grey: '#64748B',
            brown: '#78350F',
          };
          colorHex = colorMap[lowerVal] || lowerVal;
        }

        attributeGroups[attrName].push({
          value: rawVal,
          isColor,
          colorHex,
        });
      }
    });
  });

  const hasAttributeValues = Object.keys(attributeGroups).length > 0;
  if (!hasAttributeValues && selectedProduct.variants && selectedProduct.variants.length > 0) {
    attributeGroups['Size'] = selectedProduct.variants.map((v) => {
      const label = getVariantLabel(v, selectedProduct.sku);
      return {
        value: label,
        isColor: false,
      };
    });
  }

  const getSelectedValueForGroup = (groupName: string): string | null => {
    if (!selectedVariant) return null;
    if (selectedVariant.attribute_values && selectedVariant.attribute_values.length > 0) {
      const found = selectedVariant.attribute_values.find((av: any) => av.attribute?.name === groupName);
      if (found) return found.value?.split('|')[0] || null;
    }
    return getVariantLabel(selectedVariant, selectedProduct.sku);
  };

  const handleSelectAttributeValue = (groupName: string, value: string) => {
    if (!selectedProduct.variants) return;

    const targetVariants = selectedProduct.variants.filter((v) => {
      if (!v.attribute_values || v.attribute_values.length === 0) {
        return getVariantLabel(v, selectedProduct.sku) === value;
      }
      return v.attribute_values.some((av: any) => av.attribute?.name === groupName && (av.value?.split('|')[0] === value));
    });

    if (targetVariants.length > 0) {
      let bestMatch = targetVariants[0];
      let maxMatches = 0;

      targetVariants.forEach((v) => {
        let matches = 0;
        v.attribute_values?.forEach((av: any) => {
          const name = av.attribute?.name;
          const val = av.value?.split('|')[0];
          if (name !== groupName && getSelectedValueForGroup(name) === val) {
            matches++;
          }
        });
        if (matches > maxMatches) {
          maxMatches = matches;
          bestMatch = v;
        }
      });

      setSelectedVariant(bestMatch);
    }
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col animate-slide-up ${isDarkTheme ? 'bg-[#0B0F19] text-white' : 'bg-white text-slate-800'
      }`}>
      {/* Top Action Row */}
      <div className="p-4 flex justify-between items-center shrink-0 border-b border-slate-100/10">
        <button
          onClick={() => setSelectedProduct(null)}
          className={`p-2 rounded-[7px] cursor-pointer transition-colors ${isDarkTheme ? 'bg-slate-800/80 text-slate-200 hover:bg-slate-700' : 'bg-slate-105 text-slate-700 hover:bg-slate-200'
            }`}
        >
          <FiArrowLeft className="w-4.5 h-4.5" />
        </button>
        <span className={`text-xs font-black uppercase tracking-wider ${activeTheme.primaryText}`}>Food Details</span>
        <button
          onClick={(e) => handleToggleWishlist(e, selectedProduct.id)}
          className={`p-2 rounded-[7px] cursor-pointer transition-colors ${wishlist.includes(selectedProduct.id)
            ? 'bg-rose-50 text-rose-500'
            : isDarkTheme ? 'bg-slate-800/80 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
        >
          <FiHeart className={`w-4.5 h-4.5 ${wishlist.includes(selectedProduct.id) ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Scrollable details */}
      <div className="flex-grow overflow-y-auto p-5 space-y-5">
        {/* Large visual image container */}
        <div className={`relative h-56 rounded-[7px] overflow-hidden border ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'} shadow-sm`}>
          <img
            src={getProductImage(selectedProduct, selectedVariant)}
            alt={getTranslation(selectedProduct, locale).name}
            className="w-full h-full object-cover"
          />

          {/* Glowing absolute badge */}
          <span className={`absolute top-3 left-3 px-3 py-1 rounded-[7px] text-[9px] font-black uppercase tracking-wider text-white shadow-md ${activeTheme.primaryBg}`}>
            Gourmet Chef Pick
          </span>
        </div>

        {/* Info titles */}
        <div className="space-y-2">
          <h3 className={`text-lg sm:text-xl font-black leading-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            {getTranslation(selectedProduct, locale).name}
          </h3>

          <div className="flex items-center space-x-3">
            <div className="flex items-center text-amber-400">
              <FiStar className="w-3.5 h-3.5 fill-current" />
              <span className={`text-xs font-black ml-1 ${isDarkTheme ? 'text-slate-200' : 'text-slate-800'}`}>4.9</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cooking Time: 25 Mins</span>
          </div>
        </div>

        {/* Pricing Block */}
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-black ${activeTheme.primaryText}`}>
            ${getProductPrice(selectedProduct, selectedVariant).toFixed(2)}
          </span>
          <span className="text-slate-400 text-xs line-through font-semibold">
            ${(getProductPrice(selectedProduct, selectedVariant) * 1.25).toFixed(2)}
          </span>
        </div>

        {/* Variants selection tiles */}
        {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(attributeGroups).map(([groupName, values]) => {
              const selectedVal = getSelectedValueForGroup(groupName);
              const isColorGroup = values.some(v => v.isColor);

              return (
                <div key={groupName} className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{groupName}</span>

                  {isColorGroup ? (
                    /* Render beautiful swatches for color customizations */
                    <div className="flex flex-wrap gap-3">
                      {values.map((v) => {
                        const isSelected = selectedVal === v.value;
                        return (
                          <button
                            key={v.value}
                            type="button"
                            onClick={() => handleSelectAttributeValue(groupName, v.value)}
                            className={`w-6 h-6 rounded-full cursor-pointer relative transition-all duration-200 shadow-2xs hover:scale-105 active:scale-95 flex items-center justify-center border ${isSelected
                                ? `ring-2 ring-offset-2 ${isDarkTheme ? 'ring-offset-[#0B0F19]' : 'ring-offset-white'} ring-orange-500 border-transparent`
                                : isDarkTheme ? 'border-slate-800' : 'border-slate-200'
                              }`}
                            style={{ backgroundColor: v.colorHex || '#CCCCCC' }}
                            title={v.value}
                          >
                            {/* Subtle checkdot inside selected swatch */}
                            {isSelected && (
                              <span className={`w-1.5 h-1.5 rounded-full ${v.colorHex?.toLowerCase() === '#ffffff' || v.value.toLowerCase() === 'white'
                                  ? 'bg-slate-850'
                                  : 'bg-white'
                                }`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Render premium selection pills for capacity, size, and standard text attributes */
                    <div className="flex flex-wrap gap-2">
                      {values.map((v) => {
                        const isSelected = selectedVal === v.value;
                        return (
                          <button
                            key={v.value}
                            type="button"
                            onClick={() => handleSelectAttributeValue(groupName, v.value)}
                            className={`px-3.5 py-1.5 rounded-[7px] text-[10px] font-black tracking-wide border transition-all duration-200 cursor-pointer ${isSelected
                                ? `${activeTheme.primaryBg} border-transparent text-white shadow-2xs`
                                : isDarkTheme
                                  ? 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                          >
                            {v.value}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Description paragraphs */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Chef Description:</span>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            {getTranslation(selectedProduct, locale).description || 'Delicately crafted culinary sensation curated carefully using farm-fresh, organic local produce and fresh standard ingredients.'}
          </p>
        </div>

        {/* Available Vouchers (Mobile Version) */}
        {coupons.length > 0 && (
          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Available Vouchers:</span>
            <div className="space-y-2">
              {coupons.slice(0, 2).map((coupon: any) => (
                <div
                  key={coupon.id}
                  className={`flex items-center p-3 rounded-[7px] border ${isDarkTheme ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeTheme.primaryBg} text-white`}>
                    <span className="text-xs font-black">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_amount}%` : `$${coupon.discount_amount}`}
                    </span>
                  </div>
                  <div className="ml-3 flex-grow">
                    <p className={`text-[10px] font-black uppercase tracking-wide ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{coupon.code}</p>
                    <p className="text-[9px] text-slate-500 font-bold leading-tight">{coupon.title}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(coupon.code);
                      toast.success('Voucher copied!');
                    }}
                    className={`px-3 py-1.5 rounded-[5px] text-[9px] font-black uppercase tracking-wider cursor-pointer border-none ${isDarkTheme ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-3xs border border-slate-200'
                      }`}
                  >
                    Claim
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom Action Add To Cart Button */}
      <div className={`p-4 border-t shrink-0 ${isDarkTheme ? 'bg-[#0B0F19]/90 border-slate-800/80' : 'bg-white border-slate-100'}`}>
        <button
          onClick={() => {
            handleAddToCart(selectedProduct, selectedVariant);
            setSelectedProduct(null);
          }}
          className={`w-full py-3.5 rounded-[7px] font-black text-xs text-white cursor-pointer transition-transform active:scale-95 text-center flex items-center justify-center space-x-2 ${activeTheme.primaryBg} ${activeTheme.primaryHover} shadow-md ${activeTheme.shadowClass}`}
        >
          <FiShoppingCart className="w-4 h-4 text-white" />
          <span>Add To Cart · ${getProductPrice(selectedProduct, selectedVariant).toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
};
