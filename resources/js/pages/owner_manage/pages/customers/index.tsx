import React, { useEffect, useState } from 'react';
import { customersService, type Customer } from '@/api/owner/customers';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import {
     FiUsers, FiTrash2, FiEdit2,
     FiInfo, FiMail, FiPhone, FiMapPin, FiUser
} from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';
import { HelperTable } from '../../helper/HelperTable';
import type { HelperTableColumn } from '../../helper/HelperTable';
import { resolveImageUrl } from '@/api/imageUtils';

// Import subcomponents
import { CustomerCreatePage } from './create';
import { CustomerEditPage } from './edit';
import { CustomerShowPage } from './show';

interface CustomersTabProps {
     ownerId?: number | string;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ ownerId }) => {
     const [customers, setCustomers] = useState<Customer[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const [searchQuery, setSearchQuery] = useState('');
     const [selectedIds, setSelectedIds] = useState<number[]>([]);

     // Pagination State
     const [currentPage, setCurrentPage] = useState(1);
     const [itemsPerPage, setItemsPerPage] = useState(() => {
          const saved = localStorage.getItem('itemsPerPage_customers');
          return saved ? parseInt(saved, 10) : 10;
     });

     // Navigation View State
     const [view, setView] = useState<'list' | 'create' | 'edit' | 'show'>('list');
     const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);
     const [selectedCustomerForShow, setSelectedCustomerForShow] = useState<Customer | null>(null);

     const fetchCustomers = async () => {
          try {
               setLoading(true);
               setError(null);
               const data = await customersService.getCustomers(0, 500, ownerId);
               setCustomers(data || []);
          } catch (err) {
               console.error(err);
               if (err instanceof ApiError) {
                    setError(err.details.message);
               } else {
                    setError('Failed to fetch customer records. Please check database connection.');
               }
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          fetchCustomers();
     }, [ownerId]);

     useEffect(() => {
          setCurrentPage(1);
     }, [searchQuery]);

     const filteredCustomers = customers.filter(c => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
               c.name?.toLowerCase().includes(q) ||
               c.email?.toLowerCase().includes(q) ||
               c.phone?.toLowerCase().includes(q) ||
               c.city?.toLowerCase().includes(q)
          );
     });

     const handleOpenCreatePage = () => {
          setView('create');
     };

     const handleOpenEditPage = (customer: Customer) => {
          setSelectedCustomerForEdit(customer);
          setView('edit');
     };

     const handleOpenShowPage = (customer: Customer) => {
          setSelectedCustomerForShow(customer);
          setView('show');
     };

     const handleCreateSuccess = (newCustomer: Customer) => {
          setCustomers(prev => [newCustomer, ...prev]);
     };

     const handleEditSuccess = (savedCustomer: Customer) => {
          setCustomers(prev => prev.map(c => c.id === savedCustomer.id ? { ...c, ...savedCustomer } : c));
     };

     const handleDelete = async (customer: Customer) => {
          if (!window.confirm(`Are you sure you want to delete "${customer.name}"? This action cannot be undone.`)) return;
          try {
               await customersService.deleteCustomer(customer.id);
               setCustomers(prev => prev.filter(c => c.id !== customer.id));
               toast.success(`Customer "${customer.name}" deleted.`);
          } catch (err) {
               console.error(err);
               toast.error('Failed to delete customer.');
          }
     };

     const formatDate = (dateStr: string): string => {
          try {
               const d = new Date(dateStr);
               if (isNaN(d.getTime())) return dateStr;
               return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          } catch {
               return dateStr;
          }
     };

     // Pagination calculations
     const totalItems = filteredCustomers.length;
     const totalPages = Math.ceil(totalItems / itemsPerPage);
     const indexOfLastItem = currentPage * itemsPerPage;
     const indexOfFirstItem = indexOfLastItem - itemsPerPage;
     const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

     const columns: HelperTableColumn[] = [
          { key: 'sl', label: 'SL', align: 'left', className: 'w-16' },
          { key: 'customer', label: 'Customer', align: 'left' },
          { key: 'contact', label: 'Contact', align: 'left', className: 'hidden md:table-cell' },
          { key: 'location', label: 'Location', align: 'left', className: 'hidden lg:table-cell' },
          { key: 'joined', label: 'Joined', align: 'left', className: 'hidden sm:table-cell' },
          { key: 'action', label: 'Action', align: 'right', className: 'text-right' }
     ];

     if (view === 'create') {
          return (
               <CustomerCreatePage
                    onClose={() => setView('list')}
                    onSave={handleCreateSuccess}
               />
          );
     }

     if (view === 'edit' && selectedCustomerForEdit) {
          return (
               <CustomerEditPage
                    onClose={() => {
                         setView('list');
                         setSelectedCustomerForEdit(null);
                    }}
                    customer={selectedCustomerForEdit}
                    onSave={handleEditSuccess}
               />
          );
     }

     if (view === 'show' && selectedCustomerForShow) {
          return (
               <CustomerShowPage
                    onClose={() => {
                         setView('list');
                         setSelectedCustomerForShow(null);
                    }}
                    customer={selectedCustomerForShow}
                    onEdit={(customer) => {
                         setSelectedCustomerForEdit(customer);
                         setView('edit');
                    }}
               />
          );
     }

     return (
          <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full">

               {/* Header */}
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                         <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
                              <FiUsers className="text-primary" />
                              <span>Customer Setup</span>
                         </h2>
                         <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                              View and manage all customer profiles registered to your store.
                         </p>
                    </div>
               </div>

               {/* Error */}
               {error && (
                    <div className="p-5 bg-rose-50 border border-rose-100 rounded-[5px] flex items-start space-x-3 text-rose-800 text-xs animate-slide-up">
                         <FiInfo className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                         <div className="font-semibold leading-relaxed">{error}</div>
                    </div>
               )}

               {/* Helper Table */}
               {!error && (
                    <HelperTable<Customer>
                         columns={columns}
                         data={currentCustomers}
                         loading={loading}
                         title="Customer List"
                         count={totalItems}
                         searchPlaceholder="Search by name, email, phone, city..."
                         searchValue={searchQuery}
                         onSearchChange={setSearchQuery}
                         selectedIds={selectedIds}
                         onSelectionChange={setSelectedIds}
                         getRowId={(item) => item.id}
                         bulkActions={[
                              {
                                   label: 'Bulk Delete',
                                   className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-250 hover:border-rose-350',
                                   onClick: async (ids) => {
                                        if (!window.confirm(`Are you sure you want to delete the ${ids.length} selected customers? This action cannot be undone.`)) return;
                                        try {
                                             await Promise.all(ids.map(id => customersService.deleteCustomer(id)));
                                             setCustomers(prev => prev.filter(c => !ids.includes(c.id)));
                                             setSelectedIds([]);
                                             toast.success('Successfully deleted selected customers!');
                                        } catch (err) {
                                             console.error(err);
                                             toast.error('Failed to delete some customers.');
                                        }
                                   }
                              }
                         ]}
                         addButton={{
                              label: 'Add Customer',
                              onClick: handleOpenCreatePage,
                         }}
                         renderRow={(customer, idx) => {
                              const sl = indexOfFirstItem + idx + 1;
                              return (
                                   <tr key={customer.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="py-3.5 px-5 text-left font-bold text-slate-800">{sl}</td>
                                        <td className="py-3.5 px-5">
                                             <div className="flex items-center gap-3">
                                                  <div className="w-9 h-9 rounded-[8px] overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                                                       {customer.image ? (
                                                            <img
                                                                 src={resolveImageUrl(customer.image)}
                                                                 alt={customer.name}
                                                                 className="w-full h-full object-cover"
                                                                 onError={(e) => {
                                                                      e.currentTarget.style.display = 'none';
                                                                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                                      if (fallback) fallback.style.display = 'flex';
                                                                 }}
                                                            />
                                                       ) : null}
                                                       <span className="w-full h-full flex items-center justify-center" style={{ display: customer.image ? 'none' : 'flex' }}>
                                                            {customer.name ? customer.name.charAt(0).toUpperCase() : <FiUser className="w-4 h-4" />}
                                                       </span>
                                                  </div>
                                                  <div>
                                                       <p className="text-xs font-extrabold text-slate-800">{customer.name}</p>
                                                       <p className="text-[10px] font-semibold text-slate-400 md:hidden">
                                                            {customer.email || customer.phone || '—'}
                                                       </p>
                                                  </div>
                                             </div>
                                        </td>
                                        <td className="py-3.5 px-5 hidden md:table-cell">
                                             <div className="space-y-0.5">
                                                  {customer.email && (
                                                       <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                                            <FiMail className="w-3 h-3 text-slate-400 shrink-0" />
                                                            <span>{customer.email}</span>
                                                       </div>
                                                  )}
                                                  {customer.phone && (
                                                       <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                                            <FiPhone className="w-3 h-3 text-slate-400 shrink-0" />
                                                            <span>{customer.phone}</span>
                                                       </div>
                                                  )}
                                                  {!customer.email && !customer.phone && (
                                                       <span className="text-[11px] font-semibold text-slate-300">—</span>
                                                  )}
                                             </div>
                                        </td>
                                        <td className="py-3.5 px-5 hidden lg:table-cell">
                                             {(customer.city || customer.address) ? (
                                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                                       <FiMapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                       <span className="truncate max-w-[180px]">{[customer.city, customer.address].filter(Boolean).join(', ')}</span>
                                                  </div>
                                             ) : (
                                                  <span className="text-[11px] font-semibold text-slate-300">—</span>
                                             )}
                                        </td>
                                        <td className="py-3.5 px-5 hidden sm:table-cell">
                                             <span className="text-[11px] font-semibold text-slate-400">
                                                  {customer.created_at ? formatDate(customer.created_at) : '—'}
                                             </span>
                                        </td>
                                        <td className="py-3.5 px-5 text-right">
                                             <div className="flex justify-end items-center gap-2">
                                                  <button
                                                       onClick={() => handleOpenShowPage(customer)}
                                                       className="w-8 h-8 border border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer bg-transparent"
                                                       title="View customer details"
                                                  >
                                                       <FiInfo className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                       onClick={() => handleOpenEditPage(customer)}
                                                       className="w-8 h-8 border border-blue-500/50 text-blue-500 hover:bg-blue-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer bg-transparent"
                                                       title="Edit customer"
                                                  >
                                                       <FiEdit2 className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                       onClick={() => handleDelete(customer)}
                                                       className="w-8 h-8 border border-red-500/50 text-red-500 hover:bg-red-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer bg-transparent"
                                                       title="Delete customer"
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
                              localStorage.setItem('itemsPerPage_customers', size.toString());
                              setCurrentPage(1);
                         }}
                         emptyStateText="No Records Found"
                         emptyStateSubtext="Try adjusting search or filter criteria to view records."
                    />
               )}
          </div>
     );
};
