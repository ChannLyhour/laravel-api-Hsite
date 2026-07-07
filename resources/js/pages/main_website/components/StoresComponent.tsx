import React, { useEffect, useState } from 'react';
import { FiCoffee, FiStar, FiArrowRight, FiShoppingBag, FiAlertCircle } from 'react-icons/fi';
import { client, API_BASE_URL } from '@/api/client';
import { getAdminUsers } from '@/api/auth';
import type { AdminUser } from '@/api/auth';
import { useTranslation } from '../lang/i18n';

interface StoresComponentProps {
  onNavigate: (to: string) => void;
}

// Color theme palette — one per store, assigned by index
const THEMES = [
  {
    bannerBg: 'from-sky-100 to-blue-50',
    bannerTextColor: 'text-blue-600',
    iconBg: 'from-blue-600 to-blue-500',
    starColor: 'text-blue-500',
  },
  {
    bannerBg: 'from-emerald-100 to-teal-50',
    bannerTextColor: 'text-emerald-600',
    iconBg: 'from-emerald-600 to-teal-500',
    starColor: 'text-emerald-500',
  },
  {
    bannerBg: 'from-rose-100 to-orange-50',
    bannerTextColor: 'text-rose-500',
    iconBg: 'from-rose-500 to-orange-500',
    starColor: 'text-rose-500',
  },
  {
    bannerBg: 'from-violet-100 to-purple-50',
    bannerTextColor: 'text-violet-600',
    iconBg: 'from-violet-600 to-purple-500',
    starColor: 'text-violet-500',
  },
  {
    bannerBg: 'from-amber-100 to-yellow-50',
    bannerTextColor: 'text-amber-600',
    iconBg: 'from-amber-500 to-yellow-500',
    starColor: 'text-amber-500',
  },
  {
    bannerBg: 'from-pink-100 to-rose-50',
    bannerTextColor: 'text-pink-600',
    iconBg: 'from-pink-500 to-rose-400',
    starColor: 'text-pink-500',
  },
];

// Fallback banner food images
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=300&h=200',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=300&h=200',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=300&h=200',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=300&h=200',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&q=80&w=300&h=200',
  'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80&w=300&h=200',
];

interface StoreCard {
  ownerId?: number | string;
  slug: string;
  name: string;
  logoUrl: string;
  letter: string;
  products: number;
  rating: number;
  reviews: number;
  theme: typeof THEMES[0];
  bannerImage: string;
}

const getAbsoluteImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const serverBase = API_BASE_URL.replace(/\/api$/, '');
  const cleanPath = path.replace(/^\//, '');
  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('static/')) {
    return `${serverBase}/${cleanPath}`;
  }
  return `${serverBase}/uploads/${cleanPath}`;
};

async function fetchStoreData(user: AdminUser, themeIndex: number): Promise<StoreCard | null> {
  try {
    // Use user name as fallback store name when no store record exists
    let storeName = user.name || `Store #${user.id}`;
    let logoUrl = '';

    // Try to fetch the store profile (public endpoint — no auth required)
    try {
      const settings = await client.get<Record<string, any>>(`/stores/owner/${user.id}`);
      if (settings && settings.store_name) {
        storeName = settings.store_name;
      }
      if (settings && settings.logo_url) {
        logoUrl = getAbsoluteImageUrl(settings.logo_url);
      }
    } catch {
      // No store record yet — use user info as fallback (still show the card)
    }

    const slug = storeName.replace(/\s+/g, '_');

    // Fetch menu item count via top-selling (public, no auth)
    let products = 0;
    try {
      const items = await client.get<any[]>(`/menu-items/top-selling?limit=200&created_by=${user.id}`);
      products = Array.isArray(items) ? items.length : 0;
    } catch {
      products = 0;
    }

    // Use user avatar if available and no store logo
    if (!logoUrl && user.image) {
      logoUrl = getAbsoluteImageUrl(user.image);
    }

    return {
      ownerId: user.id,
      slug,
      name: storeName,
      logoUrl,
      letter: storeName.charAt(0).toUpperCase(),
      products,
      rating: 4.5 + Math.round(Math.random() * 4) / 10,
      reviews: Math.floor(50 + Math.random() * 150),
      theme: THEMES[themeIndex % THEMES.length],
      bannerImage: FALLBACK_IMAGES[themeIndex % FALLBACK_IMAGES.length],
    };
  } catch {
    return null;
  }
}

