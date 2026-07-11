import { useState, useEffect, useCallback } from "react";
import { menuItemsService } from "@/api/owner/categories";
import { ApiError } from "@/api/client";
import { mapToUIItem } from "../utils/priceUtils";

interface UseLimitGetOptions {
  limit?: number;
  ownerUserId?: number | string;
  storeId?: number;
}

/**
 * Custom hook to fetch storefront catalog products with dynamic pagination/limits.
 * Supports loading states, loading-more indicators, pagination boundaries, and reset triggers.
 */
export const useLimitGet = (options: UseLimitGetOptions = {}) => {
  const { limit = 12, ownerUserId, storeId } = options;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchItems = useCallback(
    async (currentOffset: number, isLoadMore = false) => {
      if (!ownerUserId) return;

      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const startTime = Date.now();

        // Fetch menu items from store database catalog
        const rawItems = await menuItemsService.getMenuItems(
          limit,
          currentOffset,
          ownerUserId,
          storeId,
        );

        // Map to UI-ready product item format
        const mappedItems = (rawItems || []).map((item) =>
          mapToUIItem(item as any),
        );

        const elapsed = Date.now() - startTime;
        const remaining = isLoadMore
          ? Math.max(0, 2000 - elapsed)
          : Math.max(0, 3000 - elapsed);

        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        if (isLoadMore) {
          setItems((prev) => [...prev, ...mappedItems]);
        } else {
          setItems(mappedItems);
        }

        // If less items are returned than requested limit, we have reached the end of catalog list
        if (mappedItems.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.details.message || "Failed to fetch items.");
        } else {
          setError("Failed to fetch items.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [limit, ownerUserId, storeId],
  );

  // Initial load or filter/owner change handler
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchItems(0, false);
  }, [ownerUserId, storeId, fetchItems]);

  // Loads more items from the next paginated offset page
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    fetchItems(nextOffset, true);
  }, [loading, loadingMore, hasMore, offset, limit, fetchItems]);

  // Refresh or reset offset pages from the beginning
  const reset = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    fetchItems(0, false);
  }, [fetchItems]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reset,
  };
};
