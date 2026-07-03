import { client } from '../client';
import type { Order, OrderItem } from '@/pages/owner_manage/components/order/show';
export type { Order, OrderItem };

export interface BackendOrderItem {
  id: number;
  order_id: number;
  menu_item_id: number | null;
  name: string;
  quantity: number;
  price: string | number;
}

export interface BackendOrder {
  id: number;
  customer_id: number | null;
  user_id: number | null;
  store_id: number;
  total_amount: string | number;
  tax_amount: string | number;
  status: string;
  payment_status: string;
  payment_method: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: BackendOrderItem[];
  store_details?: Record<string, any>;
  coupon_code?: string;
  discount_amount?: string | number;
  order_no?: string;
  order_type?: string;
  shipping_fee?: string | number;
}

export function mapBackendOrder(o: BackendOrder): Order {
  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      // Formatting to: "30 May 2026, 05:12 PM"
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      return d.toLocaleDateString('en-US', options);
    } catch {
      return dateStr;
    }
  };

  const statusMap: Record<string, Order['status']> = {
    'pending': 'pending',
    'confirmed': 'confirm',
    'confirm': 'confirm',
    'processing': 'processing',
    'delivered': 'complete',
    'complete': 'complete',
    'completed': 'complete',
    'canceled': 'canceled',
    'cancelled': 'canceled'
  };

  const mappedItems: OrderItem[] = (o.items || []).map(it => {
    // Attempt to drill down into various possible nested product relations returned by the backend
    const variant = (it as any).product_variant || (it as any).productVariant || (it as any).variant;
    const prod = (it as any).product || (it as any).menu_item || (it as any).menuItem || variant?.product || variant;
    
    // Aggressively look for an image URL at multiple levels, including the dedicated ProductImage relationship arrays
    let imgUrl = '';
    
    // 1. Direct fields
    imgUrl = imgUrl || (it as any).image || (it as any).image_url || (it as any).display_image;
    
    // 2. Try to find a primary image in the nested ProductImage arrays
    const productImages = prod?.images || prod?.product_images || variant?.images || variant?.product_images || [];
    if (!imgUrl && Array.isArray(productImages) && productImages.length > 0) {
        // Try to find the primary image first, otherwise fallback to the first image in the array
        const primaryImg = productImages.find(img => img.is_primary);
        imgUrl = primaryImg?.image || primaryImg?.url || productImages[0]?.image || productImages[0]?.url || '';
    }

    // 3. Fallback to flat relationships
    imgUrl = imgUrl || 
      variant?.image || 
      variant?.image_url || 
      variant?.display_image || 
      prod?.image || 
      prod?.image_url || 
      prod?.display_image || 
      prod?.product_image ||
      '';

    // Aggressively look for the product name
    const itemName = 
      it.name || 
      (it as any).product_name || 
      (it as any).menu_item_name ||
      variant?.name || 
      variant?.title ||
      prod?.name || 
      prod?.title || 
      'Unknown Product';
      
    return {
      name: itemName,
      qty: it.quantity || (it as any).qty || 1,
      price: String(it.price || 0),
      image: imgUrl
    };
  });

  return {
    id: String(o.id),
    order_no: o.order_no,
    userId: o.user_id ? String(o.user_id) : undefined,
    customerId: o.customer_id ? Number(o.customer_id) : undefined,
    customer: o.customer_name || 'Guest User',
    email: `${(o.customer_name || 'guest').toLowerCase().replace(/\s+/g, '')}@example.com`,
    phone: o.customer_phone || '',
    address: o.customer_address || 'No address specified',
    items: mappedItems,
    total: String(o.total_amount),
    status: statusMap[(o.status || 'pending').toLowerCase()] || 'pending',
    time: formatDate(o.created_at),
    store: o.store_details?.store_name || `Store #${o.store_id}`,
    storePhone: o.store_details?.store_phone,
    storeAddress: o.store_details?.store_address,
    storeId: o.store_id,
    paymentStatus: (o.payment_status && String(o.payment_status).toLowerCase() === 'paid') ? 'Paid' : 'Unpaid',
    paymentMethod: o.payment_method || 'Cash on Delivery',
    couponCode: o.coupon_code || undefined,
    discountAmount: o.discount_amount ? String(o.discount_amount) : undefined,
    taxAmount: o.tax_amount !== undefined && o.tax_amount !== null ? String(o.tax_amount) : undefined,
    orderType: o.order_type || undefined,
    shippingFee: o.shipping_fee !== undefined && o.shipping_fee !== null ? String(o.shipping_fee) : '0',
    latitude: o.latitude !== undefined && o.latitude !== null ? String(o.latitude) : undefined,
    longitude: o.longitude !== undefined && o.longitude !== null ? String(o.longitude) : undefined,
    notes: o.notes || ''
  };
}

