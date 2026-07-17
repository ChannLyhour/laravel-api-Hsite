import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiInfo, FiLayers, FiAlertCircle, FiEdit2 } from 'react-icons/fi';
import { stockManagementService } from '@/api/owner/stockManagement';
import type { MenuItem, ProductVariant } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';
import { HelperTable, HelperTableColumn } from '../../helper/HelperTable';

const getVariantOptionName = (variant: ProductVariant): string => {
  if (variant.attribute_values && variant.attribute_values.length > 0) {
    return variant.attribute_values.map((av: any) => av.value?.includes('|') ? av.value.split('|')[0] : av.value).join(', ');
  }
  return '';
};

interface RestockRequestsTabProps {
  ownerId?: number | string;
  storeId?: number;
}

interface RestockRequest {
  id: number;
  productId: number;
  productName: string;
  image: string;
  currentStock: number;
  requestedQty: number;
  requesterName: string;
  requestedAt: string;
  status: 'pending' | 'completed' | 'declined';
  variantId?: number;
  menuItem?: MenuItem;
}

export const RestockRequestsTab: React.FC<RestockRequestsTabProps> = ({ ownerId, storeId }) => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const items = await stockManagementService.getStockItems(ownerId, storeId);
      
      // Seed some mock restock requests based on low stock or actual items
      const mockRequests: RestockRequest[] = [];
      const lowStockItems = items.filter(item => 
        item.variants && item.variants.some(v => v.stock_qty < 10)
      );

      const names = ['John Smith (Store Manager)', 'Emily Davis (Sales Associate)', 'Sarah Connor (Kitchen Staff)', 'David Miller (Cashier)'];
      
      // If we have items, use them to generate realistic requests
      const itemsToUse = lowStockItems.length > 0 ? lowStockItems : items.slice(0, 3);
      
      itemsToUse.forEach((item, index) => {
        const variant = item.variants?.[0];
        mockRequests.push({
          id: 1000 + index,
          productId: item.id,
          variantId: variant?.id,
          productName: item.name + (variant && getVariantOptionName(variant) ? ` (${getVariantOptionName(variant)})` : ''),
          image: item.display_image || item.image || '',
          currentStock: variant ? variant.stock_qty : 0,
          requestedQty: Math.floor(Math.random() * 20) + 15,
          requesterName: names[index % names.length],
          requestedAt: new Date(Date.now() - (index + 1) * 8 * 3600 * 1000).toLocaleString(),
          status: index === 0 ? 'pending' : (index === 1 ? 'completed' : 'declined'),
          menuItem: item,
        });
      });

      // Default fallback if store is completely empty
      if (mockRequests.length === 0) {
        mockRequests.push({
          id: 1001,
          productId: 1,
          productName: 'Pepperoni Pizza',
          image: '',
          currentStock: 2,
          requestedQty: 50,
          requesterName: 'John Smith (Store Manager)',
          requestedAt: new Date().toLocaleString(),
          status: 'pending'
        });
      }

      setRequests(mockRequests);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load restock requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();

    const channel = new BroadcastChannel('data_updates');
    const handleUpdate = () => {
      loadRequests();
    };
    channel.addEventListener('message', handleUpdate);
    window.addEventListener('data_updated', handleUpdate);

    return () => {
      channel.removeEventListener('message', handleUpdate);
      channel.close();
      window.removeEventListener('data_updated', handleUpdate);
    };
  }, [ownerId, storeId]);

  const handleApprove = async (req: RestockRequest) => {
    if (!req.variantId) {
      // Just mock success if there's no real variant ID
      setProcessingId(req.id);
      setTimeout(() => {
        setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'completed', currentStock: r.currentStock + r.requestedQty } : r));
        toast.success(`Approved restock for ${req.productName}!`);
        setProcessingId(null);
      }, 800);
      return;
    }

    try {
      setProcessingId(req.id);
      const newQty = req.currentStock + req.requestedQty;
      await stockManagementService.updateVariantStock(req.variantId, {
        stock_qty: newQty,
        low_stock_threshold: 5,
      });

      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'completed', currentStock: newQty } : r));
      toast.success(`Successfully restocked ${req.productName} by +${req.requestedQty} units!`);
      
      window.dispatchEvent(new CustomEvent('data_updated'));
      new BroadcastChannel('data_updates').postMessage('refresh');
    } catch (err) {
      console.error(err);
      toast.error('Failed to process restock request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = (id: number) => {
    setProcessingId(id);
    setTimeout(() => {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' } : r));
      toast.info('Restock request declined.');
      setProcessingId(null);
    }, 500);
  };

  const filteredRequests = requests.filter(req => 
    req.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.requesterName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: HelperTableColumn[] = [
    { key: 'id', label: 'Request ID', className: 'w-16' },
    { key: 'product', label: 'Product Info' },
    { key: 'requester', label: 'Requested By' },
    { key: 'currentStock', label: 'Current Stock', className: 'w-36' },
    { key: 'requestedQty', label: 'Request Qty', className: 'w-36' },
    { key: 'status', label: 'Status', className: 'w-40' },
    { key: 'action', label: 'Action', className: 'w-36', align: 'right' }
  ];

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedData = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">Request Restock List</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Manage incoming requests from store staff or automated alerts to restock items.
          </p>
        </div>
        <button
          onClick={loadRequests}
          className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-4 py-2 rounded-[10px] text-xs transition-all border-none cursor-pointer self-start"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload List
        </button>
      </div>

      <HelperTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        title="Restock Moderation Queue"
        count={filteredRequests.length}
        searchPlaceholder="Search restock requests..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredRequests.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        emptyStateText="No restock requests currently active."
        renderRow={(req) => (
          <tr key={req.id}>
            <td className="text-xs font-black text-slate-400">#{req.id}</td>
            <td>
              <div className="flex items-center gap-3">
                <img
                  src={resolveImageUrl(req.image)}
                  alt={req.productName}
                  className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60';
                  }}
                />
                <div>
                  <p className="text-xs font-extrabold text-slate-700 leading-snug">{req.productName}</p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{req.requestedAt}</p>
                </div>
              </div>
            </td>
            <td className="text-xs font-bold text-slate-600">{req.requesterName}</td>
            <td>
              <span className={`px-2 py-0.5 rounded-[5px] text-3xs font-black uppercase tracking-wider ${
                req.currentStock === 0
                  ? 'bg-rose-100 text-rose-600'
                  : req.currentStock < 10
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}>
                {req.currentStock} Units
              </span>
            </td>
            <td className="text-xs font-black text-indigo-600">+{req.requestedQty}</td>
            <td>
              <span className={`px-2.5 py-1 rounded-[6px] text-3xs font-black uppercase tracking-wider ${
                req.status === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : req.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {req.status}
              </span>
            </td>
            <td className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                {req.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={processingId === req.id}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                      title="Approve & Restock"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      disabled={processingId === req.id}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                      title="Decline Request"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {req.menuItem && (
                  <button
                    onClick={() => {
                      localStorage.setItem('menu_items_editing_item', JSON.stringify(req.menuItem));
                      localStorage.setItem('menu_items_view', 'edit');
                      window.dispatchEvent(new CustomEvent('menu_items_view_change', { detail: 'edit' }));
                      window.dispatchEvent(new CustomEvent('active_tab_change', { detail: 'menu-items' }));
                    }}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all border-none bg-transparent cursor-pointer inline-flex items-center"
                    title="Edit Product"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!req.menuItem && req.status !== 'pending' && (
                  <span className="text-[11px] font-bold text-slate-400 italic">No Action Needed</span>
                )}
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
};
