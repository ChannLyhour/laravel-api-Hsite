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
                    className="fixed inset-0 bg-stone-950/40 backdrop-blur-2xs transition-opacity duration-300 animate-fade-in"
                    onClick={onClose}
                />

                <div className="relative bg-white w-full max-w-4xl rounded-[8px] sm:rounded-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[90vh] animate-slide-up z-10">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-[5px] bg-white/80 hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-colors cursor-pointer text-sm focus:outline-none"
                        >
                            ✕
                        </button>
                    )}

                    {/* Left Column: Gallery */}
                    <div className="w-full md:w-fit md:shrink-0 p-4 sm:p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-stone-100 overflow-hidden">
                        <div
                            onClick={() => {
                                if (onNavigate) {
                                    const storeSlug = (stores?.store_name || storeName || 'store').replace(/\s+/g, '_');
                                    const ownerId = product.created_by || stores?.created_by || '';
                                    onNavigate(FASHION_ROUTES.getProduct(product.id, ownerId, storeSlug));
                                }
                            }}
                            className="relative w-full md:w-[420px] aspect-[4/3] sm:aspect-square md:aspect-auto h-auto md:h-[620px] max-h-[35vh] sm:max-h-[50vh] md:max-h-[70vh] max-w-full bg-white border border-stone-200 rounded-[3px] overflow-hidden flex items-center justify-center group/main-image cursor-pointer"
                        >
                            {/* Premium Rotated Price-Tag Badge */}
                            {discount && (
                                <div className="absolute top-4 right-4 z-20 pointer-events-none select-none">
                                    <span className="inline-block bg-[#E61E25] text-white text-[10px] sm:text-[11px] font-black uppercase px-2 py-1 rounded-[3px] tracking-wider leading-none shadow-md border border-white/95 transform">
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
                                        className="icon-scale-hover absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-800 hover:text-[#E61E25] flex items-center justify-center transition-all shadow-sm border border-stone-200 cursor-pointer focus:outline-none opacity-0 group-hover/main-image:opacity-100 z-20"
                                    >
                                        <FiChevronLeft className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleNextImage();
                                        }}
                                        className="icon-scale-hover absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-800 hover:text-[#E61E25] flex items-center justify-center transition-all shadow-sm border border-stone-200 cursor-pointer focus:outline-none opacity-0 group-hover/main-image:opacity-100 z-20"
                                    >
                                        <FiChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}

                            {/* Image Actions Overlay (Details & Favorite Buttons) */}
                            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                                <div
                                    className="px-4 py-3 rounded-full border border-stone-200/60 bg-white/70 backdrop-blur-md text-stone-900 shadow-md transition-all flex items-center justify-center pointer-events-none select-none"
                                >
                                    <FiEye className="w-4 h-4" />
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(String(product.id), product.name);
                                    }}
                                    className="w-10 h-10 rounded-full border border-stone-200/60 bg-white/70 backdrop-blur-md hover:bg-white text-stone-900 shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer focus:outline-none"
                                >
                                    <FiHeart
                                        className={`w-4 h-4 transition-colors ${favorites[String(product.id)] ? 'fill-[#E61E25] text-[#E61E25]' : 'text-stone-900'}`}
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
                                            className={`aspect-[3/4] h-16 rounded-[4px] overflow-hidden border bg-white transition-all shrink-0 cursor-pointer p-0 relative ${isActive
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
                    </div>

                    {/* Right Column: Details */}
                    <div className="w-full md:flex-1 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto md:h-full">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="space-y-1.5 pt-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-baseline gap-3 font-mono">
                                        <span className="text-[#E61E25] text-lg sm:text-xl font-black">
                                            $
                                            {price.toFixed(2)}
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
                                    {(product as any).badge && (
                                        <span
                                            className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm"
                                            style={{ backgroundColor: (product as any).badge.background_color, color: (product as any).badge.text_color }}
                                        >
                                            {(product as any).badge.name}
                                        </span>
                                    )}
                                    {isOutOfStock && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                                            Out of Stock
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 uppercase tracking-wide leading-tight text-left">
                                        {product.name}
                                    </h2>
                                </div>
                            </div>

                            {product.has_options && colors.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-stone-500 text-2xs font-extrabold uppercase tracking-wider block text-left">
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

                            {product.has_options && sizes.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-stone-500 text-2xs font-extrabold uppercase tracking-wider">
                                        <span>Size</span>
                                        <span className="text-stone-400 font-semibold lowercase tracking-normal">
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

                            <div className="space-y-2 mb-2">
                                <span className="text-stone-500 text-2xs font-extrabold uppercase tracking-wider block text-left">
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

                        <div className="sticky bottom-0 bg-white dark:bg-stone-950 pt-4 mt-auto border-t border-stone-150 z-20 -mx-5 sm:-mx-6 px-5 sm:px-6 pb-2">
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
                                    className={`flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest rounded-[5px] transition-colors border-none shadow-sm flex items-center justify-center gap-1.5 ${(isSelectionComplete ? isOutOfStock : false)
                                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                        : 'btn-shine-swipe bg-stone-950 hover:bg-[#E61E25] text-white cursor-pointer'
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
                                    className={`flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest rounded-[5px] transition-colors border-none shadow-sm flex items-center justify-center gap-1.5 ${(isSelectionComplete ? isOutOfStock : false)
                                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                        : 'bg-[#E61E25] hover:bg-stone-900 text-white cursor-pointer'
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
