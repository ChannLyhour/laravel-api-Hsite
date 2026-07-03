import { client } from '../client';

export interface ShippingAddress {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  telephone: string;
  address: string;
  country: string | null;
  city_province: string;
  set_as_default: boolean;
  latitude?: number | string | null;
  longitude?: number | string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddressPayload {
  first_name?: string;
  last_name?: string;
  telephone: string;
  address: string;
  country?: string;
  city_province: string;
  set_as_default?: boolean;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export const shippingAddressesService = {
  async getAddresses(): Promise<ShippingAddress[]> {
    return client.get<ShippingAddress[]>('/shipping-addresses');
  },

  async getAddress(id: number): Promise<ShippingAddress> {
    return client.get<ShippingAddress>(`/shipping-addresses/${id}`);
  },

  async createAddress(payload: ShippingAddressPayload): Promise<ShippingAddress> {
    return client.post<ShippingAddress>('/shipping-addresses', payload);
  },

  async updateAddress(id: number, payload: ShippingAddressPayload): Promise<ShippingAddress> {
    return client.put<ShippingAddress>(`/shipping-addresses/${id}`, payload);
  },

  async deleteAddress(id: number): Promise<void> {
    await client.delete(`/shipping-addresses/${id}`);
  },

  async setDefault(id: number): Promise<ShippingAddress> {
    return client.put<ShippingAddress>(`/shipping-addresses/${id}/set-default`);
  },
};
