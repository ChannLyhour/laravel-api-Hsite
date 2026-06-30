import { client } from "../client";

export interface SocialMediaRow {
  id: number;
  name: string;
  link: string;
  status: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export const socialMediaService = {
  /**
   * Fetch public active social media links for a specific owner/restaurant.
   * GET /api/social-media?created_by={ownerId}
   */
  async getPublicSocials(ownerId?: number | string): Promise<SocialMediaRow[]> {
    return client.get<SocialMediaRow[]>(`/social-media?created_by=${ownerId}`);
  },

  /**
   * Fetch all social media links for the logged-in owner.
   * GET /api/social-media/mine
   */
  async getMySocials(): Promise<SocialMediaRow[]> {
    return client.get<SocialMediaRow[]>('/social-media/mine');
  },

  /**
   * Create a new social media link.
   * POST /api/social-media
   */
  async createSocial(data: { name: string; link: string; status?: boolean; created_by?: number }): Promise<SocialMediaRow> {
    return client.post<SocialMediaRow>('/social-media', data);
  },

  /**
   * Update an existing social media link.
   * PUT /api/social-media/{id}
   */
  async updateSocial(id: number, data: { name?: string; link?: string; status?: boolean }): Promise<SocialMediaRow> {
    return client.put<SocialMediaRow>(`/social-media/${id}`, data);
  },

  /**
   * Toggle the active status of a social media link.
   * PUT /api/social-media/{id}/toggle
   */
  async toggleSocial(id: number): Promise<SocialMediaRow> {
    return client.put<SocialMediaRow>(`/social-media/${id}/toggle`);
  },

  /**
   * Delete a social media link.
   * DELETE /api/social-media/{id}
   */
  async deleteSocial(id: number): Promise<{ detail: string }> {
    return client.delete<{ detail: string }>(`/social-media/${id}`);
  }
};

