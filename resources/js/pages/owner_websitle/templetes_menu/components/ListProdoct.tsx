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
import { SidebarFilter } from '../SidebarFilter';

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
      {/* Main Catalog View Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">



        <div className="flex flex-col lg:flex-row gap-8">
          {/* Permanent Desktop Sidebar Filter (Visible only on lg and up) */}
          <aside className="hidden lg:block w-full lg:max-w-[280px] shrink-0 self-start sticky top-28">
            <SidebarFilter
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={handleCategorySelect}
              getCategoryCount={getCategoryCount}
              activeCategoryName={activeCategoryName}
              filterColors={filterColors}
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
              filterSizes={filterSizes}
              selectedSize={selectedSize}
              onSizeSelect={setSelectedSize}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              filterBrands={filterBrands}
              selectedBrand={selectedBrand}
              onBrandSelect={setSelectedBrand}
              getBrandProductCount={getBrandProductCount}
              totalProductsCount={displayItems.length}
              clearAllFilters={clearAllFilters}
            />
          </aside>

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
                className={`fixed left-0 top-0 bottom-0 w-full max-w-[340px] bg-white dark:bg-stone-950 z-[10000] shadow-2xl overflow-y-auto scrollbar-hide transition-transform duration-300 ease-in-out border-r border-stone-250/60 dark:border-stone-850 p-6 flex flex-col justify-between ${
                  showFilterDrawer ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                <SidebarFilter
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onCategorySelect={handleCategorySelect}
                  getCategoryCount={getCategoryCount}
                  activeCategoryName={activeCategoryName}
                  filterColors={filterColors}
                  selectedColor={selectedColor}
                  onColorSelect={setSelectedColor}
                  filterSizes={filterSizes}
                  selectedSize={selectedSize}
                  onSizeSelect={setSelectedSize}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  filterBrands={filterBrands}
                  selectedBrand={selectedBrand}
                  onBrandSelect={setSelectedBrand}
                  getBrandProductCount={getBrandProductCount}
                  totalProductsCount={displayItems.length}
                  clearAllFilters={clearAllFilters}
                  onClose={() => setShowFilterDrawer(false)}
                />
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
                {/* Mobile Filter Button trigger */}
                <button
                  onClick={() => setShowFilterDrawer(true)}
                  className="lg:hidden flex items-center space-x-1.5 px-3 py-1.5 border border-stone-200 hover:border-stone-400 rounded-[3px] bg-white text-[10px] font-black uppercase tracking-wider text-stone-750 transition-colors cursor-pointer"
                >
                  <FiFilter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>
              </div>

              <div className="flex items-center space-x-4">
                {/* Sort select */}
                <div className="relative shrink-0 select-none">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-stone-200 hover:border-stone-400 text-[10px] font-black uppercase tracking-wider text-stone-750 focus:outline-none focus:border-stone-900 transition-colors cursor-pointer rounded-[3px]"
                  >
                    <option value="default">Sort: Recommend</option>
                    <option value="latest">Newest Arrivals</option>
                    <option value="updated">Recently Updated</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="popularity">Popularity</option>
                  </select>
                  <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none w-3 h-3" />
                </div>

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
