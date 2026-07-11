import React, { useEffect, useState } from 'react';
import { authService } from '@/api/auth';
import type { UserResponse } from '@/api/auth';
import { ApiError } from '@/api/client';
import { NavbarPage } from './NavbarPage';
import { MenuItemPage } from './MenuItemPage';
import { CheckoutPage } from './components/CheckoutPage';
import { useCart } from './hooks/useCart';
import { ModelCartSelection } from './components/helpers/ModelCartSelection';
import { ProductDetailBottomCenterPage } from './components/Use_Defult_Product/Product_Detail_buttom_center_page';
import { menuItemsService } from '@/api/owner/categories';
import { CafeShopPage } from '../templetes/cafeShop_website/CafeShopPage';
import { ElectronicPage } from '../templetes/Electronic_website/ElectronicPage';
import { FashionPage } from '../templetes/fashion_website/FashionPage';
import { FashionPage as FashionPageGeneral } from '../templetes/fashion_website_general/FashionPage';
import type { SettingResponse } from '@/api/setting';
import type { StoreRow } from '@/api/owner/stores';
import { themes } from '@/pages/owner_manage/templete_website/themes';
import { PhoneAppView } from '../mobile/phone/PhoneAppView';
import { TabletAppView } from '../mobile/tablet/TabletAppView';
import { storeBrandingService } from '@/api/created_by/getFaviconById';
import { getLightTheme } from './utils/themeHelper';
import { useOwnerURL } from '@/app/OwnerURL';
import { PageRenderer } from './components/PageRenderer';
import { WishlistPage } from './components/wishlistPage';
import { FooterPage } from './components/footerPage';
import { ProfileSetting } from '../templetes/fashion_website/components/info/profilesetting';


