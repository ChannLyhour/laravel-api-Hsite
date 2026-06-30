import React, { useState, useEffect } from 'react';
import { FiGift, FiInfo } from 'react-icons/fi';
import { toast } from '../../utils/toast';
import { couponsService, type CouponRow } from '@/api/owner/coupons';
import { ordersService } from '@/api/owner/orders';

const KHMER_MONTHS = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

const formatDate = (dateStr: string, isKhmer: boolean) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    if (isKhmer) {
        const day = d.getDate();
        const month = KHMER_MONTHS[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ខែ${month} ${year}`;
    }
    return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

interface VouchersTabProps {
    user: any;
    ownerUserId?: number | string;
    locale?: string;
}

export const VouchersTab: React.FC<VouchersTabProps> = ({
    user,
    ownerUserId,
    locale = 'en',
}) => {
    const [coupons, setCoupons] = useState<CouponRow[]>([]);
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
    const [couponUseCounts, setCouponUseCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        if (user) {
            setIsLoadingCoupons(true);
            Promise.all([
                couponsService.getCoupons({ created_by: ownerUserId }),
                ordersService.getCustomerOrders(undefined)
            ])
                .then(([couponsData, ordersData]) => {
                    const filtered = (couponsData || []).filter(
                        c => !c.customer_id || c.customer_id === user?.id
                    );
                    setCoupons(filtered);

                    // Count coupon usages
                    const counts: Record<string, number> = {};
                    (ordersData || []).forEach(order => {
                        if (order.couponCode && order.status !== 'canceled') {
                            const code = order.couponCode.toUpperCase();
                            counts[code] = (counts[code] || 0) + 1;
                        }
                    });
                    setCouponUseCounts(counts);
                })
                .catch(err => {
                    console.error('Failed to load coupons or orders', err);
                    toast.error('Could not load vouchers');
                })
                .finally(() => setIsLoadingCoupons(false));
        }
    }, [user, ownerUserId]);

    const isKhmer = locale === 'km';
    const t = {
        title: isKhmer ? 'ប័ណ្ណចំណាយ និងការផ្តល់ជូន' : 'Vouchers & Gift Cards',
        noVouchers: isKhmer ? 'មិនមានប័ណ្ណសកម្មទេ' : 'No Active Vouchers',
        noVouchersDesc: isKhmer ? 'បច្ចុប្បន្ននេះមិនមានកូដបញ្ចុះតម្លៃសម្រាប់ហាងនេះទេ។' : 'There are currently no discount codes available for this boutique.',
        minPurchase: isKhmer ? 'ការចំណាយតិចបំផុត' : 'Min. purchase',
        validUntil: isKhmer ? 'បានប្រើដោយ' : 'Valid until',
        copy: isKhmer ? 'ប្រើឥឡូវនេះ' : 'Copy',
        copied: isKhmer ? 'បានចម្លងកូដជោគជ័យ!' : 'Code copied to clipboard!',
        expired: isKhmer ? 'ផុតកំណត់' : 'Expired',
        inactive: isKhmer ? 'មិនសកម្ម' : 'Inactive',
        usedLimit: isKhmer ? 'បានប្រើប្រាស់' : 'Used',
    };

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div className="sticky top-14 z-30 bg-white -mx-4 px-4 sm:-mx-5 sm:px-5 pt-4 pb-3 mb-6 border-b border-stone-100 flex items-center gap-2.5">
                <FiGift className="w-5 h-5 text-stone-800" />
                <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                    {t.title}
                </h2>
            </div>

            {isLoadingCoupons ? (
                <div className="py-16 flex justify-center items-center">
                    <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                </div>
            ) : coupons.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                    <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
                        <FiGift className="w-6 h-6 text-stone-200" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-black text-stone-900 uppercase tracking-widest">{t.noVouchers}</p>
                        <p className="text-[10px] text-stone-400 font-medium">{t.noVouchersDesc}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coupons.map(coupon => {
                        const isExpired = new Date(coupon.expire_date) < new Date();
                        const isActive = coupon.is_active;
                        const isDisabled = isExpired || !isActive;

                        const useCount = couponUseCounts[coupon.code.toUpperCase()] || 0;
                        const isUserLimitReached = coupon.limit_same_user != null && useCount >= coupon.limit_same_user;
                        const isGlobalLimitReached = coupon.limit_total != null && coupon.total_used >= coupon.limit_total;
                        const isLocked = isUserLimitReached || isGlobalLimitReached;
                        const isDisabledOrLocked = isDisabled || isLocked;

                        const discountValue = coupon.discount_type === 'percentage'
                            ? `${parseFloat(String(coupon.discount_amount))}%`
                            : `$${parseFloat(String(coupon.discount_amount)).toFixed(2)}`;

                        const formattedExpireDate = formatDate(coupon.expire_date, isKhmer);

                        return (
                            <div
                                key={coupon.id}
                                className={`p-4 bg-white border border-stone-200 rounded-lg text-left relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-3xs transition-all ${isDisabledOrLocked ? 'opacity-60 bg-stone-50/25' : ''}`}
                            >
                                <div>
                                    <div className="flex items-center gap-3">
                                        {/* Vertical Ticket Icon shape */}
                                        <div className={`w-12 h-14 ${isDisabledOrLocked ? 'bg-stone-300' : 'bg-[#b0124a]'} rounded-[4px] relative flex flex-col justify-between items-center py-2 shrink-0 overflow-hidden shadow-3xs`}>
                                            {/* Mini edge notches on the pink ticket itself */}
                                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full" />
                                            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full" />

                                            {/* Vertical ticket punch dots */}
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
                                        </div>

                                        {/* Details Column */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs sm:text-sm font-semibold text-stone-850 tracking-tight leading-snug truncate">
                                                {coupon.title || (coupon.coupon_type === 'free_delivery' ? (isKhmer ? 'ដឹកជញ្ជូនឥតគិតថ្លៃសម្រាប់ការបញ្ជាទិញ' : 'Free Delivery Entire Order') : (isKhmer ? 'បញ្ចុះតម្លៃសម្រាប់ការបញ្ជាទិញ' : 'Discount Entire Order'))}
                                            </h3>

                                            <div className="flex items-center gap-1.5 mt-1 text-stone-500">
                                                <span className="text-sm font-black text-stone-900 leading-none">{discountValue}</span>
                                                <FiInfo className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                                <span className="text-xs font-bold text-stone-500 tracking-wide font-mono uppercase leading-none">{coupon.code}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dashed Separator Line and Edge Notches */}
                                <div className="relative my-3 -mx-4">
                                    <div className="border-t border-dashed border-stone-200/80 w-full" />
                                    {/* Left card edge notch */}
                                    <div className="absolute left-0 -translate-x-1/2 -top-2 w-4 h-4 rounded-full border border-stone-200 bg-[#F9F9F9] z-10" />
                                    {/* Right card edge notch */}
                                    <div className="absolute right-0 translate-x-1/2 -top-2 w-4 h-4 rounded-full border border-stone-200 bg-[#F9F9F9] z-10" />
                                </div>

                                {/* Bottom Actions Row */}
                                <div className="flex items-center justify-between">
                                    {/* Localized pill badge */}
                                    <div className="px-3 py-1 bg-stone-50 border border-stone-200/60 rounded-full text-[10px] text-stone-500 font-medium tracking-tight">
                                        {t.minPurchase} ${parseFloat(String(coupon.minimum_purchase || 0)).toFixed(2)} • {t.validUntil} {formattedExpireDate}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isDisabledOrLocked && (
                                            <span className="text-[9px] font-bold text-stone-400 uppercase">
                                                {!isActive ? t.inactive : isExpired ? t.expired : isUserLimitReached ? t.usedLimit : 'Redeemed'}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(coupon.code);
                                                toast.success(t.copied);
                                            }}
                                            disabled={isDisabledOrLocked}
                                            className="text-xs font-bold text-stone-850 hover:text-stone-900 transition-colors cursor-pointer border-none bg-transparent hover:underline disabled:text-stone-300 disabled:no-underline disabled:cursor-not-allowed"
                                        >
                                            {isUserLimitReached ? t.usedLimit : isGlobalLimitReached ? (isKhmer ? 'អស់កំណត់' : 'Redeemed') : t.copy}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

