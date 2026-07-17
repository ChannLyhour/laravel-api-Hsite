import { useMemo } from 'react';
import { slugifyStoreName, isSubdomainMode } from '@Security/Owner/configUrl';

/**
 * Utility helper to generate URLs preserving the owner and store context.
 * Used for all client-facing storefront routes.
 */
export const OwnerURL = {
     /**
      * Generates the home page link with owner context.
      */
     getHome: (storeName: string, ownerId: number | string): string => {
          if (isSubdomainMode()) return '/';
          const slug = slugifyStoreName(storeName);
          if (!slug) return '/';
          return `/${slug}`;
     },

     /**
      * Generates the menu/catalog page link.
      */
     getMenu: (storeName: string, ownerId: number | string): string => {
          if (isSubdomainMode()) return '/menu';
          const slug = slugifyStoreName(storeName);
          if (!slug) return '/menu';
          return `/${slug}/menu`;
     },

     /**
      * Generates the product details page link.
      */
     getProduct: (productId: number | string, storeName: string, ownerId: number | string): string => {
          if (isSubdomainMode()) return `/product?id=${productId}`;
          const slug = slugifyStoreName(storeName);
          return `/${slug}/product?id=${productId}`;
     },

     /**
      * Generates the shop/collection search URL.
      */
     getShop: (storeName: string, ownerId: number | string, options?: { search?: string; categoryId?: number | string }): string => {
          const isSubdomain = isSubdomainMode();
          const slug = slugifyStoreName(storeName);
          let url = isSubdomain ? '/shop' : `/${slug}/shop`;
          let query = '';
          if (options?.search) {
               query += `${query ? '&' : '?'}search=${encodeURIComponent(options.search)}`;
          }
          if (options?.categoryId) {
               query += `${query ? '&' : '?'}category=${options.categoryId}`;
          }
          return `${url}${query}`;
     },

     /**
      * Generates the checkout page link.
      */
     getCheckout: (storeName: string, ownerId: number | string): string => {
          if (isSubdomainMode()) return '/checkout';
          const slug = slugifyStoreName(storeName);
          return `/${slug}/checkout`;
     },

     /**
      * Generates the customer wishlist page link.
      */
     getWishlist: (storeName: string, ownerId: number | string): string => {
          if (isSubdomainMode()) return '/wishlist';
          const slug = slugifyStoreName(storeName);
          return `/${slug}/wishlist`;
     },

     /**
      * Generates the customer profile page link, with optional sub-tab selection (orders, chat, address, etc.).
      */
     getProfile: (storeName: string, ownerId: number | string, tab?: 'profile' | 'orders' | 'giftcard' | 'address' | 'chat'): string => {
          const isSubdomain = isSubdomainMode();
          const slug = slugifyStoreName(storeName);
          let url = isSubdomain ? '/profile' : `/${slug}/profile`;
          if (tab) {
               url += `?tab=${tab}`;
          }
          return url;
     },

     /**
      * Generates the owner panel / login dashboard link.
      */
     getOwnerDashboard: (): string => {
          return '/owner';
     },

     /**
      * Generates the share/QR storefront link.
      */
     getShareLink: (storeName: string, ownerId: number | string): string => {
          if (isSubdomainMode()) return '/share';
          const slug = slugifyStoreName(storeName);
          return `/${slug}/share`;
     }
};

/**
 * A reactive hook that parses the current owner/store context from the browser URL
 * and provides pre-bound helper methods to build paths easily within React components.
 */
export function useOwnerURL(overrideOwnerId?: number | string, overrideStoreName?: string) {
     const { ownerId, storeName, isLocal } = useMemo(() => {
          const params = new URLSearchParams(window.location.search);
          const urlOwnerId = overrideOwnerId || params.get('id') || params.get('owner') || localStorage.getItem('selected_owner_id') || '';
          const urlStoreName = overrideStoreName || params.get('store')?.replace(/_/g, ' ') || '';
          const urlLocal = params.get('local') === 'true';
          return { ownerId: urlOwnerId, storeName: urlStoreName, isLocal: urlLocal };
     }, [window.location.search, overrideOwnerId, overrideStoreName]);

     return useMemo(() => {
          const slug = slugifyStoreName(storeName);
          const appendLocal = (url: string) => {
               if (!isLocal) return url;
               const separator = url.includes('?') ? '&' : '?';
               return `${url}${separator}local=true`;
          };

          return {
               ownerId,
               storeName,
               storeSlug: slug,
               buildLink: (path: string) => {
                    if (isSubdomainMode() || !storeName) return appendLocal(path);
                    const cleanPath = path.split('?')[0].split('#')[0];
                    const hash = path.includes('#') ? `#${path.split('#')[1]}` : '';
                    const search = path.includes('?') ? `?${path.split('?')[1].split('#')[0]}` : '';

                    let result = path;
                    if (cleanPath === '/' || cleanPath === '/home' || cleanPath === '') {
                         result = `/${slug}${search}${hash}`;
                    } else if (cleanPath === '/menu') {
                         result = `/${slug}/menu${search}${hash}`;
                    } else if (cleanPath === '/checkout') {
                         result = `/${slug}/checkout${search}${hash}`;
                    } else if (cleanPath === '/wishlist') {
                         result = `/${slug}/wishlist${search}${hash}`;
                    } else if (cleanPath === '/profile') {
                         result = `/${slug}/profile${search}${hash}`;
                    } else if (cleanPath === '/shop') {
                         result = `/${slug}/shop${search}${hash}`;
                    } else if (cleanPath === '/product') {
                         result = `/${slug}/product${search}${hash}`;
                    } else if (cleanPath === '/categories') {
                         result = `/${slug}/categories${search}${hash}`;
                    } else {
                         const cleanSubPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
                         result = `/${slug}/${cleanSubPath}${search}${hash}`;
                    }
                    return appendLocal(result);
               },
               home: appendLocal(OwnerURL.getHome(storeName, ownerId)),
               menu: appendLocal(OwnerURL.getMenu(storeName, ownerId)),
               wishlist: appendLocal(OwnerURL.getWishlist(storeName, ownerId)),
               checkout: appendLocal(OwnerURL.getCheckout(storeName, ownerId)),
               profile: (tab?: 'profile' | 'orders' | 'giftcard' | 'address' | 'chat') => appendLocal(OwnerURL.getProfile(storeName, ownerId, tab)),
          };
     }, [ownerId, storeName, isLocal]);
}
