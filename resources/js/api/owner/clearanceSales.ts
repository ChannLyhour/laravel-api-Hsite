import { client } from '../client';
import type { MenuItem as Product } from './categories';

export interface ClearanceProduct extends Product {
  pivot?: {
    clearance_sale_id?: number;
    product_id?: number;
    discount_amount: string | number;
    discount_type: 'flat' | 'percent';
    is_active: boolean;
  };
}

export interface ClearanceSaleRow {
  id: number;
  title: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  discount_type: 'flat' | 'product_wise';
  discount_amount: number | null;
  discount_amount_type: 'flat' | 'percent' | null;
  offer_active_time: 'always' | 'specific_time';
  active_start_time: string | null;
  active_end_time: string | null;
  show_in_home_page: boolean;
  meta_title: string | null;
  meta_description: string | null;
  meta_image: string | null;
  created_by: number | null;
  products?: ClearanceProduct[];
  created_at?: string;
  updated_at?: string;
  priority?: number;
}

export const clearanceSalesService = {
  /**
   * Fetch all clearance sales for the logged-in owner.
   * GET /api/owner/clearance-sales/mine
   */
  async getMyClearanceSales(skip = 0, limit = 100, createdBy?: number | string): Promise<ClearanceSaleRow[]> {
    const qs = new URLSearchParams();
    qs.set('skip', String(skip));
    qs.set('limit', String(limit));
    if (createdBy) qs.set('created_by', String(createdBy));
    return client.get<ClearanceSaleRow[]>(`/owner/clearance-sales/mine?${qs}`);
  },

  /**
   * Show details of a specific clearance sale.
   * GET /api/clearance-sales/{id}
   */
  async getClearanceSale(id: number): Promise<ClearanceSaleRow> {
    return client.get<ClearanceSaleRow>(`/clearance-sales/${id}`);
  },

  /**
   * Create a new clearance sale (using FormData to support image uploads).
   * POST /api/owner/clearance-sales
   */
  async createClearanceSale(formData: FormData): Promise<ClearanceSaleRow> {
    return client.postFormData<ClearanceSaleRow>('/owner/clearance-sales', formData);
  },

  /**
   * Update an existing clearance sale (using putFormData which handles _method=PUT under the hood).
   * POST /api/owner/clearance-sales/{id} with _method=PUT
   */
  async updateClearanceSale(id: number, formData: FormData): Promise<ClearanceSaleRow> {
    return client.putFormData<ClearanceSaleRow>(`/owner/clearance-sales/${id}`, formData);
  },

  /**
   * Toggle the active status of the clearance sale.
   * PUT /api/owner/clearance-sales/{id}/toggle
   */
  async toggleClearanceSale(id: number): Promise<ClearanceSaleRow> {
    return client.put<ClearanceSaleRow>(`/owner/clearance-sales/${id}/toggle`);
  },

  /**
   * Delete a clearance sale.
   * DELETE /api/owner/clearance-sales/{id}
   */
  async deleteClearanceSale(id: number): Promise<{ detail: string }> {
    return client.delete<{ detail: string }>(`/owner/clearance-sales/${id}`);
  },

  /**
   * Associate products with a clearance sale.
   * POST /api/owner/clearance-sales/{id}/products
   */
  async addProducts(id: number, productIds: number[]): Promise<ClearanceSaleRow> {
    return client.post<ClearanceSaleRow>(`/owner/clearance-sales/${id}/products`, { product_ids: productIds });
  },

  /**
   * Update product pivot attributes (discount_amount, discount_type, is_active).
   * PUT /api/owner/clearance-sales/{id}/products/{product_id}
   */
  async updateProductPivot(
    id: number,
    productId: number,
    pivotData: { discount_amount?: number; discount_type?: 'flat' | 'percent'; is_active?: boolean }
  ): Promise<ClearanceSaleRow> {
    return client.put<ClearanceSaleRow>(`/owner/clearance-sales/${id}/products/${productId}`, pivotData);
  },

  /**
   * Remove a product from a clearance sale.
   * DELETE /api/owner/clearance-sales/{id}/products/{product_id}
   */
  async removeProduct(id: number, productId: number): Promise<ClearanceSaleRow> {
    return client.delete<ClearanceSaleRow>(`/owner/clearance-sales/${id}/products/${productId}`);
  },
};
