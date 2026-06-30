import React from 'react';
import { FiSearch, FiHeart, FiStar, FiShoppingBag, FiArrowRight, FiSliders, FiUser, FiMonitor } from 'react-icons/fi';
import type { Root2 } from '@/api/owner/categories';
import type { BannerRow } from '@/api/owner/banners';
import { resolveImageUrl } from '../../utils/imageUtils';

interface FashionHomeScreenProps {
  isDarkTheme: boolean;
  settings: any;
  storeName: string;
  onToggleDesktop?: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  categories: any[];
  activeCategoryHash: string;
  setActiveCategoryHash: (hash: string) => void;
  filteredProducts: Root2[];
  wishlist: Record<string, boolean>;
  handleToggleWishlist: (id: string, name: string) => void;
  handleOpenDetail: (product: Root2) => void;
  handleAddToCart: (product: Root2, qty: number, size: string, color: string) => void;
  getProductImage: (product: Root2) => string;
  locale: 'en' | 'km';
  profile?: any;
  onOpenProfile?: () => void;
  banners?: BannerRow[];
}

export const FashionHomeScreen: React.FC<FashionHomeScreenProps> = ({
  isDarkTheme,
  settings,
  storeName,
  onToggleDesktop,
  searchQuery,
  setSearchQuery,
  categories,
  activeCategoryHash,
  setActiveCategoryHash,
  filteredProducts,
  wishlist,
  handleToggleWishlist,
  handleOpenDetail,
  handleAddToCart,
  getProductImage,
  profile,
  onOpenProfile,
  banners = [],
}) => {
  // Static placeholder banner details
  const bannerImage = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="flex flex-col flex-grow p-4 space-y-6">
      {/* ── Brand Header Bar ── */}
      <div className={`sticky top-0 z-30 flex items-center justify-between shrink-0 -mx-4 px-1.5 -mt-4 pt-4 pb-3 border-b backdrop-blur-md transition-colors ${isDarkTheme
        ? 'bg-stone-950/90 border-stone-900 text-white'
        : 'bg-white/90 border-stone-100 text-stone-900 shadow-3xs'
        }`}>
        <div className="shrink-0 mr-3">
          <h1 className={`text-base font-serif tracking-widest uppercase ${isDarkTheme ? 'text-white' : 'text-stone-900'}`}>
            {settings?.store_name || storeName || 'AURA'}
          </h1>
        </div>

        {/* ── Search and Filter Input Row (Integrated) ── */}
        <div className="relative flex items-center gap-2 flex-grow max-w-[50%] sm:max-w-none">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-[10px] rounded-[4px] focus:outline-none transition-all ${isDarkTheme
                ? 'bg-stone-900 focus:bg-stone-950 border border-stone-850 text-white placeholder-stone-500'
                : 'bg-stone-55 focus:bg-white border border-stone-100 text-stone-800 placeholder-stone-400'
                }`}
            />
          </div>
          <button
            type="button"
            className={`p-1.5 rounded-[4px] flex items-center justify-center border transition-all cursor-pointer ${isDarkTheme
              ? 'bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-300'
              : 'bg-stone-55 hover:bg-stone-100 border-stone-200/50 text-stone-700 shadow-3xs'
              }`}
          >
            <FiSliders className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 ml-3">
          {onToggleDesktop && (
            <button
              onClick={onToggleDesktop}
              className={`p-1.5 rounded-[4px] border text-[9px] font-black uppercase tracking-wider transition-all flex items-center space-x-1 cursor-pointer ${isDarkTheme
                ? 'border-stone-800 bg-stone-900/60 text-stone-300 hover:bg-stone-855 hover:text-white'
                : 'border-stone-200 bg-stone-55 text-stone-600 hover:bg-stone-100 hover:text-stone-900 shadow-3xs'
                }`}
            >
              <FiMonitor className="w-3 h-3" />
              {/* <span>View Desktop</span> */}
            </button>
          )}
          <button
            onClick={() => {
              if (profile) {
                onOpenProfile?.();
              } else {
                window.dispatchEvent(new CustomEvent('request_login'));
              }
            }}
            className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[10px] cursor-pointer overflow-hidden transition-all hover:scale-105 active:scale-95 ${isDarkTheme ? 'border-stone-800 bg-stone-900 text-stone-200' : 'border-stone-200 bg-stone-50 text-stone-700'
              }`}
          >
            {profile ? (
              profile.image_url || profile.image ? (
                <img
                  src={resolveImageUrl(profile.image_url || profile.image)}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile.name?.charAt(0).toUpperCase()}</span>
              )
            ) : (
              <FiUser className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>



      {/* ── Editorial Campaign Banner ── */}
      {banners && banners.length > 0 ? (
        <div className="relative rounded-[5px] overflow-hidden h-[160px] shrink-0 group border border-stone-200/5 shadow-sm">
          <img
            src={resolveImageUrl(banners[0].image)}
            alt={banners[0].title || "Campaign Banner"}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/35 flex flex-col justify-end p-4 text-white">
            <span className="text-[7px] font-black uppercase tracking-[0.25em] text-stone-200 leading-none">LATEST COLLECTION</span>
            <h2 className="text-base font-serif tracking-wide leading-tight mt-1 mb-2">{banners[0].title || "Summer Essentials"}</h2>
            {banners[0].description && (
              <p className="text-[9px] text-stone-200/90 max-w-[75%] font-medium line-clamp-2">{banners[0].description}</p>
            )}
            <div className="mt-3 flex items-center text-[9px] font-black tracking-widest uppercase space-x-1 hover:underline cursor-pointer">
              <span>Explore Collection</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-[6px] overflow-hidden h-[160px] shrink-0 group border border-stone-200/5 shadow-sm">
          <img
            src={bannerImage}
            alt="Summer Campaign"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-4 text-white">
            <span className="text-[7px] font-black uppercase tracking-[0.25em] text-stone-200 leading-none">NEW EDITORIAL</span>
            <h2 className="text-base font-serif tracking-wide leading-tight mt-1 mb-2">Summer Essentials 2026</h2>
            <p className="text-[9px] text-stone-200/90 max-w-[75%] font-medium">Explore hand-tailored linen matching sets and accessories.</p>
            <div className="mt-3 flex items-center text-[9px] font-black tracking-widest uppercase space-x-1 hover:underline cursor-pointer">
              <span>Shop Campaign</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* ── Horizontal Scrolling Categories Bar ── */}
      <div className={`sticky top-[50px] z-20 shrink-0 -mx-4 pl-4 pr-4 h-[70px] border-b backdrop-blur-md transition-all duration-300 flex items-center justify-between ${isDarkTheme
        ? 'bg-stone-950/90 border-stone-900 text-white'
        : 'bg-white/90 border-stone-100 text-stone-900 shadow-sm'
        }`}>
        <div className="items-center space-x-3 w-full overflow-hidden">
          <span className="text-[10px] font-bold block shrink-0 px-1 mt-2">Categories</span>
          <div className="flex-grow flex space-x-2 overflow-x-auto pb-1 scrollbar-none select-none">
            <button
              onClick={() => setActiveCategoryHash('')}
              className={`px-4 py-2 rounded-[5px] text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${activeCategoryHash === ''
                ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                : isDarkTheme
                  ? 'bg-stone-900/60 border-stone-850 text-stone-400 hover:text-white'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
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
                  className={`px-4 py-2 rounded-[5px] text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${isSelected
                    ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                    : isDarkTheme
                      ? 'bg-stone-900/60 border-stone-850 text-stone-400 hover:text-white'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Portrait Product Grid ── */}
      <div className="space-y-3 flex-grow overflow-y-auto scrollbar-none">
        <div className="flex justify-between items-center pb-1">
          <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block">CATALOG COLECTION</span>
          <span className="text-[8px] font-black text-stone-400 tracking-wider">
            {filteredProducts.length} ITEMS
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 pb-20">
            {filteredProducts.map((item) => {
              const basePrice = parseFloat(item.price);
              // Check if original compare_at_price exists, otherwise mock one if id is odd
              const compareAt = item.compare_at_price
                ? parseFloat(item.compare_at_price)
                : item.id % 2 !== 0 ? basePrice * 1.3 : null;

              const isFav = !!wishlist[String(item.id)];

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className={`rounded-[6px] overflow-hidden flex flex-col justify-between border cursor-pointer group transition-all duration-300 relative ${isDarkTheme
                    ? 'bg-stone-900/40'
                    : 'bg-white shadow-3xs'
                    }`}
                >
                  {/* Heart absolute toggle badge */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleWishlist(String(item.id), item.name);
                    }}
                    className={`absolute top-2.5 right-2.5 p-1.5 rounded-full z-10 transition-all cursor-pointer ${isFav
                      ? 'bg-rose-50 text-rose-500 shadow-3xs'
                      : 'bg-black/35 text-stone-200 backdrop-blur-xs hover:bg-black/45'
                      }`}
                  >
                    <FiHeart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  {/* 3:4 Portrait image container */}
                  <div className="h-[200px] w-full overflow-hidden bg-stone-100/50 shrink-0 relative">
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    />
                    {compareAt && (
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-[2px] bg-rose-500 text-white text-[7px] font-black uppercase tracking-wider leading-none shadow-xs">
                        SALE
                      </span>
                    )}
                  </div>

                  {/* Card Description Panel */}
                  <div className="p-3 flex-grow flex flex-col justify-between space-y-2">
                    <div className="space-y-0.5">
                      <h4 className={`text-[11px] font-semibold line-clamp-1 group-hover:text-stone-500 transition-colors ${isDarkTheme ? 'text-stone-200' : 'text-stone-800'
                        }`}>
                        {item.name}
                      </h4>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-[11px] font-bold text-stone-900 dark:text-stone-100">
                          ${basePrice.toFixed(2)}
                        </span>
                        {compareAt && (
                          <span className="text-[9px] text-stone-400 line-through">
                            ${compareAt.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-stone-100/10 mt-1">
                      <div className="flex items-center text-amber-500 text-[9px] font-black">
                        <FiStar className="w-3 h-3 fill-current" />
                        <span className="text-stone-400 ml-0.5">4.8</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item, 1, '', '');
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:opacity-90`}
                      >
                        <FiShoppingBag className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 space-y-2 bg-stone-50 dark:bg-stone-900/20 rounded-[6px] border border-dashed border-stone-200 dark:border-stone-850">
            <span className="text-2xl">🧥</span>
            <p className="text-stone-400 text-xs font-bold">No garments match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
