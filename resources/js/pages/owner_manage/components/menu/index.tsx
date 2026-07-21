import React, { useState, useEffect, useMemo } from 'react';
import { FiEdit2, FiTrash2, FiShoppingBag, FiTag, FiEye } from 'react-icons/fi';
import { useConfirm } from '@/components/ConfirmProvider';
import { menuItemsService } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import type { Category, MenuItem } from '@/api/owner/categories';
import { toast } from '@/pages/owner_manage/utils/toast';
import { useGet } from './hooks/useGet';
import '@/pages/owner_manage/style/font.css';
import { HelperTable, HelperTableActions } from '../../helper/HelperTable';
import type { HelperTableColumn } from '../../helper/HelperTable';
import { HelperFilter } from '../../helper/HelperFilter';
import type { FilterSection } from '../../helper/HelperFilter';
import { CreatePage } from './create';
import { EditPage } from './edit';
import { ShowPage } from './show';
import { ClearCacheButton } from './cache/clearcahe';
import { BadgeCountProduct } from './components/Badge_count_product';
import { useTranslation } from '../../lang/i18n';
import { defaultPlanFeatures } from '@/pages/admin_manage/components/subscriptions/index';

const strLimit = (str: string, limit: number = 25): string => {
  if (!str) return '';
  return str.length > limit ? `${str.substring(0, limit)}...` : str;
};


interface MenuItemsTabProps {
  ownerId?: number | string;
  storeId?: number;
}

