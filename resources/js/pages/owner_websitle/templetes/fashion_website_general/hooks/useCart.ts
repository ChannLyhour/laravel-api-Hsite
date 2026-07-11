import { useState, useMemo, useEffect, useCallback } from 'react';

import type { Root2 } from '@/api/owner/categories';
import type { CartItem } from '../types';
import { parseAttributeValue, resolveColorHex } from '../utils/priceUtils';
import { resolveImageUrl } from '../utils/imageUtils';
import { useCoupon } from './useCoupon';
import { useShippingFee } from './useShippingFee';
import { cartService } from '@/api/owner/cart';
import { toast } from '../utils/toast';

/**
 * Hook to manage shopping cart operations, calculations, and toast feedback.
 * Now accepts optional initialSettings and user to enforce authentication and real data.
 */
// --------------- variant meta helpers ---------------
const VARIANT_META_KEY = 'aura_variant_meta';

function loadVariantMeta(): Record<string, { size?: string; color?: string; addonsPrice?: number }> {
  try {
    const raw = localStorage.getItem(VARIANT_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveVariantMeta(productId: number, variantId: number | null, size: string | undefined, color: string | undefined, addonsPrice?: number) {
  try {
    const meta = loadVariantMeta();
    const key = `${productId}-${variantId || 'null'}`;
    meta[key] = { size: size || undefined, color: color || undefined, addonsPrice: addonsPrice || undefined };
    localStorage.setItem(VARIANT_META_KEY, JSON.stringify(meta));
  } catch { /* ignore */ }
}
// -----------------------------------------------------

export const useCart = (initialSettings?: any, user?: any) => {
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
      let addonsPrice = 0;

      const meta = loadVariantMeta();
      const cached = meta[`${row.product_id}-${row.product_variant_id || 'null'}`];
      if (cached) {
        selectedSize = cached.size;
        selectedColor = cached.color;
        addonsPrice = cached.addonsPrice || 0;
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

      const baseItemPrice = parseFloat(row.variant?.retail_price || row.variant?.price || item.price || '0');
      const totalAddonsOriginalPrice = (item.addons || []).reduce(
        (sum: number, add: any) => sum + (parseFloat(String(add.additional_price)) || 0),
        0
      );
      const isUnitPriceEqualToTotalAddons = (item.addons && item.addons.length > 0) &&
        Math.abs(baseItemPrice - totalAddonsOriginalPrice) < 0.01;
      const finalPrice = String(isUnitPriceEqualToTotalAddons ? addonsPrice : baseItemPrice + addonsPrice);

      return {
        id: cartItemId,
        dbId: row.id,
        item: {
          ...item,
          id: row.product_id,
          price: finalPrice,
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
      if (user) {
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
  }, [user, mapDbCartToLocal]);

  // 2. Sync Local cart to localStorage (only for guests)
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      localStorage.setItem('aura_cart', JSON.stringify(cart));
    }
  }, [cart, user]);

  // Sync order method to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_order_method', orderMethod);
    }
  }, [orderMethod]);

  const addToCart = async (item: Root2, qtyToAdd = 1, size?: string, color?: string, addonsPrice?: number) => {
    const isGuestCheckoutEnabled = initialSettings?.guest_checkout !== false && initialSettings?.guest_checkout !== 'false';
    
    if (!user && !isGuestCheckoutEnabled) {
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

    // Persist size/color meta so mapDbCartToLocal can restore them after re-fetching from server
    saveVariantMeta(item.id, variantId, sizeVal || undefined, colorVal || undefined, addonsPrice);

    if (user) {
      try {
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

        // Add addonsPrice to item price
        const baseItemPrice = parseFloat(item.price || '0');
        const totalAddonsOriginalPrice = (item.addons || []).reduce(
          (sum: number, add: any) => sum + (parseFloat(String(add.additional_price)) || 0),
          0
        );
        const isUnitPriceEqualToTotalAddons = (item.addons && item.addons.length > 0) &&
          Math.abs(baseItemPrice - totalAddonsOriginalPrice) < 0.01;
        const finalPrice = String(isUnitPriceEqualToTotalAddons ? (addonsPrice || 0) : baseItemPrice + (addonsPrice || 0));

        return [
          ...prev,
          {
            id: cartItemId,
            item: {
              ...item,
              price: finalPrice,
            },
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

    if (user && ci.dbId) {
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
    if (user && ci?.dbId) {
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
    if (user) {
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
  } = useCoupon(subtotal, user?.id);

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

