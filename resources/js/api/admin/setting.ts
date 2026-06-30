import { client } from '../client';

export interface AdminSettings {
  platform_name: string;
  support_email: string;
  maintenance_mode: boolean;
  logo_url?: string;
  favicon_url?: string;
}

export const adminSettingApi = {
  /**
   * Fetch global platform settings (usually stored under a specific system ID or admin profile)
   * For this implementation, we use owner_id=1 as the system-wide settings holder.
   */
  getSettings: async (): Promise<AdminSettings> => {
    let raw: Record<string, any> = {};
    try {
      raw = await client.get<Record<string, any>>('/settings?owner_id=1');
    } catch (err) {
      console.error('Failed to fetch admin settings:', err);
      raw = {};
    }
    return {
      platform_name: raw.platform_name || '',
      support_email: raw.support_email || '',
      maintenance_mode: raw.maintenance_mode === 'true' || raw.maintenance_mode === true,
      logo_url: raw.logo_url || '',
      favicon_url: raw.favicon_url || '',
    };
  },

  /**
   * Update global platform settings
   */
  updateSettings: async (data: Partial<AdminSettings>): Promise<any> => {
    // Ensure we are updating settings for owner_id=1 (the system admin)
    const payload = {
      ...data,
      owner_id: 1,
      // Convert boolean to string if backend expects string for maintenance_mode
      maintenance_mode: data.maintenance_mode !== undefined ? String(data.maintenance_mode) : undefined,
    };
    return client.put<Record<string, any>>('/settings?owner_id=1', payload);
  },

  /**
   * Upload global platform logo
   */
  uploadLogo: async (file: File): Promise<{ url: string; path: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('owner_id', '1');
    return client.postFormData<{ url: string; path: string }>('/settings/upload-logo', formData);
  },

  /**
   * Upload global platform favicon
   */
  uploadFavicon: async (file: File): Promise<{ url: string; path: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('owner_id', '1');
    return client.postFormData<{ url: string; path: string }>('/settings/upload-favicon', formData);
  },
};
