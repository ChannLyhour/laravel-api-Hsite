import React from 'react';
import { createPortal } from 'react-dom';
import { resolveImageUrl } from '../../utils/imageUtils';
import { resolveColorHex } from '../../utils/priceUtils';
import { FiShoppingBag, FiMinus, FiPlus, FiTrash2, FiTag } from 'react-icons/fi';

interface ModelCartSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  cartCount: number;
  orderMethod: 'delivery' | 'pickup';
  setOrderMethod: (method: 'delivery' | 'pickup') => void;
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string, name: string) => void;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  onNavigate: (to: string) => void;
  buildStoreLink: (path: string) => string;
}

export const ModelCartSelection: React.FC<ModelCartSelectionProps> = ({
  isOpen,
  onClose,
  cart,
  cartCount,
  orderMethod,
  setOrderMethod,
  updateQty,
  removeFromCart,
  subtotal,
  discount,
  deliveryFee,
  total,
  onNavigate,
  buildStoreLink,
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div
        className={`absolute inset-0 bg-stone-950/40 backdrop-blur-2xs transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-md h-full transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="h-full flex flex-col bg-white shadow-2xl border-l border-stone-200">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-stone-150 flex items-center justify-between">
              <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center space-x-2">
                <FiShoppingBag />
                <span>Cart Products</span>
                {cart.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-[#E61E25] text-white text-3xs font-bold rounded-full">
                    {cartCount}
                  </span>
                )}
              </h2>
              <button
                onClick={onClose}
                className="text-stone-400 hover:text-stone-900 transition-colors p-1 bg-transparent border-none cursor-pointer font-bold text-lg focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div className="flex p-1 bg-[#F9F9F9] rounded-[5px] border border-stone-200/60">
                <button
                  onClick={() => setOrderMethod('delivery')}
                  className={`flex-1 py-2 text-center text-xs font-extrabold rounded-[5px] transition-all cursor-pointer border-none ${orderMethod === 'delivery'
                    ? 'bg-stone-900 text-white shadow-3xs'
                    : 'text-stone-500 hover:text-stone-900'
                    }`}
                >
                  Shipping
                </button>
                <button
                  onClick={() => setOrderMethod('pickup')}
                  className={`flex-1 py-2 text-center text-xs font-extrabold rounded-[5px] transition-all cursor-pointer border-none ${orderMethod === 'pickup'
                    ? 'bg-stone-900 text-white shadow-3xs'
                    : 'text-stone-500 hover:text-stone-900'
                    }`}
                >
                    Pickup
                </button>
              </div>

              {cart.length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {cart.map(ci => (
                    <div key={ci.id} className="flex justify-between items-center py-4 gap-3 text-xs">
                      {/* Item Image */}
                      <div className="w-14 h-18 bg-stone-50 border border-stone-150 rounded-[3px] overflow-hidden shrink-0">
                        <img
                          src={
                            resolveImageUrl(ci.selectedImage || ci.item.display_image || ci.item.image) ||
                            'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80'
                          }
                          alt={ci.item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-grow text-left">
                        <p className="font-extrabold text-stone-950 leading-snug">{ci.item.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-3xs font-bold text-stone-500 uppercase tracking-wider">
                          <span>${parseFloat(ci.item.price).toFixed(2)}</span>
                          {(ci.selectedSize || ci.selectedColor) && <span>•</span>}
                          {ci.selectedSize && <span>Size: {ci.selectedSize}</span>}
                          {ci.selectedColor && (
                            <span className="flex items-center gap-1">
                              {!(ci.selectedColor.includes('Ice') || ci.selectedColor.includes('Sugar') || ci.selectedColor.includes('Note')) && (
                                <span
                                    className="w-2.5 h-2.5 rounded-full border border-stone-200"
                                    style={{ backgroundColor: resolveColorHex(ci.item, ci.selectedColor) }}
                                />
                              )}
                              <span>{ci.selectedColor}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => updateQty(ci.id, -1)}
                          className="w-5.5 h-5.5 rounded-[3px] bg-[#F9F9F9] border border-stone-200 hover:bg-stone-100 text-stone-850 flex items-center justify-center transition-colors text-2xs cursor-pointer"
                        >
                          <FiMinus />
                        </button>
                        <span className="font-black text-stone-950 w-4 text-center">{ci.qty}</span>
                        <button
                          onClick={() => updateQty(ci.id, 1)}
                          className="w-5.5 h-5.5 rounded-[3px] bg-[#F9F9F9] border border-stone-200 hover:bg-stone-100 text-stone-850 flex items-center justify-center transition-colors text-2xs cursor-pointer"
                        >
                          <FiPlus />
                        </button>
                        <button
                          onClick={() => removeFromCart(ci.id, ci.item.name)}
                          className="text-stone-400 hover:text-rose-600 p-1 transition-colors border-none bg-transparent cursor-pointer ml-1"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <span className="text-4xl">🛒</span>
                  <div>
                    <h4 className="font-extrabold text-stone-850 text-sm uppercase tracking-wider">
                      Your cart is empty
                    </h4>
                    <p className="text-stone-400 text-2xs font-semibold mt-1">
                      Add items from the menu to start ordering.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && (
              <div className="px-6 py-5 border-t border-stone-150 bg-stone-50 space-y-4">
                <div className="space-y-2.5 pt-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                    <span>Subtotal</span>
                    <span>US ${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-[#E61E25]">
                      <span className="flex items-center gap-1">
                        <FiTag className="w-3 h-3" />
                        Promo Discount
                      </span>
                      <span>- US ${discount.toFixed(2)}</span>
                    </div>
                  )}
                  {orderMethod === 'delivery' && (
                    <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                      <span>Shipping Fee</span>
                      <span>{deliveryFee === 0 ? 'FREE' : `US $${deliveryFee.toFixed(2)}`}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm font-black text-stone-900 border-t border-stone-200/60 pt-3">
                  <span>Total</span>
                  <span className="text-base font-black">US ${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate(buildStoreLink('/checkout'));
                  }}
                  className="w-full py-4 bg-stone-900 hover:bg-stone-850 text-white rounded-[3px] font-black text-xs uppercase tracking-widest border-none transition-all cursor-pointer shadow-sm mt-2 focus:outline-none"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
