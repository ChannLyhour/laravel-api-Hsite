import { useState, useEffect } from 'react';

export interface GuestCheckoutDetails {
    name: string;
    phone: string;
    address: string;
}

export function useCustomerGuestCheckout() {
    // 1. Initial State resolved from localStorage cache
    const [customCustomerName, setCustomCustomerName] = useState<string>(() => {
        try {
            return localStorage.getItem('guest_checkout_name') || '';
        } catch {
            return '';
        }
    });

    const [customCustomerPhone, setCustomCustomerPhone] = useState<string>(() => {
        try {
            return localStorage.getItem('guest_checkout_phone') || '';
        } catch {
            return '';
        }
    });

    const [customCustomerAddress, setCustomCustomerAddress] = useState<string>(() => {
        try {
            return localStorage.getItem('guest_checkout_address') || '';
        } catch {
            return '';
        }
    });

    // 2. Synchronize states with localStorage cache on change
    useEffect(() => {
        try {
            localStorage.setItem('guest_checkout_name', customCustomerName);
        } catch (e) {
            console.warn('Failed to cache guest checkout name', e);
        }
    }, [customCustomerName]);

    useEffect(() => {
        try {
            localStorage.setItem('guest_checkout_phone', customCustomerPhone);
        } catch (e) {
            console.warn('Failed to cache guest checkout phone', e);
        }
    }, [customCustomerPhone]);

    useEffect(() => {
        try {
            localStorage.setItem('guest_checkout_address', customCustomerAddress);
        } catch (e) {
            console.warn('Failed to cache guest checkout address', e);
        }
    }, [customCustomerAddress]);

    // Helper to clear cached guest checkout details (e.g. after successful order placement)
    const clearGuestCheckoutCache = () => {
        setCustomCustomerName('');
        setCustomCustomerPhone('');
        setCustomCustomerAddress('');
        try {
            localStorage.removeItem('guest_checkout_name');
            localStorage.removeItem('guest_checkout_phone');
            localStorage.removeItem('guest_checkout_address');
        } catch (e) {
            console.warn('Failed to clear guest checkout cache', e);
        }
    };

    return {
        customCustomerName,
        setCustomCustomerName,
        customCustomerPhone,
        setCustomCustomerPhone,
        customCustomerAddress,
        setCustomCustomerAddress,
        clearGuestCheckoutCache,
    };
}
