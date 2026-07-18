import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';

export interface ClearCacheOptions {
  reload?: boolean;
  onCleared?: () => void;
  scope?: 'all' | 'product';
}

/**
 * Helper function to clear ONLY product and category menu cache from localStorage.
 * Does NOT touch authentication tokens, user sessions, or login state.
 */
export const clearProductCache = () => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('menu_items_') || key.startsWith('menu_cats_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

/**
 * Utility function to clear product cache and trigger fresh data loading.
 * Preserves all authentication tokens so the user ALWAYS stays logged in.
 */
export const clearBrowserCache = async (options: ClearCacheOptions = {}) => {
  const { scope = 'product', reload = false, onCleared } = options;

  try {
    if (scope === 'product') {
      // Clear ONLY product & category cache - zero impact on auth session
      clearProductCache();

      // Dispatch custom events so active components can refresh their state
      window.dispatchEvent(new CustomEvent('cache_cleared'));
      window.dispatchEvent(new CustomEvent('data_updated'));

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          new BroadcastChannel('data_updates').postMessage('refresh');
        } catch (_) {}
      }

      if (onCleared) {
        onCleared();
      }

      toast.success('Product cache cleared successfully!');

      if (reload) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      return;
    }

    // Full Cache Clear (Scope: 'all')
    // 1. Preserve essential session & authentication tokens for both localStorage & sessionStorage
    const keysToPreserve = [
      'auth_token',
      'token',
      'admin_token',
      'master_admin_token',
      'aura_customer_token',
      'store_settings',
      'store_locale',
      'owner_manage_lang',
      'biteflow_subscription_tier',
      'biteflow_plan_features',
      'user',
      'admin_user',
      'owner_user',
      'selected_owner_id',
      'selected_store_id',
    ];

    const preservedLocalData: Record<string, string> = {};
    keysToPreserve.forEach((key) => {
      const val = localStorage.getItem(key);
      if (val !== null) {
        preservedLocalData[key] = val;
      }
    });

    const preservedSessionData: Record<string, string> = {};
    keysToPreserve.forEach((key) => {
      const val = sessionStorage.getItem(key);
      if (val !== null) {
        preservedSessionData[key] = val;
      }
    });

    // 2. Clear LocalStorage & SessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // 3. Restore preserved session & auth keys
    Object.entries(preservedLocalData).forEach(([key, val]) => {
      localStorage.setItem(key, val);
    });

    Object.entries(preservedSessionData).forEach(([key, val]) => {
      sessionStorage.setItem(key, val);
    });

    // 4. Clear CacheStorage API (Service Workers / HTTP Cache)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    // 5. Dispatch custom events
    window.dispatchEvent(new CustomEvent('cache_cleared'));
    window.dispatchEvent(new CustomEvent('data_updated'));

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        new BroadcastChannel('data_updates').postMessage('refresh');
      } catch (_) {}
    }

    if (onCleared) {
      onCleared();
    }

    toast.success('Browser cache cleared successfully!');

    if (reload) {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
    toast.error('Failed to clear cache.');
  }
};

interface ClearCacheButtonProps {
  onCleared?: () => void;
  reloadOnClear?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  scope?: 'all' | 'product';
}

export const ClearCacheButton: React.FC<ClearCacheButtonProps> = ({
  onCleared,
  reloadOnClear = false,
  className = '',
  variant = 'outline',
  size = 'md',
  showLabel = true,
  scope = 'product',
}) => {
  const [clearing, setClearing] = useState(false);

  const handleClear = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setClearing(true);
    try {
      await clearBrowserCache({ reload: reloadOnClear, onCleared, scope });
    } catch (err) {
      console.error('Clear cache onClick error:', err);
    } finally {
      setClearing(false);
    }
  };

  const variantStyles = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white border-transparent shadow-xs',
    secondary: 'bg-slate-800 hover:bg-slate-900 text-white border-transparent shadow-xs',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 hover:text-orange-600 border border-slate-200/80 shadow-3xs',
    danger: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-3xs',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-[5px]',
    md: 'px-3 py-1.5 text-xs font-semibold gap-2 rounded-[6px]',
    lg: 'px-4 py-2 text-sm font-semibold gap-2 rounded-[8px]',
  };

  return (
    <button
      type="button"
      onClick={handleClear}
      disabled={clearing}
      className={`inline-flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 font-kuntomruy ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      title={scope === 'product' ? 'Clear Product Cache' : 'Clear Browser Cache'}
    >
      <FiRefreshCw className={`w-3.5 h-3.5 ${clearing ? 'animate-spin text-orange-500' : ''}`} />
      {showLabel && <span>{clearing ? 'Clearing...' : 'Clear Cache'}</span>}
    </button>
  );
};

export default ClearCacheButton;
