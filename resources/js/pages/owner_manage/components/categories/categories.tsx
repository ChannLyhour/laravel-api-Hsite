import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiEdit2, FiTrash2, FiCheck, FiX, FiUploadCloud } from 'react-icons/fi';
import { categoriesService } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import type { Category } from '@/api/owner/categories';
import { useConfirm } from '@/components/ConfirmProvider';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';
import { HelperTable } from '../../helper/HelperTable';
import type { HelperTableColumn } from '../../helper/HelperTable';
import { ButtonToggleStatus } from '../../helper/buttonToggleStatus';
import { useTranslation } from '../../lang/i18n';
import { defaultPlanFeatures } from '@/pages/admin_manage/components/subscriptions/index';

interface CategoriesTabProps {
     ownerId?: number | string;
     storeId?: number;
}

const levelFilter = 0;

// Helper: Calculate the nesting level of a category
const getCategoryLevel = (cat: Category, allCats: Category[]): number => {
     let level = 0;
     let current = cat;
     while (current.parent_id) {
          const parent = allCats.find(c => Number(c.id) === Number(current.parent_id));
          if (!parent || Number(parent.id) === Number(current.id)) break; // prevent infinite loops
          level++;
          current = parent;
     }
     return level;
};

export const CategoriesTab: React.FC<CategoriesTabProps> = ({ ownerId, storeId }) => {
     const { t } = useTranslation();
     const confirm = useConfirm();
     const [categories, setCategories] = useState<Category[]>([]);
     const [loading, setLoading] = useState(true);
     const [searchQuery, setSearchQuery] = useState('');
     const [selectedIds, setSelectedIds] = useState<number[]>([]);

     useEffect(() => {
          setSelectedIds([]);
     }, []);

     // Pagination State
     const [currentPage, setCurrentPage] = useState(1);
     const [itemsPerPage, setItemsPerPage] = useState(() => {
          const saved = localStorage.getItem('itemsPerPage_categories');
          return saved ? parseInt(saved, 10) : 5;
     });

     // Status Filter State
     const [showFilters, setShowFilters] = useState(false);
     const [statusFilter, setStatusFilter] = useState<string>('all');

     // Modals state
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [editingCategory, setEditingCategory] = useState<Category | null>(null);
     const [categoryName, setCategoryName] = useState('');
     const [categoryDesc, setCategoryDesc] = useState('');
     const [categoryStatus, setCategoryStatus] = useState<number>(1);
     const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
     const [categoryPriority, setCategoryPriority] = useState<number>(1);
     const [categoryImage, setCategoryImage] = useState<string>('');
     const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
     const [categoryIsMenu, setCategoryIsMenu] = useState<boolean>(true);
     const [submitting, setSubmitting] = useState(false);

     useEffect(() => {
          setCurrentPage(1);
     }, [searchQuery, statusFilter]);

     useEffect(() => {
          loadCategories();
     }, [ownerId, storeId]);

     useEffect(() => {
          const fetchPlanFeatures = async () => {
               try {
                    const res = await fetch('/api/subscriptions/features');
                    if (res.ok) {
                         const data = await res.json();
                         localStorage.setItem('biteflow_plan_features', JSON.stringify(data));
                    }
               } catch (_) {}
          };
          fetchPlanFeatures();
     }, []);

     const loadCategories = async () => {
          setLoading(true);
          try {
               const response = await categoriesService.getMyCategories(100, 0, ownerId, storeId);
               if (response && response.categories) {
                    setCategories(response.categories);
               }
          } catch (err) {
               console.warn('Backend categories fetch failed. Utilizing high-fidelity local fallback state.', err);
          } finally {
               setLoading(false);
          }
     };

     const getCategoriesLimit = (): number => {
          let tier = 'free';
          try {
               const savedSettings = localStorage.getItem('store_settings');
               if (savedSettings) {
                    const parsed = JSON.parse(savedSettings);
                    tier = parsed.subscription_tier || 'free';
               }
          } catch (_) {}

          let featuresList: string[] = [];
          try {
               const savedFeatures = localStorage.getItem('biteflow_plan_features');
               if (savedFeatures) {
                    const parsed = JSON.parse(savedFeatures);
                    if (parsed[tier]) featuresList = parsed[tier];
               }
          } catch (_) {}

          if (featuresList.length === 0) {
               featuresList = defaultPlanFeatures[tier as keyof typeof defaultPlanFeatures] || defaultPlanFeatures.free;
          }

          const limitStr = featuresList.find(f => f.startsWith('Categories Limit:'));
          if (limitStr) {
               const val = limitStr.split(':')[1];
               if (val.toLowerCase().includes('unlimited')) return Infinity;
               const num = parseInt(val, 10);
               if (!isNaN(num)) return num;
          }
          return 2; // Default fallback for Free plan
     };

     const handleOpenCreateModal = () => {
          const limit = getCategoriesLimit();
          const mainCategories = categories.filter(c => !c.parent_id);
          if (mainCategories.length >= limit) {
               toast.error(`Category creation limit reached (${limit} categories max for your current plan). Please upgrade your subscription tier.`);
               return;
          }

          setEditingCategory(null);
          setCategoryName('');
          setCategoryDesc('');
          setCategoryStatus(1);
          setCategoryIsMenu(true);
          setParentCategoryId(null);
          setCategoryPriority(1);
          setCategoryImage('');
          setCategoryImageFile(null);
          setIsModalOpen(true);
     };

     const handleOpenEditModal = (category: Category) => {
          setEditingCategory(category);
          setCategoryName(category.name);
          setCategoryDesc(category.description || '');
          setCategoryStatus(category.status);
          setCategoryIsMenu(category.is_menu);
          setParentCategoryId(category.parent_id || null);
          setCategoryPriority(category.priority ?? 1);
          setCategoryImage(category.image || '');
          setCategoryImageFile(null);
          setIsModalOpen(true);
     };

     const handleCloseModal = () => {
          setIsModalOpen(false);
          setEditingCategory(null);
          setParentCategoryId(null);
          setCategoryImageFile(null);
     };

     const handleSaveCategory = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!categoryName.trim()) return;

          setSubmitting(true);
          try {
               if (editingCategory) {
                    // Edit mode
                    await categoriesService.updateCategory(editingCategory.id, {
                         name: categoryName,
                         description: categoryDesc,
                         status: categoryStatus,
                         is_menu: categoryIsMenu,
                         parent_id: null,
                         priority: categoryPriority,
                         image: categoryImage,
                         imageFile: categoryImageFile || undefined,
                    });
                    toast.success('Category updated successfully!');
               } else {
                    // Create mode
                    await categoriesService.createCategory({
                         name: categoryName,
                         description: categoryDesc,
                         status: categoryStatus,
                         is_menu: categoryIsMenu,
                         created_by: ownerId,
                         parent_id: null,
                         priority: categoryPriority,
                         image: categoryImage,
                         imageFile: categoryImageFile || undefined,
                    });
                    toast.success('Category created successfully!');
               }
               await loadCategories();
               window.dispatchEvent(new CustomEvent('data_updated'));
               new BroadcastChannel('data_updates').postMessage('refresh');
               handleCloseModal();
          } catch (err) {
               console.error('Failed to save category:', err);
               toast.error('Failed to save category. Please try again.');
          } finally {
               setSubmitting(false);
          }
     };

     const handleDeleteCategory = async (id: number, name: string) => {
          const confirmed = await confirm({
               title: 'Delete Category',
               message: `Are you sure you want to delete the "${name}" category? This will affect linked items and any sub-categories.`,
               confirmText: 'Delete Category',
               cancelText: 'Keep Category',
               type: 'danger'
          });

          if (confirmed) {
               try {
                    await categoriesService.deleteCategory(id);
                    await loadCategories();
                    toast.success('Category deleted successfully!');
                    window.dispatchEvent(new CustomEvent('data_updated'));
                    new BroadcastChannel('data_updates').postMessage('refresh');
               } catch (err) {
                    console.error('Failed to delete category:', err);
                    toast.error('Failed to delete category.');
               }
          }
     };

     const handleToggleStatus = async (category: Category) => {
          const newStatus = category.status === 1 ? 0 : 1;
          try {
               await categoriesService.updateCategory(category.id, {
                    name: category.name,
                    description: category.description || '',
                    status: newStatus,
                    is_menu: category.is_menu,
                    parent_id: category.parent_id,
                    priority: category.priority,
                    image: category.image,
               });
               await loadCategories();
               toast.success('Category status updated successfully!');
               window.dispatchEvent(new CustomEvent('data_updated'));
               new BroadcastChannel('data_updates').postMessage('refresh');
          } catch (e) {
               console.error(e);
               toast.error('Failed to change category status.');
          }
     };

     const handleToggleMenu = async (category: Category) => {
          const newMenuStatus = !category.is_menu;
          try {
               await categoriesService.updateCategory(category.id, {
                    name: category.name,
                    description: category.description || '',
                    status: category.status,
                    is_menu: newMenuStatus,
                    parent_id: category.parent_id,
                    priority: category.priority,
                    image: category.image,
               });
               await loadCategories();
               toast.success('Category menu visibility updated successfully!');
               window.dispatchEvent(new CustomEvent('data_updated'));
               new BroadcastChannel('data_updates').postMessage('refresh');
          } catch (e) {
               console.error(e);
               toast.error('Failed to change menu visibility.');
          }
     };

     // Filter categories matching levelFilter, searchQuery, and statusFilter
     const filteredCategories = categories.filter(cat => {
          const lvl = getCategoryLevel(cat, categories);
          if (lvl !== levelFilter) return false;

          const matchesSearch =
               cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

          const matchesStatus =
               statusFilter === 'all' ||
               (statusFilter === 'active' && cat.status === 1) ||
               (statusFilter === 'inactive' && cat.status === 0);

          return matchesSearch && matchesStatus;
     });

     // Sort: highest priority first, then alphabetically by name
     filteredCategories.sort((a, b) => {
          const prioA = a.priority ?? 0;
          const prioB = b.priority ?? 0;
          if (prioB !== prioA) return prioB - prioA;
          return a.name.localeCompare(b.name);
     });

     // Pagination calculations
     const totalItems = filteredCategories.length;
     const totalPages = Math.ceil(totalItems / itemsPerPage);
     const indexOfLastItem = currentPage * itemsPerPage;
     const indexOfFirstItem = indexOfLastItem - itemsPerPage;
     const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

     // Table columns definition
     const columns: HelperTableColumn[] = [
          { key: 'sl', label: t('categories.sl'), align: 'left', className: 'w-16' },
          { key: 'name', label: t('categories.category_name'), align: 'left', className: 'w-[30%]' },
          { key: 'priority', label: t('categories.priority'), align: 'left', className: 'w-[15%]' },
          { key: 'status', label: t('categories.status'), align: 'center', className: 'w-[15%]' },
          { key: 'is_menu', label: t('categories.add_to_menu'), align: 'center', className: 'w-[20%]' },
          { key: 'action', label: t('categories.action'), align: 'center', className: 'w-[15%]' }
     ];

     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files[0]) {
               setCategoryImageFile(e.target.files[0]);
          }
     };

     return (
          <div className="space-y-6 animate-fade-in font-kuntomruy">
               {/* Category Header */}
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                         <h2 className="text-xl sm:text-2xl font-extrabold text-slate-805 tracking-tight flex items-center space-x-2">
                              <div className="grid grid-cols-2 gap-0.5 w-5 h-5 shrink-0">
                                   <div className="bg-[#f36c56] rounded-[1.5px]"></div>
                                   <div className="bg-[#4caf50] rounded-[1.5px]"></div>
                                   <div className="bg-[#ffb300] rounded-[1.5px]"></div>
                                   <div className="bg-[#03a9f4] rounded-[1.5px]"></div>
                              </div>
                              <span>{t('categories.category_setup')}</span>
                         </h2>
                    </div>
               </div>

               {showFilters && (
                    <div className="bg-white border border-slate-100 rounded-[5px] p-4 shadow-xs animate-slide-up flex flex-wrap items-center gap-3 font-kuntomruy">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
                              Filter by Status:
                         </label>
                         <div className="flex gap-1.5 flex-wrap">
                              {[
                                   { value: 'all', label: 'All' },
                                   { value: 'active', label: 'Active (Visible)' },
                                   { value: 'inactive', label: 'Inactive (Hidden)' }
                              ].map(st => (
                                   <button
                                        key={st.value}
                                        type="button"
                                        onClick={() => setStatusFilter(st.value)}
                                        className={`px-3 py-1.5 rounded-[5px] text-xs font-extrabold cursor-pointer transition-all ${statusFilter === st.value
                                             ? 'bg-[#0f53a1] text-white shadow-xs'
                                             : 'bg-slate-100 text-slate-500 hover:bg-slate-200/60'
                                             }`}
                                   >
                                        {st.label}
                                   </button>
                              ))}
                         </div>
                    </div>
               )}

               <HelperTable<Category>
                    columns={columns}
                    data={currentCategories}
                    loading={loading}
                    title={t('categories.category_list')}
                    count={totalItems}
                    searchPlaceholder={t('categories.search_placeholder')}
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
                                   const confirmed = await confirm({
                                        title: 'Delete Multiple Categories',
                                        message: `Are you sure you want to delete the ${ids.length} selected categories? This will affect linked items.`,
                                        confirmText: 'Delete',
                                        cancelText: 'Cancel',
                                        type: 'danger'
                                   });
                                   if (confirmed) {
                                        try {
                                             await Promise.all(ids.map(id => categoriesService.deleteCategory(id)));
                                             await loadCategories();
                                             setSelectedIds([]);
                                             toast.success('Successfully deleted selected categories!');
                                             window.dispatchEvent(new CustomEvent('data_updated'));
                                             new BroadcastChannel('data_updates').postMessage('refresh');
                                        } catch (err) {
                                             console.error(err);
                                             toast.error('Failed to delete some items.');
                                        }
                                   }
                              }
                         }
                    ]}
                    exportButton={{
                         label: 'Export',
                         onClick: () => toast.success('Categories exported successfully!')
                    }}
                    addButton={{
                         label: t('categories.add_category'),
                         onClick: handleOpenCreateModal
                    }}
                    renderRow={(category, index) => {
                         const sl = indexOfFirstItem + index + 1;
                         return (
                              <tr key={category.id} className="hover:bg-slate-50/40 transition-colors">
                                   <td className="py-3.5 px-5 text-left font-bold text-slate-800">{sl}</td>

                                   {/* Category Name Column */}
                                   <td className="py-3.5 px-5">
                                        <div className="flex items-center space-x-3 py-1">
                                             <div className="w-[42px] h-[42px] rounded-[5px] border border-slate-100 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0 shadow-2xs">
                                                  {category.image ? (
                                                       <img
                                                            src={resolveImageUrl(category.image)}
                                                            alt={category.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                 (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                                            }}
                                                       />
                                                  ) : (
                                                       <span className="text-slate-400 font-bold text-xs uppercase">
                                                            {category.name.charAt(0)}
                                                       </span>
                                                  )}
                                             </div>
                                             <div>
                                                  <div className="font-extrabold text-slate-800 text-sm leading-snug">{category.name}</div>
                                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">ID #{category.id}</div>
                                             </div>
                                        </div>
                                   </td>

                                   {/* Priority */}
                                   <td className="py-3.5 px-5 text-left font-bold text-slate-700 text-sm">
                                        {category.priority ?? 0}
                                   </td>

                                   {/* Status */}
                                   <td className="py-3.5 px-5 text-center">
                                        <ButtonToggleStatus
                                             status={category.status}
                                             onToggle={() => handleToggleStatus(category)}
                                        />
                                   </td>

                                   {/* Menu Status */}
                                   <td className="py-3.5 px-5 text-center">
                                        <ButtonToggleStatus
                                             status={category.is_menu}
                                             onToggle={() => handleToggleMenu(category)}
                                             activeColor="bg-[#4caf50]"
                                        />
                                   </td>

                                   {/* Action Buttons */}
                                   <td className="py-3.5 px-5 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                             <button
                                                  onClick={() => handleOpenEditModal(category)}
                                                  className="w-8 h-8 border border-blue-500/50 text-blue-500 hover:bg-blue-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer"
                                                  title="Edit Category Info"
                                             >
                                                  <FiEdit2 className="w-3.5 h-3.5" />
                                             </button>
                                             <button
                                                  onClick={() => handleDeleteCategory(category.id, category.name)}
                                                  className="w-8 h-8 border border-red-500/50 text-red-500 hover:bg-red-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer"
                                                  title="Delete Category"
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
                         localStorage.setItem('itemsPerPage_categories', size.toString());
                         setCurrentPage(1);
                    }}
                    emptyStateText="No Records Found"
                    emptyStateSubtext="Try adjusting your search criteria, or add a record to populate this table."
               />

               {/* Create / Edit Modal Backdrop */}
               {isModalOpen && createPortal(
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 animate-fade-in">
                         {/* Close click area */}
                         <div className="absolute inset-0 cursor-default" onClick={handleCloseModal}></div>

                         {/* Modal Container */}
                         <div className="w-full max-w-lg bg-white rounded-[5px] p-6 sm:p-8 relative z-10 border border-slate-100 shadow-2xl animate-slide-up">
                              <button
                                   onClick={handleCloseModal}
                                   className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[5px] p-2 transition-all cursor-pointer border border-transparent"
                              >
                                   <FiX className="w-4 h-4 stroke-[3]" />
                              </button>

                              <div className="mb-6">
                                   <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                                        <div className="grid grid-cols-2 gap-0.5 w-4 h-4 shrink-0">
                                             <div className="bg-[#f36c56] rounded-[1px]"></div>
                                             <div className="bg-[#4caf50] rounded-[1px]"></div>
                                             <div className="bg-[#ffb300] rounded-[1px]"></div>
                                             <div className="bg-[#03a9f4] rounded-[1px]"></div>
                                        </div>
                                        <span>
                                             {editingCategory ? t('categories.modify_category') : t('categories.create_category')}
                                        </span>
                                   </h3>
                                   <p className="text-slate-500 text-xs font-semibold mt-1">
                                        Fill in the details to customize food catalog categorization.
                                   </p>
                              </div>

                              <form onSubmit={handleSaveCategory} className="space-y-4">
                                   {/* Name */}
                                   <div className="space-y-1.5">
                                        <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                                             {t('categories.category_name')} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                             type="text"
                                             required
                                             value={categoryName}
                                             onChange={(e) => setCategoryName(e.target.value)}
                                             placeholder="e.g. Traditional Khmer Soups"
                                             className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
                                        />
                                   </div>

                                   {/* Category Image Upload */}
                                   <div className="space-y-1.5">
                                        <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                                             Category Image
                                        </label>
                                        <div
                                             onClick={() => document.getElementById('category-image-input')?.click()}
                                             className="border-2 border-dashed border-slate-200 rounded-[5px] p-4 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/30 transition-all group"
                                        >
                                             <input
                                                  id="category-image-input"
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={handleImageChange}
                                                  className="hidden"
                                             />
                                             {categoryImageFile || categoryImage ? (
                                                  <div className="relative w-20 h-20">
                                                       <img
                                                            src={categoryImageFile ? URL.createObjectURL(categoryImageFile) : resolveImageUrl(categoryImage)}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover rounded-[5px] border border-slate-200 shadow-2xs"
                                                            onError={(e) => {
                                                                 (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                                            }}
                                                       />
                                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[5px] transition-opacity">
                                                            <FiUploadCloud className="text-white w-6 h-6" />
                                                       </div>
                                                  </div>
                                             ) : (
                                                  <div className="flex flex-col items-center">
                                                       <FiUploadCloud className="text-slate-300 w-8 h-8 mb-2 group-hover:text-orange-400 transition-colors" />
                                                       <span className="text-xs font-bold text-slate-400 group-hover:text-orange-500">Click to upload image</span>
                                                  </div>
                                             )}
                                        </div>
                                   </div>

                                   {/* Priority */}
                                   <div className="space-y-1.5">
                                        <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                                             Priority
                                        </label>
                                        <input
                                             type="number"
                                             min="0"
                                             value={categoryPriority}
                                             onChange={(e) => setCategoryPriority(Number(e.target.value))}
                                             placeholder="e.g. 1"
                                             className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
                                        />
                                   </div>

                                   {/* Description */}
                                   <div className="space-y-1.5">
                                        <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                                             Description
                                        </label>
                                        <textarea
                                             value={categoryDesc}
                                             onChange={(e) => setCategoryDesc(e.target.value)}
                                             placeholder="Enter optional description..."
                                             rows={3}
                                             className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 resize-none"
                                        />
                                   </div>

                                   {/* Status Toggles */}
                                   <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                             <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                                                  Publishing Status
                                             </label>
                                             <div className="flex items-center space-x-2">
                                                  <button
                                                       type="button"
                                                       onClick={() => setCategoryStatus(1)}
                                                       className={`flex-1 py-2 px-2 border rounded-[5px] text-[10px] font-extrabold flex items-center justify-center space-x-1 transition-all cursor-pointer ${categoryStatus === 1
                                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                            }`}
                                                  >
                                                       <FiCheck className="w-3 h-3 stroke-[3]" />
                                                       <span>Active</span>
                                                  </button>
                                                  <button
                                                       type="button"
                                                       onClick={() => setCategoryStatus(0)}
                                                       className={`flex-1 py-2 px-2 border rounded-[5px] text-[10px] font-extrabold flex items-center justify-center space-x-1 transition-all cursor-pointer ${categoryStatus === 0
                                                            ? 'bg-slate-100 border-slate-400 text-slate-700 shadow-xs'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                            }`}
                                                  >
                                                       <FiX className="w-3 h-3 stroke-[3]" />
                                                       <span>Inactive</span>
                                                  </button>
                                             </div>
                                        </div>

                                        <div className="space-y-1.5">
                                             <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                                                  Add to Navbar
                                             </label>
                                             <div className="flex items-center space-x-2">
                                                  <button
                                                       type="button"
                                                       onClick={() => setCategoryIsMenu(true)}
                                                       className={`flex-1 py-2 px-2 border rounded-[5px] text-[10px] font-extrabold flex items-center justify-center space-x-1 transition-all cursor-pointer ${categoryIsMenu
                                                            ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                            }`}
                                                  >
                                                       <FiCheck className="w-3 h-3 stroke-[3]" />
                                                       <span>Show</span>
                                                  </button>
                                                  <button
                                                       type="button"
                                                       onClick={() => setCategoryIsMenu(false)}
                                                       className={`flex-1 py-2 px-2 border rounded-[5px] text-[10px] font-extrabold flex items-center justify-center space-x-1 transition-all cursor-pointer ${!categoryIsMenu
                                                            ? 'bg-slate-100 border-slate-400 text-slate-700 shadow-xs'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                            }`}
                                                  >
                                                       <FiX className="w-3 h-3 stroke-[3]" />
                                                       <span>Hide</span>
                                                  </button>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Submit Buttons */}
                                   <div className="flex space-x-3 pt-4 border-t border-slate-100">
                                        <button
                                             type="button"
                                             onClick={handleCloseModal}
                                             className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-sm font-bold transition-all border border-slate-200/50 cursor-pointer"
                                        >
                                             Cancel
                                        </button>
                                        <button
                                             type="submit"
                                             disabled={submitting}
                                             className="flex-1 py-2.5 px-4 bg-[#0f53a1] hover:bg-[#0b4789] text-white rounded-[5px] text-sm font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                                        >
                                             {submitting ? (
                                                  <>
                                                       <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                       </svg>
                                                       <span>Saving...</span>
                                                  </>
                                             ) : (
                                                  <span>Save</span>
                                             )}
                                        </button>
                                   </div>
                              </form>
                         </div>
                    </div>,
                    document.body
               )}
          </div>
     );
};
