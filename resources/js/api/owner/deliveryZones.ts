import { client } from "../client";

export interface DeliveryZone {
  id: number;
  name: string;
  code: string;
  description: string | null;
  type?: 'radius' | 'polygon';
  center_lat?: number | string | null;
  center_lng?: number | string | null;
  radius_km?: number | string | null;
  polygon_coordinates?: any;
  delivery_fee: string | number;
  estimated_delivery_time: string | null;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export const deliveryZonesService = {
  /**
   * Fetch active delivery zones for a specific owner.
   * GET /api/delivery-zones?created_by={ownerId}
   */
  async getPublicDeliveryZones(ownerId?: number | string): Promise<DeliveryZone[]> {
    return client.get<DeliveryZone[]>(`/delivery-zones?created_by=${ownerId}`);
  },

  /**
   * Fetch all delivery zones for the logged-in owner.
   * GET /api/owner/delivery-zones/mine
   */
  async getMyDeliveryZones(): Promise<DeliveryZone[]> {
    return client.get<DeliveryZone[]>('/owner/delivery-zones/mine');
  },

  /**
   * Create a new delivery zone.
   * POST /api/owner/delivery-zones
   */
  async createDeliveryZone(payload: Partial<DeliveryZone>): Promise<DeliveryZone> {
    return client.post<DeliveryZone>('/owner/delivery-zones', payload);
  },

  /**
   * Update an existing delivery zone.
   * PUT /api/owner/delivery-zones/{id}
   */
  async updateDeliveryZone(id: number, payload: Partial<DeliveryZone>): Promise<DeliveryZone> {
    return client.put<DeliveryZone>(`/owner/delivery-zones/${id}`, payload);
  },

  /**
   * Toggle the active status of a delivery zone.
   * PUT /api/owner/delivery-zones/{id}/toggle
   */
  async toggleDeliveryZone(id: number): Promise<DeliveryZone> {
    return client.put<DeliveryZone>(`/owner/delivery-zones/${id}/toggle`);
  },

  /**
   * Delete a delivery zone.
   * DELETE /api/owner/delivery-zones/{id}
   */
  async deleteDeliveryZone(id: number): Promise<{ success: boolean }> {
    return client.delete<{ success: boolean }>(`/owner/delivery-zones/${id}`);
  }
};
