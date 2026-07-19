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
  variantSku?: string;
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
  const [declinedIds, setDeclinedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('declined_restock_variant_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('declined_restock_variant_ids', JSON.stringify(declinedIds));
  }, [declinedIds]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const apiRequests = await stockManagementService.getRestockRequests(ownerId, storeId).catch(() => []);
      
      const realRequests: RestockRequest[] = [];

      // Map backend database restock_requests ONLY
      if (Array.isArray(apiRequests) && apiRequests.length > 0) {
        apiRequests.forEach((dbReq: any) => {
          const product = dbReq.product;
          const variant = dbReq.variant;
          const optName = variant ? getVariantOptionName(variant) : '';
          const fullName = (product?.name || 'Product') + (optName ? ` (${optName})` : '');
          const variantSku = variant?.variant_sku || product?.sku || `REQ-${dbReq.id}`;

          realRequests.push({
            id: dbReq.id,
            productId: dbReq.product_id,
            variantId: dbReq.product_variant_id,
            productName: fullName,
            variantSku: variantSku,
            image: product?.display_image || product?.image || '',
            currentStock: dbReq.current_stock ?? (variant?.stock_qty || 0),
            requestedQty: dbReq.requested_qty || 15,
            requesterName: dbReq.requester?.name || 'Staff Member',
            requestedAt: dbReq.created_at
              ? new Date(dbReq.created_at).toLocaleString()
              : new Date().toLocaleString(),
            status: dbReq.status || 'pending',
            menuItem: product,
          });
        });
      }

      setRequests(realRequests);
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
    try {
      setProcessingId(req.id);
      
      // Update variant stock in DB
      if (req.variantId) {
        const newQty = req.currentStock + req.requestedQty;
        await stockManagementService.updateVariantStock(req.variantId, {
          stock_qty: newQty,
          low_stock_threshold: 5,
        });
        setDeclinedIds(prev => prev.filter(id => id !== req.variantId));
      }

      // Approve restock request in backend API
      if (req.id < 9000) {
        await stockManagementService.approveRestockRequest(req.id).catch(() => {});
      }

      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'completed', currentStock: r.currentStock + r.requestedQty } : r));
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

  const handleDecline = async (req: RestockRequest) => {
    try {
      setProcessingId(req.id);
      
      if (req.variantId) {
        setDeclinedIds(prev => [...new Set([...prev, req.variantId!])]);
      }

      // Decline restock request in backend API
      if (req.id < 9000) {
        await stockManagementService.declineRestockRequest(req.id).catch(() => {});
      }

      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'declined' } : r));
      toast.info(`Restock request for ${req.productName} declined.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to decline restock request.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (req.variantSku && req.variantSku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns: HelperTableColumn[] = [
    { key: 'sku', label: 'Variant SKU', align: 'center', className: 'w-28 text-slate-400 font-bold' },
    { key: 'product', label: 'Product Info', align: 'left', className: 'w-1/3' },
    { key: 'requester', label: 'Requested By', align: 'left' },
    { key: 'currentStock', label: 'Current Stock', align: 'center', className: 'w-36' },
    { key: 'requestedQty', label: 'Request Qty', align: 'center', className: 'w-36' },
    { key: 'status', label: 'Status', align: 'center', className: 'w-40' },
    { key: 'action', label: 'Action', align: 'right', className: 'w-36' }
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
          <tr key={req.id} className="hover:bg-slate-50/20 transition-colors">
            <td className="py-3.5 px-5 text-center text-[11px] font-bold text-slate-500">{req.variantSku || `#${req.id}`}</td>
            <td className="py-3.5 px-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[5px] overflow-hidden bg-slate-50 border border-slate-150 shrink-0">
                  <img
                    src={resolveImageUrl(req.image)}
                    alt={req.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                    }}
                  />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">{req.productName}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{req.requestedAt}</div>
                </div>
              </div>
            </td>
            <td className="py-3.5 px-5 text-xs font-bold text-slate-600">{req.requesterName}</td>
            <td className="py-3.5 px-5 text-center">
              <span className={`px-2.5 py-0.5 rounded-[4px] text-xs font-black ${
                req.currentStock === 0
                  ? 'bg-rose-50 text-rose-550 border border-rose-100'
                  : req.currentStock < 10
                  ? 'bg-amber-50 text-amber-650 border border-amber-100'
                  : 'bg-emerald-50 text-emerald-650 border border-emerald-100'
              }`}>
                {req.currentStock} Units
              </span>
            </td>
            <td className="py-3.5 px-5 text-center text-xs font-black text-indigo-600">+{req.requestedQty}</td>
            <td className="py-3.5 px-5 text-center">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider ${
                req.status === 'pending'
                  ? 'bg-amber-50 text-amber-500'
                  : req.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-500'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {req.status}
              </span>
            </td>
            <td className="py-3.5 px-5 text-right w-36">
              <div className="flex items-center justify-end gap-1.5">
                {req.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={processingId === req.id}
                      className="p-2 border border-emerald-250/70 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 duration-150 bg-white"
                      title="Approve & Restock"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDecline(req)}
                      disabled={processingId === req.id}
                      className="p-2 border border-rose-200/80 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 duration-150 bg-white"
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
                    className="p-2 border border-blue-200/80 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 duration-150 bg-white shadow-3xs"
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
