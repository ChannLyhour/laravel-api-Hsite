import { client, API_BASE_URL } from './client';

// TypeScript Interfaces for Authentication Models and API payloads

export interface User {
  id: number;
  hashid?: string;
  name: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  country?: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  image_url: string | null;
  role: string;
}

export interface Customer {
  id: number;
  user_id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  country?: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password?: string; // Optional if handled dynamically, but typically required
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface RegisterRequest {
  name: string;
  first_name: string;
  last_name: string;
  gender?: string;
  country?: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  city?: string;
  created_by?: number | string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface UserResponse {
  user: User;
  customer: Customer | null;
}

export interface LogoutResponse {
  message: string;
}

// Authentication API Services
export const authService = {
  /**
   * Log in a customer user and retrieve their bearer token.
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    interface FastApiTokenResponse {
      access_token: string;
      token_type: string;
    }
    const res = await client.postForm<FastApiTokenResponse>('/customer/login', {
      email: credentials.email,
      password: credentials.password || '',
    });
    return {
      success: true,
      message: 'Logged in successfully',
      token: res.access_token,
    };
  },

  /**
   * Log in an administrator/staff user and retrieve their bearer token.
   */
  adminLogin: async (credentials: LoginRequest): Promise<LoginResponse> => {
    interface FastApiTokenResponse {
      access_token: string;
      token_type: string;
    }
    const res = await client.postForm<FastApiTokenResponse>('/admin/login', {
      email: credentials.email,
      password: credentials.password || '',
    });
    return {
      success: true,
      message: 'Logged in successfully',
      token: res.access_token,
    };
  },

  /**
   * Register a new customer user and obtain their access token.
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    interface LaravelRegisterResponse {
      success: boolean;
      message: string;
      token: string;
      user: any;
    }
    const res = await client.post<LaravelRegisterResponse>('/register', data);
    return {
      success: res.success,
      message: res.message,
      token: res.token,
    };
  },

  /**
   * Terminate the customer's active bearer token session.
   */
  logout: async (): Promise<LogoutResponse> => {
    try {
      await client.post('/logout');
    } catch (err) {
      console.warn('Backend logout failed:', err);
    }
    return { message: 'Logged out successfully' };
  },

  /**
   * Send heartbeat to keep the user marked online.
   */
  heartbeat: async (): Promise<void> => {
    try {
      await client.post('/users/heartbeat', {}, { silent: true });
    } catch (err) {
      // Ignore errors (e.g. if offline/unauthorized)
    }
  },

  /**
   * Mark user offline immediately — e.g. on tab close.
   * Uses fetch keepalive:true so it fires even during page unload.
   */
  markOffline: (): void => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
      if (!token) return;
      fetch(`${API_BASE_URL}/users/offline`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({}),
      }).catch(() => {});
    } catch (_) {}
  },

  /**
   * Retrieve the current authenticated customer's user and model profile.
   * Laravel /users/me returns the User model directly.
   */
  getCurrentUser: async (token?: string): Promise<UserResponse> => {
    interface LaravelUserResponse {
      id: number;
      name: string;
      email: string;
      phone: string | null;
      address: string | null;
      city: string | null;
      image: string | null;
      role_id: number | null;
      state?: string | null;
      hashid?: string;
    }
    const options = token ? { headers: { 'Authorization': `Bearer ${token}` } } : undefined;
    const res = await client.get<LaravelUserResponse>('/users/me', options);
    // role_id: 1 = super admin, 30003 = owner/admin, 2 = customer
    const roleIdNum = res.role_id !== null && res.role_id !== undefined ? Number(res.role_id) : null;
    const roleName = roleIdNum === 30003 ? 'owner' : (roleIdNum === 1 ? 'admin' : 'customer');
    return {
      user: {
        id: res.id,
        hashid: res.hashid,
        name: res.name,
        email: res.email,
        phone: res.phone,
        address: res.address,
        city: res.city,
        image_url: res.image,
        role: roleName,
      },
      customer: (res.role_id !== 1 && res.role_id !== 30003) ? {
        id: res.id,
        user_id: res.id,
        name: res.name,
        email: res.email,
        phone: res.phone,
        address: res.address,
        city: res.city,
        created_at: '',
        updated_at: '',
      } : null,
    };
  },

  /**
   * Update current user profile.
   * Since this payload can contain an avatar image file, we use a FormData body.
   */
  updateProfile: async (formData: FormData): Promise<{ success: boolean; message: string; user: User }> => {
    return client.postFormData<{ success: boolean; message: string; user: User }>('/users/me', formData);
  },

  /**
   * Permanently delete the active user account and all associated store data.
   */
  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    return client.delete<{ success: boolean; message: string }>('/users/me');
  },
};

// ─── Restaurant Owner / Admin Picker ────────────────────────────────────────

export interface AdminUser {
  id: number;
  name: string;
  city: string | null;
  image: string | null;
}

/**
 * Fetch all admin users who have at least one menu item published.
 * Used by the customer-facing restaurant picker in the navbar.
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  return client.get<AdminUser[]>('/users/admins');
}
