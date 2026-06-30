import { useMemo } from 'react';
import { slugifyStoreName } from '@Security/Owner/configUrl';

/**
 * Utility helper to generate URLs preserving the owner and store context.
 * Used for all client-facing storefront routes.
 */
export const OwnerURL = {
     /**
      * Generates the home page link with owner context.
      */
     getHome: (storeName: string, ownerId: number | string): string => {
          const slug = slugifyStoreName(storeName);
          if (!slug) return '/';
          return `/?id=${ownerId}&store=${slug}`;
     },

     /**
      * Generates the menu/catalog page link.
      */
     getMenu: (storeName: string, ownerId: number | string): string => {
          const slug = slugifyStoreName(storeName);
          if (!slug) return '/menu';
          return `/menu?id=${ownerId}&store=${slug}`;
     },

     /**
      * Generates the product details page link.
      */
     getProduct: (productId: number | string, storeName: string, ownerId: number | string): string => {
          const slug = slugifyStoreName(storeName);
          return `/product?id=${productId}&owner=${ownerId}&store=${slug}`;
     },

     /**
      * Generates the shop/collection search URL.
      */
     getShop: (storeName: string, ownerId: number | string, options?: { search?: string; categoryId?: number | string }): string => {
          const slug = slugifyStoreName(storeName);
          let url = `/shop?id=${ownerId}&store=${slug}`;
          if (options?.search) {
               url += `&search=${encodeURIComponent(options.search)}`;
          }
          if (options?.categoryId) {
               url += `&category=${options.categoryId}`;
          }
          return url;
     },

     /**
      * Generates the checkout page link.
      */
     getCheckout: (storeName: string, ownerId: number | string): string => {
          const slug = slugifyStoreName(storeName);
          return `/checkout?owner=${ownerId}&store=${slug}`;
     },

     /**
      * Generates the customer wishlist page link.
      */
     getWishlist: (storeName: string, ownerId: number | string): string => {
          const slug = slugifyStoreName(storeName);
          return `/wishlist?id=${ownerId}&store=${slug}`;
     },

     /**
      * Generates the customer profile page link, with optional sub-tab selection (orders, chat, address, etc.).
      */
     getProfile: (storeName: string, ownerId: number | string, tab?: 'profile' | 'orders' | 'giftcard' | 'address' | 'chat'): string => {
          const slug = slugifyStoreName(storeName);
          let url = `/profile?id=${ownerId}&store=${slug}`;
          if (tab) {
               url += `&tab=${tab}`;
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
          const slug = slugifyStoreName(storeName);
          return `/share?owner_id=${ownerId}&store=${slug}`;
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
                    if (!storeName) return appendLocal(path);
                    const cleanPath = path.split('?')[0].split('#')[0];
                    const hash = path.includes('#') ? `#${path.split('#')[1]}` : '';

                    let result = path;
                    if (cleanPath === '/' || cleanPath === '/home' || cleanPath === '') {
                         result = `/?id=${ownerId}&store=${slug}${hash}`;
                    } else if (cleanPath === '/menu') {
                         result = `/menu?id=${ownerId}&store=${slug}${hash}`;
                    } else if (cleanPath === '/checkout') {
                         result = `/checkout?owner=${ownerId}&store=${slug}${hash}`;
                    } else if (cleanPath === '/wishlist') {
                         result = `/wishlist?id=${ownerId}&store=${slug}${hash}`;
                    } else if (cleanPath === '/profile') {
                         result = `/profile?id=${ownerId}&store=${slug}${hash}`;
                    } else {
                         const separator = path.includes('?') ? '&' : '?';
                         result = `${path}${separator}id=${ownerId}&store=${slug}`;
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
