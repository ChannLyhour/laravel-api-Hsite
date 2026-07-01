import { client } from '@/api/client';

export interface PageBuilderRow {
  id: number;
  slug: string;
  title: string;
  content_json: any;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PagesBuilderListResponse {
  success: boolean;
  data: PageBuilderRow[];
}

export interface PagesBuilderSaveResponse {
  success: boolean;
  message: string;
  data: PageBuilderRow;
}

export const pagesBuilderApi = {
  /** List all custom pages for the authenticated store owner */
  list: async (): Promise<PageBuilderRow[]> => {
    const res = await client.get<PagesBuilderListResponse>('/owner/pages-builder');
    return res.data || [];
  },

  /** Create or update a custom page layout */
  save: async (data: { id?: number; slug: string; title: string; content_json: any; is_published: boolean }): Promise<PageBuilderRow> => {
    const res = await client.post<PagesBuilderSaveResponse>('/owner/pages-builder', data);
    return res.data;
  },

  /** Delete a custom page layout */
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    return client.delete<{ success: boolean; message: string }>(`/owner/pages-builder/${id}`);
  },
};
