import { client } from '../client';

/**
 * Interface for the response from the like toggle operation.
 */
export interface LikeResponse {
  message: string;
  is_liked: boolean;
  likes_count: number;
}

/**
 * Service to handle liking and unliking resources (e.g., products).
 */
export const likesService = {
  /**
   * Toggles the like status of a specific product for the authenticated user.
   * Hits POST /api/products/{id}/like
   */
  async toggleProductLike(productId: number): Promise<LikeResponse> {
    try {
      // Assuming the Laravel backend has a toggle route for likes on products
      return await client.post<LikeResponse>(`/products/${productId}/like`, {});
    } catch (err) {
      console.error(`Failed to toggle like for product ${productId}`, err);
      throw err;
    }
  },

  /**
   * Checks if a product is liked by the current user.
   * Hits GET /api/products/{id}/like-status
   */
  async checkProductLikeStatus(productId: number): Promise<{ is_liked: boolean }> {
    try {
      return await client.get<{ is_liked: boolean }>(`/products/${productId}/like-status`);
    } catch (err) {
      // If unauthorized or error, return not liked
      return { is_liked: false };
    }
  },

  /**
   * Gets a list of product IDs liked by the current user.
   * Hits GET /api/products/liked
   */
  async getMyLikedProductIds(): Promise<number[]> {
    try {
      // This endpoint should return an array of IDs or objects with likeable_id
      const res = await client.get<any[]>('/products/liked');
      if (Array.isArray(res)) {
        return res.map(item => typeof item === 'number' ? item : (item.likeable_id || item.id));
      }
      return [];
    } catch (err) {
      return [];
    }
  }
};

