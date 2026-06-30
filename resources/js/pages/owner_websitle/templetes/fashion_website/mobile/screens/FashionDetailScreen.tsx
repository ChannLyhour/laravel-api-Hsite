import React, { useState, useEffect, useMemo } from 'react';
import { FiChevronLeft, FiHeart, FiShoppingBag, FiChevronRight, FiMinus, FiPlus } from 'react-icons/fi';
import { toast } from '../../utils/toast';
import type { Root2 } from '@/api/owner/categories';
import type { GalleryItem } from '../../types';
import {
  parseAttributeValue,
  resolveColorHex,
  getProductColors,
  getProductSizes,
} from '../../utils/priceUtils';
import { resolveImageUrl } from '../../utils/imageUtils';

interface FashionDetailScreenProps {
  selectedProduct: Root2;
  setSelectedProduct: (p: Root2 | null) => void;
  selectedVariant: any;
  setSelectedVariant: (v: any) => void;
  wishlist: Record<string, boolean>;
  handleToggleWishlist: (id: string, name: string) => void;
  handleAddToCart: (product: Root2, qty: number, size: string, color: string) => void;
  getProductImage: (product: Root2) => string;
  locale: 'en' | 'km';
  isDarkTheme: boolean;
  allProducts: Root2[]; // Pass all products to show recommendations
}

