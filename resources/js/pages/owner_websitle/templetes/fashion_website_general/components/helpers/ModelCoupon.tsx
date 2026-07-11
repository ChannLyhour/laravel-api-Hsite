import React from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft } from 'react-icons/fi';
import type { CouponRow } from '@/api/owner/coupons';

export interface ModelCouponProps {
    isOpen: boolean;
    onClose: () => void;
    coupons: CouponRow[];
    appliedCoupon?: CouponRow | null;
    onApplyCoupon: (code: string) => void;
    subtotal?: number; // Optional: To show "Min purchase not met"
    copiedCode?: string;
    onCopyCode?: (code: string) => void;
    isLoggedIn?: boolean;
    couponUseCounts?: Record<string, number>;
}

export const ModelCoupon: React.FC<ModelCouponProps> = ({
    isOpen,
    onClose,
    coupons,
    appliedCoupon,
    onApplyCoupon,
    subtotal = 0,
    copiedCode,
    onCopyCode,
    isLoggedIn = true,
    couponUseCounts = {},
}) => {
    if (!isOpen) return null;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleCopy = (e: React.MouseEvent, code: string) => {
        e.stopPropagation();
        if (onCopyCode) {
            onCopyCode(code);
        } else {
            navigator.clipboard.writeText(code);
        }
    };

    return createPortal(
        <>
            {/* Backdrop overlay */}
            <div
                className="fixed inset-0 z-[9999] bg-stone-950/40 backdrop-blur-2xs transition-opacity duration-300 animate-fade-in"
                onClick={onClose}
            />
            {/* Drawer panel */}
            <div
                className="fixed inset-y-0 right-0 z-[10000] w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 animate-slide-in-right border-l border-stone-200"
            >
                {/* Header */}
                <div className="h-16 flex items-center border-b border-stone-150 px-6 bg-white shrink-0 relative">
                    <button
                        onClick={onClose}
                        className="absolute left-6 p-2 hover:bg-stone-100 rounded-full border-none bg-transparent cursor-pointer text-stone-850 flex items-center justify-center focus:outline-none transition-colors"
                    >
                        <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="w-full text-center font-sans font-black text-xs tracking-[0.15em] uppercase text-stone-950 select-none">
                        Select a Voucher
                    </span>
                </div>

                {/* List content */}
                <div className="flex-grow overflow-y-auto bg-stone-50/50 p-6 space-y-4">
                    {!isLoggedIn ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16 text-stone-600">
                            <span className="text-4xl">🎫</span>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-wider text-stone-900">Login Required</p>
                                <p className="text-[11px] text-stone-500 font-medium">Please login or register to view and use store vouchers.</p>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    window.dispatchEvent(new CustomEvent('request_login'));
                                }}
                                className="px-6 py-3 bg-stone-900 hover:bg-stone-850 text-white font-black text-xs uppercase tracking-widest rounded-[3px] border-none cursor-pointer transition-colors duration-200"
                            >
                                Login / Register
                            </button>
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16 text-stone-400">
                            <span className="text-3xl">🎫</span>
                            <p className="text-2xs font-extrabold uppercase tracking-wider">No vouchers available</p>
                        </div>
                    ) : (
                        coupons.map((coupon) => {
                            const isChecked = appliedCoupon?.code === coupon.code;
                            const isCopied = copiedCode === coupon.code;

                            const minPurchase = coupon.minimum_purchase ? parseFloat(String(coupon.minimum_purchase)) : 0;
                            const isNotEnough = subtotal > 0 && subtotal < minPurchase;

                            const useCount = couponUseCounts[coupon.code.toUpperCase()] || 0;
                            const isUserLimitReached = coupon.limit_same_user != null && useCount >= coupon.limit_same_user;
                            const isGlobalLimitReached = coupon.limit_total != null && coupon.total_used >= coupon.limit_total;
                            const isLocked = isUserLimitReached || isGlobalLimitReached;

                            const isExpired = coupon.expire_date ? new Date(coupon.expire_date) < new Date() : false;
                            const isDisabled = isNotEnough || isLocked || isExpired;

                            const discountValue = coupon.discount_type === 'percentage'
                                ? `${parseFloat(String(coupon.discount_amount))}%`
                                : `$${parseFloat(String(coupon.discount_amount)).toFixed(2)}`;

                            return (
                                <div
                                    key={coupon.id}
                                    onClick={() => {
                                        if (!isDisabled) {
                                            onApplyCoupon(coupon.code);
                                        }
                                    }}
                                    className={`flex items-center gap-3.5 p-1.5 rounded-xl transition-all select-none ${isDisabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-stone-100/50 cursor-pointer'
                                        }`}
                                >
                                    {/* Checkbox Column */}
                                    <div className="shrink-0 pl-0.5">
                                        <div
                                            className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all ${isNotEnough
                                                ? 'border-stone-200 bg-stone-50/50 cursor-not-allowed'
                                                : isChecked
                                                    ? 'border-stone-950 text-stone-950 bg-stone-50'
                                                    : 'border-stone-300 bg-white'
                                                }`}
                                        >
                                            {isChecked && (
                                                <svg className="w-3.5 h-3.5 text-stone-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ticket Style Card */}
                                    <div
                                        className={`flex-grow p-4 bg-white border rounded-lg text-left relative overflow-hidden flex flex-col justify-between min-h-[120px] shadow-3xs transition-all border-stone-200/80 ${isChecked ? 'border-stone-950 ring-1 ring-stone-900/10' : ''}`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-3.5">
                                                {/* Vertical Ticket Icon shape */}
                                                <div className={`w-10 h-12 ${isLocked || isExpired ? 'bg-stone-300' : 'bg-[#b0124a]'} rounded-[4px] relative flex flex-col justify-between items-center py-1.5 shrink-0 overflow-hidden shadow-3xs`}>
                                                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
                                                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />

                                                    <div className="w-1 h-1 rounded-full bg-white/90" />
                                                    <div className="w-1 h-1 rounded-full bg-white/90" />
                                                    <div className="w-1 h-1 rounded-full bg-white/90" />
                                                </div>

                                                {/* Details Column */}
                                                <div className="flex-grow min-w-0">
                                                    <h4 className="text-xs font-black text-stone-900 tracking-tight leading-snug uppercase truncate">
                                                        {coupon.title || 'Cash Voucher'}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 mt-1 text-stone-500 flex-wrap">
                                                        <span className="text-xs font-black text-stone-900">{discountValue}</span>
                                                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-stone-100 rounded-full text-[9px] font-black text-stone-400 cursor-help" title="Terms & Conditions apply">
                                                            ⓘ
                                                        </span>
                                                        <span className="text-[10px] font-bold text-stone-500 tracking-wide font-mono uppercase">
                                                            {coupon.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dashed Separator Line and Edge Notches */}
                                        <div className="relative my-2.5 -mx-4">
                                            <div className="border-t border-dashed border-stone-200/80 w-full" />
                                            <div className="absolute left-0 -translate-x-1/2 -top-1.5 w-3 h-3 rounded-full border border-stone-200 bg-white z-10" />
                                            <div className="absolute right-0 translate-x-1/2 -top-1.5 w-3 h-3 rounded-full border border-stone-200 bg-white z-10" />
                                        </div>

                                        {/* Bottom Actions Row */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="px-2.5 py-0.5 bg-stone-50 border border-stone-200/60 rounded-full text-[9px] text-stone-500 font-medium tracking-tight truncate max-w-[80%]">
                                                {isExpired ? 'Expired' : isUserLimitReached ? 'Usage limit reached' : isGlobalLimitReached ? 'Redeemed' : coupon.minimum_purchase ? `Min. purchase $${parseFloat(String(coupon.minimum_purchase)).toFixed(2)}` : 'No min. purchase'} • Valid until {formatDate(coupon.expire_date)}
                                            </div>

                                            <button
                                                onClick={(e) => handleCopy(e, coupon.code)}
                                                disabled={isDisabled}
                                                className="text-[11px] font-bold text-stone-850 hover:text-stone-950 transition-colors border-none bg-transparent hover:underline cursor-pointer shrink-0 disabled:text-stone-300 disabled:no-underline disabled:cursor-not-allowed"
                                            >
                                                {isUserLimitReached ? 'Used' : isGlobalLimitReached ? 'Redeemed' : isExpired ? 'Expired' : isCopied ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>,
        document.body
    );
};
