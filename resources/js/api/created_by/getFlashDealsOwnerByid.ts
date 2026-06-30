import { client } from '../client';
import type { FlashDealRow } from '../owner/flashDeals';

/**
 * Service to retrieve flash deals for a specific store owner.
 */
export const publicFlashDealsService = {
    /**
     * Fetches active flash deals for a specific owner/store ID.
     * Useful for public storefronts to show current promotions.
     */
    async getFlashDealsByOwnerId(ownerId?: number | string | string, skip = 0, limit = 100): Promise<FlashDealRow[]> {
        const params = new URLSearchParams();
        params.append('skip', String(skip));
        params.append('limit', String(limit));
        params.append('owner_id', String(ownerId));
        params.append('created_by', String(ownerId));

        // Potential endpoints to find public flash deals
        const attempts = [
          { name: 'Public Flash Deals', url: `/flash-deals` }
        ];

        for (const attempt of attempts) {
            try {
                const url = `${attempt.url}?${params.toString()}`;
                const res = await client.get<any>(url, { silent: true });

                const data = Array.isArray(res) ? res : (res?.data || res?.flash_deals || res?.results || []);

                if (Array.isArray(data)) {
                    // STRICT CLIENT-SIDE FILTER: Ensure results belong to the requested owner
                    const filtered = data.filter((deal: any) =>
                        String(deal.created_by) === String(ownerId) ||
                        String(deal.owner_id) === String(ownerId)
                    );

                    // Return filtered data if we found matches or if it's the primary list endpoint
                    if (filtered.length > 0 || (data.length === 0 && attempt.name === 'Public Flash Deals')) {
                        return filtered;
                    }
                }
            } catch (err) {
                // Continue to next attempt
            }
        }

        return [];
    },

    /**
     * Fetches the single most relevant active flash deal for a store.
     */
    async getActiveFlashDeal(ownerId?: number | string | string): Promise<FlashDealRow | null> {
        const deals = await this.getFlashDealsByOwnerId(ownerId, 0, 10);
        // Find the first published deal that is currently active based on dates
        const now = new Date();
        return deals.find(deal => {
            if (!deal.is_published) return false;
            const start = new Date(deal.start_date);
            const end = new Date(deal.end_date);
            return now >= start && now <= end;
        }) || deals[0] || null;
    }
};

