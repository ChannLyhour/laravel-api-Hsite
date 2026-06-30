import React from 'react';
import { FiShoppingCart, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { Root2, ProductVariant } from '@/api/owner/categories';

interface CartItem {
  id: string;
  item: Root2;
  qty: number;
  selectedVariant?: ProductVariant;
}

interface CartScreenProps {
  isDarkTheme: boolean;
  activeTheme: {
    primaryBg: string;
    primaryText: string;
    primaryHover: string;
    shadowClass: string;
  };
  cart: CartItem[];
  handleCheckoutSubmit: (e: React.FormEvent) => void;
  getProductPrice: (product: Root2, variant?: ProductVariant | null) => number;
  getTranslation: (item: Root2, currentLocale?: 'en' | 'km') => { name: string; description: string };
  getVariantLabel: (variantOrSku: any, baseSku?: string) => string;
  getProductImage: (product: Root2, variant?: ProductVariant | null) => string;
  handleUpdateQty: (id: string, delta: number) => void;
  handleRemoveFromCart: (id: string, name: string) => void;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isCheckingOut: boolean;
  locale: 'en' | 'km';
}

export const CartScreen: React.FC<CartScreenProps> = ({
  isDarkTheme,
  activeTheme,
  cart,
  handleCheckoutSubmit,
  getProductPrice,
  getTranslation,
  getVariantLabel,
  getProductImage,
  handleUpdateQty,
  handleRemoveFromCart,
  subtotal,
  deliveryFee,
  total,
  isCheckingOut,
  locale,
}) => {
  return (
    <div className="p-4 space-y-6 flex-grow flex flex-col pb-20 animate-fade-in overflow-hidden">
      <h2 className={`text-base font-black flex items-center space-x-2 shrink-0 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
        <FiShoppingCart className={`w-4 h-4 ${activeTheme.primaryText}`} />
        <span>My Cart ({cart.length})</span>
      </h2>

      {cart.length > 0 ? (
        <form onSubmit={handleCheckoutSubmit} className="space-y-5 flex-grow flex flex-col justify-between overflow-hidden">
          {/* Cart scroll area */}
          <div className="space-y-4 overflow-y-auto flex-grow pb-2 scrollbar-none">
            {cart.map((ci) => {
              const activePrice = getProductPrice(ci.item, ci.selectedVariant);
              const { name: itemDisplayName } = getTranslation(ci.item, locale);
              const variantLabel = ci.selectedVariant
                ? ` (${getVariantLabel(ci.selectedVariant, ci.item.sku)})`
                : '';
              return (
                <div
                  key={ci.id}
                  className={`p-3 rounded-[7px] border flex items-center gap-3 relative ${isDarkTheme ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}
                >
                  <div className="w-12 h-12 rounded-[7px] overflow-hidden shrink-0 border border-slate-100/10">
                    <img src={getProductImage(ci.item, ci.selectedVariant)} alt={itemDisplayName} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-grow min-w-0">
                    <h4 className={`text-xs font-black truncate leading-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      {itemDisplayName}{variantLabel}
                    </h4>
                    <span className={`text-[10px] font-bold block mt-1.5 ${activeTheme.primaryText}`}>${activePrice.toFixed(2)}</span>
                  </div>

                  {/* Plus minus quantity row */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(ci.id, -1)}
                      className={`w-5 h-5 rounded-[7px] flex items-center justify-center transition-colors text-2xs cursor-pointer ${isDarkTheme ? 'bg-slate-800 text-slate-350 hover:bg-slate-700' : 'bg-slate-200 text-slate-655 hover:bg-slate-300'
                        }`}
                    >
                      <FiMinus className="w-2.5 h-2.5" />
                    </button>
                    <span className={`text-xs font-black w-3 text-center ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>{ci.qty}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(ci.id, 1)}
                      className={`w-5 h-5 rounded-[7px] flex items-center justify-center transition-colors text-2xs cursor-pointer ${isDarkTheme ? 'bg-slate-800 text-slate-350 hover:bg-slate-700' : 'bg-slate-200 text-slate-655 hover:bg-slate-300'
                        }`}
                    >
                      <FiPlus className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(ci.id, itemDisplayName)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Pricing block summary details */}
          <div className="space-y-4 shrink-0 font-sans">
            <div className={`p-4 rounded-[7px] border space-y-2.5 text-xs font-bold ${isDarkTheme ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
              <div className="flex justify-between text-slate-450">
                <span>Subtotal:</span>
                <span className={isDarkTheme ? 'text-slate-200' : 'text-slate-800'}>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-450">
                <span>Delivery Fee:</span>
                <span className={isDarkTheme ? 'text-slate-200' : 'text-slate-800'}>
                  {deliveryFee === 0 ? <span className="text-emerald-500 font-extrabold">FREE</span> : `$${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className={`flex justify-between items-center text-sm font-black pt-2 border-t border-slate-100/10 ${isDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>
                <span>Total:</span>
                <span className={activeTheme.primaryText}>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCheckingOut}
              className={`w-full py-3.5 rounded-[7px] font-black text-xs text-white cursor-pointer transition-transform active:scale-95 text-center flex items-center justify-center space-x-2 ${activeTheme.primaryBg
                } shadow-md ${activeTheme.shadowClass}`}
            >
              {isCheckingOut ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing Order...</span>
                </>
              ) : (
                <span>Place Checkout Order · ${total.toFixed(2)}</span>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-20 space-y-3 flex-grow flex flex-col justify-center items-center">
          <FiShoppingCart className="text-slate-400 w-12 h-12 stroke-[1.5]" />
          <div>
            <h4 className={`text-sm font-black ${isDarkTheme ? 'text-white' : 'text-slate-805'}`}>Your Cart is Empty</h4>
            <p className="text-slate-400 text-[10px] font-semibold mt-1">Browse our top selling delicacies to add meals!</p>
          </div>
        </div>
      )}
    </div>
  );
};
