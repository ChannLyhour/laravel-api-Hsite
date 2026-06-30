import { client } from '../client';
import { getImageUrl } from '../owner/categories';

/**
 * Service to retrieve branding assets (favicon/logo) for a specific store owner.
 */
export const storeBrandingService = {
    /**
     * Fetches the favicon URL for a specific store owner ID.
     * This allows the storefront to dynamically update the browser tab icon.
     */
    async getFaviconByOwnerId(ownerId?: number | string | string): Promise<string | null> {
      const attempts = [
        { name: 'Public Store Info', url: `/stores/owner/${ownerId}` },
        { name: 'Store Me', url: `/stores/me` }
      ];

      for (const attempt of attempts) {
        try {
          const res = await client.get<any>(attempt.url, { silent: true });

          // 1. If it's an array of Key-Value pairs (EAV structure from Store model)
          if (Array.isArray(res)) {
            const faviconRow = res.find(row => 
              row.key === 'favicon' || 
              row.key === 'store_favicon' || 
              row.key === 'favicon_url'
            );
            if (faviconRow?.value) return getImageUrl(faviconRow.value);
          }

          // 2. If it's a direct object with branding fields
          const faviconPath = res?.favicon || res?.store_favicon || res?.branding?.favicon || res?.favicon_url;

          if (faviconPath) {
            return getImageUrl(faviconPath);
          }
        } catch (err) {
          // Continue to next attempt
        }
      }

      return null;
    },

    /**
     * Helper to apply a favicon URL directly to the document head.
     */
    applyFavicon(url: string | null): void {
        if (!url || typeof document === 'undefined') return;

        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");

        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }

        link.href = url;
    }
};

