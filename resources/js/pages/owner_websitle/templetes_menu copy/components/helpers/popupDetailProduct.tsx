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

export interface PopupDetailProductProps {
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

    // Gather available sizes from variants, fall back to Regular/Large if empty
    const availableSizes = useMemo(() => {
        const sizesSet = new Set<string>();
        if (product.variants) {
            product.variants.forEach((v: any) => {
                if (v.attribute_values) {
                    v.attribute_values.forEach((av: any) => {
                        const attrName = (av.attribute?.name || '').toLowerCase();
                        if (attrName === 'size' || attrName === 'sizes') {
                            const parsed = parseAttributeValue(av.value);
                            if (parsed.value) sizesSet.add(parsed.value);
                        }
                    });
                }
            });
        }
        return sizesSet.size > 0 ? Array.from(sizesSet) : ['Regular', 'Large'];
    }, [product.variants]);

    // Customer selections states
    const [selectedSize, setSelectedSize] = useState(() => availableSizes[0] || 'Regular');
    const [selectedSugar, setSelectedSugar] = useState('100% (Normal)');
    const [selectedIce, setSelectedIce] = useState('Regular Ice');
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

    // Find database variant matching selectedSize
    const variant = useMemo(() => {
        if (!product.variants || product.variants.length === 0) return undefined;
        return product.variants.find((v: any) => {
            if (!v.attribute_values) return false;
            return v.attribute_values.some((av: any) => {
                const attrName = (av.attribute?.name || '').toLowerCase();
                const parsed = parseAttributeValue(av.value);
                return (attrName === 'size' || attrName === 'sizes') && parsed.value.toLowerCase() === selectedSize.toLowerCase();
            });
        }) || product.variants[0];
    }, [product.variants, selectedSize]);

    const isOutOfStock = useMemo(() => {
        if (product.status === 'inactive' || product.status === 'draft' || product.status === 'archived') return true;
        if (variant) {
            return (Number(variant.stock_qty) ?? 0) <= 0;
        }
        const firstVar = product.variants?.[0];
        if (!firstVar) return false;
        return (Number(firstVar.stock_qty) ?? 0) <= 0;
    }, [product.status, product.variants, variant]);

    const price = variant ? parseFloat(variant.retail_price) : parseFloat(product.price);
    const productPriceTotal = price * detailQuantity;

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
                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-[5px] bg-white/90 hover:bg-stone-100 border border-stone-250 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-all cursor-pointer text-sm shadow-sm focus:outline-none"
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
                                <h2 className="text-xl font-black text-stone-850 tracking-tight leading-tight uppercase font-sans">
                                    {product.name}
                                </h2>
                                <span className="text-lg font-black text-[#8C5A3C] font-mono">
                                    ${price.toFixed(2)}
                                </span>
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
                            {/* 1. Size Selection */}
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
                                    {availableSizes.map((sz) => {
                                        const isSelected = selectedSize === sz;
                                        return (
                                            <button
                                                key={sz}
                                                onClick={() => setSelectedSize(sz)}
                                                className={`py-2 px-3 text-center text-xs font-black rounded-[5px] transition-all border ${isSelected
                                                    ? 'bg-[#8C5A3C] text-white border-[#8C5A3C] shadow-sm'
                                                    : 'bg-[#FCFAF7] hover:bg-stone-50 text-stone-750 border-stone-200 cursor-pointer'
                                                    }`}
                                            >
                                                {sz}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Sugar Level Selection */}
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

                            {/* 3. Ice Level Selection */}
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

                            {/* 4. Notes / Special Instructions */}
                            <div className="rounded-[5px] p-4.5 bg-white border border-stone-200/50 shadow-3xs space-y-2">
                                <div className="flex items-center space-x-1.5 text-stone-850">
                                    <FiEdit3 className="w-3.5 h-3.5 text-stone-400" />
                                    <h3 className="font-extrabold text-xs uppercase tracking-wider">
                                        Special Instructions
                                    </h3>
                                </div>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add preparation instructions (e.g. Less sweet, extra hot, oat milk...)"
                                    className="w-full text-xs bg-[#FAF9F5] border border-stone-200/80 rounded-[5px] p-3 outline-none focus:border-[#8C5A3C] transition-colors resize-none h-18 text-stone-800 placeholder-stone-400"
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
                                // Package the customized selections into size & color strings so useCart processes them
                                const sizeSelection = selectedSize;
                                const customNotePart = note.trim() ? ` (Note: ${note.trim()})` : '';
                                const colorSelection = `Ice: ${selectedIce}, Sugar: ${selectedSugar}${customNotePart}`;

                                addToCart(product, detailQuantity, sizeSelection, colorSelection);
                                onClose();
                            }}
                            className={`flex-1 py-3.5 font-black text-xs uppercase tracking-widest rounded-[5px] transition-colors border-none shadow-sm flex items-center justify-center gap-2 ${isOutOfStock
                                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                : 'bg-[#8C5A3C] hover:bg-[#704214] text-white cursor-pointer'
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
