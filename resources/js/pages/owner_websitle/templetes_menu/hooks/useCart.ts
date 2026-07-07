import { useState, useMemo, useEffect, useCallback } from 'react';

import type { Root2 } from '@/api/owner/categories';
import type { CartItem } from '../types';
import { parseAttributeValue, resolveColorHex } from '../utils/priceUtils';
import { resolveImageUrl } from '../utils/imageUtils';
import { useCoupon } from './useCoupon';
import { useShippingFee } from './useShippingFee';
import { cartService } from '@/api/owner/cart';
import { toast } from 'react-hot-toast';
import { nullOrRequest } from '../nullOrRequest';

/**
 * Hook to manage shopping cart operations, calculations, and toast feedback.
 * Now accepts optional initialSettings and user to enforce authentication and real data.
 */
// --------------- variant meta helpers ---------------
const VARIANT_META_KEY = 'aura_variant_meta';

function loadVariantMeta(): Record<number, { size?: string; color?: string }> {
  try {
    const raw = localStorage.getItem(VARIANT_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveVariantMeta(id: number, size: string | undefined, color: string | undefined) {
  try {
    const meta = loadVariantMeta();
    meta[id] = { size: size || undefined, color: color || undefined };
    localStorage.setItem(VARIANT_META_KEY, JSON.stringify(meta));
  } catch { /* ignore */ }
}
// -----------------------------------------------------

export const useCart = (initialSettings?: any, user?: any) => {
  const resolvedUser = nullOrRequest(user);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  const [orderMethod, setOrderMethod] = useState<'delivery' | 'pickup'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_order_method');
      if (saved === 'delivery' || saved === 'pickup') {
        return saved;
      }
    }
    return 'delivery';
  });

  // Helper to map DB CartRow to local CartItem
  const mapDbCartToLocal = useCallback((dbCart: any[]): CartItem[] => {
    return dbCart.map(row => {
      const item = (row.product || {}) as Root2;

      const cartItemId = row.product_variant_id
        ? `${row.product_id}-${row.product_variant_id}`
        : String(row.product_id);

      // Try to resolve image from variant or product
      let selectedImage = item.display_image || item.image;
      if (row.variant?.image_url) {
        selectedImage = row.variant.image_url;
      }

      // Extract selectedSize and selectedColor:
      // 1. Prefer the client-side variantMeta cache (always accurate, set at addToCart time)
      // 2. Fall back to attribute_values returned by the server (if backend eager-loads them)
      let selectedSize: string | undefined;
      let selectedColor: string | undefined;

      if (row.product_variant_id) {
        const meta = loadVariantMeta();
        const cached = meta[row.product_variant_id];
        if (cached) {
          selectedSize = cached.size;
          selectedColor = cached.color;
        }
      }

      if (!selectedSize && !selectedColor) {
        const attrValues: any[] = row.variant?.attribute_values || [];
        attrValues.forEach((av: any) => {
          const attrName = (av.attribute?.name || '').toLowerCase();
          const val: string = av.value || '';
          if (attrName === 'color' || attrName === 'colour') {
            selectedColor = val;
          } else if (attrName === 'size' || attrName === 'sizes') {
            selectedSize = val;
          } else if (val && !selectedSize && /^(xs|s|m|l|xl|xxl|\d+)$/i.test(val.trim())) {
            selectedSize = val;
          }
        });
      }

      return {
        id: cartItemId,
        dbId: row.id,
        item: {
          ...item,
          id: row.product_id,
          price: row.variant?.retail_price || row.variant?.price || item.price || '0',
        } as Root2,
        qty: row.quantity,
        selectedImage: resolveImageUrl(selectedImage) || undefined,
        variantId: row.product_variant_id || null,
        selectedSize: selectedSize || undefined,
        selectedColor: selectedColor || undefined,
      };
    });
  }, []);

  // 1. Initial Load: Server or LocalStorage
  useEffect(() => {
    const loadInitialCart = async () => {
      if (resolvedUser) {
        setIsLoadingCart(true);
        try {
          const dbCart = await cartService.getCart();
          setCart(mapDbCartToLocal(dbCart));
        } catch (err) {
          console.error('Failed to fetch server cart', err);
        } finally {
          setIsLoadingCart(false);
        }
      } else {
        const saved = localStorage.getItem('aura_cart');
        if (saved) {
          try {
            setCart(JSON.parse(saved));
          } catch (e) {
            console.warn('Failed to parse local cart', e);
          }
        }
      }
    };
    loadInitialCart();
  }, [resolvedUser, mapDbCartToLocal]);

  // 2. Sync Local cart to localStorage and dispatch event for real-time count updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_cart') || '[]';
      if (JSON.stringify(cart) !== saved) {
        localStorage.setItem('aura_cart', JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('aura_cart_updated'));
      }
    }
  }, [cart]);

  // 3. Listen to external changes to localStorage cart (e.g. from POS tab)
  useEffect(() => {
    const handleExternalCartUpdate = () => {
      const saved = localStorage.getItem('aura_cart');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (JSON.stringify(parsed) !== JSON.stringify(cart)) {
            setCart(parsed);
          }
        } catch (err) {
          console.error('Failed to parse external cart update', err);
        }
      } else {
        if (cart.length > 0) setCart([]);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aura_cart') {
        handleExternalCartUpdate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('aura_cart_updated', handleExternalCartUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('aura_cart_updated', handleExternalCartUpdate);
    };
  }, [cart]);

  // Sync order method to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_order_method', orderMethod);
    }
  }, [orderMethod]);

  const addToCart = async (item: Root2, qtyToAdd = 1, size?: string, color?: string) => {
    const isGuestCheckoutEnabled = initialSettings?.guest_checkout !== false && initialSettings?.guest_checkout !== 'false';
    
    if (!resolvedUser && !isGuestCheckoutEnabled) {
      window.dispatchEvent(new CustomEvent('request_login'));
      return;
    }

    if (item.status === 'archived') return;

    const sizeVal = size || '';
    const colorVal = color || '';
    const cartItemId = sizeVal || colorVal ? `${item.id}-${sizeVal}-${colorVal}` : String(item.id);

    // Find the variant ID if any
    let variantId: number | null = null;
    let selectedImage = item.display_image || item.image;

    if ((colorVal || sizeVal) && item.variants) {
      const matchingVariant = item.variants.find((v: any) => {
        if (!v.attribute_values) return false;
        
        let matchColor = !colorVal;
        let matchSize = !sizeVal;

        v.attribute_values.forEach((av: any) => {
          const parsed = parseAttributeValue(
            av.value,
            av.attribute?.name?.toLowerCase() === 'color' ||
            av.attribute?.name?.toLowerCase() === 'colour'
          );
          
          if (parsed.isColor && colorVal) {
            if (parsed.colorName.toLowerCase() === colorVal.toLowerCase() || 
                parsed.colorHex.toLowerCase() === colorVal.toLowerCase() ||
                resolveColorHex(item, parsed.colorName).toLowerCase() === resolveColorHex(item, colorVal).toLowerCase()) {
              matchColor = true;
            }
          } else if (!parsed.isColor && sizeVal) {
            if (parsed.value.toLowerCase() === sizeVal.toLowerCase()) {
              matchSize = true;
            }
          }
        });

        return matchColor && matchSize;
      });

      if (matchingVariant) {
        variantId = matchingVariant.id || null;
        selectedImage = matchingVariant.image_url || selectedImage;
      }
    }

    if (resolvedUser) {
      try {
        // Persist size/color meta so mapDbCartToLocal can restore them after re-fetching from server
        if (variantId && (sizeVal || colorVal)) {
          saveVariantMeta(variantId, sizeVal || undefined, colorVal || undefined);
        }
        await cartService.addToCart({
          product_id: item.id,
          product_variant_id: variantId,
          quantity: qtyToAdd,
        });
        // Refresh cart from server to get accurate IDs and data
        const dbCart = await cartService.getCart();
        setCart(mapDbCartToLocal(dbCart));
        toast.success('Added to cart');
      } catch (err: any) {
        toast.error(err.details?.message || 'Failed to add to cart');
      }
    } else {
      // Local logic for guests
      setCart(prev => {
        const existing = prev.find(ci => ci.id === cartItemId);
        if (existing) {
          return prev.map(ci =>
            ci.id === cartItemId ? { ...ci, qty: ci.qty + qtyToAdd } : ci
          );
        }
        return [
          ...prev,
          {
            id: cartItemId,
            item,
            qty: qtyToAdd,
            selectedSize: sizeVal || undefined,
            selectedColor: colorVal || undefined,
            selectedImage: resolveImageUrl(selectedImage) || undefined,
            variantId: variantId,
          },
        ];
      });
      toast.success('Added to cart');
    }
  };

  const updateQty = async (id: string, delta: number) => {
    const ci = cart.find(c => c.id === id);
    if (!ci) return;

    const newQty = Math.max(1, ci.qty + delta);

    if (resolvedUser && ci.dbId) {
      try {
        await cartService.updateQuantity(ci.dbId, newQty);
        setCart(prev => prev.map(c => c.id === id ? { ...c, qty: newQty } : c));
      } catch (err) {
        console.error('Failed to update qty on server', err);
      }
    } else {
      setCart(prev =>
        prev.map(c => (c.id === id ? { ...c, qty: newQty } : c))
      );
    }
  };

  const removeFromCart = async (id: string, _name: string) => {
    const ci = cart.find(c => c.id === id);
    if (resolvedUser && ci?.dbId) {
      try {
        await cartService.removeItem(ci.dbId);
        setCart(prev => prev.filter(c => c.id !== id));
        toast.success('Item removed');
      } catch (err) {
        console.error('Failed to remove item from server', err);
      }
    } else {
      setCart(prev => prev.filter(c => c.id !== id));
      toast.success('Item removed');
    }
  };

  const clearCart = async () => {
    if (resolvedUser) {
      try {
        await cartService.clearCart();
        setCart([]);
      } catch (err) {
        console.error('Failed to clear cart on server', err);
      }
    } else {
      setCart([]);
    }
  };

  const subtotal = useMemo(() =>
    cart.reduce((sum, ci) => sum + parseFloat(ci.item.price) * ci.qty, 0),
    [cart]);

  const {
    appliedCoupon,
    isApplyingCoupon,
    applyCoupon,
    removeCoupon,
    discount,
  } = useCoupon(subtotal, resolvedUser?.id);

  const { deliveryFee } = useShippingFee(
    orderMethod,
    subtotal,
    cart,
    appliedCoupon,
    initialSettings
  );

  const total = Math.max(0, subtotal - discount + deliveryFee);
  const cartCount = cart.reduce((sum, ci) => sum + ci.qty, 0);

  return {
    cart,
    setCart,
    isLoadingCart,
    orderMethod,
    setOrderMethod,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    appliedCoupon,
    isApplyingCoupon,
    subtotal,
    discount,
    deliveryFee,
    total,
    cartCount,
  };
};

