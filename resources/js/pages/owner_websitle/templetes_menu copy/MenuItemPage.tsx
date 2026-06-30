import React, { useEffect, useState, useMemo } from 'react';
import { categoriesService } from '@/api/owner/categories';
import type { Root2 } from '@/api/owner/categories';
import { ApiError } from '@/api/client';
import {
  FiInfo
} from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';

import type { SettingResponse } from '@/api/setting';
import { themes } from '@/pages/owner_manage/templete_website/themes';
import { ProductBagdeGrid } from './components/helpers/ProductBagdeGrid';
import { mapToUIItem } from './utils/priceUtils';
import { getLightTheme } from './utils/themeHelper';

interface MenuItemPageProps {
  ownerUserId?: number | string;
  profile?: any;
  onNavigate?: (to: string) => void;
  storeName?: string;
  locale?: 'en' | 'km';
  settings?: SettingResponse['settings'] | null;
  addToCart?: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
}

export const MenuItemPage: React.FC<MenuItemPageProps> = ({ ownerUserId, storeName = '', settings, addToCart, onNavigate }) => {
  const activeTheme = getLightTheme(themes[settings?.website_theme || 'default'] || themes.default);
  const [topSellingItems, setTopSellingItems] = useState<Root2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load top-selling items from the database
  useEffect(() => {
    const fetchTopSelling = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch top 8 best-selling menu items to construct our grids
        const topSellingData = await categoriesService.getTopSelling(8, ownerUserId);
        setTopSellingItems(topSellingData || []);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.details.message);
        } else {
          setError('Failed to connect to backend server. Please verify your FastAPI API is running.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTopSelling();
  }, [ownerUserId]);

  // Map items to UI models
  const mappedItems = useMemo(() => {
    return topSellingItems.map(mapToUIItem);
  }, [topSellingItems]);

  return (
    <section id="menu" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-kuntomruy">

      <div className="space-y-10 max-w-5xl mx-auto">

          {/* Header */}

          {/* Loading Spinner */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fade-in">
              <svg className={`animate-spin h-10 w-10 ${activeTheme.primaryText}`} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-slate-400 font-bold text-xs">Loading items from database...</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-[5px] flex items-start space-x-3 text-rose-800 text-xs animate-slide-up">
              <FiInfo className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="font-semibold leading-relaxed">
                {error}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && topSellingItems.length === 0 && (
            <div className="text-center py-16 space-y-2 bg-slate-50 rounded-[5px] border border-slate-100 animate-fade-in">
              <span className="text-4xl block">🥗</span>
              <h4 className="font-extrabold text-slate-800">No dishes available at this time</h4>
              <p className="text-slate-400 text-xs font-medium">Please add items through your admin panel dashboard.</p>
            </div>
          )}

          {/* Badge Grids & Sliders */}
          {!loading && !error && mappedItems.length > 0 && (
            <ProductBagdeGrid
              items={mappedItems}
              ownerUserId={ownerUserId}
              stores={settings as any}
              storeName={storeName}
              addToCart={(itm, qty, size, color) => addToCart?.(itm, qty, size, color)}
              onNavigate={onNavigate}
            />
          )}

      </div>

    </section>
  );
};

