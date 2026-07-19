import { client } from '../client';
import { menuItemsService } from './categories';
import type { MenuItem, ProductVariant } from './categories';

export interface StockOverviewStats {
  totalProducts: number;
  totalVariants: number;
  totalStockUnits: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
}

export const stockManagementService = {
  /**
   * Fetch all stock items (products + variants) for an owner.
   */
  async getStockItems(ownerId?: number | string, storeId?: number): Promise<MenuItem[]> {
    return menuItemsService.getMenuItems(250, 0, ownerId, storeId);
  },

  /**
   * Update the stock quantity and low stock threshold for a product variant.
   * PUT /api/products/variants/{id}
   */
  async updateVariantStock(
    variantId: number,
    data: { stock_qty: number; low_stock_threshold: number | null; purchase_price?: number; retail_price?: number }
  ): Promise<ProductVariant> {
    return client.put<ProductVariant>(`/products/variants/${variantId}`, data);
  },

  /**
   * Update a specific stock batch.
   * PUT /api/products/variants/batches/{id}
   */
  async updateStockBatch(
    batchId: number,
    data: { initial_qty: number; remaining_qty: number; purchase_price: number }
  ): Promise<any> {
    return client.put(`/products/variants/batches/${batchId}`, data);
  },

  /**
   * Delete a specific stock batch.
   * DELETE /api/products/variants/batches/{id}
   */
  async deleteStockBatch(batchId: number): Promise<any> {
    return client.delete(`/products/variants/batches/${batchId}`);
  },

  /**
   * Fetch all restock requests from backend API.
   * GET /api/restock-requests
   */
  async getRestockRequests(ownerId?: number | string, storeId?: number, status?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (storeId) params.append('store_id', storeId.toString());
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return client.get<any[]>(`/restock-requests${query}`);
  },

  /**
   * Create a new restock request in backend API.
   * POST /api/restock-requests
   */
  async createRestockRequest(data: {
    product_id: number;
    product_variant_id?: number;
    requested_qty: number;
    notes?: string;
  }): Promise<any> {
    return client.post('/restock-requests', data);
  },

  /**
   * Approve a restock request in backend API.
   * PUT /api/restock-requests/{id}/approve
   */
  async approveRestockRequest(id: number): Promise<any> {
    return client.put(`/restock-requests/${id}/approve`, {});
  },

  /**
   * Decline a restock request in backend API.
   * PUT /api/restock-requests/{id}/decline
   */
  async declineRestockRequest(id: number): Promise<any> {
    return client.put(`/restock-requests/${id}/decline`, {});
  }
};
