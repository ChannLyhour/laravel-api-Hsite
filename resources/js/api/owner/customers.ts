import { client } from '../client';

export interface Customer {
  id: number;
  user_id: number | null;
  name: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  country?: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  orders_count?: number;
  image?: string | null;
}

export interface CreateCustomerPayload {
  name: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  country?: string;
  password?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  user_id?: number;
}

export interface UpdateCustomerPayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  country?: string;
  password?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  user_id?: number;
}

export const customersService = {
  async getCustomers(skip = 0, limit = 100, ownerId?: number | string): Promise<Customer[]> {
    const params = new URLSearchParams();
    params.append('skip', String(skip));
    params.append('limit', String(limit));
    if (ownerId) {
      params.append('owner_id', String(ownerId));
    }
    return client.get<Customer[]>(`/customers?${params.toString()}`);
  },

  async getCustomer(id: number): Promise<Customer> {
    return client.get<Customer>(`/customers/${id}`);
  },

  async createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
    return client.post<Customer>('/customers', payload);
  },

  async updateCustomer(id: number, payload: UpdateCustomerPayload): Promise<Customer> {
    return client.put<Customer>(`/customers/${id}`, payload);
  },

  async deleteCustomer(id: number): Promise<void> {
    await client.delete(`/customers/${id}`);
  },
};