export const FashionDetailScreen: React.FC<FashionDetailScreenProps> = ({
  selectedProduct,
  setSelectedProduct,
  wishlist,
  handleToggleWishlist,
  handleAddToCart,
  getProductImage,
  isDarkTheme,
  allProducts,
}) => {
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);

  // Get helper properties using same utilities as desktop
  const isSizeAvailableForColor = (sz: string, col: string) => {
    if (!selectedProduct.variants || selectedProduct.variants.length === 0) return false;
    return selectedProduct.variants.some((v: any) => {
      let matchSize = false;
      let matchColor = !col;
      if (v.attribute_values) {
        v.attribute_values.forEach((av: any) => {
          const val = av.value;
          const parsed = parseAttributeValue(
            val,
            av.attribute?.name?.toLowerCase() === 'color' ||
            av.attribute?.name?.toLowerCase() === 'colour'
          );
          if (parsed.value === sz) matchSize = true;
          if (col && parsed.isColor && parsed.colorName && parsed.colorName.toLowerCase() === col.toLowerCase()) {
            matchColor = true;
          }
        });
      }
      return matchSize && matchColor && (v.stock_qty ?? 0) > 0;
    });
  };

  const getProductGallery = (item: Root2): GalleryItem[] => {
    const list: GalleryItem[] = [];
    const addedUrls = new Set<string>();

    const addToList = (url: string, color?: string) => {
      if (!url || url.includes('default.png')) return;
      const existing = list.find(g => g.url === url);
      if (existing) {
        if (!existing.color && color) existing.color = color;
        return;
      }
      addedUrls.add(url);
      list.push({ url, color });
    };

    if (item.display_image) {
      const url = resolveImageUrl(item.display_image);
      if (url) addToList(url);
    }

    if (item.variants) {
      const addedColorsForVariants = new Set<string>();
      item.variants.forEach((v: any) => {
        let variantColor: string | undefined;
        if (v.attribute_values) {
          v.attribute_values.forEach((av: any) => {
            const parsed = parseAttributeValue(
              av.value,
              av.attribute?.name?.toLowerCase() === 'color' ||
              av.attribute?.name?.toLowerCase() === 'colour'
            );
            if (parsed.isColor) variantColor = parsed.colorName;
          });
        }

        if (variantColor) {
          const lowerColor = variantColor.toLowerCase();
          if (addedColorsForVariants.has(lowerColor)) {
            return;
          }
          addedColorsForVariants.add(lowerColor);
        }

        if (v.image_url) {
          const url = resolveImageUrl(v.image_url);
          if (url) addToList(url, variantColor);
        }
        if (item.images && v.id) {
          item.images.forEach((img: any) => {
            if (img.product_variant_id === v.id) {
              const url = resolveImageUrl(img.image || img.image_path);
              if (url) addToList(url, variantColor);
            }
          });
        }
      });
    }

    if (item.images && item.images.length > 0) {
      item.images.forEach((img: any) => {
        if (!img.product_variant_id) {
          const url = resolveImageUrl(img.image || img.image_path);
          if (url) addToList(url);
        }
      });
    }

    if (list.length === 0 && item.image) {
      const url = resolveImageUrl(item.image);
      if (url) addToList(url);
    }

    if (list.length === 0) {
      addToList('https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80');
    }

    return list;
  };

  const gallery = useMemo(() => getProductGallery(selectedProduct), [selectedProduct]);
  const sizes = getProductSizes(selectedProduct);
  const parsedColors = getProductColors(selectedProduct);
  const colors = parsedColors.length > 0 ? parsedColors : (selectedProduct as any).colors || [];

  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  const isSelectionComplete = (!hasColors || !!selectedColor) && (!hasSizes || !!selectedSize);

  // Reset states when current product changes
  useEffect(() => {
    let active = true;
    
    if (active) {
      setSelectedSize('');
      setSelectedColor('');
      setActiveGalleryIndex(0);
      setQty(1);
    }
    
    return () => { active = false; };
  }, [selectedProduct]);

  // Find matching variant
  const variant = useMemo(() => {
    if (!selectedProduct.variants || selectedProduct.variants.length === 0) return undefined;
    if (!selectedProduct.has_options) return selectedProduct.variants[0];

    if (hasColors && !selectedColor) return undefined;
    if (hasSizes && !selectedSize) return undefined;

    return selectedProduct.variants.find((v: any) => {
      let matchSize = !hasSizes;
      let matchColor = !hasColors;
      if (v.attribute_values) {
        v.attribute_values.forEach((av: any) => {
          const val = av.value;
          const parsed = parseAttributeValue(
            val,
            av.attribute?.name?.toLowerCase() === 'color' ||
            av.attribute?.name?.toLowerCase() === 'colour'
          );
          if (hasSizes && parsed.value === selectedSize) matchSize = true;
          if (hasColors && selectedColor && parsed.isColor && parsed.colorName && parsed.colorName.toLowerCase() === selectedColor.toLowerCase()) {
            matchColor = true;
          }
        });
      }
      return matchSize && matchColor;
    });
  }, [selectedProduct.variants, selectedProduct.has_options, selectedSize, selectedColor, hasColors, hasSizes]);

  const isOutOfStock = useMemo(() => {
    // 1. Check if the product is explicitly marked as archived, inactive, or draft
    if (selectedProduct.status === 'archived' || selectedProduct.status === 'inactive' || selectedProduct.status === 'draft') return true;

    // 2. If it has options (variants like Size/Color), check the selected variant's stock
    if (selectedProduct.has_options) {
      if (!isSelectionComplete) return false;
      if (!variant) {
        // If no matching variant is found for the selection, it's effectively unavailable
        return true;
      }
      return (Number(variant.stock_qty) ?? 0) <= 0;
    } 
    
    // 3. For simple products (no options), check the first variant or root stock
    const firstVar = selectedProduct.variants?.[0];
    if (!firstVar) {
      // If there are NO variants at all, we fall back to checking if it's a default/mockup item.
      const isMockup = selectedProduct.id >= 10000; 
      return !isMockup;
    }
    
    return (Number(firstVar.stock_qty) ?? 0) <= 0;
  }, [selectedProduct.status, selectedProduct.has_options, selectedProduct.variants, variant, selectedProduct.id, isSelectionComplete]);

  const price = variant ? parseFloat(variant.retail_price) : parseFloat(selectedProduct.price);
  const compareAt = variant?.compare_at_price
    ? parseFloat(variant.compare_at_price)
    : (selectedProduct as any).compare_at_price
      ? parseFloat((selectedProduct as any).compare_at_price)
      : selectedProduct.id % 2 !== 0 ? price * 1.3 : null;

  const isFav = !!wishlist[String(selectedProduct.id)];

  const isSizeAvailable = (sz: string) => {
    if (!selectedProduct.variants || selectedProduct.variants.length === 0) return false;
    return selectedProduct.variants.some((v: any) => {
      let matchSize = false;
      let matchColor = !selectedColor;
      if (v.attribute_values) {
        v.attribute_values.forEach((av: any) => {
          const val = av.value;
          const parsed = parseAttributeValue(
            val,
            av.attribute?.name?.toLowerCase() === 'color' ||
            av.attribute?.name?.toLowerCase() === 'colour'
          );
          if (parsed.value === sz) matchSize = true;
          if (selectedColor && parsed.isColor && parsed.colorName && parsed.colorName.toLowerCase() === selectedColor.toLowerCase()) {
            matchColor = true;
          }
        });
      }
      return matchSize && matchColor && (v.stock_qty ?? 0) > 0;
    });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const currentSizeAvailable = isSizeAvailableForColor(selectedSize, color);
    if (!currentSizeAvailable) {
      setSelectedSize('');
    }
    const idx = gallery.findIndex(g =>
      g.color && color && (
        g.color.toLowerCase() === color.toLowerCase() ||
        resolveColorHex(selectedProduct, g.color).toLowerCase() === resolveColorHex(selectedProduct, color).toLowerCase()
      )
    );
    if (idx !== -1) setActiveGalleryIndex(idx);
  };

  // Find related products (excluding current one)
  const recommendations = useMemo(() => {
    return allProducts
      .filter(p => p.id !== selectedProduct.id)
      .slice(0, 4);
  }, [allProducts, selectedProduct]);

  return (
    <div className={`flex flex-col min-h-full pb-24 animate-fade-in`}>
      {/* ── Fixed Top Action Bar ── */}
      <div className={`flex justify-between items-center p-4 sticky top-0 z-35 backdrop-blur-md border-b shrink-0 ${
        isDarkTheme ? 'bg-stone-950/80 border-stone-850' : 'bg-white/80 border-stone-100'
      }`}>
        <button
          onClick={() => setSelectedProduct(null)}
          className={`p-2 rounded-full cursor-pointer transition-colors ${
            isDarkTheme ? 'bg-stone-900 text-stone-200 hover:bg-stone-800' : 'bg-stone-150/60 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[10px] font-black tracking-widest uppercase select-none">Garment Customization</span>
        <button
          onClick={() => handleToggleWishlist(String(selectedProduct.id), selectedProduct.name)}
          className={`p-2 rounded-full cursor-pointer transition-colors ${
            isFav
              ? 'bg-rose-50 text-rose-500 shadow-3xs'
              : isDarkTheme ? 'bg-stone-900 text-stone-300' : 'bg-stone-150/60 text-stone-500'
          }`}
        >
          <FiHeart className={`w-4.5 h-4.5 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* ── Product Photo Slider (3:4 Portrait view) ── */}
      <div className="relative h-[450px] bg-stone-100 dark:bg-stone-900 shrink-0 w-full select-none">
        {gallery.map((item, idx) => (
          <img
            key={idx}
            src={item.url}
            alt={selectedProduct.name}
            className={`absolute inset-0 w-full h-[450px] object-cover transition-opacity duration-300 ${
              idx === activeGalleryIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          />
        ))}

        {/* Swipe Indicators */}
        {gallery.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {gallery.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveGalleryIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeGalleryIndex ? 'bg-stone-900 dark:bg-stone-100 w-4' : 'bg-stone-400/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Product Configuration ── */}
      <div className="p-4 space-y-6">
        {/* Title and Prices */}
        <div className="space-y-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-stone-400">STUDIO COLECTION</div>
          <h2 className="text-xl font-serif tracking-wide uppercase leading-tight">{selectedProduct.name}</h2>
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-black text-rose-600">${price.toFixed(2)}</span>
            {compareAt && (
              <span className="text-xs text-stone-450 line-through">${compareAt.toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Color Swatch Selectors */}
        {selectedProduct.has_options && colors.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Colors Available</span>
            <div className="flex flex-wrap gap-2">
              {colors.map((color: string, idx: number) => {
                const hex = resolveColorHex(selectedProduct, color);
                const isSelected = selectedColor.toLowerCase() === color.toLowerCase() || hex.toLowerCase() === resolveColorHex(selectedProduct, selectedColor).toLowerCase();
                return (
                  <button
                    key={idx}
                    onClick={() => handleColorSelect(color)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-950 dark:border-stone-100 shadow-sm'
                        : 'border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full shadow-inner"
                      style={{ backgroundColor: hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Size Selection pills */}
        {selectedProduct.has_options && sizes.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Sizes Select</span>
            <div className="grid grid-cols-5 gap-2">
              {sizes.map((sz: string) => {
                const isSelected = selectedSize === sz;
                const isAvailable = isSizeAvailable(sz);
                return (
                  <button
                    key={sz}
                    disabled={!isAvailable}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2 text-center text-xs font-black rounded-[4px] border transition-all ${
                      isSelected
                        ? 'bg-stone-950 text-white border-stone-950 dark:bg-stone-100 dark:text-stone-950 dark:border-stone-100 shadow-sm'
                        : isAvailable
                          ? 'bg-white hover:bg-stone-55 text-stone-800 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-800'
                          : 'bg-stone-50 text-stone-400 border-stone-200/50 line-through opacity-45 dark:bg-stone-900/50 dark:border-stone-850/50'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Increment / Decrement Selector */}
        <div className="space-y-2.5">
          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Order Qty</span>
          <div className="flex items-center w-[120px] rounded-[4px] bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
            <button
              onClick={() => setQty(prev => Math.max(1, prev - 1))}
              className="w-9 py-2 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors flex items-center justify-center font-bold border-none cursor-pointer text-xs"
            >
              <FiMinus />
            </button>
            <span className="flex-1 text-center font-black text-xs text-stone-900 dark:text-stone-100 select-none">
              {qty}
            </span>
            <button
              onClick={() => setQty(prev => prev + 1)}
              className="w-9 py-2 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors flex items-center justify-center font-bold border-none cursor-pointer text-xs"
            >
              <FiPlus />
            </button>
          </div>
        </div>

        {/* Collapsible Details */}
        <div className="border-t border-stone-200 dark:border-stone-800 pt-3">
          <details className="group cursor-pointer select-none">
            <summary className="flex items-center justify-between text-2xs font-black uppercase tracking-wider text-stone-500 outline-none list-none">
              <span>Garment Description</span>
              <span className="transition-transform duration-200 group-open:rotate-180">
                <FiChevronRight className="w-3.5 h-3.5 rotate-90" />
              </span>
            </summary>
            <p className="mt-2 text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed font-medium">
              {selectedProduct.description ||
                'Elevate your seasonal styling with our curated Studio Collection item. Designed for premium durability, comfort, and minimal elegance.'}
            </p>
          </details>
        </div>

        {/* ── Complete the Look recommendations ── */}
        {recommendations.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-stone-200 dark:border-stone-800">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Complete The Look</span>
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
              {recommendations.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedProduct(item);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-28 shrink-0 space-y-1.5 cursor-pointer group"
                >
                  <div className="aspect-[3/4] rounded-[4px] overflow-hidden bg-stone-100">
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-all duration-300"
                    />
                  </div>
                  <h4 className="text-[10px] font-semibold line-clamp-1 truncate">{item.name}</h4>
                  <span className="text-[10px] font-black block">${parseFloat(item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom sticky button bar ── */}
      <div className={`p-4 border-t sticky bottom-0 z-35 flex gap-3 mt-auto ${
        isDarkTheme ? 'bg-stone-950 border-stone-850' : 'bg-white border-stone-100 shadow-md'
      }`}>
        <button
          disabled={isSelectionComplete ? isOutOfStock : false}
          onClick={() => {
            if (!isSelectionComplete) {
              if (hasColors && !selectedColor) {
                toast.error('Please select a color.');
              } else if (hasSizes && !selectedSize) {
                toast.error('Please select a size.');
              }
              return;
            }
            handleAddToCart(selectedProduct, qty, selectedSize, selectedColor);
            setSelectedProduct(null);
          }}
          className={`flex-1 py-3.5 font-black text-xs uppercase tracking-widest rounded-[4px] transition-colors border-none shadow-sm flex items-center justify-center gap-2 ${
            (isSelectionComplete ? isOutOfStock : false)
              ? 'bg-stone-200 text-stone-400 dark:bg-stone-900 cursor-not-allowed'
              : 'bg-stone-950 hover:bg-[#E61E25] text-white dark:bg-stone-100 dark:text-stone-900 cursor-pointer'
          }`}
        >
          <FiShoppingBag className="w-4 h-4" />
          <span>{(isSelectionComplete && isOutOfStock) ? 'Out of stock' : `Add To Bag • $${(price * qty).toFixed(2)}`}</span>
        </button>
      </div>
    </div>
  );
};
