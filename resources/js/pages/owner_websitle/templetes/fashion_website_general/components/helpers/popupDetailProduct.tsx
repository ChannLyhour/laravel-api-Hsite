import React, { useState, useEffect, useMemo } from 'react';
import {
    FiMinus,
    FiPlus,
    FiHeart,
    FiShoppingBag,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
    FiArrowRight,
    FiX,
} from 'react-icons/fi';
import { toast } from '../../utils/toast';
import type { Root2 } from '@/api/owner/categories';
import '../../styles/animation.css';
import type { GalleryItem } from '../../types';
import { couponsService, type CouponRow } from '@/api/owner/coupons';
import { menuItemsService } from '@/api/owner/categories';
import { resolveImageUrl } from '../../utils/imageUtils';
import { FASHION_ROUTES } from '../../routes';
import {
    parseAttributeValue,
    resolveColorHex,
    getProductColors,
    getProductSizes,
} from '../../utils/priceUtils';
import { ModelCoupon } from './ModelCoupon';
import { TextSp } from './TextSp';

export interface PopupDetailProductProps {
    product: Root2;
    onClose: () => void;
    addToCart: (product: Root2, qty: number, size: string, color: string) => void;
    favorites: Record<string, boolean>;
    toggleFavorite: (id: string, name: string) => void;
    storeName?: string;
    stores?: any;
    user?: any;
    appliedCoupon?: any;
    applyCoupon?: (code: string) => void;
    removeCoupon?: () => void;
    coupons?: CouponRow[];
    onNavigate?: (to: string) => void;
}

