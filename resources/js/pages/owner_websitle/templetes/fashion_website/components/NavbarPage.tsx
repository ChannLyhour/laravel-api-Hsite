import React, { useState, useEffect } from 'react';
import { FiShoppingBag, FiHeart, FiBell, FiSearch, FiLogOut, FiClock, FiX, FiUser, FiGift, FiMapPin, FiMessageSquare, FiChevronDown, FiMenu } from 'react-icons/fi';
import '../styles/animation.css';
import type { NavbarPageProps, MegaMenuColumn, MegaMenuConfig } from '../types';
import { FASHION_ROUTES } from '../routes';
import { resolveImageUrl } from '../utils/imageUtils';
import { useSearch } from '../hooks/useSearch';
import { Store_setting, type StoreRow } from '@/api/owner/stores';
import { LoginPage } from './auth/LoginPage';
import { RegisterPage } from './auth/RegisterPage';
import { LogoutConfirm } from '../message/Comfirmd';
import { LogoutLoadingOverlay } from '../message/LoadingTime';
import { LineLoading } from './helpers/SkeletonSt';

import { useTranslation } from '../utils/translate';

export const NavbarPage: React.FC<NavbarPageProps> = ({
  cartCount,
  favoritesCount,
  setIsCartOpen,
  searchQuery = '',
  onSearch,
  user,
  storeName: initialStoreName = '',
  stores: initialStores,
  onNavigate,
  categories,
  onLogin,
  onRegister,
  onLogout,
  isSubmitting,
  isAuthLoading = false,
  ownerUserId,
  isLoading = false,
  locale,
  onChangeLanguage,
}) => {
  const { t } = useTranslation(locale);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [notificationsCount] = useState(0);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutLoading, setShowLogoutLoading] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [currentPathname, setCurrentPathname] = useState(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '';
  });
  const [currentTab, setCurrentTab] = useState(() => {
    return typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') || 'profile' : 'profile';
  });

  useEffect(() => {
    const handleUrlChange = (e?: Event) => {
      if (typeof window !== 'undefined') {
        const customEvent = e as CustomEvent;
        const urlStr = customEvent?.detail?.to || window.location.href;
        try {
          const url = urlStr.startsWith('http')
            ? new URL(urlStr)
            : new URL(urlStr, window.location.origin);
          setCurrentPathname(url.pathname);
          setCurrentTab(url.searchParams.get('tab') || 'profile');
        } catch (err) {
          setCurrentPathname(window.location.pathname);
          setCurrentTab(new URLSearchParams(window.location.search).get('tab') || 'profile');
        }
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('navigation_changed', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('navigation_changed', handleUrlChange);
    };
  }, []);

  // Close login/register modal automatically once user is logged in
  useEffect(() => {
    if (user) {
      setAuthModal(null);
    }
  }, [user]);

  const isProfilePage = currentPathname === '/profile' || currentPathname.endsWith('/profile');
  const isDashboardActive = currentPathname === '/owner' || currentPathname.endsWith('/owner');



  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('fashion_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to parse recent searches', e);
      }
    }
  }, []);

  const addToRecentSearches = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      localStorage.setItem('fashion_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromRecentSearches = (query: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(item => item !== query);
      localStorage.setItem('fashion_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('fashion_recent_searches');
  };

  const {
    matchedProducts,
    matchedCategories,
    allMatchedProducts,
    allMatchedCategories,
    isLoading: isSearchLoading
  } = useSearch({
    ownerUserId,
    searchQuery,
    categories,
    limit: 5,
  });

  // Local state to track dynamic settings for real-time updates
  const [dynamicStores, setDynamicStores] = useState<StoreRow | null>(initialStores || Store_setting());
  const [dynamicMenuConfigs, setDynamicMenuConfigs] = useState<MegaMenuConfig | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Close hover mega-menu dropdown when scrolling
      setHoveredCategory(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      const updated = Store_setting();
      if (updated) setDynamicStores(updated);
    };
    const handleRequestLogin = () => {
      setAuthModal('login');
    };
    window.addEventListener('settings_updated', handleUpdate);
    window.addEventListener('request_login', handleRequestLogin);
    return () => {
      window.removeEventListener('settings_updated', handleUpdate);
      window.removeEventListener('request_login', handleRequestLogin);
    };
  }, []);

  // Click outside listener to close categories dropdown and profile dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      setHoveredCategory(null);
      setIsProfileDropdownOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Flying cart items animation listener
  useEffect(() => {
    const handleAnimate = (e: Event) => {
      const customEvent = e as CustomEvent<{ startX: number; startY: number }>;
      const { startX, startY } = customEvent.detail;

      const targetEl = document.getElementById('nav-shopping-bag');
      if (!targetEl) return;

      const targetRect = targetEl.getBoundingClientRect();
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;

      // Create flyer div
      const flyer = document.createElement('div');
      flyer.className = 'fixed z-[9999] pointer-events-none flex items-center justify-center';
      flyer.style.left = `${startX}px`;
      flyer.style.top = `${startY}px`;

      // Draw flying bag icon inside red circle badge
      flyer.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-[#E61E25] text-white flex items-center justify-center shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out">
          <svg stroke="currentColor" fill="none" stroke-width="2.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
      `;

      document.body.appendChild(flyer);

      // Force reflow
      flyer.getBoundingClientRect();

      // Trigger transition
      flyer.style.transition = 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1), left 700ms cubic-bezier(0.16, 1, 0.3, 1), top 700ms cubic-bezier(0.45, 0, 0.55, 1), opacity 700ms ease';
      flyer.style.left = `${targetX}px`;
      flyer.style.top = `${targetY}px`;
      flyer.style.transform = 'scale(0.2)';
      flyer.style.opacity = '0.2';

      setTimeout(() => {
        flyer.remove();
        // Landing pulse pop effect
        targetEl.classList.add('animate-cart-pop');
        setTimeout(() => {
          targetEl.classList.remove('animate-cart-pop');
        }, 500);
      }, 700);
    };

    window.addEventListener('animate_to_cart', handleAnimate);
    return () => window.removeEventListener('animate_to_cart', handleAnimate);
  }, []);


  // Update dynamic stores if props change
  useEffect(() => {
    if (initialStores) setDynamicStores(initialStores);
  }, [initialStores]);

  // Transform categories into MegaMenuConfig format
  useEffect(() => {
    if (categories && categories.length > 0) {
      const config: MegaMenuConfig = {};

      // Get root categories (level 1) that should be in menu, sorted by priority (1 first, 0 last) then name
      const roots = categories
        .filter(c => !c.parent_id && c.is_menu)
        .sort((a, b) => {
          const prioA = (a.priority === undefined || a.priority === null || a.priority === 0) ? Infinity : a.priority;
          const prioB = (b.priority === undefined || b.priority === null || b.priority === 0) ? Infinity : b.priority;
          if (prioA !== prioB) return prioA - prioB;
          return a.name.localeCompare(b.name);
        });

      roots.forEach(root => {
        const columns: MegaMenuColumn[] = [];

        // Level 2: Subcategories (Columns), sorted by priority (1 first, 0 last) then name
        const subCats = categories
          .filter(c => c.parent_id === root.id && c.is_menu)
          .sort((a, b) => {
            const prioA = (a.priority === undefined || a.priority === null || a.priority === 0) ? Infinity : a.priority;
            const prioB = (b.priority === undefined || b.priority === null || b.priority === 0) ? Infinity : b.priority;
            if (prioA !== prioB) return prioA - prioB;
            return a.name.localeCompare(b.name);
          });

        if (subCats.length > 0) {
          subCats.forEach(child => {
            const items: string[] = [];

            // Level 3: Items, sorted by priority (1 first, 0 last) then name
            const grandchildren = categories
              .filter(c => c.parent_id === child.id && c.is_menu)
              .sort((a, b) => {
                const prioA = (a.priority === undefined || a.priority === null || a.priority === 0) ? Infinity : a.priority;
                const prioB = (b.priority === undefined || b.priority === null || b.priority === 0) ? Infinity : b.priority;
                if (prioA !== prioB) return prioA - prioB;
                return a.name.localeCompare(b.name);
              });

            if (grandchildren.length > 0) {
              grandchildren.forEach(subChild => {
                items.push(subChild.name);
              });
            } else {
              // Fallback if no sub-children: just add "All" or same as parent
              items.push(`All ${child.name}`);
            }

            columns.push({
              title: child.name,
              items: items
            });
          });
        }

        if (columns.length > 0) {
          config[root.name] = columns;
        }
      });

      if (Object.keys(config).length > 0) {
        setDynamicMenuConfigs(config);
      }
    } else {
      setDynamicMenuConfigs(null);
    }
  }, [categories]);

  const activeStores = dynamicStores || initialStores;
  const rawStoreName = activeStores?.store_name || initialStoreName;
  // Guard: if JS serialized a null value to the string "null", fall through to the default
  const activeStoreName = (rawStoreName && rawStoreName !== 'null') ? rawStoreName : 'Prime Store';


  const activeMenuConfigs = dynamicMenuConfigs || {};

  const logoUrl = activeStores?.logo_url
    ? resolveImageUrl(activeStores.logo_url)
    : (activeStores?.favicon_url ? resolveImageUrl(activeStores.favicon_url) : '');

  return (
    <>
      <div
        className="sticky top-0 z-50 bg-white border-b border-stone-200/60 shadow-2xs font-sans"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between gap-4 relative py-[2px]">

          {/* Left: Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-stone-850 hover:text-stone-600 bg-transparent border-none cursor-pointer focus:outline-none flex items-center justify-center z-20"
          >
            {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>

          {/* Left/Center Group: Logo + Nav Links */}
          <div className="flex-grow flex items-center h-full z-10">
            {/* Center: Brand Logo */}
            <div className="static flex-none flex justify-start z-10">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={activeStoreName}
                  onClick={() => {
                    if (onNavigate) {
                      const storeSlug = activeStoreName.replace(/\s+/g, '_');
                      onNavigate(FASHION_ROUTES.getHome(storeSlug, ownerUserId));
                    }
                  }}
                  className="h-10 w-auto object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <span
                  onClick={() => {
                    if (onNavigate) {
                      const storeSlug = activeStoreName.replace(/\s+/g, '_');
                      onNavigate(FASHION_ROUTES.getHome(storeSlug, ownerUserId));
                    }
                  }}
                  className="font-sans font-black text-2xl tracking-[0.2em] uppercase text-stone-950 select-none cursor-pointer"
                >
                  {activeStoreName}
                </span>
              )}
            </div>
            {/* Center/Left: Category Nav Links */}
            {/* Static Links Home & Shop (aligned to the left near Logo) */}
            <div className="hidden lg:flex items-center space-x-6 text-2xs font-extrabold tracking-widest text-stone-855 h-full ml-10">
              {/* Static Link Home */}
              <div
                onClick={() => {
                  if (onNavigate) {
                    const storeSlug = activeStoreName.replace(/\s+/g, '_');
                    onNavigate(FASHION_ROUTES.getHome(storeSlug, ownerUserId));
                  }
                }}
                className="h-full flex items-center relative cursor-pointer"
              >
                <span className="nav-link-draw hover:text-[#E61E25] text-stone-800 transition-colors py-8">
                  {t('navbar.home')}
                </span>
              </div>

              {/* Static Link Shop */}
              <div
                onClick={() => {
                  if (onNavigate) {
                    const storeSlug = activeStoreName.replace(/\s+/g, '_');
                    onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug));
                  }
                }}
                className="h-full flex items-center relative cursor-pointer"
              >
                <span className="nav-link-draw hover:text-[#E61E25] text-stone-800 transition-colors py-8">
                  {t('navbar.shop')}
                </span>
              </div>

              {/* Static Link Offers & Deals */}
              <div
                onClick={() => {
                  if (onNavigate) {
                    const storeSlug = activeStoreName.replace(/\s+/g, '_');
                    onNavigate(FASHION_ROUTES.getOffers(ownerUserId, storeSlug));
                  }
                }}
                className="h-full flex items-center relative cursor-pointer"
              >
                <span className="nav-link-draw hover:text-[#E61E25] text-stone-800 transition-colors py-8">
                  Offers & Deals
                </span>
              </div>
            </div>

            {/* Categories list pushed to the right */}
            <div className="hidden lg:flex items-center space-x-6 text-2xs font-extrabold tracking-widest text-stone-855 h-full ml-auto">
              {Object.keys(activeMenuConfigs)
                .sort((aKey, bKey) => {
                  const catA = categories?.find(c => c.name.toUpperCase() === aKey.toUpperCase());
                  const catB = categories?.find(c => c.name.toUpperCase() === bKey.toUpperCase());
                  const prioA = (catA?.priority === undefined || catA?.priority === null || catA?.priority === 0) ? Infinity : catA.priority;
                  const prioB = (catB?.priority === undefined || catB?.priority === null || catB?.priority === 0) ? Infinity : catB.priority;
                  if (prioA !== prioB) return prioA - prioB;
                  return aKey.localeCompare(bKey);
                })
                .map(catKey => {
                  return (
                    <div
                      key={catKey}
                      onMouseEnter={() => setHoveredCategory(catKey)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigate) {
                          const storeSlug = activeStoreName.replace(/\s+/g, '_');
                          const hash = `#${catKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                          onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { hash }));
                        }
                        setHoveredCategory(null);
                      }}
                      className="h-full flex items-center cursor-pointer"
                    >
                      <span
                        className={`nav-link-draw hover:text-[#E61E25] transition-colors py-8 ${hoveredCategory === catKey ? 'text-[#E61E25]' : 'text-stone-800'
                          }`}
                      >
                        {catKey}
                      </span>

                      {/* Dropdown Container Positioned Relative to the Category Link */}
                      {hoveredCategory === catKey && activeMenuConfigs[catKey] && (
                        <div
                          className="absolute top-full left-0 w-full bg-white border border-stone-200/80 shadow-xl z-55 animate-fade-in-down p-8 rounded-[4px] flex gap-12 text-left mt-0"
                          onClick={(e) => e.stopPropagation()} // Prevent click bubbling to toggle parent dropdown
                        >
                          {activeMenuConfigs[catKey].map((col: MegaMenuColumn, idx: number) => (
                            <div key={idx} className="space-y-4 min-w-[120px]">
                              {/* Column Title (Sub Category) */}
                              <h5
                                onClick={() => {
                                  if (onNavigate) {
                                    const storeSlug = activeStoreName.replace(/\s+/g, '_');
                                    const subCatHash = `${catKey.toLowerCase()}-${col.title
                                      .toLowerCase()
                                      .replace(/[^a-z0-9]/g, '-')}`;
                                    onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { hash: `#${subCatHash}` }));
                                  }
                                  setHoveredCategory(null);
                                }}
                                className={`text-2xs font-black tracking-widest mega-menu-column-title cursor-pointer hover:text-[#E61E25] transition-colors ${col.isRed
                                  ? 'text-[#E61E25] after:bg-[#E61E25]'
                                  : 'text-stone-950 after:bg-stone-950'
                                  }`}
                              >
                                {col.title}
                              </h5>

                              {/* Column Items (Sub Sub Categories) */}
                              <ul className="space-y-2 list-none p-2 m-0">
                                {col.items.map((item: string, itemIdx: number) => {
                                  const targetHash = `${catKey.toLowerCase()}-${item
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, '-')}`;
                                  return (
                                    <li key={itemIdx}>
                                      <a
                                        href={`#${targetHash}`}
                                        onClick={e => {
                                          if (onNavigate) {
                                            e.preventDefault();
                                            const storeSlug = activeStoreName.replace(/\s+/g, '_');
                                            onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { hash: `#${targetHash}` }));
                                          }
                                          setHoveredCategory(null);
                                        }}
                                        className={`mega-menu-item text-[12px] font-bold transition-colors block ${col.isRed
                                          ? 'text-[#E61E25]'
                                          : 'text-stone-500 hover:text-[#E61E25]'
                                          }`}
                                      >
                                        {item}
                                      </a>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>


          {/* Right: Search, Tools, Auth */}
          <div className="flex items-center space-x-2 ml-auto lg:ml-0">
            {/* Search Input */}
            <div className="hidden md:block">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder={t('navbar.search')}
                  value={searchQuery}
                  onChange={e => onSearch && onSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      addToRecentSearches(searchQuery);
                      if (onNavigate) {
                        const storeSlug = activeStoreName.replace(/\s+/g, '_');
                        onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { search: searchQuery }));
                      }
                      setIsSearchFocused(false);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="pl-9 pr-4 py-2 w-44 hover:w-56 focus:w-56 bg-stone-100/80 border border-transparent rounded-[6px] text-2xs font-bold text-stone-800 placeholder-stone-400 outline-none transition-all duration-355 focus:bg-white focus:border-stone-300"
                />
              </div>

              {isSearchFocused && searchQuery.trim().length === 0 && (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute top-full left-0 w-full mt-2 max-h-96 overflow-y-auto bg-white border border-stone-200/80 rounded-[8px] shadow-xl z-55 p-6 font-sans text-left animate-fade-in-down"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-1.5 mb-3">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      {t('navbar.recentSearches')}
                    </h4>
                    {recentSearches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearRecentSearches()}
                        className="text-stone-400 hover:text-stone-900 text-3xs font-black uppercase tracking-wider bg-transparent border-none cursor-pointer p-0"
                      >
                        {t('navbar.clearAll')}
                      </button>
                    )}
                  </div>
                  {recentSearches.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {recentSearches.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between hover:bg-stone-55 rounded-[4px] px-3 py-2 transition-colors group cursor-pointer border border-stone-200/60"
                          onClick={() => {
                            if (onSearch) onSearch(item);
                            if (onNavigate) {
                              const storeSlug = activeStoreName.replace(/\s+/g, '_');
                              onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { search: item }));
                            }
                            setIsSearchFocused(false);
                          }}
                        >
                          <div className="flex items-center gap-2 text-stone-700 group-hover:text-stone-900 flex-1 min-w-0">
                            <FiClock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="text-2xs font-extrabold uppercase tracking-wide truncate">
                              {item}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromRecentSearches(item);
                            }}
                            className="p-1 hover:bg-stone-200/60 rounded-full text-stone-400 hover:text-stone-700 bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-stone-400 text-3xs font-bold uppercase tracking-wider">
                      {t('navbar.noRecentSearches')}
                    </div>
                  )}
                </div>
              )}

              {isSearchFocused && searchQuery.trim().length > 0 && (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute top-full left-0 w-full mt-2 max-h-96 overflow-y-auto bg-white border border-stone-200/80 rounded-[8px] shadow-xl z-55 p-6 font-sans text-left animate-fade-in-down"
                >
                  {isSearchLoading ? (
                    <div className="flex items-center justify-center py-6 text-stone-400 text-3xs font-bold uppercase tracking-wider">
                      <div className="animate-spin h-4 w-4 border-2 border-stone-900 border-t-transparent rounded-full mr-2" />
                      Searching...
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Categories section */}
                        {matchedCategories.length > 0 && (
                          <div className="md:col-span-4 space-y-1.5">
                            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-1">
                              Categories
                            </h4>
                            <div className="flex flex-col">
                              {matchedCategories.map(cat => {
                                const nameNormalized = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                                return (
                                  <button
                                    key={cat.id}
                                    onClick={() => {
                                      addToRecentSearches(searchQuery);
                                      if (onNavigate) {
                                        const storeSlug = activeStoreName.replace(/\s+/g, '_');
                                        onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { hash: `#${nameNormalized}` }));
                                      }
                                    }}
                                    className="text-left px-2 py-1.5 hover:bg-stone-50 text-stone-700 hover:text-[#E61E25] font-extrabold text-3xs uppercase tracking-wider rounded-[4px] transition-colors border-none bg-transparent cursor-pointer w-full"
                                  >
                                    {cat.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Products section */}
                        {matchedProducts.length > 0 && (
                          <div className={`${matchedCategories.length > 0 ? 'md:col-span-8' : 'md:col-span-12'} space-y-1.5`}>
                            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-1">
                              Products
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {matchedProducts.map(product => (
                                <div
                                  key={product.id}
                                  onClick={() => {
                                    addToRecentSearches(searchQuery);
                                    if (onNavigate) {
                                      const storeSlug = activeStoreName.replace(/\s+/g, '_');
                                      onNavigate(FASHION_ROUTES.getProduct(product.id, ownerUserId, storeSlug));
                                    }
                                  }}
                                  className="flex gap-3 items-center p-1.5 hover:bg-stone-50 rounded-[4px] cursor-pointer transition-colors"
                                >
                                  <div className="w-8 h-10 rounded-[2px] overflow-hidden border border-stone-200 bg-white shrink-0">
                                    <img
                                      src={resolveImageUrl(product.display_image || product.image)}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <h5 className="text-[11px] font-black text-stone-800 uppercase tracking-wide truncate">
                                      {product.name}
                                    </h5>
                                    <div className="text-3xs font-extrabold font-mono text-stone-500">
                                      ${parseFloat(product.price).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {matchedCategories.length === 0 && matchedProducts.length === 0 && (
                        <div className="text-center py-6 text-stone-400 text-3xs font-bold uppercase tracking-wider">
                          No matches found
                        </div>
                      )}

                      {(allMatchedProducts.length > 0 || allMatchedCategories.length > 0) && (
                        <button
                          onClick={() => {
                            addToRecentSearches(searchQuery);
                            if (onNavigate) {
                              const storeSlug = activeStoreName.replace(/\s+/g, '_');
                              onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { search: searchQuery }));
                            }
                            setIsSearchFocused(false);
                          }}
                          className="w-full mt-3 py-2 bg-stone-955 hover:bg-stone-900 text-white font-extrabold text-[10px] uppercase tracking-widest transition-all rounded-[4px] border-none cursor-pointer flex items-center justify-center gap-1 shadow-2xs hover:shadow-xs"
                        >
                          View All Results ({allMatchedProducts.length + allMatchedCategories.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button className="icon-scale-hover relative p-2 text-stone-800 hover:text-stone-600 bg-transparent border-none cursor-pointer transition-colors flex items-center justify-center focus:outline-none">
              <FiBell className="w-5 h-5" />
              {notificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E61E25] rounded-full" />
              )}
            </button>

            {/* Favorites Heart */}
            <button
              onClick={() => {
                if (onNavigate) {
                  const storeSlug = (activeStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                  onNavigate(FASHION_ROUTES.getWishlist(ownerUserId, storeSlug));
                }
              }}
              className="icon-scale-hover p-2 text-stone-800 hover:text-[#E61E25] bg-transparent border-none cursor-pointer transition-colors flex items-center justify-center focus:outline-none relative"
            >
              <FiHeart className={`w-5 h-5 ${favoritesCount > 0 ? 'text-[#E61E25]' : ''}`} />
              {favoritesCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-3 text-[#E61E25] text-[13px] font-black rounded-full flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Shopping Bag Button */}
            <button
              id="nav-shopping-bag"
              onClick={() => setIsCartOpen(true)}
              className="icon-scale-hover relative p-2 text-stone-800 hover:text-stone-600 bg-transparent border-none cursor-pointer transition-colors flex items-center justify-center focus:outline-none"
            >
              <FiShoppingBag className={`w-5 h-5 ${cartCount > 0 ? '' : ''}`} />
              {cartCount > 0 && (
                <span
                  key={cartCount}
                  className="absolute top-0 right-0 w-4 h-4 bg-[#E61E25] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs animate-cart-pop"
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile User Icon */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (user) {
                    setIsProfileDropdownOpen(prev => !prev);
                  } else {
                    setAuthModal('login');
                  }
                }}
                className="icon-scale-hover p-2 text-stone-850 hover:text-stone-600 bg-transparent border-none cursor-pointer transition-colors flex items-center justify-center focus:outline-none"
              >
                {user ? (
                  user.image_url ? (
                    <img
                      src={user.image_url}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover border border-stone-200"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[8px] font-black animate-fade-in">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )
                ) : (
                  <FiUser className="w-5 h-5" />
                )}
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && user && (
                <div className="absolute right-0 top-12 mt-2 w-52 bg-white border border-stone-200/80 rounded-[4px] shadow-xl z-55 p-2.5 text-left animate-fade-in-down normal-case font-semibold text-stone-750 flex flex-col">
                  {(user.role === 'owner' || user.role === 'admin' || user.role === 'staff') && (
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onNavigate) onNavigate(FASHION_ROUTES.getOwnerDashboard());
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-[14px] font-bold rounded-[3px] border-none cursor-pointer w-full text-left transition-colors focus:outline-none uppercase tracking-wider ${
                        isDashboardActive
                          ? 'bg-stone-900 text-white hover:bg-stone-850'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 bg-transparent'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      {t('navbar.dashboard')}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const storeSlug = (initialStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                      setIsProfileDropdownOpen(false);
                      if (onNavigate) onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'profile'));
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-[14px] font-bold rounded-[3px] border-none cursor-pointer w-full text-left transition-colors focus:outline-none uppercase tracking-wider ${
                      isProfilePage && currentTab === 'profile'
                        ? 'bg-stone-900 text-white hover:bg-stone-850'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 bg-transparent'
                    }`}
                  >
                    <FiUser className={`w-3.5 h-3.5 shrink-0 ${isProfilePage && currentTab === 'profile' ? 'text-stone-200' : 'text-stone-400'}`} />
                    {t('navbar.profile')}
                  </button>
                  <button
                    onClick={() => {
                      const storeSlug = (initialStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                      setIsProfileDropdownOpen(false);
                      if (onNavigate) onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'orders'));
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-[14px] font-bold rounded-[3px] border-none cursor-pointer w-full text-left transition-colors focus:outline-none uppercase tracking-wider ${
                      isProfilePage && currentTab === 'orders'
                        ? 'bg-stone-900 text-white hover:bg-stone-850'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 bg-transparent'
                    }`}
                  >
                    <FiClock className={`w-3.5 h-3.5 shrink-0 ${isProfilePage && currentTab === 'orders' ? 'text-stone-200' : 'text-stone-400'}`} />
                    {t('navbar.orderHistory')}
                  </button>
                  <button
                    onClick={() => {
                      const storeSlug = (initialStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                      setIsProfileDropdownOpen(false);
                      if (onNavigate) onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'giftcard'));
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-[14px] font-bold rounded-[3px] border-none cursor-pointer w-full text-left transition-colors focus:outline-none uppercase tracking-wider ${
                      isProfilePage && currentTab === 'giftcard'
                        ? 'bg-stone-900 text-white hover:bg-stone-850'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 bg-transparent'
                    }`}
                  >
                    <FiGift className={`w-3.5 h-3.5 shrink-0 ${isProfilePage && currentTab === 'giftcard' ? 'text-stone-200' : 'text-stone-400'}`} />
                    {t('navbar.vouchers')}
                  </button>
                  {Store_setting()?.checkout_delivery_address !== 'close' && (
                    <button
                      onClick={() => {
                        const storeSlug = (initialStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                        setIsProfileDropdownOpen(false);
                        if (onNavigate) onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'address'));
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-[14px] font-bold rounded-[3px] border-none cursor-pointer w-full text-left transition-colors focus:outline-none uppercase tracking-wider ${
                        isProfilePage && currentTab === 'address'
                          ? 'bg-stone-900 text-white hover:bg-stone-850'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 bg-transparent'
                      }`}
                    >
                      <FiMapPin className={`w-3.5 h-3.5 shrink-0 ${isProfilePage && currentTab === 'address' ? 'text-stone-200' : 'text-stone-400'}`} />
                      {t('navbar.addressBook')}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const storeSlug = (initialStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                      setIsProfileDropdownOpen(false);
                      if (onNavigate) onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'chat'));
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-[14px] font-bold rounded-[3px] border-none cursor-pointer w-full text-left transition-colors focus:outline-none uppercase tracking-wider ${
                      isProfilePage && currentTab === 'chat'
                        ? 'bg-stone-900 text-white hover:bg-stone-850'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 bg-transparent'
                    }`}
                  >
                    <FiMessageSquare className={`w-3.5 h-3.5 shrink-0 ${isProfilePage && currentTab === 'chat' ? 'text-stone-200' : 'text-stone-400'}`} />
                    {t('navbar.messagesChat')}
                  </button>

                  {/* Language Selector */}
                  <div className="border-t border-stone-100 my-1.5 pt-1.5 px-3">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">
                      {t('navbar.language')}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeLanguage?.('en');
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider rounded-[3px] border transition-colors cursor-pointer text-center focus:outline-none ${
                          locale === 'en'
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-transparent text-stone-600 border-stone-200 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeLanguage?.('km');
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider rounded-[3px] border transition-colors cursor-pointer text-center focus:outline-none ${
                          locale === 'km'
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-transparent text-stone-600 border-stone-200 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        ខ្មែរ
                      </button>
                    </div>
                  </div>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-stone-600 hover:text-red-500 hover:bg-stone-50 rounded-[3px] bg-transparent border-none cursor-pointer w-full text-left transition-colors focus:outline-none uppercase tracking-wider"
                    >
                      <FiLogOut className="w-3.5 h-3.5 text-stone-400 shrink-0 hover:text-red-400" />
                      {t('navbar.signOut')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Sticky Navbar bottom linear loading progress bar */}
        <LineLoading isLoading={isLoading || isSearchLoading} />
      </div>

      {/* Auth Modals */}
      {authModal === 'login' && onLogin && (
        <LoginPage
          onClose={() => setAuthModal(null)}
          onLogin={onLogin}
          onSwitchToRegister={() => setAuthModal('register')}
          isSubmitting={isSubmitting}
          storeName={activeStoreName}
          stores={dynamicStores || undefined}
          ownerUserId={ownerUserId}
        />
      )}
      {authModal === 'register' && onRegister && (
        <RegisterPage
          onClose={() => setAuthModal(null)}
          onRegister={onRegister}
          onSwitchToLogin={() => setAuthModal('login')}
          isSubmitting={isSubmitting}
          storeName={activeStoreName}
        />
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <LogoutConfirm
          storeName={activeStoreName}
          userName={user?.name}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            setShowLogoutConfirm(false);
            setShowLogoutLoading(true);
          }}
        />
      )}

      {/* Logout Loading Overlay */}
      {showLogoutLoading && (
        <LogoutLoadingOverlay
          storeName={activeStoreName}
          onDone={() => {
            setShowLogoutLoading(false);
            onLogout?.();
            // Navigate to store home — NOT reload (would return to profile/current page)
            const storeSlug = activeStoreName.replace(/\s+/g, '_');
            if (onNavigate && storeSlug) {
              onNavigate(FASHION_ROUTES.getHome(storeSlug));
            } else {
              window.location.href = '/';
            }
          }}
        />
      )}

      {/* Mobile Sidebar Navigation Drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
      >
        {/* Backdrop overlay */}
        <div
          className={`absolute inset-0 bg-stone-950/40 backdrop-blur-2xs transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`absolute inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-150 flex items-center justify-between">
            <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest">
              {activeStoreName}
            </h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-stone-400 hover:text-stone-900 transition-colors p-1 bg-transparent border-none cursor-pointer font-bold text-lg focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6 text-left">
            {/* Navigation Links */}
            <div className="space-y-4">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  if (onNavigate) {
                    const storeSlug = activeStoreName.replace(/\s+/g, '_');
                    onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug));
                  }
                }}
                className="block text-2xs font-extrabold tracking-widest uppercase text-stone-955 hover:text-[#E61E25] transition-colors animate-fade-in"
              >
                Shop
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  if (onNavigate) {
                    const storeSlug = activeStoreName.replace(/\s+/g, '_');
                    onNavigate(FASHION_ROUTES.getOffers(ownerUserId, storeSlug));
                  }
                }}
                className="block text-2xs font-extrabold tracking-widest uppercase text-stone-955 hover:text-[#E61E25] transition-colors animate-fade-in"
              >
                Offers & Deals
              </a>

              {/* Categories Accordion */}
              {Object.keys(activeMenuConfigs)
                .sort((aKey, bKey) => {
                  const catA = categories?.find(c => c.name.toUpperCase() === aKey.toUpperCase());
                  const catB = categories?.find(c => c.name.toUpperCase() === bKey.toUpperCase());
                  const prioA = (catA?.priority === undefined || catA?.priority === null || catA?.priority === 0) ? Infinity : catA.priority;
                  const prioB = (catB?.priority === undefined || catB?.priority === null || catB?.priority === 0) ? Infinity : catB.priority;
                  if (prioA !== prioB) return prioA - prioB;
                  return aKey.localeCompare(bKey);
                })
                .map(catKey => {
                  return (
                    <MobileCategoryAccordion
                      key={catKey}
                      catKey={catKey}
                      activeMenuConfigs={activeMenuConfigs}
                      categories={categories}
                      activeStoreName={activeStoreName}
                      ownerUserId={ownerUserId}
                      onNavigate={onNavigate}
                      onCloseMenu={() => setIsMobileMenuOpen(false)}
                    />
                  );
                })}
            </div>

            {/* Language Selector */}
            <div className="space-y-1.5 pt-2 animate-fade-in">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                {t('navbar.language')}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onChangeLanguage?.('en');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex-1 py-2 text-2xs font-extrabold uppercase tracking-wider rounded-[4px] border transition-colors cursor-pointer text-center focus:outline-none ${
                    locale === 'en'
                      ? 'bg-stone-950 text-white border-stone-950'
                      : 'bg-transparent text-stone-600 border-stone-200 hover:bg-stone-55 hover:text-stone-900'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    onChangeLanguage?.('km');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex-1 py-2 text-2xs font-extrabold uppercase tracking-wider rounded-[4px] border transition-colors cursor-pointer text-center focus:outline-none ${
                    locale === 'km'
                      ? 'bg-stone-950 text-white border-stone-950'
                      : 'bg-transparent text-stone-600 border-stone-200 hover:bg-stone-55 hover:text-stone-900'
                  }`}
                >
                  ខ្មែរ
                </button>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-stone-150 animate-fade-in" />

            {/* Auth section */}
            <div className="space-y-4 animate-fade-in">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    {user.image_url ? (
                      <img src={user.image_url} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-stone-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-black">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-2xs font-black uppercase text-stone-950">{user.name}</h4>
                      <p className="text-3xs font-semibold text-stone-450 capitalize">{user.role}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {(user.role === 'owner' || user.role === 'admin' || user.role === 'staff') && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onNavigate) onNavigate(FASHION_ROUTES.getOwnerDashboard());
                        }}
                        className="flex items-center gap-2.5 text-2xs font-extrabold uppercase text-stone-600 hover:text-stone-900 bg-transparent border-none cursor-pointer w-full text-left focus:outline-none"
                      >
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                        {t('navbar.dashboard')}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const storeSlug = (activeStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                        setIsMobileMenuOpen(false);
                        if (onNavigate) onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'profile'));
                      }}
                      className="flex items-center gap-2.5 text-2xs font-extrabold uppercase text-stone-600 hover:text-stone-900 bg-transparent border-none cursor-pointer w-full text-left focus:outline-none"
                    >
                      <FiUser className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {t('navbar.profile')}
                    </button>

                    <button
                      onClick={() => {
                        const storeSlug = (activeStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                        setIsMobileMenuOpen(false);
                        if (onNavigate) onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'orders'));
                      }}
                      className="flex items-center gap-2.5 text-2xs font-extrabold uppercase text-stone-600 hover:text-stone-900 bg-transparent border-none cursor-pointer w-full text-left focus:outline-none"
                    >
                      <FiClock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {t('navbar.orderHistory')}
                    </button>

                    <button
                      onClick={() => {
                        const storeSlug = (activeStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                        setIsMobileMenuOpen(false);
                        if (onNavigate) onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'giftcard'));
                      }}
                      className="flex items-center gap-2.5 text-2xs font-extrabold uppercase text-stone-600 hover:text-stone-900 bg-transparent border-none cursor-pointer w-full text-left focus:outline-none"
                    >
                      <FiGift className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {t('navbar.vouchers')}
                    </button>

                    <button
                      onClick={() => {
                        const storeSlug = (activeStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                        setIsMobileMenuOpen(false);
                        if (onNavigate) onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'address'));
                      }}
                      className="flex items-center gap-2.5 text-2xs font-extrabold uppercase text-stone-600 hover:text-stone-900 bg-transparent border-none cursor-pointer w-full text-left focus:outline-none"
                    >
                      <FiMapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {t('navbar.addressBook')}
                    </button>

                    <button
                      onClick={() => {
                        const storeSlug = (activeStores?.store_name || initialStoreName || 'store').replace(/\s+/g, '_');
                        setIsMobileMenuOpen(false);
                        if (onNavigate) onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'chat'));
                      }}
                      className="flex items-center gap-2.5 text-2xs font-extrabold uppercase text-stone-600 hover:text-stone-900 bg-transparent border-none cursor-pointer w-full text-left focus:outline-none"
                    >
                      <FiMessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {t('navbar.messagesChat')}
                    </button>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex items-center gap-2.5 text-2xs font-extrabold uppercase text-stone-600 hover:text-red-500 bg-transparent border-none cursor-pointer w-full text-left focus:outline-none"
                    >
                      <FiLogOut className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      {t('navbar.signOut')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setAuthModal('login');
                    }}
                    className="w-full py-2.5 bg-stone-955 hover:bg-stone-900 text-white font-extrabold text-[10px] uppercase tracking-widest transition-all rounded-[4px] border-none cursor-pointer text-center"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setAuthModal('register');
                    }}
                    className="w-full py-2.5 bg-white border border-stone-200 text-stone-850 hover:bg-stone-50 font-extrabold text-[10px] uppercase tracking-widest transition-all rounded-[4px] cursor-pointer text-center"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface MobileCategoryAccordionProps {
  catKey: string;
  activeMenuConfigs: any;
  categories: any[] | undefined;
  activeStoreName: string;
  ownerUserId?: number | string;
  onNavigate?: (to: string) => void;
  onCloseMenu: () => void;
}

const MobileCategoryAccordion: React.FC<MobileCategoryAccordionProps> = ({
  catKey,
  activeMenuConfigs,
  categories: _categories,
  activeStoreName,
  ownerUserId,
  onNavigate,
  onCloseMenu,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2 animate-fade-in">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-2xs font-extrabold tracking-widest uppercase text-stone-855 hover:text-[#E61E25] bg-transparent border-none cursor-pointer py-1"
      >
        <span>{catKey}</span>
        <FiChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && activeMenuConfigs[catKey] && (
        <div className="pl-4 space-y-3.5 border-l border-stone-150 py-1.5 animate-fade-in-down">
          {activeMenuConfigs[catKey].map((col: any, idx: number) => (
            <div key={idx} className="space-y-2">
              <h5
                onClick={() => {
                  if (onNavigate) {
                    const storeSlug = activeStoreName.replace(/\s+/g, '_');
                    const subCatHash = `${catKey.toLowerCase()}-${col.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, '-')}`;
                    onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { hash: `#${subCatHash}` }));
                  }
                  onCloseMenu();
                }}
                className="text-[10px] font-black tracking-widest uppercase text-stone-955 cursor-pointer hover:text-[#E61E25]"
              >
                {col.title}
              </h5>

              <ul className="pl-2 space-y-1.5 list-none p-0 m-0 text-left">
                {col.items.map((item: string, itemIdx: number) => {
                  const targetHash = `${catKey.toLowerCase()}-${item
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')}`;
                  return (
                    <li key={itemIdx}>
                      <a
                        href={`#${targetHash}`}
                        onClick={e => {
                          if (onNavigate) {
                            e.preventDefault();
                            const storeSlug = activeStoreName.replace(/\s+/g, '_');
                            onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { hash: `#${targetHash}` }));
                          }
                          onCloseMenu();
                        }}
                        className="text-[11px] font-bold text-stone-500 hover:text-[#E61E25] block"
                      >
                        {item}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
