import { client } from '../client';

export interface CartRow {
    id: number;
    user_id: number;
    product_id: number;
    product_variant_id: number | null;
    quantity: number;
    created_by: number;
    created_at: string;
    updated_at: string;
    // Relations typically returned by Laravel with()
    product?: {
        id: number;
        name: string;
        price: string;
        image: string | null;
        display_image: string | null;
        addons?: Array<{
            id: number;
            addon_name: string;
            additional_price: string | number;
            discount?: string | number | null;
            discount_type?: string | null;
            is_default?: boolean;
        }>;
    };
    variant?: {
        id: number;
        sku: string;
        price: string;
        retail_price?: string;
        image_url: string | null;
        /** Eager-loaded attribute values that describe size/color etc. */
        attribute_values?: Array<{
            id: number;
            value: string;
            attribute?: {
                id: number;
                name: string;
            };
        }>;
    };
}

export const cartService = {
    /**
     * View current items in cart.
     */
    getCart: () => client.get<CartRow[]>('/cart'),

    /**
     * Add a product to the cart.
     */
    addToCart: (data: {
        product_id: number;
        product_variant_id?: number | null;
        quantity: number;
    }) => client.post<CartRow>('/cart', data),

    /**
     * Update item quantity.
     */
    updateQuantity: (id: number, quantity: number) =>
        client.put<CartRow>(`/cart/${id}`, { quantity }),

    /**
     * Remove a specific item.
     */
    removeItem: (id: number) => client.delete<void>(`/cart/${id}`),

    /**
     * Empty the entire cart.
     */
    clearCart: () => client.delete<void>('/cart/clear'),
};
