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
    data: { stock_qty: number; low_stock_threshold: number | null }
  ): Promise<ProductVariant> {
    return client.put<ProductVariant>(`/products/variants/${variantId}`, data);
  }
};
