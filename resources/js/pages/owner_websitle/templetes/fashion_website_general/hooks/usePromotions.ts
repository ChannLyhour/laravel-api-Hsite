import { useState, useEffect } from 'react';
import { client } from '@/api/client';
import type { CouponRow } from '@/api/owner/coupons';
import type { FlashDealRow } from '@/api/owner/flashDeals';
import type { FeaturedDealRow } from '@/api/owner/featuredDeals';
import type { ClearanceSaleRow } from '@/api/owner/clearanceSales';
import { publicFlashDealsService } from '@/api/created_by/getFlashDealsOwnerByid';

/**
 * Hook that fetches all promotion-related data for the public storefront.
 * Uses public (non-owner) endpoints filtered by ownerUserId where available.
 */
export const usePromotions = (ownerUserId?: number | string, stores?: any) => {
  const [coupons, setCoupons] = useState<CouponRow[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('fashion_coupons');
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });
  const [flashDeals, setFlashDeals] = useState<FlashDealRow[]>([]);
  const [featuredDeals, setFeaturedDeals] = useState<FeaturedDealRow[]>([]);
  const [clearanceSales, setClearanceSales] = useState<ClearanceSaleRow[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Resolve merchant integer ID if available to prevent hash ID mismatch in client filtering
  const resolvedOwnerId = stores?.created_by || stores?.owner_id || ownerUserId;

  useEffect(() => {
    const bc = new BroadcastChannel('data_updates');
    bc.onmessage = (event) => {
      if (event.data === 'refresh') {
        setRefreshTrigger(prev => prev + 1);
      }
    };
    const handleUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('data_updated', handleUpdate);
    return () => {
      bc.close();
      window.removeEventListener('data_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!resolvedOwnerId) return;

    const fetchAll = async () => {
      setLoadingPromotions(true);
      try {
        const startTime = Date.now();
        const [c, fd, feat, cs] = await Promise.allSettled([
          client.get<CouponRow[]>(`/coupons?limit=5&skip=0`),
          publicFlashDealsService.getFlashDealsByOwnerId(resolvedOwnerId, 0, 10),
          client.get<FeaturedDealRow[]>(`/featured-deals?owner_id=${resolvedOwnerId}&limit=10&skip=0`),
          client.get<ClearanceSaleRow[]>(`/clearance-sales?owner_id=${resolvedOwnerId}&limit=10&skip=0`),
        ]);

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 3000 - elapsed);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        if (c.status === 'fulfilled' && Array.isArray(c.value)) {
          const activeCoupons = c.value.filter(coupon => coupon.is_active);
          setCoupons(activeCoupons);
          sessionStorage.setItem('fashion_coupons', JSON.stringify(activeCoupons));
        }
        if (fd.status === 'fulfilled' && Array.isArray(fd.value)) {
          setFlashDeals(fd.value.filter(d => d.is_published && d.status !== 'Expired'));
        }
        if (feat.status === 'fulfilled' && Array.isArray(feat.value)) {
          setFeaturedDeals(feat.value.filter(d => d.is_published && d.status !== 'Expired'));
        }
        if (cs.status === 'fulfilled' && Array.isArray(cs.value)) {
          setClearanceSales(cs.value.filter(d => d.is_active));
        }
      } catch (err) {
        console.warn('[usePromotions] Failed to load some promotions:', err);
      } finally {
        setLoadingPromotions(false);
      }
    };

    fetchAll();
  }, [resolvedOwnerId, refreshTrigger]);

  return {
    coupons,
    flashDeals,
    featuredDeals,
    clearanceSales,
    loadingPromotions,
  };
};

