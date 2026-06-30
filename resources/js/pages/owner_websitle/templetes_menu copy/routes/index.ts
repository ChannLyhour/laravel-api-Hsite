/**
 * Centralized routing helper methods for the Fashion Website template.
 * Generates properly formatted URLs with query parameters to preserve store context.
 */

export const FASHION_ROUTES = {
  /**
   * Generates the home/storefront URL.
   */
  getHome: (storeSlug: string, ownerUserId?: number | string): string => {
    if (ownerUserId) {
      return `/?id=${ownerUserId}&store=${storeSlug}`;
    }
    return `/${storeSlug}`;
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
    if (!options) return base;

    let url = base;
    if (options.search) {
      url += `&search=${encodeURIComponent(options.search)}`;
    }
    if (options.searchParam) {
      url += options.searchParam; // e.g. custom query strings
    }
    if (options.hash) {
      url += options.hash; // e.g. #subcategory_slug
    }
    return url;
  },

  /**
   * Generates the product detail page URL.
   */
  getProduct: (productId: number | string, ownerUserId: number | string | undefined, storeSlug: string): string => {
    return `/product?id=${productId}&owner=${ownerUserId || ''}&store=${storeSlug}`;
  },

  /**
   * Generates the wishlist URL.
   */
  getWishlist: (ownerUserId: number | string | undefined, storeSlug: string): string => {
    return `/wishlist?id=${ownerUserId || ''}&store=${storeSlug}`;
  },

  /**
   * Generates the checkout page URL.
   */
  getCheckout: (ownerUserId: number | string | undefined, storeSlug: string): string => {
    return `/checkout?owner=${ownerUserId || ''}&store=${storeSlug}`;
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
      return `${base}&tab=${tab}`;
    }
    return base;
  },

  /**
   * Generates the owner management dashboard URL.
   */
  getOwnerDashboard: (): string => {
    return '/owner';
  }
};