export const PopupDetailProduct: React.FC<PopupDetailProductProps> = ({
    product: initialProduct,
    onClose,
    addToCart,
    favorites,
    toggleFavorite,
    storeName = '---',
    stores,
    user,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    coupons: propCoupons,
    onNavigate,
}) => {
    const [product, setProduct] = useState<Root2>(initialProduct);

    useEffect(() => {
        setProduct(initialProduct);
    }, [initialProduct]);

    useEffect(() => {
        const bc = new BroadcastChannel('data_updates');
        bc.onmessage = (event) => {
            if (event.data === 'refresh') {
                menuItemsService.getMenuItem(product.id)
                    .then(updated => {
                        if (updated) setProduct(updated as unknown as Root2);
                    })
                    .catch(err => console.warn('Failed to refresh product in PopupDetailProduct', err));
            }
        };
        return () => bc.close();
    }, [product.id]);

    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
    const [hoveredGalleryIndex, setHoveredGalleryIndex] = useState<number | null>(null);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [detailQuantity, setDetailQuantity] = useState(1);

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
                const data = await couponsService.getCoupons(vendorId ? { vendor_id: vendorId } : undefined);
                const activeCoupons = data.filter(
                    c => c.is_active && (!c.customer_id || c.customer_id === user?.id)
                );
                setCoupons(activeCoupons);
            } catch (err) {
                console.error('Failed to load coupons in PopupDetailProduct', err);
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
            addToList(
                'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80'
            );
        }

        return list;
    };

    const gallery = useMemo(() => getProductGallery(product), [product]);
    const sizes = getProductSizes(product);
    const parsedColors = getProductColors(product);
    const colors = parsedColors.length > 0 ? parsedColors : (product as any).colors || [];

    const filteredGallery = gallery;

    const hasColors = colors.length > 0;
    const hasSizes = sizes.length > 0;
    const isSelectionComplete = (!hasColors || !!selectedColor) && (!hasSizes || !!selectedSize);

    useEffect(() => {
        setSelectedSize('');
        setSelectedColor('');
        setActiveGalleryIndex(0);
        setDetailQuantity(1);
    }, [product.id]);

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
        if (product.status === 'inactive' || product.status === 'draft' || product.status === 'archived') return true;

        if (product.has_options) {
            if (!isSelectionComplete) return false;
            if (!variant) return true;
            return (Number(variant.stock_qty) ?? 0) <= 0;
        }

        const firstVar = product.variants?.[0];
        if (!firstVar) {
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

    const productPriceTotal = price * detailQuantity;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-x-hidden overflow-y-auto">
                <div
                    className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
                    onClick={onClose}
                />

                <div className="relative bg-white dark:bg-stone-950 w-full max-w-4xl rounded-2xl md:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-stone-100 dark:border-stone-800/80 overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[90vh] animate-slide-up z-10">
                    {onClose && (
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
                        <div
                            onClick={() => {
                                if (onNavigate) {
                                    const storeSlug = (stores?.store_name || storeName || 'store').replace(/\s+/g, '_');
                                    const ownerId = product.created_by || stores?.created_by || '';
                                    onNavigate(FASHION_ROUTES.getProduct(product.id, ownerId, storeSlug));
                                }
                            }}
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
                                <div
                                    className="w-10 h-10 rounded-full border border-stone-200/60 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md text-stone-800 dark:text-stone-200 shadow-sm transition-all flex items-center justify-center pointer-events-none select-none"
                                >
                                    <FiEye className="w-4 h-4" />
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(String(product.id), product.name);
                                    }}
                                    className="w-10 h-10 rounded-full border border-stone-200/60 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 shadow-sm hover:shadow-md transition-all flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
                                >
                                    <FiHeart
                                        className={`w-4 h-4 transition-colors ${favorites[String(product.id)] ? 'fill-[#E61E25] text-[#E61E25]' : 'text-stone-900 dark:text-stone-200'}`}
                                    />
                                </button>
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

                    {/* Right Column: Details */}
                    <div className="w-full md:flex-1 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto md:h-full">
                        <div className="space-y-4 sm:space-y-6">
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
                                                US ${compareAt.toFixed(2)}
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

                            <div className="flex items-start justify-between gap-4">
                                <div>
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
                            </div>

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

                            {product.has_options && sizes.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider">
                                        <span>Size</span>
                                        <span className="text-stone-400 dark:text-stone-500 text-[11px] font-medium lowercase tracking-normal">
                                            select sizing
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
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

                            <div className="space-y-2 mb-2">
                                <span className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider block text-left">
                                    Quantity
                                </span>
                                <div className="flex items-center w-[120px] rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-0.5 overflow-hidden">
                                    <button
                                        onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                                        className="w-8 h-8 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all flex items-center justify-center font-semibold border-none cursor-pointer text-xs active:scale-90"
                                    >
                                        <FiMinus />
                                    </button>
                                    <span className="flex-1 text-center font-bold text-xs text-stone-900 dark:text-stone-100 select-none">
                                        {detailQuantity}
                                    </span>
                                    <button
                                        onClick={() => setDetailQuantity(prev => prev + 1)}
                                        className="w-8 h-8 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all flex items-center justify-center font-semibold border-none cursor-pointer text-xs active:scale-90"
                                    >
                                        <FiPlus />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white dark:bg-stone-950 pt-4 pb-3 mt-auto border-t border-stone-100 dark:border-stone-900/60 z-20 -mx-5 sm:-mx-6 px-5 sm:px-6">
                            <div className="flex gap-3">
                                <button
                                    disabled={isSelectionComplete ? isOutOfStock : false}
                                    onClick={(e) => {
                                        if (!isSelectionComplete) {
                                            if (hasColors && !selectedColor) {
                                                toast.error('Please select a color.');
                                            } else if (hasSizes && !selectedSize) {
                                                toast.error('Please select a size.');
                                            }
                                            return;
                                        }
                                        addToCart(product, detailQuantity, selectedSize, selectedColor);

                                        // Trigger flying cart animation
                                        const startX = e.clientX || e.currentTarget.getBoundingClientRect().left + 20;
                                        const startY = e.clientY || e.currentTarget.getBoundingClientRect().top + 20;
                                        window.dispatchEvent(new CustomEvent('animate_to_cart', { detail: { startX, startY } }));
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
                                        if (onNavigate) {
                                            const storeSlug = (stores?.store_name || storeName || 'store').replace(/\s+/g, '_');
                                            const ownerId = product.created_by || stores?.created_by || '';
                                            onNavigate(FASHION_ROUTES.getCheckout(ownerId, storeSlug));
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
            </div>
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
};
