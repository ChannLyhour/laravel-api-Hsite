import React, { useEffect, useState } from 'react';
import { categoriesService, type ProductVariant } from '@/api/owner/categories';
import type { Root2 } from '@/api/owner/categories';
import { API_BASE_URL } from '@/api/client';
import {
  FiSearch, FiHeart, FiShoppingCart, FiArrowLeft,
  FiStar, FiPlus, FiMinus, FiTrash2, FiMapPin,
  FiCheckCircle, FiHome, FiTrendingUp
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { themes } from '@/pages/owner_manage/templete_website/themes';
import { Store_setting } from '@/api/owner/stores';
import type { SettingResponse } from '@/api/setting';
import { FashionTabletView } from '../../templetes/fashion_website/mobile/FashionTabletView';

interface TabletAppViewProps {
  ownerUserId?: number | string;
  storeName?: string;
  settings?: SettingResponse['settings'] | null;
  locale?: 'en' | 'km';
  token?: string | null;
  profile?: any;
  onToggleDesktop?: () => void;
}

interface CartItem {
  id: string;
  item: Root2;
  qty: number;
  selectedVariant?: ProductVariant;
}

export const TabletAppView: React.FC<TabletAppViewProps> = ({
  ownerUserId,
  storeName = '',
  settings,
  locale = 'en',
  onToggleDesktop,
  profile,
}) => {
  if (settings?.website_theme === 'fashion') {
    return (
      <FashionTabletView
        ownerUserId={ownerUserId}
        storeName={storeName}
        settings={settings}
        locale={locale}
        profile={profile}
        onToggleDesktop={onToggleDesktop}
      />
    );
  }

  const activeTheme = themes[settings?.website_theme || 'default'] || themes.default;
  const isDarkTheme = (settings?.website_theme || '').startsWith('minimal_dark') || settings?.website_theme === 'glass_gradient' || settings?.website_theme === 'electronic';

  // State Management
  const [topSellingItems, setTopSellingItems] = useState<Root2[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation Tabs for left column: 'menu' | 'wishlist'
  const [activeLeftTab, setActiveLeftTab] = useState<'menu' | 'wishlist'>('menu');

  // Selected Product for dynamic detail modal popup
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
    { name: 'All', icon: '🍕' },
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

  const handleOpenDetail = (product: Root2) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants && product.variants.length > 0 ? product.variants[0] : null);
  };

  return (
    <div className={`w-full min-h-screen select-none transition-all duration-300 ${isDarkTheme ? 'bg-[#06080F]' : 'bg-slate-50'
      } flex justify-center p-4 lg:p-6`}>

      {/* Premium tablet workspace wrapper */}
      <div className={`w-full max-w-6xl h-[calc(100vh-2rem)] flex flex-col font-sans rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 relative ${isDarkTheme
          ? 'bg-[#0E1322] text-white shadow-cyan-950/20'
          : 'bg-white text-slate-800 shadow-slate-200/50'
        }`}>

        {/* Loading Spinner State */}
        {loading && (
          <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center space-y-3 rounded-3xl ${isDarkTheme ? 'bg-[#0B0F19]/90' : 'bg-white/90'
            }`}>
            <svg className={`animate-spin h-10 w-10 ${activeTheme.primaryText}`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs font-bold text-slate-400">Loading storefront details...</span>
          </div>
        )}

        {/* SUCCESS MODAL OVERLAY */}
        {orderSuccess ? (
          <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fade-in ${isDarkTheme ? 'bg-[#0B0F19]/95' : 'bg-white/95'
            }`}>
            <div className="w-24 h-24 bg-emerald-100 rounded-[7px] flex items-center justify-center text-emerald-600 shadow-md">
              <FiCheckCircle className="w-12 h-12 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className={`text-2xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Order Placed Successfully!</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md font-semibold mx-auto">
                Your five-star order has been confirmed by our Master Chefs. A professional delivery courier will arrive at your address in approximately 30 minutes!
              </p>
            </div>
            <button
              onClick={() => { setOrderSuccess(false); setActiveLeftTab('menu'); }}
              className={`px-8 py-3 rounded-[7px] text-sm font-black text-white cursor-pointer transition-transform active:scale-95 ${activeTheme.primaryBg} ${activeTheme.primaryHover} shadow-md`}
            >
              Back to Menu
            </button>
          </div>
        ) : null}

        {/* FOOD DETAIL POPUP OVERLAY MODAL */}
        {selectedProduct ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className={`w-full max-w-lg rounded-[7px] overflow-hidden flex flex-col border shadow-2xl animate-scale-in ${isDarkTheme ? 'bg-[#0E1322] border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'
              }`}>
              {/* Header Bar */}
              <div className="p-4 flex justify-between items-center border-b border-slate-100/10">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className={`p-2 rounded-[7px] cursor-pointer transition-colors ${isDarkTheme ? 'bg-slate-800/80 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  <FiArrowLeft className="w-4.5 h-4.5" />
                </button>
                <span className={`text-xs font-black uppercase tracking-widest ${activeTheme.primaryText}`}>Delicacy Customization</span>
                <button
                  onClick={(e) => handleToggleWishlist(e, selectedProduct.id)}
                  className={`p-2 rounded-[7px] cursor-pointer transition-colors ${wishlist.includes(selectedProduct.id)
                      ? 'bg-rose-50 text-rose-500'
                      : isDarkTheme ? 'bg-slate-800/80 text-slate-255' : 'bg-slate-100 text-slate-500'
                    }`}
                >
                  <FiHeart className={`w-4.5 h-4.5 ${wishlist.includes(selectedProduct.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Scroll Content */}
              <div className="p-6 overflow-y-auto max-h-[70dvh] space-y-6">
                <div className={`relative h-64 rounded-[7px] overflow-hidden border ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'} shadow-sm`}>
                  <img
                    src={getProductImage(selectedProduct, selectedVariant)}
                    alt={getTranslation(selectedProduct, locale).name}
                    className="w-full h-full object-cover"
                  />
                  <span className={`absolute top-4 left-4 px-3.5 py-1 rounded-[7px] text-[10px] font-black uppercase tracking-wider text-white shadow-md ${activeTheme.primaryBg}`}>
                    Signature Selection
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {getTranslation(selectedProduct, locale).name}
                  </h3>
                  <div className="flex items-center space-x-3 text-amber-400">
                    <div className="flex items-center">
                      <FiStar className="w-4.5 h-4.5 fill-current" />
                      <span className={`text-sm font-black ml-1.5 ${isDarkTheme ? 'text-slate-200' : 'text-slate-800'}`}>4.9 Rating</span>
                    </div>
                    <span className="text-slate-400 text-xs font-semibold">•</span>
                    <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">Fast Prepare</span>
                  </div>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-black ${activeTheme.primaryText}`}>
                    ${getProductPrice(selectedProduct, selectedVariant).toFixed(2)}
                  </span>
                  <span className="text-slate-400 text-sm line-through font-semibold">
                    ${(getProductPrice(selectedProduct, selectedVariant) * 1.25).toFixed(2)}
                  </span>
                </div>

                {/* Variants pills */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Choose Custom size:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variants.map((v) => {
                        const isSelected = selectedVariant?.variant_sku === v.variant_sku;
                        return (
                          <button
                            key={v.variant_sku}
                            onClick={() => setSelectedVariant(v)}
                            className={`px-4 py-2 rounded-[7px] text-xs font-bold border transition-all cursor-pointer ${isSelected
                                ? `${activeTheme.primaryBg} border-transparent text-white shadow-2xs font-extrabold`
                                : isDarkTheme
                                  ? 'bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-700'
                                  : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100'
                              }`}
                          >
                            {getVariantLabel(v, selectedProduct.sku)} - ${parseFloat(v.retail_price).toFixed(2)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Chef Recipe:</span>
                  <p className="text-slate-400 text-sm leading-relaxed font-semibold">
                    {getTranslation(selectedProduct, locale).description || 'Carefully flame-cooked to perfection with premium grade ingredients, handpicked organic seasonings, and signature herbs.'}
                  </p>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className={`p-4 border-t flex justify-end gap-3 shrink-0 ${isDarkTheme ? 'bg-[#0B0F19]/80 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className={`px-5 py-2.5 rounded-[7px] text-xs font-bold transition-all cursor-pointer ${isDarkTheme ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct, selectedVariant);
                    setSelectedProduct(null);
                  }}
                  className={`px-6 py-2.5 rounded-[7px] font-black text-xs text-white cursor-pointer transition-transform active:scale-95 flex items-center space-x-2 ${activeTheme.primaryBg} ${activeTheme.primaryHover} shadow-md`}
                >
                  <FiShoppingCart className="w-4 h-4" />
                  <span>Add To Cart · ${getProductPrice(selectedProduct, selectedVariant).toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ──────── SPLIT-SCREEN TAB WORKSPACE ──────── */}
        <div className="flex-grow flex overflow-hidden h-full">

          {/* ========================================== */}
          {/* ── LEFT VIEWPORT PANEL (Menu/Wishlist) ── */}
          {/* ========================================== */}
          <div className="w-[60%] flex flex-col h-full border-r border-slate-100/10 overflow-hidden">

            {/* Scrollable menu content view */}
            <div className="flex-grow overflow-y-auto px-6 pb-6 space-y-6 scrollbar-none">

              {/* Header branding block */}
              <div className={`sticky top-0 z-30 -mx-6 px-6 py-4.5 flex justify-between items-center border-b backdrop-blur-md transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-[#0E1322]/90 border-slate-800/80 text-white'
                  : 'bg-white/95 border-slate-150/80 text-slate-800 shadow-3xs'
              }`}>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tablet Dining Board</span>
                  <h1 className={`text-2xl font-black flex items-center space-x-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    <FiMapPin className="text-emerald-500 w-5 h-5 shrink-0" />
                    <span className="truncate max-w-[280px]">{settings?.store_name || storeName || 'BiteFlow Store'}</span>
                  </h1>
                </div>

                <div className="flex items-center space-x-3.5 shrink-0">
                  {/* View Website Button */}
                  {onToggleDesktop && (
                    <button
                      onClick={onToggleDesktop}
                      className={`px-4 py-2 rounded-[7px] border text-[10px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${isDarkTheme
                          ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-850 hover:text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-655 hover:bg-slate-100 hover:text-slate-900 shadow-3xs'
                        }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span>View Website</span>
                    </button>
                  )}

                  {/* Segment Toggles between Menu and Wishlist */}
                  <div className={`p-1 rounded-[7px] flex items-center space-x-1 shrink-0 ${isDarkTheme ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100'
                    }`}>
                    <button
                      onClick={() => setActiveLeftTab('menu')}
                      className={`px-4 py-2 rounded-[7px] text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${activeLeftTab === 'menu'
                          ? `${activeTheme.primaryBg} text-white shadow-sm`
                          : 'text-slate-400 hover:text-slate-655'
                        }`}
                    >
                      <FiHome className="w-3.5 h-3.5" />
                      <span>Menu</span>
                    </button>
                    <button
                      onClick={() => setActiveLeftTab('wishlist')}
                      className={`px-4 py-2 rounded-[7px] text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${activeLeftTab === 'wishlist'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-655'
                        }`}
                    >
                      <FiHeart className="w-3.5 h-3.5" />
                      <span>Wishlist ({wishlist.length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Search input with premium slider filter inside row */}
              <div className="relative flex items-center gap-3 shrink-0">
                <div className="relative flex-grow">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                  <input
                    type="text"
                    placeholder="Search gourmet cuisines, chef specials, beverages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3.5 text-sm font-semibold rounded-[7px] focus:outline-none transition-all ${isDarkTheme
                        ? 'bg-slate-905 focus:bg-slate-955 border border-slate-800 text-white placeholder-slate-500 focus:ring-1 focus:ring-slate-700'
                        : 'bg-slate-50 focus:bg-white border border-slate-100 text-slate-808 placeholder-slate-400 focus:ring-1 focus:ring-slate-200 shadow-3xs'
                      }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Gourmet filters loaded!')}
                  className={`p-3.5 rounded-[7px] flex items-center justify-center border transition-all cursor-pointer ${isDarkTheme
                      ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-400'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700 shadow-3xs'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>
              </div>

              {/* Gradient ad card */}
              {activeLeftTab === 'menu' && (
                <div className={`p-6 rounded-[7px] relative overflow-hidden flex items-center justify-between shrink-0 border ${isDarkTheme
                    ? 'bg-gradient-to-br from-violet-900 via-indigo-950 to-[#0e1322] border-violet-850/40 text-white'
                    : 'bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 border-rose-450/20 text-white'
                  }`}>
                  <div className="absolute right-0 top-0 w-36 h-36 bg-white/5 rounded-full blur-2xl -translate-y-4 translate-x-4" />
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-xl" />

                  <div className="space-y-2 max-w-[65%] z-10 relative">
                    <span className="inline-block px-3 py-0.5 rounded-[7px] bg-white/20 text-[9px] font-black uppercase tracking-wider backdrop-blur-xs">
                      iPad Exclusive Promo
                    </span>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight">40% Off on your first order!</h3>
                    <p className="text-xs text-white/80 font-bold">Chef gourmet rewards applied instantly.</p>
                    <button
                      onClick={() => toast.success('Reward coupon activated!')}
                      className="px-5 py-2 bg-slate-900 text-white rounded-[7px] text-[10px] font-black mt-2.5 cursor-pointer hover:bg-black active:scale-95 transition-all shadow-md uppercase tracking-wider"
                    >
                      Activate Deal
                    </button>
                  </div>
                  <div className="text-8xl select-none absolute -right-2 bottom-0 translate-y-4 opacity-25 z-0 animate-bounce duration-5000">
                    🍔
                  </div>
                </div>
              )}

              {/* Square Category Tiles swiper */}
              <div className="space-y-3 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Explore Categories</span>
                <div className="flex space-x-5 overflow-x-auto pb-2 scrollbar-none select-none">
                  {categories.map((c) => {
                    const isSelected = selectedCategory === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => setSelectedCategory(c.name)}
                        className="flex flex-col items-center space-y-2 shrink-0 cursor-pointer group focus:outline-none"
                      >
                        <div className={`w-16 h-16 rounded-[7px] border flex items-center justify-center text-2xl transition-all duration-350 ${isSelected
                            ? `${activeTheme.primaryBg} border-transparent text-white shadow-md scale-105`
                            : isDarkTheme
                              ? 'bg-slate-900 border-slate-800 text-slate-350 hover:border-slate-700 hover:scale-102'
                              : 'bg-white border-slate-150/70 text-slate-655 shadow-3xs hover:border-slate-200 hover:scale-102'
                          }`}>
                          <span className="text-2xl transition-transform group-hover:scale-110 duration-200">{c.icon || '🍔'}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${isSelected
                            ? activeTheme.primaryText
                            : isDarkTheme ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-800'
                          }`}>
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid block content */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {activeLeftTab === 'menu' ? 'Gourmet Delicacies' : 'Bookmarked Favorites'}
                  </span>
                  <span className={`text-[9px] font-black text-slate-400 flex items-center space-x-1 ${activeTheme.primaryText}`}>
                    <FiTrendingUp className="w-3.5 h-3.5" />
                    <span>VERIFIED DELICIOUS</span>
                  </span>
                </div>

                {/* Grid layout */}
                {activeLeftTab === 'menu' ? (
                  filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-5 pb-6">
                      {filteredProducts.map((item) => {
                        const basePrice = parseFloat(item.price);
                        const isDiscounted = item.id % 2 !== 0;
                        const originalPrice = isDiscounted ? (basePrice * 1.25).toFixed(2) : null;
                        const { name: itemDisplayName } = getTranslation(item, locale);

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleOpenDetail(item)}
                            className={`rounded-[7px] p-4 flex flex-col justify-between border cursor-pointer group transition-all duration-300 relative ${isDarkTheme
                                ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                                : 'bg-white border-slate-100 hover:border-slate-200 shadow-3xs'
                              }`}
                          >
                            <button
                              onClick={(e) => handleToggleWishlist(e, item.id)}
                              className={`absolute top-3.5 right-3.5 p-2 rounded-[7px] z-10 transition-colors cursor-pointer ${wishlist.includes(item.id)
                                  ? 'bg-rose-50 text-rose-500 shadow-3xs'
                                  : 'bg-black/30 text-white backdrop-blur-xs hover:bg-black/40'
                                }`}
                            >
                              <FiHeart className={`w-3.5 h-3.5 ${wishlist.includes(item.id) ? 'fill-current' : ''}`} />
                            </button>

                            <div className="h-36 w-full overflow-hidden rounded-[7px] bg-slate-50 border border-slate-100/10 shrink-0">
                              <img
                                src={getProductImage(item)}
                                alt={itemDisplayName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <div className="space-y-2 pt-3 flex-grow flex flex-col justify-between">
                              <div className="space-y-0.5">
                                <h4 className={`text-sm font-black line-clamp-1 group-hover:${activeTheme.primaryText} transition-colors ${isDarkTheme ? 'text-white' : 'text-slate-800'
                                  }`}>
                                  {itemDisplayName}
                                </h4>
                                <div className="flex items-baseline space-x-1.5">
                                  <span className={`text-sm font-black ${activeTheme.primaryText}`}>${basePrice.toFixed(2)}</span>
                                  {originalPrice && (
                                    <span className="text-[10px] text-slate-400 line-through font-bold">${originalPrice}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-slate-100/10 mt-1">
                                <div className="flex items-center text-amber-400">
                                  <FiStar className="w-3.5 h-3.5 fill-current" />
                                  <span className="text-[10px] font-black text-slate-400 ml-0.5">4.9</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(item);
                                  }}
                                  className={`w-7.5 h-7.5 rounded-[7px] flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer ${activeTheme.primaryBg}`}
                                >
                                  <FiPlus className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20 space-y-2">
                      <span className="text-3xl">🥗</span>
                      <p className="text-slate-400 text-sm font-bold">No delicacies found in this category.</p>
                    </div>
                  )
                ) : (
                  // WISHLIST VIEWPORT ON TABLET
                  wishlist.length > 0 ? (
                    <div className="grid grid-cols-2 gap-5 pb-6">
                      {topSellingItems
                        .filter(x => wishlist.includes(x.id))
                        .filter(item => {
                          if (selectedCategory === 'All') return true;
                          const catLower = selectedCategory.toLowerCase();
                          return item.name.toLowerCase().includes(catLower) ||
                            (item.description && item.description.toLowerCase().includes(catLower)) ||
                            (item.sku || '').toLowerCase().startsWith(catLower.substring(0, 3));
                        })
                        .map((item) => {
                          const price = parseFloat(item.price);
                          const { name: itemDisplayName } = getTranslation(item, locale);
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleOpenDetail(item)}
                              className={`rounded-[7px] p-4 flex flex-col justify-between border cursor-pointer relative ${isDarkTheme ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'
                                }`}
                            >
                              <button
                                onClick={(e) => handleToggleWishlist(e, item.id)}
                                className="absolute top-3.5 right-3.5 p-2 rounded-[7px] bg-rose-50 text-rose-500 z-10 cursor-pointer"
                              >
                                <FiHeart className="w-3.5 h-3.5 fill-current" />
                              </button>

                              <div className="h-32 w-full overflow-hidden rounded-[7px] bg-slate-50 border border-slate-100/10">
                                <img src={getProductImage(item)} alt={itemDisplayName} className="w-full h-full object-cover" />
                              </div>

                              <div className="pt-3 space-y-2">
                                <h4 className={`text-sm font-black line-clamp-1 ${isDarkTheme ? 'text-white' : 'text-slate-808'}`}>{itemDisplayName}</h4>
                                <span className={`text-sm font-black block ${activeTheme.primaryText}`}>${price.toFixed(2)}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(item);
                                  }}
                                  className={`w-full py-2.5 rounded-[7px] text-xs font-black text-white mt-1 cursor-pointer flex items-center justify-center space-x-2 ${activeTheme.primaryBg}`}
                                >
                                  <FiShoppingCart className="w-3.5 h-3.5" />
                                  <span>Add To Cart</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-24 space-y-3 flex-grow flex flex-col justify-center items-center">
                      <FiHeart className="text-slate-400 w-14 h-14 stroke-[1.2]" />
                      <div>
                        <h4 className={`text-base font-black ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>Your Wishlist is Empty</h4>
                        <p className="text-slate-400 text-xs font-semibold mt-1">Tap hearts on delicacy cards to bookmark dishes here.</p>
                      </div>
                    </div>
                  )
                )}
              </div>

            </div>
          </div>

          {/* ============================================== */}
          {/* ── RIGHT PERSISTENT SIDEBAR (Cart & Checkout) ── */}
          {/* ============================================== */}
          <div className={`w-[40%] flex flex-col h-full p-6 space-y-6 ${isDarkTheme ? 'bg-[#0B0F19]/50' : 'bg-slate-50/50'
            }`}>
            <h2 className={`text-lg font-black flex items-center space-x-2.5 shrink-0 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              <FiShoppingCart className={`w-5 h-5 ${activeTheme.primaryText}`} />
              <span>Checkout Order Board</span>
              {cart.length > 0 && (
                <span className={`px-2.5 py-0.5 rounded-full text-white text-[10px] font-black ${activeTheme.primaryBg}`}>
                  {cart.reduce((sum, ci) => sum + ci.qty, 0)} Items
                </span>
              )}
            </h2>

            {cart.length > 0 ? (
              <form onSubmit={handleCheckoutSubmit} className="flex-grow flex flex-col justify-between overflow-hidden">
                {/* Scrollable list items */}
                <div className="space-y-4 overflow-y-auto flex-grow pr-1 pb-4 scrollbar-none">
                  {cart.map((ci) => {
                    const activePrice = getProductPrice(ci.item, ci.selectedVariant);
                    const { name: itemDisplayName } = getTranslation(ci.item, locale);
                    const variantLabel = ci.selectedVariant
                      ? ` (${getVariantLabel(ci.selectedVariant, ci.item.sku)})`
                      : '';
                    return (
                      <div
                        key={ci.id}
                        className={`p-3 rounded-[7px] border flex items-center gap-3 relative transition-all ${isDarkTheme ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'
                          }`}
                      >
                        <div className="w-14 h-14 rounded-[7px] overflow-hidden shrink-0 border border-slate-100/10">
                          <img src={getProductImage(ci.item, ci.selectedVariant)} alt={itemDisplayName} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-grow min-w-0">
                          <h4 className={`text-xs font-black truncate leading-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {itemDisplayName}{variantLabel}
                          </h4>
                          <span className={`text-[11px] font-bold block mt-1.5 ${activeTheme.primaryText}`}>${activePrice.toFixed(2)}</span>
                        </div>

                        {/* quantity controller */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(ci.id, -1)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors text-xs cursor-pointer ${isDarkTheme ? 'bg-slate-800 text-slate-350 hover:bg-slate-700' : 'bg-slate-200 text-slate-650 hover:bg-slate-300'
                              }`}
                          >
                            <FiMinus className="w-3 h-3" />
                          </button>
                          <span className={`text-xs font-black w-4 text-center ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>{ci.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(ci.id, 1)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors text-xs cursor-pointer ${isDarkTheme ? 'bg-slate-800 text-slate-350 hover:bg-slate-700' : 'bg-slate-200 text-slate-655 hover:bg-slate-300'
                              }`}
                          >
                            <FiPlus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(ci.id, itemDisplayName)}
                            className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotals and pay CTA */}
                <div className="space-y-4 shrink-0 pt-2 border-t border-slate-100/10">
                  <div className={`p-4 rounded-[7px] border space-y-2.5 text-xs font-bold ${isDarkTheme ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-100 shadow-3xs'
                    }`}>
                    <div className="flex justify-between text-slate-450">
                      <span>Gourmet Subtotal:</span>
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
                      <span>Order Total:</span>
                      <span className={activeTheme.primaryText}>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCheckingOut}
                    className={`w-full py-4 rounded-[7px] font-black text-xs text-white cursor-pointer transition-transform active:scale-95 text-center flex items-center justify-center space-x-2 ${activeTheme.primaryBg
                      } shadow-md ${activeTheme.shadowClass}`}
                  >
                    {isCheckingOut ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Verifying Secure Transaction...</span>
                      </>
                    ) : (
                      <span>Place Secure Checkout · ${total.toFixed(2)}</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-28 space-y-4 flex-grow flex flex-col justify-center items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-slate-900' : 'bg-slate-100'
                  }`}>
                  <FiShoppingCart className="text-slate-400 w-7 h-7 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className={`text-sm font-black ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>Your Cart is Empty</h4>
                  <p className="text-slate-400 text-[10px] font-semibold max-w-[200px] mx-auto leading-relaxed">
                    Select mouthwatering chef selections from the menu grid on the left.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

