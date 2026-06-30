import React from 'react';

let toastRef: any = null;
const toastQueue: any[] = [];

export const setToastRef = (ref: any) => {
  toastRef = ref;
  if (toastRef && toastQueue.length > 0) {
    while (toastQueue.length > 0) {
      const item = toastQueue.shift();
      if (item.action === 'show') {
        toastRef.show(item.args);
      } else if (item.action === 'clear') {
        toastRef.clear();
      }
    }
  }
};

export const toast = {
  success: (message: any, options?: any) => {
    const summary = (options && typeof options === 'object' && options.summary) || 'Success';
    const args = { severity: 'success', summary, detail: String(message), life: 3000 };
    if (toastRef) {
      toastRef.show(args);
    } else {
      toastQueue.push({ action: 'show', args });
    }
    return '';
  },
  error: (message: any, options?: any) => {
    const summary = (options && typeof options === 'object' && options.summary) || 'Error';
    const args = { severity: 'error', summary, detail: String(message), life: 4000 };
    if (toastRef) {
      toastRef.show(args);
    } else {
      toastQueue.push({ action: 'show', args });
    }
    return '';
  },
  warn: (message: any, options?: any) => {
    const summary = (options && typeof options === 'object' && options.summary) || 'Warning';
    const args = { severity: 'warn', summary, detail: String(message), life: 4000 };
    if (toastRef) {
      toastRef.show(args);
    } else {
      toastQueue.push({ action: 'show', args });
    }
    return '';
  },
  info: (message: any, options?: any) => {
    const summary = (options && typeof options === 'object' && options.summary) || 'Info';
    const args = { severity: 'info', summary, detail: String(message), life: 3000 };
    if (toastRef) {
      toastRef.show(args);
    } else {
      toastQueue.push({ action: 'show', args });
    }
    return '';
  },
  loading: (message: any, _options?: any) => {
    const args = { severity: 'info', summary: 'Loading', detail: String(message), life: 2000 };
    if (toastRef) {
      toastRef.show(args);
    } else {
      toastQueue.push({ action: 'show', args });
    }
    return '';
  },
  dismiss: (_toastId?: string) => {
    if (toastRef) {
      toastRef.clear();
    } else {
      toastQueue.push({ action: 'clear' });
    }
  },
  custom: (message: string | React.ReactNode | ((t: any) => React.ReactNode), options?: any) => {
    if (typeof message === 'function') {
      const mockT = { visible: true, id: options?.id || 'custom' };
      const jsx = message(mockT);
      const args = {
        severity: 'info',
        content: jsx,
        life: 5000,
        ...options
      };
      if (toastRef) {
        toastRef.show(args);
      } else {
        toastQueue.push({ action: 'show', args });
      }
    } else {
      const args = {
        severity: 'info',
        content: message,
        life: 5000,
        ...options
      };
      if (toastRef) {
        toastRef.show(args);
      } else {
        toastQueue.push({ action: 'show', args });
      }
    }
    return '';
  },
  promise: (promise: Promise<any>, msgs: { loading: string; success: string; error: string }, _options?: any) => {
    const loadArgs = { severity: 'info', summary: 'Loading', detail: msgs.loading, life: 10000 };
    if (toastRef) {
      toastRef.show(loadArgs);
    } else {
      toastQueue.push({ action: 'show', args: loadArgs });
    }
    
    promise
      .then((res) => {
        if (toastRef) {
          toastRef.clear();
          toastRef.show({ severity: 'success', summary: 'Success', detail: msgs.success, life: 3000 });
        } else {
          toastQueue.push({ action: 'clear' });
          toastQueue.push({ action: 'show', args: { severity: 'success', summary: 'Success', detail: msgs.success, life: 3000 } });
        }
        return res;
      })
      .catch((err) => {
        if (toastRef) {
          toastRef.clear();
          toastRef.show({ severity: 'error', summary: 'Error', detail: msgs.error, life: 4000 });
        } else {
          toastQueue.push({ action: 'clear' });
          toastQueue.push({ action: 'show', args: { severity: 'error', summary: 'Error', detail: msgs.error, life: 4000 } });
        }
        throw err;
      });
      
    return promise;
  }
};
