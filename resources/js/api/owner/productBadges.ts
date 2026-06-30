import { client } from '../client';

export interface ProductBadge {
    id: number;
    name: string;
    slug: string;
    text_color: string;
    background_color: string;
    status: boolean;
    priority?: number;
    created_by?: number | string | null;
    created_at?: string;
    updated_at?: string;
}

export const productBadgesService = {
    async getProductBadges(limit = 100, skip = 0, created_by?: number | string): Promise<ProductBadge[]> {
        let url = `/product-badges?limit=${limit}&skip=${skip}`;
        if (created_by !== undefined) {
            url += `&created_by=${created_by}`;
        }
        return await client.get<ProductBadge[]>(url);
    },
    async getMyProductBadges(limit = 100, skip = 0): Promise<ProductBadge[]> {
        const url = `/product-badges/mine?limit=${limit}&skip=${skip}`;
        return await client.get<ProductBadge[]>(url);
    },
    async getProductBadge(id: number): Promise<ProductBadge> {
        return await client.get<ProductBadge>(`/product-badges/${id}`);
    },
    async createProductBadge(data: { 
        name: string; 
        slug: string;
        text_color: string;
        background_color: string;
        status?: boolean; 
        priority?: number;
        created_by?: number | string; 
    }): Promise<ProductBadge> {
        return await client.post<ProductBadge>('/product-badges', data);
    },
    async updateProductBadge(id: number, data: { 
        name?: string; 
        slug?: string;
        text_color?: string;
        background_color?: string;
        status?: boolean; 
        priority?: number;
    }): Promise<ProductBadge> {
        return await client.put<ProductBadge>(`/product-badges/${id}`, data);
    },
    async deleteProductBadge(id: number): Promise<void> {
        await client.delete(`/product-badges/${id}`);
    }
};