interface HomePageProps {
  token: string | null;
  settings: SettingResponse['settings'] | null;
  /** Authoritative store row from the stores table (has store_name, logo_url, etc.) */
  storeInfo?: StoreRow | null;
  currentPath: string;
  onNavigate: (to: string) => void;
  onNavigateLogin: () => void;
  onLogout: () => void;
  ownerUserId?: number | string;
  onOwnerChange: (id: number) => void;
  /** Store name from the ?store= URL param for owner-specific storefronts */
  storeName?: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  token,
  settings,
  storeInfo,
  currentPath,
  onNavigate,
  onNavigateLogin,
  onLogout,
  ownerUserId,
  onOwnerChange,
  storeName = '',
}) => {
  console.log('HomePageOnline Render Props:', { settingsTheme: settings?.website_theme, storeInfoTheme: storeInfo?.website_theme, currentPath });
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [locale, setLocale] = useState<'en' | 'km'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('store_locale');
      if (saved === 'km' || saved === 'en') return saved;
    }
    return 'en';
  });

  const handleLocaleChange = (newLocale: 'en' | 'km') => {
    setLocale(newLocale);
    localStorage.setItem('store_locale', newLocale);
  };

  const {
    cart,
    subtotal,
    deliveryFee,
    discount,
    addToCart,
    clearCart,
    total,
    orderMethod,
    setOrderMethod,
    updateQty,
    removeFromCart,
    cartCount,
  } = useCart(settings, profile?.user);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [dragProductId, setDragProductId] = useState<string | null>(null);
  const [dragProduct, setDragProduct] = useState<any>(null);
  const [dragLoading, setDragLoading] = useState(false);

  // Dynamically update favicon for this specific store
  useEffect(() => {
    if (ownerUserId) {
      storeBrandingService.getFaviconByOwnerId(ownerUserId)
        .then(url => {
          if (url) storeBrandingService.applyFavicon(`${url}?v=${Date.now()}`);
        })
        .catch(err => console.warn('HomePage: Failed to load favicon', err));
    }
  }, [ownerUserId]);

  useEffect(() => {
    const handleOpenPopup = (e: Event) => {
      const productId = (e as CustomEvent).detail?.productId;
      if (productId) setDragProductId(productId);
    };

    window.addEventListener('open_product_popup', handleOpenPopup);
    return () => {
      window.removeEventListener('open_product_popup', handleOpenPopup);
    };
  }, []);

  // Fetch popup product when dragProductId changes
  useEffect(() => {
    if (!dragProductId) {
      setDragProduct(null);
      return;
    }
    setDragLoading(true);
    menuItemsService.getMenuItem(Number(dragProductId))
      .then(res => {
        if (res) {
          setDragProduct(res);
        }
      })
      .catch(err => console.warn('Failed to fetch popup product', err))
      .finally(() => setDragLoading(false));
  }, [dragProductId]);

  // Load profile when authenticated
  useEffect(() => {
    let active = true;

    if (!token) {
      if (active) setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await authService.getCurrentUser(token);
        if (active) setProfile(data);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 401 && active) {
            onLogout();
          }
        }
      }
    };

    fetchProfile();
    return () => { active = false; };
  }, [token, onLogout]);

  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [isTabletScreen, setIsTabletScreen] = useState(false);
  const [forceDesktop, setForceDesktop] = useState(() => {
    return sessionStorage.getItem('force_desktop_view') === 'true';
  });

  const handleToggleForceDesktop = (force: boolean) => {
    setForceDesktop(force);
    if (force) {
      sessionStorage.setItem('force_desktop_view', 'true');
    } else {
      sessionStorage.removeItem('force_desktop_view');
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
      setIsTabletScreen(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMenuView = currentPath.endsWith('/menu');
  const isCheckoutView = currentPath.endsWith('/checkout');
  const isWishlistView = currentPath.endsWith('/wishlist');
  const isProfileView = currentPath.endsWith('/profile');

  // Enforce customer auth on /profile
  useEffect(() => {
    if (isProfileView && !token) {
      onNavigateLogin();
      onNavigate(buildStoreLink('/'));
    }
  }, [isProfileView, token]);

  const activeTheme = getLightTheme(themes[settings?.website_theme || 'default'] || themes.default);
  const { buildLink: buildStoreLink } = useOwnerURL(
    ownerUserId || storeInfo?.created_by || storeInfo?.owner_id || storeInfo?.hashid || (settings as any)?.created_by || (settings as any)?.owner_id || (settings as any)?.hashid,
    storeName || settings?.store_name
  );

  // Intercept and render dynamic smart phone native e-commerce app layout
  // if (isMobileScreen && !forceDesktop) {
  //   return (
  //     <PhoneAppView
  //       ownerUserId={ownerUserId}
  //       storeName={storeName || settings?.store_name}
  //       settings={settings}
  //       locale={locale}
  //       token={token}
  //       profile={profile}
  //       onToggleDesktop={() => handleToggleForceDesktop(true)}
  //       onLogout={onLogout}
  //     />
  //   );
  // }

  // Intercept and render dynamic tablet split-screen e-commerce ordering dashboard
  // if (isTabletScreen && !forceDesktop) {
  //   return (
  //     <TabletAppView
  //       ownerUserId={ownerUserId}
  //       storeName={storeName || settings?.store_name}
  //       settings={settings}
  //       locale={locale}
  //       token={token}
  //       profile={profile}
  //       onToggleDesktop={() => handleToggleForceDesktop(true)}
  //     />
  //   );
  // }

  // Intercept and render dynamic niche template builder storefronts
  const theme = storeInfo?.website_theme || settings?.website_theme;
  if (theme === 'custom_builder') {
    return (
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${activeTheme.bgClass} animate-fade-in`}>
        <NavbarPage
          token={token}
          profile={profile}
          onNavigateLogin={onNavigateLogin}
          onLogout={onLogout}
          onNavigate={onNavigate}
          currentPath={currentPath}
          stores={settings}
          onOwnerChange={onOwnerChange}
          storeName={storeInfo?.store_name || storeName || settings?.store_name || ''}
          ownerUserId={ownerUserId}
          locale={locale}
          setLocale={handleLocaleChange}
          onCartClick={() => setIsCartOpen(true)}
        />

        {/* Main Custom Layout Content */}
        <main className="flex-grow pt-24 px-4">
          <PageRenderer
            ownerUserId={ownerUserId || storeInfo?.created_by || storeInfo?.owner_id || storeInfo?.hashid || (settings as any)?.created_by || (settings as any)?.owner_id}
            slug={currentPath && currentPath !== '/' ? currentPath.replace(/^\//, '') : 'home'}
            storeName={storeInfo?.store_name || storeName || settings?.store_name || ''}
            onNavigate={(to) => {
              if (to && !to.startsWith('http') && !to.startsWith('#') && !to.startsWith('mailto:') && !to.startsWith('tel:')) {
                onNavigate(buildStoreLink(to));
              } else {
                onNavigate(to);
              }
            }}
            addToCart={addToCart}
          />
        </main>
      </div>
    );
  }
  if (theme === 'cafe_shop') {
    return (
      <CafeShopPage
        ownerUserId={ownerUserId}
        profile={profile}
        onNavigate={onNavigate}
        storeName={storeName || settings?.store_name}
        locale={locale}
        settings={settings}
      />
    );
  }
  if (theme === 'electronic') {
    return (
      <ElectronicPage
        ownerUserId={ownerUserId}
        profile={profile}
        onNavigate={onNavigate}
        storeName={storeName || settings?.store_name}
        locale={locale}
        settings={settings}
      />
    );
  }
  if (theme === 'fashion' || theme === 'fashion_website') {
    return (
      <FashionPage
        ownerUserId={ownerUserId}
        profile={profile}
        onNavigate={onNavigate}
        storeName={storeInfo?.store_name || storeName || settings?.store_name}
        locale={locale}
        onChangeLanguage={handleLocaleChange}
        stores={(storeInfo ?? settings) as any}
        currentPath={currentPath}
      />
    );
  }
  if (theme === 'fashion_website_general') {
    return (
      <FashionPageGeneral
        ownerUserId={ownerUserId}
        profile={profile}
        onNavigate={onNavigate}
        storeName={storeInfo?.store_name || storeName || settings?.store_name}
        locale={locale}
        onChangeLanguage={handleLocaleChange}
        stores={(storeInfo ?? settings) as any}
        currentPath={currentPath}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${activeTheme.bgClass} animate-fade-in`}>
      {/* Dynamic Header/Navbar */}
      <NavbarPage
        token={token}
        profile={profile}
        onNavigateLogin={onNavigateLogin}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentPath={currentPath}
        stores={settings}
        onOwnerChange={onOwnerChange}
        storeName={storeName}
        ownerUserId={ownerUserId}
        locale={locale}
        setLocale={handleLocaleChange}
        onCartClick={() => setIsCartOpen(true)}
      />


      <main className="flex-grow">
        {isCheckoutView ? (
          <CheckoutPage
            cartItems={cart}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            discount={discount}
            stores={{ ...settings, ...storeInfo } as any}
            coupons={[]}
            ownerUserId={ownerUserId}
            onNavigate={onNavigate}
            clearCart={clearCart}
          />
        ) : isWishlistView ? (
          <WishlistPage
            ownerUserId={ownerUserId}
            storeName={storeName || settings?.store_name}
            stores={storeInfo as any}
            addToCart={addToCart}
            onNavigate={onNavigate}
          />
        ) : isMenuView ? (
          /* Dedicated Standalone Menu Page View (Not using section) */
          <div className="animate-fade-in">
            <MenuItemPage
              ownerUserId={ownerUserId}
              profile={profile}
              onNavigate={onNavigate}
              storeName={storeName || settings?.store_name || 'Food'}
              locale={locale}
              settings={settings}
              addToCart={addToCart}
            />
          </div>
        ) : isProfileView ? (
          /* Customer Profile & Orders View */
          profile?.user ? (
            <div className="animate-fade-in py-0 sm:py-6 flex justify-center items-start px-0 sm:px-4">
              <ProfileSetting
                user={profile.user}
                onClose={() => onNavigate(buildStoreLink('/'))}
                ownerUserId={ownerUserId}
                logout={onLogout}
                locale={locale}
                stores={{ ...settings, ...storeInfo }}
              />
            </div>
          ) : (
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#8C5A3C] border-t-transparent rounded-full" />
            </div>
          )
        ) : (
          /* Main Homepage Sections */
          <>


            {/* ========================================================================= */}
            {/* ── 2. FEATURED PRODUCTS SHOWCASE SECTION ───────────────────────────────── */}
            {/* ========================================================================= */}
            <div className={`border-t transition-all duration-300 ${activeTheme.cardBg} ${activeTheme.borderClass}`}>
              <MenuItemPage
                ownerUserId={ownerUserId}
                profile={profile}
                onNavigate={onNavigate}
                storeName={storeName || settings?.store_name || 'Food'}
                locale={locale}
                settings={settings}
                addToCart={addToCart}
              />
            </div>


          </>
        )}
      </main>
      <FooterPage stores={{ ...settings, ...storeInfo } as any} storeName={storeName || settings?.store_name} />

      {/* Floating segment button allowing user to switch back to premium mobile app preview viewports */}
      {forceDesktop && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in select-none">
          <button
            onClick={() => handleToggleForceDesktop(false)}
            className={`px-5 py-3.5 rounded-full shadow-2xl font-black text-xs text-white cursor-pointer transition-all active:scale-95 flex items-center space-x-2 border border-white/10 hover:opacity-95 ${activeTheme.primaryBg} ${activeTheme.shadowClass}`}
          >
            <span>📱 Switch to Mobile App Preview</span>
          </button>
        </div>
      )}

      {/* Cart Selection Drawer */}
      <ModelCartSelection
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        cartCount={cartCount}
        orderMethod={orderMethod}
        setOrderMethod={setOrderMethod}
        updateQty={updateQty}
        removeFromCart={removeFromCart}
        subtotal={subtotal}
        discount={discount}
        deliveryFee={deliveryFee}
        total={total}
        onNavigate={onNavigate}
        buildStoreLink={buildStoreLink}
      />

      {/* Product Detail Modal */}
      {dragProductId && (
        <>
          {dragProduct ? (
            <ProductDetailBottomCenterPage
              product={dragProduct}
              addToCart={addToCart}
              favorites={{}}
              toggleFavorite={() => { }}
              storeName={storeName || settings?.store_name}
              stores={settings}
              user={profile?.user}
              onClose={() => {
                setDragProductId(null);
              }}
              onNavigate={onNavigate}
              buildStoreLink={buildStoreLink}
            />
          ) : (
            !dragLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-2xs">
                <div
                  className="fixed inset-0"
                  onClick={() => {
                    setDragProductId(null);
                  }}
                />
                <div className="bg-white p-8 rounded-[20px] shadow-2xl max-w-sm w-full text-center space-y-4 relative animate-fade-in z-10">
                  <button
                    onClick={() => {
                      setDragProductId(null);
                    }}
                    className="absolute top-4 right-4 text-stone-500 hover:text-stone-900 border-none bg-transparent cursor-pointer text-sm"
                  >
                    ✕
                  </button>
                  <span className="text-4xl">🥗</span>
                  <div>
                    <h4 className="font-extrabold text-stone-850 text-sm uppercase tracking-wider">
                      Product not found
                    </h4>
                    <p className="text-stone-400 text-2xs font-semibold mt-1">
                      We couldn't retrieve this item from the kitchen.
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </>
      )}

    </div>
  );
};

