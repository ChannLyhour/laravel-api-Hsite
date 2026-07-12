/**
 * Centralized routing helper methods for the Fashion Website template.
 * Generates properly formatted URLs with query parameters to preserve store context.
 */

export const FASHION_ROUTES = {
  /**
   * Generates the home/storefront URL.
   */
  getHome: (storeSlug: string, ownerUserId?: number | string): string => {
    if (storeSlug) {
      return `/${storeSlug}`;
    }
    if (ownerUserId) {
      return `/?id=${ownerUserId}`;
    }
    return '/';
  },

  /**
   * Generates the shop/collection URL with optional search and category filters.
   */
  getShop: (
    ownerUserId: number | string | undefined,
    storeSlug: string,
    options?: { hash?: string; search?: string; searchParam?: string }
  ): string => {
    const base = storeSlug ? `/${storeSlug}/shop` : `/shop?id=${ownerUserId || ''}`;
    if (!options) return base;

    let url = base;
    const prefix = url.includes('?') ? '&' : '?';

    const paramsList: string[] = [];
    if (options.search) {
      paramsList.push(`search=${encodeURIComponent(options.search)}`);
    }
    if (options.searchParam) {
      paramsList.push(options.searchParam.replace(/^[?&]/, ''));
    }

    if (paramsList.length > 0) {
      url += prefix + paramsList.join('&');
    }
    if (options.hash) {
      url += options.hash; // e.g. #subcategory_slug
    }
    return url;
  },

  /**
   * Generates the categories page URL.
   */
  getCategories: (ownerUserId: number | string | undefined, storeSlug: string): string => {
    return storeSlug ? `/${storeSlug}/categories` : `/categories?id=${ownerUserId || ''}`;
  },

  /**
   * Generates the product detail page URL.
   */
  getProduct: (skuOrId: number | string, ownerUserId: number | string | undefined, storeSlug: string): string => {
    const isId = typeof skuOrId === 'number' || /^\d+$/.test(String(skuOrId));
    if (isId) {
      return storeSlug 
        ? `/${storeSlug}/product?id=${skuOrId}`
        : `/product?id=${skuOrId}&owner=${ownerUserId || ''}`;
    }
    return storeSlug 
      ? `/${storeSlug}/${skuOrId}`
      : `/${skuOrId}`;
  },

  /**
   * Generates the wishlist URL.
   */
  getWishlist: (ownerUserId: number | string | undefined, storeSlug: string): string => {
    return storeSlug ? `/${storeSlug}/wishlist` : `/wishlist?id=${ownerUserId || ''}`;
  },

  /**
   * Generates the checkout page URL.
   */
  getCheckout: (ownerUserId: number | string | undefined, storeSlug: string): string => {
    return storeSlug ? `/${storeSlug}/checkout` : `/checkout?owner=${ownerUserId || ''}`;
  },

  /**
   * Generates the customer profile/settings URL (with tabs like orders, address, chat, etc.).
   */
  getProfile: (
    ownerUserId: number | string | undefined,
    storeSlug: string,
    tab?: 'profile' | 'orders' | 'giftcard' | 'address' | 'chat'
  ): string => {
    const base = storeSlug ? `/${storeSlug}/profile` : `/profile?id=${ownerUserId || ''}`;
    if (tab) {
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}tab=${tab}`;
    }
    return base;
  },

  /**
   * Generates the offers/promotions page URL.
   */
  getOffers: (
    ownerUserId: number | string | undefined,
    storeSlug: string,
    tab?: 'coupons' | 'flash' | 'featured' | 'clearance'
  ): string => {
    const base = storeSlug ? `/${storeSlug}/offers` : `/offers?id=${ownerUserId || ''}`;
    if (tab) {
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}tab=${tab}`;
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
