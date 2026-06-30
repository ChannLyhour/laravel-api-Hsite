import { client, API_BASE_URL } from '../client';

export interface TemplateData {
  tpl_code: string;
  title: string;
  description: string | null;
  price: string;
  theme_key: string;
  owned?: boolean;
}

export const templatesService = {
  /**
   * Fetch all active premium templates.
   */
  async listTemplates(): Promise<TemplateData[]> {
    try {
      const response = await client.get<{ success: boolean; data: TemplateData[] }>('/templates');
      return response.data || [];
    } catch (err) {
      console.warn('Failed to fetch templates list', err);
      return [];
    }
  },

  /**
   * Check if a template is purchased by the authenticated user.
   */
  async checkOwned(tplCode: string): Promise<boolean> {
    try {
      const response = await client.get<{ success: boolean; owned: boolean }>(`/templates/${tplCode}/owned`);
      return !!response.owned;
    } catch (err) {
      console.warn(`Failed to check ownership of template ${tplCode}`, err);
      return false;
    }
  },

  /**
   * Record a template purchase on the server.
   */
  async purchaseTemplate(tplCode: string, orderRef: string): Promise<{ success: boolean; download_token?: string; expires_at?: string }> {
    return client.post<{ success: boolean; download_token?: string; expires_at?: string }>(
      `/templates/${tplCode}/purchase`,
      { order_ref: orderRef }
    );
  },

  /**
   * Request a fresh download token for a template the user already purchased.
   */
  async generateDownloadToken(tplCode: string): Promise<{ success: boolean; download_token: string; expires_at: string }> {
    return client.post<{ success: boolean; download_token: string; expires_at: string }>(`/templates/${tplCode}/token`);
  },

  /**
   * Get the absolute download URL for a template download token.
   */
  getDownloadUrl(token: string): string {
    return `${API_BASE_URL}/templates/download/${token}`;
  }
};
