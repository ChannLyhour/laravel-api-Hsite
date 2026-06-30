import { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { HomePage as HomePageLocal } from '@/pages/owner_websitle/templetes_menu/HomePage';
import { HomePage as HomePageOnline } from '@/pages/owner_websitle/templetes_menu copy/HomePage';
import { CustomerDisplayPage } from '@/pages/owner_websitle/templetes_menu/components/CustomerDisplayPage';
import { client } from '@/api/client';
import { LoginPage as LoginPageLocal } from '@/pages/owner_websitle/templetes_menu/LoginPage';
import { LoginPage as LoginPageOnline } from '@/pages/owner_websitle/templetes_menu copy/LoginPage';
import { AdminLoginPage } from '@/pages/owner_manage/OwnerLoginPage';
import { AdminDashboard } from '@/pages/owner_manage/layouts/OwnerDashboard';
import { CompanyWebsite } from '@/pages/main_website/CompanyWebsite';
import { AdminLoginPage as MasterLoginPage } from '@/pages/admin_manage/AdminLoginPage';
import { AdminDashboard as MasterDashboard } from '@/pages/admin_manage/layouts/AdminDashboard';
import { authService, getAdminUsers } from '@/api/auth';
import { settingService } from '@/api/setting';
import type { SettingResponse } from '@/api/setting';
import { useConfirm } from '@/components/ConfirmProvider';
import { storesService } from '@/api/owner/stores';
import { resolveImageUrl } from '@/api/imageUtils';
import type { StoreRow } from '@/api/owner/stores';
import { Toaster } from 'react-hot-toast';
import { OWNER_USER_ID } from '@/config';
import { parseStorePath, deslugifyStoreName, getStoreMenuUrl } from '@Security/Owner/configUrl';
import { shareService } from '@/api/owner/share';
import { toast } from 'react-hot-toast';
import { storeBrandingService } from '@/api/created_by/getFaviconById';
import { storeTitleService } from '@/api/created_by/getTitleNameById';
import { adminSettingApi } from '@/api/admin/setting';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token') || localStorage.getItem('aura_customer_token');
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('admin_token');
  });
  const [masterAdminToken, setMasterAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('master_admin_token');
  });
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [settings, setSettings] = useState<SettingResponse['settings'] | null>(() => {
    try {
      const saved = localStorage.getItem('store_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [storeInfo, setStoreInfo] = useState<StoreRow | null>(() => {
    try {
      const saved = localStorage.getItem('store_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // Track the last favicon URL applied to avoid duplicate network requests

  const [isLoadingShared, setIsLoadingShared] = useState(() => {
    return window.location.pathname.startsWith('/share/');
  });

  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: true,
      easing: 'ease-out-cubic',
    });
  }, []);

  useEffect(() => {
    AOS.refreshHard();
  }, [currentPath]);

  // Page load layout share handler
  useEffect(() => {
    const match = window.location.pathname.match(/^\/share\/([a-zA-Z0-9]+)/);
    if (match) {
      const shareId = match[1];
      const fetchShare = async () => {
        try {
          const res = await shareService.getShare(shareId);
          if (res && res.success && res.data) {
            const sharedStores = res.data.stores;
            // Sync to local storage
            localStorage.setItem('store_settings', JSON.stringify(sharedStores));
            window.dispatchEvent(new Event('settings_updated'));

            // Hydrate states
            setSettings(sharedStores);
            setStoreInfo(sharedStores as any);

            if (res.data.ownerUserId) {
              setOwnerUserIdState(res.data.ownerUserId);
              localStorage.setItem('selected_owner_id', String(res.data.ownerUserId));
            }
            toast.success('Shared design loaded successfully!');
          } else {
            toast.error('Shared design data not found or empty.');
          }
        } catch (err) {
          console.error('Failed to load shared design:', err);
          toast.error('Failed to load shared design configuration.');
        } finally {
          setIsLoadingShared(false);
        }
      };
      fetchShare();
    }
  }, []);

  // Resolve the owner from URL params.
  // Route rules:
  //   /                          → default owner (VITE_OWNER_USER_ID), ignores localStorage
  //   /?owner=6&store=StoreName  → owner 6's storefront
  //   /menu?owner=6&store=...    → owner 6's menu page
  //   /owner / /owner/login      → owner management dashboard
  // Whether we are currently viewing an owner-specific storefront (drives CompanyWebsite vs HomePage routing)
  const [hasOwnerParam, setHasOwnerParam] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const isProductPage = window.location.pathname.startsWith('/product');
    return params.has('owner') || (!isProductPage && params.has('id'));
  });

  const [ownerUserId, setOwnerUserIdState] = useState<number | string>(() => {
    const params = new URLSearchParams(window.location.search);
    const isProductPage = window.location.pathname.startsWith('/product');
    const urlOwnerId = params.get('owner') || (!isProductPage ? params.get('id') : null);
    if (urlOwnerId) {
      // A specific owner was requested via URL — use it and persist for the session
      const parsedId = isNaN(Number(urlOwnerId)) ? urlOwnerId : parseInt(urlOwnerId, 10);
      localStorage.setItem('selected_owner_id', String(parsedId));
      return parsedId;
    }
    // No ?owner or ?id param in URL → this is the main website, always use the default owner
    return OWNER_USER_ID;
  });

  // Store name read from ?store= URL param (used for owner-specific storefronts)
  const [storeName, setStoreNameState] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('store')?.replace(/_/g, ' ') || '';
  });

  // Logged-in owner/admin's profile (fetched when adminToken is present)
  const [adminProfile, setAdminProfile] = useState<{ id: number; hashid?: string; name: string; role?: string } | null>(null);
  const [, setMasterAdminProfile] = useState<{ id: number; name: string; role?: string } | null>(null);

  const confirm = useConfirm();

  const setOwnerUserId = (id: number | string) => {
    setOwnerUserIdState(id);
    localStorage.setItem('selected_owner_id', String(id));
  };

  const [resolvedStores, setResolvedStores] = useState<Record<string, number | string> | null>(null);

  // Fetch all admin/store owners once on mount to build the slug mapping
  useEffect(() => {
    const fetchAllStores = async () => {
      try {
        const adminUsers = await getAdminUsers();
        const mapping: Record<string, number | string> = {};
        await Promise.all(
          adminUsers.map(async (user) => {
            try {
              const storeSettings = await storesService.getStoreByOwner(user.id);
              const storeName = storeSettings?.store_name || user.name || `Store #${user.id}`;
              const slug = storeName.replace(/\s+/g, '_');
              mapping[slug.toLowerCase()] = storeSettings?.hashid || user.id;
            } catch (err) {
              const slug = (user.name || `Store #${user.id}`).replace(/\s+/g, '_');
              mapping[slug.toLowerCase()] = user.id;
            }
          })
        );
        setResolvedStores(mapping);
      } catch (err) {
        console.error('Failed to load store/owner mapping:', err);
        setResolvedStores({}); // Fallback to empty to avoid blocking the UI
      }
    };
    fetchAllStores();
  }, []);

  // Synchronize path and store mapping updates to resolve the ownerUserId and storeName
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isProductPage = currentPath.startsWith('/product');
    const urlOwnerId = params.get('owner') || (!isProductPage ? params.get('id') : null);

    // If we are in the owner control panel and logged in, enforce the logged-in owner's ID
    if (currentPath.startsWith('/owner') && currentPath !== '/owner/menu') {
      if (adminProfile) {
        const expectedId = adminProfile.hashid || adminProfile.id;
        if (String(ownerUserId) !== String(expectedId)) {
          setOwnerUserIdState(expectedId);
        }
        setHasOwnerParam(true);
        // Sync URL parameters if they mismatch
        const urlId = params.get('id') || params.get('owner');
        if (urlId && String(urlId) !== String(expectedId)) {
          params.set('id', String(expectedId));
          if (storeInfo?.store_name) {
            params.set('store', storeInfo.store_name.replace(/\s+/g, '_'));
          }
          const newSearch = params.toString() ? `?${params.toString()}` : '';
          window.history.replaceState(null, '', `/owner${newSearch}`);
        }
      }
      return;
    }

    // Priority 1: Direct ID in URL (the most explicit intent)
    if (urlOwnerId) {
      const parsedId = isNaN(Number(urlOwnerId)) ? urlOwnerId : parseInt(urlOwnerId, 10);
      
      // Block public access to Super Admin (Owner ID 1 or Super_Admin slug) only on public storefront
      const isOwnerPath = currentPath.startsWith('/owner') && currentPath !== '/owner/menu';
      if (!isOwnerPath && (String(parsedId) === '1' || String(params.get('store')).toLowerCase() === 'super_admin')) {
        window.history.replaceState(null, '', '/');
        setCurrentPath('/');
        setHasOwnerParam(false);
        setOwnerUserIdState(OWNER_USER_ID);
        return;
      }

      setOwnerUserIdState(parsedId);
      setHasOwnerParam(true);

      // Try to resolve store name from query OR path
      const urlStore = params.get('store');
      const storeRoute = parseStorePath(currentPath);
      if (urlStore) {
        setStoreNameState(urlStore.replace(/_/g, ' '));
      } else if (storeRoute) {
        setStoreNameState(deslugifyStoreName(storeRoute.storeSlug));
      }
      return;
    }

    // Priority 2: Clean URL Slug resolution
    const storeRoute = parseStorePath(currentPath);
    if (storeRoute && resolvedStores !== null) {
      const ownerId = (resolvedStores || {})[storeRoute.storeSlug.toLowerCase()];
      
      // Check if ownerId exists and is NOT the super admin (owner ID 1)
      if (ownerId && String(ownerId) !== '1' && storeRoute.storeSlug.toLowerCase() !== 'super_admin') {
        setOwnerUserIdState(ownerId);
        setStoreNameState(deslugifyStoreName(storeRoute.storeSlug));
        setHasOwnerParam(true);
      } else {
        // INVALID STORE SLUG - protect the route by redirecting to the main website home page
        window.history.replaceState(null, '', '/');
        setCurrentPath('/');
        setHasOwnerParam(false);
        setOwnerUserIdState(OWNER_USER_ID);
      }
    }
  }, [currentPath, resolvedStores, adminProfile, ownerUserId, storeInfo]);

  // Sync state with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const newPath = window.location.pathname;
      setCurrentPath(newPath);
      const params = new URLSearchParams(window.location.search);
      const isProductPage = newPath.startsWith('/product');
      const urlOwnerId = params.get('owner') || (!isProductPage ? params.get('id') : null);
      const urlStoreName = params.get('store');

      // Check clean URL slug first
      const storeRoute = parseStorePath(newPath);
      if (storeRoute && resolvedStores !== null) {
        const ownerId = (resolvedStores || {})[storeRoute.storeSlug.toLowerCase()];
        if (ownerId) {
          setOwnerUserIdState(ownerId);
          setStoreNameState(deslugifyStoreName(storeRoute.storeSlug));
          setHasOwnerParam(true);
          return;
        } else {
            // Invalid slug on popstate
            window.history.replaceState(null, '', '/');
            setCurrentPath('/');
            setHasOwnerParam(false);
            setOwnerUserIdState(OWNER_USER_ID);
            return;
        }
      }

      // Owner access guard: if owner is logged in and navigated back to menu pages without ?owner= or ?id=
      if (adminProfile && (newPath === '/menu' || newPath === '/owner/menu') && !urlOwnerId) {
        const redirectUrl = getStoreMenuUrl(settings?.store_name || adminProfile?.name || 'Store', adminProfile.hashid || adminProfile.id);
        window.history.replaceState(null, '', redirectUrl);
        setCurrentPath('/menu');
        setOwnerUserIdState(adminProfile.hashid || adminProfile.id);
        setStoreNameState(settings?.store_name || adminProfile?.name || 'Store');
        setHasOwnerParam(true);
        return;
      }

      if (urlOwnerId) {
        const parsedId = isNaN(Number(urlOwnerId)) ? urlOwnerId : parseInt(urlOwnerId, 10);
        setOwnerUserIdState(parsedId);
        localStorage.setItem('selected_owner_id', String(parsedId));
        setHasOwnerParam(true);
      } else if (!isProductPage) {
        // No ?owner or ?id in URL (e.g. back to /) → reset to default owner
        setOwnerUserIdState(OWNER_USER_ID);
        setHasOwnerParam(false);
      }

      if (urlStoreName) {
        setStoreNameState(urlStoreName.replace(/_/g, ' '));
      } else if (!isProductPage) {
        setStoreNameState('');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [adminProfile, settings, resolvedStores]);


  // Initialize tokens from localStorage on mount
  useEffect(() => {
    const syncToken = () => {
      const cachedToken = localStorage.getItem('auth_token') || localStorage.getItem('aura_customer_token');
      setToken(cachedToken);
    };

    syncToken();

    const cachedAdminToken = localStorage.getItem('admin_token');
    if (cachedAdminToken) {
      setAdminToken(cachedAdminToken);
    }
    const cachedMasterToken = localStorage.getItem('master_admin_token');
    if (cachedMasterToken) {
      setMasterAdminToken(cachedMasterToken);
    }

    // Listen for custom token changes
    window.addEventListener('aura_token_changed', syncToken);
    // Listen for standard storage event
    window.addEventListener('storage', syncToken);

    return () => {
      window.removeEventListener('aura_token_changed', syncToken);
      window.removeEventListener('storage', syncToken);
    };
  }, []);

  // Fetch admin/owner profile whenever adminToken is available
  useEffect(() => {
    if (!adminToken) {
      setAdminProfile(null);
      return;
    }
    authService.getCurrentUser(adminToken)
      .then(data => {
        if (data?.user) {
          // Strictly allow only owner or admin role for /owner portal
          if (data.user.role === 'owner' || data.user.role === 'admin') {
            setAdminProfile({ id: data.user.id, hashid: data.user.hashid, name: data.user.name, role: data.user.role });
            if (window.location.pathname.startsWith('/owner') && window.location.pathname !== '/owner/menu') {
              setOwnerUserIdState(data.user.hashid || data.user.id);
            }
          } else {
            console.warn('Unauthorized access to owner portal attempted by role:', data.user.role);
            localStorage.removeItem('admin_token');
            setAdminToken(null);
            setAdminProfile(null);
            toast.error('Access Denied: Owner account required.');
          }
        }
      })
      .catch(() => {
        // Token is invalid/expired — clear it so the login portal renders correctly
        localStorage.removeItem('admin_token');
        setAdminToken(null);
        setAdminProfile(null);
      });
  }, [adminToken]);

  // Periodic heartbeat while customer is logged in to maintain online presence
  useEffect(() => {
    if (!token) return;

    // Trigger initial heartbeat
    authService.heartbeat();

    const interval = setInterval(() => {
      authService.heartbeat();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [token]);

  // Mark customer offline immediately when tab/browser is closed or navigated away
  useEffect(() => {
    if (!token) return;
    const handleOffline = () => {
      authService.markOffline();
    };
    window.addEventListener('pagehide', handleOffline);
    window.addEventListener('beforeunload', handleOffline);
    return () => {
      window.removeEventListener('pagehide', handleOffline);
      window.removeEventListener('beforeunload', handleOffline);
    };
  }, [token]);

  // Fetch master admin profile whenever masterAdminToken is available
  useEffect(() => {
    if (!masterAdminToken) {
      setMasterAdminProfile(null);
      return;
    }
    authService.getCurrentUser(masterAdminToken)
      .then(data => {
        if (data?.user) {
          // Strictly allow only admin role for /admin portal
          if (data.user.role === 'admin') {
            setMasterAdminProfile({ id: data.user.id, name: data.user.name, role: data.user.role });
          } else {
            console.warn('Unauthorized access to master panel attempted by role:', data.user.role);
            localStorage.removeItem('master_admin_token');
            setMasterAdminToken(null);
            setMasterAdminProfile(null);
            toast.error('Access Denied: Master Admin account required.');
          }
        }
      })
      .catch(() => {
        localStorage.removeItem('master_admin_token');
        setMasterAdminToken(null);
        setMasterAdminProfile(null);
      });
  }, [masterAdminToken]);

  // Owner access guard:
  // When an owner/admin is logged in and visits a storefront menu page without
  // a specific ?owner= param, redirect them to their own store URL.
  useEffect(() => {
    // Only applies to storefront menu routes, not the central website or admin panel
    if (currentPath !== '/menu' && currentPath !== '/owner/menu') return;
    if (!adminToken || !adminProfile) return;

    // Owner access guard: if owner is logged in and tries to access static routing, redirect to storefront menu
    if (adminProfile && (currentPath === '/menu' || currentPath === '/owner/menu') && !hasOwnerParam) {
      const redirectUrl = getStoreMenuUrl(storeInfo?.store_name || adminProfile?.name || 'Store', adminProfile.hashid || adminProfile.id);
      window.history.replaceState(null, '', redirectUrl);
      setCurrentPath('/menu');
      setOwnerUserIdState(adminProfile.hashid || adminProfile.id);
      setStoreNameState(storeInfo?.store_name || adminProfile?.name || 'Store');
      setHasOwnerParam(true);
      localStorage.setItem('selected_owner_id', String(adminProfile.hashid || adminProfile.id));
    }
  }, [adminToken, adminProfile, currentPath, storeInfo]);

  // Dashboard URL Sync:
  // When in the /owner control panel, map dashboard path from /owner to /owner?id=...&store=...
  useEffect(() => {
    if (!currentPath.startsWith('/owner') || currentPath === '/owner/menu') return;
    if (!adminToken || !adminProfile || !storeInfo?.store_name) return;

    const params = new URLSearchParams(window.location.search);
    const storeSlug = storeInfo.store_name.replace(/\s+/g, '_');
    const urlStore = params.get('store');
    const urlId = params.get('id') || params.get('owner');
    
    let needsUpdate = false;
    if (urlStore !== storeSlug) {
      params.set('store', storeSlug);
      needsUpdate = true;
    }
    if (String(urlId) !== String(ownerUserId)) {
      params.set('id', String(ownerUserId));
      needsUpdate = true;
    }

    if (needsUpdate || currentPath.includes('=')) {
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      const finalUrl = `/owner${newSearch}`;
      window.history.replaceState(null, '', finalUrl);
      if (currentPath !== '/owner') {
        setCurrentPath('/owner');
      }
    }
  }, [adminToken, adminProfile, currentPath, storeInfo, ownerUserId]);

  // Fetch brand settings when selected owner changes
  useEffect(() => {
    if (window.location.pathname.startsWith('/share/')) {
      return; // Skip standard settings fetch if we are in sharing view
    }
    const loadSettings = async () => {
      try {
        const data = await settingService.getSettings(ownerUserId);
        if (data && data.success) {
          // If we have local settings, check if the store name has changed to decide on update
          // This avoids flickering or overwriting NEW local data with STALE API data
          setSettings(data.settings);

          const local = localStorage.getItem('store_settings');
          if (local) {
            const localParsed = JSON.parse(local);
            // API data wins for all fields (each store has its own server-side values).
            // Only preserve website_theme from local since it's managed client-side.
            const merged = {
              ...data.settings,
              website_theme: data.settings.website_theme || localParsed.website_theme,
            };
            localStorage.setItem('store_settings', JSON.stringify(merged));
          } else {
            localStorage.setItem('store_settings', JSON.stringify(data.settings));
          }
        }
      } catch (err) {
        console.warn('Failed to load system settings from backend database, checking local backup.', err);
        const local = localStorage.getItem('store_settings');
        if (local) {
          try {
            setSettings(JSON.parse(local));
          } catch (e) {
            console.error('Failed to parse local settings backup', e);
          }
        }
      }
    };
    loadSettings();

    // Fetch authentic store details from storesService
    const loadStore = async () => {
      try {
        const data = await storesService.getStoreByOwner(ownerUserId);
        if (data) {
          setStoreInfo(data);
          // Merge to local storage settings backup to preserve website_theme and other specific keys
          const local = localStorage.getItem('store_settings');
          const localParsed = local ? JSON.parse(local) : {};
          const merged = {
            ...localParsed,
            ...data,
            website_theme: data.website_theme || localParsed.website_theme
          };
          localStorage.setItem('store_settings', JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('Failed to load store profile from backend database, checking local backup.', err);
        const local = localStorage.getItem('store_settings');
        if (local) {
          try {
            setStoreInfo(JSON.parse(local));
          } catch (e) {
            console.error('Failed to parse local store backup', e);
          }
        }
      }
    };
    loadStore();

    // Listen for setting changes dispatched from the Admin settings console
    const handleSettingsUpdate = () => {
      const updated = localStorage.getItem('store_settings');
      if (updated) {
        const parsed = JSON.parse(updated);
        setSettings(parsed);
        setStoreInfo((prev: any) => prev ? { ...prev, ...parsed } : parsed);
      }
    };
    window.addEventListener('settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('settings_updated', handleSettingsUpdate);
  }, [ownerUserId]);

  // Sync URL to enforce clean pathname-based URLs (e.g. /OuR20s or /OuR20s/menu) instead of query params
  useEffect(() => {
    if (storeInfo?.store_name) {
      const params = new URLSearchParams(window.location.search);
      const storeRoute = parseStorePath(currentPath);
      const isOwnerPath = currentPath.startsWith('/owner') && currentPath !== '/owner/menu';
      const isCleanHomeOrMenu = currentPath === '/' || currentPath === '/menu' || !!storeRoute;
      const isStorefront = (hasOwnerParam || currentPath === '/menu' || currentPath === '/owner/menu' || !!storeRoute) && !isOwnerPath && isCleanHomeOrMenu;

      if (isStorefront) {
        const storeSlug = storeInfo.store_name.replace(/\s+/g, '_');
        const isMenu = currentPath.includes('/menu') || (storeRoute && storeRoute.isMenu);
        const expectedPath = isMenu ? `/${storeSlug}/menu` : `/${storeSlug}`;

        if (currentPath !== expectedPath || window.location.search) {
          // Replace query parameters with the clean pathname format
          window.history.replaceState(null, '', expectedPath);
          if (expectedPath !== currentPath) {
            setCurrentPath(expectedPath);
          }
          setStoreNameState(storeInfo.store_name);
        }
      }
    }
  }, [storeInfo, currentPath, hasOwnerParam, ownerUserId]);

  // Dynamically update document title & favicon based on store configuration
  useEffect(() => {
    const activeStoreName = storeInfo?.store_name || settings?.store_name;
    if (activeStoreName) {
      document.title = activeStoreName;
    } else {
      document.title = ' Store';
    }

    const updateFavicon = async () => {
      // 1. Check if favicon URL is already in current store/settings objects
      const settingsFavicon = settings?.favicon_url || storeInfo?.favicon_url;
      
      if (settingsFavicon) {
        const resolvedUrl = resolveImageUrl(settingsFavicon);
        storeBrandingService.applyFavicon(`${resolvedUrl}?v=${Date.now()}`);
        return;
      }

      // 2. If not found in memory, attempt a specialized fetch for this owner ID
      if (ownerUserId && ownerUserId !== OWNER_USER_ID) {
        try {
          const remoteFavicon = await storeBrandingService.getFaviconByOwnerId(ownerUserId);
          if (remoteFavicon) {
            storeBrandingService.applyFavicon(`${remoteFavicon}?v=${Date.now()}`);
            return;
          }
        } catch (err) {
          console.warn('Failed to fetch remote favicon', err);
        }
      }

      // 3. Fallback to default
      storeBrandingService.applyFavicon('/favicon.svg');
    };

    updateFavicon();
  }, [settings, storeInfo, ownerUserId]);

  // Programmatic single-page navigation helper
  const navigate = (to: string) => {
    const [pathAndQuery, hash] = to.split('#');
    const [path, query] = pathAndQuery.split('?');

    // If an owner/admin is logged in and tries to navigate to storefront menus without ?owner= or ?id=,
    // intercept and redirect them to their own store URL instead.
    if (adminProfile && (path === '/menu' || path === '/owner/menu')) {
      const params = query ? new URLSearchParams(query) : null;
      const urlOwnerId = params?.get('owner') || params?.get('id');
      if (!urlOwnerId) {
        const storeSlug = (settings?.store_name || adminProfile?.name || 'Store').replace(/\s+/g, '_');
        const redirectUrl = `/${storeSlug}/menu`; // Use clean URL!
        window.history.pushState(null, '', redirectUrl);
        setCurrentPath(`/${storeSlug}/menu`);
        window.dispatchEvent(new CustomEvent('navigation_changed', { detail: { to: redirectUrl } }));
        setOwnerUserIdState(adminProfile.id);
        setStoreNameState(settings?.store_name || adminProfile?.name || 'Store');
        setHasOwnerParam(true);
        localStorage.setItem('selected_owner_id', String(adminProfile.id));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Update browser URL history bar without triggering a reload
    window.history.pushState(null, '', to);
    setCurrentPath(path);
    window.dispatchEvent(new CustomEvent('navigation_changed', { detail: { to } }));

    // Check clean URL slug first
    const storeRoute = parseStorePath(path);
    if (storeRoute) {
      if (Object.keys(resolvedStores || {}).length > 0) {
        const ownerId = (resolvedStores || {})[storeRoute.storeSlug.toLowerCase()];
        if (ownerId) {
          setOwnerUserIdState(ownerId);
          setStoreNameState(deslugifyStoreName(storeRoute.storeSlug));
          setHasOwnerParam(true);
        }
      }
      if (hash) {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const isProductPage = path.startsWith('/product');
    if (query) {
      const params = new URLSearchParams(query);
      const urlOwnerId = params.get('owner') || (!isProductPage ? params.get('id') : null);
      const urlStoreName = params.get('store');
      if (urlOwnerId) {
        // Navigate to a specific owner's storefront
        const parsedId = isNaN(Number(urlOwnerId)) ? urlOwnerId : parseInt(urlOwnerId, 10);
        setOwnerUserIdState(parsedId);
        localStorage.setItem('selected_owner_id', String(parsedId));
        setHasOwnerParam(true);
      } else if (!isProductPage) {
        // No ?owner or ?id param — navigating to main website, reset to default owner
        setOwnerUserIdState(OWNER_USER_ID);
        setHasOwnerParam(false);
      }

      if (urlStoreName) {
        setStoreNameState(urlStoreName.replace(/_/g, ' '));
      } else if (!isProductPage) {
        setStoreNameState('');
      }
    } else {
      // No query string at all — navigating to main website, reset to default owner (if not a product page)
      if (!isProductPage) {
        setOwnerUserIdState(OWNER_USER_ID);
        setStoreNameState('');
        setHasOwnerParam(false);
      }
    }

    // If navigation contains a hash target, scroll to it smoothly
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
    setShowLogin(false);
  };

  const handleLogoutClick = async () => {
    const confirmed = await confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to terminate your active session? You will need to log in again to place new orders.',
      confirmText: 'Log Out',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      // Revoke token on Laravel backend asynchronously
      try {
        if (token) {
          await authService.logout();
        }
      } catch (e) {
        console.warn('Backend session termination failed or was already revoked.', e);
      } finally {
        // Always clear local cache and state regardless of backend API success/failure
        localStorage.removeItem('auth_token');
        localStorage.removeItem('aura_customer_token');
        window.dispatchEvent(new Event('aura_token_changed'));
        setToken(null);
        setShowLogin(false);
      }
    }
  };

  const handleAdminLoginSuccess = (newToken: string) => {
    setAdminToken(newToken);
    navigate('/owner');
  };

  const handleAdminLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Backend admin logout failed:', err);
    }
    localStorage.removeItem('admin_token');
    setAdminToken(null);
    navigate('/owner/login');
  };

  const handleMasterLoginSuccess = (newToken: string) => {
    setMasterAdminToken(newToken);
    localStorage.setItem('master_admin_token', newToken);
    navigate('/admin');
  };

  const handleMasterLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Backend master admin logout failed:', err);
    }
    localStorage.removeItem('master_admin_token');
    setMasterAdminToken(null);
    navigate('/admin');
  };

  // Update document title based on current route context
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isProductPage = currentPath.startsWith('/product');
    const hasOwner = params.has('owner') || (!isProductPage && params.has('id')) || !!parseStorePath(currentPath);

    const updateTitleAndFavicon = async () => {
      // Fetch platform settings for base branding
      let platformName = 'BiteFlow';
      try {
        const platformSettings = await adminSettingApi.getSettings();
        if (platformSettings.platform_name) {
          platformName = platformSettings.platform_name;
        }
        
        // Apply platform favicon for non-owner routes
        if (!hasOwner && platformSettings.favicon_url) {
          storeBrandingService.applyFavicon(resolveImageUrl(platformSettings.favicon_url));
        } else if (!hasOwner) {
          storeBrandingService.applyFavicon('/favicon.svg');
        }
      } catch (err) {
        console.warn('Failed to load platform settings for branding', err);
      }

      if (!hasOwner) {
        const pageTitles: Record<string, string> = {
          '/': platformName,
          '/about': `Platform | ${platformName}`,
          '/restaurants': `Restaurants | ${platformName}`,
          '/features': `Features | ${platformName}`,
          '/join': `Become a Partner | ${platformName}`,
          '/admin': `Platform Admin | ${platformName}`,
        };
        if (pageTitles[currentPath]) {
          document.title = pageTitles[currentPath];
        } else {
          document.title = platformName;
        }
        return;
      }

      // 1. Priority: Authoritative storeInfo from state
      if (storeInfo?.store_name) {
        document.title = storeInfo.store_name;
        return;
      }

      // 2. Secondary: Name from ?store= URL param
      if (storeName && storeName !== 'Food') {
        document.title = storeName;
        return;
      }

      // 3. Fallback: Specialized fetch for the current owner context
      if (ownerUserId && ownerUserId !== OWNER_USER_ID) {
        try {
          const remoteTitle = await storeTitleService.getStoreTitleByOwnerId(ownerUserId);
          if (remoteTitle) {
            document.title = remoteTitle;
            return;
          }
        } catch (err) {
          console.warn('Failed to fetch remote store title', err);
        }
      }

      document.title = `${platformName} Store`;
    };

    updateTitleAndFavicon();
  }, [ownerUserId, storeName, storeInfo, currentPath]);

  const storeRouteInfo = parseStorePath(currentPath);
  const isResolvingStore = storeRouteInfo && Object.keys(resolvedStores || {}).length === 0;

  if (isLoadingShared) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F4F7FE]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 font-kuntomruy">Loading Shared Design...</p>
        </div>
      </div>
    );
  }

  if (isResolvingStore) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F4F7FE]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 font-kuntomruy">Loading Store...</p>
        </div>
      </div>
    );
  }

  // Branch for OAuth Callbacks
  if (currentPath === '/auth/google/callback') {
    return (
      <SocialAuthCallback
        provider="google"
        onSuccess={(t) => setToken(t)}
        onNavigate={navigate}
      />
    );
  }

  if (currentPath === '/auth/facebook/callback') {
    return (
      <SocialAuthCallback
        provider="facebook"
        onSuccess={(t) => setToken(t)}
        onNavigate={navigate}
      />
    );
  }

  // Branch for master super admin views
  if (currentPath.startsWith('/admin')) {
    if (!masterAdminToken) {
      return (
        <>
          <MasterLoginPage
            onLoginSuccess={handleMasterLoginSuccess}
            onNavigate={navigate}
          />
          <Toaster position="top-right" reverseOrder={false} />
        </>
      );
    }

    return (
      <>
        <MasterDashboard
          token={masterAdminToken}
          currentPath={currentPath}
          onNavigate={navigate}
          onLogout={handleMasterLogout}
        />
        <Toaster position="top-right" reverseOrder={false} />
      </>
    );
  }

  // Branch for admin dashboard views
  if (currentPath.startsWith('/owner') && currentPath !== '/owner/menu') {
    if (!adminToken) {
      return (
        <>
          <AdminLoginPage
            onLoginSuccess={handleAdminLoginSuccess}
            onNavigate={navigate}
          />
          <Toaster position="top-right" reverseOrder={false} />
        </>
      );
    }

    return (
      <>
        <AdminDashboard
          token={adminToken}
          currentPath={currentPath}
          onNavigate={navigate}
          onLogout={handleAdminLogout}
        />
        <Toaster position="top-right" reverseOrder={false} />
      </>
    );
  }

  // Standalone Customer Walk-in Display Route
  if (currentPath === '/walkin') {
    return (
      <>
        <CustomerDisplayPage />
        <Toaster position="top-right" reverseOrder={false} />
      </>
    );
  }

  // Main website paths — rendered via CompanyWebsite with the correct page shown
  const MAIN_WEBSITE_PATHS = ['/', '/about', '/restaurants', '/features', '/join', '/pricing', '/register-owner'];
  const isMainWebsitePath = MAIN_WEBSITE_PATHS.includes(currentPath);

  if (isMainWebsitePath && !hasOwnerParam) {
    return (
      <>
        <CompanyWebsite
          onNavigate={navigate}
          currentPath={currentPath}
        />
        <Toaster position="top-right" reverseOrder={false} />
      </>
    );
  }

  // Dynamically select between local shop and online templates based on query param
  const isLocalShop = new URLSearchParams(window.location.search).get('local') === 'true';
  const HomePage = isLocalShop ? HomePageLocal : HomePageOnline;
  const LoginPage = isLocalShop ? LoginPageLocal : LoginPageOnline;

  return (
    <>
      <HomePage
        token={token}
        settings={settings}
        storeInfo={storeInfo}
        currentPath={currentPath}
        onNavigate={navigate}
        onNavigateLogin={() => setShowLogin(true)}
        onLogout={handleLogoutClick}
        ownerUserId={ownerUserId}
        onOwnerChange={setOwnerUserId}
        storeName={storeName}
      />

      {showLogin && (
        <LoginPage
          settings={settings}
          ownerUserId={ownerUserId}
          onLoginSuccess={handleLoginSuccess}
          onNavigateHome={() => setShowLogin(false)}
          onNavigate={navigate}
        />
      )}
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}

