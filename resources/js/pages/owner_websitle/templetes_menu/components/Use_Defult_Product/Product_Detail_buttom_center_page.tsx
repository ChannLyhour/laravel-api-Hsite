import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    FiMinus,
    FiPlus,
    FiShoppingBag,
    FiEdit3,
    FiChevronLeft,
    FiChevronRight,
} from 'react-icons/fi';
import type { Root2 } from '@/api/owner/categories';
import '../../styles/animation.css';
import { couponsService, type CouponRow } from '@/api/owner/coupons';
import { menuItemsService } from '@/api/owner/categories';
import { resolveImageUrl } from '../../utils/imageUtils';
import {
    parseAttributeValue,
    resolveColorHex,
    getProductColors,
    getProductSizes,
} from '../../utils/priceUtils';
import { ModelCoupon } from '../helpers/ModelCoupon';
import { toast } from 'react-hot-toast';

export interface ProductDetailBottomCenterPageProps {
    product: Root2;
    onClose: () => void;
    addToCart: (product: Root2, qty: number, size: string, color: string) => void;
    favorites?: Record<string, boolean>;
    toggleFavorite?: (id: string, name: string) => void;
    storeName?: string;
    stores?: any;
    user?: any;
    appliedCoupon?: any;
    applyCoupon?: (code: string) => void;
    removeCoupon?: () => void;
    coupons?: CouponRow[];
    onNavigate?: (to: string) => void;
    buildStoreLink?: (path: string) => string;
}

const SUGAR_LEVELS = [
    { label: '0% Sugar', value: '0%' },
    { label: '30% Sugar', value: '30%' },
    { label: '50% Sugar', value: '50%' },
    { label: '70% Sugar', value: '70%' },
    { label: '100% Sugar', value: '100% (Normal)' },
];

const ICE_LEVELS = [
    { label: 'No Ice', value: 'No Ice' },
    { label: 'Less Ice', value: 'Less Ice' },
    { label: 'Regular Ice', value: 'Regular Ice' },
    { label: 'Hot / Warm', value: 'Hot' },
];

