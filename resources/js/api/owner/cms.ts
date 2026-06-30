// CMS API — Pages & Posts
import { client } from '@/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PageStatus = 'published' | 'draft';
export type PostStatus = 'published' | 'draft';

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  status: PageStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  body: string | null;
  featured_image: string | null;
  status: PostStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface PageCreate {
  title: string;
  slug: string;
  content: string | null;
  status: PageStatus;
  created_by?: number;
}
export type PageUpdate = Partial<Omit<PageCreate, 'created_by'>>;

export interface PostCreate {
  title: string;
  slug: string;
  body: string | null;
  featured_image: string | null;
  status: PostStatus;
  created_by?: number;
}
export type PostUpdate = Partial<Omit<PostCreate, 'created_by'>>;

// ─── Pages API ────────────────────────────────────────────────────────────────

export const pagesApi = {
  /** Admin: list all pages (all statuses) */
  list: (createdBy?: number | string) => {
    const url = createdBy !== undefined ? `/pages?created_by=${createdBy}` : '/pages';
    return client.get<Page[]>(url);
  },

  /** Public: list only published pages */
  listPublished: () => client.get<Page[]>('/pages/published'),

  /** Get a single page by ID or slug */
  get: (identifier: string | number) => client.get<Page>(`/pages/${identifier}`),

  /** Owner: create a new page */
  create: (data: PageCreate) => client.post<Page>('/pages', data),

  /** Owner: update an existing page */
  update: (id: number, data: PageUpdate) => client.put<Page>(`/pages/${id}`, data),

  /** Owner: delete a page */
  delete: (id: number) => client.delete<{ detail: string }>(`/pages/${id}`),
};

// ─── Posts API ────────────────────────────────────────────────────────────────

export const postsApi = {
  /** Admin: list all posts (all statuses) */
  list: (createdBy?: number | string) => {
    const url = createdBy !== undefined ? `/posts?created_by=${createdBy}` : '/posts';
    return client.get<Post[]>(url);
  },

  /** Public: list only published posts */
  listPublished: () => client.get<Post[]>('/posts/published'),

  /** Get a single post by ID or slug */
  get: (identifier: string | number) => client.get<Post>(`/posts/${identifier}`),

  /** Owner: create a new post */
  create: (data: PostCreate) => client.post<Post>('/posts', data),

  /** Owner: update an existing post */
  update: (id: number, data: PostUpdate) => client.put<Post>(`/posts/${id}`, data),

  /** Owner: delete a post */
  delete: (id: number) => client.delete<{ detail: string }>(`/posts/${id}`),
};

export interface SystemSettings {
  store_name?: string;
  store_phone?: string;
  store_email?: string;
  store_address?: string;
  tax_percentage?: string;
  subscription_tier?: string;
  custom_domain?: string;
  logo_url?: string;
  favicon_url?: string;
  social_tiktok?: string;
  social_facebook?: string;
  social_telegram?: string;
  created_by?: number;
}

// ─── Settings API ─────────────────────────────────────────────────────────────

export const settingsApi = {
  /** Public: fetch settings by owner_id (returns {} safely, never 404) */
  get: (ownerId?: number | string) =>
    ownerId !== undefined
      ? client.get<Record<string, any>>(`/settings?owner_id=${ownerId}`)
      : client.get<Record<string, any>>('/stores/me'),

  /** Owner/Admin: update settings */
  update: (data: Record<string, any>, ownerId?: number | string) => {
    const url = ownerId !== undefined ? `/settings?owner_id=${ownerId}` : '/settings';
    const payload = ownerId !== undefined ? { ...data, owner_id: ownerId } : data;
    return client.put<Record<string, any>>(url, payload);
  },
};



// ─── Utility ─────────────────────────────────────────────────────────────────

/** Convert a title string to a URL-safe slug */
export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}



