import React, { useState, useEffect, useMemo } from 'react';
import { FiHeart, FiShoppingBag, FiCheckCircle, FiSearch, FiSliders, FiStar, FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { toast } from '../utils/toast';

import { useFashionItems } from '../hooks/useFashionItems';
import { useCart } from '../hooks/useCart';
import { resolveImageUrl } from '../utils/imageUtils';
import {
  parseAttributeValue,
  resolveColorHex,
  getProductColors,
  getProductSizes,
} from '../utils/priceUtils';

interface FashionTabletViewProps {
  ownerUserId?: number | string;
  storeName?: string;
  settings?: any;
  locale?: 'en' | 'km';
  token?: string | null;
  profile?: any;
  onToggleDesktop?: () => void;
}

export const FashionTabletView: React.FC<FashionTabletViewProps> = ({
  ownerUserId,
  storeName = '',
  settings,
  locale: _locale = 'en',
  profile,
  onToggleDesktop,
}) => {
  const isDarkTheme = (settings?.website_theme || '').startsWith('minimal_dark') || settings?.website_theme === 'glass_gradient' || settings?.website_theme === 'electronic';

  // Navigation tab for left column
  const [activeLeftTab, setActiveLeftTab] = useState<'menu' | 'wishlist'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const detailContainerRef = React.useRef<HTMLDivElement>(null);

  // Detail panel customization options
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [detailQty, setDetailQty] = useState(1);

  // Cart Coupon input states
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Checkout billing details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Load products and categories
  const {
    displayItems,
    displayCatalogItems,
    categories,
    activeCategoryHash,
    setActiveCategoryHash,
  } = useFashionItems(ownerUserId, searchQuery);

  // Shared cart state
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

  // Wishlist favorites state
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

  const getProductImage = (item: any): string => {
    const imgUrl = item.display_image || item.image;
    return resolveImageUrl(imgUrl) || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80';
  };

  // Manage details configuration reset when product changes
  useEffect(() => {
    if (selectedProduct) {
      const sizes = getProductSizes(selectedProduct);
      setSelectedSize(selectedProduct.has_options ? sizes[0] || '' : '');

      const parsedColors = getProductColors(selectedProduct);
      const colors = parsedColors.length > 0 ? parsedColors : (selectedProduct as any).colors || [];
      setSelectedColor(selectedProduct.has_options ? colors[0] || '' : '');

      setDetailQty(1);

      if (detailContainerRef.current) {
        detailContainerRef.current.scrollTop = 0;
      }
    }
  }, [selectedProduct?.id]);

  const activeSizes = selectedProduct ? getProductSizes(selectedProduct) : [];
  const parsedDetailColors = selectedProduct ? getProductColors(selectedProduct) : [];
  const activeColors = selectedProduct ? (parsedDetailColors.length > 0 ? parsedDetailColors : (selectedProduct as any).colors || []) : [];

  const activeVariant = useMemo(() => {
    if (!selectedProduct || !selectedProduct.variants || selectedProduct.variants.length === 0) return undefined;
    if (!selectedProduct.has_options) return selectedProduct.variants[0];
    return selectedProduct.variants.find((v: any) => {
      let matchSize = !selectedSize;
      let matchColor = !selectedColor;
      if (v.attribute_values) {
        v.attribute_values.forEach((av: any) => {
          const val = av.value;
          const parsed = parseAttributeValue(
            val,
            av.attribute?.name?.toLowerCase() === 'color' ||
            av.attribute?.name?.toLowerCase() === 'colour'
          );
          if (parsed.value === selectedSize) matchSize = true;
          if (selectedColor && parsed.isColor && parsed.colorName && parsed.colorName.toLowerCase() === selectedColor.toLowerCase()) {
            matchColor = true;
          }
        });
      }
      return matchSize && matchColor;
    });
  }, [selectedProduct, selectedSize, selectedColor]);

  const isDetailOutOfStock = useMemo(() => {
    if (!selectedProduct) return true;
    // 1. Check status
    if (selectedProduct.status === 'archived') return true;

    // 2. If it has options, check variant stock
    if (selectedProduct.has_options) {
      if (!activeVariant) return true;
      return (Number(activeVariant.stock_qty) ?? 0) <= 0;
    } 
    
    // 3. Simple products
    const firstVar = selectedProduct.variants?.[0];
    if (!firstVar) {
      // Mockup items (ID >= 10000) are available by default if no variants
      const isMockup = selectedProduct.id >= 10000;
      return !isMockup;
    }
    return (Number(firstVar.stock_qty) ?? 0) <= 0;
  }, [selectedProduct, activeVariant]);

  const activeDetailPrice = activeVariant ? parseFloat(activeVariant.retail_price) : (selectedProduct ? parseFloat(selectedProduct.price) : 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setIsApplyingCode(true);
      await applyCoupon(couponCode);
      setCouponCode('');
    } catch {
      toast.error('Invalid coupon code');
    } finally {
      setIsApplyingCode(false);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error('Please fill in all delivery fields');
      return;
    }
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderSuccess(true);
      setCart([]);
      toast.success('Boutique order placed successfully!');
    }, 1500);
  };

  // Filter left panel items
  const catalogProducts = activeLeftTab === 'menu'
    ? displayCatalogItems
    : displayItems.filter(p => !!wishlist[String(p.id)]);

  const freeShippingThreshold = settings?.free_shipping_threshold ? parseFloat(settings.free_shipping_threshold) : 50;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className={`w-full min-h-screen select-none transition-all duration-300 ${
      isDarkTheme ? 'bg-[#080808]' : 'bg-stone-100/50'
    } flex justify-center p-4 lg:p-6`}>
      <div className={`w-full max-w-6xl h-[calc(100vh-2rem)] flex flex-col font-sans rounded-[12px] overflow-hidden border shadow-2xl relative ${
        isDarkTheme ? 'bg-stone-950 text-stone-100 border-stone-900' : 'bg-white text-stone-850 border-stone-200/50'
      }`}>
        {/* Checkout Order Success View overlay */}
        {orderSuccess && (
          <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center space-y-6 ${
            isDarkTheme ? 'bg-stone-950' : 'bg-white'
          }`}>
            <div className="w-24 h-24 bg-emerald-55/10 text-emerald-600 rounded-full flex items-center justify-center shadow-sm">
              <FiCheckCircle className="w-12 h-12 animate-bounce" />
            </div>
            <div className="space-y-2.5">
              <h3 className="text-xl font-serif tracking-widest uppercase">Order Confirmed Successfully</h3>
              <p className="text-stone-400 text-xs max-w-md mx-auto">
                Thank you for placing your boutique purchase with us. Your garment selections are locked and are now prepared for delivery. Expected time is 1 to 3 days!
              </p>
            </div>
            <button
              onClick={() => {
                setOrderSuccess(false);
                setActiveLeftTab('menu');
              }}
              className="px-8 py-3 bg-stone-900 hover:bg-stone-950 dark:bg-stone-100 dark:text-stone-950 text-white text-xs font-black uppercase tracking-widest rounded-[4px] cursor-pointer"
            >
              Back To Catalog
            </button>
          </div>
        )}

        {/* ──────── SPLIT PANEL VIEW ──────── */}
        <div className="flex-grow flex overflow-hidden h-full">
          {/* ======================================= */}
          {/* ── Left Column: Catalog / Browsing ── */}
          {/* ======================================= */}
          <div className="w-[60%] flex flex-col h-full border-r border-stone-200/50 dark:border-stone-900 overflow-hidden relative">
            {/* Header / Brand block */}
            <div className={`absolute top-0 left-0 right-0 p-6 pb-4 flex justify-between items-center z-30 border-b backdrop-blur-md transition-all duration-300 ${
              isDarkTheme
                ? 'bg-stone-950/80 border-stone-900 text-stone-100'
                : 'bg-white/85 border-stone-200/50 text-stone-850 shadow-3xs'
            }`}>
              <div>
                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block font-sans">TABLET STUDIO PANEL</span>
                <h1 className="text-lg font-serif tracking-wider uppercase">{settings?.store_name || storeName || 'AURA'}</h1>
              </div>

              <div className="flex items-center space-x-4">
                {onToggleDesktop && (
                  <button
                    onClick={onToggleDesktop}
                    className={`px-3.5 py-2 rounded-[4px] border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isDarkTheme
                        ? 'border-stone-850 bg-stone-900 text-stone-300 hover:bg-stone-800'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 shadow-3xs'
                    }`}
                  >
                    View Desktop
                  </button>
                )}

                {/* Left Panel Tabs Toggle */}
                <div className={`p-1 rounded-[4px] flex items-center space-x-1 ${
                  isDarkTheme ? 'bg-stone-900' : 'bg-stone-100'
                }`}>
                  <button
                    onClick={() => setActiveLeftTab('menu')}
                    className={`px-4 py-2 rounded-[4px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeLeftTab === 'menu'
                        ? 'bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Shop Collection
                  </button>
                  <button
                    onClick={() => setActiveLeftTab('wishlist')}
                    className={`px-4 py-2 rounded-[4px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeLeftTab === 'wishlist'
                        ? 'bg-rose-500 text-white'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Wishlist ({Object.values(wishlist).filter(Boolean).length})
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable listing pane */}
            <div className="flex-grow overflow-y-auto px-6 pb-6 pt-28 space-y-6 scrollbar-none">
              {/* Search input with filters */}
              <div className="relative flex items-center gap-3 shrink-0">
                <div className="relative flex-grow">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4.5 h-4.5" />
                  <input
                    type="text"
                    placeholder="Search collection items, linen sets, knitwear, accessories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 text-xs rounded-[4px] focus:outline-none transition-all ${
                      isDarkTheme
                        ? 'bg-stone-900 focus:bg-stone-950 border border-stone-850 text-white'
                        : 'bg-stone-55 focus:bg-white border border-stone-150 text-stone-800 shadow-3xs'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  className={`p-3 rounded-[4px] flex items-center justify-center border transition-all cursor-pointer ${
                    isDarkTheme
                      ? 'bg-stone-900 border-stone-850 text-stone-300'
                      : 'bg-stone-55 border-stone-200/50 text-stone-700 shadow-3xs'
                  }`}
                >
                  <FiSliders className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Categories Scroll Strip */}
              {activeLeftTab === 'menu' && (
                <div className="space-y-2.5 shrink-0">
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block font-sans">Shop Categories</span>
                  <div className="flex space-x-2.5 overflow-x-auto pb-1 select-none">
                    <button
                      onClick={() => setActiveCategoryHash('')}
                      className={`px-4.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all shrink-0 cursor-pointer ${
                        activeCategoryHash === ''
                          ? 'bg-stone-900 border-stone-900 text-white'
                          : isDarkTheme
                            ? 'bg-stone-900 border-stone-850 text-stone-400 hover:text-white'
                            : 'bg-stone-55 border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      All Under $9.99
                    </button>
                    {categories.map((c) => {
                      const hash = `#${c.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                      const isSelected = activeCategoryHash === hash;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setActiveCategoryHash(hash)}
                          className={`px-4.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-stone-900 border-stone-900 text-white'
                              : isDarkTheme
                                ? 'bg-stone-900 border-stone-850 text-stone-400 hover:text-white'
                                : 'bg-stone-55 border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3-Column Product Catalog Grid */}
              <div className="space-y-4">
                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block">Collection Catalog</span>
                {catalogProducts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4 pb-6">
                    {catalogProducts.map((item) => {
                      const priceVal = parseFloat(item.price);
                      const compareAt = item.compare_at_price
                        ? parseFloat(item.compare_at_price)
                        : item.id % 2 !== 0 ? priceVal * 1.3 : null;

                      const isFav = !!wishlist[String(item.id)];

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedProduct(item)}
                          className={`rounded-[6px] overflow-hidden flex flex-col justify-between border cursor-pointer group transition-all duration-300 relative ${
                            isDarkTheme
                              ? 'bg-stone-900/30 border-stone-850 hover:border-stone-750'
                              : 'bg-white border-stone-150/70 hover:border-stone-200 shadow-3xs'
                          }`}
                        >
                          {/* Favorite button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(String(item.id), item.name);
                            }}
                            className={`absolute top-2.5 right-2.5 p-1.5 rounded-full z-10 transition-colors ${
                              isFav ? 'bg-rose-50 text-rose-500' : 'bg-black/30 text-stone-200'
                            }`}
                          >
                            <FiHeart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                          </button>

                          {/* Image box (3:4 ratio) */}
                          <div className="aspect-[3/4] w-full overflow-hidden bg-stone-100/50">
                            <img
                              src={getProductImage(item)}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                            />
                          </div>

                          <div className="p-3 space-y-1">
                            <h4 className={`text-[10px] font-semibold truncate leading-tight ${
                              isDarkTheme ? 'text-stone-200 font-bold' : 'text-stone-800'
                            }`}>
                              {item.name}
                            </h4>
                            <div className="flex items-baseline space-x-1.5">
                              <span className="text-[10px] font-bold">${priceVal.toFixed(2)}</span>
                              {compareAt && (
                                <span className="text-[8.5px] text-stone-400 line-through">${compareAt.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-2 border border-dashed border-stone-200 dark:border-stone-850 rounded-[6px]">
                    <span className="text-2xl">🧥</span>
                    <p className="text-stone-400 text-xs font-bold">No garments found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================================================ */}
          {/* ── Right Column: Selected Detail OR Shopping Bag ── */}
          {/* ================================================ */}
          <div className="w-[40%] flex flex-col h-full overflow-hidden bg-stone-55 dark:bg-stone-900/10">
            {selectedProduct ? (
              // ── Active Product detail customization drawer ──
              <div ref={detailContainerRef} className="flex flex-col h-full overflow-y-auto p-5 space-y-5 scrollbar-none">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200 dark:border-stone-800">
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">GARMENT DETAILS</span>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-stone-400 hover:text-stone-800 dark:hover:text-white text-[10px] font-black uppercase tracking-wider border-none bg-transparent cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Small preview item info */}
                <div className="flex gap-4">
                  <div className="w-20 h-24 bg-stone-100 rounded-[4px] overflow-hidden shrink-0 border border-stone-200/40 shadow-sm">
                    <img src={getProductImage(selectedProduct)} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1.5 py-0.5">
                    <h3 className="text-sm font-serif uppercase tracking-wide leading-tight">{selectedProduct.name}</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-sm font-bold text-rose-600">${activeDetailPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center text-amber-500 text-[10px]">
                      <FiStar className="fill-current" />
                      <span className="text-stone-400 ml-1">4.8 Rating</span>
                    </div>
                  </div>
                </div>

                {/* Colors swatches */}
                {selectedProduct.has_options && activeColors.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Select Color</span>
                    <div className="flex flex-wrap gap-2">
                      {activeColors.map((color: string, idx: number) => {
                        const hex = resolveColorHex(selectedProduct, color);
                        const isSelected = selectedColor.toLowerCase() === color.toLowerCase() || hex.toLowerCase() === resolveColorHex(selectedProduct, selectedColor).toLowerCase();
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                              isSelected ? 'border-stone-900 dark:border-stone-100' : 'border-stone-200 dark:border-stone-800'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: hex }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes pills */}
                {selectedProduct.has_options && activeSizes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Select Size</span>
                    <div className="grid grid-cols-4 gap-2">
                      {activeSizes.map((sz: string) => {
                        const isSelected = selectedSize === sz;
                        const isAvailable = selectedProduct.variants?.some((v: any) => {
                          let matchSize = false;
                          let matchColor = !selectedColor;
                          if (v.attribute_values) {
                            v.attribute_values.forEach((av: any) => {
                              const parsed = parseAttributeValue(av.value, av.attribute?.name?.toLowerCase() === 'color');
                              if (parsed.value === sz) matchSize = true;
                              if (selectedColor && parsed.isColor && parsed.colorName?.toLowerCase() === selectedColor.toLowerCase()) matchColor = true;
                            });
                          }
                          return matchSize && matchColor && (v.stock_qty ?? 0) > 0;
                        });

                        return (
                          <button
                            key={sz}
                            disabled={!isAvailable}
                            onClick={() => setSelectedSize(sz)}
                            className={`py-1.5 text-center text-2xs font-black rounded-[2px] border transition-all ${
                              isSelected
                                ? 'bg-stone-950 text-white border-stone-950 dark:bg-white dark:text-stone-950 dark:border-white'
                                : isAvailable
                                  ? 'bg-white hover:bg-stone-50 text-stone-750 border-stone-200 dark:bg-stone-900 dark:border-stone-850'
                                  : 'bg-stone-100 text-stone-400 border-stone-200/50 line-through opacity-40 dark:bg-stone-900/50 dark:border-stone-850/50'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Qty incrementors */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Quantity</span>
                  <div className="flex items-center w-[110px] rounded-[3px] bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
                    <button
                      onClick={() => setDetailQty(p => Math.max(1, p - 1))}
                      className="w-8 py-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center justify-center font-bold border-none cursor-pointer text-xs"
                    >
                      <FiMinus />
                    </button>
                    <span className="flex-1 text-center font-black text-xs text-stone-900 dark:text-stone-100 select-none">{detailQty}</span>
                    <button
                      onClick={() => setDetailQty(p => p + 1)}
                      className="w-8 py-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center justify-center font-bold border-none cursor-pointer text-xs"
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-stone-500 text-[11px] leading-relaxed">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Description</span>
                  <p>{selectedProduct.description || 'Curated luxury collection linen matching sets designed for ease and structure.'}</p>
                </div>

                {/* Add to bag action button */}
                <div className="pt-4 mt-auto">
                  <button
                    disabled={isDetailOutOfStock}
                    onClick={() => {
                      addToCart(selectedProduct, detailQty, selectedSize, selectedColor);
                      setSelectedProduct(null);
                      toast.success(`Added ${selectedProduct.name} to bag!`);
                    }}
                    className={`w-full py-3.5 font-black text-xs uppercase tracking-widest rounded-[4px] transition-colors border-none shadow-sm flex items-center justify-center gap-2 ${
                      isDetailOutOfStock
                        ? 'bg-stone-200 text-stone-400 dark:bg-stone-900 cursor-not-allowed'
                        : 'bg-stone-950 hover:bg-[#E61E25] text-white dark:bg-stone-100 dark:text-stone-900 cursor-pointer'
                    }`}
                  >
                    <FiShoppingBag className="w-4 h-4" />
                    <span>{isDetailOutOfStock ? 'Out of stock' : `Add to Bag • $${(activeDetailPrice * detailQty).toFixed(2)}`}</span>
                  </button>
                </div>
              </div>
            ) : (
              // ── Right Column: Shopping Bag listings and checkout ──
              <div className="flex flex-col h-full overflow-hidden p-5 space-y-4">
                <h2 className="text-sm font-serif tracking-widest uppercase flex items-center space-x-2 shrink-0 border-b border-stone-200 dark:border-stone-800 pb-2">
                  <FiShoppingBag className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Your Shopping Bag ({cart.reduce((sum, item) => sum + item.qty, 0)})</span>
                </h2>

                {cart.length > 0 ? (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-4 flex-grow flex flex-col justify-between overflow-hidden">
                    {/* Scrollable list bag items */}
                    <div className="space-y-3.5 overflow-y-auto flex-grow pb-2 scrollbar-none">
                      {/* Shipping bar */}
                      <div className={`p-3 rounded-[4px] border ${
                        isDarkTheme ? 'bg-stone-900/30 border-stone-850' : 'bg-stone-100 border-stone-150'
                      } text-[9px] font-semibold space-y-1.5 shrink-0`}>
                        <div className="flex justify-between items-center text-stone-500">
                          <span>Free shipping target: <strong>${freeShippingThreshold}</strong></span>
                        </div>
                        <div className="w-full bg-stone-200 dark:bg-stone-850 h-1 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                        </div>
                        {subtotal >= freeShippingThreshold ? (
                          <span className="text-emerald-600 font-bold block">Unlocked FREE delivery!</span>
                        ) : (
                          <span className="text-stone-400 block">Add ${(freeShippingThreshold - subtotal).toFixed(2)} more.</span>
                        )}
                      </div>

                      {/* Line Items */}
                      <div className="space-y-2">
                        {cart.map((ci) => {
                          const itemPrice = parseFloat(ci.item.price);
                          return (
                            <div
                              key={ci.id}
                              className={`p-2.5 rounded-[4px] border flex gap-2.5 relative ${
                                isDarkTheme ? 'bg-stone-900/40 border-stone-850' : 'bg-white border-stone-150 shadow-3xs'
                              }`}
                            >
                              <div className="w-12 h-16 bg-stone-100 rounded-[2px] overflow-hidden shrink-0 border border-stone-200/40">
                                <img src={ci.selectedImage || ci.item.display_image} alt={ci.item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                                <div className="space-y-0.5">
                                  <h4 className="text-[10px] font-semibold truncate leading-none text-stone-800 dark:text-stone-200">{ci.item.name}</h4>
                                  {(ci.selectedSize || ci.selectedColor) && (
                                    <div className="text-[8px] text-stone-400 font-bold uppercase tracking-wider">
                                      {ci.selectedSize && <span>Sz: {ci.selectedSize}</span>}
                                      {ci.selectedSize && ci.selectedColor && <span> • </span>}
                                      {ci.selectedColor && <span>Col: {ci.selectedColor}</span>}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold">${itemPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex flex-col justify-between items-end shrink-0">
                                <button type="button" onClick={() => removeFromCart(ci.id, ci.item.name)} className="text-stone-400 hover:text-rose-500 p-0.5">
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                                <div className="flex items-center space-x-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-850 rounded-[2px] p-0.5">
                                  <button type="button" onClick={() => updateQty(ci.id, -1)} className="w-4.5 h-4.5 flex items-center justify-center text-stone-600 rounded-[2px] hover:bg-stone-200 dark:hover:bg-stone-800">
                                    <FiMinus className="w-2.5 h-2.5" />
                                  </button>
                                  <span className="text-[9.5px] font-black w-2.5 text-center">{ci.qty}</span>
                                  <button type="button" onClick={() => updateQty(ci.id, 1)} className="w-4.5 h-4.5 flex items-center justify-center text-stone-600 rounded-[2px] hover:bg-stone-200 dark:hover:bg-stone-800">
                                    <FiPlus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Coupon promotional */}
                      <div className="space-y-1.5 pt-1.5 border-t border-stone-200 dark:border-stone-800">
                        {appliedCoupon ? (
                          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/30 p-2 rounded-[4px] text-[10px]">
                            <span className="text-emerald-800 dark:text-emerald-400 font-bold">Applied: <strong>{appliedCoupon.code}</strong> (-${discount.toFixed(2)})</span>
                            <button type="button" onClick={removeCoupon} className="text-stone-400 hover:text-stone-700 dark:hover:text-white font-bold">[Remove]</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Promo Code"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              className={`flex-grow px-2 py-1.5 text-2xs rounded-[4px] focus:outline-none ${
                                isDarkTheme ? 'bg-stone-950 border border-stone-850 text-white' : 'bg-white border border-stone-200 text-stone-800'
                              }`}
                            />
                            <button
                              type="button"
                              disabled={isApplyingCode}
                              onClick={handleApplyCoupon}
                              className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 dark:text-stone-950 text-white text-[10px] font-black uppercase tracking-wider rounded-[4px] cursor-pointer"
                            >
                              Apply
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Billing forms */}
                      <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block font-sans">Billing Details</span>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`w-full px-2.5 py-2 text-2xs rounded-[4px] focus:outline-none ${
                            isDarkTheme ? 'bg-stone-950 border border-stone-850 text-white' : 'bg-stone-100 border border-stone-150 text-stone-800'
                          }`}
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`w-full px-2.5 py-2 text-2xs rounded-[4px] focus:outline-none ${
                            isDarkTheme ? 'bg-stone-950 border border-stone-850 text-white' : 'bg-stone-100 border border-stone-150 text-stone-800'
                          }`}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Street Address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className={`w-full px-2.5 py-2 text-2xs rounded-[4px] focus:outline-none ${
                            isDarkTheme ? 'bg-stone-950 border border-stone-850 text-white' : 'bg-stone-100 border border-stone-150 text-stone-800'
                          }`}
                          required
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className={`w-full px-2.5 py-2 text-2xs rounded-[4px] focus:outline-none ${
                            isDarkTheme ? 'bg-stone-950 border border-stone-850 text-white' : 'bg-stone-100 border border-stone-150 text-stone-800'
                          }`}
                          required
                        />
                      </div>
                    </div>

                    {/* Totals Summary and submit CTA */}
                    <div className="space-y-3 shrink-0">
                      <div className="p-3 rounded-[4px] border space-y-2 text-[10px] font-black uppercase tracking-wider bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-850">
                        <div className="flex justify-between text-stone-400">
                          <span>Subtotal:</span>
                          <span className={isDarkTheme ? 'text-stone-200' : 'text-stone-850'}>${subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-rose-500 font-bold">
                            <span>Discount:</span>
                            <span>-${discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-stone-400">
                          <span>Shipping:</span>
                          <span className={isDarkTheme ? 'text-stone-200' : 'text-stone-850'}>
                            {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `$${deliveryFee.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-black pt-2 border-t border-stone-200 dark:border-stone-800">
                          <span>Total due:</span>
                          <span className="text-rose-600">${total.toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isCheckingOut}
                        className="w-full py-3.5 bg-stone-950 hover:bg-[#E61E25] dark:bg-stone-100 dark:text-stone-950 text-white text-xs font-black uppercase tracking-widest rounded-[4px] cursor-pointer text-center"
                      >
                        {isCheckingOut ? 'Processing Checkout...' : `Place Order • $${total.toFixed(2)}`}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-20 space-y-2 flex-grow flex flex-col justify-center items-center">
                    <FiShoppingBag className="text-stone-400 w-10 h-10 stroke-[1.25]" />
                    <div>
                      <h4 className="text-xs font-serif uppercase tracking-widest">Bag is empty</h4>
                      <p className="text-stone-400 text-[9.5px] font-semibold mt-1">Select items in the catalog to add to bag.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

