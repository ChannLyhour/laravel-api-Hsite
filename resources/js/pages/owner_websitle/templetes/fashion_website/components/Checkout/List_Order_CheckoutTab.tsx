import React from 'react';
import { FiShoppingBag, FiCheck, FiChevronRight } from 'react-icons/fi';
import { FASHION_ROUTES } from '../../routes';

export interface CartItem {
    id: any;
    name: string;
    code: string;
    variant: string;
    qty: number;
    price: number;
    image: string;
}

interface ListOrderCheckoutTabProps {
    items: CartItem[];
    subtotal: number;
    isLocked: boolean;
    onNext: () => void;
    onEdit: () => void;
    stores: any;
    ownerUserId: number | string | undefined;
    onNavigate?: (to: string) => void;
}

export const List_Order_CheckoutTab: React.FC<ListOrderCheckoutTabProps> = ({
    items,
    subtotal,
    isLocked,
    onNext,
    onEdit,
    stores,
    ownerUserId,
    onNavigate,
}) => {
    return (
        <div className={`bg-white rounded-sm border transition-all duration-300 shadow-2xs ${!isLocked ? 'border-stone-900 ring-1 ring-stone-900/10 p-5' : 'border-stone-200/60 p-5'}`}>
            {/* Header section (shows summary if locked, otherwise step title) */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                {isLocked ? (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white shrink-0">
                            <FiCheck className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black text-stone-900 uppercase tracking-widest">
                                1. Shopping Bag
                            </h2>
                            <p className="text-[11px] text-stone-400 font-bold uppercase tracking-wider mt-0.5 animate-fade-in">
                                {items.length} {items.length === 1 ? 'item' : 'items'} • US ${subtotal.toFixed(2)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-black">1</span>
                        Review Shopping Bag
                    </h2>
                )}

                {isLocked ? (
                    <button
                        onClick={onEdit}
                        className="text-[10px] font-black text-stone-500 hover:text-stone-900 uppercase tracking-widest border border-stone-200 hover:border-stone-900 px-3 py-1.5 rounded-sm bg-transparent cursor-pointer transition-all duration-200"
                    >
                        Modify
                    </button>
                ) : (
                    <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-sm font-black uppercase tracking-wider">
                        Step 1 of 3
                    </span>
                )}
            </div>

            {/* Content with smooth slide-down dropdown transition */}
            <div className={`grid transition-all duration-300 ease-in-out ${!isLocked ? 'opacity-100' : 'opacity-0'}`} style={{ gridTemplateRows: !isLocked ? '1fr' : '0fr' }}>
                <div className="overflow-hidden">
                    <div className="divide-y divide-stone-100 mt-4 space-y-4">
                        {items.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center justify-center gap-4 animate-fade-in">
                                <span className="text-3xl text-stone-300">🛍️</span>
                                <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">Your shopping bag is empty</p>
                                <button
                                    onClick={() => {
                                        if (onNavigate) {
                                            const storeSettings = JSON.parse(localStorage.getItem('store_settings') || '{}');
                                            const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                                            const resolvedId = ownerUserId || stores?.created_by || storeSettings?.created_by || stores?.id || '';
                                            onNavigate(FASHION_ROUTES.getShop(resolvedId, storeSlug));
                                        }
                                    }}
                                    className="px-6 py-3 bg-stone-900 hover:bg-stone-850 text-white rounded-[3px] font-black text-xs uppercase tracking-widest border-none cursor-pointer transition-colors duration-200 shadow-xs focus:outline-none"
                                >
                                    Go to Shop
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                    {items.map((item, idx) => (
                                        <div key={item.id + idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                            <div className="w-16 h-20 bg-stone-50 border border-stone-100 rounded-sm overflow-hidden shrink-0">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            <div className="flex-1 flex flex-col justify-between text-xs text-stone-500">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-stone-900 text-sm line-clamp-1">{item.name}</h3>
                                                    {item.code && <p className="text-[10px]">Code: {item.code}</p>}
                                                    {item.variant && (
                                                        <p className="text-[10px] uppercase font-bold text-stone-400">
                                                            {item.variant}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] font-medium">Quantity x {item.qty}</p>
                                                </div>

                                                <div className="flex justify-between items-baseline mt-1">
                                                    <span className="text-xs font-black text-stone-900">
                                                        US ${item.price.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <button
                                        onClick={onNext}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] font-black text-xs uppercase tracking-widest border-none cursor-pointer transition-all duration-200 flex items-center gap-2 shadow-sm focus:outline-none"
                                    >
                                        Proceed to Delivery <FiChevronRight className="w-4 h-4 stroke-[2.5]" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
