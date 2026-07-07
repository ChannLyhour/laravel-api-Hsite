import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiGrid, FiFilter, FiChevronDown, FiChevronLeft, FiChevronRight, FiX, FiDroplet, FiMaximize, FiTag } from 'react-icons/fi';
import '../styles/animation.css';
import type { ListProdoctProps } from '../types';
import { resolveImageUrl, getCategoryImage } from '../utils/imageUtils';
import { mapToUIItem, parseAttributeValue } from '../utils/priceUtils';
import { CardProduct } from './helpers/CardProduct';
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
}) => {
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
  const [sortBy, setSortBy] = useState<string>('latest');
  const [showFloatingSidebar, setShowFloatingSidebar] = useState(false);

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

  const [gridCols, setGridCols] = useState<number>(4); // 2, 3, or 4 columns
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: false,
    color: false,
    size: false,
    price: false,
    brands: false,
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
    return items.map((item) => mapToUIItem(item));
  }, [items]);

  // Compute active category name
  const activeCategoryName = useMemo(() => {
    if (selectedCategoryId === 'all') return 'Collections  Categories';
    const found = categories.find(c => c.id === selectedCategoryId);
    return found ? found.name : 'Collections  Categories';
  }, [selectedCategoryId, categories]);

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
          c =>
            c.toLowerCase() === selectedColor.toLowerCase() ||
            c.toLowerCase().includes(selectedColor.toLowerCase()) ||
            (activeHex && (c.toLowerCase() === activeHex || c.toLowerCase().includes(activeHex)))
        )
      );
    }

    // 4. Filter by size
    if (selectedSize) {
      result = result.filter(item =>
        item.sizes.some(s => s.toUpperCase() === selectedSize.toUpperCase())
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
    sortBy,
    categories,
    searchQuery,
  ]);

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
    return displayItems.filter(item => item.category_id && activeIds.includes(item.category_id))
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
  };

  const clearAllFilters = () => {
    setSelectedColor(null);
    setSelectedSize(null);
    setSelectedBrand(null);
    setPriceRange(250);
  };

  return (
    <div className="bg-[#F9F9F9] min-h-screen pb-10 font-sans">
      {/* Category Banner / Header (Mockup Match) */}
      <div className="bg-stone-50 border-b border-stone-200/50 py-12 text-center relative overflow-hidden animate-fade-in">
        <div className="max-w-7xl mx-auto px-1.5 relative z-10">

          {/* Sub categories circular cards grid */}
          <div className="relative max-w-4xl mx-auto px-10 mt-8">
            {/* Left Scroll Button */}
            <button
              onClick={() => scrollCategories('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-stone-200 text-stone-600 hover:text-[#E61E25] hover:border-[#E61E25] transition-all cursor-pointer z-10 hover:shadow-md focus:outline-none"
              title="Scroll Left"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>

            {/* Slider Container */}
            <div
              ref={categoriesSliderRef}
              className="flex items-center gap-6 sm:gap-10 overflow-x-auto scrollbar-hide py-2 scroll-smooth select-none justify-start md:justify-center w-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Filter Drawer Option */}
              <div
                className="flex flex-col items-center cursor-pointer group shrink-0"
                onClick={() => setShowFilterDrawer(true)}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[5px] flex items-center justify-center border border-stone-200 transition-all duration-350 shadow-2xs group-hover:shadow-md bg-white mb-2 transform scale-100 group-hover:scale-105 text-stone-400 group-hover:text-[#E61E25] group-hover:border-[#E61E25]/30">
                  <FiFilter className="w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300" />
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider group-hover:text-[#E61E25] transition-colors text-stone-500">
                  Filter
                </span>
              </div>

              {/* All Categories Option */}
              <div
                className="flex flex-col items-center cursor-pointer group shrink-0"
                onClick={() => handleCategorySelect('all')}
              >
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[5px] flex items-center justify-center border transition-all duration-350 shadow-2xs group-hover:shadow-md bg-white mb-2 transform scale-100 group-hover:scale-105 ${selectedCategoryId === 'all' ? 'border-[#E61E25]/30 shadow-xs text-[#E61E25]' : 'border-stone-200 text-stone-400 group-hover:text-stone-700'
                  }`}>
                  <FiGrid className="w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300" />
                </div>
                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider group-hover:text-[#E61E25] transition-colors ${selectedCategoryId === 'all' ? 'text-[#E61E25]' : 'text-stone-500'
                  }`}>
                  All Categories
                </span>
              </div>

              {dynamicSubCategories.map((sub) => {
                const isSelected = selectedCategoryId === sub.id;
                return (
                  <div
                    key={sub.id}
                    className="flex flex-col items-center cursor-pointer group shrink-0"
                    onClick={() => handleCategorySelect(sub.id)}
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[5px] overflow-hidden border transition-all duration-350 shadow-2xs group-hover:shadow-md p-1 bg-white mb-2 transform scale-100 group-hover:scale-105 ${isSelected ? 'border-[#E61E25]/30 shadow-xs' : 'border-stone-200'
                      }`}>
                      <img
                        src={resolveImageUrl(sub.image) || getCategoryImage(sub.name)}
                        alt={sub.name}
                        className="w-full h-full object-cover rounded-[5px]"
                      />
                    </div>
                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider group-hover:text-[#E61E25] transition-colors ${isSelected ? 'text-[#E61E25]' : 'text-stone-500'
                      }`}>
                      {sub.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => scrollCategories('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-stone-200 text-stone-600 hover:text-[#E61E25] hover:border-[#E61E25] transition-all cursor-pointer z-10 hover:shadow-md focus:outline-none"
              title="Scroll Right"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog View Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

        {/* Horizontal Brand & Filter Utility Bar (Mockup Match) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 select-none">
          {/* Left section: Category + Filter Button */}
          <div className="flex items-center space-x-3.5 shrink-0 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-stone-900">
                {activeCategoryName}
              </span>
              <span className="text-[10px] text-stone-400 font-bold bg-stone-100 px-2 py-0.5 rounded-full">
                {filteredProducts.length} Items
              </span>
              {searchQuery && (
                <span className="flex items-center gap-1 text-[10px] text-[#E61E25] font-black bg-red-50 border border-red-100/60 px-2.5 py-0.5 rounded-full">
                  Search: "{searchQuery}"
                  <FiX
                    className="w-3 h-3 cursor-pointer hover:text-red-750 transition-colors"
                    onClick={() => onSearchChange && onSearchChange('')}
                  />
                </span>
              )}
            </div>

          </div>

          {/* Middle: Brands Horizontal Slider */}
          {filterBrands.length > 0 && (
            <div className="flex items-center space-x-1 flex-1 max-w-full md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-2">
              <button
                onClick={() => scrollBrands('left')}
                className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors focus:outline-none border-none bg-transparent cursor-pointer font-bold text-xs"
              >
                &lt;
              </button>
              <div
                ref={brandsSliderRef}
                className="flex items-center space-x-1.5 overflow-x-auto scrollbar-hide py-1 flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filterBrands.map(brand => {
                  const isSelected = selectedBrand === brand;
                  const count = getBrandProductCount(brand);
                  if (count === 0 && !isSelected) return null;
                  return (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(isSelected ? null : brand)}
                      className={`px-3 py-1.5 border transition-all duration-300 whitespace-nowrap text-[10px] font-black uppercase rounded-[2px] cursor-pointer ${isSelected
                        ? 'bg-[#E61E25] text-white border-[#E61E25] shadow-xs'
                        : 'bg-white text-stone-600 border-stone-250 hover:border-[#E61E25] hover:text-[#E61E25]'
                        }`}
                    >
                      {brand} ({count})
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => scrollBrands('right')}
                className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors focus:outline-none border-none bg-transparent cursor-pointer font-bold text-xs"
              >
                &gt;
              </button>
            </div>
          )}

          {/* Right: Sort select */}
          <div className="relative shrink-0 w-full md:w-auto">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full md:w-auto appearance-none pl-4 pr-9 py-2 bg-white border border-stone-200 hover:border-stone-400 text-2xs font-black uppercase tracking-wider text-stone-750 focus:outline-none focus:border-stone-900 transition-colors cursor-pointer rounded-[3px]"
            >
              <option value="default">Sort by: Recommend</option>
              <option value="latest">Newest Arrivals</option>
              <option value="updated">Recently Updated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popularity">Popularity</option>
            </select>
            <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Render overlay & drawer in React Portal to bypass parent stacking contexts */}
          {typeof document !== 'undefined' && createPortal(
            <>
              {/* Floating Vertical Categories Sidebar (Shown on Scroll) */}
              <div
                className={`fixed right-0 top-[115px] z-40 bg-white/95 dark:bg-stone-900/95 shadow-2xl rounded-l-2xl border-l border-t border-b border-stone-200/80 dark:border-stone-850 pl-4 pr-3 py-4 w-[95px] hidden lg:flex flex-col gap-6 items-center select-none transition-all duration-300 ${
                  showFloatingSidebar ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
                }`}
                style={{
                  boxShadow: '-10px 0 30px -5px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Filter Option */}
                <div
                  className="flex flex-row-reverse items-center gap-2.5 cursor-pointer group"
                  onClick={() => setShowFilterDrawer(true)}
                >
                  <div className="w-12 h-12 rounded-[5px] flex items-center justify-center border border-stone-200 bg-white dark:bg-stone-950 transition-all duration-350 shadow-2xs group-hover:shadow-md transform scale-100 group-hover:scale-105 text-stone-400 group-hover:text-[#E61E25] group-hover:border-[#E61E25]/30">
                    <FiFilter className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 group-hover:text-[#E61E25] transition-colors whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    Filter
                  </span>
                </div>

                {/* All Categories Option */}
                <div
                  className="flex flex-row-reverse items-center gap-2.5 cursor-pointer group"
                  onClick={() => {
                    handleCategorySelect('all');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className={`w-12 h-12 rounded-[5px] flex items-center justify-center border transition-all duration-350 shadow-2xs group-hover:shadow-md bg-white dark:bg-stone-950 transform scale-100 group-hover:scale-105 ${
                    selectedCategoryId === 'all' ? 'border-[#E61E25] text-[#E61E25]' : 'border-stone-200 text-stone-400 group-hover:text-stone-700'
                  }`}>
                    <FiGrid className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider transition-colors whitespace-nowrap ${
                    selectedCategoryId === 'all' ? 'text-[#E61E25]' : 'text-stone-500 group-hover:text-[#E61E25]'
                  }`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    All Categories
                  </span>
                </div>

                {/* Category Items */}
                {dynamicSubCategories.map((sub) => {
                  const isSelected = selectedCategoryId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className="flex flex-row-reverse items-center gap-2.5 cursor-pointer group"
                      onClick={() => {
                        handleCategorySelect(sub.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className={`w-12 h-12 rounded-[5px] overflow-hidden border transition-all duration-350 shadow-2xs group-hover:shadow-md p-1 bg-white dark:bg-stone-950 transform scale-100 group-hover:scale-105 ${
                        isSelected ? 'border-[#E61E25] shadow-xs' : 'border-stone-200'
                      }`}>
                        <img
                          src={resolveImageUrl(sub.image) || getCategoryImage(sub.name)}
                          alt={sub.name}
                          className="w-full h-full object-cover rounded-[5px]"
                        />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider transition-colors whitespace-nowrap ${
                        isSelected ? 'text-[#E61E25]' : 'text-stone-500 group-hover:text-[#E61E25]'
                      }`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {sub.name}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Drawer Overlay backdrop */}
              {showFilterDrawer && (
                <div 
                  className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-2xs transition-opacity duration-300"
                  onClick={() => setShowFilterDrawer(false)}
                />
              )}

              {/* Slide-out Left Drawer Panel */}
              <div
                className={`fixed left-0 top-0 bottom-0 w-full max-w-[340px] bg-white dark:bg-stone-950 z-[10000] shadow-2xl overflow-y-auto scrollbar-hide transition-transform duration-300 ease-in-out border-r border-stone-250/60 dark:border-stone-850 p-6 flex flex-col justify-between ${
                  showFilterDrawer ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-900 pb-4">
                    <h2 className="text-base font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      Filter
                    </h2>
                    {(selectedColor || selectedSize || selectedBrand || priceRange < 250 || selectedCategoryId !== 'all') && (
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
                            {selectedCategoryId === 'all' ? 'All' : activeCategoryName}
                          </span>
                          <FiChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedSections.category ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          expandedSections.category ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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
                                        className={`grid transition-all duration-300 ease-in-out ${
                                          isOpen && hasSub ? 'grid-rows-[1fr] opacity-100 mt-1.5' : 'grid-rows-[0fr] opacity-0'
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
                                                      className={`grid transition-all duration-300 ease-in-out ${
                                                        isSubOpen && hasSubSub ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
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
                        className={`grid transition-all duration-300 ease-in-out ${
                          expandedSections.color ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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
                        className={`grid transition-all duration-300 ease-in-out ${
                          expandedSections.size ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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
                        className={`grid transition-all duration-300 ease-in-out ${
                          expandedSections.price ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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
                          className={`grid transition-all duration-300 ease-in-out ${
                            expandedSections.brands ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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
          <main className="flex-1 space-y-6">
            {/* Grid Tools & Sorting Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 flex-wrap gap-4 select-none">
              <div className="flex items-center space-x-3">
                <p className="text-stone-500 text-2xs font-bold uppercase tracking-wider">
                  Showing {filteredProducts.length} of {displayItems.length} styles
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {/* Grid layout controls */}
                <div className="hidden sm:flex items-center border border-stone-200 rounded-[3px] p-0.5 bg-white text-stone-400 select-none">
                  {[2, 3, 4].map(cols => (
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
            ) : (
              <div
                className={`grid gap-x-6 gap-y-10 animate-fade-in ${gridCols === 2
                  ? 'grid-cols-2'
                  : gridCols === 3
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                  }`}
              >
                {filteredProducts.map((item) => {
                  const isFavorited = !!favorites[String(item.id)];

                  return (
                    <CardProduct
                      key={item.id}
                      item={item}
                      ownerUserId={ownerUserId}
                      stores={stores}
                      storeName={storeName}
                      onNavigate={onNavigate}
                      addToCart={(item, qty, size, color) => addToCart(item, qty ?? 1, size, color)}
                      isFavorited={isFavorited}
                      onToggleFavorite={toggleFavorite}
                    />
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
