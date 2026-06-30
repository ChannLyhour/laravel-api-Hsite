import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    FiMinus,
    FiPlus,
    FiShoppingBag,
    FiEdit3,
} from 'react-icons/fi';
import type { Root2 } from '@/api/owner/categories';
import '../../styles/animation.css';
import { couponsService, type CouponRow } from '@/api/owner/coupons';
import { menuItemsService } from '@/api/owner/categories';
import { resolveImageUrl } from '../../utils/imageUtils';
import { parseAttributeValue } from '../../utils/priceUtils';
import { ModelCoupon } from './ModelCoupon';
import { ListAttritubeProduct } from './ListAttritubeProduct';
import { themes } from '@/pages/owner_manage/templete_website/themes';
import { getLightTheme } from '../../utils/themeHelper';

export interface PopupDetailProductProps {
    product: Root2;
    onClose: () => void;
    addToCart: (product: Root2, qty: number, size: string, color: string, addonsPrice?: number) => void;
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

export const PopupDetailProduct: React.FC<PopupDetailProductProps> = ({
    product: initialProduct,
    onClose,
    addToCart,
    stores,
    user,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    coupons: propCoupons,
}) => {
    const [product, setProduct] = useState<Root2>(initialProduct);

    useEffect(() => {
        setProduct(initialProduct);
    }, [initialProduct]);

    useEffect(() => {
        // Prevent background scrolling when popup is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
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
                    .catch(err => console.warn('Failed to refresh product in PopupDetailProduct', err));
            }
        };
        return () => bc.close();
    }, [product.id]);

    // ─── Theme Type Classification ────────────────────────────────────────────────
    const themeType = useMemo(() => {
        const t = stores?.website_theme || 'default';
        if (t === 'electronic') return 'electronic';
        if (t === 'elegant_rose' || t === 'fashion' || t === 'beauty' || t === 'cosmetics') return 'beauty';
        if (t === 'grocery' || t === 'supermarket' || t === 'minimal_dark_green') return 'grocery';
        return 'coffee';
    }, [stores?.website_theme]);

    // Extract unique product options dynamically from variants
    const productOptions = useMemo(() => {
        const options: Record<string, string[]> = {};
        if (product.variants) {
            product.variants.forEach((v: any) => {
                if (v.attribute_values) {
                    v.attribute_values.forEach((av: any) => {
                        const attrName = av.attribute?.name;
                        if (attrName) {
                            if (!options[attrName]) {
                                options[attrName] = [];
                            }
                            const val = av.value;
                            if (val && !options[attrName].includes(val)) {
                                options[attrName].push(val);
                            }
                        }
                    });
                }
            });
        }
        return options;
    }, [product.variants]);

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [selectedAddons, setSelectedAddons] = useState<Record<number, boolean>>({});

    // Sync selectedOptions and selectedAddons to empty when product changes
    useEffect(() => {
        setSelectedOptions({});
        setSelectedAddons({});
    }, [product.id]);

    const [note, setNote] = useState('');
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

    // Find database variant matching selectedOptions
    const variant = useMemo(() => {
        if (!product.variants || product.variants.length === 0) return undefined;
        const matched = product.variants.find((v: any) => {
            if (!v.attribute_values) return false;
            return Object.entries(selectedOptions).every(([attrName, selectedVal]) => {
                return v.attribute_values.some((av: any) => {
                    const name = av.attribute?.name;
                    return name === attrName && av.value === selectedVal;
                });
            });
        });
        return matched || product.variants[0];
    }, [product.variants, selectedOptions]);

    const isOutOfStock = useMemo(() => {
        if (product.status === 'inactive' || product.status === 'draft' || product.status === 'archived') return true;
        if (variant) {
            return (Number(variant.stock_qty) ?? 0) <= 0;
        }
        const firstVar = product.variants?.[0];
        if (!firstVar) return false;
        return (Number(firstVar.stock_qty) ?? 0) <= 0;
    }, [product.status, product.variants, variant]);

    const addonsPrice = useMemo(() => {
        if (!product.addons || product.addons.length === 0) return 0;
        return Object.entries(selectedAddons)
            .filter(([_, checked]) => checked)
            .reduce((sum, [addonId]) => {
                const add = product.addons?.find(a => String(a.id) === addonId);
                return sum + (add ? parseFloat(String(add.additional_price)) : 0);
            }, 0);
    }, [product.addons, selectedAddons]);

    const basePrice = variant ? parseFloat(variant.retail_price) : parseFloat(product.price);
    const price = basePrice + addonsPrice;
    const productPriceTotal = price * detailQuantity;

    const discountInfo = useMemo(() => {
        const basePriceVal = variant ? parseFloat(variant.retail_price) : parseFloat(product.price);
        const compareAt = variant?.compare_at_price;
        let comparePrice = compareAt ? parseFloat(compareAt) : null;
        let discount: string | null = null;

        if (comparePrice && comparePrice > basePriceVal) {
            discount = `-${Math.round((1 - basePriceVal / comparePrice) * 100)}%`;
        } else if ((product as any).discount_amount && parseFloat(String((product as any).discount_amount)) > 0) {
            const discAmt = parseFloat(String((product as any).discount_amount));
            const discType = (product as any).discount_type || 'flat';

            if (discType === 'percent' || discType === 'percentage') {
                discount = `-${discAmt}%`;
                comparePrice = basePriceVal / (1 - discAmt / 100);
            } else {
                discount = `-$${discAmt.toFixed(2)}`;
                comparePrice = basePriceVal + discAmt;
            }
        }

        return {
            hasDiscount: !!discount,
            discount,
            comparePrice
        };
    }, [product, variant]);

    const activeTheme = useMemo(() => {
        const rawTheme = themes[stores?.website_theme || 'default'] || themes.default;
        return getLightTheme(rawTheme);
    }, [stores?.website_theme]);

    const themeStyles = useMemo(() => {
        const primaryBgClass = activeTheme.primaryBg || 'bg-[#8C5A3C]';
        const primaryHoverClass = activeTheme.primaryHover || 'hover:bg-[#704214]';
        const primaryTextClass = activeTheme.primaryText || 'text-[#8C5A3C]';
        const borderStrokeClass = primaryBgClass.includes('gradient') ? 'border-amber-500/10' : primaryBgClass.replace('bg-', 'border-');
        const focusBorderClass = primaryBgClass.includes('gradient') ? 'focus:border-cyan-500' : primaryBgClass.replace('bg-', 'focus:border-');

        const checkboxActive = primaryBgClass.includes('gradient')
            ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500'
            : `${primaryBgClass}/10 ${primaryTextClass} ${borderStrokeClass}`;

        return {
            activeBtn: `${primaryBgClass} text-white ${borderStrokeClass} shadow-sm`,
            badge: `${activeTheme.badgeText || primaryTextClass} ${activeTheme.badgeBg || 'bg-stone-50'}`,
            actionBtn: `${primaryBgClass} ${primaryHoverClass} text-white cursor-pointer`,
            focusBorder: focusBorderClass,
            checkboxActive
        };
    }, [activeTheme]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                {/* Backdrop Blur */}
                <div
                    className="fixed inset-0 bg-stone-900/60 transition-opacity duration-300 animate-fade-in"
                    onClick={onClose}
                />

                {/* Cozy Café order customizer card */}
                <div className="relative bg-[#FDFBF7] w-full max-w-xl rounded-[5px] shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col max-h-[80vh] animate-slide-up z-10 font-sans">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-[5px] bg-white/90 hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-all cursor-pointer text-sm shadow-sm focus:outline-none"
                        >
                            ✕
                        </button>
                    )}

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4 space-y-6 custom-scrollbar">
                        {/* Beverage Centered Image Display */}
                        <div className="w-full flex justify-center py-4 bg-white/40 rounded-[5px] border border-stone-200/40 relative">
                            <img
                                src={resolveImageUrl(product.display_image || product.image) || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80'}
                                alt={product.name}
                                className="max-h-[200px] w-auto object-contain hover:scale-105 transition-transform duration-300"
                            />
                        </div>

                        {/* Beverage Title, Price and Description */}
                        <div className="space-y-2 text-left">
                            <div className="flex justify-between items-baseline">
                                <h2 className="text-xl font-black text-stone-800 tracking-tight leading-tight uppercase font-sans">
                                    {product.name}
                                </h2>
                                <div className="flex flex-col items-end">
                                    {discountInfo.hasDiscount && discountInfo.comparePrice && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-3xs text-stone-400 line-through font-mono">
                                                ${(discountInfo.comparePrice + addonsPrice).toFixed(2)}
                                            </span>
                                            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-[3px]">
                                                {discountInfo.discount}
                                            </span>
                                        </div>
                                    )}
                                    <span className={`text-lg font-black font-mono ${activeTheme.primaryText || 'text-[#8C5A3C]'}`}>
                                        ${price.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            {product.description && (
                                <p className="text-stone-500 text-xs leading-relaxed mt-1 font-medium">
                                    {product.description}
                                </p>
                            )}
                        </div>

                        <hr className="border-stone-200/60 my-2" />

                        {/* Order Customizer Sections */}
                        <div className="space-y-5">
                            <ListAttritubeProduct
                                themeType={themeType}
                                themeStyles={themeStyles}
                                productOptions={productOptions}
                                selectedOptions={selectedOptions}
                                setSelectedOptions={setSelectedOptions}
                                product={product}
                                selectedAddons={selectedAddons}
                                setSelectedAddons={setSelectedAddons}
                            />

                            {/* Notes / Special Instructions */}
                            <div className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-2">
                                <div className="flex items-center space-x-1.5 text-stone-800">
                                    <FiEdit3 className="w-3.5 h-3.5 text-stone-400" />
                                    <h3 className="font-extrabold text-xs uppercase tracking-wider">
                                        Special Instructions
                                    </h3>
                                </div>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add preparation instructions (e.g. Less sweet, extra hot, oat milk...)"
                                    className={`w-full text-xs bg-[#FAF9F5] border border-stone-200/80 rounded-[5px] p-3 outline-none focus:border-stone-400 ${themeStyles.focusBorder} transition-colors resize-none h-18 text-stone-800 placeholder-stone-400`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fixed Bottom Action Bar */}
                    <div className="absolute bottom-0 inset-x-0 bg-white border-t border-stone-200/60 px-6 py-4.5 flex items-center justify-between gap-4 z-20 shadow-md">
                        {/* Quantity Counter */}
                        <div className="flex items-center w-[115px] rounded-[5px] bg-stone-100 border border-stone-200 p-0.5 select-none">
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

                        {/* Add to Order Button */}
                        <button
                            disabled={isOutOfStock}
                            onClick={() => {
                                if (isOutOfStock) return;
                                // Combine selections into size & color strings
                                const sizeKeys = ['size', 'sizes', 'storage', 'capacity', 'volume', 'weight', 'dimension', 'dimensions', 'length', 'width', 'height'];
                                const sizeParts: string[] = [];
                                const colorParts: string[] = [];

                                const getDisplayVal = (attrName: string, val: string) => {
                                    const nameLower = attrName.toLowerCase();
                                    const isColorAttr = nameLower === 'color' || nameLower === 'colour' || nameLower === 'shade' || nameLower === 'tone';
                                    const parsed = parseAttributeValue(val, isColorAttr);
                                    return parsed.value || val;
                                };

                                Object.entries(selectedOptions).forEach(([name, val]) => {
                                    const displayVal = getDisplayVal(name, val);
                                    if (sizeKeys.includes(name.toLowerCase())) {
                                        sizeParts.push(displayVal);
                                    } else {
                                        colorParts.push(`${name}: ${displayVal}`);
                                    }
                                });

                                // Fallback: if no size-related attributes were selected but we have attributes,
                                // we can use the first attribute's value as size
                                let finalSize = sizeParts.join(' / ');
                                if (!finalSize && Object.keys(selectedOptions).length > 0) {
                                    const firstEntry = Object.entries(selectedOptions)[0];
                                    if (firstEntry) {
                                        finalSize = getDisplayVal(firstEntry[0], firstEntry[1]);
                                        const index = colorParts.findIndex(p => p.startsWith(`${firstEntry[0]}:`));
                                        if (index > -1) {
                                            colorParts.splice(index, 1);
                                        }
                                    }
                                }

                                if (!finalSize) {
                                    finalSize = 'Regular';
                                }

                                const addonParts: string[] = [];
                                if (product.addons && product.addons.length > 0) {
                                    Object.entries(selectedAddons).forEach(([addonId, checked]) => {
                                        if (checked) {
                                            const add = product.addons?.find(a => String(a.id) === addonId);
                                            if (add) {
                                                addonParts.push(`${add.addon_name} (+$${parseFloat(String(add.additional_price)).toFixed(2)})`);
                                            }
                                        }
                                    });
                                }
                                const addonsString = addonParts.length > 0 ? `Addons: ${addonParts.join(', ')}` : '';

                                let finalColor = colorParts.join(', ');
                                if (addonsString) {
                                    finalColor = finalColor ? `${finalColor} / ${addonsString}` : addonsString;
                                }
                                const customNotePart = note.trim() ? ` (Note: ${note.trim()})` : '';
                                if (customNotePart) {
                                    finalColor = finalColor ? `${finalColor} (Note: ${note.trim()})` : `Note: ${note.trim()}`;
                                }

                                const productWithAddonsPrice = {
                                    ...product,
                                    price: String(price),
                                    variants: product.variants?.map((v: any) => v.id === variant?.id ? { ...v, retail_price: String(price) } : v)
                                };

                                addToCart(productWithAddonsPrice, detailQuantity, finalSize, finalColor, addonsPrice);
                                onClose();
                            }}
                            className={`flex-1 py-3.5 font-black text-xs uppercase tracking-widest rounded-[5px] transition-colors border-none shadow-sm flex items-center justify-center gap-2 ${isOutOfStock
                                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                : themeStyles.actionBtn
                                }`}
                        >
                            <FiShoppingBag className="w-4 h-4" />
                            <span>{isOutOfStock ? 'Out of stock' : `Add to order • $${productPriceTotal.toFixed(2)}`}</span>
                        </button>
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
