import React, { useState } from 'react';
import { FiHome, FiHeart, FiShoppingBag, FiCheckCircle, FiUser } from 'react-icons/fi';
import { toast } from '../utils/toast';

import { useFashionItems } from '../hooks/useFashionItems';
import { useCart } from '../hooks/useCart';
import { resolveImageUrl } from '../utils/imageUtils';

import { FashionHomeScreen } from './screens/FashionHomeScreen';
import { FashionDetailScreen } from './screens/FashionDetailScreen';
import { FashionCartScreen } from './screens/FashionCartScreen';
import { FashionWishlistScreen } from './screens/FashionWishlistScreen';
import { FashionProfileCustomer } from './screens/FashionProfileCustomer';

interface FashionPhoneViewProps {
  ownerUserId?: number | string;
  storeName?: string;
  settings?: any;
  locale?: 'en' | 'km';
  token?: string | null;
  profile?: any;
  onToggleDesktop?: () => void;
  onLogout?: () => void;
}

export const FashionPhoneView: React.FC<FashionPhoneViewProps> = ({
  ownerUserId,
  storeName = '',
  settings,
  locale = 'en',
  profile,
  onToggleDesktop,
  onLogout,
}) => {
  const isDarkTheme = (settings?.website_theme || '').startsWith('minimal_dark') || settings?.website_theme === 'glass_gradient' || settings?.website_theme === 'electronic';

  // State Management
  const [activeTab, setActiveTab] = useState<'home' | 'wishlist' | 'cart' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Load products and categories
  const {
    displayItems,
    displayCatalogItems,
    categories,
    banners,
    activeCategoryHash,
    setActiveCategoryHash,
  } = useFashionItems(ownerUserId, searchQuery);

  // Shared cart state using template useCart hook (syncs with localStorage aura_cart)
  const {
    cart,
    setCart,
    addToCart,
    updateQty,
    removeFromCart,
    subtotal,
    discount,
    deliveryFee,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart(settings, profile);

  // Favorites/Wishlist state using template keys (syncs with localStorage aura_favorites)
  const [wishlist, setWishlist] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_favorites');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const handleToggleWishlist = (id: string, name: string) => {
    setWishlist(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) {
        toast.success(`Added ${name} to Wishlist!`);
      } else {
        toast.error(`Removed ${name} from Wishlist`);
      }
      localStorage.setItem('aura_favorites', JSON.stringify(next));
      return next;
    });
  };

  // Resolve product primary image URL
  const getProductImage = (item: any): string => {
    const imgUrl = item.display_image || item.image;
    return resolveImageUrl(imgUrl) || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80';
  };

  // Handle mock checkout submission
  const handleCheckoutSubmit = (e: React.FormEvent, _checkoutData: any) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderSuccess(true);
      setCart([]);
      toast.success('Boutique order placed successfully!');
    }, 1500);
  };

  const handleOpenDetail = (product: any) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants && product.variants.length > 0 ? product.variants[0] : null);
  };

  const handleAddToCartWithFeedback = (product: any, qty: number, size: string, color: string) => {
    addToCart(product, qty, size, color);
    toast.success(`Added ${product.name} to Bag!`);
  };

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (selectedProduct && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedProduct]);

  return (
    <div className={`w-full h-[100dvh] select-none transition-all duration-300 ${
      isDarkTheme ? 'bg-[#080808]' : 'bg-stone-100/60'
    } flex justify-center`}>
      <div className={`relative w-full max-w-md h-full flex flex-col font-sans overflow-hidden border-x ${
        isDarkTheme
          ? 'bg-stone-950 text-stone-100 border-stone-900 shadow-2xl'
          : 'bg-white text-stone-800 border-stone-200/50 shadow-sm'
      }`}>
        {/* ──────── Main Content Container ──────── */}
        <div ref={scrollContainerRef} className="flex-grow overflow-y-auto relative flex flex-col scrollbar-none">
          {/* Order Success Overlay Screen */}
          {orderSuccess ? (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fade-in ${
              isDarkTheme ? 'bg-stone-950' : 'bg-white'
            }`}>
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center text-emerald-600 shadow-md">
                <FiCheckCircle className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-2.5">
                <h3 className={`text-lg font-serif tracking-widest uppercase ${isDarkTheme ? 'text-white' : 'text-stone-900'}`}>Order Confirmed</h3>
                <p className="text-stone-400 text-2xs leading-relaxed max-w-xs font-semibold">
                  Thank you for shopping at our boutique storefront. Your items are being packed and will arrive in 1 to 3 days!
                </p>
              </div>
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  setActiveTab('home');
                }}
                className={`px-6 py-3 rounded-[4px] text-[10px] font-black uppercase tracking-wider text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 cursor-pointer shadow-xs transition-opacity hover:opacity-90`}
              >
                Back To Store
              </button>
            </div>
          ) : null}

          {/* Render Detail Screen Sheet or Tab Screens */}
          {selectedProduct ? (
            <FashionDetailScreen
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              selectedVariant={selectedVariant}
              setSelectedVariant={setSelectedVariant}
              wishlist={wishlist}
              handleToggleWishlist={handleToggleWishlist}
              handleAddToCart={handleAddToCartWithFeedback}
              getProductImage={getProductImage}
              locale={locale}
              isDarkTheme={isDarkTheme}
              allProducts={displayItems}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <FashionHomeScreen
                  isDarkTheme={isDarkTheme}
                  settings={settings}
                  storeName={storeName}
                  onToggleDesktop={onToggleDesktop}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  categories={categories}
                  activeCategoryHash={activeCategoryHash}
                  setActiveCategoryHash={setActiveCategoryHash}
                  filteredProducts={displayCatalogItems}
                  wishlist={wishlist}
                  handleToggleWishlist={handleToggleWishlist}
                  handleOpenDetail={handleOpenDetail}
                  handleAddToCart={handleAddToCartWithFeedback}
                  getProductImage={getProductImage}
                  locale={locale}
                  profile={profile}
                  onOpenProfile={() => setActiveTab('profile')}
                  banners={banners}
                />
              )}

              {activeTab === 'wishlist' && (
                <FashionWishlistScreen
                  isDarkTheme={isDarkTheme}
                  wishlist={wishlist}
                  handleToggleWishlist={handleToggleWishlist}
                  handleOpenDetail={handleOpenDetail}
                  getProductImage={getProductImage}
                  allProducts={displayItems}
                />
              )}

              {activeTab === 'cart' && (
                <FashionCartScreen
                  isDarkTheme={isDarkTheme}
                  cart={cart}
                  handleCheckoutSubmit={handleCheckoutSubmit}
                  updateQty={updateQty}
                  removeFromCart={removeFromCart}
                  subtotal={subtotal}
                  discount={discount}
                  deliveryFee={deliveryFee}
                  total={total}
                  isCheckingOut={isCheckingOut}
                  appliedCoupon={appliedCoupon}
                  applyCoupon={applyCoupon}
                  removeCoupon={removeCoupon}
                  settings={settings}
                />
              )}

              {activeTab === 'profile' && (
                <FashionProfileCustomer
                  isDarkTheme={isDarkTheme}
                  user={profile}
                  ownerUserId={ownerUserId}
                  logout={onLogout || (() => {
                    localStorage.removeItem('token');
                    window.location.reload();
                  })}
                  onClose={() => setActiveTab('home')}
                  locale={locale}
                />
              )}
            </>
          )}
        </div>

        {/* ──────── Bottom Navigation Toggles ──────── */}
        {!selectedProduct && (
          <div className={`px-6 py-4.5 border-t shrink-0 flex justify-around items-center z-40 select-none ${
            isDarkTheme ? 'bg-stone-950 border-stone-900' : 'bg-white border-stone-150 shadow-md'
          }`}>
            {/* Home Tab */}
            <button
              onClick={() => {
                setActiveTab('home');
                setSelectedProduct(null);
              }}
              className={`flex flex-col items-center space-y-1 bg-transparent border-none cursor-pointer transition-colors relative ${
                activeTab === 'home'
                  ? 'text-stone-900 dark:text-white font-extrabold'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <FiHome className="w-5 h-5 shrink-0" />
              <span className="text-[8px] font-black uppercase tracking-widest font-sans">Home</span>
              {activeTab === 'home' && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-stone-900 dark:bg-white" />
              )}
            </button>

            {/* Wishlist Tab */}
            <button
              onClick={() => {
                setActiveTab('wishlist');
                setSelectedProduct(null);
              }}
              className={`flex flex-col items-center space-y-1 bg-transparent border-none cursor-pointer transition-colors relative ${
                activeTab === 'wishlist'
                  ? 'text-rose-500 font-extrabold'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="relative shrink-0">
                <FiHeart className="w-5 h-5" />
                {Object.values(wishlist).filter(Boolean).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[7px] font-bold flex items-center justify-center shadow-xs leading-none">
                    {Object.values(wishlist).filter(Boolean).length}
                  </span>
                )}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest font-sans">Wishlist</span>
              {activeTab === 'wishlist' && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Shopping Bag Tab */}
            <button
              onClick={() => {
                setActiveTab('cart');
                setSelectedProduct(null);
              }}
              className={`flex flex-col items-center space-y-1 bg-transparent border-none cursor-pointer transition-colors relative ${
                activeTab === 'cart'
                  ? 'text-stone-900 dark:text-white font-extrabold'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="relative shrink-0">
                <FiShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full text-[7px] font-bold flex items-center justify-center shadow-xs leading-none">
                    {cart.reduce((sum, item) => sum + item.qty, 0)}
                  </span>
                )}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest font-sans">Bag</span>
              {activeTab === 'cart' && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-stone-900 dark:bg-white" />
              )}
            </button>

            {/* Profile Tab */}
            <button
              onClick={() => {
                if (profile) {
                  setActiveTab('profile');
                  setSelectedProduct(null);
                } else {
                  window.dispatchEvent(new CustomEvent('request_login'));
                }
              }}
              className={`flex flex-col items-center space-y-1 bg-transparent border-none cursor-pointer transition-colors relative ${
                activeTab === 'profile'
                  ? 'text-stone-900 dark:text-white font-extrabold'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="relative shrink-0">
                <FiUser className="w-5 h-5" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest font-sans">Profile</span>
              {activeTab === 'profile' && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-stone-900 dark:bg-white" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

