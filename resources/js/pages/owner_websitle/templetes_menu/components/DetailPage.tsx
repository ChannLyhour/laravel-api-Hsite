import React, { useState, useEffect, useMemo } from 'react';
import {
  FiMinus,
  FiPlus,
  FiHeart,
  FiShoppingBag,
  // FiTruck,
  // FiPhone,
  // FiCreditCard,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import type { Root2 } from '@/api/owner/categories';
import '../styles/animation.css';
import type { GalleryItem, DetailPageProps } from '../types';
import { couponsService, type CouponRow } from '@/api/owner/coupons';
import { menuItemsService } from '@/api/owner/categories';
import { resolveImageUrl } from '../utils/imageUtils';
import {
  parseAttributeValue,
  resolveColorHex,
  getProductColors,
  getProductSizes,
} from '../utils/priceUtils';


import { ModelCoupon } from './helpers/ModelCoupon';
import { CardProduct } from './helpers/CardProduct';
import { FASHION_ROUTES } from '../routes';

export const DetailPage: React.FC<DetailPageProps> = ({
  product: initialProduct,
  onClose,
  addToCart,
  favorites,
  toggleFavorite,
  storeName = '---',
  stores,
  isFullPage = true,
  user,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
  coupons: propCoupons,
  onNavigate,
  items = [],
}) => {
  // Local product state to handle refreshes
  const [product, setProduct] = useState<Root2>(initialProduct);

  const relatedProducts = useMemo(() => {
    if (!items || items.length === 0) return [];
    const filtered = items.filter(item => Number(item.id) !== Number(product.id));
    const sameCategory = filtered.filter(item => item.category_id === product.category_id);
    if (sameCategory.length > 0) {
      return sameCategory.slice(0, 20);
    }
    return filtered.slice(0, 20);
  }, [items, product.id, product.category_id]);

  const relatedSliderRef = React.useRef<HTMLDivElement>(null);
  const [showRelatedLeftArrow, setShowRelatedLeftArrow] = useState(false);
  const [showRelatedRightArrow, setShowRelatedRightArrow] = useState(true);

  const handleRelatedScroll = () => {
    if (relatedSliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = relatedSliderRef.current;
      setShowRelatedLeftArrow(scrollLeft > 10);
      setShowRelatedRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollRelated = (direction: 'left' | 'right') => {
    if (relatedSliderRef.current) {
      const { clientWidth } = relatedSliderRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      relatedSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    handleRelatedScroll();
  }, [relatedProducts]);

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product.id]);

  useEffect(() => {
    const bc = new BroadcastChannel('data_updates');
    bc.onmessage = (event) => {
      if (event.data === 'refresh') {
        menuItemsService.getMenuItem(product.id)
          .then(updated => {
            if (updated) setProduct(updated as unknown as Root2);
          })
          .catch(err => console.warn('Failed to refresh product in DetailPage', err));
      }
    };
    return () => bc.close();
  }, [product.id]);

  // Localized component states for modal details selection
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [hoveredGalleryIndex, setHoveredGalleryIndex] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [detailQuantity, setDetailQuantity] = useState(1);

  // Voucher Drawer State
  const [isVoucherDrawerOpen, setIsVoucherDrawerOpen] = useState(false);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [copiedCode, setCopiedCode] = useState<string>('');

  useEffect(() => {
    if (propCoupons !== undefined && propCoupons !== null) {
      setCoupons(propCoupons);
      return;
    }
    const fetchCoupons = async () => {
      try {
        const vendorId = stores?.created_by || product?.created_by;
        const data = await couponsService.getCoupons(vendorId ? { created_by: vendorId } : undefined);
        const activeCoupons = data.filter(
          c => c.is_active && (!c.customer_id || c.customer_id === user?.id)
        );
        setCoupons(activeCoupons);
      } catch (err) {
        console.error('Failed to load coupons in DetailPage', err);
        setCoupons([]);
      }
    };
    fetchCoupons();
  }, [stores, product, user, propCoupons]);

  const handleVoucherClick = (code: string) => {
    if (appliedCoupon?.code === code) {
      removeCoupon?.();
    } else {
      applyCoupon?.(code);
      handleCopyCode(code);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(prevCopied => (prevCopied === code ? '' : prevCopied));
    }, 1500);
  };

  const getThumbnailStyle = (index: number) => {
    switch (index) {
      case 1:
        return { transform: 'scale(1.45)' };
      case 2:
        return { transform: 'scale(1.45) translateY(10px)' };
      case 3:
        return { transform: 'scale(1.45) translateY(-10px)' };
      case 4:
        return { filter: 'contrast(120%) brightness(95%)' };
      default:
        return {};
    }
  };

  const isSizeAvailable = (sz: string) => {
    if (!product.variants || product.variants.length === 0) return false;
    return product.variants.some((v: any) => {
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


  const isSizeAvailableForColor = (sz: string, col: string) => {
    if (!product.variants || product.variants.length === 0) return false;
    return product.variants.some((v: any) => {
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
        if (!existing.color && color) {
          existing.color = color;
        }
        return;
      }

      addedUrls.add(url);
      list.push({ url, color });
    };

    // 1. Add product primary display image first
    if (item.display_image) {
      const url = resolveImageUrl(item.display_image);
      if (url) addToList(url);
    }

    // 2. Walk through variants and add variant-specific images with their color attributes
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
            if (parsed.isColor) {
              variantColor = parsed.colorName;
            }
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

    // 3. Add all other images
    if (item.images && item.images.length > 0) {
      item.images.forEach((img: any) => {
        if (!img.product_variant_id) {
          const url = resolveImageUrl(img.image || img.image_path);
          if (url) addToList(url);
        }
      });
    }

    // Fallback if list is empty
    if (list.length === 0 && item.image) {
      const url = resolveImageUrl(item.image);
      if (url) addToList(url);
    }

    // Ensure we don't have empty list
    if (list.length === 0) {
      addToList(
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80'
      );
    }

    return list;
  };

  // Gallery Lists & Config Computation
  const gallery = useMemo(() => getProductGallery(product), [product]);
  const sizes = getProductSizes(product);
  const parsedColors = getProductColors(product);
  const colors = parsedColors.length > 0 ? parsedColors : (product as any).colors || [];

  const nonColorAttributeName = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        if (v.attribute_values && v.attribute_values.length > 0) {
          for (const av of v.attribute_values) {
            const attrName = av.attribute?.name;
            if (attrName) {
              const lower = attrName.toLowerCase();
              if (lower !== 'color' && lower !== 'colour') {
                return attrName;
              }
            }
          }
        }
      }
    }
    return 'Size';
  }, [product.variants]);

  const filteredGallery = gallery;

  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  const isSelectionComplete = (!hasColors || !!selectedColor) && (!hasSizes || !!selectedSize);

  // Initial Configuration Autopopulate on mount or key reset
  useEffect(() => {
    setSelectedSize('');
    setSelectedColor('');
    setActiveGalleryIndex(0);
    setDetailQuantity(1);
  }, [product.id]);

  // Find matching variant if any
  const variant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return undefined;
    if (!product.has_options) return product.variants[0];

    if (hasColors && !selectedColor) return undefined;
    if (hasSizes && !selectedSize) return undefined;

    return product.variants.find((v: any) => {
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
  }, [product.variants, product.has_options, selectedSize, selectedColor, hasColors, hasSizes]);

  const isOutOfStock = useMemo(() => {
    // 1. Check if the product is explicitly marked as inactive/sold out or archived
    if (product.status === 'inactive' || product.status === 'draft' || product.status === 'archived') return true;

    // 2. If it has options (variants like Size/Color), check the selected variant's stock
    if (product.has_options) {
      if (!isSelectionComplete) return false;
      if (!variant) {
        // If no matching variant is found for the selection, it's effectively unavailable
        return true;
      }
      return (Number(variant.stock_qty) ?? 0) <= 0;
    }

    // 3. For simple products (no options), check the first variant or root stock
    const firstVar = product.variants?.[0];
    if (!firstVar) {
      // If there are NO variants at all, we fall back to checking if it's a default/mockup item.
      // Mockup items typically don't have variants but should be shown as available.
      // Real products should always have at least one variant if they are to have stock managed.
      const isMockup = product.id >= 10000;
      return !isMockup;
    }

    return (Number(firstVar.stock_qty) ?? 0) <= 0;
  }, [product.status, product.has_options, product.variants, variant, product.id, isSelectionComplete]);

  const price = variant ? parseFloat(variant.retail_price) : parseFloat(product.price);
  const compareAt = variant?.compare_at_price
    ? parseFloat(variant.compare_at_price)
    : (product as any).compare_at_price
      ? parseFloat((product as any).compare_at_price)
      : null;

  let discount = (product as any).discount;
  if (compareAt && compareAt > price) {
    discount = `-${Math.round((1 - price / compareAt) * 100)}%`;
  }

  // Interactive Synchronization Handlers
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const currentSizeAvailable = isSizeAvailableForColor(selectedSize, color);
    if (!currentSizeAvailable) {
      setSelectedSize('');
    }
    const idx = gallery.findIndex(g =>
      g.color && color && (
        g.color.toLowerCase() === color.toLowerCase() ||
        resolveColorHex(product, g.color).toLowerCase() === resolveColorHex(product, color).toLowerCase()
      )
    );
    if (idx !== -1) {
      setActiveGalleryIndex(idx);
    }
  };

  const handleThumbnailClick = (idx: number) => {
    setActiveGalleryIndex(idx);
    const itemColor = filteredGallery[idx]?.color;
    if (itemColor) {
      setSelectedColor(itemColor);
    }
  };

  const handlePrevImage = () => {
    const nextIdx = activeGalleryIndex === 0 ? filteredGallery.length - 1 : activeGalleryIndex - 1;
    setActiveGalleryIndex(nextIdx);
    const itemColor = filteredGallery[nextIdx]?.color;
    if (itemColor) {
      setSelectedColor(itemColor);
    }
  };

  const handleNextImage = () => {
    const nextIdx = activeGalleryIndex === filteredGallery.length - 1 ? 0 : activeGalleryIndex + 1;
    setActiveGalleryIndex(nextIdx);
    const itemColor = filteredGallery[nextIdx]?.color;
    if (itemColor) {
      setSelectedColor(itemColor);
    }
  };

  const content = (
    <div
      className={
        isFullPage
          ? 'relative bg-white w-full rounded-[4px] shadow-xs border border-stone-200 overflow-hidden flex flex-col md:flex-row min-h-[20vh] z-10'
          : 'relative bg-white w-full max-w-4xl rounded-[4px] shadow-2xl border border-stone-200 overflow-hidden flex flex-col md:flex-row max-h-[100vh] md:max-h-[100vh] animate-slide-up z-10'
      }
    >
      {/* Close Button (Modal Only) */}
      {!isFullPage && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-colors cursor-pointer text-sm focus:outline-none"
        >
          ✕
        </button>
      )}

      {/* Left Column: Gallery (Vertical Thumbnails + Main Image) */}
      <div className="w-full md:w-fit md:shrink-0 p-4 sm:p-6 flex flex-row gap-4  border-r border-stone-100 overflow-hidden min-h-[320px] md:min-h-0">
        {/* Vertical Thumbnail Strip */}
        {filteredGallery.length > 1 && (
          <div className="flex flex-col gap-4 overflow-y-auto pr-2 pl-2 select-none w-20 shrink-0 scrollbar-hide pt-1">
            {filteredGallery.map((item: GalleryItem, idx: number) => {
              const isDuplicate = filteredGallery.filter(g => g.url === item.url).length > 1;
              const style = isDuplicate ? getThumbnailStyle(idx) : {};
              const isActive = activeGalleryIndex === idx;
              const isHovered = hoveredGalleryIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  onMouseEnter={() => setHoveredGalleryIndex(idx)}
                  onMouseLeave={() => setHoveredGalleryIndex(null)}
                  className={`aspect-[3/4] w-full rounded-[5px] overflow-hidden border bg-white transition-all shrink-0 cursor-pointer p-0 relative ${isActive
                    ? 'border-stone-900 ring-1 ring-stone-900/10'
                    : isHovered
                      ? 'border-stone-500 scale-[1.04]'
                      : 'border-stone-200/80 hover:border-stone-400'
                    }`}
                >
                  <img
                    src={item.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={style}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Main Large Image Container */}
        <div className="relative w-[420px] h-[380px] sm:h-[500px] md:h-[620px] max-h-[60vh] md:max-h-[70vh] max-w-full bg-white border border-stone-200 rounded-[3px] overflow-hidden flex items-center justify-center group/main-image">
          {/* Resolve display index: hovered thumbnail previews without committing */}
          {(() => {
            const displayIdx = hoveredGalleryIndex ?? activeGalleryIndex;
            return filteredGallery.map((item: GalleryItem, idx: number) => {
              const isDisplay = idx === displayIdx;
              const hasDuplicate =
                filteredGallery.filter(g => g.url === item?.url).length > 1;
              return (
                <img
                  key={idx}
                  src={item.url || ''}
                  alt={product.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${isDisplay ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  style={hasDuplicate ? getThumbnailStyle(idx) : {}}
                />
              );
            });
          })()}

          {/* Navigation Arrows */}
          {filteredGallery.length > 1 && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="icon-scale-hover absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-800 hover:text-[#E61E25] flex items-center justify-center transition-all shadow-sm border border-stone-200 cursor-pointer focus:outline-none opacity-0 group-hover/main-image:opacity-100"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={e => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="icon-scale-hover absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-800 hover:text-[#E61E25] flex items-center justify-center transition-all shadow-sm border border-stone-200 cursor-pointer focus:outline-none opacity-0 group-hover/main-image:opacity-100"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Brand Tag Bottom Center */}
          <div
            className="absolute right-2 bottom-6 text-[8px] tracking-[0.25em] text-stone-400 font-bold uppercase pointer-events-none select-none"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {stores?.store_name || storeName} / Studio
          </div>
        </div>
      </div>

      {/* Right Column: Configuration & Details */}
      <div className="w-full md:flex-1 p-6 flex flex-col justify-between overflow-y-auto md:h-full">
        <div className="space-y-6">
          {/* Price Row */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-baseline gap-3 font-mono">
                <span className="text-[#E61E25] text-lg sm:text-xl font-black">
                  US ${price.toFixed(2)}
                </span>
                {discount && (
                  <span className="text-[#E61E25] text-xs font-black uppercase tracking-wider">
                    {discount}
                  </span>
                )}
                {compareAt && (
                  <span className="text-stone-400 text-sm line-through font-semibold">
                    US ${compareAt.toFixed(2)}
                  </span>
                )}
              </div>
              {isOutOfStock && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Title & Voucher Trigger */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {product.badge && (
                <div className="pb-1">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm"
                    style={{
                      backgroundColor: product.badge.background_color || '#E61E25',
                      color: product.badge.text_color || '#FFFFFF',
                    }}
                  >
                    {product.badge.name}
                  </span>
                </div>
              )}
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 uppercase tracking-wide leading-tight">
                {product.name}
              </h2>
            </div>
          </div>

          {/* Colors List */}
          {product.has_options && colors.length > 0 && (
            <div className="space-y-2">
              <span className="text-stone-500 text-2xs font-extrabold uppercase tracking-wider block">
                {colors.length} {colors.length === 1 ? 'Color' : 'Colors'} available
              </span>
              <div className="flex flex-wrap gap-2">
                {colors.map((color: string, idx: number) => {
                  const imgCount = gallery.filter(g => g.color === color).length;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColorSelect(color);
                      }}
                      className={`w-12 h-16 rounded-[2px] overflow-hidden border-2 bg-stone-50 hover:bg-stone-100 flex items-center justify-center p-0.5 transition-all shrink-0 cursor-pointer ${selectedColor && color && (selectedColor.toLowerCase() === color.toLowerCase() || resolveColorHex(product, selectedColor).toLowerCase() === resolveColorHex(product, color).toLowerCase())
                        ? 'border-stone-950 ring-1 ring-stone-900/10'
                        : 'border-stone-200/80 hover:border-stone-300'
                        }`}
                    >
                      <div className="w-full h-full flex flex-col justify-between">
                        <div
                          className="flex-1 w-full bg-cover bg-center rounded-[1px]"
                          style={{ backgroundColor: resolveColorHex(product, color) }}
                        />
                        <div className="h-4.5 w-full bg-white flex items-center justify-center text-[12px] font-bold text-stone-600 uppercase truncate px-0.5 relative">
                          {color.startsWith('#') ? color.slice(0, 4) : color}
                          {imgCount > 0 && (
                            <span className="absolute -top-3.5 right-0.5 bg-stone-950 text-white text-[7px] px-1 rounded-full scale-75 leading-none py-0.5 font-extrabold">
                              {imgCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Option / Size List */}
          {product.has_options && sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-2xs font-extrabold uppercase tracking-wider">
                <span>{nonColorAttributeName}</span>
                <span className="text-stone-400 font-semibold lowercase tracking-normal">
                  select {nonColorAttributeName.toLowerCase()}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {sizes.map((sz: string) => {
                  const isSelected = selectedSize === sz;
                  const isAvailable = isSizeAvailable(sz);
                  return (
                    <button
                      key={sz}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(sz)}
                      className={`py-2 text-center text-xs font-black rounded-[2px] transition-all border ${isSelected
                        ? 'bg-stone-950 text-white border-stone-950 shadow-sm'
                        : isAvailable
                          ? 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 cursor-pointer'
                          : 'bg-stone-50 text-stone-400 border-stone-200/50 line-through opacity-45 cursor-not-allowed'
                        }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity selector */}
          <div className="space-y-2 mb-2">
            <span className="text-stone-500 text-2xs font-extrabold uppercase tracking-wider block">
              Quantity
            </span>
            <div className="flex items-center w-[130px] rounded-[3px] bg-stone-100 border border-stone-200 overflow-hidden">
              <button
                onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                className="w-10 py-2 hover:bg-stone-200 text-stone-800 transition-colors flex items-center justify-center font-bold border-none cursor-pointer text-xs"
              >
                <FiMinus />
              </button>
              <span className="flex-1 text-center font-black text-xs text-stone-900 select-none">
                {detailQuantity}
              </span>
              <button
                onClick={() => setDetailQuantity(prev => prev + 1)}
                className=" w-10 py-2 hover:bg-stone-200 text-stone-800 transition-colors flex items-center justify-center font-bold border-none cursor-pointer text-xs"
              >
                <FiPlus />
              </button>
            </div>
          </div>
        </div>




        {/* Primary Add to Bag & Details Badges */}
        <div className="space-y-5 pt-8 mt-auto border-t border-stone-150">
          <div className="flex gap-3">
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
                addToCart(product, detailQuantity, selectedSize, selectedColor);
              }}
              className={`flex-1 py-4 font-black text-xs uppercase tracking-widest rounded-[2px] transition-colors border-none shadow-sm flex items-center justify-center gap-2 ${(isSelectionComplete ? isOutOfStock : false)
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'btn-shine-swipe bg-stone-950 hover:bg-[#E61E25] text-white cursor-pointer'
                }`}
            >
              <FiShoppingBag className="w-4 h-4" />
              <span>{(isSelectionComplete && isOutOfStock) ? 'Out of stock' : 'Add to bag'}</span>
            </button>

            <button
              onClick={() => toggleFavorite(String(product.id), product.name)}
              className="icon-scale-hover w-12 h-12 rounded-[2px] border border-stone-300 bg-white hover:bg-stone-50 flex items-center justify-center text-stone-600 hover:text-stone-950 transition-colors cursor-pointer focus:outline-none"
            >
              <FiHeart
                className={`w-5 h-5 transition-colors ${favorites[String(product.id)] ? 'fill-[#E61E25] text-[#E61E25]' : ''
                  }`}
              />
            </button>
          </div>

          {/* Informational badges matching page */}
          {/* <div className="space-y-2.5 bg-stone-50 p-4 rounded-[3px] border border-stone-200/60 text-stone-600 text-2xs font-semibold leading-relaxed">
            <div className="flex items-center gap-2.5">
              <FiTruck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>
                <strong className="text-stone-900">Fast Delivery:</strong> From 1 - 3 days
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <FiPhone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>
                <strong className="text-stone-900">Support hotline:</strong>{' '}
                {stores?.store_phone || '(+855) 085 330 330'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <FiCreditCard className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>
                <strong className="text-stone-900">Easy payment:</strong> Many forms
              </span>
            </div>
          </div> */}

          {/* Collapsible item description */}
          <div className="border-t border-stone-200/60 pt-3">
            <details className="group cursor-pointer select-none">
              <summary className="flex items-center justify-between text-2xs font-extrabold uppercase tracking-wider text-stone-500 outline-none list-none">
                <span>Product details</span>
                <span className="transition-transform duration-200 group-open:rotate-180">
                  <FiChevronRight className="w-3 h-3 rotate-90" />
                </span>
              </summary>
              <p className="mt-2.5 text-stone-500 text-2xs leading-relaxed font-medium">
                {product.description ||
                  'Elevate your seasonal styling with our curated Editorial collection item. Designed for premium durability, comfort, and minimal elegance.'}
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );

  const productPriceTotal = price * detailQuantity;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 animate-fade-in text-left">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            } else if (onNavigate) {
              const storeSlug = (stores?.store_name || storeName || 'store').replace(/\s+/g, '_');
              const ownerId = stores?.created_by || product?.created_by || '';
              onNavigate(FASHION_ROUTES.getShop(ownerId, storeSlug));
            } else if (onClose) {
              onClose();
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 uppercase tracking-widest border-none bg-transparent cursor-pointer transition-colors"
        >
          <FiChevronLeft className="w-4 h-4" /> Back to Shop
        </button>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 animate-fade-in">{content}</div>

      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-stone-200 mt-12">
          <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-stone-900 mb-8 select-none">
            You May Also Like
          </h3>
          
          <div className="relative group/slider">
            {showRelatedLeftArrow && (
              <button
                onClick={() => scrollRelated('left')}
                className="icon-scale-hover absolute left-2 top-[200px] -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center transition-all duration-300 shadow-lg z-10 border-none cursor-pointer focus:outline-none"
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>
            )}

            {showRelatedRightArrow && (
              <button
                onClick={() => scrollRelated('right')}
                className="icon-scale-hover absolute right-2 top-[200px] -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center transition-all duration-300 shadow-lg z-10 border-none cursor-pointer focus:outline-none"
              >
                <FiChevronRight className="w-6 h-6" />
              </button>
            )}

            <div
              ref={relatedSliderRef}
              onScroll={handleRelatedScroll}
              className="flex space-x-5 overflow-x-auto scrollbar-hide scroll-smooth py-2"
              style={{
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {relatedProducts.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="w-[260px] sm:w-[290px] md:w-[305px] shrink-0 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <CardProduct
                    item={item}
                    ownerUserId={Number(stores?.created_by || product?.created_by || 0)}
                    stores={stores}
                    storeName={storeName}
                    onNavigate={onNavigate}
                    addToCart={(itm, qty, sz, col) => addToCart(itm, qty ?? 1, sz ?? '', col ?? '')}
                    isFavorited={!!favorites[String(item.id)]}
                    onToggleFavorite={toggleFavorite}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ModelCoupon
        isOpen={isVoucherDrawerOpen}
        onClose={() => setIsVoucherDrawerOpen(false)}
        coupons={coupons}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleVoucherClick}
        subtotal={productPriceTotal}
        copiedCode={copiedCode}
        onCopyCode={handleCopyCode}
        isLoggedIn={!!user}
      />
    </>
  );
}


