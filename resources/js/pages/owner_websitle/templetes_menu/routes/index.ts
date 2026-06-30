/**
 * Centralized routing helper methods for the Fashion Website template.
 * Generates properly formatted URLs with query parameters to preserve store context.
 */

const appendLocal = (url: string): string => {
  if (typeof window === 'undefined') return url;
  const isLocal = new URLSearchParams(window.location.search).get('local') === 'true';
  if (!isLocal) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}local=true`;
};

export const FASHION_ROUTES = {
  /**
   * Generates the home/storefront URL.
   */
  getHome: (storeSlug: string, ownerUserId?: number | string): string => {
    if (ownerUserId) {
      return appendLocal(`/?id=${ownerUserId}&store=${storeSlug}`);
    }
    return appendLocal(`/${storeSlug}`);
  },

  /**
   * Generates the shop/collection URL with optional search and category filters.
   */
  getShop: (
    ownerUserId: number | string | undefined,
    storeSlug: string,
    options?: { hash?: string; search?: string; searchParam?: string }
  ): string => {
    const base = `/shop?id=${ownerUserId || ''}&store=${storeSlug}`;
    let url = base;
    if (options) {
      if (options.search) {
        url += `&search=${encodeURIComponent(options.search)}`;
      }
      if (options.searchParam) {
        url += options.searchParam; // e.g. custom query strings
      }
      if (options.hash) {
        url += options.hash; // e.g. #subcategory_slug
      }
    }
    return appendLocal(url);
  },

  /**
   * Generates the product detail page URL.
   */
  getProduct: (productId: number | string, ownerUserId: number | string | undefined, storeSlug: string): string => {
    return appendLocal(`/product?id=${productId}&owner=${ownerUserId || ''}&store=${storeSlug}`);
  },

  /**
   * Generates the wishlist URL.
   */
  getWishlist: (ownerUserId: number | string | undefined, storeSlug: string): string => {
    return appendLocal(`/wishlist?id=${ownerUserId || ''}&store=${storeSlug}`);
  },

  /**
   * Generates the checkout page URL.
   */
  getCheckout: (ownerUserId: number | string | undefined, storeSlug: string): string => {
    return appendLocal(`/checkout?owner=${ownerUserId || ''}&store=${storeSlug}`);
  },

  /**
   * Generates the customer profile/settings URL (with tabs like orders, address, chat, etc.).
   */
  getProfile: (
    ownerUserId: number | string | undefined,
    storeSlug: string,
    tab?: 'profile' | 'orders' | 'giftcard' | 'address' | 'chat'
  ): string => {
    const base = `/profile?id=${ownerUserId || ''}&store=${storeSlug}`;
    if (tab) {
      return appendLocal(`${base}&tab=${tab}`);
    }
    return appendLocal(base);
  },

  /**
   * Generates the owner management dashboard URL.
   */
  getOwnerDashboard: (): string => {
    return '/owner';
  }
};

