import { client } from "../client";

export interface DeliveryMethod {
  id: number;
  name: string;
  code: string;
  description: string | null;
  cost: string | number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  image: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export const deliveryMethodsService = {
  /**
   * Fetch active delivery methods for a specific owner.
   * GET /api/delivery-methods?created_by={ownerId}
   */
  async getPublicDeliveryMethods(ownerId?: number | string): Promise<DeliveryMethod[]> {
    return client.get<DeliveryMethod[]>(`/delivery-methods?created_by=${ownerId}`);
  },

  /**
   * Fetch all delivery methods for the logged-in owner.
   * GET /api/owner/delivery-methods/mine
   */
  async getMyDeliveryMethods(): Promise<DeliveryMethod[]> {
    return client.get<DeliveryMethod[]>('/owner/delivery-methods/mine');
  },

  /**
   * Create a new delivery method (with file upload).
   * POST /api/owner/delivery-methods
   */
  async createDeliveryMethod(formData: FormData): Promise<DeliveryMethod> {
    return client.postFormData<DeliveryMethod>('/owner/delivery-methods', formData);
  },

  /**
   * Update an existing delivery method (with optional file upload).
   * POST /api/owner/delivery-methods/{id} with _method=PUT
   */
  async updateDeliveryMethod(id: number, formData: FormData): Promise<DeliveryMethod> {
    return client.putFormData<DeliveryMethod>(`/owner/delivery-methods/${id}`, formData);
  },

  /**
   * Toggle the active status of a delivery method.
   * PUT /api/owner/delivery-methods/{id}/toggle
   */
  async toggleDeliveryMethod(id: number): Promise<DeliveryMethod> {
    return client.put<DeliveryMethod>(`/owner/delivery-methods/${id}/toggle`);
  },

  /**
   * Delete a delivery method.
   * DELETE /api/owner/delivery-methods/{id}
   */
  async deleteDeliveryMethod(id: number): Promise<{ detail: string }> {
    return client.delete<{ detail: string }>(`/owner/delivery-methods/${id}`);
  }
};
