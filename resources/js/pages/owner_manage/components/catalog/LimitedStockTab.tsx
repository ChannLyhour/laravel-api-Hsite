import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheck, FiX, FiRefreshCw, FiEdit2, FiShoppingBag, FiSearch } from 'react-icons/fi';
import { stockManagementService } from '@/api/owner/stockManagement';
import { menuItemsService } from '@/api/owner/categories';
import type { MenuItem, ProductVariant } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';

const getVariantOptionName = (variant: ProductVariant): string => {
  if (variant.attribute_values && variant.attribute_values.length > 0) {
    return variant.attribute_values.map((av: any) => av.value?.includes('|') ? av.value.split('|')[0] : av.value).join(', ');
  }
  return '';
};

import { HelperTable, HelperTableColumn } from '../../helper/HelperTable';

interface LimitedStockTabProps {
  ownerId?: number | string;
  storeId?: number;
}

export const LimitedStockTab: React.FC<LimitedStockTabProps> = ({ ownerId, storeId }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await stockManagementService.getStockItems(ownerId, storeId);
      setItems(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const channel = new BroadcastChannel('data_updates');
    const handleUpdate = () => {
      fetchItems();
    };
    channel.addEventListener('message', handleUpdate);
    window.addEventListener('data_updated', handleUpdate);

    return () => {
      channel.removeEventListener('message', handleUpdate);
      channel.close();
      window.removeEventListener('data_updated', handleUpdate);
    };
  }, [ownerId, storeId]);

  const handleUpdateStock = async (variantId: number, qty: number, threshold: number | null) => {
    try {
      setSavingId(variantId);
      await stockManagementService.updateVariantStock(variantId, {
        stock_qty: qty,
        low_stock_threshold: threshold,
      });
      toast.success('Stock level updated successfully!');
      
      // Update local state
      setItems(prevItems =>
        prevItems.map(item => {
          if (item.variants && item.variants.some(v => v.id === variantId)) {
            return {
              ...item,
              variants: item.variants.map(v =>
                v.id === variantId ? { ...v, stock_qty: qty } : v
              )
            };
          }
          return item;
        })
      );

      window.dispatchEvent(new CustomEvent('data_updated'));
      new BroadcastChannel('data_updates').postMessage('refresh');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update stock level.');
    } finally {
      setSavingId(null);
      setEditingVariantId(null);
    }
  };

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
      
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status: newStatus } : i)));
      toast.success(`Dish is now ${newStatus === 'active' ? 'Active' : 'Inactive'}!`);
      
      window.dispatchEvent(new CustomEvent('data_updated'));
      new BroadcastChannel('data_updates').postMessage('refresh');
    } catch (e) {
      console.error(e);
      toast.error('Failed to change status.');
    }
  };

  // Flatten & filter low stock items (< 10 quantity)
  const lowStockRows: Array<{
    productId: number;
    productName: string;
    productImage: string;
    price: number;
    status: 'active' | 'inactive';
    hasOptions: boolean;
    variant: ProductVariant;
    menuItem: MenuItem;
  }> = [];

  items.forEach(item => {
    const vars = item.variants || [];
    vars.forEach(v => {
      if (v.stock_qty < 10) {
        lowStockRows.push({
          productId: item.id,
          productName: item.name,
          productImage: item.display_image || item.image || '',
          price: Number(v.retail_price || item.price),
          status: item.status as 'active' | 'inactive',
          hasOptions: !!item.has_options,
          variant: v,
          menuItem: item,
        });
      }
    });
  });

  // Apply search query filter
  const filteredRows = lowStockRows.filter(row => {
    const nameMatch = row.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const optName = getVariantOptionName(row.variant);
    const optMatch = optName ? optName.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    return nameMatch || optMatch;
  });

  const columns: HelperTableColumn[] = [
    { key: 'sl', label: 'SL', className: 'w-16' },
    { key: 'name', label: 'Product Name' },
    { key: 'price', label: 'Unit Price' },
    { key: 'qty', label: 'Quantity', className: 'w-48' },
    { key: 'orders', label: 'Orders', className: 'w-24' },
    { key: 'status', label: 'Active Status', className: 'w-32' },
    { key: 'action', label: 'Action', className: 'w-24', align: 'right' },
  ];

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedData = filteredRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">Limited Stocked Products List</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            The products shown in this list have a quantity below 10.
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-4 py-2 rounded-[10px] text-xs transition-all border-none cursor-pointer self-start"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload Data
        </button>
      </div>

      <HelperTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        title="Limited Stock Alert"
        count={filteredRows.length}
        searchPlaceholder="Search limited stock products..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredRows.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        emptyStateText="No limited stock products found."
        renderRow={(row, idx) => {
          const isEditing = editingVariantId === row.variant.id;
          const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
          return (
            <tr key={row.variant.id}>
              <td>{globalIdx}</td>
              <td>
                <div className="flex items-center gap-3">
                  <img
                    src={resolveImageUrl(row.productImage)}
                    alt={row.productName}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div>
                    <p className="text-xs font-extrabold text-slate-700 leading-snug">{row.productName}</p>
                    {getVariantOptionName(row.variant) && (
                      <p className="text-[10px] text-indigo-500 font-bold mt-0.5">
                        Option: {getVariantOptionName(row.variant)}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="text-xs font-black text-slate-700">
                ${row.price.toFixed(2)}
              </td>
              <td>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={editQty}
                      onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleUpdateStock(row.variant.id!, editQty, row.variant.low_stock_threshold)}
                      disabled={savingId === row.variant.id}
                      className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[6px] transition-all border-none cursor-pointer flex items-center justify-center"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingVariantId(null)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[6px] transition-all border-none cursor-pointer flex items-center justify-center"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-[6px] text-3xs font-black uppercase tracking-wider ${
                      row.variant.stock_qty === 0
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {row.variant.stock_qty}
                    </span>
                    <button
                      onClick={() => {
                        setEditingVariantId(row.variant.id || null);
                        setEditQty(row.variant.stock_qty);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-3xs font-bold bg-transparent border-none cursor-pointer hover:underline"
                    >
                      Update Stock
                    </button>
                  </div>
                )}
              </td>
              <td className="text-xs font-bold text-slate-500">
                {Math.floor(row.productId * 3 % 20)}
              </td>
              <td>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={row.status === 'active'}
                    onChange={() => handleToggleStatus(row.menuItem)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </td>
              <td className="text-right">
                <button
                  onClick={() => {
                    localStorage.setItem('menu_items_editing_item', JSON.stringify(row.menuItem));
                    localStorage.setItem('menu_items_view', 'edit');
                    window.dispatchEvent(new CustomEvent('menu_items_view_change', { detail: 'edit' }));
                    window.dispatchEvent(new CustomEvent('active_tab_change', { detail: 'menu-items' }));
                  }}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all border-none bg-transparent cursor-pointer inline-flex items-center"
                  title="Edit Product"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
};
