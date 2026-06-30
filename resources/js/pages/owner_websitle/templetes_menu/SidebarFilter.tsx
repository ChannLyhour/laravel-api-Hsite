import React, { useState } from 'react';
import { FiGrid, FiChevronDown, FiDroplet, FiMaximize, FiTag } from 'react-icons/fi';

interface CategoryRow {
  id: number;
  name: string;
  parent_id?: number | null;
}

interface SidebarFilterProps {
  categories: CategoryRow[];
  selectedCategoryId: number | 'all';
  onCategorySelect: (id: number | 'all') => void;
  getCategoryCount: (id: number) => number;
  activeCategoryName: string;

  filterColors: { name: string; hex: string }[];
  selectedColor: string | null;
  onColorSelect: (color: string | null) => void;

  filterSizes: string[];
  selectedSize: string | null;
  onSizeSelect: (size: string | null) => void;

  priceRange: number;
  onPriceRangeChange: (price: number) => void;

  filterBrands: string[];
  selectedBrand: string | null;
  onBrandSelect: (brand: string | null) => void;
  getBrandProductCount: (brand: string) => number;

  totalProductsCount: number;
  clearAllFilters: () => void;
  onClose?: () => void;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
  getCategoryCount,
  activeCategoryName,

  filterColors,
  selectedColor,
  onColorSelect,

  filterSizes,
  selectedSize,
  onSizeSelect,

  priceRange,
  onPriceRangeChange,

  filterBrands,
  selectedBrand,
  onBrandSelect,
  getBrandProductCount,

