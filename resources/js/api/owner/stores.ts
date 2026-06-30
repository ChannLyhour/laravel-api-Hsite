import { client } from '../client';

/**
 * Matches the actual database model structure of a single row in the 'stores' table 
 * (D:\Laravel-Tutorial\laravel-api\app\Models\Store.php).
 * The stores table is designed as a generic key-value store.
 */
export interface StoreRow {
  id?: number;
  created_by?: number;
  key: string;
  value: string | null;
  created_at?: string;
  updated_at?: string;
  guest_checkout?: string | boolean;
  [key: string]: any;
}

export const storesService = {
  /**
   * Fetch store profile for owner (either public by ownerId or authenticated `/stores/me`).
   */
  async getStore(ownerId?: number | string): Promise<StoreRow | null> {
    try {
      const url = ownerId !== undefined ? `/stores/owner/${ownerId}` : '/stores/me';
      const data = await client.get<Record<string, any>>(url);
      return data as StoreRow;
    } catch (err) {
      console.warn(`Failed to fetch store settings for owner ${ownerId}`, err);
      return null;
    }
  },

  /**
   * Kept for backwards compatibility if needed elsewhere.
   */
  async getStoreByOwner(ownerId?: number | string): Promise<StoreRow | null> {
    return this.getStore(ownerId);
  },

  /**
   * Update store configuration.
   * Hits PUT /stores/{ownerId} if ownerId is provided, or PUT /stores/me if not.
   */
  async updateStore(data: Record<string, any>, ownerId?: number | string): Promise<any> {
    const url = ownerId !== undefined ? `/stores/${ownerId}` : '/stores/me';
    return client.put<Record<string, any>>(url, data);
  },

  /**
   * Upload brand logo.
   */
  async uploadLogo(file: File): Promise<{ url: string; path: string }> {
    const fd = new FormData();
    fd.append('logo', file);
    return client.postFormData<{ url: string; path: string }>('/stores/upload-logo', fd);
  },

  /**
   * Upload brand favicon.
   */
  async uploadFavicon(file: File): Promise<{ url: string; path: string }> {
    const fd = new FormData();
    fd.append('favicon', file);
    return client.postFormData<{ url: string; path: string }>('/stores/upload-favicon', fd);
  },

  /**
   * Fetch supported payment gateways and their configuration fields.
   */
  async getPaymentGateways(): Promise<any[]> {
    return client.get<any[]>('/stores/payment-gateways');
  }
};

/**
 * Global helper to retrieve store/website settings from localStorage.
 * Unifies the retrieval logic across templates and components.
 */
export const Store_setting = () => {
  try {
    const saved = localStorage.getItem('store_settings');
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to parse Store_setting from localStorage', e);
    return null;
  }
};



