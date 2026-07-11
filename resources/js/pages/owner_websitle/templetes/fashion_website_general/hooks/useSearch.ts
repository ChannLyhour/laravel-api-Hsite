import { useState, useEffect, useMemo } from 'react';
import { menuItemsService } from '@/api/owner/categories';
import type { Root2 } from '@/api/owner/categories';
import { mapToUIItem } from '../utils/priceUtils';

interface UseSearchProps {
    ownerUserId?: number | string | undefined;
    searchQuery: string;
    categories: any[] | undefined;
    limit?: number;
}

export const useSearch = ({ ownerUserId, searchQuery, categories = [], limit }: UseSearchProps) => {
    const [products, setProducts] = useState<Root2[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!ownerUserId) return;

        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const data = await menuItemsService.getMenuItems(100, 0, ownerUserId);
                setProducts((data as unknown as Root2[]) || []);
            } catch (err) {
                console.warn('useSearch: Failed to fetch products', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [ownerUserId]);

    const displayProducts = useMemo(() => {
        return products.map(item => mapToUIItem(item));
    }, [products]);

    const results = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return {
                matchedProducts: [],
                matchedCategories: [],
                allMatchedProducts: [],
                allMatchedCategories: [],
            };
        }

        const allMatchedProducts = displayProducts.filter(product =>
            product.name.toLowerCase().includes(query) ||
            (product.description && product.description.toLowerCase().includes(query))
        );

        const allMatchedCategories = categories.filter(category =>
            category.name.toLowerCase().includes(query)
        );

        const matchedProducts = limit ? allMatchedProducts.slice(0, limit) : allMatchedProducts;
        const matchedCategories = limit ? allMatchedCategories.slice(0, limit) : allMatchedCategories;

        return {
            matchedProducts,
            matchedCategories,
            allMatchedProducts,
            allMatchedCategories,
        };
    }, [searchQuery, displayProducts, categories, limit]);

    return {
        ...results,
        isLoading,
    };
};

