import { client } from '@/api/client';

export type PolicyStatus = 'published' | 'draft';

export interface Policy {
  id: number;
  created_by: number;
  title: string;
  slug: string;
  content: string;
  status: PolicyStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface PolicySave {
  title: string;
  slug: string;
  content: string;
  status: PolicyStatus;
}

export const policiesApi = {
  /** Owner: list all policies */
  list: () => client.get<{ success: boolean; data: Policy[] }>('/owner/policies'),

  /** Owner: save a policy (create or update) */
  save: (data: PolicySave) => client.post<{ success: boolean; message: string; data: Policy }>('/owner/policies', data),

  /** Owner: delete a policy */
  delete: (id: number) => client.delete<{ success: boolean; message: string }>(`/owner/policies/${id}`),

  /** Public: get a published policy by owner and slug */
  getPublicPolicy: (ownerId: string | number, slug: string) =>
    client.get<{ success: boolean; data: Policy }>(`/policies/public?owner_id=${ownerId}&slug=${slug}`),

  /** Public: get all published policies for an owner */
  getPublicPoliciesList: (ownerId: string | number) =>
    client.get<{ success: boolean; data: Policy[] }>(`/policies/public?owner_id=${ownerId}`),
};

export const toSlug = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};
