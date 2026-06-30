import { useState, useEffect } from 'react';
import { client } from '@/api/client';
import type { CouponRow } from '@/api/owner/coupons';
import type { FlashDealRow } from '@/api/owner/flashDeals';
import type { FeaturedDealRow } from '@/api/owner/featuredDeals';
import type { ClearanceSaleRow } from '@/api/owner/clearanceSales';
import { publicFlashDealsService } from '@/api/created_by/getFlashDealsOwnerByid';
import { nullOrRequest } from '../nullOrRequest';

/**
 * Hook that fetches all promotion-related data for the public storefront.
 * Uses public (non-owner) endpoints filtered by ownerUserId where available.
 */
export const usePromotions = (ownerUserId?: number | string) => {
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
    const resolvedOwner = nullOrRequest(ownerUserId);
    if (!resolvedOwner) {
      setCoupons([]);
      setFlashDeals([]);
      setFeaturedDeals([]);
      setClearanceSales([]);
      setLoadingPromotions(false);
      return;
    }

    const fetchAll = async () => {
      setLoadingPromotions(true);
      try {
        const ownerIdParam = resolvedOwner ? `owner_id=${resolvedOwner}` : '';
        const [c, fd, feat, cs] = await Promise.allSettled([
          client.get<CouponRow[]>(`/coupons?limit=5&skip=0`),
          publicFlashDealsService.getFlashDealsByOwnerId(resolvedOwner, 0, 10),
          client.get<FeaturedDealRow[]>(`/featured-deals?${ownerIdParam}&limit=10&skip=0`),
          client.get<ClearanceSaleRow[]>(`/clearance-sales?${ownerIdParam}&limit=10&skip=0`),
        ]);

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
  }, [ownerUserId, refreshTrigger]);

  return {
    coupons,
    flashDeals,
    featuredDeals,
    clearanceSales,
    loadingPromotions,
  };
};

