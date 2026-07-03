import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const getTenantDomain = (): string | null => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;

  // Ignore standard local dev hosts without subdomains
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  // List of root platform domains
  const platformDomains = [
    'lvh.me',
    'store-frontend-v-hsite.vercel.app',
    'vhsite-storefront.vercel.app',
    'vhsite.com',
    'yourplatform.com',
    'laravel-api-hsite.vercel.app'
  ];

  // If the hostname matches one of these platform roots exactly, it's the main platform site
  if (platformDomains.includes(hostname)) {
    return null;
  }

  // Otherwise, it's a tenant subdomain or custom domain (we return the full host including port if present)
  return window.location.host;
};

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
  const location = useLocation();
  const routerNavigate = useNavigate();
  const currentPath = location.pathname;
  const getSettingsKey = (ownerId: number | string) => `store_settings_owner_${ownerId}`;

  const [resolvedStores, setResolvedStores] = useState<Record<string, { id: number | string; name: string }>>(() => {
    try {
      const saved = localStorage.getItem('resolved_stores_cache');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('resolved_stores_cache', JSON.stringify(resolvedStores));
  }, [resolvedStores]);

  const getInitialOwnerId = (): number | string => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isProductPage = window.location.pathname.startsWith('/product');
      const urlOwnerId = params.get('owner') || (!isProductPage ? params.get('id') : null);
      if (urlOwnerId) {
        return isNaN(Number(urlOwnerId)) ? urlOwnerId : parseInt(urlOwnerId, 10);
      }

      const pathname = window.location.pathname;
      if (pathname.startsWith('/owner')) {
        const saved = localStorage.getItem('selected_owner_id');
        if (saved) return isNaN(Number(saved)) ? saved : parseInt(saved, 10);
      }

      const storeRoute = parseStorePath(pathname);
      if (storeRoute) {
        const slugLower = storeRoute.storeSlug.toLowerCase();
        const savedStores = localStorage.getItem('resolved_stores_cache');
        if (savedStores) {
          const parsed = JSON.parse(savedStores);
          if (parsed[slugLower]) {
            return parsed[slugLower].id;
          }
        }
      }
    } catch {
      // ignore
    }
    return OWNER_USER_ID;
  };

  const [settings, setSettings] = useState<SettingResponse['settings'] | null>(() => {
    try {
      const initialOwnerId = getInitialOwnerId();

      // If it's a storefront path slug and we haven't resolved it yet, start as null
      if (initialOwnerId === OWNER_USER_ID && parseStorePath(window.location.pathname) !== null) {
        return null;
      }

      const saved = localStorage.getItem(getSettingsKey(initialOwnerId));
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [storeInfo, setStoreInfo] = useState<StoreRow | null>(() => {
    try {
      const initialOwnerId = getInitialOwnerId();

      if (initialOwnerId === OWNER_USER_ID && parseStorePath(window.location.pathname) !== null) {
        return null;
      }

      const saved = localStorage.getItem(getSettingsKey(initialOwnerId));
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
    return getInitialOwnerId();
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



  const [isResolvingStore, setIsResolvingStore] = useState(() => {
    return getTenantDomain() !== null;
  });
  const hasRequestedTenantRef = useRef(false);
  const hasRequestedSlugRef = useRef<Record<string, boolean>>({});
  const isResolvingStoreRef = useRef(getTenantDomain() !== null);

  // Synchronize path and store mapping updates to resolve the ownerUserId and storeName
  useEffect(() => {
    const params = new URLSearchParams(location.search);
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
          routerNavigate(`/owner${newSearch}`, { replace: true });
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
        routerNavigate('/', { replace: true });
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

    // Priority 2: Subdomain / Custom Domain resolution (On-demand domain lookup)
    const tenantDomain = getTenantDomain();
    if (tenantDomain) {
      const cacheKey = tenantDomain.toLowerCase();
      if (resolvedStores[cacheKey]) {
        const cached = resolvedStores[cacheKey];
        setOwnerUserIdState(cached.id);
        setStoreNameState(cached.name);
        setHasOwnerParam(true);
        setIsResolvingStore(false);
        return;
      }

      if (hasRequestedTenantRef.current) return;
      hasRequestedTenantRef.current = true;

      const resolveTenantDomain = async () => {
        try {
          setIsResolvingStore(true);
          isResolvingStoreRef.current = true;
          const res = await client.get<any>(`/store/resolve-domain?domain=${tenantDomain}`);
          if (res && res.found && res.owner_id) {
            setResolvedStores(prev => ({
              ...prev,
              [cacheKey]: { id: res.owner_id, name: res.store_name }
            }));
            setOwnerUserIdState(res.owner_id);
            setStoreNameState(res.store_name);
            setHasOwnerParam(true);
          } else {
            // Tenant domain not resolved, fallback to path-based default
            setHasOwnerParam(false);
            setOwnerUserIdState(OWNER_USER_ID);
          }
        } catch (err) {
          console.warn('Failed to resolve tenant domain', err);
          setHasOwnerParam(false);
          setOwnerUserIdState(OWNER_USER_ID);
        } finally {
          setIsResolvingStore(false);
          isResolvingStoreRef.current = false;
        }
      };
      resolveTenantDomain();
      return;
    }

    // Priority 3: Clean URL Slug resolution (On-demand lookup via resolveDomain)
    const storeRoute = parseStorePath(currentPath);
    if (storeRoute) {
      const slugLower = storeRoute.storeSlug.toLowerCase();

      // Check if store is already cached in memory
      if (resolvedStores[slugLower]) {
        const cached = resolvedStores[slugLower];
        setOwnerUserIdState(cached.id);
        setStoreNameState(cached.name);
        setHasOwnerParam(true);
        setIsResolvingStore(false);
        return;
      }

      if (hasRequestedSlugRef.current[slugLower]) return;
      hasRequestedSlugRef.current[slugLower] = true;

      const resolveStoreSlug = async () => {
        try {
          setIsResolvingStore(true);
          isResolvingStoreRef.current = true;
          const hostname = window.location.host;
          // Query backend to resolve path-based store info
          const res = await client.get<any>(`/store/resolve-domain?domain=${hostname}/${storeRoute.storeSlug}`);
          if (res && res.found && res.hashid) {
            setResolvedStores(prev => ({
              ...prev,
              [slugLower]: { id: res.hashid, name: res.store_name }
            }));
            setOwnerUserIdState(res.hashid);
            setStoreNameState(res.store_name);
            setHasOwnerParam(true);
          } else {
            // Store not found
            routerNavigate('/', { replace: true });
            setHasOwnerParam(false);
            setOwnerUserIdState(OWNER_USER_ID);
          }
        } catch (err) {
          console.warn('Failed to resolve store slug on-demand', err);
          routerNavigate('/', { replace: true });
          setHasOwnerParam(false);
          setOwnerUserIdState(OWNER_USER_ID);
        } finally {
          setIsResolvingStore(false);
          isResolvingStoreRef.current = false;
        }
      };
      resolveStoreSlug();
    }
  }, [currentPath, resolvedStores, isResolvingStore, adminProfile, ownerUserId, storeInfo]);

  // Sync owner/store state whenever the URL changes (React Router handles popstate internally)
  useEffect(() => {
    const newPath = location.pathname;
    const params = new URLSearchParams(location.search);
    const isProductPage = newPath.startsWith('/product');
    const urlOwnerId = params.get('owner') || (!isProductPage ? params.get('id') : null);
    const urlStoreName = params.get('store');

    // Check clean URL slug first
    const storeRoute = parseStorePath(newPath);
    if (storeRoute && resolvedStores !== null) {
      const slugLower = storeRoute.storeSlug.toLowerCase();
      const ownerId = (resolvedStores || {})[slugLower];
      if (ownerId) {
        setOwnerUserIdState(ownerId.id);
        setStoreNameState(ownerId.name || deslugifyStoreName(storeRoute.storeSlug));
        setHasOwnerParam(true);
        return;
      } else {
        // Only redirect if the slug was already requested and is NOT currently resolving
        const wasRequested = hasRequestedSlugRef.current[slugLower];
        if (wasRequested && !isResolvingStoreRef.current) {
          // Invalid slug on navigation
          routerNavigate('/', { replace: true });
          setHasOwnerParam(false);
          setOwnerUserIdState(OWNER_USER_ID);
          return;
        }
        // Return early to prevent resetting state while resolving is in progress
        return;
      }
    }

    // Owner access guard: if owner is logged in and navigated back to menu pages without ?owner= or ?id=
    if (adminProfile && (newPath === '/menu' || newPath === '/owner/menu') && !urlOwnerId) {
      const redirectUrl = getStoreMenuUrl(settings?.store_name || adminProfile?.name || 'Store', adminProfile.hashid || adminProfile.id);
      routerNavigate(redirectUrl, { replace: true });
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
    } else if (!isProductPage && getTenantDomain() === null && parseStorePath(currentPath) === null) {
      // No ?owner or ?id in URL (e.g. back to /) → reset to default owner
      setOwnerUserIdState(OWNER_USER_ID);
      setHasOwnerParam(false);
    }

    if (urlStoreName) {
      setStoreNameState(urlStoreName.replace(/_/g, ' '));
    } else if (!isProductPage && getTenantDomain() === null && parseStorePath(currentPath) === null) {
      setStoreNameState('');
    }
  }, [location, adminProfile, settings, resolvedStores]);


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
            if (location.pathname.startsWith('/owner') && location.pathname !== '/owner/menu') {
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
      routerNavigate(redirectUrl, { replace: true });
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

    const params = new URLSearchParams(location.search);
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
      routerNavigate(finalUrl, { replace: true });
    }
  }, [adminToken, adminProfile, currentPath, storeInfo, ownerUserId]);

  // Swap active settings when owner changes to prevent bleeding
  const prevOwnerIdRef = useRef<number | string | null>(null);
  useEffect(() => {
    if (ownerUserId) {
      const activeKey = 'store_settings';
      const scopedKey = getSettingsKey(ownerUserId);

      // 1. Save previous owner's settings if they exist in active storage
      if (prevOwnerIdRef.current && prevOwnerIdRef.current !== ownerUserId) {
        const prevActive = localStorage.getItem(activeKey);
        if (prevActive) {
          localStorage.setItem(getSettingsKey(prevOwnerIdRef.current), prevActive);
        }
      }

      // 2. Load new owner's settings from scoped cache
      const cached = localStorage.getItem(scopedKey);
      if (cached) {
        localStorage.setItem(activeKey, cached);
        try {
          const parsed = JSON.parse(cached);
          setSettings(parsed);
          setStoreInfo(parsed);
        } catch (e) {
          console.warn('Failed to parse cached scoped settings', e);
        }
      } else {
        localStorage.removeItem(activeKey);
        setSettings(null);
        setStoreInfo(null);
      }

      window.dispatchEvent(new Event('settings_updated'));
      prevOwnerIdRef.current = ownerUserId;
    }
  }, [ownerUserId]);

  // Fetch brand settings when selected owner changes
  useEffect(() => {
    if (location.pathname.startsWith('/share/')) {
      return; // Skip standard settings fetch if we are in sharing view
    }
    let active = true;

    const loadSettings = async () => {
      try {
        const data = await settingService.getSettings(ownerUserId);
        if (!active) return;
        if (data && data.success) {
          setSettings(data.settings);

          const activeKey = 'store_settings';
          const scopedKey = getSettingsKey(ownerUserId);
          const local = localStorage.getItem(scopedKey);
          let merged = data.settings;
          if (local) {
            const localParsed = JSON.parse(local);
            merged = {
              ...data.settings,
              website_theme: data.settings.website_theme || localParsed.website_theme,
            };
          }
          localStorage.setItem(scopedKey, JSON.stringify(merged));
          localStorage.setItem(activeKey, JSON.stringify(merged));
        }
      } catch (err) {
        if (!active) return;
        console.warn('Failed to load system settings from backend database, checking local backup.', err);
        const scopedKey = getSettingsKey(ownerUserId);
        const local = localStorage.getItem(scopedKey);
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
        if (!active) return;
        if (data) {
          setStoreInfo(data);
          const activeKey = 'store_settings';
          const scopedKey = getSettingsKey(ownerUserId);
          const local = localStorage.getItem(scopedKey);
          const localParsed = local ? JSON.parse(local) : {};
          const merged = {
            ...localParsed,
            ...data,
            website_theme: data.website_theme || localParsed.website_theme
          };
          localStorage.setItem(scopedKey, JSON.stringify(merged));
          localStorage.setItem(activeKey, JSON.stringify(merged));
        }
      } catch (err) {
        if (!active) return;
        console.warn('Failed to load store profile from backend database, checking local backup.', err);
        const scopedKey = getSettingsKey(ownerUserId);
        const local = localStorage.getItem(scopedKey);
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
      const activeKey = 'store_settings';
      const scopedKey = getSettingsKey(ownerUserId);
      const updated = localStorage.getItem(activeKey);
      if (updated) {
        localStorage.setItem(scopedKey, updated);
        const parsed = JSON.parse(updated);
        setSettings(parsed);
        setStoreInfo((prev: any) => prev ? { ...prev, ...parsed } : parsed);
      }
    };
    window.addEventListener('settings_updated', handleSettingsUpdate);
    return () => {
      active = false;
      window.removeEventListener('settings_updated', handleSettingsUpdate);
    };
  }, [ownerUserId]);

  // Sync URL to enforce clean pathname-based URLs (e.g. /OuR20s or /OuR20s/menu) instead of query params
  useEffect(() => {
    if (storeInfo?.store_name) {
      // Prevent stale redirects by verifying storeInfo belongs to the currently resolved owner ID
      const storeOwnerId = storeInfo.hashid || storeInfo.owner_id || storeInfo.created_by;
      if (String(storeOwnerId) !== String(ownerUserId)) {
        return;
      }

      const tenantDomain = getTenantDomain();

      // If we are on a tenant subdomain/custom domain, the clean URL is just / or /menu (no path slug prefix)
      if (tenantDomain) {
        const isMenu = currentPath.includes('/menu');
        const expectedPath = isMenu ? '/menu' : '/';
        if (currentPath !== expectedPath || location.search) {
          routerNavigate(expectedPath, { replace: true });
          setStoreNameState(storeInfo.store_name);
        }
        return;
      }

      const params = new URLSearchParams(location.search);
      const storeRoute = parseStorePath(currentPath);
      const isOwnerPath = currentPath.startsWith('/owner') && currentPath !== '/owner/menu';

      // Only redirect query-param URLs (/?id=...&store=...) or bare home/menu paths to clean slug URLs.
      // Do NOT redirect sub-page paths like /{storeSlug}/shop, /{storeSlug}/product, etc. —
      // those are already in the correct clean format and should be preserved.
      const pathParts = currentPath.split('/').filter(Boolean);
      const subPath = storeRoute && pathParts.length > 1 ? '/' + pathParts.slice(1).join('/') : '';
      const isStoreSubPage = !!storeRoute && subPath !== '' && subPath !== '/menu';

      const isCleanHomeOrMenu = currentPath === '/' || currentPath === '/menu' || (!!storeRoute && !isStoreSubPage);
      const isStorefront = (hasOwnerParam || currentPath === '/menu' || currentPath === '/owner/menu' || !!storeRoute) && !isOwnerPath && isCleanHomeOrMenu && String(ownerUserId) !== '1';

      if (isStorefront) {
        // Enforce using the custom domain slug if it's a path slug (no dots), otherwise fallback to store_name slug
        let storeSlug = storeInfo.custom_domain?.trim();
        if (!storeSlug || storeSlug.includes('.')) {
          storeSlug = storeInfo.store_name.replace(/\s+/g, '_');
        }

        const isMenu = currentPath.includes('/menu') || (storeRoute && storeRoute.isMenu);
        const expectedPath = isMenu ? `/${storeSlug}/menu` : `/${storeSlug}`;

        if (currentPath !== expectedPath || location.search) {
          // Replace query parameters with the clean pathname format
          routerNavigate(expectedPath, { replace: true });
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

  // Programmatic single-page navigation helper (delegates to React Router)
  const navigate = useCallback((to: string) => {
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
        routerNavigate(redirectUrl);
        window.dispatchEvent(new CustomEvent('navigation_changed', { detail: { to: redirectUrl } }));
        setOwnerUserIdState(adminProfile.id);
        setStoreNameState(settings?.store_name || adminProfile?.name || 'Store');
        setHasOwnerParam(true);
        localStorage.setItem('selected_owner_id', String(adminProfile.id));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Navigate via React Router (pushes to history stack)
    routerNavigate(to);
    window.dispatchEvent(new CustomEvent('navigation_changed', { detail: { to } }));

    // Check clean URL slug first
    const storeRoute = parseStorePath(path);
    if (storeRoute) {
      if (Object.keys(resolvedStores || {}).length > 0) {
        const ownerId = (resolvedStores || {})[storeRoute.storeSlug.toLowerCase()];
        if (ownerId) {
          setOwnerUserIdState(ownerId.id);
          setStoreNameState(ownerId.name || deslugifyStoreName(storeRoute.storeSlug));
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
  }, [routerNavigate, adminProfile, settings, resolvedStores]);

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
    const params = new URLSearchParams(location.search);
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
        if (currentPath.startsWith('/auth/')) {
          const providerName = currentPath.includes('google') ? 'Google' : 'Facebook';
          document.title = `${providerName} Login`;
          return;
        }

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

  console.log('App Render State: ' + JSON.stringify({ currentPath, hasOwnerParam, ownerUserId, isMainWebsitePath, settingsTheme: settings?.website_theme }));

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
  const isLocalShop = new URLSearchParams(location.search).get('local') === 'true';
  const HomePage = isLocalShop ? HomePageLocal : HomePageOnline;
  const LoginPage = isLocalShop ? LoginPageLocal : LoginPageOnline;

  // Support clean path storefront routing: e.g. /my_store/checkout -> /checkout
  const storeRoute = parseStorePath(currentPath);
  const storeSlug = storeRoute?.storeSlug || '';
  const normalizedPath = (() => {
    if (!storeSlug) return currentPath;
    const prefix = `/${storeSlug}`;
    if (currentPath === prefix) return '/';
    if (currentPath.startsWith(prefix + '/')) {
      return currentPath.substring(prefix.length);
    }
    return currentPath;
  })();

  return (
    <>
      <HomePage
        token={token}
        settings={settings}
        storeInfo={storeInfo}
        currentPath={normalizedPath}
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
    document.title = provider === 'google' ? 'Google Login' : 'Facebook Login';

    const authenticate = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');

        if (!accessToken) {
          const savedOwnerId = localStorage.getItem('oauth_owner_id');
          const savedStoreName = localStorage.getItem('oauth_store_name');
          const searchParams = new URLSearchParams(window.location.search);
          const urlError = searchParams.get('error') || searchParams.get('error_description');

          // Clean up oauth variables
          localStorage.removeItem('oauth_owner_id');
          localStorage.removeItem('oauth_store_name');

          if (urlError || savedOwnerId) {
            throw new Error(urlError || 'No access token returned from identity provider.');
          }

          const storeSlug = (savedStoreName || 'store').replace(/\s+/g, '_');
          const targetUrl = savedOwnerId
            ? `/?id=${savedOwnerId}&store=${storeSlug}`
            : '/';
          onNavigate(targetUrl);
          return;
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

          if (window.opener) {
            try {
              window.opener.localStorage.setItem('aura_customer_token', res.token);
              window.opener.dispatchEvent(new Event('aura_token_changed'));
            } catch (e) {
              console.error('Failed to notify parent window:', e);
            }
            localStorage.removeItem('oauth_owner_id');
            localStorage.removeItem('oauth_store_name');
            localStorage.removeItem('oauth_store_logo');
            setStatus('success');
            toast.success('Signed in successfully!');
            setTimeout(() => {
              window.close();
            }, 1000);
            return;
          }

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
            localStorage.removeItem('oauth_store_logo');

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

  const savedStoreName = localStorage.getItem('oauth_store_name');
  const storeName = savedStoreName ? savedStoreName.replace(/_/g, ' ') : 'Our20s';
  const firstLetter = storeName.charAt(0).toUpperCase();
  const storeLogo = localStorage.getItem('oauth_store_logo');

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#121212] text-[#E0E0E0] font-sans selection:bg-stone-800">
      <style>{`
        @keyframes custom-progress-anim {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .custom-progress-bar {
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%);
          background-size: 200% 100%;
          animation: custom-progress-anim 1.5s infinite linear;
        }
      `}</style>
      
      <div className="bg-[#1C1C1E] p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-stone-800 flex flex-col space-y-7 relative overflow-hidden select-none animate-modal-zando">
        {/* Top Header Row */}
        <div className="flex items-center gap-2 pb-4 border-b border-stone-800/80">
          {provider === 'google' ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.54l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          )}
          <span className="text-stone-400 text-xs font-bold tracking-wide" style={{ color: '#a8a29e' }}>
            {provider === 'google' ? 'Sign in with Google' : 'Sign in with Facebook'}
          </span>
        </div>

        {/* Center Logo Area */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {storeLogo ? (
            <div className="w-16 h-16 rounded-full bg-white border border-stone-800 flex items-center justify-center shadow-lg relative overflow-hidden p-1.5 animate-modal-zando">
              <img src={storeLogo} alt={storeName} className="max-w-full max-h-full object-contain rounded-full" />
              <div className="absolute -inset-1 rounded-full border border-indigo-500/30 animate-pulse pointer-events-none" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-stone-850 to-stone-900 border border-stone-800 flex items-center justify-center shadow-lg text-2xl font-black text-white relative animate-modal-zando" style={{ color: '#ffffff' }}>
              {firstLetter}
              <div className="absolute -inset-1 rounded-full border border-indigo-500/30 animate-pulse pointer-events-none" />
            </div>
          )}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: '#ffffff' }}>
              {status === 'authenticating' && 'Choose an account'}
              {status === 'success' && 'Welcome Back!'}
              {status === 'error' && 'Authentication Error'}
            </h2>
            <p className="text-xs font-medium" style={{ color: '#a8a29e' }}>
              to continue to <span className="font-semibold" style={{ color: '#ffffff' }}>{storeName}</span>
            </p>
          </div>
        </div>

        {/* Status Body Area */}
        <div className="space-y-4 pt-2">
          {status === 'authenticating' && (
            <div className="space-y-5">
              {/* Account Loader Line */}
              <div className="w-full bg-stone-800 h-1 rounded-full overflow-hidden">
                <div className="h-full rounded-full custom-progress-bar" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#78716c' }}>Exchanging Credentials</p>
                <p className="text-3xs font-semibold leading-relaxed" style={{ color: '#a8a29e' }}>
                  {provider === 'google' 
                    ? 'Verifying account information ...' 
                    : 'Verifying account information ...'}
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg font-bold shadow-md">
                ✓
              </div>
              <div className="text-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#34d399' }}>Access Granted</p>
                <p className="text-3xs font-semibold" style={{ color: '#a8a29e' }}>Preparing your custom styling dashboard...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-red-950/40 text-red-400 border border-red-500/30 flex items-center justify-center text-lg font-bold shadow-md">
                ✕
              </div>
              <div className="w-full text-center space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#f87171' }}>Failed</p>
                <p className="text-3xs font-bold leading-relaxed max-h-24 overflow-y-auto" style={{ color: '#f87171', backgroundColor: 'rgba(69, 10, 10, 0.2)', borderColor: 'rgba(127, 29, 29, 0.3)' }}>
                  {errorMessage}
                </p>
                <button
                  onClick={() => onNavigate('/')}
                  className="w-full py-2 bg-stone-800 hover:bg-stone-750 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-stone-700 cursor-pointer transition-all active:scale-95 outline-none mt-2"
                >
                  Return to Store
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

