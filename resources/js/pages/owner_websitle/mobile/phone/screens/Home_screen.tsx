import React from 'react';
import { FiMapPin, FiSearch, FiTrendingUp, FiHeart, FiStar, FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import type { Root2 } from '@/api/owner/categories';

interface HomeScreenProps {
  isDarkTheme: boolean;
  activeTheme: {
    primaryBg: string;
    primaryText: string;
    primaryHover: string;
    shadowClass: string;
  };
  settings: any;
  storeName: string;
  onToggleDesktop?: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  categories: any[];
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  filteredProducts: Root2[];
  wishlist: number[];
  handleToggleWishlist: (e: React.MouseEvent, id: number) => void;
  handleOpenDetail: (product: Root2) => void;
  handleAddToCart: (product: Root2) => void;
  getProductImage: (product: Root2) => string;
  locale: 'en' | 'km';
  getTranslation: (item: Root2, currentLocale?: 'en' | 'km') => { name: string; description: string };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  isDarkTheme,
  activeTheme,
  settings,
  storeName,
  onToggleDesktop,
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  filteredProducts,
  wishlist,
  handleToggleWishlist,
  handleOpenDetail,
  handleAddToCart,
  getProductImage,
  locale,
  getTranslation,
}) => {
  return (
    <div className="p-4 space-y-5 flex-grow flex flex-col">

      {/* App Brand Header Bar */}
      <div className={`sticky top-0 z-30 flex justify-between items-center shrink-0 -mx-4 px-4 -mt-4 pt-4 pb-3 border-b backdrop-blur-md transition-colors ${
        isDarkTheme
          ? 'bg-[#0E1322]/90 border-slate-800/80 text-white'
          : 'bg-white/90 border-slate-100 text-slate-900 shadow-3xs'
      }`}>
        <div className="space-y-0.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Delicious Delivery</span>
          <h1 className={`text-xl font-black flex items-center space-x-1.5 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            <FiMapPin className="text-emerald-500 w-4 h-4 shrink-0" />
            <span className="truncate max-w-[145px]">{settings?.store_name || storeName || 'BiteFlow Store'}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* View Website Button */}
          {onToggleDesktop && (
            <button
              onClick={onToggleDesktop}
              className={`px-3 py-1.5 rounded-[7px] border text-[9px] font-black uppercase tracking-wider transition-all flex items-center space-x-1 cursor-pointer ${isDarkTheme
                  ? 'border-slate-800 bg-slate-900/60 text-slate-350 hover:bg-slate-850 hover:text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-655 hover:bg-slate-100 hover:text-slate-900 shadow-3xs'
                }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>View Website</span>
            </button>
          )}

          {/* Profile Circle Icon */}
          <div className={`w-8.5 h-8.5 rounded-[7px] border flex items-center justify-center font-black shadow-inner text-xs ${isDarkTheme ? 'border-slate-800 bg-[#111827] text-cyan-400' : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}>
            CL
          </div>
        </div>
      </div>

      {/* Search bar with filter tuning icon inside input row */}
      <div className="relative flex items-center gap-2 shrink-0">
        <div className="relative flex-grow">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search gourmet burgers, pizzas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 text-xs font-semibold rounded-[7px] focus:outline-none transition-all ${isDarkTheme
                ? 'bg-slate-900 focus:bg-slate-955 border border-slate-850 text-white placeholder-slate-500 focus:ring-1 focus:ring-slate-700'
                : 'bg-slate-50 focus:bg-white border border-slate-100 text-slate-808 placeholder-slate-400 focus:ring-1 focus:ring-slate-200 shadow-sm'
              }`}
          />
        </div>

        <button
          type="button"
          onClick={() => toast.success('Filter criteria unlocked!')}
          className={`p-3 rounded-[7px] flex items-center justify-center border transition-all cursor-pointer ${isDarkTheme
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-400'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700 shadow-3xs'
            }`}
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Premium Discount Banner mimicking screenshot advertisement */}
      <div className={`p-4 rounded-[7px] relative overflow-hidden flex items-center justify-between shrink-0 shadow-sm border ${isDarkTheme
          ? 'bg-gradient-to-br from-purple-900 via-indigo-950 to-[#0e1322] border-purple-800/40 text-white shadow-purple-950/20'
          : 'bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 border-rose-450/20 text-white shadow-orange-500/10'
        }`}>
        {/* Visual backdrops */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-y-4 translate-x-4" />
        <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-black/10 rounded-full blur-lg" />

        <div className="space-y-1.5 max-w-[65%] z-10 relative">
          <span className="inline-block px-2.5 py-0.5 rounded-[7px] bg-white/20 text-[8px] font-black uppercase tracking-wider leading-none backdrop-blur-xs">
            Flash Sale
          </span>
          <h4 className="text-sm font-black tracking-tight leading-tight">40% Off on your first order!</h4>
          <p className="text-[9px] text-white/80 font-bold">Automatic gourmet discount applied.</p>
          <button
            onClick={() => toast.success('Discount automatically applied at checkout!')}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-[7px] text-[9px] font-black mt-2.5 cursor-pointer hover:bg-black active:scale-95 transition-all shadow-md inline-block uppercase tracking-wider"
          >
            Shop Now
          </button>
        </div>

        {/* Floating Emoji Graphic */}
        <div className="text-7xl select-none absolute -right-1 bottom-0 translate-y-3 opacity-30 animate-bounce duration-3000 z-0">
          🍕
        </div>
      </div>

      {/* Elegant Category vertical/square tiles swiper (matching reference picture) */}
      <div className="space-y-2.5 shrink-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Categories</span>
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 select-none">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setSelectedCategory(c.name)}
                className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer group focus:outline-none"
              >
                {/* Elegant vertical square categories container */}
                <div className={`w-14 h-14 rounded-[7px] border flex items-center justify-center text-xl transition-all duration-300 ${isSelected
                    ? `${activeTheme.primaryBg} border-transparent text-white shadow-md scale-105`
                    : isDarkTheme
                      ? 'bg-slate-900/80 border-slate-800 text-slate-350 hover:border-slate-700 hover:scale-102'
                      : 'bg-white border-slate-150/70 text-slate-650 shadow-3xs hover:border-slate-200 hover:scale-102'
                  }`}>
                  <span className="text-xl transition-transform group-hover:scale-110 duration-200">{c.icon || '🍔'}</span>
                </div>

                {/* category sub-label */}
                <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${isSelected
                    ? activeTheme.primaryText
                    : isDarkTheme ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-850'
                  }`}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products grid swiper */}
      <div className="space-y-3.5 flex-grow overflow-y-auto scrollbar-none">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Top Delicacies</span>
          <span className={`text-[9px] font-black text-slate-400 flex items-center space-x-1 ${activeTheme.primaryText}`}>
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>POPULAR</span>
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 pb-24">
            {filteredProducts.map((item) => {
              const basePrice = parseFloat(item.price);
              const isDiscounted = item.id % 2 !== 0;
              const originalPrice = isDiscounted ? (basePrice * 1.25).toFixed(2) : null;
              const { name: itemDisplayName } = getTranslation(item, locale);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className={`rounded-[7px] p-3 flex flex-col justify-between border cursor-pointer group transition-all duration-300 relative ${isDarkTheme
                      ? 'bg-slate-900/50 border-slate-800 hover:border-slate-750'
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-3xs hover:shadow-2xs'
                    }`}
                >
                  {/* Heart wishlist absolute button */}
                  <button
                    onClick={(e) => handleToggleWishlist(e, item.id)}
                    className={`absolute top-2 right-2 p-1.5 rounded-[7px] z-10 transition-colors cursor-pointer ${wishlist.includes(item.id)
                        ? 'bg-rose-50 text-rose-500 shadow-3xs'
                        : 'bg-black/30 text-white backdrop-blur-xs hover:bg-black/40'
                      }`}
                  >
                    <FiHeart className={`w-3.5 h-3.5 ${wishlist.includes(item.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Image Box */}
                  <div className="h-28 w-full overflow-hidden rounded-[7px] bg-slate-50 border border-slate-100/10 shrink-0">
                    <img
                      src={getProductImage(item)}
                      alt={itemDisplayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Detail details */}
                  <div className="space-y-1.5 pt-2 flex-grow flex flex-col justify-between">
                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-black line-clamp-1 group-hover:${activeTheme.primaryText} transition-colors ${isDarkTheme ? 'text-white' : 'text-slate-808'
                        }`}>
                        {itemDisplayName}
                      </h4>

                      {/* Price tags */}
                      <div className="flex items-baseline space-x-1">
                        <span className={`text-xs font-black ${activeTheme.primaryText}`}>${basePrice.toFixed(2)}</span>
                        {originalPrice && (
                          <span className="text-[9px] text-slate-400 line-through font-bold">${originalPrice}</span>
                        )}
                      </div>
                    </div>

                    {/* bottom row button */}
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100/10 mt-1">
                      <div className="flex items-center text-amber-400">
                        <FiStar className="w-3 h-3 fill-current" />
                        <span className="text-[9px] font-black text-slate-400 ml-0.5">4.9</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        className={`w-6 h-6 rounded-[7px] flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer ${activeTheme.primaryBg}`}
                      >
                        <FiPlus className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 space-y-2">
            <span className="text-2xl">🥗</span>
            <p className="text-slate-400 text-xs font-bold">No delicacies match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
