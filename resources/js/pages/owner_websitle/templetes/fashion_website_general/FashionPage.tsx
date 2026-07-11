import React, { useEffect, useState } from 'react';
import type { Root2 } from '@/api/owner/categories';
import { client } from '@/api/client';
import {
  FiShoppingBag,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiChevronUp,
  FiTag,
  FiPackage,
  FiClock,
  FiArrowRight,
} from 'react-icons/fi';

import '@/pages/owner_manage/style/font.css';
import { NavbarPage } from './components/NavbarPage';
import { DetailPage } from './components/DetailPage';
import { PopupDetailProduct } from './components/helpers/popupDetailProduct';
import { HeroPage } from './components/HeroPage';
import { FooterPage } from './components/FooterPage';
import { ListProdoct } from './components/ShopPage';
import { ListProductLike } from './components/ListProductLike';
import { SocialMediaGrid } from './components/SocialMediaGrid';
import { ProductOffersDeals } from './components/ProductOffersDeals';
import { LineLoading } from './components/helpers/SkeletonSt';
import './styles/animation.css';
import './styles/index.css';

import type { FashionPageProps } from './types';
import { useCart } from './hooks/useCart';
import { useFashionItems } from './hooks/useFashionItems';
import { usePromotions } from './hooks/usePromotions';
import { resolveImageUrl } from './utils/imageUtils';
import { CardProduct } from './components/helpers/CardProduct';
import { ProductBagdeGrid } from './components/helpers/ProductBagdeGrid';
import { FlashDealsGrid } from './components/helpers/FlashDealsGrid';
import { Feature_DealGrid } from './components/helpers/Feature_DealGrid';
import { CouponGrid } from './components/helpers/CouponGrid';
import { Clearance_SaleGrid } from './components/helpers/Clearance_SaleGrid';
import { QuickLinks } from './components/helpers/Quick_Links';
import { CategoriesGrid } from './components/CategoriesGridPage';
import { Special_Product } from './components/helpers/Special_Product';
import { ModelCoupon } from './components/helpers/ModelCoupon';
import { DotTechSc } from './components/helpers/DotTechSc';

import { mapToUIItem, resolveColorHex } from './utils/priceUtils';
import { CheckoutPage } from './components/CheckoutPage';
import { FASHION_ROUTES } from './routes';
import { ProfileSetting } from './components/info/profilesetting';
import { useAuth } from './hooks/useAuth';
import { likesService } from '@/api/owner/likes';
import { storeBrandingService } from '@/api/created_by/getFaviconById';
import { Store_setting } from '@/api/owner/stores';



