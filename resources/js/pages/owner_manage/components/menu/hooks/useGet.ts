import { useState, useEffect, useCallback } from "react";
import { categoriesService, menuItemsService } from "@/api/owner/categories";
import type { Category, MenuItem } from "@/api/owner/categories";

interface UseGetProps {
    ownerId?: number | string;
    storeId?: number;
    setEditingItem?: React.Dispatch<React.SetStateAction<MenuItem | null>>;
    setShowingItem?: React.Dispatch<React.SetStateAction<MenuItem | null>>;
}

export const useGet = ({
    ownerId,
    storeId,
    setEditingItem,
    setShowingItem,
}: UseGetProps = {}) => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        // Try to load cached data from localStorage first for instant display
        const cacheKeyCats = `menu_cats_${ownerId}_${storeId}`;
        const cacheKeyItems = `menu_items_${ownerId}_${storeId}`;

        try {
            const cachedCats = localStorage.getItem(cacheKeyCats);
            const cachedItems = localStorage.getItem(cacheKeyItems);

            if (cachedCats && cachedItems) {
                setCategories(JSON.parse(cachedCats));
                setItems(JSON.parse(cachedItems));
                setLoading(false); // Hide spinner immediately because we have cached data
            } else {
                setLoading(true);
            }
        } catch (_) {
            setLoading(true);
        }

        try {
            // Fetch fresh data from API
            const [catsResponse, itemsList] = await Promise.all([
                categoriesService.getMyCategories(100, 0, ownerId, storeId),
                menuItemsService.getMenuItems(200, 0, ownerId, storeId),
            ]);

            // Update React state with fresh data
            setCategories(catsResponse.categories);
            setItems(itemsList);

            // Save fresh data to cache for the next page load
            try {
                localStorage.setItem(
                    cacheKeyCats,
                    JSON.stringify(catsResponse.categories),
                );
                localStorage.setItem(cacheKeyItems, JSON.stringify(itemsList));
            } catch (_) {}

            // Sync active view item states with fresh data from itemsList to load addons/details
            if (setEditingItem) {
                setEditingItem((prev) => {
                    if (!prev) return null;
                    const fresh = itemsList.find((i) => i.id === prev.id);
                    return fresh ? fresh : prev;
                });
            }
            if (setShowingItem) {
                setShowingItem((prev) => {
                    if (!prev) return null;
                    const fresh = itemsList.find((i) => i.id === prev.id);
                    return fresh ? fresh : prev;
                });
            }
        } catch (e) {
            console.error("Failed to load menu data:", e);
        } finally {
            setLoading(false);
        }
    }, [ownerId, storeId, setEditingItem, setShowingItem]);

    useEffect(() => {
        loadData();

        const handleCacheCleared = () => {
            loadData();
        };

        window.addEventListener("cache_cleared", handleCacheCleared);
        return () => {
            window.removeEventListener("cache_cleared", handleCacheCleared);
        };
    }, [loadData]);

    // Keep localStorage cache in sync whenever categories or items change (create/edit/delete/toggle status)
    useEffect(() => {
        if (!loading) {
            const cacheKeyCats = `menu_cats_${ownerId}_${storeId}`;
            const cacheKeyItems = `menu_items_${ownerId}_${storeId}`;
            try {
                localStorage.setItem(cacheKeyCats, JSON.stringify(categories));
                localStorage.setItem(cacheKeyItems, JSON.stringify(items));
            } catch (_) {}
        }
    }, [items, categories, loading, ownerId, storeId]);

    useEffect(() => {
        const fetchPlanFeatures = async () => {
            try {
                const res = await fetch("/api/subscriptions/features");
                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem(
                        "biteflow_plan_features",
                        JSON.stringify(data),
                    );
                }
            } catch (_) {}
        };
        fetchPlanFeatures();
    }, []);

    return {
        items,
        setItems,
        categories,
        setCategories,
        loading,
        setLoading,
        loadData,
    };
};
