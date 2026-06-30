import { client } from '../client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiscountType = 'amount' | 'percentage';
export type CouponType = 'first_order' | 'discount_on_purchase' | 'free_delivery';

export interface VendorRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  image: string | null;
}

export interface CouponRow {
  id: number;
  title: string;
  code: string;
  coupon_type: CouponType;
  vendor_id: number | string | null;
  customer_id: number | string | null;
  discount_type: DiscountType;
  discount_amount: number;
  minimum_purchase: number | null;
  limit_same_user: number | null;
  limit_total: number | null;
  total_used: number;
  start_date: string;
  expire_date: string;
  is_active: boolean;
  created_by: number | null;
  vendor?: { id: number; name: string } | null;
  customer?: { id: number; name: string } | null;
  creator?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponPayload {
  title: string;
  code?: string;
  coupon_type: CouponType;
  vendor_id?: number | string | null;
  customer_id?: number | string | null;
  discount_type: DiscountType;
  discount_amount: number;
  minimum_purchase?: number | null;
  limit_same_user?: number | null;
  limit_total?: number | null;
  start_date: string;
  expire_date: string;
  is_active?: boolean;
}

// ─── Vendor Service ───────────────────────────────────────────────────────────

export const vendorsService = {
  /**
   * Fetch the public list of vendors (users with role_id = 2 — Seller).
   * GET /api/vendors
   */
  async getVendors(skip = 0, limit = 100): Promise<VendorRow[]> {
    return client.get<VendorRow[]>(`/vendors?skip=${skip}&limit=${limit}`);
  },

  /**
   * Fetch a single vendor by ID.
   * GET /api/vendors/{id}
   */
  async getVendor(id: number): Promise<VendorRow> {
    return client.get<VendorRow>(`/vendors/${id}`);
  },
};

// ─── Coupon Service ───────────────────────────────────────────────────────────

export const couponsService = {
  /**
   * Fetch public list of active coupons (optional filters: vendor_id, customer_id, coupon_type).
   * GET /api/coupons
   */
  async getCoupons(params?: { vendor_id?: number | string; customer_id?: number | string; created_by?: number | string; coupon_type?: CouponType; skip?: number; limit?: number }): Promise<CouponRow[]> {
    const qs = new URLSearchParams();
    if (params?.vendor_id) qs.set('vendor_id', String(params.vendor_id));
    if (params?.customer_id) qs.set('customer_id', String(params.customer_id));
    if (params?.created_by) qs.set('created_by', String(params.created_by));
    if (params?.coupon_type) qs.set('coupon_type', params.coupon_type);
    qs.set('skip', String(params?.skip ?? 0));
    qs.set('limit', String(params?.limit ?? 100));
    return client.get<CouponRow[]>(`/coupons?${qs}`);
  },

  /**
   * Fetch coupons created by the logged-in user (admin sees all).
   * GET /api/coupons/mine  [auth]
   */
  async getMyCoupons(skip = 0, limit = 100, createdBy?: number | string): Promise<CouponRow[]> {
    const qs = new URLSearchParams();
    qs.set('skip', String(skip));
    qs.set('limit', String(limit));
    if (createdBy) qs.set('created_by', String(createdBy));
    return client.get<CouponRow[]>(`/coupons/mine?${qs}`);
  },

  /**
   * Get a single coupon by ID.
   * GET /api/coupons/{id}
   */
  async getCoupon(id: number): Promise<CouponRow> {
    return client.get<CouponRow>(`/coupons/${id}`);
  },

  /**
   * Validate a coupon code and return its details.
   * GET /api/coupons/validate?code=XYZ&phone=123
   */
  async validateCode(code: string, phone?: string): Promise<CouponRow> {
    const qs = new URLSearchParams();
    qs.set('code', code);
    if (phone) qs.set('phone', phone);
    return client.get<CouponRow>(`/coupons/validate?${qs}`);
  },

  /**
   * Create a new coupon.
   * POST /api/coupons  [auth]
   */
  async createCoupon(payload: CreateCouponPayload): Promise<CouponRow> {
    return client.post<CouponRow>('/coupons', payload);
  },

  /**
   * Update an existing coupon.
   * PUT /api/coupons/{id}  [auth]
   */
  async updateCoupon(id: number, payload: Partial<CreateCouponPayload>): Promise<CouponRow> {
    return client.put<CouponRow>(`/coupons/${id}`, payload);
  },

  /**
   * Toggle active/inactive status.
   * PUT /api/coupons/{id}/toggle  [auth]
   */
  async toggleCoupon(id: number): Promise<CouponRow> {
    return client.put<CouponRow>(`/coupons/${id}/toggle`);
  },

  /**
   * Delete a coupon.
   * DELETE /api/coupons/{id}  [auth]
   */
  async deleteCoupon(id: number): Promise<{ detail: string }> {
    return client.delete<{ detail: string }>(`/coupons/${id}`);
  },
};
