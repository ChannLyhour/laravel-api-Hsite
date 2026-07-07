import { client } from "./client";

export interface SettingResponse {
    success: boolean;
    settings: {
        store_name: string;
        store_phone: string;
        store_email: string;
        store_address: string;
        tax_percentage: string;
        shipping_fee: string;
        free_shipping_threshold: string;
        subscription_tier: string;
        custom_domain: string;
        logo_url: string;
        favicon_url?: string;
        social_tiktok: string;
        social_facebook: string;
        social_telegram: string;
        website_theme?: string;
        maintenance_mode?: boolean;
        checkout_delivery_address?: 'open' | 'close' | 'null';
        checkout_preferred_contact?: 'open' | 'close' | 'null';
        checkout_note?: 'open' | 'close' | 'null';
        checkout_claim_code?: 'open' | 'close' | 'null';
        guest_checkout?: boolean | string;
        preferred_contact_phone?: boolean | string;
        preferred_contact_telegram?: boolean | string;
        preferred_contact_whatsapp?: boolean | string;
        payment_methods?: any;
        brand_identity_operations?: any;
        financial_configurations?: any;
        store_operations_content?: any;
        checkout_form_visibility?: any;
        firebase_setup?: any;
        pusher_configuration?: any;
        marketing_tools_setup?: any;
        social_login_setup?: any;
        social_login_setup_oauth?: any;
        telegram_bot_notifications?: any;
        otp_email_configuration?: any;
        location_store?: any;
    };
}

export const settingService = {
    /**
     * Fetch store settings for a given owner.
     *
     * Public route: GET /settings?owner_id={id}
     *   → Returns a key-value dict {}. Safe: returns empty {} when no settings exist (no 404).
     *
     * Authenticated route: GET /stores/me
     *   → Returns the full Store model for the logged-in owner.
     */
    async getSettings(ownerId?: number | string): Promise<SettingResponse> {
        let rawSettings: Record<string, any> = {};

        try {
            if (ownerId !== undefined && ownerId !== null) {
                // Public endpoint — returns {} when no settings, never 404
                rawSettings = await client.get<Record<string, any>>(`/settings?owner_id=${ownerId}`);
            } else {
                // Authenticated: get the logged-in owner's store profile
                rawSettings = await client.get<Record<string, any>>('/stores/me');
            }
        } catch {
            // Return safe defaults if both fail
            rawSettings = {};
        }

        return {
            success: true,
            settings: {
                store_name: rawSettings.store_name || '',
                store_phone: rawSettings.store_phone || '',
                store_email: rawSettings.store_email || '',
                store_address: rawSettings.store_address || '',
                tax_percentage: rawSettings.tax_percentage !== undefined && rawSettings.tax_percentage !== null
                    ? String(rawSettings.tax_percentage)
                    : '10',
                shipping_fee: rawSettings.shipping_fee !== undefined && rawSettings.shipping_fee !== null
                    ? String(rawSettings.shipping_fee)
                    : '0',
                free_shipping_threshold: rawSettings.free_shipping_threshold !== undefined && rawSettings.free_shipping_threshold !== null
                    ? String(rawSettings.free_shipping_threshold)
                    : '0',
                subscription_tier: rawSettings.subscription_tier || 'free',
                custom_domain: rawSettings.custom_domain || '',
                logo_url: rawSettings.logo_url || '',
                favicon_url: rawSettings.favicon_url || '',
                social_tiktok: rawSettings.social_tiktok || '#',
                social_facebook: rawSettings.social_facebook || '#',
                social_telegram: rawSettings.social_telegram || '#',
                website_theme: rawSettings.website_theme || '',
                maintenance_mode: rawSettings.maintenance_mode === 'true' || rawSettings.maintenance_mode === true,
                checkout_delivery_address: rawSettings.checkout_delivery_address || 'open',
                checkout_preferred_contact: rawSettings.checkout_preferred_contact || 'open',
                checkout_note: rawSettings.checkout_note || 'open',
                checkout_claim_code: rawSettings.checkout_claim_code || 'open',
                guest_checkout: rawSettings.guest_checkout,
                preferred_contact_phone: rawSettings.preferred_contact_phone === 'true' || rawSettings.preferred_contact_phone === true || rawSettings.preferred_contact_phone === undefined,
                preferred_contact_telegram: rawSettings.preferred_contact_telegram === 'true' || rawSettings.preferred_contact_telegram === true || rawSettings.preferred_contact_telegram === undefined,
                preferred_contact_whatsapp: rawSettings.preferred_contact_whatsapp === 'true' || rawSettings.preferred_contact_whatsapp === true || rawSettings.preferred_contact_whatsapp === undefined,
                payment_methods: rawSettings.payment_methods || {},
                brand_identity_operations: rawSettings.brand_identity_operations || [],
                financial_configurations: rawSettings.financial_configurations || [],
                store_operations_content: rawSettings.store_operations_content || [],
                checkout_form_visibility: rawSettings.checkout_form_visibility || [],
                firebase_setup: rawSettings.firebase_setup || [],
                pusher_configuration: rawSettings.pusher_configuration || [],
                marketing_tools_setup: rawSettings.marketing_tools_setup || [],
                social_login_setup: rawSettings.social_login_setup || [],
                social_login_setup_oauth: rawSettings.social_login_setup_oauth || [],
                telegram_bot_notifications: rawSettings.telegram_bot_notifications || [],
                otp_email_configuration: rawSettings.otp_email_configuration || [],
                location_store: rawSettings.location_store || {
                    store_address: rawSettings.store_address || '',
                    store_latitude: rawSettings.store_latitude ? String(rawSettings.store_latitude) : '',
                    store_longitude: rawSettings.store_longitude ? String(rawSettings.store_longitude) : '',
                },
            }
        };
    },

    /**
     * Update settings.
     * Hits PUT /settings?owner_id={id} if ownerId is specified, or PUT /settings.
     */
    async updateSettings(settings: Record<string, any>, ownerId?: number | string): Promise<any> {
        const url = ownerId !== undefined ? `/settings?owner_id=${ownerId}` : '/settings';
        const payload = ownerId !== undefined ? { ...settings, owner_id: ownerId } : settings;
        return client.put<Record<string, any>>(url, payload);
    }
};
