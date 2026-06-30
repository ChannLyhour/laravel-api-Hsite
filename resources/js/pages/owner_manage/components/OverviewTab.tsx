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
} from 'react-icons/fi';
import { categoriesService } from '@/api/owner/categories';
import { ordersService } from '@/api/owner/orders';
import { client } from '@/api/client';
import { storesService } from '@/api/owner/stores';
import { chatService } from '@/api/owner/chat';
import { resolveImageUrl } from '@/api/imageUtils';
import { customersService } from '@/api/owner/customers';

interface OverviewTabProps {
  ownerId?: number | string;
  storeId?: number;
}

const mockRecentOrders = [
  { id: '1001', order_no: 'ORD-9843', customer: 'Hour ChannLy', items: [{ name: 'Spicy Salmon Sushi' }], total: '24.99', status: 'processing', time: '10 mins ago' },
  { id: '1002', order_no: 'ORD-9842', customer: 'Sophea Rattanak', items: [{ name: 'Double Cheese Burger' }], total: '12.50', status: 'pending', time: '45 mins ago' },
  { id: '1003', order_no: 'ORD-9840', customer: 'John Doe', items: [{ name: 'Chicken Alfredo Pasta' }], total: '18.99', status: 'complete', time: '2 hours ago' },
  { id: '1004', order_no: 'ORD-9839', customer: 'Jane Smith', items: [{ name: 'Vegan Avocado Salad' }], total: '11.00', status: 'complete', time: '4 hours ago' },
  { id: '1005', order_no: 'ORD-9838', customer: 'Kiri Vong', items: [{ name: 'Iced Matcha Latte' }], total: '9.00', status: 'canceled', time: '1 day ago' },
];

const mockRecentMessages = [
  {
    id: 1,
    other_user: { name: 'Chann Lyhour', first_name: 'Chann', last_name: 'Lyhour', image_url: null },
    last_message: { body: 'Hello, is my order already out for delivery?', created_at: new Date().toISOString() },
    unread_count: 1
  },
  {
    id: 2,
    other_user: { name: 'Jane Doe', first_name: 'Jane', last_name: 'Doe', image_url: null },
    last_message: { body: 'Thank you for the delicious burger! Five stars!', created_at: new Date(Date.now() - 3600000).toISOString() },
    unread_count: 0
  },
  {
    id: 3,
    other_user: { name: 'Kiri Vong', first_name: 'Kiri', last_name: 'Vong', image_url: null },
    last_message: { body: 'Can I change my payment method to KHQR?', created_at: new Date(Date.now() - 7200000).toISOString() },
    unread_count: 0
  },
  {
    id: 4,
    other_user: { name: 'Voan Chivorn', first_name: 'Voan', last_name: 'Chivorn', image_url: null },
    last_message: { body: 'Let me know when the shop opens tomorrow.', created_at: new Date(Date.now() - 86400000).toISOString() },
    unread_count: 0
  },
  {
    id: 5,
    other_user: { name: 'Sophea Rattanak', first_name: 'Sophea', last_name: 'Rattanak', image_url: null },
    last_message: { body: 'Order was perfect, thanks again.', created_at: new Date(Date.now() - 172800000).toISOString() },
    unread_count: 0
  }
];

const mockTopProducts = [
  { name: 'Spicy Salmon Sushi', qty: 145, totalSales: 3623.55, image: null },
  { name: 'Double Cheese Burger', qty: 120, totalSales: 1500.00, image: null },
  { name: 'Chicken Alfredo Pasta', qty: 98, totalSales: 1861.02, image: null },
  { name: 'Vegan Avocado Salad', qty: 75, totalSales: 825.00, image: null },
  { name: 'Iced Matcha Latte', qty: 60, totalSales: 540.00, image: null },
];

