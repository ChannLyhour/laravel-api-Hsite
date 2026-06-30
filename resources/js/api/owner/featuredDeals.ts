import { client } from '../client';
import type { MenuItem as Product } from './categories';

export interface FeaturedDealRow {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_image: string | null;
  is_published: boolean;
  created_by: number | null;
  status: 'Active' | 'Expired' | 'Upcoming';
  active_products: number;
  products?: Product[];
  created_at?: string;
  updated_at?: string;
  priority?: number;
}

export const featuredDealsService = {
  /**
   * Fetch all featured deals for the logged-in owner.
   * GET /api/owner/featured-deals/mine
   */
  async getMyFeaturedDeals(skip = 0, limit = 100, createdBy?: number | string): Promise<FeaturedDealRow[]> {
    const qs = new URLSearchParams();
    qs.set('skip', String(skip));
    qs.set('limit', String(limit));
    if (createdBy) qs.set('created_by', String(createdBy));
    return client.get<FeaturedDealRow[]>(`/owner/featured-deals/mine?${qs}`);
  },

  /**
   * Show details of a specific featured deal.
   * GET /api/featured-deals/{id}
   */
  async getFeaturedDeal(id: number): Promise<FeaturedDealRow> {
    return client.get<FeaturedDealRow>(`/featured-deals/${id}`);
  },

  /**
   * Create a new featured deal (using FormData to support image uploads).
   * POST /api/owner/featured-deals
   */
  async createFeaturedDeal(formData: FormData): Promise<FeaturedDealRow> {
    return client.postFormData<FeaturedDealRow>('/owner/featured-deals', formData);
  },

  /**
   * Update an existing featured deal (using putFormData which handles _method=PUT under the hood).
   * POST /api/owner/featured-deals/{id} with _method=PUT
   */
  async updateFeaturedDeal(id: number, formData: FormData): Promise<FeaturedDealRow> {
    return client.putFormData<FeaturedDealRow>(`/owner/featured-deals/${id}`, formData);
  },

  /**
   * Toggle the published status of the featured deal.
   * PUT /api/owner/featured-deals/{id}/toggle
   */
  async toggleFeaturedDeal(id: number): Promise<FeaturedDealRow> {
    return client.put<FeaturedDealRow>(`/owner/featured-deals/${id}/toggle`);
  },

  /**
   * Delete a featured deal.
   * DELETE /api/owner/featured-deals/{id}
   */
  async deleteFeaturedDeal(id: number): Promise<{ detail: string }> {
    return client.delete<{ detail: string }>(`/owner/featured-deals/${id}`);
  },

  /**
   * Associate products with a featured deal.
   * POST /api/owner/featured-deals/{id}/products
   */
  async addProducts(id: number, productIds: number[]): Promise<FeaturedDealRow> {
    return client.post<FeaturedDealRow>(`/owner/featured-deals/${id}/products`, { product_ids: productIds });
  },

  /**
   * Remove a product from a featured deal.
   * DELETE /api/owner/featured-deals/{id}/products/{product_id}
   */
  async removeProduct(id: number, productId: number): Promise<FeaturedDealRow> {
    return client.delete<FeaturedDealRow>(`/owner/featured-deals/${id}/products/${productId}`);
  },
};
