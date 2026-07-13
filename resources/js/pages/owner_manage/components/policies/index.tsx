import React, { useState, useEffect, useCallback } from 'react';
import {
     FiPlus, FiEdit2, FiTrash2, FiFileText, FiEye, FiCheckCircle, FiEyeOff, FiAlertCircle
} from 'react-icons/fi';
import { policiesApi } from '@/api/owner/policies';
import type { Policy, PolicySave } from '@/api/owner/policies';
import { useConfirm } from '@/components/ConfirmProvider';
import { EditPage } from './edit';
import { ShowPage } from './show';
import { HelperTable } from '../../helper/HelperTable';
import type { HelperTableColumn } from '../../helper/HelperTable';

// ─── Sub-components & Helpers ────────────────────────────────────────────────

export const StatusBadge: React.FC<{ status: string }> = ({ status }) =>
     status === 'published' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
               <FiCheckCircle className="w-3 h-3" /> Published
          </span>
     ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
               <FiEyeOff className="w-3 h-3" /> Draft
          </span>
     );

export const formatDate = (d: string | null) =>
     d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// ─── Main Policies Routing Component ──────────────────────────────────────────

interface PoliciesTabProps {
     ownerId?: number | string;
}

export const PoliciesTab: React.FC<PoliciesTabProps> = () => {
     const [policies, setPolicies] = useState<Policy[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     // View state: 'list' | 'create' | 'edit' | 'show'
     const [view, setView] = useState<'list' | 'create' | 'edit' | 'show'>('list');
     const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
     const [formLoading, setFormLoading] = useState(false);

     // Search & Pagination States
     const [searchQuery, setSearchQuery] = useState('');
     const [currentPage, setCurrentPage] = useState(1);
     const [itemsPerPage, setItemsPerPage] = useState(10);

     const confirm = useConfirm();

     const fetchPolicies = useCallback(async () => {
          try {
               setLoading(true);
               setError(null);
               const res = await policiesApi.list();
               if (res && res.success) {
                    setPolicies(res.data);
               } else {
                    setError('Failed to fetch policies');
               }
          } catch (err: any) {
               setError(err.details?.message || err.message || 'An error occurred');
          } finally {
               setLoading(false);
          }
     }, []);

     useEffect(() => {
          fetchPolicies();
     }, [fetchPolicies]);

     useEffect(() => {
          setCurrentPage(1);
     }, [searchQuery]);

     const handleCreateOpen = () => {
          setSelectedPolicy(null);
          setView('create');
     };

     const handleEditOpen = (policy: Policy) => {
          setSelectedPolicy(policy);
          setView('edit');
     };

     const handleShowOpen = (policy: Policy) => {
          setSelectedPolicy(policy);
          setView('show');
     };

     const handleSave = async (data: PolicySave) => {
          try {
               setFormLoading(true);
               const res = await policiesApi.save(data);
               if (res && res.success) {
                    await fetchPolicies();
                    setView('list');
                    setSelectedPolicy(null);
               }
          } catch (err: any) {
               alert(err.details?.message || err.message || 'Error saving policy.');
          } finally {
               setFormLoading(false);
          }
     };

     const handleDelete = async (id: number) => {
          const ok = await confirm({
               title: 'Delete Policy?',
               message: 'Are you sure you want to delete this policy? This action cannot be undone.',
          });
          if (!ok) return;

          try {
               setLoading(true);
               const res = await policiesApi.delete(id);
               if (res && res.success) {
                    await fetchPolicies();
                    if (selectedPolicy?.id === id) {
                         setSelectedPolicy(null);
                         setView('list');
                    }
               }
          } catch (err: any) {
               alert(err.details?.message || err.message || 'Error deleting policy.');
          } finally {
               setLoading(false);
          }
     };

     // HelperTable columns definition
     const columns: HelperTableColumn[] = [
          { key: 'sl', label: 'SL', align: 'center', className: 'w-12' },
          { key: 'title', label: 'Policy Name', align: 'left', filterable: true },
          { key: 'slug', label: 'Slug / Route', align: 'left' },
          { key: 'status', label: 'Status', align: 'center' },
          { key: 'updated_at', label: 'Last Updated', align: 'left' },
          { key: 'action', label: 'Actions', align: 'right', className: 'w-36' }
     ];

     // Filters logic
     const filteredPolicies = policies.filter(policy =>
          policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          policy.slug.toLowerCase().includes(searchQuery.toLowerCase())
     );

     const totalItems = filteredPolicies.length;
     const totalPages = Math.ceil(totalItems / itemsPerPage);
     const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
     const indexOfLastItem = indexOfFirstItem + itemsPerPage;
     const paginatedPolicies = filteredPolicies.slice(indexOfFirstItem, indexOfLastItem);

     // Render view depending on view state
     if (view === 'create' || view === 'edit') {
          return (
               <EditPage
                    initial={selectedPolicy}
                    onSave={handleSave}
                    onClose={() => {
                         setView('list');
                         setSelectedPolicy(null);
                    }}
                    loading={formLoading}
               />
          );
     }

     if (view === 'show' && selectedPolicy) {
          return (
               <ShowPage
                    policy={selectedPolicy}
                    onClose={() => {
                         setView('list');
                         setSelectedPolicy(null);
                    }}
                    onEdit={handleEditOpen}
               />
          );
     }

     return (
          <div className="w-full flex flex-col space-y-6">
               {/* Header */}
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[5px] border border-slate-100 shadow-3xs">
                    <div>
                         <h1 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                              <FiFileText className="w-5 h-5 text-orange-500" /> Store Policies
                         </h1>
                         <p className="text-xs font-semibold text-slate-400 mt-1">
                              Manage your store's Privacy Policy, Refund Policy, and Terms of Service.
                         </p>
                    </div>
               </div>

               {/* Error Message */}
               {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-[5px] text-xs font-bold flex items-center gap-2">
                         <FiAlertCircle className="w-4.5 h-4.5" /> {error}
                    </div>
               )}

               {/* Main Table Area using HelperTable */}
               <HelperTable<Policy>
                    columns={columns}
                    data={paginatedPolicies}
                    loading={loading}
                    title="Policies List"
                    count={filteredPolicies.length}
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search by title or slug..."
                    emptyStateText="No Policies Found"
                    emptyStateSubtext="You can create a new Privacy Policy, Refund Policy, or custom store policy by clicking Add Policy."
                    addButton={{
                         label: 'Add Policy',
                         onClick: handleCreateOpen
                    }}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    renderRow={(policy, index) => {
                         const sl = indexOfFirstItem + index + 1;
                         return (
                              <tr key={policy.id} className="hover:bg-slate-50/40 transition-colors group">
                                   <td className="py-3.5 px-5 text-center font-bold text-slate-800">{sl}</td>
                                   <td className="py-3.5 px-5">
                                        <div className="flex items-center gap-3">
                                             <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                                                  <FiFileText className="w-4.5 h-4.5" />
                                             </div>
                                             <button
                                                  onClick={() => handleShowOpen(policy)}
                                                  className="text-sm font-bold text-slate-800 hover:text-orange-500 transition-colors text-left font-sans bg-transparent border-none p-0 cursor-pointer"
                                             >
                                                  {policy.title}
                                             </button>
                                        </div>
                                   </td>
                                   <td className="py-3.5 px-5">
                                        <code className="text-xs font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100">
                                             /policies/{policy.slug}
                                        </code>
                                   </td>
                                   <td className="py-3.5 px-5 text-center">
                                        <StatusBadge status={policy.status} />
                                   </td>
                                   <td className="py-3.5 px-5 text-xs font-semibold text-slate-500">
                                        {formatDate(policy.updated_at)}
                                   </td>
                                   <td className="py-3.5 px-5 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                             <button
                                                  onClick={() => handleShowOpen(policy)}
                                                  title="View Policy"
                                                  className="p-2 border border-emerald-200/80 text-emerald-600 hover:bg-emerald-50 rounded-[5px] transition-colors cursor-pointer bg-white"
                                             >
                                                  <FiEye className="w-3.5 h-3.5" />
                                             </button>
                                             <button
                                                  onClick={() => handleEditOpen(policy)}
                                                  title="Edit Policy"
                                                  className="p-2 border border-blue-200/80 text-blue-600 hover:bg-blue-50 rounded-[5px] transition-colors cursor-pointer bg-white"
                                             >
                                                  <FiEdit2 className="w-3.5 h-3.5" />
                                             </button>
                                             <button
                                                  onClick={() => handleDelete(policy.id)}
                                                  title="Delete Policy"
                                                  className="p-2 border border-rose-200/80 text-rose-500 hover:bg-rose-50 rounded-[5px] transition-colors cursor-pointer bg-white"
                                             >
                                                  <FiTrash2 className="w-3.5 h-3.5" />
                                             </button>
                                        </div>
                                   </td>
                              </tr>
                         );
                    }}
               />
          </div>
     );
};