export const StoresComponent: React.FC<StoresComponentProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [stores, setStores] = useState<StoreCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const adminUsers: AdminUser[] = await getAdminUsers();
        if (cancelled) return;
        if (adminUsers.length === 0) {
          setStores([]);
          setLoading(false);
          return;
        }
        const results = await Promise.all(
          adminUsers.map((user, idx) => fetchStoreData(user, idx % THEMES.length))
        );
        if (!cancelled) {
          setStores(results.filter((s): s is StoreCard => s !== null));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setStores([]);
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const skeletonCount = 4;

  return (
    <section id="stores" className="py-24 sm:py-32 bg-slate-50 dark:bg-[#020617] border-y border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center space-y-6 mb-20">
          <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-[5px] text-[10px] sm:text-xs font-black text-amber-500 uppercase tracking-widest">
            <FiCoffee className="w-3.5 h-3.5" />
            <span>{t('stores.badge')}</span>
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('stores.headline')}
          </h2>
          <p className="text-slate-655 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            {t('stores.desc')}
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/50 rounded-[5px] border border-slate-200 dark:border-white/5 overflow-hidden animate-pulse transition-colors duration-300">
                <div className="h-32 bg-slate-100 dark:bg-slate-800/50" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-[5px] bg-slate-100 dark:bg-slate-800/50 shrink-0" />
                    <div className="space-y-2.5 flex-1">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded-[5px] w-3/4" />
                      <div className="h-3 bg-slate-50 dark:bg-slate-800/30 rounded-[5px] w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-[5px] mt-6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards Grid */}
        {!loading && stores.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stores.map((store) => (
              <div
                key={store.ownerId}
                onClick={() => onNavigate(`/${store.slug}`)}
                className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[5px] border border-slate-200 dark:border-white/5 hover:border-amber-500/30 dark:hover:border-amber-500/30 shadow-2xl transition-all duration-500 overflow-hidden flex flex-col cursor-pointer group hover:-translate-y-2 active:scale-[0.98] duration-150 transition-colors duration-300"
              >
                {/* ── Banner Header ── */}
                <div className={`relative h-32 bg-gradient-to-br ${store.theme.bannerBg.replace('100', '900/40').replace('50', '950/60')} flex items-center justify-between px-6 overflow-hidden`}>
                  {/* Store tagline */}
                  <p className={`text-sm font-black leading-snug text-slate-800 dark:text-white max-w-[55%] z-10`}>
                    {store.name.split(' ').slice(0, 2).join(' ')}
                    {'\n'}
                    <span className="font-bold text-xs text-amber-550 dark:text-amber-500/80">
                      {store.name.split(' ').slice(2).join(' ') || 'Elite Quality'}
                    </span>
                  </p>

                  {/* Floating banner image */}
                  <div className="absolute right-0 bottom-0 h-full w-40 overflow-hidden">
                    <img
                      src={store.bannerImage}
                      alt={store.name}
                      className="h-28 w-full object-cover object-center rounded-tl-[5px] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                    />
                  </div>
                  
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-slate-900/80 to-transparent pointer-events-none" />
                </div>

                {/* ── Store Identity Row ── */}
                <div className="flex items-center space-x-4 px-6 py-6">
                  {/* Logo or hexagon letter icon */}
                  {store.logoUrl ? (
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      className="w-14 h-14 shrink-0 rounded-[5px] object-cover border border-slate-200 dark:border-white/10 shadow-lg group-hover:border-amber-500/50 transition-colors"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 shrink-0 rounded-[5px] bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg`}
                    >
                      {store.letter}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight truncate group-hover:text-amber-500 transition-colors">
                      {store.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                      <div className="flex items-center space-x-0.5">
                        <FiStar className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-black text-amber-500">
                          {store.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500">{store.reviews} {t('stores.reviews')}</span>
                    </div>
                  </div>
                </div>

                {/* ── Product Count + Arrow Footer ── */}
                <div className="mt-auto px-6 pb-6">
                  <div className="flex items-center space-x-3 pt-4 border-t border-slate-200 dark:border-white/5">
                    <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/5 rounded-[5px] px-4 py-2.5 flex-1 group-hover:bg-amber-500/5 transition-colors">
                      <FiShoppingBag className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex items-baseline space-x-1">
                        <span className="font-black text-slate-900 dark:text-white text-sm">{store.products}</span>
                        <span className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">{t('stores.items')}</span>
                      </div>
                    </div>
                    <div className="w-11 h-11 shrink-0 rounded-[5px] bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-500 flex items-center justify-center transition-all duration-300 shadow-lg group-hover:shadow-amber-500/20">
                      <FiArrowRight className="w-5 h-5 text-slate-700 dark:text-white group-hover:text-slate-950 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && stores.length === 0 && (
          <div className="text-center py-24 text-slate-500">
            <FiAlertCircle className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="font-black text-base text-slate-800 dark:text-white opacity-40 uppercase tracking-widest">{t('stores.empty_title')}</p>
            <p className="text-sm mt-2 opacity-50">{t('stores.empty_desc')}</p>
          </div>
        )}

      </div>
    </section>
  );
};

