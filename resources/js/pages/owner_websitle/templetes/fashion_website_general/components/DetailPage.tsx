import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  FiEye,
  FiArrowRight,
  FiX,
  FiShare,
} from 'react-icons/fi';
import { LinkShareProduct } from './Graph/LinkShareProduct';
import {
  FaFacebookF,
  FaTelegramPlane,
  FaInstagram,
  FaTiktok,
  FaYoutube
} from 'react-icons/fa';
import { toast } from '../utils/toast';
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
import { ProductBagdeGrid } from './helpers/ProductBagdeGrid';
import { SocialMediaGrid } from './SocialMediaGrid';
import { FASHION_ROUTES } from '../routes';
import { TextSp } from './helpers/TextSp';
import { LineLoading, SkeletonProductDetail } from './helpers/SkeletonSt';
import { ImageDetailProduct } from './image-detail/image_detail_product';

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
  categories = [],
  isLoading: isLoadingProp,
}) => {
  // Local product state to handle refreshes
  const [product, setProduct] = useState<Root2>(initialProduct);
  const [isLoading, setIsLoading] = useState(false);
  const ownerUserId = stores?.created_by || product?.created_by || '';

  // Share Popover State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Product Image Detail State
  const [isImageDetailOpen, setIsImageDetailOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setIsShareOpen(false);
      }
    };
    if (isShareOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isShareOpen]);

  const shareUrl = useMemo(() => {
    return typeof window !== 'undefined' ? window.location.href : '';
  }, [product.id]);

  const relatedProducts = useMemo(() => {
    if (!items || items.length === 0) return [];
    const filtered = items.filter(item => Number(item.id) !== Number(product.id));
    const sameCategory = filtered.filter(item => item.category_id === product.category_id);
    if (sameCategory.length > 0) {
      return sameCategory.slice(0, 20);
    }
    return filtered.slice(0, 20);
  }, [items, product.id, product.category_id]);


  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
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
  const [selectedAddons, setSelectedAddons] = useState<Record<number | string, boolean>>(() => {
    const initialAddons: Record<number | string, boolean> = {};
    if (initialProduct?.addons) {
      initialProduct.addons.forEach((addon: any) => {
        if (addon.is_default) {
          initialAddons[addon.id] = true;
        }
      });
    }
    return initialAddons;
  });
  const [detailQuantity, setDetailQuantity] = useState(() => (initialProduct?.min_order_qty && initialProduct.min_order_qty > 1) ? initialProduct.min_order_qty : 1);

  const addonsPrice = useMemo(() => {
    if (!product.addons || product.addons.length === 0) return 0;
    return Object.entries(selectedAddons).reduce((sum, [addonId, checked]) => {
      if (!checked) return sum;
      const add = product.addons?.find((a: any) => String(a.id) === addonId);
      if (!add) return sum;
      const price = parseFloat(String(add.additional_price)) || 0;
      const discountVal = parseFloat(String(add.discount || 0)) || 0;
      const eff = add.discount_type === 'percent'
        ? Math.max(0, price - (price * discountVal / 100))
        : Math.max(0, price - discountVal);
      return sum + eff;
    }, 0);
  }, [product.addons, selectedAddons]);

  const addonsOriginalPrice = useMemo(() => {
    if (!product.addons || product.addons.length === 0) return 0;
    return Object.entries(selectedAddons).reduce((sum, [addonId, checked]) => {
      if (!checked) return sum;
      const add = product.addons?.find((a: any) => String(a.id) === addonId);
      if (!add) return sum;
      return sum + (parseFloat(String(add.additional_price)) || 0);
    }, 0);
  }, [product.addons, selectedAddons]);

  const totalAddonsOriginalPrice = useMemo(() => {
    if (!product.addons || product.addons.length === 0) return 0;
    return product.addons.reduce((sum, add: any) => sum + (parseFloat(String(add.additional_price)) || 0), 0);
  }, [product.addons]);

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

  const handleVoucherClick = async (code: string) => {
    setIsLoading(true);
    try {
      if (appliedCoupon?.code === code) {
        await removeCoupon?.();
      } else {
        await applyCoupon?.(code);
        handleCopyCode(code);
      }
    } catch (err) {
      console.warn('Failed to handle coupon action', err);
    } finally {
      setIsLoading(false);
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

  const filteredGallery = gallery;

  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  const isSelectionComplete = (!hasColors || !!selectedColor) && (!hasSizes || !!selectedSize);

  // Initial Configuration Autopopulate on mount or key reset
  useEffect(() => {
    setSelectedSize('');
    setSelectedColor('');
    setActiveGalleryIndex(0);
    const minQty = product?.min_order_qty && product.min_order_qty > 1 ? product.min_order_qty : 1;
    setDetailQuantity(minQty);

    const initialAddons: Record<number | string, boolean> = {};
    if (product?.addons) {
      product.addons.forEach((addon: any) => {
        if (addon.is_default) {
          initialAddons[addon.id] = true;
        }
      });
    }
    setSelectedAddons(initialAddons);
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

  const basePrice = variant ? parseFloat(variant.retail_price) : parseFloat(product.price);

  // Resolve compare-at price: prefer variant.compare_at_price, then product.compare_at_price,
  // then compute from product-level discount_amount as final fallback.
  const baseCompareAt = (() => {
    if (variant?.compare_at_price && parseFloat(variant.compare_at_price) > 0) {
      return parseFloat(variant.compare_at_price);
    }
    if ((product as any).compare_at_price && parseFloat((product as any).compare_at_price) > 0) {
      return parseFloat((product as any).compare_at_price);
    }
    const da = parseFloat(String((product as any).discount_amount || 0));
    const dt = (product as any).discount_type || 'flat';
    if (da > 0) {
      // basePrice is retail_price (the ALREADY-discounted price stored in DB).
      // compare_at is the ORIGINAL price before the discount was applied.
      return dt === 'percent'
        ? basePrice / (1 - da / 100)   // e.g. price=$80, 20% off → compare=$100
        : basePrice + da;              // e.g. price=$80, $20 off → compare=$100
    }
    return null;
  })();

  const isUnitPriceEqualToTotalAddons = useMemo(() => {
    if (!product.addons || product.addons.length === 0) return false;
    return Math.abs(basePrice - totalAddonsOriginalPrice) < 0.01;
  }, [basePrice, totalAddonsOriginalPrice, product.addons]);

  const price = isUnitPriceEqualToTotalAddons ? addonsPrice : basePrice + addonsPrice;
  const compareAt = isUnitPriceEqualToTotalAddons
    ? (addonsOriginalPrice > addonsPrice ? addonsOriginalPrice : null)
    : (baseCompareAt !== null ? baseCompareAt + addonsPrice : null);

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
          ? 'relative bg-white dark:bg-stone-950 w-full rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-stone-100 dark:border-stone-800/80 overflow-hidden flex flex-col md:flex-row min-h-[20vh] z-10'
          : 'relative bg-white dark:bg-stone-950 w-full max-w-4xl rounded-2xl md:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-stone-100 dark:border-stone-800/80 overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[90vh] animate-slide-up z-10'
      }
    >
      <LineLoading isLoading={isLoading} />
      {/* Close Button (Modal Only) */}
      {!isFullPage && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/60 dark:border-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow-md cursor-pointer focus:outline-none"
          aria-label="Close modal"
        >
          <FiX className="w-5 h-5" />
        </button>
      )}

      {/* Left Column: Gallery */}
      <div className="w-full md:w-fit md:shrink-0 p-4 sm:p-5 md:p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-stone-100 dark:border-stone-800/60 overflow-hidden">
        {/* Main Large Image Container */}
        <div 
          onClick={() => setIsImageDetailOpen(true)}
          className="relative w-full md:w-[420px] aspect-[4/3] sm:aspect-square md:aspect-auto h-auto md:h-[620px] max-h-[35vh] sm:max-h-[50vh] md:max-h-[70vh] max-w-full bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-xl overflow-hidden flex items-center justify-center group/main-image cursor-pointer shadow-xs transition-shadow duration-300 hover:shadow-sm"
        >
          {/* Premium Price-Tag Badge */}
          {discount && (
            <div className="absolute top-4 right-4 z-20 pointer-events-none select-none">
              <span className="inline-block bg-[#E61E25] text-white text-[10px] sm:text-[11px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider leading-none shadow-md">
                {discount}
              </span>
            </div>
          )}
          {(() => {
            const displayIdx = hoveredGalleryIndex ?? activeGalleryIndex;
            return filteredGallery.map((item: GalleryItem, idx: number) => {
              const isDisplay = idx === displayIdx;
              const hasDuplicate = filteredGallery.filter(g => g.url === item?.url).length > 1;
              return (
                <img
                  key={idx}
                  src={item.url || ''}
                  alt={product.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out group-hover/main-image:scale-105 ${isDisplay ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                  style={hasDuplicate ? getThumbnailStyle(idx) : {}}
                />
              );
            });
          })()}

          {filteredGallery.length > 1 && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-stone-900/90 hover:bg-white text-stone-800 hover:text-[#E61E25] dark:text-stone-300 dark:hover:text-[#E61E25] flex items-center justify-center transition-all shadow-md border border-stone-200/30 dark:border-stone-800 cursor-pointer focus:outline-none opacity-0 group-hover/main-image:opacity-100 hover:scale-105 active:scale-95 z-20"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={e => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-stone-900/90 hover:bg-white text-stone-800 hover:text-[#E61E25] dark:text-stone-300 dark:hover:text-[#E61E25] flex items-center justify-center transition-all shadow-md border border-stone-200/30 dark:border-stone-800 cursor-pointer focus:outline-none opacity-0 group-hover/main-image:opacity-100 hover:scale-105 active:scale-95 z-20"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image Actions Overlay (Details & Favorite Buttons) */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                setIsLoading(true);
                try {
                  await toggleFavorite(String(product.id), product.name);
                } catch (err) {
                  console.warn('Failed to toggle favorite', err);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-10 h-10 rounded-full border border-stone-200/60 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 shadow-sm hover:shadow-md transition-all flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
            >
              <FiHeart
                className={`w-4 h-4 transition-colors ${favorites[String(product.id)] ? 'fill-[#E61E25] text-[#E61E25]' : 'text-stone-900 dark:text-stone-200'}`}
              />
            </button>
          </div>

          {/* Brand Tag Bottom Center */}
          <div
            className="absolute right-2 bottom-6 text-[8px] tracking-[0.25em] text-stone-400 font-bold uppercase pointer-events-none select-none"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {stores?.store_name || storeName} / Studio
          </div>
        </div>

        {filteredGallery.length > 1 && (
          <div className="flex flex-row gap-3 overflow-x-auto py-1.5 select-none w-full scrollbar-hide">
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
                  className={`aspect-[3/4] h-16 rounded-lg overflow-hidden border bg-white dark:bg-stone-900 transition-all shrink-0 cursor-pointer p-0 relative ${isActive
                    ? 'border-stone-950 dark:border-white ring-2 ring-stone-950/10 dark:ring-white/10 scale-95 shadow-sm'
                    : isHovered
                      ? 'border-stone-400 dark:border-stone-600 scale-[1.02]'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
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
      </div>

      {/* Right Column: Configuration & Details */}
      <div className="w-full md:flex-1 p-6 flex flex-col justify-between overflow-y-auto md:h-full">
        <div className="space-y-6">
          {/* Price Row */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-baseline gap-2.5">
                <span className="text-[#E61E25] text-2xl font-extrabold tracking-tight">
                  $
                  {price.toFixed(2)}
                </span>
                {discount && (
                  <span className="text-[#E61E25] text-[10px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
                    {discount}
                  </span>
                )}
                {compareAt && (
                  <span className="text-stone-400 dark:text-stone-500 text-sm line-through decoration-stone-300/65 font-medium">
                    ${compareAt.toFixed(2)}
                  </span>
                )}
              </div>
              {(product as any).badge && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm"
                  style={{ backgroundColor: (product as any).badge.background_color, color: (product as any).badge.text_color }}
                >
                  {(product as any).badge.name}
                </span>
              )}
              {isOutOfStock && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Title & Voucher Trigger */}
          <div className="flex items-start justify-between gap-4 relative">
            <div className="flex-1">
              <TextSp
                as="h2"
                size={{ mobile: 'xl', tablet: '2xl' }}
                weight="bold"
                color="text-stone-900 dark:text-white"
                uppercase
                tracking="tight"
                leading="snug"
                align="left"
              >
                {product.name}
              </TextSp>
            </div>

            {/* Product Share Button & Popover */}
            <div ref={shareRef} className="relative shrink-0 select-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareOpen(prev => !prev);
                }}
                className="w-10 h-10 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-850 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-all cursor-pointer border-none focus:outline-none"
                aria-label="Share product"
              >
                <FiShare className="w-5 h-5" />
              </button>

              <LinkShareProduct
                isOpen={isShareOpen}
                shareUrl={shareUrl}
                productName={product.name}
              />
            </div>
          </div>

          {/* Colors List */}
          {product.has_options && colors.length > 0 && (
            <div className="space-y-2">
              <span className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider block text-left">
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
                      className={`w-12 h-16 rounded-lg overflow-hidden border-2 bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-0.5 transition-all shrink-0 cursor-pointer ${selectedColor && color && (selectedColor.toLowerCase() === color.toLowerCase() || resolveColorHex(product, selectedColor).toLowerCase() === resolveColorHex(product, color).toLowerCase())
                        ? 'border-stone-950 dark:border-white ring-2 ring-stone-950/20 dark:ring-white/20 scale-105 shadow-sm'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                    >
                      <div className="w-full h-full flex flex-col justify-between">
                        <div
                          className="flex-1 w-full bg-cover bg-center rounded-md"
                          style={{ backgroundColor: resolveColorHex(product, color) }}
                        />
                        <div className="h-4.5 w-full bg-white dark:bg-stone-950 flex items-center justify-center text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase truncate px-0.5 relative">
                          {color.startsWith('#') ? color.slice(0, 4) : color}
                          {imgCount > 0 && (
                            <span className="absolute -top-3.5 right-0.5 bg-stone-950 dark:bg-white text-white dark:text-stone-950 text-[7px] px-1 rounded-full scale-75 leading-none py-0.5 font-extrabold">
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

          {/* Size List */}
          {product.has_options && sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider">
                <span>Size</span>
                <span className="text-stone-400 dark:text-stone-500 text-[11px] font-medium lowercase tracking-normal">
                  select sizing
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
                      className={`py-2 text-center text-xs font-semibold rounded-lg transition-all border ${isSelected
                        ? 'bg-stone-950 dark:bg-stone-50 text-white dark:text-stone-950 border-stone-950 dark:border-stone-50 shadow-md scale-102 font-bold'
                        : isAvailable
                          ? 'bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-850 dark:text-stone-200 border-stone-200 dark:border-stone-800 hover:border-stone-800 dark:hover:border-stone-400 cursor-pointer'
                          : 'bg-stone-50/50 dark:bg-stone-900/50 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-800 line-through opacity-40 cursor-not-allowed'
                        }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Addons List */}
          {product.addons && product.addons.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider">
                <span>Product Add-ons</span>
                <span className="text-stone-400 dark:text-stone-500 text-[11px] font-medium lowercase tracking-normal">
                  optional extras
                </span>
              </div>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {product.addons.map((addon: any) => {
                  const isSelected = !!selectedAddons[addon.id];
                  const resolvedAddonImg = addon.image ? resolveImageUrl(addon.image) : null;
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddons(prev => ({
                          ...prev,
                          [addon.id]: !prev[addon.id]
                        }));
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${isSelected
                        ? 'border-stone-950 dark:border-stone-200 bg-stone-950/[0.03] dark:bg-white/[0.03] shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850/60'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox Icon */}
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-stone-950 dark:bg-stone-200 border-stone-950 dark:border-stone-200 text-white dark:text-stone-950' : 'border-stone-300 dark:border-stone-700'
                          }`}>
                           {isSelected && <span className="text-[9px] font-black leading-none">✓</span>}
                        </div>

                        {/* Optional Addon Image */}
                        {resolvedAddonImg && (
                          <img
                            src={resolvedAddonImg}
                            alt={addon.addon_name}
                            className="w-10 h-10 rounded-md object-cover border border-stone-200/80 dark:border-stone-800 shrink-0 bg-stone-50"
                          />
                        )}

                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                          {addon.addon_name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        {(() => {
                          const price = parseFloat(String(addon.additional_price)) || 0;
                          const discountVal = parseFloat(String(addon.discount || 0)) || 0;
                          const effPrice = addon.discount_type === 'percent'
                            ? Math.max(0, price - (price * discountVal / 100))
                            : Math.max(0, price - discountVal);
                          return discountVal > 0 ? (
                            <>
                              <span className="line-through text-stone-450">
                                +${price.toFixed(2)}
                              </span>
                              <span className="text-[#E61E25]">
                                +${effPrice.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            `+$${price.toFixed(2)}`
                          );
                        })()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity selector */}
          <div className="space-y-2 mb-2 flex flex-col items-end w-full">
            <span className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider block text-right w-full">
              Quantity
            </span>
            <div className="flex items-center w-[120px] rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-0.5 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  const minQty = product.min_order_qty && product.min_order_qty > 1 ? product.min_order_qty : 1;
                  setDetailQuantity(prev => Math.max(minQty, prev - 1));
                }}
                className="w-8 h-8 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all flex items-center justify-center font-semibold border-none cursor-pointer text-xs active:scale-90"
              >
                <FiMinus />
              </button>
              <span className="flex-1 text-center font-bold text-xs text-stone-900 dark:text-stone-100 select-none">
                {detailQuantity}
              </span>
              <button
                type="button"
                onClick={() => setDetailQuantity(prev => prev + 1)}
                className="w-8 h-8 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all flex items-center justify-center font-semibold border-none cursor-pointer text-xs active:scale-90"
              >
                <FiPlus />
              </button>
            </div>
            {product.min_order_qty && product.min_order_qty > 1 && (
              <span className="text-[#E61E25] text-[10px] font-bold uppercase tracking-wider block mt-1">
                ⚠️ Order minimum for Customer: {product.min_order_qty} units
              </span>
            )}
          </div>

          {/* Collapsible item description */}
          <div className="border-t border-stone-200/60 dark:border-stone-800/60 pt-3">
            <details className="group cursor-pointer select-none">
              <summary className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 outline-none list-none [&::-webkit-details-marker]:hidden">
                <span>Product details</span>
                <span className="transition-transform duration-200 group-open:rotate-180">
                  <FiChevronRight className="w-3.5 h-3.5 rotate-90 text-stone-450" />
                </span>
              </summary>
              <p className="mt-2.5 text-stone-600 dark:text-stone-400 text-xs leading-relaxed font-medium">
                {product.description ||
                  'Elevate your seasonal styling with our curated Editorial collection item. Designed for premium durability, comfort, and minimal elegance.'}
              </p>
            </details>
          </div>

          {/* Product Social Media Links Card */}
          {(() => {
            const links = product.social_media_link;
            if (!links || !Object.values(links).some(v => !!v)) return null;

            return (
              <div className="border-t border-stone-200/60 dark:border-stone-800/60 pt-4 mt-4 text-left">
                <span className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider block mb-2.5">
                  Related Social Posts
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {links.facebook && (
                    <a
                      href={links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-50 dark:bg-stone-900 hover:bg-[#1877F2]/10 border border-stone-200 dark:border-stone-800 hover:border-[#1877F2]/30 text-stone-800 dark:text-stone-200 hover:text-[#1877F2] dark:hover:text-[#1877F2] rounded-lg text-xs font-extrabold transition-all hover:scale-105"
                    >
                      <FaFacebookF className="w-3.5 h-3.5" />
                      Facebook
                    </a>
                  )}
                  {links.instagram && (
                    <a
                      href={links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-50 dark:bg-stone-900 hover:bg-[#E1306C]/10 border border-stone-200 dark:border-stone-800 hover:border-[#E1306C]/30 text-stone-800 dark:text-stone-200 hover:text-[#E1306C] dark:hover:text-[#E1306C] rounded-lg text-xs font-extrabold transition-all hover:scale-105"
                    >
                      <FaInstagram className="w-3.5 h-3.5" />
                      Instagram
                    </a>
                  )}
                  {links.tiktok && (
                    <a
                      href={links.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-50 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-extrabold transition-all hover:scale-105"
                    >
                      <FaTiktok className="w-3.5 h-3.5" />
                      TikTok
                    </a>
                  )}
                  {links.telegram && (
                    <a
                      href={links.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-50 dark:bg-stone-900 hover:bg-[#229ED9]/10 border border-stone-200 dark:border-stone-800 hover:border-[#229ED9]/30 text-stone-800 dark:text-stone-200 hover:text-[#229ED9] dark:hover:text-[#229ED9] rounded-lg text-xs font-extrabold transition-all hover:scale-105"
                    >
                      <FaTelegramPlane className="w-3.5 h-3.5" />
                      Telegram
                    </a>
                  )}
                  {links.youtube && (
                    <a
                      href={links.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-50 dark:bg-stone-900 hover:bg-[#FF0000]/10 border border-stone-200 dark:border-stone-800 hover:border-[#FF0000]/30 text-stone-800 dark:text-stone-200 hover:text-[#FF0000] dark:hover:text-[#FF0000] rounded-lg text-xs font-extrabold transition-all hover:scale-105"
                    >
                      <FaYoutube className="w-3.5 h-3.5" />
                      YouTube
                    </a>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-stone-950 pt-4 pb-3 mt-auto border-t border-stone-100 dark:border-stone-900/60 z-20 -mx-6 px-6">
          <div className="flex gap-3">
            <button
              disabled={isSelectionComplete ? isOutOfStock : false}
              onClick={async (e) => {
                if (!isSelectionComplete) {
                  if (hasColors && !selectedColor) {
                    toast.error('Please select a color.');
                  } else if (hasSizes && !selectedSize) {
                    toast.error('Please select a size.');
                  }
                  return;
                }

                setIsLoading(true);
                try {
                  // Construct final color including addons
                  const addonParts: string[] = [];
                  if (product.addons && product.addons.length > 0) {
                    Object.entries(selectedAddons).forEach(([addonId, checked]) => {
                      if (checked) {
                        const add = product.addons?.find((a: any) => String(a.id) === addonId);
                        if (add) {
                          const price = parseFloat(String(add.additional_price)) || 0;
                          const disc = parseFloat(String(add.discount || 0)) || 0;
                          const eff = add.discount_type === 'percent'
                            ? Math.max(0, price - (price * disc / 100))
                            : Math.max(0, price - disc);
                          addonParts.push(`${add.addon_name} (+$${eff.toFixed(2)})`);
                        }
                      }
                    });
                  }
                  const addonsString = addonParts.length > 0 ? `Addons: ${addonParts.join(', ')}` : '';
                  const finalColor = selectedColor && addonsString
                    ? `${selectedColor} / ${addonsString}`
                    : (addonsString || selectedColor);

                  await addToCart(product, detailQuantity, selectedSize, finalColor, addonsPrice);

                  // Trigger flying cart animation
                  const startX = e.clientX || e.currentTarget.getBoundingClientRect().left + 20;
                  const startY = e.clientY || e.currentTarget.getBoundingClientRect().top + 20;
                  window.dispatchEvent(new CustomEvent('animate_to_cart', { detail: { startX, startY } }));
                } catch (err) {
                  console.warn('Failed to add to cart', err);
                } finally {
                  setIsLoading(false);
                }
              }}
              className={`flex-1 py-3.5 sm:py-4 font-bold text-xs uppercase tracking-wider sm:tracking-widest rounded-xl transition-all duration-200 border-none shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98] ${(isSelectionComplete ? isOutOfStock : false)
                ? 'bg-stone-100 dark:bg-stone-900 text-stone-400 dark:text-stone-600 cursor-not-allowed'
                : 'btn-shine-swipe bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-950 hover:bg-[#E61E25] dark:hover:bg-[#E61E25] dark:hover:text-white cursor-pointer'
                }`}
            >
              <FiShoppingBag className="w-4 h-4" />
              <span>{(isSelectionComplete && isOutOfStock) ? 'Out of stock' : 'Add to bag'}</span>
            </button>

            <button
              disabled={isSelectionComplete ? isOutOfStock : false}
              onClick={async () => {
                if (!isSelectionComplete) {
                  if (hasColors && !selectedColor) {
                    toast.error('Please select a color.');
                  } else if (hasSizes && !selectedSize) {
                    toast.error('Please select a size.');
                  }
                  return;
                }

                setIsLoading(true);
                try {
                  // Construct final color including addons
                  const addonParts: string[] = [];
                  if (product.addons && product.addons.length > 0) {
                    Object.entries(selectedAddons).forEach(([addonId, checked]) => {
                      if (checked) {
                        const add = product.addons?.find((a: any) => String(a.id) === addonId);
                        if (add) {
                          const price = parseFloat(String(add.additional_price)) || 0;
                          const disc = parseFloat(String(add.discount || 0)) || 0;
                          const eff = add.discount_type === 'percent'
                            ? Math.max(0, price - (price * disc / 100))
                            : Math.max(0, price - disc);
                          addonParts.push(`${add.addon_name} (+$${eff.toFixed(2)})`);
                        }
                      }
                    });
                  }
                  const addonsString = addonParts.length > 0 ? `Addons: ${addonParts.join(', ')}` : '';
                  const finalColor = selectedColor && addonsString
                    ? `${selectedColor} / ${addonsString}`
                    : (addonsString || selectedColor);

                  await addToCart(product, detailQuantity, selectedSize, finalColor, addonsPrice);
                  if (onNavigate) {
                    const storeSlug = (stores?.store_name || storeName || 'store').replace(/\s+/g, '_');
                    const ownerId = product.created_by || stores?.created_by || '';
                    onNavigate(FASHION_ROUTES.getCheckout(ownerId, storeSlug));
                  }
                } catch (err) {
                  console.warn('Failed to checkout', err);
                } finally {
                  setIsLoading(false);
                }
              }}
              className={`flex-1 py-3.5 sm:py-4 font-bold text-xs uppercase tracking-wider sm:tracking-widest rounded-xl transition-all duration-200 border-none shadow-sm hover:shadow-md hover:shadow-red-500/10 flex items-center justify-center gap-2 active:scale-[0.98] ${(isSelectionComplete ? isOutOfStock : false)
                ? 'bg-stone-100 dark:bg-stone-900 text-stone-400 dark:text-stone-600 cursor-not-allowed'
                : 'bg-[#E61E25] hover:bg-[#c1151b] dark:hover:bg-[#ff2e36] text-white cursor-pointer'
                }`}
            >
              <span>Checkout</span>
              {!isOutOfStock && <FiArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const productPriceTotal = price * detailQuantity;

  if (isLoadingProp || !product) {
    return <SkeletonProductDetail />;
  }

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
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-2 animate-fade-in">{content}</div>

      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-stone-200 mt-12">
          <ProductBagdeGrid
            items={relatedProducts}
            categories={categories}
            ownerUserId={Number(stores?.created_by || product?.created_by || 0)}
            stores={stores}
            storeName={storeName}
            onNavigate={onNavigate}
            addToCart={(itm, qty, sz, col) => addToCart(itm, qty ?? 1, sz ?? '', col ?? '')}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            gridCols={5}
          />
        </div>
      )}


      <section className="w-full max-w-7xl mx-auto px-4 mt-8 sm:px-6 lg:px-8 mb-16 overflow-hidden">
        <ProductBagdeGrid
          items={items}
          categories={categories}
          ownerUserId={ownerUserId}
          stores={stores}
          storeName={storeName}
          onNavigate={onNavigate}
          addToCart={(itm, qty, sz, col) => addToCart(itm, qty ?? 1, sz ?? '', col ?? '')}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      </section>

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

      <ImageDetailProduct
        isOpen={isImageDetailOpen}
        onClose={() => setIsImageDetailOpen(false)}
        images={gallery.map((g: any) => g.url)}
        productName={product.name}
      />
    </>
  );
}


