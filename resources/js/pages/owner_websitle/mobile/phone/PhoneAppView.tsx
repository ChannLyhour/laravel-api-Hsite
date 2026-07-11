import React, { useEffect, useState } from 'react';
import { categoriesService, type ProductVariant } from '@/api/owner/categories';
import type { Root2 } from '@/api/owner/categories';
import { API_BASE_URL } from '@/api/client';
import {
  FiHeart, FiShoppingCart,
  FiCheckCircle, FiHome
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { themes } from '@/pages/owner_manage/templete_website/themes';
import { Store_setting } from '@/api/owner/stores';
import type { SettingResponse } from '@/api/setting';

import { HomeScreen } from './screens/Home_screen';
import { WishlistScreen } from './screens/wishlist_screen';
import { CartScreen } from './screens/cart_screen';
import { DetailScreen } from './screens/Detail_screen';
import { FashionPhoneView } from '../../templetes/fashion_website/mobile/FashionPhoneView';
import { FashionPhoneView as FashionPhoneViewGeneral } from '../../templetes/fashion_website_general/mobile/FashionPhoneView';

interface PhoneAppViewProps {
  ownerUserId?: number | string;
  storeName?: string;
  settings?: SettingResponse['settings'] | null;
  locale?: 'en' | 'km';
  token?: string | null;
  profile?: any;
  onToggleDesktop?: () => void;
  onLogout?: () => void;
}

interface CartItem {
  id: string;
  item: Root2;
  qty: number;
  selectedVariant?: ProductVariant;
}

export const PhoneAppView: React.FC<PhoneAppViewProps> = ({
  ownerUserId,
  storeName = '',
  settings,
  locale = 'en',
  onToggleDesktop,
  profile,
  onLogout,
}) => {
  if (settings?.website_theme === 'fashion') {
    return (
      <FashionPhoneView
        ownerUserId={ownerUserId}
        storeName={storeName}
        settings={settings}
        locale={locale}
        profile={profile}
        onToggleDesktop={onToggleDesktop}
        onLogout={onLogout}
      />
    );
  }
  if (settings?.website_theme === 'fashion_website_general') {
    return (
      <FashionPhoneViewGeneral
        ownerUserId={ownerUserId}
        storeName={storeName}
        settings={settings}
        locale={locale}
        profile={profile}
        onToggleDesktop={onToggleDesktop}
        onLogout={onLogout}
      />
    );
  }

  const activeTheme = themes[settings?.website_theme || 'default'] || themes.default;
  const isDarkTheme = (settings?.website_theme || '').startsWith('minimal_dark') || settings?.website_theme === 'glass_gradient' || settings?.website_theme === 'electronic';

  // State Management
  const [topSellingItems, setTopSellingItems] = useState<Root2[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation Tabs: 'home' | 'wishlist' | 'cart'
  const [activeTab, setActiveTab] = useState<'home' | 'wishlist' | 'cart'>('home');

  // Selected Product for dynamic detail sheet screen
  const [selectedProduct, setSelectedProduct] = useState<Root2 | null>(null);

  // Cart & Wishlist States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);

  // Checkout processing states
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Variant selector helper state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Default Categories Fallback if API is empty
  const defaultCategories = [
    { name: 'All', icon: '🍔' },
    { name: 'Burgers', icon: '🍔' },
    { name: 'Pizza', icon: '🍕' },
    { name: 'Salads', icon: '🥗' },
    { name: 'Desserts', icon: '🍰' },
    { name: 'Drinks', icon: '🥤' }
  ];

  // Default Food Fallbacks if API is empty
  const fallbackFoods: Root2[] = [
    {
      id: 101,
      category_id: 1,
      name: 'Classic Bacon Cheeseburger',
      price: '8.99',
      display_image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
      description: 'Gourmet flame-grilled Angus beef patty topped with smoked applewood bacon, sharp cheddar cheese, butter lettuce, and dynamic burger sauce.',
      sku: 'BUR-001',
      status: 'active',
      created_at: '',
      updated_at: '',
      order_items_count: 0,
      likes_count: 0,
      rating: 4.5,
      translations: [],
      variants: [],
      images: []
    },
    {
      id: 102,
      category_id: 1,
      name: 'Margherita Wood-Fired Pizza',
      price: '11.49',
      display_image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=500&q=80',
      description: 'Artisanal thin-crust pizza loaded with premium buffalo mozzarella, fresh sweet basil leaves, vine-ripened organic tomato sauce, and olive oil drizzle.',
      sku: 'PIZ-001',
      status: 'active',
      created_at: '',
      updated_at: '',
      order_items_count: 0,
      likes_count: 0,
      rating: 4.5,
      translations: [],
      variants: [],
      images: []
    },
    {
      id: 103,
      category_id: 1,
      name: 'Crispy Organic Caesar Salad',
      price: '7.49',
      display_image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=80',
      description: 'Farm-fresh romaine hearts tossed in hand-whipped creamy Caesar dressing, garlic sourdough croutons, and freshly shaved aged Parmesan reggiano.',
      sku: 'SAL-001',
      status: 'active',
      created_at: '',
      updated_at: '',
      order_items_count: 0,
      likes_count: 0,
      rating: 4.5,
      translations: [],
      variants: [],
      images: []
    },
    {
      id: 104,
      category_id: 1,
      name: 'Molten Chocolate Lava Cake',
      price: '6.49',
      display_image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=500&q=80',
      description: 'Warm rich Belgian dark chocolate cake with a velvety molten liquid core, served with vanilla bean ice cream.',
      sku: 'DES-001',
      status: 'active',
      created_at: '',
      updated_at: '',
      order_items_count: 0,
      likes_count: 0,
      rating: 4.5,
      translations: [],
      variants: [],
      images: []
    }
  ];

  // Localization helper
  const getTranslation = (item: Root2, currentLocale?: 'en' | 'km') => {
    const active = currentLocale || 'en';
    const trans = item.translations?.find(t => t.locale === active);
    return {
      name: trans?.name || item.name,
      description: trans?.description || item.description
    };
  };

  // Load actual categories and foods from API
  useEffect(() => {
    const loadAppData = async () => {
      try {
        setLoading(true);
        // Load top-selling products
        const topSellingData = await categoriesService.getTopSelling(12, ownerUserId);
        setTopSellingItems(topSellingData && topSellingData.length > 0 ? topSellingData : fallbackFoods);

        // Load categories
        const cats = await categoriesService.getMyCategories(20, 0, ownerUserId);
        if (cats && cats.categories && cats.categories.length > 0) {
          const list = [{ name: 'All', icon: '🍕' }, ...cats.categories.map((c: any) => ({ name: c.name, icon: '🍔' }))];
          setCategories(list);
        } else {
          setCategories(defaultCategories);
        }

        // Fetch coupons
        import('@/api/owner/coupons').then(({ couponsService }) => {
          couponsService.getCoupons({ vendor_id: ownerUserId })
            .then(res => setCoupons(res.filter(c => c.is_active && (!c.customer_id || c.customer_id === profile?.id))))
            .catch(() => { });
        });
      } catch (err) {
        console.warn('Backend API connection failed, running in high-fidelity sandbox mode with cached mock databases.');
        setTopSellingItems(fallbackFoods);
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };
    loadAppData();
  }, [ownerUserId]);

  // Product filters
  const filteredProducts = topSellingItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === 'All') return matchesSearch;

    // Simple mock category resolution (check if name matches or matches item sku code prefix)
    const categoryLower = selectedCategory.toLowerCase();
    const matchesCategory = item.name.toLowerCase().includes(categoryLower) ||
      (item.description && item.description.toLowerCase().includes(categoryLower)) ||
      (item.sku || '').toLowerCase().startsWith(categoryLower.substring(0, 3));

    return matchesSearch && matchesCategory;
  });

  // Image helpers
  const getProductImage = (item: Root2, variant?: ProductVariant | null): string => {
    if (variant && item.images && item.images.length > 0) {
      const vImg = item.images.find(img => img.product_variant_id === variant.id);
      if (vImg) {
        let imagePath = vImg.image as any;
        if (Array.isArray(imagePath)) {
          imagePath = imagePath[0];
        }
        if (typeof imagePath === 'string') {
          imagePath = imagePath.trim();
          if (imagePath.startsWith('[') || imagePath.startsWith('{')) {
            try {
              const parsed = JSON.parse(imagePath);
              if (Array.isArray(parsed)) {
                imagePath = parsed[0];
              } else if (parsed && typeof parsed === 'object') {
                imagePath = Object.values(parsed)[0];
              }
            } catch (e) { }
          }
        } else if (imagePath && typeof imagePath === 'object') {
          imagePath = Object.values(imagePath)[0] || '';
        }

        if (typeof imagePath === 'string' && imagePath.trim()) {
          const cleanPath = imagePath.trim();
          if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:') || cleanPath.startsWith('blob:')) {
            return cleanPath;
          }
          const serverBase = API_BASE_URL.replace(/\/api$/, '');
          return `${serverBase}/${cleanPath.replace(/^\//, '')}`;
        }
      }
    }
    return item.display_image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80';
  };

  const getProductPrice = (item: Root2, variant?: ProductVariant | null): number => {
    if (variant) return parseFloat(variant.retail_price);
    return parseFloat(item.price);
  };

  const getVariantLabel = (variantOrSku: any, baseSku?: string) => {
    if (!variantOrSku) return 'Standard';
    if (typeof variantOrSku === 'object') {
      const attributeValues = variantOrSku.attribute_values;
      if (attributeValues && attributeValues.length > 0) {
        return attributeValues.map((av: any) => {
          const attrName = av.attribute?.name || '';
          const attrVal = av.value?.split('|')[0] || '';
          if (attrName && attrVal) {
            return `${attrName}: ${attrVal}`;
          }
          return attrVal || attrName;
        }).join(', ');
      }
      variantOrSku = variantOrSku.variant_sku;
    }
    const sku = String(variantOrSku);
    if (baseSku && sku.startsWith(baseSku)) {
      const suffix = sku.replace(baseSku, '').replace(/^-/, '');
      if (suffix) return suffix.replace(/-/g, ' ');
    }
    const parts = sku.split('-');
    if (parts.length > 2) {
      return parts.slice(2).join(' ');
    }
    return sku;
  };

  // Cart actions
  const handleAddToCart = (item: Root2, variant: ProductVariant | null = null) => {
    const cartItemId = variant ? `${item.id}-${variant.variant_sku}` : String(item.id);
    const { name: displayName } = getTranslation(item, locale);

    setCart(prev => {
      const existing = prev.find(ci => ci.id === cartItemId);
      if (existing) {
        toast.success(`Increased ${displayName} quantity in Cart!`);
        return prev.map(ci => ci.id === cartItemId ? { ...ci, qty: ci.qty + 1 } : ci);
      }
      toast.success(`Added ${displayName} to Cart!`);
      return [...prev, { id: cartItemId, item, qty: 1, selectedVariant: variant || undefined }];
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(ci => ci.id === id ? { ...ci, qty: Math.max(1, ci.qty + delta) } : ci));
  };

  const handleRemoveFromCart = (id: string, name: string) => {
    setCart(prev => prev.filter(ci => ci.id !== id));
    toast.error(`Removed ${name} from Cart.`);
  };

  const handleToggleWishlist = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setWishlist(prev => {
      if (prev.includes(id)) {
        toast.error('Removed from Wishlist');
        return prev.filter(x => x !== id);
      } else {
        toast.success('Added to Wishlist!');
        return [...prev, id];
      }
    });
  };

  // Calculations
  const subtotal = cart.reduce((sum, ci) => sum + (getProductPrice(ci.item, ci.selectedVariant) * ci.qty), 0);

  const dynamicSettings = Store_setting();
  const shippingFee = settings?.shipping_fee ? parseFloat(settings.shipping_fee) : (dynamicSettings?.shipping_fee ? parseFloat(dynamicSettings.shipping_fee) : 0);
  const threshold = settings?.free_shipping_threshold ? parseFloat(settings.free_shipping_threshold) : (dynamicSettings?.free_shipping_threshold ? parseFloat(dynamicSettings.free_shipping_threshold) : 0);

  const deliveryFee = subtotal > 0 ? ((threshold > 0 && subtotal > threshold) ? 0 : shippingFee) : 0;
  const total = subtotal + deliveryFee;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderSuccess(true);
      setCart([]);
      toast.success('Order placed successfully! Preparing delivery...');
    }, 2000);
  };

  // Detail Sheet trigger
  const handleOpenDetail = (product: Root2) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants && product.variants.length > 0 ? product.variants[0] : null);
  };

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProduct && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedProduct]);

  return (
    <div className={`w-full h-[100dvh] select-none transition-all duration-300 ${isDarkTheme ? 'bg-[#06080F]' : 'bg-slate-100/40'
      } flex justify-center`}>

      {/* Clean, Borderless Mobile Viewport Container */}
      <div className={`relative w-full max-w-md h-full flex flex-col font-sans overflow-hidden ${isDarkTheme
          ? 'bg-[#0E1322] text-white'
          : 'bg-white text-slate-800 shadow-sm'
        }`}>

        {/* ──────── MAIN APP BODY (Scrollable Screen viewport) ──────── */}
        <div ref={scrollContainerRef} className="flex-grow overflow-y-auto relative flex flex-col scrollbar-none">

          {/* loading spinner state */}
          {loading && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center space-y-3 ${isDarkTheme ? 'bg-[#0B0F19]' : 'bg-white'
              }`}>
              <svg className={`animate-spin h-8 w-8 ${activeTheme.primaryText}`} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-[10px] font-bold text-slate-400">Loading storefront details...</span>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {orderSuccess ? (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fade-in ${isDarkTheme ? 'bg-[#0B0F19]' : 'bg-white'
              }`}>
              <div className="w-20 h-20 bg-emerald-100 rounded-[7px] flex items-center justify-center text-emerald-600 shadow-md">
                <FiCheckCircle className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className={`text-xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Order Confirmed!</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs font-semibold">
                  Your gourmet meals are being prepared by our Master Chefs and will arrive at your address within 30 minutes!
                </p>
              </div>
              <button
                onClick={() => { setOrderSuccess(false); setActiveTab('home'); }}
                className={`px-6 py-2.5 rounded-[7px] text-xs font-black text-white cursor-pointer transition-transform active:scale-95 ${activeTheme.primaryBg} ${activeTheme.primaryHover} shadow-sm`}
              >
                Return to Shop
              </button>
            </div>
          ) : null}

          {selectedProduct ? (
            <DetailScreen
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              selectedVariant={selectedVariant}
              setSelectedVariant={setSelectedVariant}
              wishlist={wishlist}
              handleToggleWishlist={handleToggleWishlist}
              handleAddToCart={handleAddToCart}
              getProductImage={getProductImage}
              getProductPrice={getProductPrice}
              getVariantLabel={getVariantLabel}
              locale={locale}
              getTranslation={getTranslation}
              isDarkTheme={isDarkTheme}
              activeTheme={activeTheme}
              coupons={coupons}
            />
          ) : (
            <>
              {/* APP SCREEN 1: HOME VIEW */}
              {activeTab === 'home' && (
                <HomeScreen
                  isDarkTheme={isDarkTheme}
                  activeTheme={activeTheme}
                  settings={settings}
                  storeName={storeName}
                  onToggleDesktop={onToggleDesktop}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  filteredProducts={filteredProducts}
                  wishlist={wishlist}
                  handleToggleWishlist={handleToggleWishlist}
                  handleOpenDetail={handleOpenDetail}
                  handleAddToCart={handleAddToCart}
                  getProductImage={getProductImage}
                  locale={locale}
                  getTranslation={getTranslation}
                />
              )}

              {/* APP SCREEN 2: WISHLIST VIEW */}
              {activeTab === 'wishlist' && (
                <WishlistScreen
                  isDarkTheme={isDarkTheme}
                  activeTheme={activeTheme}
                  wishlist={wishlist}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  topSellingItems={topSellingItems}
                  handleToggleWishlist={handleToggleWishlist}
                  handleAddToCart={handleAddToCart}
                  handleOpenDetail={handleOpenDetail}
                  getProductImage={getProductImage}
                  locale={locale}
                  getTranslation={getTranslation}
                />
              )}

              {/* APP SCREEN 3: CART/CHECKOUT VIEW */}
              {activeTab === 'cart' && (
                <CartScreen
                  isDarkTheme={isDarkTheme}
                  activeTheme={activeTheme}
                  cart={cart}
                  handleCheckoutSubmit={handleCheckoutSubmit}
                  getProductPrice={getProductPrice}
                  getTranslation={getTranslation}
                  getVariantLabel={getVariantLabel}
                  getProductImage={getProductImage}
                  handleUpdateQty={handleUpdateQty}
                  handleRemoveFromCart={handleRemoveFromCart}
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  total={total}
                  isCheckingOut={isCheckingOut}
                  locale={locale}
                />
              )}
            </>
          )}

        </div>

        {/* ──────── STICKY BOTTOM TAB NAVIGATION BAR ──────── */}
        {!selectedProduct && (
          <div className={`px-6 py-4 border-t shrink-0 flex justify-around items-center z-40 select-none ${isDarkTheme ? 'bg-[#0E1322] border-slate-800' : 'bg-white border-slate-100 shadow-lg'
            }`}>
            {/* Home Tab */}
            <button
              onClick={() => { setActiveTab('home'); setSelectedProduct(null); }}
              className={`flex flex-col items-center space-y-1 cursor-pointer transition-colors relative border-none bg-transparent ${activeTab === 'home'
                  ? activeTheme.primaryText
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <FiHome className="w-5.5 h-5.5 shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-wider font-sans">Home</span>
              {activeTab === 'home' && (
                <span className={`absolute -bottom-1.5 w-1 h-1 rounded-full ${activeTheme.primaryBg}`} />
              )}
            </button>

            {/* Wishlist Tab */}
            <button
              onClick={() => { setActiveTab('wishlist'); setSelectedProduct(null); }}
              className={`flex flex-col items-center space-y-1 cursor-pointer transition-colors relative border-none bg-transparent ${activeTab === 'wishlist'
                  ? 'text-rose-500'
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <div className="relative shrink-0">
                <FiHeart className="w-5.5 h-5.5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[7px] font-black flex items-center justify-center shadow-xs">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider font-sans">Wishlist</span>
              {activeTab === 'wishlist' && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Cart Tab */}
            <button
              onClick={() => { setActiveTab('cart'); setSelectedProduct(null); }}
              className={`flex flex-col items-center space-y-1 cursor-pointer transition-colors relative border-none bg-transparent ${activeTab === 'cart'
                  ? activeTheme.primaryText
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <div className="relative shrink-0">
                <FiShoppingCart className="w-5.5 h-5.5" />
                {cart.length > 0 && (
                  <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 text-white rounded-full text-[7px] font-black flex items-center justify-center shadow-xs ${activeTheme.primaryBg}`}>
                    {cart.reduce((sum, ci) => sum + ci.qty, 0)}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider font-sans">Cart</span>
              {activeTab === 'cart' && (
                <span className={`absolute -bottom-1.5 w-1 h-1 rounded-full ${activeTheme.primaryBg}`} />
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

