import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiGlobe, FiInfo, FiEdit2 } from 'react-icons/fi';
import { type Customer } from '@/api/owner/customers';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';
import { customerOrdersService } from '@/api/created_by/getOrderCustomerbyid';
import { type Order } from '@/pages/owner_manage/components/order/show';
import { HelperTable } from '../../helper/HelperTable';
import type { HelperTableColumn } from '../../helper/HelperTable';

interface CustomerShowPageProps {
     onClose: () => void;
     customer: Customer;
     onEdit: (customer: Customer) => void;
}

export const CustomerShowPage: React.FC<CustomerShowPageProps> = ({
     onClose,
     customer,
     onEdit,
}) => {
     if (!customer) return null;

     const [orders, setOrders] = useState<Order[]>([]);
     const [loadingOrders, setLoadingOrders] = useState(true);
     const [errorOrders, setErrorOrders] = useState<string | null>(null);

     // Pagination and Search State for Orders Table
     const [currentPage, setCurrentPage] = useState(1);
     const [itemsPerPage, setItemsPerPage] = useState(5);
     const [searchQuery, setSearchQuery] = useState('');

     useEffect(() => {
          const fetchOrders = async () => {
               try {
                    setLoadingOrders(true);
                    setErrorOrders(null);
                    const fetchedOrders = await customerOrdersService.getOrdersByCustomerId(
                         customer.id,
                         undefined,
                         0,
                         100,
                         customer.user_id ?? undefined,
                         customer.email ?? undefined,
                         customer.phone ?? undefined
                    );
                    setOrders(fetchedOrders || []);
               } catch (err) {
                    console.error(err);
                    setErrorOrders('Failed to load order history.');
               } finally {
                    setLoadingOrders(false);
               }
          };

          if (customer?.id) {
               fetchOrders();
          }
     }, [customer?.id]);

     useEffect(() => {
          setCurrentPage(1);
     }, [searchQuery]);

     const filteredOrders = orders.filter(o => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
               (o.order_no && o.order_no.toLowerCase().includes(q)) ||
               o.id.toLowerCase().includes(q) ||
               o.time.toLowerCase().includes(q) ||
               o.total.toLowerCase().includes(q)
          );
     });

     const totalItems = filteredOrders.length;
     const totalPages = Math.ceil(totalItems / itemsPerPage);
     const indexOfLastItem = currentPage * itemsPerPage;
     const indexOfFirstItem = indexOfLastItem - itemsPerPage;
     const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

     const totalSpent = orders
          .filter(o => o.status !== 'canceled' && o.status !== 'cancelled')
          .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

     const getStatusBadgeClass = (status: Order['status']) => {
          switch (status) {
               case 'pending': return 'bg-blue-50 text-blue-600 border border-blue-100';
               case 'confirm': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
               case 'processing': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
               case 'canceled':
               case 'cancelled': return 'bg-rose-50 text-rose-600 border border-rose-100';
               case 'complete': return 'bg-slate-50 text-slate-500 border border-slate-200';
               default: return 'bg-slate-50 text-slate-500 border border-slate-100';
          }
     };

     const getStatusTextLabel = (status: Order['status']) => {
          switch (status) {
               case 'pending': return 'Pending';
               case 'confirm': return 'Confirmed';
               case 'processing': return 'Processing';
               case 'canceled':
               case 'cancelled': return 'Canceled';
               case 'complete': return 'Complete';
               default: return status;
          }
     };

     const formatDate = (dateStr?: string): string => {
          if (!dateStr) return '—';
          try {
               const d = new Date(dateStr);
               if (isNaN(d.getTime())) return dateStr;
               return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
          } catch {
               return dateStr;
          }
     };

     const avatarUrl = customer.image ? resolveImageUrl(customer.image) : null;

     return (
          <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 pb-10 w-full">
               {/* ── HEADER NAVIGATION ─────────────────────────────── */}
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100 pb-5">
                    <div className="flex items-center space-x-3">
                         <button
                              onClick={onClose}
                              className="p-2 border border-slate-200 rounded-[5px] hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-2xs"
                              title="Back to customers list"
                         >
                              <FiArrowLeft className="w-5 h-5 stroke-[2.5]" />
                         </button>
                         <div>
                              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
                                   <FiInfo className="text-primary" />
                                   <span>Customer Details</span>
                              </h2>
                              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                   Review personal information, location coordinates, and metadata of this customer.
                              </p>
                         </div>
                    </div>

                    <button
                         onClick={() => onEdit(customer)}
                         className="py-2 px-5 bg-primary hover:bg-primary-hover text-white rounded-[5px] text-xs font-bold transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 flex items-center space-x-2 cursor-pointer border-none active:scale-95 duration-200"
                    >
                         <FiEdit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                         <span>Edit Profile</span>
                    </button>
               </div>

               {/* ── TWO COLUMN MAIN LAYOUT ────────────────────────────── */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
                    {/* Left Column (1/3 width) - Profile Header Card */}
                    <div className="bg-white border border-slate-100 rounded-[5px] p-6 shadow-xs text-center space-y-4">
                         <div className="flex justify-center">
                              <div className="w-24 h-24 rounded-[16px] overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-4xl shadow-sm shrink-0">
                                   {avatarUrl ? (
                                        <img
                                             src={avatarUrl}
                                             alt={customer.name}
                                             className="w-full h-full object-cover"
                                             onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                  if (fallback) fallback.style.display = 'flex';
                                             }}
                                        />
                                   ) : null}
                                   <span className="w-full h-full flex items-center justify-center" style={{ display: avatarUrl ? 'none' : 'flex' }}>
                                        {customer.name ? customer.name.charAt(0).toUpperCase() : <FiUser className="w-12 h-12" />}
                                   </span>
                              </div>
                         </div>

                         <div className="space-y-1">
                              <h4 className="font-extrabold text-slate-800 text-lg">{customer.name}</h4>
                              <p className="text-slate-400 text-xs font-semibold">{customer.email || 'No email address'}</p>
                         </div>

                         <div className="flex justify-center gap-2 pt-2 border-t border-slate-50">
                              {customer.gender && (
                                   <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600 capitalize">
                                        {customer.gender}
                                   </span>
                              )}
                              {customer.country && (
                                   <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600">
                                        {customer.country}
                                   </span>
                              )}
                         </div>

                         {/* Stats Overview */}
                         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-[5px] text-center animate-fade-in">
                                   <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Order Count</p>
                                   <p className="text-lg font-black text-slate-800 mt-1">
                                        {loadingOrders ? '...' : orders.length}
                                   </p>
                              </div>
                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-[5px] text-center animate-fade-in">
                                   <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Spent</p>
                                   <p className="text-lg font-black text-emerald-600 mt-1">
                                        {loadingOrders ? '...' : `$${totalSpent.toFixed(2)}`}
                                   </p>
                              </div>
                         </div>
                    </div>

                    {/* Right Column (2/3 width) - Customer Details Details */}
                    <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[5px] p-6 sm:p-8 shadow-xs space-y-6">
                         <h3 className="font-extrabold text-slate-800 text-sm sm:text-base border-b border-slate-50 pb-3">
                              Customer Profile Summary
                         </h3>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* First Name */}
                              <div className="flex items-start gap-3">
                                   <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400 shrink-0">
                                        <FiUser className="w-4 h-4" />
                                   </div>
                                   <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">First Name</p>
                                        <p className="text-xs font-semibold text-slate-700">{customer.first_name || '—'}</p>
                                   </div>
                              </div>

                              {/* Last Name */}
                              <div className="flex items-start gap-3">
                                   <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400 shrink-0">
                                        <FiUser className="w-4 h-4" />
                                   </div>
                                   <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Last Name</p>
                                        <p className="text-xs font-semibold text-slate-700">{customer.last_name || '—'}</p>
                                   </div>
                              </div>

                              {/* Email */}
                              <div className="flex items-start gap-3">
                                   <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400 shrink-0">
                                        <FiMail className="w-4 h-4" />
                                   </div>
                                   <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</p>
                                        <p className="text-xs font-semibold text-slate-700">{customer.email || '—'}</p>
                                   </div>
                              </div>

                              {/* Phone */}
                              <div className="flex items-start gap-3">
                                   <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400 shrink-0">
                                        <FiPhone className="w-4 h-4" />
                                   </div>
                                   <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone Number</p>
                                        <p className="text-xs font-semibold text-slate-700">{customer.phone || '—'}</p>
                                   </div>
                              </div>

                              {/* Location */}
                              <div className="flex items-start gap-3 md:col-span-2">
                                   <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400 shrink-0">
                                        <FiMapPin className="w-4 h-4" />
                                   </div>
                                   <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Location / Address</p>
                                        <p className="text-xs font-semibold text-slate-700">
                                             {[customer.address, customer.city].filter(Boolean).join(', ') || '—'}
                                        </p>
                                   </div>
                              </div>

                              {/* Joined Date */}
                              <div className="flex items-start gap-3">
                                   <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400 shrink-0">
                                        <FiCalendar className="w-4 h-4" />
                                   </div>
                                   <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Joined Date</p>
                                        <p className="text-xs font-semibold text-slate-700">{formatDate(customer.created_at)}</p>
                                   </div>
                              </div>

                              {/* Stats if available */}
                              {customer.orders_count !== undefined && (
                                   <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400 shrink-0">
                                             <FiGlobe className="w-4 h-4" />
                                        </div>
                                        <div>
                                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Orders Placed</p>
                                             <p className="text-xs font-semibold text-slate-700">{customer.orders_count} orders</p>
                                        </div>
                                   </div>
                              )}
                         </div>
                    </div>
               </div>

               {/* ── ORDER HISTORY ─────────────────────────────────── */}
               <div className="bg-white border border-slate-100 rounded-[5px] p-6 sm:p-8 shadow-xs">
                    {errorOrders ? (
                         <div className="py-10 text-center text-rose-500 text-xs font-semibold">
                              {errorOrders}
                         </div>
                    ) : (
                         <HelperTable<Order>
                              columns={[
                                   { key: 'sl', label: 'SL', align: 'left', className: 'w-16' },
                                   { key: 'order_no', label: 'Order No', align: 'left' },
                                   { key: 'date', label: 'Date', align: 'left' },
                                   { key: 'payment_status', label: 'Payment Status', align: 'left' },
                                   { key: 'order_status', label: 'Order Status', align: 'center' },
                                   { key: 'total', label: 'Total', align: 'right', className: 'text-right' }
                              ]}
                              data={currentOrders}
                              loading={loadingOrders}
                              title="Order History"
                              count={totalItems}
                              searchPlaceholder="Search by Order No, date, total..."
                              searchValue={searchQuery}
                              onSearchChange={setSearchQuery}
                              currentPage={currentPage}
                              totalPages={totalPages}
                              itemsPerPage={itemsPerPage}
                              totalItems={totalItems}
                              onPageChange={setCurrentPage}
                              onItemsPerPageChange={setItemsPerPage}
                              renderRow={(order, idx) => {
                                   const sl = indexOfFirstItem + idx + 1;
                                   return (
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                             <td className="py-3.5 px-5 text-left font-bold text-slate-800">{sl}</td>
                                             <td className="py-3.5 px-5 font-extrabold text-slate-800">
                                                  {order.order_no || order.id}
                                             </td>
                                             <td className="py-3.5 px-5 text-slate-500 font-medium">
                                                  {order.time}
                                             </td>
                                             <td className="py-3.5 px-5">
                                                  <span className={`text-[11px] font-bold ${order.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                       {order.paymentStatus}
                                                  </span>
                                             </td>
                                             <td className="py-3.5 px-5 text-center">
                                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-[5px] text-2xs uppercase tracking-wider font-extrabold ${getStatusBadgeClass(order.status)}`}>
                                                       {getStatusTextLabel(order.status)}
                                                  </span>
                                             </td>
                                             <td className="py-3.5 px-5 text-right font-black text-slate-800">
                                                  ${parseFloat(order.total).toFixed(2)}
                                             </td>
                                        </tr>
                                   );
                              }}
                              emptyStateText="No Orders Found"
                              emptyStateSubtext="No order history found for this customer."
                         />
                    )}
               </div>
          </div>
     );
};
