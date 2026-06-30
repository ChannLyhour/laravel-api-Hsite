import { client } from '../client';

/**
 * Service to retrieve the display name/title for a specific store.
 */
export const storeTitleService = {
    /**
     * Fetches the store name for a given owner ID.
     * This is the primary method used to resolve boutique names for storefronts.
     */
    async getStoreTitleByOwnerId(ownerId?: number | string | string): Promise<string | null> {
        const attempts = [
            { name: 'Public Store Info', url: `/stores/owner/${ownerId}` },
            { name: 'Store Me', url: `/stores/me` }
        ];

        for (const attempt of attempts) {
            try {
                const res = await client.get<any>(attempt.url, { silent: true });

                // 1. If it's an array of Key-Value pairs (EAV structure from Store model)
                if (Array.isArray(res)) {
                    const nameRow = res.find(row =>
                        row.key === 'store_name' ||
                        row.key === 'name' ||
                        row.key === 'title'
                    );
                    if (nameRow?.value) return nameRow.value;
                }

                // 2. Handle various object response structures
                const storeName = res?.store_name || res?.name || res?.title || res?.settings?.store_name;

                if (storeName) {
                    return storeName;
                }
            } catch (err) {
                // Continue searching
            }
        }

        return null;
    },

    /**
     * Fetches the store name directly by its database Store ID.
     */
    async getStoreTitleByStoreId(storeId: number | string): Promise<string | null> {
        try {
            const res = await client.get<any>(`/stores/${storeId}`, { silent: true });
            return res?.store_name || res?.name || null;
        } catch (err) {
            return null;
        }
    }
};

