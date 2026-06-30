import { client } from "../client";

export interface ShareResponse {
  success: boolean;
  id: string;
  data: {
    stores: any;
    ownerUserId?: number | string;
  };
}

export const shareService = {
  /**
   * Save the current settings layout and owner ID.
   * POST /api/save-share
   */
  async saveShare(data: { stores: any; ownerUserId?: number | string }): Promise<{ success: boolean; id: string }> {
    return client.post<{ success: boolean; id: string }>('/save-share', data);
  },

  /**
   * Fetch the saved settings layout by ID.
   * GET /api/get-share/{id}
   */
  async getShare(id: string): Promise<ShareResponse> {
    return client.get<ShareResponse>(`/get-share/${id}`);
  }
};