interface SocialAuthCallbackProps {
  provider: 'google' | 'facebook';
  onSuccess: (token: string) => void;
  onNavigate: (to: string) => void;
}

const SocialAuthCallback: React.FC<SocialAuthCallbackProps> = ({ provider, onSuccess, onNavigate }) => {
  const [status, setStatus] = useState<'authenticating' | 'success' | 'error'>('authenticating');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const authenticate = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');

        if (!accessToken) {
          throw new Error('No access token returned from identity provider.');
        }

        let email = '';
        let name = '';
        let firstName = '';
        let lastName = '';
        let imageUrl = '';

        if (provider === 'google') {
          const profileRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
          if (!profileRes.ok) throw new Error('Failed to retrieve Google profile.');
          const data = await profileRes.json();
          email = data.email;
          name = data.name;
          firstName = data.given_name || '';
          lastName = data.family_name || '';
          imageUrl = data.picture || '';
        } else {
          const profileRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture.type(large)&access_token=${accessToken}`);
          if (!profileRes.ok) throw new Error('Failed to retrieve Facebook profile.');
          const data = await profileRes.json();
          email = data.email;
          name = data.name;
          firstName = data.first_name || '';
          lastName = data.last_name || '';
          imageUrl = data.picture?.data?.url || '';
        }

        if (!email) {
          throw new Error('Email address is missing from your social profile.');
        }

        const savedOwnerId = localStorage.getItem('oauth_owner_id');
        const savedStoreName = localStorage.getItem('oauth_store_name');
        
        let createdBy: number | string | undefined = undefined;
        if (savedOwnerId) {
          createdBy = isNaN(Number(savedOwnerId)) ? savedOwnerId : parseInt(savedOwnerId, 10);
        }

        // Exchange for Sanctum token
        const res = await client.post<{ success: boolean; token: string; message: string }>('/social-login', {
          email,
          name,
          first_name: firstName,
          last_name: lastName,
          image: imageUrl,
          created_by: createdBy,
        });

        if (!active) return;

        if (res.token) {
          localStorage.setItem('aura_customer_token', res.token);
          window.dispatchEvent(new Event('aura_token_changed'));
          setStatus('success');
          toast.success('Signed in successfully!');
          
          setTimeout(() => {
            // Restore store url
            const storeSlug = (savedStoreName || 'store').replace(/\s+/g, '_');
            const targetUrl = savedOwnerId 
              ? `/?id=${savedOwnerId}&store=${storeSlug}` 
              : '/';
            
            // Clean up oauth variables
            localStorage.removeItem('oauth_owner_id');
            localStorage.removeItem('oauth_store_name');

            // Navigate back
            onNavigate(targetUrl);
          }, 1500);
        } else {
          throw new Error(res.message || 'Verification failed on backend.');
        }
      } catch (err: any) {
        if (!active) return;
        console.error('OAuth callback error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'An error occurred during authentication.');
        toast.error(err.message || 'An error occurred during authentication.');
      }
    };

    authenticate();

    return () => {
      active = false;
    };
  }, [provider, onSuccess, onNavigate]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#F9F9F9] text-[#1C1C1C]">
      <div className="bg-white p-8 rounded-[12px] shadow-2xl max-w-sm w-full text-center space-y-6 animate-modal-zando border border-stone-100">
        {status === 'authenticating' && (
          <>
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
              <div className="absolute inset-0 rounded-full border-4 border-stone-900 border-t-transparent animate-spin" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Verifying Identity</p>
              <h3 className="text-base font-black text-stone-900 mt-1 uppercase tracking-wider">Authenticating...</h3>
              <p className="text-stone-400 text-3xs font-semibold mt-1.5">Exchanging authorization credentials with the runway server.</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-green-500">Access Granted</p>
              <h3 className="text-base font-black text-stone-900 mt-1 uppercase tracking-wider">Welcome back</h3>
              <p className="text-stone-400 text-3xs font-semibold mt-1.5">Preparing your wardrobe and custom styling dashboard.</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✕
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Failed</p>
              <h3 className="text-base font-black text-stone-900 mt-1 uppercase tracking-wider">Authentication Error</h3>
              <p className="text-red-500 text-3xs font-bold mt-2 bg-red-50 py-1.5 px-2.5 rounded-[4px]">{errorMessage}</p>
              <button
                onClick={() => onNavigate('/')}
                className="mt-4 w-full py-2 bg-stone-900 hover:bg-stone-850 text-white font-black text-3xs uppercase tracking-widest rounded-[4px] border-none cursor-pointer transition-colors"
              >
                Return to Store
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;

