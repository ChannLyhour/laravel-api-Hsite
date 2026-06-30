import { useState, useEffect, useMemo } from 'react';
import { categoriesService, menuItemsService } from '@/api/owner/categories';
import { bannersService, type BannerRow } from '@/api/owner/banners';
import type { Root2 } from '@/api/owner/categories';
import { ApiError } from '@/api/client';
import { mapToUIItem } from '../utils/priceUtils';
import { nullOrRequest } from '../nullOrRequest';

const defaultFashionItems = [
  {
    id: 10001,
    category_id: 1,
    name: 'Cropped Tank Top',
    price: '6.97',
    compare_at_price: '9.95',
    discount: '-30%',
    display_image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    description: 'Fine ribbed cotton cropped tank top with central zipper detail.',
    colors: ['#E61E25', '#000000'],
    status: 'active',
    created_at: '',
    updated_at: '',
    order_items_count: 0,
    likes_count: 0,
    rating: 4.5
  },
  {
    id: 10002,
    category_id: 1,
    name: 'Washed Sweatshirt',
    price: '25.95',
    compare_at_price: null,
    discount: null,
    display_image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80',
    description: 'Oversized washed black sweatshirt in heavy cotton terry.',
    colors: [],
    status: 'active',
    created_at: '',
    updated_at: '',
    order_items_count: 0,
    likes_count: 0,
    rating: 4.5
  },
  {
    id: 10003,
    category_id: 1,
    name: 'Ruffle Top',
    price: '19.95',
    compare_at_price: null,
    discount: null,
    display_image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
    description: 'Sheer sleeveless ruffle top with front tie details.',
    colors: ['#E61E25', '#000000'],
    status: 'active',
    created_at: '',
    updated_at: '',
    order_items_count: 0,
    likes_count: 0,
    rating: 4.5
  },
  {
    id: 10004,
    category_id: 1,
    name: 'Patch Printed T-Shirt',
    price: '16.95',
    compare_at_price: null,
    discount: null,
    display_image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
    description: 'Graphic printed violet tie-dye oversized t-shirt.',
    colors: ['#1A0F2B', '#8E44AD'],
    status: 'active',
    created_at: '',
    updated_at: '',
    order_items_count: 0,
    likes_count: 0,
    rating: 4.5
  }
];

/**
 * Hook to manage fashion items, query categories, handle hash URL routing/filtering,
 * and mapping catalog items for display with design defaults.
 */
export const useFashionItems = (ownerUserId?: number | string, searchQuery: string = '') => {
  const [items, setItems] = useState<Root2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [activeCategoryHash, setActiveCategoryHash] = useState<string>('');
  const [bestSellersTab, setBestSellersTab] = useState<string>('all');
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
    const handleHashChange = () => {
      setActiveCategoryHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('navigation_changed', handleHashChange);
    handleHashChange();
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('navigation_changed', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const resolvedOwner = nullOrRequest(ownerUserId);
    if (!resolvedOwner) {
      setBanners([]);
      return;
    }
    bannersService.getPublicBanners(resolvedOwner)
      .then(res => setBanners(res || []))
      .catch(err => console.warn('Failed to load banners', err));
  }, [ownerUserId, refreshTrigger]);

  useEffect(() => {
    const resolvedOwner = nullOrRequest(ownerUserId);
    if (!resolvedOwner) {
      setCategories([]);
      return;
    }
    categoriesService
      .getCategories(100, 0, resolvedOwner)
      .then(res => {
        if (res && res.categories) {
          setCategories(res.categories);
        }
      })
      .catch(err => console.warn('Failed to load categories', err));
  }, [ownerUserId, refreshTrigger]);

  useEffect(() => {
    const resolvedOwner = nullOrRequest(ownerUserId);
    if (!resolvedOwner) {
      setItems([]);
      setLoading(false);
      return;
    }
    const fetchApparel = async () => {
      try {
        setLoading(true);
        setError(null);
        // Load fashion items from the store catalog
        const data = await menuItemsService.getMenuItems(100, 0, resolvedOwner);
        setItems(data as unknown as Root2[] || []);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.details.message);
        } else {
          setError('Failed to fetch fashion catalog.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchApparel();
  }, [ownerUserId, refreshTrigger]);

  const displayItems = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item) => mapToUIItem(item));
    }
    return [];
  }, [items]);

  const underTenItems = useMemo(() => {
    return displayItems.filter(item => {
      const itemPrice = parseFloat(item.price);
      return itemPrice < 9.99;
    });
  }, [displayItems]);

  const activeCategoryIds = useMemo((): number[] => {
    if (!activeCategoryHash) return [];
    const hashClean = activeCategoryHash.replace('#', '').toLowerCase();
    const matchedCat = categories.find(cat => {
      const nameNormalized = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      return (
        hashClean === nameNormalized ||
        hashClean.endsWith(`-${nameNormalized}`) ||
        hashClean === String(cat.id)
      );
    });

    if (!matchedCat) return [];

    const getChildIds = (catId: number): number[] => {
      const children = categories.filter(c => c.parent_id === catId);
      let ids = [catId];
      children.forEach(child => {
        ids = [...ids, ...getChildIds(child.id)];
      });
      return ids;
    };

    return getChildIds(matchedCat.id);
  }, [activeCategoryHash, categories]);

  const getActiveCategoryName = () => {
    if (!activeCategoryHash) return 'All Under $9.99';
    const hashClean = activeCategoryHash.replace('#', '').toLowerCase();
    const matchedCat = categories.find(cat => {
      const nameNormalized = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      return hashClean === nameNormalized || hashClean.endsWith(`-${nameNormalized}`);
    });
    return matchedCat ? matchedCat.name : 'All Under $9.99';
  };

  const filteredItems = useMemo(() => {
    return displayItems.filter(item => {
      const matchesCategory = activeCategoryIds.length === 0 || (item.category_id && activeCategoryIds.includes(item.category_id));
      const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [displayItems, activeCategoryIds, searchQuery]);

  const displayCatalogItems = useMemo(() => {
    if (activeCategoryHash) return filteredItems;
    if (searchQuery) {
      return displayItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return underTenItems;
  }, [activeCategoryHash, filteredItems, searchQuery, displayItems, underTenItems]);


  return {
    items,
    loading,
    error,
    categories,
    banners,
    activeCategoryHash,
    setActiveCategoryHash,
    bestSellersTab,
    setBestSellersTab,
    displayItems,
    underTenItems,
    activeCategoryIds,
    getActiveCategoryName,
    displayCatalogItems,
    filteredItems,
  };
};

