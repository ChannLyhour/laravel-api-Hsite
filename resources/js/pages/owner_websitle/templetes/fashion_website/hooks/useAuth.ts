import { useState, useEffect, useCallback } from 'react';
import { authService, type User } from '@/api/auth';

const AUTH_TOKEN_KEY = 'aura_customer_token';

/**
 * Hook to manage customer authentication state for the fashion storefront.
 * @param ownerUserId The store owner's user ID — attached as `created_by` on new registrations.
 */
export const useAuth = (ownerUserId?: number | string) => {
    const [user, setUser] = useState<User | null>(null);
    // Start as loading ONLY when a token exists — prevents Login/Register flash on reload
    const [isLoading, setIsLoading] = useState<boolean>(() => {
        return !!localStorage.getItem(AUTH_TOKEN_KEY);
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Restore session on mount and listen to changes ─────────────────────────
    useEffect(() => {
        const syncUser = () => {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                setUser(null);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            authService
                .getCurrentUser()
                .then(({ user }) => setUser(user))
                .catch(() => {
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                    setUser(null);
                })
                .finally(() => setIsLoading(false));
        };

        syncUser();

        window.addEventListener('aura_token_changed', syncUser);
        window.addEventListener('storage', syncUser);

        return () => {
            window.removeEventListener('aura_token_changed', syncUser);
            window.removeEventListener('storage', syncUser);
        };
    }, []);

    // ── Login ─────────────────────────────────────────────────────────────────
    const login = useCallback(
        async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
            setIsSubmitting(true);
            try {
                const res = await authService.login({ email, password });
                localStorage.setItem(AUTH_TOKEN_KEY, res.token);
                window.dispatchEvent(new Event('aura_token_changed'));

                // Fetch full profile after successful login
                const { user: me } = await authService.getCurrentUser();
                setUser(me);
                return { success: true, message: res.message };
            } catch (err: any) {
                const message =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Login failed. Please check your credentials.';
                return { success: false, message };
            } finally {
                setIsSubmitting(false);
            }
        },
        []
    );

    // ── Register ──────────────────────────────────────────────────────────────
    const register = useCallback(
        async (data: {
            name: string;
            first_name: string;
            last_name: string;
            email: string;
            password: string;
            phone?: string;
            address?: string;
            city?: string;
            country?: string;
            gender?: 'male' | 'female' | 'other';
        }): Promise<{ success: boolean; message: string }> => {
            setIsSubmitting(true);
            try {
                const res = await authService.register({
                    ...data,
                    ...(ownerUserId ? { created_by: ownerUserId } : {}),
                });
                localStorage.setItem(AUTH_TOKEN_KEY, res.token);
                window.dispatchEvent(new Event('aura_token_changed'));

                const { user: me } = await authService.getCurrentUser();
                setUser(me);
                return { success: true, message: res.message };
            } catch (err: any) {
                const message =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Registration failed. Please try again.';
                return { success: false, message };
            } finally {
                setIsSubmitting(false);
            }
        },
        [ownerUserId]
    );

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.dispatchEvent(new Event('aura_token_changed'));
        setUser(null);
    }, []);

    return {
        user,
        isLoading,
        isSubmitting,
        isLoggedIn: !!user,
        login,
        register,
        logout,
    };
};