  totalProductsCount,
  clearAllFilters,
  onClose,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    color: true,
    size: true,
    price: true,
    brands: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="w-full bg-white dark:bg-stone-950 p-5 rounded-sm border border-stone-200/60 dark:border-stone-850 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-900 pb-4">
        <h2 className="text-sm font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest flex items-center gap-2">
          <FiTag className="w-4 h-4 text-stone-900 stroke-[2.5]" />
          Filter
        </h2>
        {(selectedColor || selectedSize || selectedBrand || priceRange < 250 || selectedCategoryId !== 'all') && (
          <button
            onClick={clearAllFilters}
            className="text-[#E61E25] hover:text-[#c5151b] font-bold text-[10px] uppercase tracking-wider border-none bg-transparent cursor-pointer transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Collapsible Accordion Sections */}
      <div className="space-y-4">
        {/* Category Accordion */}
        <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[3px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
          <button
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between p-3 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
          >
            <div className="flex items-center space-x-2.5 text-stone-855 dark:text-stone-200">
              <FiGrid className="w-4 h-4 text-stone-400" />
              <span className="text-[11px] font-black uppercase tracking-wider">Category</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-[9px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                {selectedCategoryId === 'all' ? 'All' : activeCategoryName}
              </span>
              <FiChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-300 ${expandedSections.category ? 'rotate-180' : ''}`} />
            </div>
          </button>
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              expandedSections.category ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="p-3.5 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                <ul className="space-y-2 list-none p-0 m-0 text-stone-500 text-[13px] font-semibold text-left">
                  <li
                    className={`flex items-center justify-between cursor-pointer py-0.5 hover:text-stone-950 dark:hover:text-stone-155 transition-colors ${selectedCategoryId === 'all' ? 'text-stone-950 dark:text-stone-155 font-black' : ''}`}
                    onClick={() => onCategorySelect('all')}
                  >
                    <span className="truncate">All Categories</span>
                    <span className="text-[10px] text-stone-400 font-bold bg-stone-100 dark:bg-stone-900 px-1.5 py-0.5 rounded-full">
                      {totalProductsCount}
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
                            onClick={() => onCategorySelect(cat.id)}
                          >
                            <span className="truncate">{cat.name}</span>
                            <span className="text-[10px] text-stone-400 font-bold bg-stone-100 dark:bg-stone-900 px-1.5 py-0.5 rounded-full">
                              {count}
                            </span>
                          </li>
                          <div
                            className={`grid transition-all duration-300 ease-in-out ${
                              isOpen && hasSub ? 'grid-rows-[1fr] opacity-100 mt-1.5' : 'grid-rows-[0fr] opacity-0'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <ul className="pl-3.5 space-y-1 border-l border-stone-200 ml-1.5 list-none">
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
                                          className={`flex items-center justify-between cursor-pointer py-0.5 text-stone-500 hover:text-[#E61E25] transition-colors text-[12px] ${isSubSelected ? 'text-[#E61E25] font-bold' : ''}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onCategorySelect(sub.id);
                                          }}
                                        >
                                          <span className="truncate">{sub.name}</span>
                                          <span className="text-[9px] text-stone-400 font-semibold bg-stone-50 dark:bg-stone-900 px-1 py-0.2 rounded-full">
                                            {subCount}
                                          </span>
                                        </li>
                                        <div
                                          className={`grid transition-all duration-300 ease-in-out ${
                                            isSubOpen && hasSubSub ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                                          }`}
                                        >
                                          <div className="overflow-hidden">
                                            <ul className="pl-3.5 space-y-1 border-l border-stone-150 ml-1.5 list-none">
                                              {categories
                                                .filter(c => c.parent_id === sub.id)
                                                .map(subSub => {
                                                  const subSubCount = getCategoryCount(subSub.id);
                                                  const isSubSubActive = selectedCategoryId === subSub.id;
                                                  return (
                                                    <li
                                                      key={subSub.id}
                                                      className={`flex items-center justify-between cursor-pointer py-0.5 text-stone-400 hover:text-[#E61E25] transition-colors text-[11px] ${isSubSubActive ? 'text-[#E61E25] font-bold' : ''}`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCategorySelect(subSub.id);
                                                      }}
                                                    >
                                                      <span className="truncate">{subSub.name}</span>
                                                      <span className="text-[8px] text-stone-450 bg-stone-50 dark:bg-stone-900 px-1 py-0.2 rounded-full">
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
        <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[3px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
          <button
            onClick={() => toggleSection('color')}
            className="w-full flex items-center justify-between p-3 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
          >
            <div className="flex items-center space-x-2.5 text-stone-855 dark:text-stone-200">
              <FiDroplet className="w-4 h-4 text-stone-400" />
              <span className="text-[11px] font-black uppercase tracking-wider">Color</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-[9px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                {selectedColor || 'All'}
              </span>
              <FiChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-300 ${expandedSections.color ? 'rotate-180' : ''}`} />
            </div>
          </button>
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              expandedSections.color ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="p-3.5 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                <div className="flex flex-wrap gap-2 justify-start">
                  {filterColors.map(color => {
                    const isSelected = selectedColor === color.name;
                    return (
                      <button
                        key={color.name}
                        onClick={() => onColorSelect(isSelected ? null : color.name)}
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
        <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[3px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
          <button
            onClick={() => toggleSection('size')}
            className="w-full flex items-center justify-between p-3 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
          >
            <div className="flex items-center space-x-2.5 text-stone-855 dark:text-stone-200">
              <FiMaximize className="w-4 h-4 text-stone-400" />
              <span className="text-[11px] font-black uppercase tracking-wider">Size</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-[9px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                {selectedSize || 'All'}
              </span>
              <FiChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-300 ${expandedSections.size ? 'rotate-180' : ''}`} />
            </div>
          </button>
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              expandedSections.size ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="p-3.5 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                <div className="grid grid-cols-4 gap-1.5">
                  {filterSizes.map(sz => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        onClick={() => onSizeSelect(isSelected ? null : sz)}
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
        <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[3px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between p-3 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
          >
            <div className="flex items-center space-x-2.5 text-stone-855 dark:text-stone-200">
              <FiTag className="w-4 h-4 text-stone-400" />
              <span className="text-[11px] font-black uppercase tracking-wider">Price</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-[9px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                {priceRange === 250 ? 'All' : `Under $${priceRange}`}
              </span>
              <FiChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-300 ${expandedSections.price ? 'rotate-180' : ''}`} />
            </div>
          </button>
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              expandedSections.price ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="p-3.5 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                <div className="space-y-2">
                  <input
                    type="range"
                    min="5"
                    max="300"
                    value={priceRange}
                    onChange={e => onPriceRangeChange(Number(e.target.value))}
                    className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                  />
                  <div className="flex items-center justify-between text-stone-600 text-[10px] font-bold font-mono">
                    <span>Max Price: ${priceRange.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brands Accordion */}
        {filterBrands.length > 0 && (
          <div className="border border-stone-200/60 dark:border-stone-900/60 rounded-[3px] bg-stone-50/50 dark:bg-stone-900/10 overflow-hidden">
            <button
              onClick={() => toggleSection('brands')}
              className="w-full flex items-center justify-between p-3 hover:bg-stone-100/30 dark:hover:bg-stone-900/20 transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
            >
              <div className="flex items-center space-x-2.5 text-stone-855 dark:text-stone-200">
                <FiTag className="w-4 h-4 text-stone-400" />
                <span className="text-[11px] font-black uppercase tracking-wider">Brands</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[9px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">
                  {selectedBrand || 'All'}
                </span>
                <FiChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-300 ${expandedSections.brands ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                expandedSections.brands ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="p-3.5 border-t border-stone-200/60 dark:border-stone-900/60 bg-white dark:bg-stone-950/20">
                  <div className="space-y-1.5 text-left">
                    {filterBrands.map(brand => {
                      const isSelected = selectedBrand === brand;
                      const count = getBrandProductCount(brand);
                      if (count === 0 && !isSelected) return null;
                      return (
                        <label
                          key={brand}
                          className="flex items-center space-x-2.5 text-stone-600 text-xs font-semibold cursor-pointer select-none animate-fade-in"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onBrandSelect(isSelected ? null : brand)}
                            className="rounded border-stone-300 text-[#E61E25] focus:ring-[#E61E25] w-3.5 h-3.5 cursor-pointer accent-[#E61E25]"
                          />
                          <span className={`transition-colors text-[13px] ${isSelected ? 'text-[#E61E25]' : 'hover:text-[#E61E25]'}`}>
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

      {/* Close Drawer Trigger Button (Only if onClose context exists) */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-stone-950 hover:bg-stone-900 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-950 text-xs font-black uppercase tracking-widest rounded-[3px] cursor-pointer text-center transition-colors border-none"
        >
          Apply Filters
        </button>
      )}
    </div>
  );
};
