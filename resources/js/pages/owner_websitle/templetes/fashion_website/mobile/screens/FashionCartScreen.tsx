import React, { useState } from 'react';
import { FiShoppingBag, FiMinus, FiPlus, FiTrash2, FiTag, FiPercent } from 'react-icons/fi';
import type { CartItem } from '../../types';
import { toast } from '../../utils/toast';

interface FashionCartScreenProps {
  isDarkTheme: boolean;
  cart: CartItem[];
  handleCheckoutSubmit: (e: React.FormEvent, checkoutData: any) => void;
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string, name: string) => void;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  isCheckingOut: boolean;
  appliedCoupon: any;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  settings: any;
}

export const FashionCartScreen: React.FC<FashionCartScreenProps> = ({
  isDarkTheme,
  cart,
  handleCheckoutSubmit,
  updateQty,
  removeFromCart,
  subtotal,
  discount,
  deliveryFee,
  total,
  isCheckingOut,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
  settings,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Form Fields for checkout
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Shipping progress computation
  const freeShippingThreshold = settings?.free_shipping_threshold ? parseFloat(settings.free_shipping_threshold) : 50;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      setIsApplying(true);
      await applyCoupon(couponCode);
      setCouponCode('');
    } catch (err) {
      toast.error('Invalid coupon code');
    } finally {
      setIsApplying(false);
    }
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error('Please fill in all delivery fields');
      return;
    }
    handleCheckoutSubmit(e, { name, phone, address, city });
  };

  return (
    <div className="p-4 space-y-6 flex-grow flex flex-col pb-20 animate-fade-in overflow-hidden">
      {/* Header */}
      <h2 className={`text-base font-serif tracking-widest uppercase flex items-center space-x-2 shrink-0 ${isDarkTheme ? 'text-white' : 'text-stone-900'}`}>
        <FiShoppingBag className="w-4 h-4 shrink-0 text-rose-600" />
        <span>Shopping Bag ({cart.reduce((sum, item) => sum + item.qty, 0)})</span>
      </h2>

      {cart.length > 0 ? (
        <form onSubmit={handleOrderSubmit} className="space-y-6 flex-grow flex flex-col justify-between overflow-hidden">
          {/* Scroll Area */}
          <div className="space-y-5 overflow-y-auto flex-grow pb-2 scrollbar-none">
            {/* Shipping Target Progress */}
            <div className={`p-3.5 rounded-[4px] border ${
              isDarkTheme ? 'bg-stone-900/30 border-stone-850' : 'bg-stone-55 border-stone-150'
            } text-[10px] font-semibold space-y-2`}>
              <div className="flex justify-between items-center text-stone-500">
                <span>Free shipping threshold: <strong>${freeShippingThreshold.toFixed(2)}</strong></span>
                <span>Subtotal: <strong>${subtotal.toFixed(2)}</strong></span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-850 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {remainingForFreeShipping > 0 ? (
                <p className="text-stone-400 font-bold">Add <strong className="text-rose-500">${remainingForFreeShipping.toFixed(2)}</strong> more to unlock FREE shipping.</p>
              ) : (
                <p className="text-emerald-600 font-black tracking-wide uppercase">✓ You have unlocked FREE shipping!</p>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.map((ci) => {
                const itemPrice = parseFloat(ci.item.price);
                return (
                  <div
                    key={ci.id}
                    className={`p-3 rounded-[4px] border flex gap-3 relative transition-all ${
                      isDarkTheme ? 'bg-stone-900/40 border-stone-850' : 'bg-white border-stone-150 shadow-3xs'
                    }`}
                  >
                    {/* Item Image */}
                    <div className="w-16 h-20 bg-stone-100 rounded-[2px] overflow-hidden shrink-0 border border-stone-200/40">
                      <img
                        src={ci.selectedImage || ci.item.display_image || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80'}
                        alt={ci.item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                      <div className="space-y-1">
                        <h4 className={`text-xs font-semibold truncate leading-tight ${isDarkTheme ? 'text-stone-200' : 'text-stone-800'}`}>
                          {ci.item.name}
                        </h4>
                        {/* Size/Color Attributes Labels */}
                        {(ci.selectedSize || ci.selectedColor) && (
                          <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-stone-400 font-bold uppercase tracking-wider">
                            {ci.selectedSize && <span>Size: {ci.selectedSize}</span>}
                            {ci.selectedSize && ci.selectedColor && <span>•</span>}
                            {ci.selectedColor && (
                              <div className="flex items-center gap-1">
                                <span>Color:</span>
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-stone-300 shadow-3xs inline-block"
                                  style={{ backgroundColor: ci.selectedColor.startsWith('#') ? ci.selectedColor : '#CCC' }}
                                />
                                <span>{ci.selectedColor}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-stone-900 dark:text-stone-100">${itemPrice.toFixed(2)}</span>
                    </div>

                    {/* Plus / Minus Qty & Remove Button */}
                    <div className="flex flex-col justify-between items-end shrink-0">
                      <button
                        type="button"
                        onClick={() => removeFromCart(ci.id, ci.item.name)}
                        className="text-stone-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center space-x-2 bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-[2px] p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQty(ci.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-[2px]"
                        >
                          <FiMinus className="w-2 h-2" />
                        </button>
                        <span className="text-[10px] font-black text-stone-800 dark:text-stone-200 w-3 text-center">{ci.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(ci.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-[2px]"
                        >
                          <FiPlus className="w-2 h-2" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Promo Section */}
            <div className={`p-3.5 rounded-[4px] border space-y-2.5 ${
              isDarkTheme ? 'bg-stone-900/20 border-stone-850' : 'bg-stone-55 border-stone-150'
            }`}>
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Apply Promo Coupon</span>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/30 p-2.5 rounded-[4px] text-xs">
                  <div className="flex items-center text-emerald-800 dark:text-emerald-400 font-bold space-x-1.5">
                    <FiPercent className="w-4 h-4 shrink-0" />
                    <span>Applied: <strong>{appliedCoupon.code}</strong> (-${discount.toFixed(2)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-white font-black text-[10px] uppercase cursor-pointer"
                  >
                    [Remove]
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Enter Promo Code..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-[4px] focus:outline-none transition-all ${
                        isDarkTheme
                          ? 'bg-stone-950 focus:bg-stone-900 border border-stone-800 text-white'
                          : 'bg-white focus:bg-stone-50 border border-stone-200 text-stone-800'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-950 dark:bg-stone-100 dark:text-stone-950 dark:hover:opacity-95 text-white rounded-[4px] text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Delivery address details */}
            <div className={`p-4 rounded-[4px] border space-y-3.5 ${
              isDarkTheme ? 'bg-stone-900/20 border-stone-850' : 'bg-white border-stone-150 shadow-3xs'
            }`}>
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Delivery Address details</span>
              <div className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2.5 text-xs rounded-[4px] focus:outline-none ${
                    isDarkTheme ? 'bg-stone-950 border border-stone-850 text-white' : 'bg-stone-55 border border-stone-150 text-stone-800'
                  }`}
                  required
                />
                <input
                  type="tel"
                  placeholder="Contact Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3 py-2.5 text-xs rounded-[4px] focus:outline-none ${
                    isDarkTheme ? 'bg-stone-950 border border-stone-850 text-white' : 'bg-stone-55 border border-stone-150 text-stone-800'
                  }`}
                  required
                />
                <input
                  type="text"
                  placeholder="Street Address, Apartment..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3 py-2.5 text-xs rounded-[4px] focus:outline-none ${
                    isDarkTheme ? 'bg-stone-950 border border-stone-850 text-white' : 'bg-stone-55 border border-stone-150 text-stone-800'
                  }`}
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full px-3 py-2.5 text-xs rounded-[4px] focus:outline-none ${
                    isDarkTheme ? 'bg-stone-950 border border-stone-850 text-white' : 'bg-stone-55 border border-stone-150 text-stone-800'
                  }`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing Block and checkout CTA button */}
          <div className="space-y-4 shrink-0 font-sans">
            <div className={`p-4 rounded-[4px] border space-y-2.5 text-2xs font-extrabold uppercase tracking-wider ${
              isDarkTheme ? 'bg-stone-900/20 border-stone-850' : 'bg-stone-55 border-stone-150'
            }`}>
              <div className="flex justify-between text-stone-400">
                <span>Bag Subtotal:</span>
                <span className={isDarkTheme ? 'text-stone-200' : 'text-stone-800'}>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-500 font-black">
                  <span>Promo Discount:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-400">
                <span>Shipping Fee:</span>
                <span className={isDarkTheme ? 'text-stone-200' : 'text-stone-800'}>
                  {deliveryFee === 0 ? <span className="text-emerald-600 font-black tracking-wide">FREE</span> : `$${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className={`flex justify-between items-center text-sm font-black pt-2 border-t border-stone-100/10 ${
                isDarkTheme ? 'text-white border-stone-800' : 'text-stone-900 border-stone-200'
              }`}>
                <span>Total Charge:</span>
                <span className="text-rose-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCheckingOut}
              className={`w-full py-4 rounded-[4px] font-black text-xs text-white uppercase tracking-widest cursor-pointer transition-transform active:scale-97 text-center flex items-center justify-center space-x-2 bg-stone-950 dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 shadow-sm`}
            >
              {isCheckingOut ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing bag checkout...</span>
                </>
              ) : (
                <span>Submit checkout order • ${total.toFixed(2)}</span>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-24 space-y-3 flex-grow flex flex-col justify-center items-center">
          <FiShoppingBag className="text-stone-400 w-12 h-12 stroke-[1.25]" />
          <div>
            <h4 className={`text-sm font-serif uppercase tracking-widest ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>Your Bag is Empty</h4>
            <p className="text-stone-400 text-[10px] font-semibold mt-1">Browse our collections to add items!</p>
          </div>
        </div>
      )}
    </div>
  );
};
