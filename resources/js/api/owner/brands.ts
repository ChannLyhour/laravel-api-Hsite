import { client } from '../client';

export interface Brand {
    id: number;
    name: string;
    logo: string | null;
    status: boolean;
    alt_text?: string | null;
    total_product?: number;
    total_order?: number;
    created_by?: number | string | null;
    created_at?: string;
    updated_at?: string;
}

export const brandsService = {
    async getBrands(limit = 100, skip = 0, ownerId?: number | string): Promise<Brand[]> {
        let url = `/brands?limit=${limit}&skip=${skip}`;
        if (ownerId !== undefined) {
            url += `&created_by=${ownerId}`;
        }
        return await client.get<Brand[]>(url);
    },
    async getMyBrands(limit = 100, skip = 0, ownerId?: number | string): Promise<Brand[]> {
        let url = `/brands/mine?limit=${limit}&skip=${skip}`;
        if (ownerId !== undefined) {
            url += `&created_by=${ownerId}`;
        }
        return await client.get<Brand[]>(url);
    },
    async uploadBrandLogo(file: File): Promise<{ url: string; path: string }> {
        const fd = new FormData();
        fd.append('logo', file);
        return await client.postFormData<{ url: string; path: string }>('/stores/upload-logo', fd);
    },
    async createBrand(data: { 
        name: string; 
        logo?: string; 
        status?: boolean; 
        created_by?: number | string; 
        alt_text?: string 
    }): Promise<Brand> {
        return await client.post<Brand>('/brands', data);
    },
    async updateBrand(id: number, data: { 
        name?: string; 
        logo?: string; 
        status?: boolean; 
        alt_text?: string 
    }): Promise<Brand> {
        return await client.put<Brand>(`/brands/${id}`, data);
    },
    async deleteBrand(id: number): Promise<void> {
        await client.delete(`/brands/${id}`);
    }
};

