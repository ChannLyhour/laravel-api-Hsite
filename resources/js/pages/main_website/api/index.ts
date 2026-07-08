import { client } from '@/api/client';

export interface PublicStore {
  id: number;
  owner_id: number;
  created_by: number;
  hashid: string;
  name: string;
  logo_url: string;
  products: number;
}

/**
 * Fetch the complete list of active public stores
 */
export const getPublicStores = async (): Promise<PublicStore[]> => {
  return await client.get<PublicStore[]>('/stores/public-list');
};

/**
 * Step-by-step registration: Create user record
 */
export const registerOwnerUser = async (data: Record<string, any>): Promise<any> => {
  return await client.post<any>('/register', data);
};

/**
 * Step-by-step registration: Create associated store record
 */
export const createStore = async (data: Record<string, any>): Promise<any> => {
  return await client.post<any>('/stores', data);
};

/**
 * Atomic registration: Create owner user & store settings in one transaction
 */
export const registerOwnerAtomic = async (data: Record<string, any>): Promise<any> => {
  return await client.post<any>('/register-owner', data);
};

/**
 * Save selected store type to user settings
 */
export const saveStoreType = async (selectedType: string, token: string): Promise<any> => {
  return await client.put(
    '/stores/me',
    { store_type: selectedType },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
