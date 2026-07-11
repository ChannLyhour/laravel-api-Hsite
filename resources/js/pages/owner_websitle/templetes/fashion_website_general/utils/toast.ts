import { toast as hotToast } from 'react-hot-toast';

const FASHION_TOAST_OPTIONS = {
  style: {
    background: '#1c1c1c',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderRadius: '2px',
  },
  iconTheme: {
    primary: '#E61E25',
    secondary: '#ffffff',
  },
};

export const toast = {
  success: (message: any, options?: any) => {
    return hotToast.success(message, { ...FASHION_TOAST_OPTIONS, ...options });
  },
  error: (message: any, options?: any) => {
    return hotToast.error(message, { ...FASHION_TOAST_OPTIONS, ...options });
  },
  loading: (message: any, options?: any) => {
    return hotToast.loading(message, { ...FASHION_TOAST_OPTIONS, ...options });
  },
  dismiss: (toastId?: string) => {
    return hotToast.dismiss(toastId);
  },
  custom: (message: any, options?: any) => {
    return hotToast.custom(message, { ...FASHION_TOAST_OPTIONS, ...options });
  },
};
