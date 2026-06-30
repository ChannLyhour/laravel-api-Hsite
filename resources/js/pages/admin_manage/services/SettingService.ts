import { client } from '@/api/client';

export interface PlatformLink {
    label: string;
    url: string;
}

export interface PlatformFooterSettings {
    // Platform Info
    platform_name: string;
    platform_description: string;
    status_label: string;
    is_online: boolean;
    logo_url?: string;
    favicon_url?: string;

    // Navigation Links
    platform_links: PlatformLink[];
    top_stores: PlatformLink[];
    merchant_access_links: PlatformLink[];

    // Footer Bottom
    copyright_text: string;
    terms_url: string;
    privacy_policy_url: string;
}

export const SettingService = {
    /**
     * Fetch comprehensive footer and platform settings
     */
    getFooterSettings: async (): Promise<PlatformFooterSettings> => {
        try {
            // Assuming these are stored in the general settings table for system admin (owner_id=1)
            const raw = await client.get<Record<string, any>>('/settings?owner_id=1');

            return {
                platform_name: raw.platform_name || 'Prime Website',
                platform_description: raw.platform_description || "Siem Reap's ultra-premium Multi-store Restaurant Food Ordering & Management System Platform. Engineered for the next generation of culinary excellence.",
                status_label: raw.status_label || 'Platform Online',
                is_online: raw.is_online !== undefined ? (raw.is_online === 'true' || raw.is_online === true) : true,
                logo_url: raw.logo_url || '',
                favicon_url: raw.favicon_url || '',

                // Parse arrays from strings if stored that way in DB
                platform_links: typeof raw.platform_links === 'string' ? JSON.parse(raw.platform_links) : (raw.platform_links || [
                    { label: 'Merchant Panel', url: '#about' },
                    { label: 'Isolated Outlets', url: '#features' },
                    { label: 'Digital Categories', url: '#restaurants' },
                    { label: 'Become a Partner', url: '#join' },
                ]),

                top_stores: typeof raw.top_stores === 'string' ? JSON.parse(raw.top_stores) : (raw.top_stores || [
                    { label: 'Food Ordering System', url: '/Food_Ordering_System' },
                    { label: 'Chivorn Store kh', url: '/Chivorn_Store_kh' },
                ]),

                merchant_access_links: typeof raw.merchant_access_links === 'string' ? JSON.parse(raw.merchant_access_links) : (raw.merchant_access_links || [
                    { label: 'Owner login portal', url: '/owner/login' },
                    { label: 'Restaurant dashboard', url: '/owner' },
                ]),

                copyright_text: raw.copyright_text || 'Prime Website Platform. All Rights Reserved.',
                terms_url: raw.terms_url || '#',
                privacy_policy_url: raw.privacy_policy_url || '#',
            };
        } catch (error) {
            console.error('Failed to fetch footer settings:', error);
            // Return defaults if request fails
            return {
                platform_name: 'Prime Website',
                platform_description: "Siem Reap's ultra-premium Multi-store Restaurant Food Ordering & Management System Platform.",
                status_label: 'Platform Online',
                is_online: true,
                logo_url: '',
                favicon_url: '',
                platform_links: [
                    { label: 'Merchant Panel', url: '#about' },
                    { label: 'Isolated Outlets', url: '#features' },
                    { label: 'Digital Categories', url: '#restaurants' },
                    { label: 'Become a Partner', url: '#join' },
                ],
                top_stores: [
                    { label: 'Food Ordering System', url: '/Food_Ordering_System' },
                    { label: 'Chivorn Store kh', url: '/Chivorn_Store_kh' },
                ],
                merchant_access_links: [
                    { label: 'Owner login portal', url: '/owner/login' },
                    { label: 'Restaurant dashboard', url: '/owner' },
                ],
                copyright_text: 'Prime Website Platform. All Rights Reserved.',
                terms_url: '#',
                privacy_policy_url: '#',
            };
        }
    },

    /**
     * Update footer and platform settings
     */
    updateFooterSettings: async (data: Partial<PlatformFooterSettings>): Promise<any> => {
        const payload: Record<string, any> = { ...data, owner_id: 1 };

        // Ensure complex types are stringified for standard key-value storage if necessary
        if (data.platform_links) payload.platform_links = JSON.stringify(data.platform_links);
        if (data.top_stores) payload.top_stores = JSON.stringify(data.top_stores);
        if (data.merchant_access_links) payload.merchant_access_links = JSON.stringify(data.merchant_access_links);
        if (data.is_online !== undefined) payload.is_online = String(data.is_online);

        return client.put<Record<string, any>>('/settings?owner_id=1', payload);
    }
};
