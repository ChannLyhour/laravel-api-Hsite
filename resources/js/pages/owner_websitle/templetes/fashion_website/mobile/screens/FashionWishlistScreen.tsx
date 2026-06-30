import React from 'react';
import { FiHeart, FiStar, FiShoppingBag, FiTrash2 } from 'react-icons/fi';
import type { Root2 } from '@/api/owner/categories';

interface FashionWishlistScreenProps {
  isDarkTheme: boolean;
  wishlist: Record<string, boolean>;
  handleToggleWishlist: (id: string, name: string) => void;
  handleOpenDetail: (product: Root2) => void;
  getProductImage: (product: Root2) => string;
  allProducts: Root2[];
}

export const FashionWishlistScreen: React.FC<FashionWishlistScreenProps> = ({
  isDarkTheme,
  wishlist,
  handleToggleWishlist,
  handleOpenDetail,
  getProductImage,
  allProducts,
}) => {
  // Filter all items that are in wishlist
  const favoritedItems = allProducts.filter(item => !!wishlist[String(item.id)]);

  return (
    <div className="p-4 space-y-6 flex-grow flex flex-col pb-20 animate-fade-in overflow-hidden">
      <h2 className={`text-base font-serif tracking-widest uppercase flex items-center space-x-2 shrink-0 ${isDarkTheme ? 'text-white' : 'text-stone-900'}`}>
        <FiHeart className="w-4 h-4 shrink-0 text-rose-500 fill-current" />
        <span>My Wishlist ({favoritedItems.length})</span>
      </h2>

      {favoritedItems.length > 0 ? (
        <div className="flex-grow overflow-y-auto pb-4 scrollbar-none">
          <div className="grid grid-cols-2 gap-4">
            {favoritedItems.map((item) => {
              const basePrice = parseFloat(item.price);
              const compareAt = item.compare_at_price
                ? parseFloat(item.compare_at_price)
                : item.id % 2 !== 0 ? basePrice * 1.3 : null;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className={`rounded-[6px] overflow-hidden flex flex-col justify-between border cursor-pointer group transition-all duration-300 relative ${
                    isDarkTheme
                      ? 'bg-stone-900/40 border-stone-850 hover:border-stone-750'
                      : 'bg-white border-stone-150/70 hover:border-stone-200 shadow-3xs'
                  }`}
                >
                  {/* Remove wishlist button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleWishlist(String(item.id), item.name);
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full z-10 bg-rose-50 hover:bg-rose-100 text-rose-500 shadow-3xs cursor-pointer"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* 3:4 Portrait image */}
                  <div className="aspect-[3/4] w-full overflow-hidden bg-stone-100/50 shrink-0">
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    />
                  </div>

                  {/* Descriptions */}
                  <div className="p-3 flex-grow flex flex-col justify-between space-y-2">
                    <div className="space-y-0.5">
                      <h4 className={`text-[11px] font-semibold line-clamp-1 group-hover:text-stone-500 transition-colors ${
                        isDarkTheme ? 'text-stone-200' : 'text-stone-800'
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
                        <FiStar className="w-3.5 h-3.5 fill-current" />
                        <span className="text-stone-400 ml-0.5">4.8</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item);
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer bg-stone-950 dark:bg-stone-100 dark:text-stone-900 hover:opacity-90`}
                      >
                        <FiShoppingBag className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-24 space-y-3 flex-grow flex flex-col justify-center items-center">
          <FiHeart className="text-stone-400 w-12 h-12 stroke-[1.25]" />
          <div>
            <h4 className={`text-sm font-serif uppercase tracking-widest ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>Your Wishlist is Empty</h4>
            <p className="text-stone-400 text-[10px] font-semibold mt-1">Bookmark garments by tapping the heart icon.</p>
          </div>
        </div>
      )}
    </div>
  );
};
