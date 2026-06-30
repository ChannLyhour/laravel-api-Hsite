import { useState, useCallback, useEffect } from 'react';
import { likesService } from '@/api/owner/likes';
import { nullOrRequest } from '../nullOrRequest';

/**
 * Hook to manage liking/unliking logic for products in the Fashion template.
 * @param productId The ID of the product to like/unlike.
 * @param initialLikesCount The initial number of likes (from product data).
 */
export const useLike = (productId: number, initialLikesCount: number = 0) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Fetch the current like status if the user is logged in.
   */
  useEffect(() => {
    const token = localStorage.getItem('aura_customer_token');
    const resolvedProductId = nullOrRequest(productId);
    if (token && resolvedProductId) {
      likesService.checkProductLikeStatus(resolvedProductId)
        .then(res => setIsLiked(res.is_liked))
        .catch(() => setIsLiked(false));
    }
  }, [productId]);

  /**
   * Toggles the like status of the product.
   * Performs an optimistic update for a snappy UI.
   */
  const toggleLike = useCallback(async () => {
    const token = localStorage.getItem('aura_customer_token');
    if (!token) {
      // Return a status indicating login is required
      return { success: false, error: 'unauthorized' };
    }

    if (isSyncing) return { success: false, error: 'busy' };

    const resolvedProductId = nullOrRequest(productId);
    if (!resolvedProductId) {
      return { success: false, error: 'invalid_product_id' };
    }

    setIsSyncing(true);

    // Optimistic Update: Assume success for immediate feedback
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    setIsLiked(!previousIsLiked);
    setLikesCount(prev => previousIsLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const res = await likesService.toggleProductLike(resolvedProductId);

      // Update with real server data
      setIsLiked(res.is_liked);
      setLikesCount(res.likes_count);

      return { success: true, message: res.message };
    } catch (err) {
      // Rollback on failure
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);

      return { success: false, error: err };
    } finally {
      setIsSyncing(false);
    }
  }, [productId, isLiked, likesCount, isSyncing]);

  return {
    isLiked,
    likesCount,
    isSyncing,
    toggleLike,
    setIsLiked, // Exposed for manual updates if needed
    setLikesCount,
  };
};