export const ProductDetailBottomCenterPage: React.FC<ProductDetailBottomCenterPageProps> = ({
    product: initialProduct,
    onClose,
    addToCart,
    stores,
    user,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    coupons: propCoupons,
    onNavigate,
    buildStoreLink,
}) => {
    const [product, setProduct] = useState<Root2>(initialProduct);
    const [animateShow, setAnimateShow] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        setProduct(initialProduct);
    }, [initialProduct]);

    useEffect(() => {
        // Prevent background scrolling when popup is open
        document.body.style.overflow = 'hidden';
        
        // Trigger slide-up animation on mount
        const raf = requestAnimationFrame(() => {
            setAnimateShow(true);
        });

        return () => {
            document.body.style.overflow = '';
            cancelAnimationFrame(raf);
        };
    }, []);

    useEffect(() => {
        const bc = new BroadcastChannel('data_updates');
        bc.onmessage = (event) => {
            if (event.data === 'refresh') {
                menuItemsService.getMenuItem(product.id)
                    .then(updated => {
                        if (updated) setProduct(updated as unknown as Root2);
                    })
                    .catch(err => console.warn('Failed to refresh product in ProductDetailBottomCenterPage', err));
            }
        };
        return () => bc.close();
    }, [product.id]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 400); // match transition duration
    };

    // Customer selections states
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSugar, setSelectedSugar] = useState('100% (Normal)');
    const [selectedIce, setSelectedIce] = useState('Regular Ice');
    const [selectedAddons, setSelectedAddons] = useState<Record<number, boolean>>({});
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [note, setNote] = useState('');
    const [detailQuantity, setDetailQuantity] = useState(1);

    // Category Breadcrumbs resolving
    const categoryList = useMemo(() => {
        const list: string[] = [];
        if (product.category) {
            let current: any = product.category;
            while (current) {
                list.unshift(current.name);
                current = current.parent;
            }
        }
        return list;
    }, [product.category]);

    // Check if store is a Cafe or Restaurant (enables Sugar/Ice customizers)
    const isFoodStore = useMemo(() => {
        const storeType = String(stores?.store_type || '').toLowerCase().trim();
        return ['cafe', 'restaurant', 'bakery', 'fast_food', 'bar'].includes(storeType);
    }, [stores?.store_type]);

    // Gather available sizes and colors
    const sizes = useMemo(() => getProductSizes(product), [product]);
    const parsedColors = useMemo(() => getProductColors(product), [product]);
    const colors = useMemo(() => parsedColors.length > 0 ? parsedColors : (product as any).colors || [], [parsedColors, product]);

    const hasColors = colors.length > 0;
    const hasSizes = sizes.length > 0;
    const isSelectionComplete = (!hasColors || !!selectedColor) && (!hasSizes || !!selectedSize);

    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
    const [hoveredGalleryIndex, setHoveredGalleryIndex] = useState<number | null>(null);

    const [isVoucherDrawerOpen, setIsVoucherDrawerOpen] = useState(false);
    const [coupons, setCoupons] = useState<CouponRow[]>([]);
    const [copiedCode, setCopiedCode] = useState<string>('');

    // Fetch coupons
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
                console.error('Failed to load coupons in ProductDetailBottomCenterPage', err);
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

    // Dynamic product gallery list
    const gallery = useMemo(() => {
        const list: { url: string; color?: string }[] = [];
        const addedUrls = new Set<string>();

        const addToList = (url: string, color?: string) => {
            if (!url || url.includes('default.png')) return;
            if (addedUrls.has(url)) return;
            addedUrls.add(url);
            list.push({ url, color });
        };

        if (product.display_image) {
            const url = resolveImageUrl(product.display_image);
            if (url) addToList(url);
        }

        if (product.variants) {
            product.variants.forEach((v: any) => {
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
                if (v.image_url) {
                    const url = resolveImageUrl(v.image_url);
                    if (url) addToList(url, variantColor);
                }
            });
        }

        if (product.images) {
            product.images.forEach((img: any) => {
                const url = resolveImageUrl(img.image || img.image_path);
                if (url) addToList(url);
            });
        }

        if (list.length === 0 && product.image) {
            const url = resolveImageUrl(product.image);
            if (url) addToList(url);
        }

        if (list.length === 0) {
            list.push({ url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80' });
        }

        return list;
    }, [product]);

    // Parse options list (except size & color which are handled individually)
    const productOptions = useMemo(() => {
        const options: Record<string, string[]> = {};
        if (product.variants) {
            product.variants.forEach((v: any) => {
                if (v.attribute_values) {
                    v.attribute_values.forEach((av: any) => {
                        const attrName = av.attribute?.name;
                        if (!attrName) return;
                        const attrNameLower = attrName.toLowerCase();
                        if (attrNameLower === 'size' || attrNameLower === 'sizes' || attrNameLower === 'color' || attrNameLower === 'colour') {
                            return;
                        }
                        const parsed = parseAttributeValue(av.value);
                        if (!options[attrName]) {
                            options[attrName] = [];
                        }
                        if (!options[attrName].includes(parsed.value)) {
                            options[attrName].push(parsed.value);
                        }
                    });
                }
            });
        }
        return options;
    }, [product]);

    // Helper to evaluate stock status
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

    // Find database variant matching selected options
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
    }, [product.status, product.has_options, product.variants, variant, isSelectionComplete]);

    const price = variant ? parseFloat(variant.retail_price) : parseFloat(product.price);
    const compareAt = variant?.compare_at_price
        ? parseFloat(variant.compare_at_price)
        : (product as any).compare_at_price
            ? parseFloat((product as any).compare_at_price)
            : null;

    const discount = useMemo(() => {
        if (compareAt && compareAt > price) {
            return `-${Math.round((1 - price / compareAt) * 100)}%`;
        }
        return null;
    }, [compareAt, price]);

    const productPriceTotal = price * detailQuantity;

    // Trigger action callbacks
    const handleAddToCartClick = () => {
        if (hasColors && !selectedColor) {
            toast.error('Please select a color.');
            return;
        }
        if (hasSizes && !selectedSize) {
            toast.error('Please select a size.');
            return;
        }

        // Package all options details
        const sizeSelection = selectedSize;
        const customNotePart = note.trim() ? ` (Note: ${note.trim()})` : '';
        const addonParts = Object.keys(selectedAddons)
            .filter(id => selectedAddons[Number(id)])
            .map(id => {
                const addon = product.addons?.find(a => a.id === Number(id));
                return addon ? addon.addon_name : '';
            })
            .filter(Boolean)
            .join(', ');

        const addonText = addonParts ? ` [Addons: ${addonParts}]` : '';
        const attrParts = Object.entries(selectedAttributes)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        const attrText = attrParts ? ` [Attributes: ${attrParts}]` : '';

        const colorSelection = selectedColor
            ? `${selectedColor}${addonText}${attrText}${customNotePart}`
            : `Ice: ${selectedIce}, Sugar: ${selectedSugar}${addonText}${attrText}${customNotePart}`;

        addToCart(product, detailQuantity, sizeSelection, colorSelection);
        handleClose();
    };

    const handleBuyNowClick = () => {
        if (hasColors && !selectedColor) {
            toast.error('Please select a color.');
            return;
        }
        if (hasSizes && !selectedSize) {
            toast.error('Please select a size.');
            return;
        }

        handleAddToCartClick();

        if (onNavigate && buildStoreLink) {
            onNavigate(buildStoreLink('/checkout'));
        } else if (onNavigate) {
            onNavigate('/checkout');
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[1000] flex items-end justify-center overflow-hidden">
                {/* Backdrop Blur */}
                <div
                    className={`fixed inset-0 bg-stone-900/60 transition-opacity duration-400 ${animateShow && !isClosing ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleClose}
                />

                {/* Cozy Café order customizer card (Bottom Sheet style - width 2 Columns) */}
                <div className={`relative bg-[#FDFBF7] w-full max-w-4xl rounded-t-2xl shadow-2xl border-t border-stone-200 overflow-hidden flex flex-col h-[90vh] md:h-[80vh] transform transition-transform duration-400 ease-in-out ${animateShow && !isClosing ? 'translate-y-0' : 'translate-y-full'} z-10 font-sans`}>
                    
                    {/* Bottom Sheet Handle */}
                    <div className="w-full flex justify-center pt-3 pb-1 shrink-0 bg-[#FDFBF7] rounded-t-2xl">
                        <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
                    </div>

                    {onClose && (
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-[5px] bg-white/90 hover:bg-stone-100 border border-stone-250 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-all cursor-pointer text-sm shadow-sm focus:outline-none"
                        >
                            ✕
                        </button>
                    )}

                    {/* Columns Wrapper */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        
                        {/* Col 1: Left (Product image and thumbnails) */}
                        <div className="w-full md:w-5/12 p-6 flex flex-col space-y-4 md:border-r md:border-stone-200 overflow-y-auto md:overflow-visible bg-white/40">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-stone-900 uppercase tracking-tight leading-tight">
                                    {product.name}
                                </h2>
                                {product.brand?.name && (
                                    <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block mt-1">
                                        {product.brand.name}
                                    </span>
                                )}
                            </div>

                            {/* Main Large Image Container */}
                            <div className="relative aspect-square w-full bg-white border border-stone-200 rounded-lg overflow-hidden flex items-center justify-center group/main-image shadow-xs">
                                {(() => {
                                    const displayIdx = hoveredGalleryIndex ?? activeGalleryIndex;
                                    const activeItem = gallery[displayIdx] || gallery[0];
                                    return (
                                        <img
                                            src={activeItem?.url || ''}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                                        />
                                    );
                                })()}

                                {/* Navigation Arrows */}
                                {gallery.length > 1 && (
                                    <>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setActiveGalleryIndex(prev => (prev === 0 ? gallery.length - 1 : prev - 1));
                                            }}
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-850 flex items-center justify-center transition-all shadow-sm border border-stone-200 cursor-pointer focus:outline-none opacity-0 group-hover/main-image:opacity-100"
                                        >
                                            <FiChevronLeft className="w-5 h-5" />
                                        </button>

                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setActiveGalleryIndex(prev => (prev === gallery.length - 1 ? 0 : prev + 1));
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-850 flex items-center justify-center transition-all shadow-sm border border-stone-200 cursor-pointer focus:outline-none opacity-0 group-hover/main-image:opacity-100"
                                        >
                                            <FiChevronRight className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails list */}
                            {gallery.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto py-1 custom-scrollbar shrink-0">
                                    {gallery.map((item, idx) => {
                                        const isActive = activeGalleryIndex === idx;
                                        const isHovered = hoveredGalleryIndex === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveGalleryIndex(idx)}
                                                onMouseEnter={() => setHoveredGalleryIndex(idx)}
                                                onMouseLeave={() => setHoveredGalleryIndex(null)}
                                                className={`aspect-square w-14 rounded-md overflow-hidden border bg-white transition-all shrink-0 cursor-pointer p-0.5 ${isActive
                                                    ? 'border-[#8C5A3C] ring-2 ring-[#8C5A3C]/20'
                                                    : isHovered
                                                        ? 'border-stone-500 scale-[1.04]'
                                                        : 'border-stone-200 hover:border-stone-400'
                                                    }`}
                                            >
                                                <img
                                                    src={item.url}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    className="w-full h-full object-cover rounded-sm"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Col 2: Right (Customizations, Pricing & Actions) */}
                        <div className="w-full md:w-7/12 p-6 flex flex-col justify-between overflow-y-auto h-full space-y-6 custom-scrollbar text-left">
                            <div className="space-y-6">
                                {/* Category Breadcrumbs */}
                                {categoryList.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-stone-400 uppercase tracking-widest flex-wrap">
                                        {categoryList.map((catName, idx) => (
                                            <React.Fragment key={idx}>
                                                {idx > 0 && <span>/</span>}
                                                <span className={idx === categoryList.length - 1 ? 'text-[#8C5A3C]' : ''}>
                                                    {catName}
                                                </span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}

                                {/* Price Block */}
                                <div className="flex items-baseline gap-3.5 flex-wrap">
                                    <span className="text-xl sm:text-2xl font-black text-stone-950 font-mono">
                                        ${price.toFixed(2)}
                                    </span>
                                    {compareAt && compareAt > price && (
                                        <>
                                            <span className="text-stone-400 text-sm line-through font-semibold font-mono">
                                                ${compareAt.toFixed(2)}
                                            </span>
                                            <span className="text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-[3px] font-black border border-rose-100 uppercase tracking-wider">
                                                {discount}
                                            </span>
                                        </>
                                    )}
                                    {isOutOfStock ? (
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded">
                                            Out of Stock
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded">
                                            In Stock
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <p className="text-stone-500 text-xs leading-relaxed font-medium">
                                        {product.description}
                                    </p>
                                )}

                                <hr className="border-stone-200/60 my-2" />

                                {/* Product Variation (Size Selection) */}
                                {sizes.length > 0 && (
                                    <div className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-extrabold text-stone-850 text-xs uppercase tracking-wider">
                                                Choose Size
                                            </h3>
                                            <span className="text-[9px] font-black uppercase text-[#8C5A3C] bg-[#FAF2EB] px-2.5 py-0.5 rounded-[5px]">
                                                Required
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2.5">
                                            {sizes.map((sz) => {
                                                const isSelected = selectedSize === sz;
                                                const isAvailable = isSizeAvailable(sz);
                                                return (
                                                    <button
                                                        key={sz}
                                                        disabled={!isAvailable}
                                                        onClick={() => setSelectedSize(sz)}
                                                        className={`py-2 px-3 text-center text-xs font-black rounded-[5px] transition-all border ${
                                                            isSelected
                                                                ? 'bg-[#8C5A3C] text-white border-[#8C5A3C] shadow-xs'
                                                                : isAvailable
                                                                    ? 'bg-[#FCFAF7] hover:bg-stone-50 text-stone-750 border-stone-200 cursor-pointer'
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

                                {/* Colors Selection */}
                                {colors.length > 0 && (
                                    <div className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-extrabold text-stone-850 text-xs uppercase tracking-wider">
                                                Choose Color
                                            </h3>
                                            <span className="text-[9px] font-bold uppercase text-stone-400 bg-stone-100 px-2 py-0.5 rounded-[5px]">
                                                Select One
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map((color: string, idx: number) => {
                                                const isSelected = selectedColor.toLowerCase() === color.toLowerCase() || (selectedColor && resolveColorHex(product, selectedColor).toLowerCase() === resolveColorHex(product, color).toLowerCase());
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setSelectedColor(color)}
                                                        className={`flex items-center gap-2 py-1.5 px-3 text-xs font-bold rounded-[5px] transition-all border cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                                                : 'bg-[#FCFAF7] hover:bg-stone-50 text-stone-600 border-stone-200'
                                                        }`}
                                                    >
                                                        <span
                                                            className="w-3 h-3 rounded-full border border-stone-300 shrink-0"
                                                            style={{ backgroundColor: resolveColorHex(product, color) }}
                                                        />
                                                        <span className="truncate">{color}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Food Store Customizers (Sugar & Ice Levels) */}
                                {isFoodStore && (
                                    <>
                                        {/* Sugar Level */}
                                        <div className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-extrabold text-stone-850 text-xs uppercase tracking-wider">
                                                    Sugar Level
                                                </h3>
                                                <span className="text-[9px] font-bold uppercase text-stone-400 bg-stone-100 px-2 py-0.5 rounded-[5px]">
                                                    Select One
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {SUGAR_LEVELS.map((sugar) => {
                                                    const isSelected = selectedSugar === sugar.value;
                                                    return (
                                                        <button
                                                            key={sugar.value}
                                                            onClick={() => setSelectedSugar(sugar.value)}
                                                            className={`py-1.5 px-3 text-[11px] font-bold rounded-[5px] transition-all border shrink-0 ${isSelected
                                                                ? 'bg-stone-900 text-white border-stone-900'
                                                                : 'bg-[#FCFAF7] hover:bg-stone-50 text-stone-600 border-stone-200 cursor-pointer'
                                                                }`}
                                                        >
                                                            {sugar.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Ice Level */}
                                        <div className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-extrabold text-stone-850 text-xs uppercase tracking-wider">
                                                    Ice Level
                                                </h3>
                                                <span className="text-[9px] font-bold uppercase text-stone-400 bg-stone-100 px-2 py-0.5 rounded-[5px]">
                                                    Select One
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {ICE_LEVELS.map((ice) => {
                                                    const isSelected = selectedIce === ice.value;
                                                    return (
                                                        <button
                                                            key={ice.value}
                                                            onClick={() => setSelectedIce(ice.value)}
                                                            className={`py-1.5 px-3 text-[11px] font-bold rounded-[5px] transition-all border shrink-0 ${isSelected
                                                                ? 'bg-stone-900 text-white border-stone-900'
                                                                : 'bg-[#FCFAF7] hover:bg-stone-50 text-stone-600 border-stone-200 cursor-pointer'
                                                                }`}
                                                        >
                                                            {ice.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Attributes Section */}
                                {Object.entries(productOptions).map(([attrName, values]) => {
                                    if (!values || values.length === 0) return null;
                                    return (
                                        <div key={attrName} className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-extrabold text-stone-850 text-xs uppercase tracking-wider">
                                                    {attrName}
                                                </h3>
                                                <span className="text-[9px] font-bold uppercase text-stone-400 bg-stone-100 px-2 py-0.5 rounded-[5px]">
                                                    Choose Option
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {values.map((val) => {
                                                    const isSelected = selectedAttributes[attrName] === val;
                                                    return (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [attrName]: val }))}
                                                            className={`py-1.5 px-3 text-xs font-bold rounded-[5px] transition-all border cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                                                    : 'bg-[#FCFAF7] hover:bg-stone-50 text-stone-600 border-stone-200'
                                                            }`}
                                                        >
                                                            {val}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Product Addons */}
                                {product.addons && product.addons.length > 0 && (
                                    <div className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-extrabold text-stone-850 text-xs uppercase tracking-wider">
                                                Product Addons
                                            </h3>
                                            <span className="text-[9px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-[5px]">
                                                Optional
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {product.addons.map((addon) => {
                                                const isSelected = !!selectedAddons[addon.id];
                                                return (
                                                    <button
                                                        key={addon.id}
                                                        type="button"
                                                        onClick={() => setSelectedAddons(prev => ({ ...prev, [addon.id]: !prev[addon.id] }))}
                                                        className={`flex items-center justify-between py-2.5 px-4 text-left text-xs font-bold rounded-[5px] transition-all border cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-stone-100 text-stone-900 border-stone-400 shadow-xs'
                                                                : 'bg-[#FCFAF7] hover:bg-stone-50 text-stone-770 border-stone-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 ${
                                                                isSelected ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300 bg-white'
                                                            }`}>
                                                                {isSelected && (
                                                                    <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <span>{addon.addon_name}</span>
                                                        </div>
                                                        <span className="shrink-0 font-mono text-stone-500">
                                                            +${Number(addon.additional_price).toFixed(2)}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Special Instructions (Notes) */}
                                <div className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-2">
                                    <div className="flex items-center space-x-1.5 text-stone-850">
                                        <FiEdit3 className="w-3.5 h-3.5 text-stone-400" />
                                        <h3 className="font-extrabold text-xs  ">
                                        Note
                                        </h3>
                                    </div>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Add preparation instructions (e.g. Less sweet, extra hot, oat milk...)"
                                        className="w-full text-xs bg-[#FAF9F5] border border-stone-200/80 rounded-[5px] p-3 outline-none focus:border-black transition-colors resize-none h-18 text-stone-800 placeholder-stone-400"
                                    />
                                </div>
                            </div>

                            {/* Action Panel */}
                            <div className="pt-4 p-2 md:p-4 border-t border-stone-200/60 flex flex-col space-y-4 shrink-0 bg-white">
                                <div className="flex items-center justify-between">
                                    {/* Quantity selector */}
                                    <div className="flex items-center w-[115px] rounded-[5px] bg-stone-100 border border-stone-200 p-0.5 select-none shrink-0">
                                        <button
                                            onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                                            className="w-7.5 h-7.5 rounded-[5px] hover:bg-stone-200 text-stone-800 transition-colors flex items-center justify-center font-bold border-none bg-transparent cursor-pointer text-xs"
                                        >
                                            <FiMinus />
                                        </button>
                                        <span className="flex-1 text-center font-black text-xs text-stone-900 font-mono">
                                            {detailQuantity}
                                        </span>
                                        <button
                                            onClick={() => setDetailQuantity(prev => prev + 1)}
                                            className="w-7.5 h-7.5 rounded-[5px] hover:bg-stone-200 text-stone-800 transition-colors flex items-center justify-center font-bold border-none bg-transparent cursor-pointer text-xs"
                                        >
                                            <FiPlus />
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Total Price</span>
                                        <span className="text-base font-black text-stone-950 font-mono">${productPriceTotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        disabled={isOutOfStock}
                                        onClick={handleAddToCartClick}
                                        className={`flex-1 py-3.5 px-6 font-bold text-xs uppercase tracking-widest rounded-lg transition-all duration-200 shadow-2xs flex items-center justify-center gap-2 border border-stone-200 ${
                                            isOutOfStock
                                                ? 'bg-stone-100 text-stone-400 cursor-not-allowed border-stone-200/55'
                                                : 'bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-900 hover:border-stone-400 cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                                        }`}
                                    >
                                        <FiShoppingBag className="w-4 h-4 shrink-0" />
                                        <span>{isOutOfStock ? 'Out of stock' : 'Add to Cart'}</span>
                                    </button>

                                    <button
                                        disabled={isOutOfStock}
                                        onClick={handleBuyNowClick}
                                        className={`flex-1 py-3.5 px-6 font-bold text-xs uppercase tracking-widest rounded-lg transition-all duration-200 shadow-xs flex items-center justify-center gap-2 border-none ${
                                            isOutOfStock
                                                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-[#9C6B4D] to-[#7C4D31] hover:from-[#aa7758] hover:to-[#8c593a] text-white cursor-pointer hover:scale-[1.01] active:scale-[0.99] hover:shadow-md'
                                        }`}
                                    >
                                        <span>Buy Now</span>
                                    </button>
                                </div>
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
        </>,
        document.body
    );
};
