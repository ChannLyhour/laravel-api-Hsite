import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';

export interface ClearCacheOptions {
  reload?: boolean;
  onCleared?: () => void;
}

/**
 * Utility function to clear browser storage and CacheStorage API
 * while preserving essential authentication and store configuration session tokens.
 */
export const clearBrowserCache = async (options: ClearCacheOptions = {}) => {
  try {
    // 1. Preserve essential session & authentication tokens
    const keysToPreserve = [
      'auth_token',
      'token',
      'aura_customer_token',
      'store_settings',
      'store_locale',
      'owner_manage_lang',
      'biteflow_subscription_tier',
      'biteflow_plan_features',
      'user',
      'owner_user',
    ];

    const preservedData: Record<string, string> = {};
    keysToPreserve.forEach((key) => {
      const val = localStorage.getItem(key);
      if (val !== null) {
        preservedData[key] = val;
      }
    });

    // 2. Clear LocalStorage
    localStorage.clear();

    // 3. Restore preserved session keys
    Object.entries(preservedData).forEach(([key, val]) => {
      localStorage.setItem(key, val);
    });

    // 4. Clear SessionStorage
    sessionStorage.clear();

    // 5. Clear CacheStorage API (Service Workers / HTTP Cache)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    // 6. Dispatch custom events so active components can refresh their state
    window.dispatchEvent(new CustomEvent('cache_cleared'));
    window.dispatchEvent(new CustomEvent('data_updated'));

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        new BroadcastChannel('data_updates').postMessage('refresh');
      } catch (_) {}
    }

    // Call callback if provided
    if (options.onCleared) {
      options.onCleared();
    }

    toast.success('Browser cache cleared successfully!');

    // 7. Reload page if requested
    if (options.reload) {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  } catch (error) {
    console.error('Failed to clear browser cache:', error);
    toast.error('Failed to clear browser cache.');
  }
};

interface ClearCacheButtonProps {
  onCleared?: () => void;
  reloadOnClear?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ClearCacheButton: React.FC<ClearCacheButtonProps> = ({
  onCleared,
  reloadOnClear = false,
  className = '',
  variant = 'outline',
  size = 'md',
  showLabel = true,
}) => {
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    await clearBrowserCache({ reload: reloadOnClear, onCleared });
    setClearing(false);
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
      title="Clear Browser Cache"
    >
      <FiRefreshCw className={`w-3.5 h-3.5 ${clearing ? 'animate-spin text-orange-500' : ''}`} />
      {showLabel && <span>{clearing ? 'Clearing...' : 'Clear Cache'}</span>}
    </button>
  );
};

export default ClearCacheButton;