export const ordersService = {
  async getMyStoreOrders(status?: string, skip = 0, limit = 100, createdBy?: number | string, storeId?: number | string, vendorId?: number | string, ownerId?: number | string): Promise<Order[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.append('status', status);
    }
    params.append('skip', String(skip));
    params.append('limit', String(limit));

    // Priority: Store ID as the absolute primary filter
    if (storeId !== undefined && storeId !== null) {
      params.append('store_id', String(storeId));
    } else {
      // Only use these as fallbacks if storeId is completely missing
      if (createdBy !== undefined && createdBy !== null) params.append('created_by', String(createdBy));
      if (vendorId !== undefined && vendorId !== null) params.append('vendor_id', String(vendorId));
      if (ownerId !== undefined && ownerId !== null) params.append('owner_id', String(ownerId));
    }

    const attempts = [
      { name: 'Owner Orders Mine', url: `/owner/orders/mine` },
      { name: 'Owner Orders', url: `/owner/orders` },
      { name: 'Orders Mine', url: `/orders/mine` },
      { name: 'Orders Store Me', url: `/orders/store/me` },
      { name: 'Orders Store', url: `/orders/store` }
    ];

    for (const attempt of attempts) {
      try {
        const res = await client.get<any>(`${attempt.url}?${params.toString()}`, { silent: true });
        let data = Array.isArray(res) ? res : (res?.data || res?.orders || res?.results || []);
        
        if (data && Array.isArray(data)) {
          if (storeId) {
            const storeSpecificData = data.filter((o: any) => {
              const orderStoreId = String(o.store_id || o.store?.id || '').trim();
              const targetStoreId = String(storeId).trim();
              
              if (orderStoreId === targetStoreId) return true;
              
              if (isNaN(Number(targetStoreId))) {
                const storeOwnerHash = String(o.store?.hashid || o.store?.owner?.hashid || o.store_details?.hashid || '').trim();
                if (storeOwnerHash && storeOwnerHash === targetStoreId) return true;
                return true;
              }
              
              return false;
            });
            
            // If the endpoint actually had data but NONE matched our store, 
            // it means this endpoint is returning data from other stores/users incorrectly.
            // Continue searching for a better endpoint.
            if (data.length > 0 && storeSpecificData.length === 0) continue;
            
            return storeSpecificData.map(mapBackendOrder);
          }
          
          if (data.length > 0) return data.map(mapBackendOrder);
        }
      } catch (err: any) {
        // Continue silently
      }
    }

    return [];
  },

  async getCustomerOrders(storeId?: number, skip = 0, limit = 100): Promise<Order[]> {
    const params = new URLSearchParams();
    params.append('skip', String(skip));
    params.append('limit', String(limit));
    if (storeId !== undefined && storeId !== null) {
      params.append('store_id', String(storeId));
    }

    const attempts = [
      { name: 'Orders Mine', url: `/orders/mine` },
      { name: 'Orders Me', url: `/orders/me` }
    ];

    for (const attempt of attempts) {
      try {
        const res = await client.get<any>(`${attempt.url}?${params.toString()}`, { silent: true });
        const data = Array.isArray(res) ? res : (res?.data || res?.orders || res?.results || []);
        if (Array.isArray(data)) {
          if (storeId) {
            return data
              .filter((o: any) => {
                const orderStoreId = String(o.store_id || o.store?.id || '').trim();
                const targetStoreId = String(storeId).trim();
                
                if (orderStoreId === targetStoreId) return true;
                
                if (isNaN(Number(targetStoreId))) {
                  const storeOwnerHash = String(o.store?.hashid || o.store?.owner?.hashid || o.store_details?.hashid || '').trim();
                  if (storeOwnerHash && storeOwnerHash === targetStoreId) return true;
                  return true;
                }
                
                return false;
              })
              .map(mapBackendOrder);
          }
          return data.map(mapBackendOrder);
        }
      } catch (err: any) {
        // Continue
      }
    }

    return [];
  },

  /**
   * Retrieve a specific order's granular invoice details.
   */
  async getOrderDetails(orderId: number | string): Promise<Order> {
    const attempts = [
      `/owner/orders/${orderId}`,
      `/orders/${orderId}`
    ];

    for (const url of attempts) {
      try {
        const res = await client.get<BackendOrder>(url);
        if (res && res.id) {
          return mapBackendOrder(res);
        }
      } catch (err) {
        // Continue
      }
    }
    
    throw new Error('Order details could not be retrieved');
  },

  /**
   * Update the order workflow status (pending, confirmed, canceled, complete).
   */
  async updateOrderStatus(orderId: number | string, newStatus: string): Promise<Order> {
    let apiStatus = newStatus.toLowerCase();
    if (apiStatus === 'confirm') {
      apiStatus = 'confirmed';
    }
    const res = await client.put<BackendOrder>(`/owner/orders/${orderId}/status`, {
      status: apiStatus
    });
    return mapBackendOrder(res);
  },

  /**
   * Toggle the payment verification state of an order (Paid, Unpaid).
   */
  async updateOrderPaymentStatus(orderId: number | string, newPaymentStatus: 'Paid' | 'Unpaid'): Promise<Order> {
    const res = await client.put<BackendOrder>(`/owner/orders/${orderId}/payment-status`, {
      payment_status: newPaymentStatus
    });
    return mapBackendOrder(res);
  },

  /**
   * Create a new order.
   */
  async createOrder(data: {
    store_id: number;
    total_amount: number;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    payment_method: string;
    notes?: string;
    items: {
      menu_item_id: number;
      product_variant_id?: number | null;
      quantity: number;
      price: number;
    }[];
    delivery_fee?: number;
    discount_amount?: number;
    coupon_code?: string;
    subtotal?: number;
    order_type?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
  }): Promise<Order> {
    const res = await client.post<any>('/orders', data);
    const orderData = res?.order || res;
    return mapBackendOrder(orderData);
  },

  /**
   * Delete an order (usually when payment fails or is abandoned).
   */
  async deleteOrder(orderId: number | string): Promise<any> {
    return client.delete<any>(`/orders/${orderId}`);
  }
};


