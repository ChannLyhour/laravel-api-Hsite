import { client } from '../client';
import type { MenuItem as Product } from './categories';

export interface FlashDealRow {
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

export const flashDealsService = {
  /**
   * Fetch all flash deals for the logged-in owner.
   * GET /api/owner/flash-deals/mine
   */
  async getMyFlashDeals(skip = 0, limit = 100, createdBy?: number | string): Promise<FlashDealRow[]> {
    const qs = new URLSearchParams();
    qs.set('skip', String(skip));
    qs.set('limit', String(limit));
    if (createdBy) qs.set('created_by', String(createdBy));
    return client.get<FlashDealRow[]>(`/owner/flash-deals/mine?${qs}`);
  },

  /**
   * Show details of a specific flash deal.
   * GET /api/flash-deals/{id}
   */
  async getFlashDeal(id: number): Promise<FlashDealRow> {
    return client.get<FlashDealRow>(`/flash-deals/${id}`);
  },

  /**
   * Create a new flash deal (using FormData to support image uploads).
   * POST /api/owner/flash-deals
   */
  async createFlashDeal(formData: FormData): Promise<FlashDealRow> {
    return client.postFormData<FlashDealRow>('/owner/flash-deals', formData);
  },

  /**
   * Update an existing flash deal (using putFormData which handles _method=PUT under the hood).
   * POST /api/owner/flash-deals/{id} with _method=PUT
   */
  async updateFlashDeal(id: number, formData: FormData): Promise<FlashDealRow> {
    return client.putFormData<FlashDealRow>(`/owner/flash-deals/${id}`, formData);
  },

  /**
   * Toggle the published status of the flash deal.
   * PUT /api/owner/flash-deals/{id}/toggle
   */
  async toggleFlashDeal(id: number): Promise<FlashDealRow> {
    return client.put<FlashDealRow>(`/owner/flash-deals/${id}/toggle`);
  },

  /**
   * Delete a flash deal.
   * DELETE /api/owner/flash-deals/{id}
   */
  async deleteFlashDeal(id: number): Promise<{ detail: string }> {
    return client.delete<{ detail: string }>(`/owner/flash-deals/${id}`);
  },

  /**
   * Associate products with a flash deal.
   * POST /api/owner/flash-deals/{id}/products
   */
  async addProducts(id: number, productIds: number[]): Promise<FlashDealRow> {
    return client.post<FlashDealRow>(`/owner/flash-deals/${id}/products`, { product_ids: productIds });
  },

  /**
   * Remove a product from a flash deal.
   * DELETE /api/owner/flash-deals/{id}/products/{product_id}
   */
  async removeProduct(id: number, productId: number): Promise<FlashDealRow> {
    return client.delete<FlashDealRow>(`/owner/flash-deals/${id}/products/${productId}`);
  },
};
