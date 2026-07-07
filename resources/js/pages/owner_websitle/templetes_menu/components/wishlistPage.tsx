import React, { useState, useEffect } from 'react';
import { ListProductLike } from './ListProductLike';
import type { Root2 } from '@/api/owner/categories';
import type { StoreRow } from '@/api/owner/stores';

interface WishlistPageProps {
    ownerUserId?: number | string;
    storeName?: string;
    stores?: StoreRow;
    addToCart: (item: any, qty?: number, size?: string, color?: string) => void;
    onNavigate?: (to: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
    ownerUserId,
    storeName = '',
    stores,
    addToCart,
    onNavigate,
}) => {
    const [wishlistItems, setWishlistItems] = useState<Root2[]>([]);

    useEffect(() => {
        const loadWishlist = () => {
            try {
                const saved = localStorage.getItem('aura_wishlist');
                if (saved) {
                    setWishlistItems(JSON.parse(saved));
                } else {
                    setWishlistItems([]);
                }
            } catch (err) {
                console.error('Failed to load wishlist', err);
            }
        };

        loadWishlist();

        // Listen for storage changes
        window.addEventListener('storage', loadWishlist);
        window.addEventListener('aura_wishlist_updated', loadWishlist);

        return () => {
            window.removeEventListener('storage', loadWishlist);
            window.removeEventListener('aura_wishlist_updated', loadWishlist);
        };
    }, []);

    const favoritesMap = React.useMemo(() => {
        const map: Record<string, boolean> = {};
        wishlistItems.forEach((item) => {
            map[String(item.id)] = true;
        });
        return map;
    }, [wishlistItems]);

    const handleToggleFavorite = (id: string, name: string) => {
        // Remove item from wishlist
        const updated = wishlistItems.filter((item) => String(item.id) !== id);
        setWishlistItems(updated);
        localStorage.setItem('aura_wishlist', JSON.stringify(updated));
        
        // Dispatch event so other components (like Navbar) update immediately
        window.dispatchEvent(new Event('aura_wishlist_updated'));
    };

    return (
        <ListProductLike
            items={wishlistItems}
            favorites={favoritesMap}
            toggleFavorite={handleToggleFavorite}
            addToCart={addToCart}
            onNavigate={onNavigate}
            storeName={storeName}
            stores={stores}
            ownerUserId={ownerUserId}
        />
    );
};
