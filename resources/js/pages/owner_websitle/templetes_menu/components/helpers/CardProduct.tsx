import React from 'react';
import type { StoreRow } from '@/api/owner/stores';
import { Store_setting } from '@/api/owner/stores';
import { getProductCardByStoreType } from '@/pages/owner_websitle/styleProductCard/hook';

interface CardProductProps {
    item: any;
    ownerUserId?: number | string;
    stores?: StoreRow;
    storeName: string;
    onNavigate?: (to: string) => void;
    addToCart: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
    isFavorited?: boolean;
    onToggleFavorite?: (id: string, name: string) => void;
    customPrice?: number;
    customComparePrice?: number | null;
    enableHover?: boolean;
}

export const CardProduct: React.FC<CardProductProps> = ({
    item,
    stores,
    addToCart,
    isFavorited = false,
    onToggleFavorite,
}) => {
    // Resolve store settings using the helper or passed stores prop
    const storeSettings = stores || Store_setting();
    const storeType = storeSettings?.store_type;

    // Get the appropriate product card layout based on the store type
    const ResolvedCardComponent = getProductCardByStoreType(storeType);

    const handleCardClick = () => {
        window.dispatchEvent(new CustomEvent('open_product_popup', { detail: { productId: String(item.id) } }));
    };

    const handleWishlistToggle = () => {
        if (onToggleFavorite) {
            onToggleFavorite(String(item.id), item.name);
        }
    };

    const handleAddToCart = (product: any, qty?: number) => {
        if (addToCart) {
            const defaultSize = product.sizes?.[0];
            const defaultColor = product.colors?.[0];
            addToCart(product, qty || 1, defaultSize, defaultColor);
        }
    };

    return (
        <ResolvedCardComponent
            product={item}
            onAddToCart={handleAddToCart}
            onBuyNow={handleCardClick}
            isWishlisted={isFavorited}
            onWishlistToggle={handleWishlistToggle}
        />
    );
};
