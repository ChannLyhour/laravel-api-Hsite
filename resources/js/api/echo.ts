import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL } from './client';

// Expose Pusher to window so Laravel Echo can find it
if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

export const getEchoAuthToken = (): string | null => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const getValidToken = (key: string) => {
    const t = localStorage.getItem(key);
    if (!t || t === 'null' || t === 'undefined' || t === '') return null;
    return t;
  };

  // Resolve token matching client.ts isolation logic
  if (pathname.startsWith('/admin')) {
    return getValidToken('master_admin_token');
  } else if (pathname.startsWith('/owner')) {
    return getValidToken('admin_token');
  } else {
    // Main website uses customer token primarily, with fallbacks
    return (
      getValidToken('auth_token') ||
      getValidToken('aura_customer_token') ||
      getValidToken('admin_token') ||
      getValidToken('master_admin_token')
    );
  }
};

let echoInstance: Echo<any> | null = null;
let currentKey: string | null = null;
let currentCluster: string | null = null;
let currentToken: string | null = null;

export const getEcho = (key?: string | null, cluster?: string | null): Echo<any> => {
  const resolvedKey = key || import.meta.env.VITE_PUSHER_APP_KEY || '039e7fbdaf49c979cbe9';
  const resolvedCluster = cluster || import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1';
  const token = getEchoAuthToken();

  if (echoInstance && (
    currentKey !== resolvedKey || 
    currentCluster !== resolvedCluster ||
    currentToken !== token
  )) {
    echoInstance.disconnect();
    echoInstance = null;
  }

  if (echoInstance) return echoInstance;

  currentKey = resolvedKey;
  currentCluster = resolvedCluster;
  currentToken = token;

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: resolvedKey,
    cluster: resolvedCluster,
    forceTLS: true,
    authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
      },
    },
  });

  return echoInstance;
};

export const resetEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    currentKey = null;
    currentCluster = null;
  }
};
