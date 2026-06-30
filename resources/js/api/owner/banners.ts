import { client } from "../client";

export interface BannerRow {
  id: number;
  title: string | null;
  description: string | null;
  image: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export const bannersService = {
  /**
   * Fetch public active banners for a specific owner.
   * GET /api/banners?created_by={ownerId}
   */
  async getPublicBanners(ownerId?: number | string): Promise<BannerRow[]> {
    return client.get<BannerRow[]>(`/banners?created_by=${ownerId}`);
  },

  /**
   * Fetch all banners for the logged-in owner.
   * GET /api/banners/mine
   */
  async getMyBanners(): Promise<BannerRow[]> {
    return client.get<BannerRow[]>('/banners/mine');
  },

  /**
   * Create a new banner (with file upload).
   * POST /api/banners
   */
  async createBanner(formData: FormData): Promise<BannerRow> {
    return client.postFormData<BannerRow>('/banners', formData);
  },

  /**
   * Update an existing banner (with optional file upload).
   * POST /api/banners/{id} with _method=PUT
   */
  async updateBanner(id: number, formData: FormData): Promise<BannerRow> {
    return client.putFormData<BannerRow>(`/banners/${id}`, formData);
  },

  /**
   * Toggle the active status of a banner.
   * PUT /api/banners/{id}/toggle
   */
  async toggleBanner(id: number): Promise<BannerRow> {
    return client.put<BannerRow>(`/banners/${id}/toggle`);
  },

  /**
   * Delete a banner.
   * DELETE /api/banners/{id}
   */
  async deleteBanner(id: number): Promise<{ detail: string }> {
    return client.delete<{ detail: string }>(`/banners/${id}`);
  }
};