export const MenuItemsTab: React.FC<MenuItemsTabProps> = ({ ownerId, storeId }) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [colFilters, setColFilters] = useState<Record<string, string>>({
    name: '',
    price: '',
  });

  interface FiltersState {
    sorting: string;
    status: string[];
    category: string[];
  }

  const initialFilters: FiltersState = {
    sorting: 'newest',
    status: [],
    category: [],
  };

  const [appliedFilters, setAppliedFilters] = useState<FiltersState>(initialFilters);
  const [tempFilters, setTempFilters] = useState<FiltersState>(initialFilters);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Navigation View State
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'show'>(() => {
    const saved = localStorage.getItem('menu_items_view');
    return (saved as any) || 'list';
  });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(() => {
    const saved = localStorage.getItem('menu_items_editing_item');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) { }
    }
    return null;
  });
  const [showingItem, setShowingItem] = useState<MenuItem | null>(() => {
    const saved = localStorage.getItem('menu_items_showing_item');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) { }
    }
    return null;
  });

  const {
    items,
    setItems,
    categories,
    setCategories,
    loading,
    loadData,
  } = useGet({
    ownerId,
    storeId,
    setEditingItem,
    setShowingItem,
  });

  const getProductsLimit = (): number => {
    let tier = 'free';
    try {
      const savedTier = localStorage.getItem('biteflow_subscription_tier');
      if (savedTier) tier = savedTier.toLowerCase();

      if (tier === 'free') {
        const savedSettings = localStorage.getItem('store_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          const tVal = parsed.subscription_tier || parsed.tier || parsed.plan || parsed.package_plan || parsed.license_package_plan;
          if (tVal) tier = String(tVal).toLowerCase();
        }
      }

      if (tier === 'free') {
        const savedUser = localStorage.getItem('owner_user') || localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          const tVal = parsed.subscription_tier || parsed.tier || parsed.plan || parsed.package_plan || parsed.license_package_plan;
          if (tVal) tier = String(tVal).toLowerCase();
        }
      }
    } catch (_) {}

    if (tier.includes('premium')) tier = 'premium';
    else if (tier.includes('standard')) tier = 'standard';
    else if (tier.includes('basic')) tier = 'basic';
    else if (tier.includes('free')) tier = 'free';

    let featuresList: string[] = [];
    try {
      const savedFeatures = localStorage.getItem('biteflow_plan_features');
      if (savedFeatures) {
        const parsed = JSON.parse(savedFeatures);
        if (parsed[tier]) featuresList = parsed[tier];
      }
    } catch (_) {}

    if (featuresList.length === 0) {
      featuresList = defaultPlanFeatures[tier as keyof typeof defaultPlanFeatures] || defaultPlanFeatures.free;
    }

    const limitStr = featuresList.find(f => f.startsWith('Products Limit:'));
    if (limitStr) {
      const val = limitStr.split(':')[1];
      if (val.toLowerCase().includes('unlimited')) return Infinity;
      const num = parseInt(val, 10);
      if (!isNaN(num)) return num;
    }
    return 10;
  };

  const handleFilterChange = (sectionId: string, value: any) => {
    setTempFilters(prev => ({
      ...prev,
      [sectionId]: value,
    }));
  };

  const handleClearFilters = () => {
    setTempFilters(initialFilters);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setShowFilters(false);
    setCurrentPage(1);
  };

  const handleCloseFilters = () => {
    setShowFilters(false);
    setTempFilters(appliedFilters);
  };

  const filterSections: FilterSection[] = useMemo(() => [
    {
      id: 'sorting',
      title: t('menu.sorting'),
      type: 'radio',
      options: [
        { id: 'newest', label: t('menu.newest') },
        { id: 'oldest', label: t('menu.oldest') },
        { id: 'price_asc', label: t('menu.price_asc') },
        { id: 'price_desc', label: t('menu.price_desc') },
      ],
    },
    {
      id: 'status',
      title: t('menu.status'),
      type: 'checkbox',
      options: [
        { id: 'active', label: t('menu.active') },
        { id: 'inactive', label: t('menu.inactive') },
      ],
    },
    {
      id: 'category',
      title: t('menu.category'),
      type: 'checkbox',
      options: (showAllCategories ? categories : categories.slice(0, 6)).map(cat => ({
        id: cat.id.toString(),
        label: cat.name,
      })),
      hasSeeMore: categories.length > 6,
      seeMoreLabel: showAllCategories ? t('menu.see_less') : t('menu.see_more'),
      onSeeMoreClick: () => setShowAllCategories(p => !p),
    },
  ], [t, showAllCategories, categories]);

  useEffect(() => {
    localStorage.setItem('menu_items_view', view);
  }, [view]);

  useEffect(() => {
    if (editingItem) {
      localStorage.setItem('menu_items_editing_item', JSON.stringify(editingItem));
    } else {
      localStorage.removeItem('menu_items_editing_item');
    }
  }, [editingItem]);

  useEffect(() => {
    if (showingItem) {
      localStorage.setItem('menu_items_showing_item', JSON.stringify(showingItem));
    } else {
      localStorage.removeItem('menu_items_showing_item');
    }
  }, [showingItem]);

  useEffect(() => {
    const handleViewChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && ['list', 'create', 'edit', 'show'].includes(customEvent.detail)) {
        setView(customEvent.detail);
        if (customEvent.detail === 'create') {
          setEditingItem(null);
        } else if (customEvent.detail === 'list') {
          setEditingItem(null);
          setShowingItem(null);
        }
      }
    };
    window.addEventListener('menu_items_view_change', handleViewChange);
    return () => window.removeEventListener('menu_items_view_change', handleViewChange);
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('itemsPerPage_menu');
    return saved ? parseInt(saved, 10) : 5;
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeRowImages, setActiveRowImages] = useState<Record<number, string>>({});
  const [activeColorNames, setActiveColorNames] = useState<Record<number, string>>({});

  const handleToggleStatus = async (item: MenuItem) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await menuItemsService.updateMenuItem(item.id, {
        name: item.name,
        description: item.description || '',
        price: item.price,
        image_url: item.image || undefined,
        status: newStatus,
        category_id: item.category_id,
      });
      setItems(prev => prev.map(i => (i.id === item.id ? updated : i)));
      toast.success(`Dish is now ${newStatus === 'active' ? 'Available' : 'Sold Out'}!`);
      window.dispatchEvent(new CustomEvent('data_updated'));
      new BroadcastChannel('data_updates').postMessage('refresh');
    } catch (e) {
      console.error(e);
      toast.error('Failed to change status.');
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, appliedFilters]);

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setView('edit');
  };

  const handleOpenShowModal = (item: MenuItem) => {
    setShowingItem(item);
    setView('show');
  };

  const handleDeleteItem = async (id: number, name: string) => {
    const confirmed = await confirm({
      title: t('menu.delete_product'),
      message: t('menu.delete_confirm_desc', { name }),
      confirmText: t('menu.delete_product'),
      cancelText: t('menu.cancel'),
      type: 'danger'
    });

    if (confirmed) {
      try {
        await menuItemsService.deleteMenuItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
        toast.success('Dish removed successfully!');
        window.dispatchEvent(new CustomEvent('data_updated'));
        new BroadcastChannel('data_updates').postMessage('refresh');
      } catch (err) {
        console.error('Failed to delete menu item:', err);
        toast.error('Failed to remove dish.');
      }
    }
  };

  // Filters and Sorting logic
  const filteredItems = useMemo(() => {
    // 1. Filtering
    let result = items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        appliedFilters.category.length === 0 ||
        appliedFilters.category.includes(item.category_id.toString());

      const matchesStatus =
        appliedFilters.status.length === 0 ||
        appliedFilters.status.includes(item.status);

      const matchesColName =
        !colFilters.name ||
        item.name.toLowerCase().includes(colFilters.name.toLowerCase());

      const matchesColPrice =
        !colFilters.price ||
        item.price.toString().toLowerCase().includes(colFilters.price.toLowerCase());

      return matchesSearch && matchesCategory && matchesStatus && matchesColName && matchesColPrice;
    });

    // 2. Sorting
    result = [...result].sort((a, b) => {
      if (appliedFilters.sorting === 'newest') {
        return b.id - a.id;
      } else if (appliedFilters.sorting === 'oldest') {
        return a.id - b.id;
      } else if (appliedFilters.sorting === 'price_asc') {
        return parseFloat(a.price) - parseFloat(b.price);
      } else if (appliedFilters.sorting === 'price_desc') {
        return parseFloat(b.price) - parseFloat(a.price);
      }
      return 0;
    });

    return result;
  }, [items, searchQuery, appliedFilters, colFilters]);

  // Pagination calculations
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const getCategoryName = (id: any) => {
    return categories.find(c => Number(c.id) === Number(id))?.name || 'Unknown';
  };

  // Table columns definition
  const columns: HelperTableColumn[] = [
    { key: 'sl', label: 'SL', align: 'center', className: 'w-12' },
    { key: 'name', label: t('menu.title_label'), align: 'left', className: 'w-1/3', filterable: true },
    { key: 'type', label: t('sidebar.categories') || 'Category', align: 'left' },
    { key: 'price', label: t('menu.price'), align: 'left', filterable: true },
    { key: 'stock', label: t('menu.stock_qty'), align: 'center' },
    { key: 'status', label: t('menu.status'), align: 'center' },
    { key: 'action', label: t('menu.actions'), align: 'right', className: 'w-36' }
  ];



  if (view === 'create') {
    return (
      <CreatePage
        onClose={() => setView('list')}
        categories={categories}
        ownerId={ownerId}
        storeId={storeId}
        onSave={(newItem) => setItems(prev => [newItem, ...prev])}
        onCategoriesUpdated={setCategories}
      />
    );
  }

  if (view === 'edit' && editingItem) {
    return (
      <EditPage
        onClose={() => {
          setView('list');
          setEditingItem(null);
        }}
        categories={categories}
        item={editingItem}
        ownerId={ownerId}
        storeId={storeId}
        onSave={(updatedItem) => setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)))}
        onCategoriesUpdated={setCategories}
      />
    );
  }

  if (view === 'show' && showingItem) {
    return (
      <ShowPage
        onClose={() => {
          setView('list');
          setShowingItem(null);
        }}
        categories={categories}
        item={showingItem}
        ownerId={ownerId}
        storeId={storeId}
        onEdit={(itemToEdit) => {
          setEditingItem(itemToEdit);
          setView('edit');
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy w-full">
      {/* Menu Item Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3 flex-wrap">
            <div className="flex items-center space-x-2">
              <FiShoppingBag className="text-orange-500" />
              <span>{t('menu.title')}</span>
            </div>
            <BadgeCountProduct count={items.length} limit={getProductsLimit()} />
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {t('menu.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ClearCacheButton onCleared={() => loadData()} />
        </div>
      </div>

      {/* Filters drawer is rendered at the bottom */}

      <HelperTable<MenuItem>
        columns={columns}
        renderCard={(item, index, isSelected, onSelect) => {
          const sl = indexOfFirstItem + index + 1;

          // Resolve display image conditionally based on options/variants activation status
          const hasVariants = !!item.has_options;

          let displayImage = '';
          const resolvePath = (p?: string | string[]): string => {
            if (!p) return '';
            return Array.isArray(p) ? (p[0] || '') : p;
          };
          if (hasVariants) {
            const firstVar = item.variants?.[0];
            const varImage = firstVar ? item.images?.find(img => img.product_variant_id === firstVar.id) : null;
            const fallbackVarImage = item.images?.find(img => img.product_variant_id !== null);
            displayImage = resolvePath(varImage?.image) || resolvePath(fallbackVarImage?.image) || item.display_image || item.image || '';
          } else {
            const rootImages = item.images ? item.images.filter(img => img.product_variant_id === null) : [];
            const primaryProductImg = rootImages.find(img => img.is_primary) || rootImages[0];
            displayImage = resolvePath(primaryProductImg?.image) || item.display_image || item.image || '';
          }

          const cardImageUrl = activeRowImages[item.id] || resolveImageUrl(displayImage);
          const categoryName = getCategoryName(item.category_id);

          return (
            <div 
              key={item.id}
              className="bg-white border border-slate-200/60 rounded-[8px] overflow-hidden shadow-2xs hover:shadow-xs transition-all duration-300 flex flex-col h-full font-kuntomruy relative group"
            >
              {/* Product Image Wrapper */}
              <div className="relative aspect-[4/3] bg-slate-50 border-b border-slate-100 overflow-hidden shrink-0">
                {/* Status Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className={`px-2 py-0.5 text-white text-[9px] font-bold uppercase rounded-[3px] backdrop-blur-[1px] ${
                    item.status === 'active' 
                      ? 'bg-emerald-600/80' 
                      : 'bg-slate-600/85'
                  }`}>
                    {item.status === 'active' ? t('menu.active') : t('menu.inactive')}
                  </span>
                </div>

                {/* Top Category Badge */}
                <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 bg-slate-900/60 text-white text-[9px] font-bold uppercase rounded-[3px] backdrop-blur-[1px]">
                    {categoryName}
                  </span>
                </div>

                <img
                  src={cardImageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-350"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                  }}
                />
              </div>

              {/* Card Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight">
                      {item.name}
                    </h4>
                    <span className="text-xs font-black text-[#1455ac] bg-[#1455ac]/5 px-2 py-0.5 rounded-[4px] whitespace-nowrap shrink-0">
                      ${item.price}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-450 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description || 'No description / recipe details available.'}
                  </p>
                </div>

                {/* Attribute tags at description bottom */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {hasVariants && item.variants && item.variants.map((v, idx) => {
                    if (idx > 2) return null;
                    const attrVal = v.attribute_values?.map((av: any) => av.value?.split('|')[0]).join(', ');
                    if (!attrVal) return null;
                    return (
                      <span key={v.id} className="text-[9px] bg-slate-50 border border-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded-[3px] font-bold">
                        {attrVal}
                      </span>
                    );
                  })}
                  {hasVariants && item.variants && item.variants.length > 3 && (
                    <span className="text-[9px] text-slate-400 font-bold self-center">
                      +{item.variants.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer (Actions) */}
              <div className="px-3.5 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </div>

                {/* Action buttons with individual rounded border buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenShowModal(item)}
                    className="p-1.5 bg-white hover:bg-slate-50 text-slate-550 hover:text-slate-700 border border-slate-200 rounded-[5px] cursor-pointer shadow-3xs transition-all active:scale-95 flex items-center justify-center"
                    title="View details"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setView('edit');
                    }}
                    className="p-1.5 bg-white hover:bg-slate-50 text-slate-550 hover:text-[#1455ac] border border-slate-200 rounded-[5px] cursor-pointer shadow-3xs transition-all active:scale-95 flex items-center justify-center"
                    title="Edit product"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: t('menu.delete_title'),
                        message: t('menu.delete_msg', { name: item.name }),
                        confirmText: t('menu.delete_product'),
                        cancelText: t('menu.cancel'),
                        type: 'danger'
                      });
                      if (confirmed) {
                        try {
                          await menuItemsService.deleteMenuItem(item.id);
                          setItems(prev => prev.filter(i => i.id !== item.id));
                          toast.success('Successfully removed selected product!');
                        } catch (err) {
                          console.error(err);
                          toast.error('Failed to remove product.');
                        }
                      }
                    }}
                    className="p-1.5 bg-white hover:bg-rose-50 text-slate-550 hover:text-rose-600 border border-slate-200 rounded-[5px] cursor-pointer shadow-3xs transition-all active:scale-95 flex items-center justify-center"
                    title="Delete product"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        }}
        data={currentItems}
        loading={loading}
        searchPlaceholder="Search by Name Products..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        columnFilters={colFilters}
        onColumnFilterChange={(key, value) => {
          setColFilters(prev => ({
            ...prev,
            [key]: value
          }));
          setCurrentPage(1);
        }}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        getRowId={(item) => item.id}
        bulkActions={[
          {
            label: t('menu.active'),
            onClick: async (ids) => {
              try {
                await Promise.all(
                  ids.map(async (id) => {
                    const item = items.find((i) => i.id === id);
                    if (item && item.status !== 'active') {
                      await menuItemsService.updateMenuItem(id, {
                        name: item.name,
                        description: item.description || '',
                        price: item.price,
                        image_url: item.image || undefined,
                        status: 'active',
                        category_id: item.category_id,
                      });
                    }
                  })
                );
                await loadData();
                setSelectedIds([]);
                toast.success('Successfully activated selected dishes!');
                window.dispatchEvent(new CustomEvent('data_updated'));
                new BroadcastChannel('data_updates').postMessage('refresh');
              } catch (err) {
                console.error(err);
                toast.error('Failed bulk activation.');
              }
            },
          },
          {
            label: t('menu.inactive'),
            onClick: async (ids) => {
              try {
                await Promise.all(
                  ids.map(async (id) => {
                    const item = items.find((i) => i.id === id);
                    if (item && item.status === 'active') {
                      await menuItemsService.updateMenuItem(id, {
                        name: item.name,
                        description: item.description || '',
                        price: item.price,
                        image_url: item.image || undefined,
                        status: 'inactive',
                        category_id: item.category_id,
                      });
                    }
                  })
                );
                await loadData();
                setSelectedIds([]);
                toast.success('Successfully deactivated selected dishes!');
                window.dispatchEvent(new CustomEvent('data_updated'));
                new BroadcastChannel('data_updates').postMessage('refresh');
              } catch (err) {
                console.error(err);
                toast.error('Failed bulk deactivation.');
              }
            },
          },
          {
            label: t('menu.edit_product'),
            onClick: async (ids) => {
              const limit = getProductsLimit();
              if (items.length + ids.length > limit) {
                toast.error(`Duplicating would exceed your plan product limit (${limit} products max for your current plan). Please upgrade your subscription tier.`);
                return;
              }

              const confirmed = await confirm({
                title: t('menu.duplicate_title'),
                message: t('menu.duplicate_msg', { count: ids.length }),
                confirmText: t('menu.edit_product'),
                cancelText: t('menu.cancel'),
                type: 'info'
              });
              if (confirmed) {
                try {
                  toast.loading('Duplicating products...', { id: 'bulk-duplicate' });
                  await Promise.all(
                    ids.map(async (id) => {
                      const fullItem = await menuItemsService.getMenuItem(id);
                      if (fullItem) {
                        // Create a duplicate payload
                        const duplicatePayload = {
                          name: `${fullItem.name} (Copy)`,
                          description: fullItem.description || '',
                          price: fullItem.price,
                          image_url: fullItem.image || undefined,
                          status: 'inactive', // Default to inactive/draft for duplicates
                          category_id: fullItem.category_id,
                          created_by: ownerId || '',
                          sku: fullItem.sku ? `${fullItem.sku}-COPY-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
                          barcode: fullItem.barcode || null,
                          has_options: fullItem.has_options,
                          translations: fullItem.translations?.map(t => ({
                            locale: t.locale,
                            name: `${t.name} (Copy)`,
                            description: t.description || '',
                            slug: `${t.slug}-copy-${Math.floor(100 + Math.random() * 900)}`
                          })),
                          variants: fullItem.variants?.map(v => ({
                            variant_sku: `${v.variant_sku}-COPY-${Math.floor(1000 + Math.random() * 9000)}`,
                            region_code: v.region_code,
                            currency_code: v.currency_code,
                            purchase_price: v.purchase_price,
                            retail_price: v.retail_price,
                            compare_at_price: v.compare_at_price,
                            stock_qty: v.stock_qty,
                            low_stock_threshold: v.low_stock_threshold,
                            attribute_values: v.attribute_values?.map((av: any) => av.id || av)
                          })),
                          product_type: fullItem.product_type,
                          brand_id: fullItem.brand_id,
                          product_badge_id: fullItem.product_badge_id,
                          unit: fullItem.unit,
                          search_tags: fullItem.search_tags,
                          min_order_qty: fullItem.min_order_qty,
                          discount_amount: fullItem.discount_amount,
                          discount_type: fullItem.discount_type,
                          shipping_cost: fullItem.shipping_cost,
                          multiply_qty_shipping: fullItem.multiply_qty_shipping
                        };
                        await menuItemsService.createMenuItem(duplicatePayload);
                      }
                    })
                  );
                  await loadData();
                  setSelectedIds([]);
                  toast.success('Successfully duplicated selected products!', { id: 'bulk-duplicate' });
                  window.dispatchEvent(new CustomEvent('data_updated'));
                  new BroadcastChannel('data_updates').postMessage('refresh');
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to duplicate some products.', { id: 'bulk-duplicate' });
                }
              }
            }
          },
          {
            label: t('menu.delete_product'),
            className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-250 hover:border-rose-350',
            onClick: async (ids) => {
              const confirmed = await confirm({
                title: t('menu.delete_multiple_title'),
                message: t('menu.delete_multiple_msg', { count: ids.length }),
                confirmText: t('menu.delete_product'),
                cancelText: t('menu.cancel'),
                type: 'danger'
              });
              if (confirmed) {
                try {
                  await Promise.all(ids.map(id => menuItemsService.deleteMenuItem(id)));
                  setItems(prev => prev.filter(i => !ids.includes(i.id)));
                  setSelectedIds([]);
                  toast.success('Successfully removed selected dishes!');
                  window.dispatchEvent(new CustomEvent('data_updated'));
                  new BroadcastChannel('data_updates').postMessage('refresh');
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to remove some dishes.');
                }
              }
            }
          }
        ]}
        exportButton={{
          label: t('menu.export') || 'Export',
          onClick: () => toast.success('Menu Products exported successfully!')
        }}
        filterButton={{
          label: t('menu.filter'),
          onClick: () => {
            setTempFilters(appliedFilters);
            setShowFilters(true);
          }
        }}
        addButton={{
          label: t('menu.add_product'),
          onClick: () => {
            const limit = getProductsLimit();
            if (items.length >= limit) {
              toast.error(`Product creation limit reached (${limit} products max for your current plan). Please upgrade your subscription tier.`);
              return;
            }
            setView('create');
          }
        }}

        renderRow={(item, index) => {
          const sl = indexOfFirstItem + index + 1;

          // Resolve display image conditionally based on options/variants activation status
          const hasVariants = !!item.has_options;

          let displayImage = '';
          const resolvePath = (p?: string | string[]): string => {
            if (!p) return '';
            return Array.isArray(p) ? (p[0] || '') : p;
          };
          if (hasVariants) {
            const firstVar = item.variants?.[0];
            const varImage = firstVar ? item.images?.find(img => img.product_variant_id === firstVar.id) : null;
            const fallbackVarImage = item.images?.find(img => img.product_variant_id !== null);
            displayImage = resolvePath(varImage?.image) || resolvePath(fallbackVarImage?.image) || item.display_image || item.image || '';
          } else {
            const rootImages = item.images ? item.images.filter(img => img.product_variant_id === null) : [];
            const primaryProductImg = rootImages.find(img => img.is_primary) || rootImages[0];
            displayImage = resolvePath(primaryProductImg?.image) || item.display_image || item.image || '';
          }

          // Parse color swatches for rendering
          const parseColor = (val: string) => {
            if (!val) return null;
            if (val.includes('|')) {
              const [name, hex] = val.split('|');
              return { name, hex };
            }
            const isColor = val.startsWith('#') || [
              'red', 'black', 'blue', 'green', 'purple', 'violet', 'indigo', 'white', 'yellow', 'pink', 'gray', 'orange', 'brown'
            ].includes(val.toLowerCase());
            return isColor ? { name: val, hex: val } : null;
          };

          const colorVariants: Array<{ color: { name: string; hex: string }; image: string }> = [];
          const seenColors = new Set<string>();

          if (hasVariants && item.variants) {
            for (const v of item.variants) {
              let colorInfo: { name: string; hex: string } | null = null;
              for (const av of (v.attribute_values || [])) {
                const parsed = parseColor(av.value);
                if (parsed) {
                  colorInfo = parsed;
                }
              }
              if (colorInfo) {
                const colorKey = colorInfo.hex.toLowerCase();
                if (!seenColors.has(colorKey)) {
                  seenColors.add(colorKey);
                  const varImage = item.images?.find(img => img.product_variant_id === v.id);
                  colorVariants.push({
                    color: colorInfo,
                    image: resolvePath(varImage?.image)
                  });
                }
              }
            }
          }

          const rowImageUrl = activeRowImages[item.id] || resolveImageUrl(displayImage);

          return (
            <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
              <td className="text-center font-bold text-slate-800">{sl}</td>
              <td>
                <div className="flex items-center gap-3">
                  <img
                    src={rowImageUrl}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                    }}
                  />
                  <div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-snug" title={item.name}>
                      {item.name}
                    </p>
                    {/* <div className="text-slate-400 text-2xs font-semibold mt-0.5">Id # {item.id}</div> */}
                    {/* Render variant options preview */}
                    {hasVariants && (
                      <div className="flex flex-col gap-1.5 mt-1.5">
                        {item.variants && item.variants.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.variants.map(v => {
                              const attrString = v.attribute_values
                                ?.map((av: any) => av.value?.split('|')[0])
                                .filter(Boolean)
                                .join(', ');
                              if (!attrString) return null;
                              return (
                                <span key={v.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-[4px] font-bold border border-slate-200/40">
                                  {attrString}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {/* Interactive color swatches row */}
                        {colorVariants.length > 0 && (
                          <div className="flex items-center gap-2 pt-0.5 select-none">
                            <div className="flex flex-wrap gap-1">
                              {colorVariants.map((cv, cvIdx) => (
                                <button
                                  key={cvIdx}
                                  type="button"
                                  onMouseEnter={() => {
                                    if (cv.image) {
                                      const url = resolveImageUrl(cv.image);
                                      if (url) {
                                        setActiveRowImages(prev => ({ ...prev, [item.id]: url }));
                                      }
                                    }
                                    setActiveColorNames(prev => ({ ...prev, [item.id]: cv.color.name }));
                                  }}
                                  onMouseLeave={() => {
                                    setActiveRowImages(prev => {
                                      const next = { ...prev };
                                      delete next[item.id];
                                      return next;
                                    });
                                    setActiveColorNames(prev => {
                                      const next = { ...prev };
                                      delete next[item.id];
                                      return next;
                                    });
                                  }}
                                  className="w-4.5 h-4.5 rounded-full border border-slate-250 shadow-3xs cursor-pointer transition-transform hover:scale-115 flex-shrink-0"
                                  style={{ backgroundColor: cv.color.hex }}
                                  title={`Preview ${cv.color.name}`}
                                />
                              ))}
                            </div>
                            {activeColorNames[item.id] && (
                              <span className="text-[10px] text-slate-500 font-extrabold uppercase animate-fade-in font-sans">
                                {activeColorNames[item.id]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="text-xs font-bold text-slate-600">
                {getCategoryName(item.category_id)}
              </td>
              <td className="text-xs font-black text-slate-700">
                ${parseFloat(item.price).toFixed(2)}
              </td>
              <td className="text-center">
                {(() => {
                  const totalStock = item.variants && item.variants.length > 0
                    ? item.variants.reduce((sum, v) => sum + (v.stock_qty || 0), 0)
                    : 0;
                  const colorClass = 
                    totalStock === 0 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    totalStock < 10 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-emerald-50 text-emerald-600 border-emerald-100';
                  return (
                    <span className={`inline-block px-2.5 py-1 rounded-[6px] text-3xs font-black uppercase tracking-wider border ${colorClass}`}>
                      {totalStock}
                    </span>
                  );
                })()}
              </td>
              <td className="py-3.5 px-5 text-center">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(item)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mx-auto ${item.status === 'active' ? 'bg-primary shadow-xs' : 'bg-slate-200'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${item.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </td>
              <HelperTableActions
                isFeatured={!!item.is_featured}
                onToggleFeatured={async () => {
                  const newFeatured = !item.is_featured;
                  try {
                    await menuItemsService.updateMenuItem(item.id, {
                      name: item.name,
                      description: item.description || '',
                      price: item.price,
                      image_url: item.image || undefined,
                      status: item.status,
                      category_id: item.category_id,
                      is_featured: newFeatured,
                    });
                    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_featured: newFeatured } : i));
                    toast.success(newFeatured ? `Set "${item.name}" as Featured on homepage!` : `Removed "${item.name}" from homepage featured.`);
                  } catch (err) {
                    console.error(err);
                    toast.error('Failed to update product featured status.');
                  }
                }}
                onBarcode={() => toast.success(`Generated Barcode for ${item.name}`)}
                onView={() => handleOpenShowModal(item)}
                onEdit={() => handleOpenEditModal(item)}
                onDelete={() => handleDeleteItem(item.id, item.name)}
                barcodeTitle={t('menu.barcode')}
                viewTitle={t('menu.view')}
                editTitle={t('menu.edit')}
                deleteTitle={t('menu.delete')}
              />
            </tr>
          );
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
          setItemsPerPage(size);
          localStorage.setItem('itemsPerPage_menu', size.toString());
          setCurrentPage(1);
        }}
        emptyStateText={t('menu.no_data')}
        emptyStateSubtext={t('menu.empty_desc')}
      />

      <HelperFilter
        isOpen={showFilters}
        onClose={handleCloseFilters}
        sections={filterSections}
        selectedValues={tempFilters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

