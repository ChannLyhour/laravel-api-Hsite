import React, { useEffect, useState } from 'react';
import '@/pages/owner_manage/style/font.css';
import {
  FiShoppingCart,
  FiPackage,
  FiBox,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiActivity,
  FiDollarSign,
  FiMessageSquare,
  FiChevronRight,
  FiTrendingUp,
  FiMapPin,
  FiTruck,
} from 'react-icons/fi';
import { categoriesService } from '@/api/owner/categories';
import { ordersService } from '@/api/owner/orders';
import { client } from '@/api/client';
import { storesService } from '@/api/owner/stores';
import { chatService } from '@/api/owner/chat';
import { resolveImageUrl } from '@/api/imageUtils';
import { customersService } from '@/api/owner/customers';
import { useTranslation } from '../lang/i18n';
import { ShowLowStockProduct } from './dashboad/show_low_stock_product';

interface OverviewTabProps {
  ownerId?: number | string;
  storeId?: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ ownerId, storeId }) => {
  const { t } = useTranslation();
  const [menuItemCount, setMenuItemCount] = useState<number>(0);
  const [categoryCount, setCategoryCount] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [orderStats, setOrderStats] = useState({
    total: 0, pending: 0, confirmed: 0, cancelled: 0, complete: 0,
  });
  const [revenueStats, setRevenueStats] = useState({
    revenue: '$0.00', commission: '$0.00', delivery: '$0.00', tax: '$0.00'
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('store_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.store_name || 'Store';
      }
    } catch (_) {}
    return 'Store';
  });

  useEffect(() => {
    const load = async () => {
      // 1. Fetch menu item count
      try {
        const url = ownerId !== undefined
          ? `/products?limit=200&created_by=${ownerId}`
          : '/products?limit=200';
        const items = await client.get<any[]>(url);
        setMenuItemCount(Array.isArray(items) ? items.length : 0);
      } catch { setMenuItemCount(0); }

      // 2. Fetch category count
      try {
        const cats = await categoriesService.getMyCategories(100, 0, ownerId);
        setCategoryCount(cats.total ?? 0);
      } catch { setCategoryCount(0); }

      // 3. Fetch orders, stats, and top products
      try {
        const orders = await ordersService.getMyStoreOrders(undefined, 0, 500, undefined, storeId, undefined, ownerId);

        if (Array.isArray(orders)) {
          const count = (status: string) => orders.filter(o =>
            (o.status || '').toLowerCase() === status.toLowerCase()
          ).length;
          
          setOrderStats({
            total: orders.length,
            pending: count('pending'),
            confirmed: count('processing') || count('confirmed') || count('confirm'),
            cancelled: count('canceled') + count('cancelled') + count('cancel'),
            complete: count('complete') + count('delivered') + count('completed'),
          });

          // Calculate revenue stats from completed orders
          const completedOrders = orders.filter(o => {
            const s = (o.status || '').toLowerCase();
            return s === 'complete' || s === 'completed' || s === 'delivered';
          });
          const totalRev = completedOrders.reduce((sum, o) => sum + (parseFloat(o.total || '0') || 0), 0);
          const totalTax = completedOrders.reduce((sum, o) => sum + (parseFloat(o.taxAmount || '0') || 0), 0);
          
          setRevenueStats({
            revenue: `$${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            commission: `$${(totalRev * 0.1).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            delivery: `$${(completedOrders.length * 2.0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            tax: `$${totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          });

          // Sorted recent 5 orders
          const sorted = [...orders].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, 5);
          setRecentOrders(sorted);

          // Top products calculation from order items
          const productSales: Record<string, { name: string; qty: number; totalSales: number; image?: string }> = {};
          orders.forEach(order => {
            if (Array.isArray(order.items)) {
              order.items.forEach(item => {
                const qty = item.qty || 1;
                const price = parseFloat(item.price) || 0;
                const name = item.name || 'Unknown Item';
                if (productSales[name]) {
                  productSales[name].qty += qty;
                  productSales[name].totalSales += qty * price;
                } else {
                  productSales[name] = {
                    name,
                    qty,
                    totalSales: qty * price,
                    image: item.image
                  };
                }
              });
            }
          });
          const sortedProducts = Object.values(productSales)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);
          setTopProducts(sortedProducts);
        }
      } catch (err) {
        console.warn('[OverviewTab] Failed to fetch order stats:', err);
      }

      // 4. Fetch recent chat messages
      try {
        const convos = await chatService.getMyConversations();
        if (Array.isArray(convos)) {
          const sortedConvos = [...convos].sort((a, b) => {
            const dateA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.updated_at).getTime();
            const dateB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.updated_at).getTime();
            return dateB - dateA;
          }).slice(0, 5);
          setRecentMessages(sortedConvos);
        }
      } catch (err) {
        console.warn('[OverviewTab] Failed to fetch recent messages:', err);
      }

      // 5. Fetch store settings
      try {
        if (ownerId !== undefined) {
          const data = await storesService.getStore(ownerId);
          if (data && data.store_name) {
            setStoreName(data.store_name);
          }
        }
      } catch (_) {}

      // 6. Fetch customer count
      try {
        const customers = await customersService.getCustomers(0, 500);
        setCustomerCount(Array.isArray(customers) ? customers.length : 0);
      } catch (err) {
        console.warn('[OverviewTab] Failed to fetch customer count:', err);
        setCustomerCount(0);
      }

      setLoading(false);
    };
    load();
  }, [ownerId, storeId]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pending')) {
      return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-100">Pending</span>;
    }
    if (s.includes('confirm')) {
      return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-600 border border-indigo-100">Confirmed</span>;
    }
    if (s.includes('process')) {
      return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-100">Processing</span>;
    }
    if (s.includes('deliver')) {
      return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-cyan-50 text-cyan-600 border border-cyan-100">Delivering</span>;
    }
    if (s.includes('complete')) {
      return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">Complete</span>;
    }
    return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-50 text-rose-600 border border-rose-100">Cancelled</span>;
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm z-10 select-none uppercase tracking-wide">#1 TOP</span>;
      case 2:
        return <span className="absolute top-2 left-2 bg-gradient-to-r from-slate-400 to-slate-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm z-10 select-none uppercase tracking-wide">#2 GOLD</span>;
      case 3:
        return <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm z-10 select-none uppercase tracking-wide">#3 BRONZE</span>;
      default:
        return <span className="absolute top-2 left-2 bg-slate-200 border border-slate-350 text-slate-700 text-[9px] font-black px-1.5 py-0.5 rounded z-10 select-none uppercase tracking-wide">#{rank}</span>;
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const finalRecentOrders = recentOrders.slice(0, 5);
  const finalRecentMessages = recentMessages.slice(0, 5);
  const finalTopProducts = topProducts.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-700">

      {/* ── Page Title Quick link Action  ──────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-slate-800">
          <FiActivity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-wider">{t('overview.quick_actions')}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change_admin_tab', { detail: 'menu-items' }))}
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-[5px] shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center mb-3 transition-colors">
              <FiBox className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t('overview.create_products')}</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change_admin_tab', { detail: 'customers' }))}
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-[5px] shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 transition-colors">
              <FiUsers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t('overview.create_customer')}</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change_admin_tab', { detail: 'settings-delivery-zones' }))}
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-[5px] shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-50 group-hover:bg-purple-100 text-purple-600 flex items-center justify-center mb-3 transition-colors">
              <FiMapPin className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t('overview.create_delivery_zones')}</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change_admin_tab', { detail: 'settings-delivery-methods' }))}
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-[5px] shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 group-hover:bg-amber-100 text-amber-600 flex items-center justify-center mb-3 transition-colors">
              <FiTruck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">{t('overview.delivery_method')}</span>
          </button>
        </div>
      </div>

      {/* ── Business Analytics Section ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-250/20 pb-2">
          <FiActivity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-wider">{t('overview.business_analytics')}</h2>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('overview.total_order'), value: loading ? '—' : orderStats.total, icon: <FiShoppingCart className="w-5 h-5" />, color: 'text-orange-600 bg-white/80 dark:bg-slate-900 dark:text-orange-400 shadow-2xs', bgClass: 'bg-orange-500/10 dark:bg-orange-500/5 border-orange-500/20 dark:border-orange-500/10' },
            { label: t('overview.total_products'), value: loading ? '—' : menuItemCount, icon: <FiBox className="w-5 h-5" />, color: 'text-purple-600 bg-white/80 dark:bg-slate-900 dark:text-purple-400 shadow-2xs', bgClass: 'bg-purple-500/10 dark:bg-purple-500/5 border-purple-500/20 dark:border-purple-500/10' },
            { label: t('overview.total_categories'), value: loading ? '—' : categoryCount, icon: <FiPackage className="w-5 h-5" />, color: 'text-blue-600 bg-white/80 dark:bg-slate-900 dark:text-blue-400 shadow-2xs', bgClass: 'bg-blue-500/10 dark:bg-blue-500/5 border-blue-500/20 dark:border-blue-500/10' },
            { label: t('overview.total_customers'), value: loading ? '—' : customerCount, icon: <FiUsers className="w-5 h-5" />, color: 'text-emerald-600 bg-white/80 dark:bg-slate-900 dark:text-emerald-400 shadow-2xs', bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20 dark:border-emerald-500/10' },
          ].map((card, i) => (
            <div key={i} className={`rounded-[12px] border p-5 shadow-2xs hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-between ${card.bgClass}`}>
              <div>
                <p className="text-[16px] font-bold text-slate-900 dark:text-slate-900 mb-1.5">{card.label}</p>
                <p className="text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-none">{card.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 ${card.color}`}>
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Order Status Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t('overview.pending_orders'), value: orderStats.pending, icon: <FiClock className="w-4 h-4" />, color: 'text-amber-600 bg-white/80 dark:bg-slate-900 dark:text-amber-400 shadow-3xs', bgClass: 'bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20 dark:border-amber-500/10' },
            { label: t('overview.confirmed_orders'), value: orderStats.confirmed, icon: <FiCheckCircle className="w-4 h-4" />, color: 'text-blue-600 bg-white/80 dark:bg-slate-900 dark:text-blue-400 shadow-3xs', bgClass: 'bg-blue-500/10 dark:bg-blue-500/5 border-blue-500/20 dark:border-blue-500/10' },
            { label: t('overview.canceled_orders'), value: orderStats.cancelled, icon: <FiXCircle className="w-4 h-4" />, color: 'text-rose-600 bg-white/80 dark:bg-slate-900 dark:text-rose-400 shadow-3xs', bgClass: 'bg-rose-500/10 dark:bg-rose-500/5 border-rose-500/20 dark:border-rose-500/10' },
            { label: t('overview.complete_orders'), value: orderStats.complete, icon: <FiCheckCircle className="w-4 h-4" />, color: 'text-emerald-600 bg-white/80 dark:bg-slate-900 dark:text-emerald-400 shadow-3xs', bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20 dark:border-emerald-500/10' },
          ].map((s, i) => (
            <div key={i} className={`rounded-[12px] border p-4 shadow-3xs flex items-center gap-3.5 hover:shadow-2xs transition-all duration-300 hover:-translate-y-0.5 ${s.bgClass}`}>
              <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-900 dark:text-slate-900">{s.label}</p>
                <p className="text-[20px] font-black text-slate-900 dark:text-white leading-none">{loading ? '—' : s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revenue Overview Section ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-250/20 pb-2">
          <FiDollarSign className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-wider">{t('overview.revenue_overview')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('overview.total_revenue'), value: loading ? '$0.00' : revenueStats.revenue, sub: t('overview.revenue_sub'), icon: <FiTrendingUp className="w-4.5 h-4.5" />, color: 'bg-orange-500/10 text-orange-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-orange-500' },
            { label: t('overview.commission'), value: loading ? '$0.00' : revenueStats.commission, sub: t('overview.commission_sub'), icon: <FiDollarSign className="w-4.5 h-4.5" />, color: 'bg-amber-500/10 text-amber-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-amber-500' },
            { label: t('overview.delivery_fees'), value: loading ? '$0.00' : revenueStats.delivery, sub: t('overview.delivery_sub'), icon: <FiPackage className="w-4.5 h-4.5" />, color: 'bg-orange-500/10 text-orange-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-orange-500' },
            { label: t('overview.tax_collected'), value: loading ? '$0.00' : revenueStats.tax, sub: t('overview.tax_sub'), icon: <FiCheckCircle className="w-4.5 h-4.5" />, color: 'bg-emerald-500/10 text-emerald-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-emerald-500' },
          ].map((card, i) => (
            <div key={i} className={`rounded-[5px] border p-5 shadow-2xs hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between min-h-[120px] ${card.bgClass}`}>
              <div className="flex items-start justify-between w-full">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{card.label}</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight leading-none font-mono">{card.value}</p>
                </div>
                <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 ${card.color}`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 mt-2 border-t border-slate-100 pt-2">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Orders + Recent Messages Chat ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders List (col-span-2) */}
        <div className="lg:col-span-2 rounded-[5px] border overflow-hidden shadow-2xs flex flex-col justify-between custom-card-container">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b custom-card-header-bar">
              <h3 className="text-sm font-black uppercase tracking-wider">{t('overview.recent_orders')}</h3>
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">5 latest orders</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-450 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-5">{t('overview.order_no')}</th>
                    <th className="py-3 px-3">{t('overview.customer')}</th>
                    <th className="py-3 px-3">{t('overview.product_name')}</th>
                    <th className="py-3 px-3">{t('overview.total')}</th>
                    <th className="py-3 px-5 text-right">{t('overview.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {finalRecentOrders.map((order, i) => {
                    const firstItem = order.items && order.items.length > 0 
                      ? order.items[0].name 
                      : 'N/A';
                    const itemsExtra = order.items && order.items.length > 1
                      ? ` +${order.items.length - 1}`
                      : '';
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">#{order.order_no || order.id}</td>
                        <td className="py-3.5 px-3 font-bold text-slate-800">{order.customer}</td>
                        <td className="py-3.5 px-3 text-slate-500 font-medium truncate max-w-[150px]">
                          {firstItem}{itemsExtra}
                        </td>
                        <td className="py-3.5 px-3 font-black text-slate-900 font-mono">
                          ${parseFloat(order.total_amount || order.total || '0').toFixed(2)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t p-3 bg-black/[0.015] text-center">
            <p className="text-[11px] text-slate-400 font-bold">{t('overview.recent_orders_subtitle')}</p>
          </div>
        </div>

        {/* Recent Messages Chat (col-span-1) */}
        <div className="bg-white rounded-[5px] border overflow-hidden shadow-2xs flex flex-col justify-between custom-card-container">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b custom-card-header-bar">
              <h3 className="text-sm font-black uppercase tracking-wider">{t('overview.recent_messages')}</h3>
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">5 latest messages</span>
            </div>
            <div className="divide-y divide-slate-50">
              {finalRecentMessages.map((convo, i) => {
                const otherUser = convo.other_user || {};
                const name = otherUser.first_name || otherUser.last_name
                  ? `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim()
                  : otherUser.name || 'Store Customer';
                const initial = name.charAt(0).toUpperCase();
                const lastMsg = convo.last_message?.body || 'No messages yet';
                const unread = convo.unread_count > 0;
                
                return (
                  <div key={i} className={`flex items-start gap-3 p-3.5 hover:bg-slate-50/60 transition-colors relative group cursor-pointer ${unread ? 'bg-primary/[0.015]' : ''}`}>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-350 flex items-center justify-center font-black text-xs text-slate-600 shadow-3xs shrink-0 overflow-hidden">
                      {otherUser.image || otherUser.image_url ? (
                        <img src={resolveImageUrl(otherUser.image || otherUser.image_url)} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[12px] font-black leading-none truncate ${unread ? 'text-slate-900 font-black' : 'text-slate-700'}`}>
                          {name}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0 whitespace-nowrap">
                          {convo.last_message?.created_at ? formatMessageTime(convo.last_message.created_at) : 'Just now'}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed truncate mt-1 ${unread ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
                        {lastMsg}
                      </p>
                    </div>
                    {unread && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border-t border-slate-100 p-3 bg-slate-50/20 text-center">
            <p className="text-[11px] text-slate-400 font-bold">{t('overview.recent_messages_subtitle')}</p>
          </div>
        </div>
      </div>

      {/* ── Low Stock + Top Products Section ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts (col-span-1) */}
        <div className="lg:col-span-1 flex">
          <ShowLowStockProduct ownerId={ownerId} storeId={storeId} />
        </div>

        {/* Top Selling Products List (col-span-2) */}
        <div className="lg:col-span-2 rounded-[5px] border overflow-hidden shadow-2xs flex flex-col justify-between custom-card-container">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b custom-card-header-bar">
              <h3 className="text-sm font-black uppercase tracking-wider">{t('overview.top_selling_products') || 'Top Selling Products'}</h3>
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">5 top products</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-450 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-5">Item</th>
                    <th className="py-3 px-3 text-center">Units Sold</th>
                    <th className="py-3 px-5 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {finalTopProducts.map((prod, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[4px] border overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center relative">
                          {prod.image ? (
                            <img src={resolveImageUrl(prod.image)} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <FiBox className="w-4 h-4 text-slate-300" />
                          )}
                          {getRankBadge(i + 1)}
                        </div>
                        <span>{prod.name}</span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-700 text-center font-mono">{prod.qty}</td>
                      <td className="py-3.5 px-5 font-black text-slate-900 text-right font-mono">${prod.totalSales.toFixed(2)}</td>
                    </tr>
                  ))}
                  {finalTopProducts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 font-bold">
                        No sales records yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t p-3 bg-black/[0.015] text-center">
            <p className="text-[11px] text-slate-400 font-bold">Based on order item quantities</p>
          </div>
        </div>
      </div>

    </div>
  );
};