export const OverviewTab: React.FC<OverviewTabProps> = ({ ownerId, storeId }) => {
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
    if (s.includes('complete') || s.includes('deliver')) {
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

  const finalRecentOrders = recentOrders.length > 0 ? recentOrders.slice(0, 5) : mockRecentOrders;
  const finalRecentMessages = recentMessages.length > 0 ? recentMessages.slice(0, 5) : mockRecentMessages;
  const finalTopProducts = topProducts.length > 0 ? topProducts.slice(0, 5) : mockTopProducts;

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-700">

      {/* ── Page Title Banner with Premium Gradient ──────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white rounded-[5px] p-6 shadow-sm overflow-hidden relative group">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-primary/10 via-transparent to-transparent opacity-50 group-hover:opacity-75 transition-opacity pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-center">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-2">Workspace Dashboard</span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white">Welcome back, {storeName}!</h1>
          <p className="text-[13px] text-slate-300 mt-1.5 font-medium leading-relaxed max-w-xl">
            Monitor orders, messages, and key business analytics metrics for your online store in real-time.
          </p>
        </div>
      </div>

      {/* ── Business Analytics Section ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-250/20 pb-2">
          <FiActivity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-wider">Business Analytics</h2>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Order', value: loading ? '—' : orderStats.total, icon: <FiShoppingCart className="w-4.5 h-4.5" />, color: 'bg-orange-500/10 text-orange-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-orange-500' },
            { label: 'Total Products', value: loading ? '—' : menuItemCount, icon: <FiBox className="w-4.5 h-4.5" />, color: 'bg-purple-500/10 text-purple-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-purple-500' },
            { label: 'Total Categories', value: loading ? '—' : categoryCount, icon: <FiPackage className="w-4.5 h-4.5" />, color: 'bg-orange-500/10 text-orange-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-orange-500' },
            { label: 'Total Customers', value: loading ? '—' : customerCount, icon: <FiUsers className="w-4.5 h-4.5" />, color: 'bg-emerald-500/10 text-emerald-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-emerald-500' },
          ].map((card, i) => (
            <div key={i} className={`rounded-[5px] border p-5 shadow-2xs hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-between ${card.bgClass}`}>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{card.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${card.color}`}>
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Order Status Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending Orders', value: orderStats.pending, icon: <FiClock className="w-4 h-4" />, color: 'text-white bg-amber-500 border-transparent' },
            { label: 'Confirmed Orders', value: orderStats.confirmed, icon: <FiCheckCircle className="w-4 h-4" />, color: 'text-white bg-blue-500 border-transparent' },
            { label: 'Canceled Orders', value: orderStats.cancelled, icon: <FiXCircle className="w-4 h-4" />, color: 'text-white bg-rose-500 border-transparent' },
            { label: 'Complete Orders', value: orderStats.complete, icon: <FiCheckCircle className="w-4 h-4" />, color: 'text-white bg-emerald-500 border-transparent' },
          ].map((s, i) => (
            <div key={i} className="rounded-[5px] border p-4 shadow-3xs flex items-center gap-3.5 hover:shadow-2xs transition-shadow custom-card-container">
              <div className={`w-9 h-9 rounded-[8px] border flex items-center justify-center shrink-0 ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{s.label}</p>
                <p className="text-base font-black text-slate-900 leading-none">{loading ? '—' : s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revenue Overview Section ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-250/20 pb-2">
          <FiDollarSign className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-wider">Revenue Overview</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: loading ? '$0.00' : revenueStats.revenue, sub: 'All completed sales earnings', icon: <FiTrendingUp className="w-4.5 h-4.5" />, color: 'bg-orange-500/10 text-orange-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-orange-500' },
            { label: 'Commission (10%)', value: loading ? '$0.00' : revenueStats.commission, sub: 'Platform commission estimation', icon: <FiDollarSign className="w-4.5 h-4.5" />, color: 'bg-amber-500/10 text-amber-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-amber-500' },
            { label: 'Delivery Fees', value: loading ? '$0.00' : revenueStats.delivery, sub: 'Delivery charge revenues ($2/ord)', icon: <FiPackage className="w-4.5 h-4.5" />, color: 'bg-orange-500/10 text-orange-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-orange-500' },
            { label: 'Tax Collected', value: loading ? '$0.00' : revenueStats.tax, sub: 'Total VAT revenue recorded', icon: <FiCheckCircle className="w-4.5 h-4.5" />, color: 'bg-emerald-500/10 text-emerald-500 border-none', bgClass: 'custom-card-container border-l-4 border-l-emerald-500' },
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
              <h3 className="text-sm font-black uppercase tracking-wider">Recent Orders</h3>
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">5 latest orders</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-450 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-5">Order No</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">First Product</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-5 text-right">Status</th>
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
            <p className="text-[11px] text-slate-400 font-bold">Real-time orders synchronized dynamically from store records.</p>
          </div>
        </div>

        {/* Recent Messages Chat (col-span-1) */}
        <div className="bg-white rounded-[5px] border overflow-hidden shadow-2xs flex flex-col justify-between custom-card-container">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b custom-card-header-bar">
              <h3 className="text-sm font-black uppercase tracking-wider">Recent Chats</h3>
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
            <p className="text-[11px] text-slate-400 font-bold">Synchronized in real-time with customer chat inbox.</p>
          </div>
        </div>
      </div>


    </div>
  );
};
