import { client } from '../client';
import { mapBackendOrder } from '../owner/orders';
import type { BackendOrder } from '../owner/orders';
import type { Order } from '@/pages/owner_manage/components/order/show';

/**
 * Service to retrieve order history for a specific customer or the currently authenticated user.
 */
export const customerOrdersService = {
  /**
   * Fetches orders for a specific customer ID.
   * If customerId is not provided, it falls back to the authenticated user's orders.
   */
  async getOrdersByCustomerId(
    customerId?: number | string, 
    storeId?: number | string, 
    skip = 0, 
    limit = 100,
    userId?: number | string,
    email?: string,
    phone?: string
  ): Promise<Order[]> {
    const params = new URLSearchParams();
    params.append('skip', String(skip));
    params.append('limit', String(limit));
    
    if (customerId) {
      params.append('customer_id', String(customerId));
    }
    
    if (storeId) {
      params.append('store_id', String(storeId));
    }

    // List of potential endpoints to find customer orders
    const attempts = [
      { name: 'Owner Orders Mine', url: `/owner/orders/mine` },
      { name: 'Owner Orders', url: `/owner/orders` },
      { name: 'Orders Me', url: `/orders/me` },
      { name: 'Orders Mine', url: `/orders/mine` },
      { name: 'General Orders', url: `/orders` }
    ];

    for (const attempt of attempts) {
      try {
        const url = `${attempt.url}?${params.toString()}`;
        const res = await client.get<any>(url, { silent: true });
        
        // Handle various response formats (direct array or nested data)
        const data = Array.isArray(res) ? res : (res?.data || res?.orders || res?.results || []);
        
        if (Array.isArray(data)) {
          // Client-side safety filtering for Store ID and Customer ID
          let filtered = data;
          
          if (storeId) {
            filtered = filtered.filter((o: any) => {
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
          }
          
          if (customerId || userId || email || phone) {
            filtered = filtered.filter((o: any) => {
              const orderUserId = o.user_id || o.userId;
              const orderEmail = o.customer_email || o.email;
              const orderPhone = o.customer_phone || o.phone;
              
              if (userId && String(orderUserId) === String(userId)) return true;
              if (customerId && String(o.customer_id) === String(customerId)) return true;
              // Keep backward compatibility for user portal which passes user.id as customerId
              if (customerId && String(orderUserId) === String(customerId)) return true; 
              if (email && orderEmail && String(orderEmail).toLowerCase() === String(email).toLowerCase()) return true;
              if (phone && orderPhone && String(orderPhone) === String(phone)) return true;
              return false;
            });
          }

          // If we found matching orders, return them
          if (filtered.length > 0 || (data.length === 0 && attempt.name.includes('Me'))) {
             return filtered.map((o: BackendOrder) => mapBackendOrder(o));
          }
        }
      } catch (err) {
        // Silently try next endpoint
      }
    }

    return [];
  }
};
