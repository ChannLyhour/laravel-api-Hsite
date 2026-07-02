import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiGrid, FiFilter, FiChevronDown, FiChevronLeft, FiChevronRight, FiX, FiDroplet, FiMaximize, FiTag } from 'react-icons/fi';
import '../styles/animation.css';
import type { ListProdoctProps } from '../types';
import { resolveImageUrl, getCategoryImage } from '../utils/imageUtils';
import { mapToUIItem, parseAttributeValue } from '../utils/priceUtils';
import { CardProduct } from './helpers/CardProduct';
import { ProductBagdeGrid } from './helpers/ProductBagdeGrid';
import { Special_Product } from './helpers/Special_Product';
import { FilterSf } from './helpers/Filter_sf';
import { useLimitGet } from '../hooks/useLimitGet';
import { SkeletonGrid, LineLoading } from './helpers/SkeletonSt';
import { brandsService, type Brand } from '@/api/owner/brands';
import { attributesService, type ProductAttribute } from '@/api/owner/product';

export const ListProdoct: React.FC<ListProdoctProps> = ({
  items,
  categories,
  onNavigate,
  addToCart,
  favorites,
  toggleFavorite,
  selectedCategoryHash = '',
  onCategoryChange,
  storeName = '',
  stores,
  ownerUserId,
  searchQuery = '',
  onSearchChange,
  flashDeals = [],
  featuredDeals = [],
  clearanceSales = [],
}) => {
  // Infinite scroll limits query hook
  const {
    items: paginatedItems,
    loading: isLimitLoading,
    loadingMore,
    hasMore,
    loadMore,
  } = useLimitGet({
    limit: 24, // multiples of 2, 3, and 4 items per page grid layout
    ownerUserId,
    storeId: stores?.id,
  });

  // Infinite Scroll page bottom check handler with requestAnimationFrame tick optimization
  useEffect(() => {
    let ticking = false;

    const handleScrollEvent = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollHeight = document.documentElement.scrollHeight;
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const clientHeight = window.innerHeight;

          // Scroll trigger threshold of 150px close to bottom of page
          const isNearBottom = scrollTop + clientHeight >= scrollHeight - 150;

          if (isNearBottom && !isLimitLoading && !loadingMore && hasMore) {
            loadMore();
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScrollEvent, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollEvent);
  }, [loadMore, isLimitLoading, loadingMore, hasMore]);

  // Filter States
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>(() => {
    if (selectedCategoryHash) {
      const hashClean = selectedCategoryHash.replace('#', '').toLowerCase();
      const matched = categories.find(cat => {
        const nameNormalized = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return (
          hashClean === nameNormalized ||
          hashClean.endsWith(`-${nameNormalized}`) ||
          hashClean === String(cat.id)
        );
      });
      return matched ? matched.id : 'all';
    }
    return 'all';
  });

  const [priceRange, setPriceRange] = useState<number>(250);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedBadgeName, setSelectedBadgeName] = useState<string | null>(null);
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [showFloatingSidebar, setShowFloatingSidebar] = useState(false);

  // Simulated visual load transition state when filters change
  const [isFiltering, setIsFiltering] = useState(false);
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [
    selectedCategoryId,
    priceRange,
    selectedColor,
    selectedSize,
    selectedBrand,
    selectedBadgeName,
    selectedDeals,
    searchQuery,
    sortBy,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setShowFloatingSidebar(true);
      } else {
        setShowFloatingSidebar(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [gridCols, setGridCols] = useState<number>(4); // 2, 3, 4, or 6 columns
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: false,
    color: false,
    size: false,
    price: false,
    brands: false,
    badge: false,
    deals: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);

  const brandsSliderRef = React.useRef<HTMLDivElement>(null);
  const categoriesSliderRef = React.useRef<HTMLDivElement>(null);

  const scrollBrands = (direction: 'left' | 'right') => {
    if (brandsSliderRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      brandsSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesSliderRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      categoriesSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getBrandProductCount = (brandName: string) => {
    let itemsForCategory = displayItems;
    if (selectedCategoryId !== 'all') {
      const getChildIds = (catId: number): number[] => {
        const children = categories.filter(c => c.parent_id === catId);
        let ids = [catId];
        children.forEach(child => {
          ids = [...ids, ...getChildIds(child.id)];
        });
        return ids;
      };
      const activeIds = getChildIds(Number(selectedCategoryId));
      itemsForCategory = itemsForCategory.filter(item => item.category_id && activeIds.includes(item.category_id));
    }
    return itemsForCategory.filter(item => (item.brand?.name || '') === brandName).length;
  };

  useEffect(() => {
    // Fetch Brands
    brandsService.getBrands(100, 0, ownerUserId)
      .then(data => setBrands(data || []))
      .catch(err => console.error('Failed to fetch brands for filter:', err));

    // Fetch Attributes for Colors/Sizes
    attributesService.getAttributes(ownerUserId)
      .then(data => setAttributes(data || []))
      .catch(err => console.error('Failed to fetch attributes for filter:', err));
  }, [ownerUserId]);

  useEffect(() => {
    if (selectedCategoryHash) {
      const hashClean = selectedCategoryHash.replace('#', '').toLowerCase();
      const matched = categories.find(cat => {
        const nameNormalized = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return (
          hashClean === nameNormalized ||
          hashClean.endsWith(`-${nameNormalized}`) ||
          hashClean === String(cat.id)
        );
      });
      setSelectedCategoryId(matched ? matched.id : 'all');
    } else {
      setSelectedCategoryId('all');
    }
  }, [selectedCategoryHash, categories]);

  // Dynamic configurations
  const filterSizes = useMemo(() => {
    const sizeAttr = attributes.find(attr =>
      attr.name.toLowerCase() === 'size' ||
      attr.name.toLowerCase() === 'sizes'
    );

    if (sizeAttr && sizeAttr.values && sizeAttr.values.length > 0) {
      return [...new Set(sizeAttr.values.map(val => val.value))];
    }

    return ['XS', 'S', 'M', 'L', 'XL', '36', '37', '38'];
  }, [attributes]);

  const filterColors = useMemo(() => {
    const colorAttr = attributes.find(attr =>
      attr.name.toLowerCase() === 'color' ||
      attr.name.toLowerCase() === 'colors' ||
      attr.name.toLowerCase() === 'colour'
    );

    if (colorAttr && colorAttr.values && colorAttr.values.length > 0) {
      const uniqueColors = new Map<string, { name: string; hex: string }>();

      colorAttr.values.forEach(val => {
        const parsed = parseAttributeValue(val.value, true);
        if (parsed.isColor) {
          const colorName = parsed.colorName || val.value;
          if (!uniqueColors.has(colorName.toLowerCase())) {
            uniqueColors.set(colorName.toLowerCase(), {
              name: colorName,
              hex: parsed.colorHex || colorName
            });
          }
        }
      });

      if (uniqueColors.size > 0) {
        return Array.from(uniqueColors.values());
      }
    }

    return [
      { name: 'Black', hex: '#000000' },
      { name: 'Navy', hex: '#1D2A44' },
      { name: 'Teal', hex: '#20B2AA' },
      { name: 'Pink', hex: '#FFB6C1' },
      { name: 'Brown', hex: '#8B4513' },
      { name: 'Gold', hex: '#FFD700' },
      { name: 'Olive', hex: '#556B2F' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Orange', hex: '#FFA500' },
    ];
  }, [attributes]);

  const filterBrands = useMemo(() => {
    const activeBrands = brands.filter(b => b.status);
    return activeBrands.map(b => b.name);
  }, [brands]);

  // Dynamic Subcategories for the top banner bubbles
  const dynamicSubCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    // Show only top-level categories (no parent_id)
    return categories.filter(c => !c.parent_id);
  }, [categories]);


  const displayItems = useMemo(() => {
    return paginatedItems;
  }, [paginatedItems]);

  const filterBadges = useMemo(() => {
    const badgesSet = new Set<string>();
    displayItems.forEach(item => {
      if (item.badge && item.badge.name) {
        const bStatus = item.badge.status;
        const isBadgeActive =
          bStatus === true ||
          (bStatus as any) === 1 ||
          String(bStatus) === '1' ||
          String(bStatus).toLowerCase() === 'true';
        if (isBadgeActive) {
          badgesSet.add(item.badge.name);
        }
      } else {
        const priceVal = parseFloat(item.price) || 0;
        const comparePrice = item.compare_at_price ? parseFloat(item.compare_at_price) : 0;
        if (comparePrice > priceVal) {
          badgesSet.add('Sale');
        }
      }
    });
    return Array.from(badgesSet);
  }, [displayItems]);

  const activeDealsList = useMemo(() => {
    const list = [];
    if (flashDeals && flashDeals.some(deal => deal.products?.some((p: any) => p.id))) {
      list.push({ id: 'flash_deals', name: 'Flash Deals' });
    }
    if (featuredDeals && featuredDeals.some(deal => deal.products?.some((p: any) => p.id))) {
      list.push({ id: 'featured_deals', name: 'Featured Deals' });
    }
    if (clearanceSales && clearanceSales.some(deal => deal.products?.some((p: any) => p.id))) {
      list.push({ id: 'clearance_sales', name: 'Clearance Sale' });
    }
    return list;
  }, [flashDeals, featuredDeals, clearanceSales]);

  const hasActiveFilters = useMemo(() => {
    return !!(selectedColor || selectedSize || selectedBrand || priceRange < 250 || selectedBadgeName || selectedDeals.length > 0);
  }, [selectedColor, selectedSize, selectedBrand, priceRange, selectedBadgeName, selectedDeals]);

  // Filtered Products Logic
  const filteredProducts = useMemo(() => {
    let result = [...displayItems];

    // 1. Filter by category
    if (selectedCategoryId !== 'all') {
      const getChildIds = (catId: number): number[] => {
        const children = categories.filter(c => c.parent_id === catId);
        let ids = [catId];
        children.forEach(child => {
          ids = [...ids, ...getChildIds(child.id)];
        });
        return ids;
      };
      const activeIds = getChildIds(Number(selectedCategoryId));
      result = result.filter(item => item.category_id && activeIds.includes(item.category_id));
    }

    // 2. Filter by price slider
    result = result.filter(item => parseFloat(item.price) <= priceRange);

    // 3. Filter by color
    if (selectedColor) {
      const activeColorObj = filterColors.find(fc => fc.name.toLowerCase() === selectedColor.toLowerCase());
      const activeHex = activeColorObj?.hex?.toLowerCase();

      result = result.filter(item =>
        item.colors.some(
          (c: string) =>
            c.toLowerCase() === selectedColor.toLowerCase() ||
            c.toLowerCase().includes(selectedColor.toLowerCase()) ||
            (activeHex && (c.toLowerCase() === activeHex || c.toLowerCase().includes(activeHex)))
        )
      );
    }

    // 4. Filter by size
    if (selectedSize) {
      result = result.filter(item =>
        item.sizes.some((s: string) => s.toUpperCase() === selectedSize.toUpperCase())
      );
    }

    // 5. Filter by brand
    if (selectedBrand) {
      result = result.filter(item => {
        const brandName = item.brand?.name || '';
        return brandName === selectedBrand;
      });
    }

    // 5.5 Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    // 5.6 Filter by product badge
    if (selectedBadgeName) {
      result = result.filter(item => {
        if (selectedBadgeName === 'Sale') {
          const priceVal = parseFloat(item.price) || 0;
          const comparePrice = item.compare_at_price ? parseFloat(item.compare_at_price) : 0;
          if (comparePrice > priceVal) return true;
        }
        if (item.badge && item.badge.name) {
          const bStatus = item.badge.status;
          const isBadgeActive =
            bStatus === true ||
            (bStatus as any) === 1 ||
            String(bStatus) === '1' ||
            String(bStatus).toLowerCase() === 'true';
          if (isBadgeActive) {
            return item.badge.name === selectedBadgeName;
          }
        }
        return false;
      });
    }

    // 5.7 Filter by selected deals
    if (selectedDeals.length > 0) {
      result = result.filter(item => {
        return selectedDeals.some(dealType => {
          if (dealType === 'flash_deals') {
            return flashDeals.some(deal => deal.products?.some((p: any) => p.id === item.id));
          }
          if (dealType === 'featured_deals') {
            return featuredDeals.some(deal => deal.products?.some((p: any) => p.id === item.id));
          }
          if (dealType === 'clearance_sales') {
            return clearanceSales.some(deal => deal.products?.some((p: any) => p.id === item.id));
          }
          return false;
        });
      });
    }

    // 6. Sorting Logic
    if (sortBy === 'price-low') {
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortBy === 'popularity') {
      result.sort((a, b) => (b.order_items_count || 0) - (a.order_items_count || 0));
    } else if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortBy === 'updated') {
      result.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
    }

    return result;
  }, [
    displayItems,
    selectedCategoryId,
    priceRange,
    selectedColor,
    selectedSize,
    selectedBrand,
    selectedBadgeName,
    selectedDeals,
    flashDeals,
    featuredDeals,
    clearanceSales,
    sortBy,
    categories,
    searchQuery,
  ]);

  // Auto-fetch more items if client-side filtering leaves the current display list too short,
  // preventing user from scrolling and getting stuck on an empty screen while more items exist.
  useEffect(() => {
    if (paginatedItems.length > 0 && filteredProducts.length < 8 && !isLimitLoading && !loadingMore && hasMore) {
      const timer = setTimeout(() => {
        loadMore();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [paginatedItems.length, filteredProducts.length, isLimitLoading, loadingMore, hasMore, loadMore]);

  // Count items per category for sidebar
  const getCategoryCount = (catId: number) => {
    const getChildIds = (id: number): number[] => {
      const children = categories.filter(c => c.parent_id === id);
      let ids = [id];
      children.forEach(child => {
        ids = [...ids, ...getChildIds(child.id)];
      });
      return ids;
    };
    const activeIds = getChildIds(catId);
    return items.filter(item => item.category_id && activeIds.includes(item.category_id))
      .length;
  };

  const handleCategorySelect = (id: number | 'all') => {
    setSelectedCategoryId(id);
    if (onCategoryChange) {
      if (id === 'all') {
        onCategoryChange('');
      } else {
        const found = categories.find(c => c.id === id);
        if (found) {
          const nameNormalized = found.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          onCategoryChange(`#${nameNormalized}`);
        }
      }
    }
    // Smooth scroll back to top of page/catalog on category change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setSelectedColor(null);
    setSelectedSize(null);
    setSelectedBrand(null);
    setSelectedBadgeName(null);
    setPriceRange(250);
    setSelectedDeals([]);
  };

  return (
    <div className="bg-[#F9F9F9] min-h-screen pb-10 font-sans">
      {/* Sticky Filter Bar */}
      <FilterSf
        categories={categories}
        items={items}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        hasActiveFilters={hasActiveFilters}
        onOpenFilterDrawer={() => setShowFilterDrawer(true)}
        searchQuery={searchQuery}
        filteredCount={filteredProducts.length}
        onClearSearch={() => onSearchChange && onSearchChange('')}
        isLoading={isLimitLoading || isFiltering || loadingMore}
      />

      {/* Main Catalog View Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Render overlay & drawer in React Portal to bypass parent stacking contexts */}
          {typeof document !== 'undefined' && createPortal(
            <>
              {/* Drawer Overlay backdrop */}
              {showFilterDrawer && (
                <div
                  className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-2xs transition-opacity duration-300"
                  onClick={() => setShowFilterDrawer(false)}
                />
              )}

              {/* Slide-out Left Drawer Panel */}
              <div
                className={`fixed left-0 top-0 bottom-0 w-full max-w-[340px] bg-white dark:bg-stone-950 z-[10000] shadow-2xl overflow-y-auto scrollbar-hide transition-transform duration-300 ease-in-out border-r border-stone-250/60 dark:border-stone-850 p-6 flex flex-col justify-between ${showFilterDrawer ? 'translate-x-0' : '-translate-x-full'
                  }`}
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-900 pb-4">
                    <h2 className="text-base font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      Filter
                    </h2>
                    {(selectedColor || selectedSize || selectedBrand || priceRange < 250 || selectedCategoryId !== 'all' || selectedBadgeName || selectedDeals.length > 0) && (
                      <button
                        onClick={() => {
                          clearAllFilters();
                          setSelectedCategoryId('all');
                        }}
                        className="text-[#E61E25] hover:text-[#c5151b] font-bold text-2xs uppercase tracking-wider border-none bg-transparent cursor-pointer transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-stone-400 dark:text-stone-500 font-semibold -mt-2 text-left">
                    Narrow down your searches with our filter.
                  </p>

                  {/* Collapsible Accordion Sections */}
                  <div className="space-y-3">
                    {/* Category Accordion */}
                    <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[8px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
                      <button
                        onClick={() => toggleSection('category')}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-center space-x-3 text-stone-800 dark:text-stone-200">
                          <FiGrid className="w-4 h-4 text-stone-400" />
                          <span className="text-xs font-black uppercase tracking-wide">Category</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-2xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                            {selectedCategoryId === 'all' ? 'All' : (categories.find(c => c.id === selectedCategoryId)?.name || 'All')}
                          </span>
                          <FiChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedSections.category ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${expandedSections.category ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                      >
                        <div className="overflow-hidden">
                          <div className="p-4 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                            <ul className="space-y-2 list-none p-0 m-0 text-stone-500 text-[15px] font-semibold text-left">
                              <li
                                className={`flex items-center justify-between cursor-pointer py-0.5 hover:text-stone-950 dark:hover:text-stone-150 transition-colors ${selectedCategoryId === 'all' ? 'text-stone-950 dark:text-stone-150 font-black' : ''}`}
                                onClick={() => handleCategorySelect('all')}
                              >
                                <span className="truncate">All Categories</span>
                                <span className="text-[11px] text-stone-400 font-bold bg-stone-100 dark:bg-stone-900 px-1.5 py-0.5 rounded-full">
                                  {displayItems.length}
                                </span>
                              </li>
                              {categories
                                .filter(c => !c.parent_id)
                                .map(cat => {
                                  const count = getCategoryCount(cat.id);
                                  const isSelected = selectedCategoryId === cat.id;
                                  const hasSub = categories.some(c => c.parent_id === cat.id);
                                  const isChildSelected = categories.some(c => c.parent_id === cat.id && selectedCategoryId === c.id);
                                  const isChildSubSelected = categories.some(c => {
                                    if (c.parent_id) {
                                      const parent = categories.find(p => p.id === c.parent_id);
                                      return parent && parent.parent_id === cat.id && selectedCategoryId === c.id;
                                    }
                                    return false;
                                  });
                                  const isOpen = isSelected || isChildSelected || isChildSubSelected;

                                  return (
                                    <div key={cat.id} className="space-y-1">
                                      <li
                                        className={`flex items-center justify-between cursor-pointer py-0.5 hover:text-[#E61E25] transition-colors ${isSelected ? 'text-[#E61E25] font-black' : ''}`}
                                        onClick={() => handleCategorySelect(cat.id)}
                                      >
                                        <span className="truncate">{cat.name}</span>
                                        <span className="text-[11px] text-stone-400 font-bold bg-stone-100 dark:bg-stone-900 px-1.5 py-0.5 rounded-full">
                                          {count}
                                        </span>
                                      </li>
                                      <div
                                        className={`grid transition-all duration-300 ease-in-out ${isOpen && hasSub ? 'grid-rows-[1fr] opacity-100 mt-1.5' : 'grid-rows-[0fr] opacity-0'
                                          }`}
                                      >
                                        <div className="overflow-hidden">
                                          <ul className="pl-4 space-y-1 border-l border-stone-200 ml-1.5 list-none">
                                            {categories
                                              .filter(c => c.parent_id === cat.id)
                                              .map(sub => {
                                                const subCount = getCategoryCount(sub.id);
                                                const isSubSelected = selectedCategoryId === sub.id;
                                                const hasSubSub = categories.some(c => c.parent_id === sub.id);
                                                const isSubSubSelected = categories.some(c => c.parent_id === sub.id && selectedCategoryId === c.id);
                                                const isSubOpen = isSubSelected || isSubSubSelected;

                                                return (
                                                  <div key={sub.id} className="space-y-1">
                                                    <li
                                                      className={`flex items-center justify-between cursor-pointer py-0.5 text-stone-500 hover:text-[#E61E25] transition-colors text-[13px] ${isSubSelected ? 'text-[#E61E25] font-bold' : ''}`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCategorySelect(sub.id);
                                                      }}
                                                    >
                                                      <span className="truncate">{sub.name}</span>
                                                      <span className="text-[10px] text-stone-400 font-semibold bg-stone-50 dark:bg-stone-900 px-1 py-0.2 rounded-full">
                                                        {subCount}
                                                      </span>
                                                    </li>
                                                    <div
                                                      className={`grid transition-all duration-300 ease-in-out ${isSubOpen && hasSubSub ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                                                        }`}
                                                    >
                                                      <div className="overflow-hidden">
                                                        <ul className="pl-4 space-y-1 border-l border-stone-150 ml-1.5 list-none">
                                                          {categories
                                                            .filter(c => c.parent_id === sub.id)
                                                            .map(subSub => {
                                                              const subSubCount = getCategoryCount(subSub.id);
                                                              const isSubSubActive = selectedCategoryId === subSub.id;
                                                              return (
                                                                <li
                                                                  key={subSub.id}
                                                                  className={`flex items-center justify-between cursor-pointer py-0.5 text-stone-400 hover:text-[#E61E25] transition-colors text-[12px] ${isSubSubActive ? 'text-[#E61E25] font-bold' : ''}`}
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCategorySelect(subSub.id);
                                                                  }}
                                                                >
                                                                  <span className="truncate">{subSub.name}</span>
                                                                  <span className="text-[9px] text-stone-400 bg-stone-50 dark:bg-stone-900 px-1 py-0.2 rounded-full">
                                                                    {subSubCount}
                                                                  </span>
                                                                </li>
                                                              );
                                                            })}
                                                        </ul>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Badge Accordion (Collections Filter) */}
                    {filterBadges.length > 0 && (
                      <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[8px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
                        <button
                          onClick={() => toggleSection('badge')}
                          className="w-full flex items-center justify-between p-3.5 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
                        >
                          <div className="flex items-center space-x-3 text-stone-800 dark:text-stone-200">
                            <FiTag className="w-4 h-4 text-stone-400" />
                            <span className="text-xs font-black uppercase tracking-wide">Collections</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-2xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                              {selectedBadgeName || 'All'}
                            </span>
                            <FiChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedSections.badge ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${expandedSections.badge ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                          <div className="overflow-hidden">
                            <div className="p-4 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                              <div className="space-y-1.5 text-left">
                                {filterBadges.map(badge => {
                                  const isSelected = selectedBadgeName === badge;
                                  return (
                                    <label
                                      key={badge}
                                      className="flex items-center space-x-2.5 text-stone-600 text-xs font-semibold cursor-pointer select-none"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => setSelectedBadgeName(isSelected ? null : badge)}
                                        className="rounded border-stone-300 text-[#E61E25] focus:ring-[#E61E25] w-3.5 h-3.5 cursor-pointer accent-[#E61E25]"
                                      />
                                      <span className={`transition-colors ${isSelected ? 'text-[#E61E25]' : 'hover:text-[#E61E25]'}`}>
                                        {badge}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Deals & Offers Accordion */}
                    {activeDealsList.length > 0 && (
                      <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[8px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
                        <button
                          onClick={() => toggleSection('deals')}
                          className="w-full flex items-center justify-between p-3.5 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
                        >
                          <div className="flex items-center space-x-3 text-stone-800 dark:text-stone-200">
                            <FiTag className="w-4 h-4 text-stone-400" />
                            <span className="text-xs font-black uppercase tracking-wide">Deals & Offers</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-2xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                              {selectedDeals.length === 0 ? 'All' : `${selectedDeals.length} Selected`}
                            </span>
                            <FiChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedSections.deals ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${expandedSections.deals ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                          <div className="overflow-hidden">
                            <div className="p-4 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                              <div className="space-y-1.5 text-left">
                                {activeDealsList.map(deal => {
                                  const isSelected = selectedDeals.includes(deal.id);
                                  return (
                                    <label
                                      key={deal.id}
                                      className="flex items-center space-x-2.5 text-stone-600 text-xs font-semibold cursor-pointer select-none"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                          if (isSelected) {
                                            setSelectedDeals(selectedDeals.filter(id => id !== deal.id));
                                          } else {
                                            setSelectedDeals([...selectedDeals, deal.id]);
                                          }
                                        }}
                                        className="rounded border-stone-300 text-[#E61E25] focus:ring-[#E61E25] w-3.5 h-3.5 cursor-pointer accent-[#E61E25]"
                                      />
                                      <span className={`transition-colors ${isSelected ? 'text-[#E61E25]' : 'hover:text-[#E61E25]'}`}>
                                        {deal.name}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Color Accordion */}
                    <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[8px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
                      <button
                        onClick={() => toggleSection('color')}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-center space-x-3 text-stone-800 dark:text-stone-200">
                          <FiDroplet className="w-4 h-4 text-stone-400" />
                          <span className="text-xs font-black uppercase tracking-wide">Color</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-2xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                            {selectedColor || 'All'}
                          </span>
                          <FiChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedSections.color ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${expandedSections.color ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                      >
                        <div className="overflow-hidden">
                          <div className="p-4 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                            <div className="flex flex-wrap gap-2 justify-start">
                              {filterColors.map(color => {
                                const isSelected = selectedColor === color.name;
                                return (
                                  <button
                                    key={color.name}
                                    onClick={() => setSelectedColor(isSelected ? null : color.name)}
                                    className={`w-6 h-6 rounded-full border transition-all cursor-pointer flex items-center justify-center p-0 ${isSelected
                                      ? 'border-stone-950 ring-2 ring-stone-950/20 scale-110'
                                      : 'border-stone-200 hover:border-stone-400 hover:scale-105'
                                      }`}
                                    title={color.name}
                                  >
                                    <span
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Size Accordion */}
                    <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[8px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
                      <button
                        onClick={() => toggleSection('size')}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-center space-x-3 text-stone-800 dark:text-stone-200">
                          <FiMaximize className="w-4 h-4 text-stone-400" />
                          <span className="text-xs font-black uppercase tracking-wide">Size</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-2xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                            {selectedSize || 'All'}
                          </span>
                          <FiChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedSections.size ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${expandedSections.size ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                      >
                        <div className="overflow-hidden">
                          <div className="p-4 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                            <div className="grid grid-cols-4 gap-1.5">
                              {filterSizes.map(sz => {
                                const isSelected = selectedSize === sz;
                                return (
                                  <button
                                    key={sz}
                                    onClick={() => setSelectedSize(isSelected ? null : sz)}
                                    className={`py-1.5 text-center text-[10px] font-black border transition-all cursor-pointer rounded-[2px] ${isSelected
                                      ? 'bg-stone-950 text-white border-stone-950'
                                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                      }`}
                                  >
                                    {sz}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price Accordion */}
                    <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[8px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
                      <button
                        onClick={() => toggleSection('price')}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-center space-x-3 text-stone-800 dark:text-stone-200">
                          <FiTag className="w-4 h-4 text-stone-400" />
                          <span className="text-xs font-black uppercase tracking-wide">Price</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-2xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                            {priceRange === 250 ? 'All' : `Under $${priceRange}`}
                          </span>
                          <FiChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedSections.price ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${expandedSections.price ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                      >
                        <div className="overflow-hidden">
                          <div className="p-4 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                            <div className="space-y-2">
                              <input
                                type="range"
                                min="5"
                                max="300"
                                value={priceRange}
                                onChange={e => setPriceRange(Number(e.target.value))}
                                className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                              />
                              <div className="flex items-center justify-between text-stone-600 text-2xs font-bold font-mono">
                                <span>Max Price: ${priceRange.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Brands Accordion */}
                    {filterBrands.length > 0 && (
                      <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[5px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
                        <button
                          onClick={() => toggleSection('brands')}
                          className="w-full flex items-center justify-between p-3.5 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
                        >
                          <div className="flex items-center space-x-3 text-stone-800 dark:text-stone-200">
                            <FiTag className="w-4 h-4 text-stone-400" />
                            <span className="text-xs font-black uppercase tracking-wide">Brands</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-2xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                              {selectedBrand || 'All'}
                            </span>
                            <FiChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedSections.brands ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${expandedSections.brands ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                          <div className="overflow-hidden">
                            <div className="p-4 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                              <div className="space-y-1.5 text-left">
                                {filterBrands.map(brand => {
                                  const isSelected = selectedBrand === brand;
                                  const count = getBrandProductCount(brand);
                                  if (count === 0 && !isSelected) return null;
                                  return (
                                    <label
                                      key={brand}
                                      className="flex items-center space-x-2.5 text-stone-600 text-xs font-semibold cursor-pointer select-none"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => setSelectedBrand(isSelected ? null : brand)}
                                        className="rounded border-stone-300 text-[#E61E25] focus:ring-[#E61E25] w-3.5 h-3.5 cursor-pointer accent-[#E61E25]"
                                      />
                                      <span className={`transition-colors ${isSelected ? 'text-[#E61E25]' : 'hover:text-[#E61E25]'}`}>
                                        {brand} ({count})
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Apply/Close Button */}
                <button
                  onClick={() => setShowFilterDrawer(false)}
                  className="w-full mt-auto py-3 bg-stone-950 hover:bg-stone-900 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-950 text-xs font-black uppercase tracking-widest rounded-[4px] cursor-pointer text-center transition-colors border-none"
                >
                  Apply Filters
                </button>
              </div>
            </>,
            document.body
          )}

          {/* Catalog & Products Grid (Right Column) */}
          <main className="flex-1 space-y-6 overflow-hidden">
            {/* Grid Tools & Sorting Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 gap-4 select-none">
              {/* Subcategories / Sub-subcategories pills */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scroll-smooth py-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {selectedCategoryId !== 'all' && (() => {
                  // Find direct children of selected category
                  const subCats = categories.filter(c => c.parent_id === selectedCategoryId && c.status === 1);
                  // If selected is a sub-category, find its siblings and children
                  const parentCat = categories.find(c => c.id === selectedCategoryId);
                  const parentId = parentCat?.parent_id;

                  // Determine which sub-items to show
                  let displaySubs: any[] = [];

                  if (subCats.length > 0) {
                    // Selected is a parent — show its children
                    displaySubs = subCats;
                  } else if (parentId) {
                    // Selected is a child — show siblings (other children of its parent)
                    displaySubs = categories.filter(c => c.parent_id === parentId && c.status === 1);
                  }

                  if (displaySubs.length === 0) return null;

                  return (
                    <>
                      {displaySubs.map(sub => {
                        const isActive = selectedCategoryId === sub.id;
                        const subCount = getCategoryCount(sub.id);
                        // Check if this sub has its own children (sub-sub)
                        const subSubCats = categories.filter(c => c.parent_id === sub.id && c.status === 1);

                        return (
                          <React.Fragment key={sub.id}>
                            <button
                              onClick={() => handleCategorySelect(sub.id)}
                              className={`shrink-0 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide whitespace-nowrap cursor-pointer transition-all duration-200 focus:outline-none ${isActive
                                ? 'bg-stone-950 text-white border-stone-950 shadow-xs'
                                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-800'
                                }`}
                            >
                              {sub.name}
                              <span className={`ml-1 text-[8px] font-bold ${isActive ? 'text-white/70' : 'text-stone-400'}`}>
                                {subCount}
                              </span>
                            </button>

                            {/* Show sub-sub categories inline if this sub is selected */}
                            {isActive && subSubCats.length > 0 && (
                              <>
                                <span className="text-stone-300 text-[10px] shrink-0 mx-0.5">›</span>
                                {subSubCats.map(subSub => {
                                  const isSubSubActive = selectedCategoryId === subSub.id;
                                  const subSubCount = getCategoryCount(subSub.id);
                                  return (
                                    <button
                                      key={subSub.id}
                                      onClick={() => handleCategorySelect(subSub.id)}
                                      className={`shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide whitespace-nowrap cursor-pointer transition-all duration-200 focus:outline-none ${isSubSubActive
                                        ? 'bg-[#E61E25] text-white border-[#E61E25]'
                                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                                        }`}
                                    >
                                      {subSub.name}
                                      <span className={`ml-1 text-[7px] ${isSubSubActive ? 'text-white/70' : 'text-stone-400'}`}>
                                        {subSubCount}
                                      </span>
                                    </button>
                                  );
                                })}
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center space-x-4">
                {/* Grid layout controls */}
                <div className="hidden sm:flex items-center border border-stone-200 rounded-[3px] p-0.5 bg-white text-stone-400 select-none">
                  {[2, 3, 4, 6].map(cols => (
                    <button
                      key={cols}
                      onClick={() => setGridCols(cols)}
                      className={`p-1.5 hover:text-stone-900 focus:outline-none transition-colors ${gridCols === cols ? 'text-stone-950 bg-stone-50 font-black' : ''
                        }`}
                      title={`${cols} Columns`}
                    >
                      <FiGrid className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>



            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              !isLimitLoading && (
                <div className="py-24 text-center space-y-4">
                  <span className="text-4xl">🔍</span>
                  <div>
                    <h3 className="font-extrabold text-stone-850 text-sm uppercase tracking-wider">
                      No matching styles
                    </h3>
                    <p className="text-stone-400 text-2xs font-semibold mt-1">
                      Try resetting color, size, or price bounds.
                    </p>
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="px-5 py-3 border border-stone-900 text-stone-900 text-[10px] font-black uppercase tracking-widest hover:bg-stone-950 hover:text-white transition-all duration-300 rounded-[2px]"
                  >
                    Clear all filters
                  </button>
                </div>
              )
            ) : (
              <div
                className={`grid animate-fade-in gap-x-6 gap-y-10 w-full ${gridCols === 2
                  ? 'grid-cols-2'
                  : gridCols === 3
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : gridCols === 4
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                  }`}
              >
                {/* Special Products Showcase (Full Width) */}
                {filteredProducts.filter(item => !!item.is_special).map((item) => {
                  return (
                    <div key={item.id} className="col-span-full">
                      <Special_Product
                        items={[item]}
                        favorites={favorites}
                        toggleFavorite={toggleFavorite}
                        addToCart={(item, qty, size, color) => addToCart(item, qty ?? 1, size, color)}
                        ownerUserId={ownerUserId}
                        stores={stores}
                        storeName={storeName}
                        onNavigate={onNavigate}
                      />
                    </div>
                  );
                })}

                {/* Standard Products (Grid Flow) */}
                {filteredProducts.filter(item => !item.is_special).map((item, idx) => {
                  const isFavorited = !!favorites[String(item.id)];
                  const isPopular = !!(item.order_items_count && item.order_items_count >= 3);

                  return (
                    <div
                      key={item.id}
                      className={isPopular ? 'col-span-2 row-span-2' : ''}
                    >
                      <div data-aos="fade-up" data-aos-duration="500" data-aos-offset="10">
                        <CardProduct
                          item={item}
                          ownerUserId={ownerUserId}
                          stores={stores}
                          storeName={storeName}
                          onNavigate={onNavigate}
                          addToCart={(item, qty, size, color) => addToCart(item, qty ?? 1, size, color)}
                          isFavorited={isFavorited}
                          onToggleFavorite={toggleFavorite}
                          isLarge={isPopular}
                          aosDelay={(idx % 3) * 100}
                          disableAos={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll loading more spinner indicator removed */}

            {/* Badge-grouped products (New, Sale, Trending, etc.) */}
            {/* <ProductBagdeGrid
              items={filteredProducts}
              ownerUserId={ownerUserId}
              stores={stores}
              storeName={storeName}
              onNavigate={onNavigate}
              addToCart={(item, qty, size, color) => addToCart(item, qty ?? 1, size, color)}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              gridCols={gridCols}
            /> */}
          </main>
        </div>
      </div>
    </div>
  );
};
