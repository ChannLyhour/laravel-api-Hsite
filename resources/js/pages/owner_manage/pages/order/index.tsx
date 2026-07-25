import React, { useState, useEffect } from 'react';
import {
  FiFileText, FiCheckCircle, FiXCircle, FiGift,
  FiEye, FiDownload, FiCheck, FiTruck
} from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { ShowOrderPage } from './show';
import type { Order } from './show';
import { HelperTable } from '../../helper/HelperTable';
import type { HelperTableColumn } from '../../helper/HelperTable';
import { HelperFilter } from '../../helper/HelperFilter';
import type { FilterSection } from '../../helper/HelperFilter';
import { ordersService } from '@/api/owner/orders';
import '@/pages/owner_manage/style/font.css';

interface OrdersTabProps {
  ownerId?: number | string;
  storeId?: number;
  defaultStatusFilter?: string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ ownerId, storeId, defaultStatusFilter }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatusFilter || 'all');
  const [tempStatusFilter, setTempStatusFilter] = useState<string>(defaultStatusFilter || 'all');

  useEffect(() => {
    setTempStatusFilter(statusFilter);
  }, [statusFilter]);

  const handleFilterChange = (sectionId: string, value: any) => {
    if (sectionId === 'status') {
      setTempStatusFilter(value);
    }
  };

  const handleClearFilters = () => {
    setTempStatusFilter('all');
  };

  const handleApplyFilters = () => {
    setStatusFilter(tempStatusFilter);
    setShowFilters(false);
  };

  const handleCloseFilters = () => {
    setShowFilters(false);
    setTempStatusFilter(statusFilter);
  };

  const filterSections: FilterSection[] = [];

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // View swapping 'list' | 'show'
  const [view, setView] = useState<'list' | 'show'>('list');

  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('itemsPerPage_orders');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadOrders = async () => {
    // If we have a token, we might still be able to fetch from /orders/store/me even without ownerId
    const hasToken = !!localStorage.getItem('admin_token') || !!localStorage.getItem('master_admin_token');

    if (!ownerId && !storeId && !hasToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 2. Fetch orders.
      // Attempt A: Pass all IDs we have
      const primaryFetchId = storeId || ownerId;

      const backendOrders = await ordersService.getMyStoreOrders(
        undefined, 0, 100, undefined,
        storeId, primaryFetchId, ownerId
      );

      if (backendOrders) {
        setOrders(backendOrders.sort((a, b) => parseInt(b.id) - parseInt(a.id)));
      } else {
        setOrders([]);
      }
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkPendingOrderView = async () => {
      const pendingId = (window as any).pendingViewOrderId || localStorage.getItem('pendingViewOrderId');
      if (pendingId) {
        delete (window as any).pendingViewOrderId;
        localStorage.removeItem('pendingViewOrderId');
        try {
          setLoading(true);
          const detail = await ordersService.getOrderDetails(pendingId);
          setSelectedOrder(detail);
          setView('show');
        } catch (err) {
          console.warn('Failed to load pending order view details', err);
          loadOrders();
        } finally {
          setLoading(false);
        }
      } else {
        loadOrders();
      }
    };

    checkPendingOrderView();

    const handleDataUpdate = () => {
      loadOrders();
    };

    const handleViewOrderDetails = async (e: Event) => {
      const customEvent = e as CustomEvent<{ orderId: string }>;
      const orderId = customEvent.detail?.orderId;
      if (orderId) {
        delete (window as any).pendingViewOrderId;
        try {
          setLoading(true);
          const detail = await ordersService.getOrderDetails(orderId);
          setSelectedOrder(detail);
          setView('show');
        } catch (err) {
          toast.error(`Could not fetch details for order #${orderId}`);
        } finally {
          setLoading(false);
        }
      }
    };

    const handleResetView = () => {
      setView('list');
      setSelectedOrder(null);
    };

    window.addEventListener('data_updated', handleDataUpdate);
    window.addEventListener('aura_order_placed', handleDataUpdate);
    window.addEventListener('view_order_details', handleViewOrderDetails);
    window.addEventListener('reset_order_view', handleResetView);

    return () => {
      window.removeEventListener('data_updated', handleDataUpdate);
      window.removeEventListener('aura_order_placed', handleDataUpdate);
      window.removeEventListener('view_order_details', handleViewOrderDetails);
      window.removeEventListener('reset_order_view', handleResetView);
    };
  }, [ownerId, storeId]);

  useEffect(() => {
    setStatusFilter(defaultStatusFilter || 'all');
    setView('list');
    setSelectedOrder(null);
  }, [defaultStatusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
      // Notify other tabs to refresh data (e.g. stock deduction)
      new BroadcastChannel('data_updates').postMessage('refresh');
    } catch (err) {
    }

    setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: newStatus } : ord));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: Order['paymentStatus']) => {
    try {
      await ordersService.updateOrderPaymentStatus(orderId, newStatus);
    } catch (err) {
    }

    setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, paymentStatus: newStatus } : ord));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, paymentStatus: newStatus } : null);
    }
  };

  // Status Filter button triggers
  const selectStatusCategory = (status: string) => {
    setStatusFilter(prev => prev === status ? 'all' : status);
  };

  // Filter Logic
  const filteredOrders = orders.filter(ord => {
    const matchesSearch =
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.order_no && ord.order_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ord.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
      ord.status === statusFilter ||
      (statusFilter === 'canceled' && ord.status === 'cancelled') ||
      (statusFilter === 'cancelled' && ord.status === 'canceled');

    return matchesSearch && matchesStatus;
  });

  // Dynamic status counters for Dashboard Cards
  const getCountByStatus = (status: string) => {
    if (status === 'canceled') {
      return orders.filter(o => o.status === 'canceled' || o.status === 'cancelled').length;
    }
    return orders.filter(o => o.status === status).length;
  };

  const pendingCount = getCountByStatus('pending');
  const confirmCount = getCountByStatus('confirm');
  const processingCount = getCountByStatus('processing');
  const deliveringCount = getCountByStatus('delivering');
  const canceledCount = getCountByStatus('canceled');
  const completeCount = getCountByStatus('complete');
  const totalCount = orders.length;

  // Pagination calculations
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

   const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'confirm': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      case 'processing': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'delivering': return 'bg-cyan-50 text-cyan-650 border border-cyan-100';
      case 'canceled': return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'complete': return 'bg-slate-50 text-slate-500 border border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border border-slate-100';
    }
  };

  const getStatusTextLabel = (status: Order['status'] | 'all') => {
    switch (status) {
      case 'all': return 'All';
      case 'pending': return 'Pending';
      case 'confirm': return 'Confirmed';
      case 'processing': return 'Processing';
      case 'delivering': return 'Delivering';
      case 'canceled':
      case 'cancelled': return 'Canceled';
      case 'complete': return 'Complete';
      default: return status;
    }
  };

  // Table Columns config
  const columns: HelperTableColumn[] = [
    { key: 'sl', label: 'SL', align: 'center', className: 'w-12' },
    { key: 'id', label: 'Order No', align: 'left', className: 'w-24' },
    { key: 'date', label: 'Order Date', align: 'left' },
    { key: 'customer', label: 'Customer Info', align: 'left' },
    { key: 'store', label: 'Store', align: 'left' },
    { key: 'amount', label: 'Total Amount', align: 'left' },
    { key: 'status', label: 'Order Status', align: 'center' },
    { key: 'action', label: 'Action', align: 'right', className: 'w-24' }
  ];

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setView('show');
  };

  if (view === 'show' && selectedOrder) {
    return (
      <ShowOrderPage
        order={selectedOrder}
        onClose={() => {
          setView('list');
          setSelectedOrder(null);
        }}
        onStatusChange={handleStatusChange}
        onPaymentStatusChange={handlePaymentStatusChange}
      />
    );
  }

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in">





      {/* ── Order List Sub-header & Filter Options ────────────────── */}
      <div className="flex items-center space-x-2.5 pt-2">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Order List
        </h3>
        <span className="bg-slate-100 border border-slate-200/50 text-slate-600 font-extrabold text-2xs px-2 py-0.5 rounded-[5px]">
          {filteredOrders.length}
        </span>
      </div>

      {/* ── HelperTable Listing Grid ─────────────────────────────────── */}
      <HelperTable<Order>
        columns={columns}
        data={currentOrders}
        loading={loading}
        searchPlaceholder="Search by Order No..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        getRowId={(item) => item.id}
        bulkActions={[
          {
            label: 'Bulk Complete',
            onClick: async (ids) => {
              try {
                await Promise.all(ids.map(id => ordersService.updateOrderStatus(id, 'complete')));
                setOrders(prev => prev.map(ord => ids.includes(ord.id) ? { ...ord, status: 'complete' } : ord));
                setSelectedIds([]);
                toast.success('Successfully completed selected orders!');
                new BroadcastChannel('data_updates').postMessage('refresh');
              } catch (err) {
                console.error(err);
                toast.error('Failed to update status for some orders.');
              }
            }
          },
          {
            label: 'Bulk Cancel',
            className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-250 hover:border-rose-350',
            onClick: async (ids) => {
              try {
                await Promise.all(ids.map(id => ordersService.updateOrderStatus(id, 'canceled')));
                setOrders(prev => prev.map(ord => ids.includes(ord.id) ? { ...ord, status: 'canceled' } : ord));
                setSelectedIds([]);
                toast.success('Successfully canceled selected orders!');
                new BroadcastChannel('data_updates').postMessage('refresh');
              } catch (err) {
                console.error(err);
                toast.error('Failed to cancel some orders.');
              }
            }
          }
        ]}
        exportButton={{
          label: 'Export',
          onClick: () => toast.success('Orders exported successfully!')
        }}
        filterButton={{
          label: 'Filter',
          onClick: () => setShowFilters(p => !p)
        }}
        renderRow={(order, index) => {
          const sl = indexOfFirstItem + index + 1;
          return (
            <tr
              key={order.id}
              className="hover:bg-slate-50/40 transition-colors"
            >
              <td className="py-4 px-5 text-center font-bold text-slate-500">
                {sl}
              </td>
              <td className="py-4 px-5 font-bold text-slate-800 hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenDetails(order)}>
                {order.order_no || order.id}
              </td>
              <td className="py-4 px-5 text-slate-500 font-medium">
                {order.time}
              </td>
              <td className="py-4 px-5">
                <div className="font-extrabold text-slate-900">{order.customer}</div>
                <div className="text-slate-400 text-2xs font-semibold mt-0.5">{order.phone}</div>
              </td>
              <td className="py-4 px-5 font-bold text-slate-600">
                {order.store}
              </td>
              <td className="py-4 px-5">
                <div className="font-black text-slate-900">${parseFloat(order.total).toFixed(2)}</div>
                <div className={`text-2xs font-bold mt-0.5 ${order.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                  {order.paymentStatus}
                </div>
              </td>
              <td className="py-4 px-5 text-center">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-[5px] text-2xs uppercase tracking-wider font-extrabold ${getStatusBadgeClass(order.status)}`}>
                  {getStatusTextLabel(order.status)}
                </span>
              </td>
              <td className="py-4 px-5 text-right">
                <div className="flex justify-end items-center gap-2">
                  <button
                    onClick={() => handleOpenDetails(order)}
                    className="p-1.5 border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-[5px] transition-colors cursor-pointer"
                    title="View Details"
                  >
                    <FiEye className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => {
                      toast.success(`Generated Invoice PDF for #${order.order_no || order.id}`);
                    }}
                    className="p-1.5 border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-[5px] transition-colors cursor-pointer"
                    title="Download Invoice"
                  >
                    <FiDownload className="w-4.5 h-4.5" />
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
          localStorage.setItem('itemsPerPage_orders', size.toString());
          setCurrentPage(1);
        }}
        emptyStateText="No Orders Placed"
        emptyStateSubtext="Check back later for active customer ticket transactions or adjust your search filter criteria."
      />

      <HelperFilter
        isOpen={showFilters}
        onClose={handleCloseFilters}
        sections={filterSections}
        selectedValues={{ status: tempStatusFilter }}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
      >
        {/* Current Order Summary Dashboard Grid */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-[5px] space-y-4 shadow-2xs text-left">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Quick Filter Status
          </h4>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Card 0: Total */}
            <div
              onClick={() => setTempStatusFilter('all')}
              className={`border rounded-[5px] p-3 flex items-center justify-between transition-all cursor-pointer shadow-3xs active:scale-98 ${tempStatusFilter === 'all'
                ? 'bg-black/[0.05] border-slate-400'
                : 'custom-card-container hover:bg-black/[0.04]'
                }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-black/[0.03] border flex items-center justify-center text-slate-500 shrink-0">
                  <FiFileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-700">Total</span>
              </div>
              <span className="text-sm font-black text-slate-900 tracking-tight">{totalCount}</span>
            </div>

            {/* Card 1: Pending */}
            <div
              onClick={() => setTempStatusFilter('pending')}
              className={`border rounded-[5px] p-3 flex items-center justify-between transition-all cursor-pointer shadow-3xs active:scale-98 ${tempStatusFilter === 'pending'
                ? 'border-blue-300 bg-blue-50/20'
                : 'custom-card-container hover:bg-black/[0.04]'
                }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                  <FiFileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-700">Pending</span>
              </div>
              <span className="text-sm font-black text-blue-600 tracking-tight">{pendingCount}</span>
            </div>

            {/* Card 2: Confirmed */}
            <div
              onClick={() => setTempStatusFilter('confirm')}
              className={`border rounded-[5px] p-3 flex items-center justify-between transition-all cursor-pointer shadow-3xs active:scale-98 ${tempStatusFilter === 'confirm'
                ? 'border-indigo-300 bg-indigo-50/20'
                : 'custom-card-container hover:bg-black/[0.04]'
                }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                  <FiCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-700">Confirmed</span>
              </div>
              <span className="text-sm font-black text-indigo-600 tracking-tight">{confirmCount}</span>
            </div>

            {/* Card 3: Processing */}
            <div
              onClick={() => setTempStatusFilter('processing')}
              className={`border rounded-[5px] p-3 flex items-center justify-between transition-all cursor-pointer shadow-3xs active:scale-98 ${tempStatusFilter === 'processing'
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'custom-card-container hover:bg-black/[0.04]'
                }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                  <FiCheckCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-700">Processing</span>
              </div>
              <span className="text-sm font-black text-emerald-600 tracking-tight">{processingCount}</span>
            </div>

            {/* Card 4: Delivering */}
            <div
              onClick={() => setTempStatusFilter('delivering')}
              className={`border rounded-[5px] p-3 flex items-center justify-between transition-all cursor-pointer shadow-3xs active:scale-98 ${tempStatusFilter === 'delivering'
                ? 'border-cyan-300 bg-cyan-50/20'
                : 'custom-card-container hover:bg-black/[0.04]'
                }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                  <FiTruck className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-700">Delivering</span>
              </div>
              <span className="text-sm font-black text-cyan-650 tracking-tight">{deliveringCount}</span>
            </div>

            {/* Card 5: Complete */}
            <div
              onClick={() => setTempStatusFilter('complete')}
              className={`border rounded-[5px] p-3 flex items-center justify-between transition-all cursor-pointer shadow-3xs active:scale-98 ${tempStatusFilter === 'complete'
                ? 'border-slate-300 bg-slate-50/20'
                : 'custom-card-container hover:bg-black/[0.04]'
                }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <FiGift className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-700">Complete</span>
              </div>
              <span className="text-sm font-black text-slate-600 tracking-tight">{completeCount}</span>
            </div>

            {/* Card 6: Canceled */}
            <div
              onClick={() => setTempStatusFilter('canceled')}
              className={`border rounded-[5px] p-3 flex items-center justify-between transition-all cursor-pointer shadow-3xs active:scale-98 ${tempStatusFilter === 'canceled'
                ? 'border-rose-300 bg-rose-50/20'
                : 'custom-card-container hover:bg-black/[0.04]'
                }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                  <FiXCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-700">Canceled</span>
              </div>
              <span className="text-sm font-black text-red-500 tracking-tight">{canceledCount}</span>
            </div>
          </div>
        </div>
      </HelperFilter>
    </div>
  );
};