export const FashionPage: React.FC<FashionPageProps> = ({
  ownerUserId,
  storeName = '---',
  stores,
  onNavigate,
  currentPath = '/',
  locale,
  onChangeLanguage,
}) => {
  // Interactive UI State
  const localSettings = Store_setting();
  const activeSettings = { ...(stores || {}), ...(localSettings || {}) };
  const isChatEnabled = activeSettings?.customer_chat !== 'false' && activeSettings?.customer_chat !== false;

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    return params.get('search') || '';
  });
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Vouchers/Coupon Modal Drawer State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | undefined>(undefined);

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(code);
    setTimeout(() => {
      setCopiedCouponCode(undefined);
    }, 2000);
  };

  // ── Auth ─────────────────────────────────────────────────────────────────
  const { user, login, register, logout, isLoading: isAuthLoading, isSubmitting: isAuthSubmitting } = useAuth(ownerUserId);

  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_favorites');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  // Sync guest favorites to localStorage
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      localStorage.setItem('aura_favorites', JSON.stringify(favorites));
    }
  }, [favorites, user]);

  // Fetch user favorites (likes) on mount or when user changes
  useEffect(() => {
    if (user) {
      likesService.getMyLikedProductIds()
        .then(ids => {
          const favs: Record<string, boolean> = {};
          ids.forEach(id => {
            favs[String(id)] = true;
          });
          // Merge local favorites into user favorites on login if desired, 
          // or just replace with DB ones
          setFavorites(favs);
        })
        .catch(err => console.warn('Failed to load favorites', err));
    }
  }, [user]);



  const {
    items,
    loading,
    categories,
    banners,
    activeCategoryHash,
    setBestSellersTab: _setBestSellersTab,
    displayItems,
  } = useFashionItems(ownerUserId, searchQuery);

  const {
    cart,
    orderMethod,
    setOrderMethod,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    applyCoupon: handleApplyCoupon,
    removeCoupon: handleRemoveCoupon,
    appliedCoupon,
    subtotal,
    discount,
    deliveryFee,
    total,
    cartCount,
    isLoadingCart,
  } = useCart(stores, user);




  const {
    coupons: rawCoupons,
    flashDeals,
    featuredDeals,
    clearanceSales,
    loadingPromotions,
  } = usePromotions(ownerUserId, stores);

  const fallbackFlashDeals = React.useMemo(() => {
    if (flashDeals && flashDeals.length > 0) {
      return flashDeals;
    }
    return [];
  }, [flashDeals]);

  // Dynamically update favicon for this specific store
  useEffect(() => {
    if (ownerUserId) {
      storeBrandingService.getFaviconByOwnerId(ownerUserId)
        .then(url => {
          if (url) storeBrandingService.applyFavicon(`${url}?v=${Date.now()}`);
        })
        .catch(err => console.warn('FashionPage: Failed to load favicon', err));
    }
  }, [ownerUserId]);

  const coupons = React.useMemo(() => {
    return rawCoupons.filter(c => !c.customer_id || c.customer_id === user?.id);
  }, [rawCoupons, user]);

  // Dynamically update document title & favicon based on store configuration
  useEffect(() => {
    const activeStoreName = stores?.store_name || storeName;
    if (activeStoreName && activeStoreName !== '---' && activeStoreName !== 'null') {
      document.title = activeStoreName;
    }

    const applyFavicon = (href: string) => {
      // Remove ALL existing favicon link elements so the browser treats this as a new resource
      document.querySelectorAll("link[rel~='icon']").forEach(el => el.parentNode?.removeChild(el));
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = href;
      document.head.appendChild(newLink);
    };

    const faviconUrl = stores?.favicon_url;
    if (faviconUrl) {
      // Strip any existing query params before resolving to avoid double-caching issues
      const cleanPath = faviconUrl.trim().split('?')[0];
      const resolvedUrl = resolveImageUrl(cleanPath);
      if (resolvedUrl) {
        applyFavicon(`${resolvedUrl}?v=${Date.now()}`);
        return;
      }
    }
    // No favicon configured — fall back to the default site favicon
    applyFavicon('/favicon.svg');
  }, [stores, storeName]);

  const toggleFavorite = async (id: string, _name: string) => {
    const isGuestCheckoutEnabled = stores?.guest_checkout !== false && stores?.guest_checkout !== 'false';

    if (!user && !isGuestCheckoutEnabled) {
      // Dispatch a custom event to NavbarPage to show the login modal
      window.dispatchEvent(new CustomEvent('request_login'));
      return;
    }

    if (!user) {
      // Guest mode: Save to local state (which syncs to localStorage via useEffect)
      setFavorites(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
      return;
    }

    const productId = parseInt(id);
    if (isNaN(productId)) return;

    try {
      const res = await likesService.toggleProductLike(productId);
      setFavorites(prev => ({
        ...prev,
        [id]: res.is_liked
      }));
    } catch (err) {
      console.warn('Failed to toggle like', err);
    }
  };



  // Listen for scroll changes to toggle floating cart visibility
  useEffect(() => {
    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;

      setShowScrollTop(currentScrollY > 300);

      if (currentScrollY > 150) {
        if (currentScrollY > lastScrollY) {
          // Scrolling down - show floating cart
          setShowFloatingCart(true);
        } else {
          // Scrolling up - hide floating cart (since sticky header is shown)
          setShowFloatingCart(false);
        }
      } else {
        // Near top - always hide floating cart
        setShowFloatingCart(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [lastScrollY]);

  // Reset scroll to top of document on page/route changes
  // useEffect(() => {
  //   window.scrollTo({ top: 0, behavior: 'smooth' });
  // }, [currentPath]);

  // ── Profile route guard ───────────────────────────────────────────────────
  // If the session check is done and user is not logged in while on /profile,
  // redirect home and open the login modal.
  useEffect(() => {
    if (currentPath === '/profile' && !isAuthLoading && !user) {
      if (onNavigate) {
        const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
        onNavigate(FASHION_ROUTES.getHome(storeSlug));
      }
      window.dispatchEvent(new CustomEvent('request_login'));
    }
  }, [currentPath, isAuthLoading, user]);

  const [lastPath, setLastPath] = useState(() => currentPath !== '/product' ? currentPath : '/');
  useEffect(() => {
    if (currentPath !== '/product') {
      setLastPath(currentPath);
    }
  }, [currentPath]);

  const activePath = currentPath === '/product' ? lastPath : currentPath;

  // Parse active product from URL query param if on product route
  const [urlProductId, setUrlProductId] = useState<string | null>(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    return params.get('id');
  });

  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    return params.get('popup') === 'true';
  });

  const [popupProductId, setPopupProductId] = useState<string | null>(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    return params.get('popupId');
  });

  const [popupProduct, setPopupProduct] = useState<any>(null);
  const [popupLoading, setPopupLoading] = useState(false);

  useEffect(() => {
    const handleUrlChange = (e?: Event) => {
      const customEvent = e as CustomEvent;
      const urlStr = customEvent?.detail?.to || (typeof window !== 'undefined' ? window.location.href : '');
      const url = urlStr.startsWith('http') ? new URL(urlStr) : new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      const params = url.searchParams;
      setUrlProductId(params.get('id'));
      setIsPopupOpen(params.get('popup') === 'true');
      setPopupProductId(params.get('popupId'));
      const q = params.get('search') || '';
      setSearchQuery(q);
    };

    const handleOpenPopup = (e: Event) => {
      const productId = (e as CustomEvent).detail?.productId;
      if (productId) setPopupProductId(productId);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('navigation_changed', handleUrlChange);
    window.addEventListener('open_product_popup', handleOpenPopup);

    // Clean initial URL parameters if present so that the address bar is clean immediately
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('popupId') || params.has('popup')) {
        params.delete('popupId');
        params.delete('popup');
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        const newUrl = `${window.location.pathname}${newSearch}${window.location.hash}`;
        window.history.replaceState(null, '', newUrl);
      }
    }

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('navigation_changed', handleUrlChange);
      window.removeEventListener('open_product_popup', handleOpenPopup);
    };
  }, []);

  // Fetch popup product when popupProductId changes
  useEffect(() => {
    if (!popupProductId) {
      setPopupProduct(null);
      return;
    }
    const exists = displayItems.find(item => String(item.id) === popupProductId);
    if (exists) {
      setPopupProduct(exists);
    } else {
      setPopupLoading(true);
      client.get<any>(`/products/${popupProductId}`)
        .then(res => {
          if (res) {
            setPopupProduct(mapToUIItem(res));
          }
        })
        .catch(err => console.warn('Failed to fetch popup product', err))
        .finally(() => setPopupLoading(false));
    }
  }, [popupProductId, displayItems]);

  // Synchronize searchQuery state to the URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentSearchParam = params.get('search') || '';
    if (searchQuery !== currentSearchParam) {
      if (searchQuery) {
        params.set('search', searchQuery);
      } else {
        params.delete('search');
      }
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      const newUrl = `${window.location.pathname}${newSearch}${window.location.hash}`;
      window.history.replaceState(null, '', newUrl);
      window.dispatchEvent(new CustomEvent('navigation_changed', { detail: { to: newUrl } }));
    }
  }, [searchQuery]);

  const [directProduct, setDirectProduct] = useState<Root2 | null>(() => {
    if (typeof window !== 'undefined' && urlProductId) {
      const cached = sessionStorage.getItem(`product_${urlProductId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [directLoading, setDirectLoading] = useState(false);

  useEffect(() => {
    const bc = new BroadcastChannel('data_updates');
    bc.onmessage = (event) => {
      if (event.data === 'refresh') {
        if (typeof window !== 'undefined' && urlProductId) {
          sessionStorage.removeItem(`product_${urlProductId}`);
          // Force re-fetch by clearing state
          setDirectProduct(null);
        }
      }
    };
    return () => bc.close();
  }, [urlProductId]);

  useEffect(() => {
    if (currentPath !== '/product' || !urlProductId) {
      setDirectProduct(null);
      return;
    }

    // Check if we already have it in displayItems (which is also refreshed by its own hook)
    const exists = displayItems.find(item => String(item.id) === urlProductId);
    if (exists) {
      setDirectProduct(exists as any);
      // We don't return here if we want to ensure latest from API, 
      // but displayItems is already being refreshed by useFashionItems hook.
      // However, to be safe and ensure the specific product detail is fresh:
    }

    // Otherwise, fetch it directly
    const fetchDirect = async () => {
      try {
        setDirectLoading(true);
        const res = await client.get<any>(`/products/${urlProductId}`);
        if (res) {
          const mapped = mapToUIItem(res) as any;
          setDirectProduct(mapped);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`product_${urlProductId}`, JSON.stringify(mapped));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch direct product', err);
      } finally {
        setDirectLoading(false);
      }
    };
    fetchDirect();
  }, [urlProductId, currentPath, items]);

  const activeProduct = directProduct || displayItems.find(item => String(item.id) === urlProductId);

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#1C1C1C] font-sans antialiased flex flex-col min-h-screen relative">
      <LineLoading isLoading={loading || isAuthLoading || isLoadingCart || loadingPromotions} />
      {/* Mega Menu Dropdown Navbar Component */}
      <NavbarPage
        cartCount={cart.reduce((sum, ci) => sum + ci.qty, 0)}
        favoritesCount={Object.values(favorites).filter(Boolean).length}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        user={user}
        storeName={storeName}
        stores={stores}
        onNavigate={onNavigate}
        ownerUserId={ownerUserId}
        categories={categories}
        onLogin={login}
        onRegister={register}
        onLogout={logout}
        isSubmitting={isAuthSubmitting}
        isAuthLoading={isAuthLoading}
        isLoading={loading || isAuthLoading || isLoadingCart || loadingPromotions}
        locale={locale}
        onChangeLanguage={onChangeLanguage}
      />

      {currentPath === '/product' && !isPopupOpen ? (
        <main className="flex-grow animate-fade-in">
          {activeProduct ? (
            <DetailPage
              product={activeProduct}
              addToCart={addToCart}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              storeName={storeName}
              stores={stores}
              user={user}
              appliedCoupon={appliedCoupon}
              applyCoupon={handleApplyCoupon}
              removeCoupon={handleRemoveCoupon}
              coupons={coupons}
              onNavigate={onNavigate}
              items={items}
              categories={categories}
              onClose={() => {
                if (onNavigate) {
                  const storeSlug = (stores?.store_name || storeName || 'store').replace(/\s+/g, '_');
                  if (lastPath === '/shop') {
                    onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug));
                  } else if (lastPath === '/wishlist') {
                    onNavigate(FASHION_ROUTES.getWishlist(ownerUserId, storeSlug));
                  } else if (lastPath === '/checkout') {
                    onNavigate(FASHION_ROUTES.getCheckout(ownerUserId, storeSlug));
                  } else if (lastPath === '/categories') {
                    onNavigate(FASHION_ROUTES.getCategories(ownerUserId, storeSlug));
                  } else if (lastPath.startsWith('/profile')) {
                    onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug));
                  } else {
                    onNavigate(FASHION_ROUTES.getHome(storeSlug, ownerUserId));
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[50vh] p-4">
              <div className="bg-white p-8 rounded-[4px] shadow-2xl max-w-sm w-full text-center space-y-4 relative animate-fade-in">
                {loading || directLoading ? (
                  <>
                    <div className="animate-spin h-9 w-9 border-4 border-stone-900 border-t-transparent rounded-full mx-auto" />
                    <p className="text-stone-600 text-xs font-bold uppercase tracking-widest">
                      Loading item details...
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl">🔍</span>
                    <div>
                      <h4 className="font-extrabold text-stone-850 text-sm uppercase tracking-wider">
                        Product not found
                      </h4>
                      <p className="text-stone-400 text-2xs font-semibold mt-1">
                        We couldn't retrieve this styling piece from the runway.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      ) : activePath === '/offers' || activePath === '/deals' ? (
        <main className="flex-grow animate-fade-in">
          <ProductOffersDeals
            coupons={coupons}
            flashDeals={flashDeals}
            featuredDeals={featuredDeals}
            clearanceSales={clearanceSales}
            ownerUserId={ownerUserId}
            storeName={storeName}
            stores={stores}
            onNavigate={onNavigate}
            addToCart={addToCart}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            isLoading={loadingPromotions}
          />
        </main>
      ) : activePath === '/shop' ? (
        <main className="flex-grow animate-fade-in">
          <ListProdoct
            items={items}
            categories={categories}
            onNavigate={onNavigate}
            addToCart={addToCart}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            storeName={storeName}
            stores={stores}
            ownerUserId={ownerUserId}
            selectedCategoryHash={activeCategoryHash}
            onCategoryChange={hash => {
              if (onNavigate) {
                const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
                onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { hash }));
              }
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            flashDeals={flashDeals}
            featuredDeals={featuredDeals}
            clearanceSales={clearanceSales}
          />
        </main>
      ) : activePath === '/wishlist' ? (
        <main className="flex-grow animate-fade-in">
          <ListProductLike
            items={items}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            addToCart={addToCart}
            onNavigate={onNavigate}
            storeName={storeName}
            stores={stores}
            ownerUserId={ownerUserId}
          />
        </main>
      ) : activePath === '/checkout' ? (
        <main className="flex-grow animate-fade-in">
          <CheckoutPage
            cartItems={cart}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            discount={discount}
            stores={stores}
            coupons={coupons}
            ownerUserId={ownerUserId}
            onNavigate={onNavigate}
            clearCart={clearCart}
            locale={locale}
          />
        </main>
      ) : activePath === '/categories' ? (
        <main className="flex-grow animate-fade-in">
          <CategoriesGrid
            categories={categories}
            ownerUserId={ownerUserId}
            storeName={storeName}
            stores={stores}
            onNavigate={onNavigate}
            locale={locale}
            coupons={coupons}
            onCouponClick={() => setIsCouponModalOpen(true)}
          />
        </main>
      ) : activePath === '/profile' ? (
        // Show nothing while auth resolves, then ProfileSetting only if logged in
        !isAuthLoading && user ? (
          <main className="flex-grow animate-fade-in py-0 sm:py-4 flex justify-center items-start px-0 sm:px-4">
            <ProfileSetting
              user={user}
              onClose={() => {
                if (onNavigate) {
                  const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
                  onNavigate(FASHION_ROUTES.getHome(storeSlug));
                }
              }}
              ownerUserId={ownerUserId}
              logout={logout}
              locale={locale}
              stores={stores}
            />
          </main>
        ) : (
          // Redirect handled by useEffect above — render blank to avoid flash
          <main className="flex-grow" />
        )
      ) : (
        <main className="flex-grow animate-fade-in">
          <HeroPage
            isLoading={loading}
            storeName={storeName}
            stores={stores}
            onNavigate={onNavigate}
            ownerUserId={ownerUserId}
            banners={banners}
          />

          {/* Quick Links Row */}
          <QuickLinks
            categories={categories}
            ownerUserId={ownerUserId}
            storeName={storeName}
            stores={stores}
            onNavigate={onNavigate}
            locale={locale}
            coupons={coupons}
            onCouponClick={() => setIsCouponModalOpen(true)}
          />




          {/* Main Showcase Grid (Best Sellers) */}


          {/* ─── TAGGED COLLECTIONS ────────────────────────────────────────────── */}
          <section className="w-full max-w-7xl mx-auto px-1.5 sm:px-6 lg:px-8 overflow-hidden">
            <ProductBagdeGrid
              items={displayItems}
              isLoading={loading}
              categories={categories}
              ownerUserId={ownerUserId}
              stores={stores}
              storeName={storeName}
              onNavigate={onNavigate}
              addToCart={addToCart}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          </section>

          {/* ─── FEATURED DEALS ─────────────────────────────────────────────────── */}
          {(loading || loadingPromotions || featuredDeals.length > 0) && (
            <section id="featured-deals" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
              <div className="space-y-10">
                {(loading || loadingPromotions) ? (
                  <Feature_DealGrid
                    isLoading={true}
                    displayItems={[]}
                    storeName={storeName}
                    addToCart={addToCart}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                ) : (
                  featuredDeals.map(deal => (
                    <Feature_DealGrid
                      key={deal.id}
                      deal={deal}
                      displayItems={displayItems}
                      ownerUserId={ownerUserId}
                      stores={stores}
                      storeName={storeName}
                      onNavigate={onNavigate}
                      addToCart={addToCart}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                    />
                  ))
                )}
              </div>
            </section>
          )}


          {/* ─── FLASH DEALS ─────────────────────────────────────────────────────── */}
          {(loading || loadingPromotions || fallbackFlashDeals.length > 0) && (
            <section id="flash-deals" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
              <div className="space-y-10">
                {(loading || loadingPromotions) ? (
                  <FlashDealsGrid
                    isLoading={true}
                    displayItems={[]}
                    storeName={storeName}
                    addToCart={addToCart}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                ) : (
                  fallbackFlashDeals.map(deal => (
                    <FlashDealsGrid
                      key={deal.id}
                      deal={deal}
                      displayItems={displayItems}
                      ownerUserId={ownerUserId}
                      stores={stores}
                      storeName={storeName}
                      onNavigate={onNavigate}
                      addToCart={addToCart}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                    />
                  ))
                )}
              </div>
            </section>
          )}

          {/* ─── CLEARANCE SALE ──────────────────────────────────────────────────── */}
          {(loading || loadingPromotions || clearanceSales.length > 0) && (
            <section id="clearance-sale" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-stone-200/40 pt-16 overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-8">
                <div className="flex items-center space-x-2 select-none">
                  <FiPackage className="text-[#E61E25] w-5 h-5" />
                  <h2 className="text-lg sm:text-xl font-black text-stone-900 uppercase tracking-tight">
                    Clearance Sale
                  </h2>
                  <span className="ml-2 px-2 py-0.5 bg-[#E61E25] text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                    Final Prices
                  </span>
                </div>
                <span className="text-stone-400 text-2xs font-bold uppercase tracking-wider hidden sm:block flex items-center gap-1">
                  <FiArrowRight className="w-3 h-3" /> Last chance deals
                </span>
              </div>

              <div className="space-y-10">
                {(loading || loadingPromotions) ? (
                  <Clearance_SaleGrid
                    isLoading={true}
                    displayItems={[]}
                    storeName={storeName}
                    addToCart={addToCart}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                ) : (
                  clearanceSales.map(sale => (
                    <Clearance_SaleGrid
                      key={sale.id}
                      sale={sale}
                      displayItems={displayItems}
                      ownerUserId={ownerUserId}
                      stores={stores}
                      storeName={storeName}
                      onNavigate={onNavigate}
                      addToCart={addToCart}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                    />
                  ))
                )}
              </div>
            </section>
          )}
          <SocialMediaGrid
            storeName={storeName}
            stores={stores}
            ownerUserId={ownerUserId}
            onNavigate={onNavigate}
          />
        </main>
      )}

      {/* <FooterPage
        storeName={storeName}
        stores={stores}
        ownerUserId={ownerUserId}
        onNavigate={onNavigate}
        categories={categories}
      /> */}

      {/* Slide-over Cart Drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
      >
        <div
          className={`absolute inset-0 bg-stone-950/40 backdrop-blur-2xs transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={() => setIsCartOpen(false)}
        />

        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div
            className={`w-screen max-w-md transform transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
          >
            <div className="h-full flex flex-col bg-white shadow-2xl border-l border-stone-200">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-stone-150 flex items-center justify-between">
                <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center space-x-2">
                  <FiShoppingBag />
                  <span>Cart Selection</span>
                  {cart.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-[#E61E25] text-white text-3xs font-bold rounded-full">
                      {cartCount}
                    </span>
                  )}
                  {isLoadingCart && (
                    <div className="ml-2 w-3 h-3 border-2 border-stone-200 border-t-stone-850 rounded-full animate-spin" />
                  )}
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
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
                    Boutique Pickup
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
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-stone-200"
                                  style={{ backgroundColor: resolveColorHex(ci.item, ci.selectedColor) }}
                                />
                                {ci.selectedColor}
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
                    <span className="text-4xl">👗</span>
                    <div>
                      <h4 className="font-extrabold text-stone-850 text-sm uppercase tracking-wider">
                        Your selection is empty
                      </h4>
                      <p className="text-stone-400 text-2xs font-semibold mt-1">
                        Select from the collection to start styling.
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
                          Promo Discount {appliedCoupon?.discount_type === 'percentage' ? `(${appliedCoupon.discount_amount}%)` : ''}
                        </span>
                        <span>- US ${discount.toFixed(2)}</span>
                      </div>
                    )}
                    {orderMethod === 'delivery' && (
                      <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                        <span className="flex items-center gap-1">
                          <span>Shipping Fee</span>
                          {appliedCoupon?.coupon_type === 'free_delivery' && (
                            <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded-sm uppercase">Coupon</span>
                          )}
                        </span>
                        <span>{deliveryFee === 0 ? 'FREE' : `US $${deliveryFee.toFixed(2)}`}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm font-black text-stone-900 border-t border-stone-200/60 pt-3">
                    <span>Styling Budget</span>
                    <span className="text-base font-black">US ${total.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      if (onNavigate) {
                        const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
                        onNavigate(FASHION_ROUTES.getCheckout(ownerUserId, storeSlug));
                      }
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
      </div>

      {/* Product Detail Modal */}
      {popupProductId && (
        <>
          {popupProduct ? (
            <PopupDetailProduct
              product={popupProduct}
              addToCart={addToCart}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              storeName={storeName}
              stores={stores}
              user={user}
              appliedCoupon={appliedCoupon}
              applyCoupon={handleApplyCoupon}
              removeCoupon={handleRemoveCoupon}
              coupons={coupons}
              onNavigate={onNavigate}
              onClose={() => {
                setPopupProductId(null);
              }}
            />
          ) : (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-2xs">
              <div
                className="fixed inset-0"
                onClick={() => {
                  setPopupProductId(null);
                }}
              />
              <div className="bg-white p-8 rounded-[4px] shadow-2xl max-w-sm w-full text-center space-y-4 relative animate-fade-in z-10">
                <button
                  onClick={() => {
                    setPopupProductId(null);
                  }}
                  className="absolute top-4 right-4 text-stone-500 hover:text-stone-900 border-none bg-transparent cursor-pointer text-sm"
                >
                  ✕
                </button>
                {popupLoading ? (
                  <>
                    <div className="animate-spin h-9 w-9 border-4 border-stone-900 border-t-transparent rounded-full mx-auto" />
                    <p className="text-stone-600 text-xs font-bold uppercase tracking-widest">
                      Loading item details...
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl">🔍</span>
                    <div>
                      <h4 className="font-extrabold text-stone-850 text-sm uppercase tracking-wider">
                        Product not found
                      </h4>
                      <p className="text-stone-400 text-2xs font-semibold mt-1">
                        We couldn't retrieve this styling piece from the runway.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Scroll to Top Button */}
      {/* <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-24 right-6 z-45 flex items-center justify-center w-14 h-14 bg-white hover:bg-stone-100 text-stone-900 rounded-[7px] border border-stone-200 shadow-2xl cursor-pointer focus:outline-none transition-all duration-300 ${showScrollTop
          ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
          : 'translate-y-16 opacity-0 scale-75 pointer-events-none'
          }`}
        style={{
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
        }}
      >
        <FiChevronUp className="w-6 h-6" />
      </button> */}

      {/* Floating Add to Cart Count Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className={`fixed bottom-6 right-6 z-45 flex items-center justify-center w-14 h-14 bg-stone-900 hover:bg-[#E61E25] text-white rounded-[7px] shadow-2xl cursor-pointer border border-stone-850 focus:outline-none transition-all duration-300 ${showFloatingCart && cart.reduce((sum, ci) => sum + ci.qty, 0) > 0
          ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
          : 'translate-y-16 opacity-0 scale-75 pointer-events-none'
          }`}
        style={{
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
        }}
      >
        <FiShoppingBag className="w-6 h-6 transition-transform duration-300" />
        {cart.reduce((sum, ci) => sum + ci.qty, 0) > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 bg-[#E61E25] text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-md animate-cart-pop"
            key={cart.reduce((sum, ci) => sum + ci.qty, 0)}
          >
            {cart.reduce((sum, ci) => sum + ci.qty, 0)}
          </span>
        )}
      </button>

      {/* Vouchers / Coupon Modal Drawer */}
      <ModelCoupon
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        coupons={coupons}
        onApplyCoupon={handleApplyCoupon}
        appliedCoupon={appliedCoupon}
        subtotal={subtotal}
        isLoggedIn={!!user}
        copiedCode={copiedCouponCode}
        onCopyCode={handleCopyCouponCode}
      />


      {/* Floating Back to Top Scroll Indicator */}
      <DotTechSc />
    </div>
  );
};
