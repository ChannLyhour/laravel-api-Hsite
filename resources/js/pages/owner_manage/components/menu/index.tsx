import React, { useState, useEffect, useMemo } from 'react';
import { FiEdit2, FiTrash2, FiShoppingBag, FiTag, FiEye } from 'react-icons/fi';
import { useConfirm } from '@/components/ConfirmProvider';
import { categoriesService, menuItemsService } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import type { Category, MenuItem } from '@/api/owner/categories';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';
import { HelperTable } from '../../helper/HelperTable';
import type { HelperTableColumn } from '../../helper/HelperTable';
import { HelperFilter } from '../../helper/HelperFilter';
import type { FilterSection } from '../../helper/HelperFilter';
import { CreatePage } from './create';
import { EditPage } from './edit';
import { ShowPage } from './show';
import { useTranslation } from '../../lang/i18n';

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
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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

  const filterSections: FilterSection[] = [
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
  ];

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

  useEffect(() => {
    loadData();
  }, [ownerId, storeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const catsResponse = await categoriesService.getMyCategories(100, 0, ownerId, storeId);
      setCategories(catsResponse.categories);

      const itemsList = await menuItemsService.getMenuItems(200, 0, ownerId, storeId);
      setItems(itemsList);

      // Sync active view item states with fresh data from itemsList to load addons/details
      setEditingItem(prev => {
        if (!prev) return null;
        const fresh = itemsList.find(i => i.id === prev.id);
        return fresh ? fresh : prev;
      });
      setShowingItem(prev => {
        if (!prev) return null;
        const fresh = itemsList.find(i => i.id === prev.id);
        return fresh ? fresh : prev;
      });
    } catch (e) {
      console.error('Failed to load menu data:', e);
    } finally {
      setLoading(false);
    }
  };

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
    { key: 'type', label: t('menu.product_type'), align: 'left' },
    { key: 'price', label: t('menu.price'), align: 'left', filterable: true },
    { key: 'stock', label: t('menu.stock_qty'), align: 'center' },
    { key: 'social_media_link', label: t('menu.social_links'), align: 'center' },
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <FiShoppingBag className="text-orange-500" />
            <span>{t('menu.title')}</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {t('menu.subtitle')}
          </p>
        </div>
      </div>

      {/* Filters drawer is rendered at the bottom */}

      <HelperTable<MenuItem>
        columns={columns}
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
                const itemsList = await menuItemsService.getMenuItems(200, 0, ownerId, storeId);
                setItems(itemsList);
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
                const itemsList = await menuItemsService.getMenuItems(200, 0, ownerId, storeId);
                setItems(itemsList);
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
                  const itemsList = await menuItemsService.getMenuItems(200, 0, ownerId, storeId);
                  setItems(itemsList);
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
          onClick: () => setView('create')
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
              <td className="py-3.5 px-5 text-center font-bold text-slate-800">{sl}</td>
              <td className="py-3.5 px-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200/50 shadow-2xs shrink-0">
                    <img
                      src={rowImageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-slate-900 text-[12px] sm:text-[14px]" title={item.name}>
                      {strLimit(item.name, 25)}
                    </div>
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
              <td className="py-3.5 px-5 font-bold text-slate-600">
                {getCategoryName(item.category_id)}
              </td>
              <td className="py-3.5 px-5 font-black text-slate-900">
                ${parseFloat(item.price).toFixed(2)}
              </td>
              <td className="py-3.5 px-5 text-center font-bold text-slate-800">
                {item.variants && item.variants.length > 0
                  ? item.variants.reduce((sum, v) => sum + (v.stock_qty || 0), 0)
                  : 0}
              </td>
              <td className="py-3.5 px-5 text-center">
                {(() => {
                  const links = item.social_media_link;
                  if (!links || !Object.values(links).some(v => !!v)) {
                    return <span className="text-slate-400 font-normal">-</span>;
                  }
                  return (
                    <div className="flex items-center justify-center gap-1.5">
                      {links.facebook && (
                        <a
                          href={links.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-6 h-6 text-[#1877F2] hover:bg-[#1877F2]/10 border border-[#1877F2]/20 rounded-full transition-all"
                          title={`Facebook: ${links.facebook}`}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                          </svg>
                        </a>
                      )}
                      {links.instagram && (
                        <a
                          href={links.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-6 h-6 text-[#E1306C] hover:bg-[#E1306C]/10 border border-[#E1306C]/20 rounded-full transition-all"
                          title={`Instagram: ${links.instagram}`}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                          </svg>
                        </a>
                      )}
                      {links.tiktok && (
                        <a
                          href={links.tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-6 h-6 text-[#010101] hover:bg-[#010101]/10 border border-[#010101]/20 rounded-full transition-all"
                          title={`TikTok: ${links.tiktok}`}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.07-2.89-.52-4.06-1.39v7.86c-.03 2.44-1.18 4.86-3.23 6.13-2.45 1.57-5.83 1.67-8.38.25-2.52-1.4-3.89-4.32-3.39-7.18.39-2.52 2.22-4.71 4.73-5.26.79-.17 1.61-.17 2.41-.02v4.08c-.89-.25-1.89-.13-2.67.36-.92.56-1.4 1.62-1.28 2.68.1 1.05.81 1.99 1.83 2.26 1.03.3 2.18-.08 2.77-.95.34-.52.48-1.14.47-1.76l-.02-12.42z"/>
                          </svg>
                        </a>
                      )}
                      {links.telegram && (
                        <a
                          href={links.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-6 h-6 text-[#0088cc] hover:bg-[#0088cc]/10 border border-[#0088cc]/20 rounded-full transition-all"
                          title={`Telegram: ${links.telegram}`}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.19-.03.29z"/>
                          </svg>
                        </a>
                      )}
                      {links.youtube && (
                        <a
                          href={links.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-6 h-6 text-[#FF0000] hover:bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-full transition-all"
                          title={`YouTube: ${links.youtube}`}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.108C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.555a3.003 3.003 0 00-2.11 2.108C0 8.017 0 12 0 12s0 3.982.502 5.837a3.003 3.003 0 002.11 2.108C4.47 20.5 12 20.5 12 20.5s7.53 0 9.388-.555a3.003 3.003 0 002.11-2.108C24 15.982 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </a>
                      )}
                    </div>
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
              <td className="py-3.5 px-5 text-right">
                <div className="flex justify-end items-center gap-1.5">
                  <button
                    onClick={() => toast.success(`Generated Barcode for ${item.name}`)}
                    className="p-2 border border-amber-200/80 text-amber-500 hover:bg-amber-50 rounded-[5px] transition-colors cursor-pointer"
                    title={t('menu.barcode')}
                  >
                    <FiTag className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenShowModal(item)}
                    className="p-2 border border-emerald-200/80 text-emerald-600 hover:bg-emerald-50 rounded-[5px] transition-colors cursor-pointer"
                    title={t('menu.view')}
                  >
                    <FiEye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 border border-blue-200/80 text-blue-600 hover:bg-blue-50 rounded-[5px] transition-colors cursor-pointer animate-fade-in"
                    title={t('menu.edit')}
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-2 border border-rose-200/80 text-rose-500 hover:bg-rose-50 rounded-[5px] transition-colors cursor-pointer animate-fade-in"
                    title={t('menu.delete')}
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
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

