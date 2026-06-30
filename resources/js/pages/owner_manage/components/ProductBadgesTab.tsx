import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FiEdit2, FiTrash2, FiCheck, FiX, FiTag, FiEye } from 'react-icons/fi';
import { productBadgesService } from '@/api/owner/productBadges';
import type { ProductBadge } from '@/api/owner/productBadges';
import { useConfirm } from '@/components/ConfirmProvider';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';
import { HelperTable } from '../helper/HelperTable';
import type { HelperTableColumn } from '../helper/HelperTable';

interface ProductBadgesTabProps {
  ownerId?: number | string;
}

export const ProductBadgesTab: React.FC<ProductBadgesTabProps> = ({ ownerId }) => {
  const confirm = useConfirm();
  const [badges, setBadges] = useState<ProductBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('itemsPerPage_product_badges');
    return saved ? parseInt(saved, 10) : 10;
  });

  // Status Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<ProductBadge | null>(null);
  const [badgeName, setBadgeName] = useState('');
  const [badgeSlug, setBadgeSlug] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('#0f53a1');
  const [badgeStatus, setBadgeStatus] = useState<boolean>(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBadge, setPreviewBadge] = useState<ProductBadge | null>(null);
  const [badgePriority, setBadgePriority] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadBadges();
  }, [ownerId]);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const response = await productBadgesService.getMyProductBadges(100, 0);
      if (response) {
        setBadges(response);
      }
    } catch (err) {
      console.warn('Backend badges fetch failed. Fetching all badges instead.', err);
      try {
        const responseAll = await productBadgesService.getProductBadges(100, 0);
        if (responseAll) {
          setBadges(responseAll);
        }
      } catch (errAll) {
        console.warn('Fallback badges fetch failed.', errAll);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBadge(null);
    setBadgeName('');
    setBadgeSlug('');
    setTextColor('#ffffff');
    setBackgroundColor('#0f53a1');
    setBadgeStatus(true);
    setBadgePriority(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (badge: ProductBadge) => {
    setEditingBadge(badge);
    setBadgeName(badge.name);
    setBadgeSlug(badge.slug);
    setTextColor(badge.text_color);
    setBackgroundColor(badge.background_color);
    setBadgeStatus(badge.status);
    setBadgePriority(badge.priority ?? 0);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBadge(null);
  };

  const handleOpenPreviewModal = (badge: ProductBadge) => {
    setPreviewBadge(badge);
    setIsPreviewOpen(true);
  };

  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeName.trim() || !badgeSlug.trim()) return;

    setSubmitting(true);
    try {
      if (editingBadge) {
        // Edit mode
        const updated = await productBadgesService.updateProductBadge(editingBadge.id, {
          name: badgeName,
          slug: badgeSlug,
          text_color: textColor,
          background_color: backgroundColor,
          status: badgeStatus,
          priority: badgePriority,
        });
        setBadges(prev =>
          prev.map(b => (b.id === editingBadge.id ? updated : b))
        );
        toast.success('Badge updated successfully!');
      } else {
        // Create mode
        const newBadge = await productBadgesService.createProductBadge({
          name: badgeName,
          slug: badgeSlug,
          text_color: textColor,
          background_color: backgroundColor,
          status: badgeStatus,
          priority: badgePriority,
          created_by: ownerId,
        });
        setBadges(prev => [newBadge, ...prev]);
        toast.success('Badge created successfully!');
      }
      handleCloseModal();
    } catch (err: any) {
      console.error('Failed to save badge:', err);
      const errorMessage = err?.details?.message || err?.message || 'Failed to save badge. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBadge = async (id: number, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Badge',
      message: `Are you sure you want to delete the badge "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Badge',
      cancelText: 'Keep Badge',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await productBadgesService.deleteProductBadge(id);
        setBadges(prev => prev.filter(b => b.id !== id));
        toast.success('Badge deleted successfully!');
      } catch (err) {
        console.error('Failed to delete badge:', err);
        toast.error('Failed to delete badge.');
      }
    }
  };

  const handleToggleStatus = async (badge: ProductBadge) => {
    const newStatus = !badge.status;
    try {
      const updated = await productBadgesService.updateProductBadge(badge.id, {
        status: newStatus,
      });
      setBadges(prev => prev.map(b => (b.id === badge.id ? updated : b)));
      toast.success('Badge status updated successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update badge status.');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setBadgeName(name);
    // Auto-generate slug if it's a new badge or slug matches previous auto-gen
    const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setBadgeSlug(newSlug);
  };

  // Filter and sort badges list
  const filteredBadges = useMemo(() => {
    const filtered = badges.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           b.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && b.status) ||
        (statusFilter === 'inactive' && !b.status);
      return matchesSearch && matchesStatus;
    });
    return filtered.sort((a, b) => {
      const prioA = a.priority ?? 0;
      const prioB = b.priority ?? 0;
      if (prioB !== prioA) return prioB - prioA;
      return a.name.localeCompare(b.name);
    });
  }, [badges, searchQuery, statusFilter]);

  // Pagination calculations
  const totalItems = filteredBadges.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBadges = filteredBadges.slice(indexOfFirstItem, indexOfLastItem);

  const columns: HelperTableColumn[] = [
    { key: 'sl', label: 'SL', align: 'left', className: 'w-16' },
    { key: 'name', label: 'Badge Name', align: 'left', className: 'w-[20%]' },
    { key: 'preview', label: 'Preview', align: 'left', className: 'w-[20%]' },
    { key: 'slug', label: 'Slug', align: 'left', className: 'w-[20%]' },
    { key: 'priority', label: 'Priority', align: 'left', className: 'w-[10%]' },
    { key: 'status', label: 'Status', align: 'center', className: 'w-[10%]' },
    { key: 'action', label: 'Action', align: 'center', className: 'w-[15%]' }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-left">
      {/* Badge Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-805 tracking-tight flex items-center space-x-2">
            <FiTag className="text-[#0f53a1] w-6 h-6" />
            <span>Product Badges</span>
          </h2>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-slate-100 rounded-[5px] p-4 shadow-xs animate-slide-up flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Filter by Status:
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
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

      <HelperTable<ProductBadge>
        columns={columns}
        data={currentBadges}
        loading={loading}
        title="Badge list"
        count={totalItems}
        searchPlaceholder="Search by badge name or slug"
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
                title: 'Delete Multiple Badges',
                message: `Are you sure you want to delete the ${ids.length} selected badges? This action cannot be undone.`,
                confirmText: 'Delete Badges',
                cancelText: 'Cancel',
                type: 'danger'
              });
              if (confirmed) {
                try {
                  await Promise.all(ids.map(id => productBadgesService.deleteProductBadge(id)));
                  setBadges(prev => prev.filter(b => !ids.includes(b.id)));
                  setSelectedIds([]);
                  toast.success('Successfully deleted selected badges!');
                  window.dispatchEvent(new CustomEvent('data_updated'));
                  new BroadcastChannel('data_updates').postMessage('refresh');
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to delete some badges.');
                }
              }
            }
          }
        ]}
        filterButton={{
          label: 'Filter',
          onClick: () => setShowFilters(p => !p)
        }}
        addButton={{
          label: 'Add New',
          onClick: handleOpenCreateModal
        }}
        renderRow={(badge, index) => {
          const sl = indexOfFirstItem + index + 1;
          return (
            <tr key={badge.id} className="hover:bg-slate-50/40 transition-colors">
              <td className="py-3.5 px-5 text-left font-bold text-slate-800">{sl}</td>

              {/* Badge Name Column */}
              <td className="py-3.5 px-5">
                <div className="font-extrabold text-slate-800 text-sm leading-snug">{badge.name}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">ID #{badge.id}</div>
              </td>

              {/* Preview Column */}
              <td className="py-3.5 px-5 text-left">
                <span 
                  className="px-2.5 py-1 rounded-[4px] text-[10px] font-bold shadow-sm"
                  style={{ backgroundColor: badge.background_color, color: badge.text_color }}
                >
                  {badge.name}
                </span>
              </td>

              {/* Slug Column */}
              <td className="py-3.5 px-5 text-left text-slate-500 font-medium text-sm">
                {badge.slug}
              </td>

              {/* Priority Column */}
              <td className="py-3.5 px-5 text-left font-bold text-slate-700 text-sm">
                {badge.priority ?? 0}
              </td>

              {/* Status Switch Toggle */}
              <td className="py-3.5 px-5 text-center">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(badge)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mx-auto ${badge.status ? 'bg-[#0f53a1] shadow-2xs' : 'bg-slate-200'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${badge.status ? 'translate-x-4' : 'translate-x-0'
                      }`}
                  />
                </button>
              </td>

              {/* Action Buttons */}
              <td className="py-3.5 px-5 text-center">
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => handleOpenPreviewModal(badge)}
                    className="w-8 h-8 border border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer"
                    title="View Badge"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(badge)}
                    className="w-8 h-8 border border-blue-500/50 text-blue-500 hover:bg-blue-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer"
                    title="Edit Badge"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBadge(badge.id, badge.name)}
                    className="w-8 h-8 border border-red-500/50 text-red-500 hover:bg-red-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete Badge"
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
          localStorage.setItem('itemsPerPage_product_badges', size.toString());
          setCurrentPage(1);
        }}
        emptyStateText="No Records Found"
        emptyStateSubtext="Add a product badge to populate this table."
      />

      {/* Create / Edit Modal Backdrop */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 animate-fade-in">
          <div className="absolute inset-0 cursor-default" onClick={handleCloseModal}></div>

          <div className="w-full max-w-lg bg-white rounded-[5px] p-6 sm:p-8 relative z-10 border border-slate-100 shadow-2xl animate-slide-up">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[5px] p-2 transition-all cursor-pointer"
            >
              <FiX className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <FiTag className="text-[#0f53a1] w-5 h-5" />
                <span>
                  {editingBadge ? 'Modify Badge' : 'Create Badge'}
                </span>
              </h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                Customize colors and labels for product highlights.
              </p>
            </div>

            <form onSubmit={handleSaveBadge} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  Badge Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={badgeName}
                  onChange={handleNameChange}
                  placeholder="e.g. New Arrival, Sale"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={badgeSlug}
                  onChange={(e) => setBadgeSlug(e.target.value)}
                  placeholder="e.g. new-arrival"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 border border-slate-200 rounded-[5px] cursor-pointer p-0 bg-transparent shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-[4px] [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-[4px]"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-[5px] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-10 h-10 border border-slate-200 rounded-[5px] cursor-pointer p-0 bg-transparent shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-[4px] [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-[4px]"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-[5px] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-[5px] text-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Live Preview</label>
                <span 
                  className="px-4 py-1.5 rounded-[5px] text-sm font-bold shadow-sm"
                  style={{ backgroundColor: backgroundColor, color: textColor }}
                >
                  {badgeName || 'Badge Preview'}
                </span>
              </div>

              {/* Priority Input */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  Priority
                </label>
                <input
                  type="number"
                  min="0"
                  value={badgePriority}
                  onChange={(e) => setBadgePriority(Number(e.target.value))}
                  placeholder="e.g. 0"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  Publishing Status
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setBadgeStatus(true)}
                    className={`flex-1 py-2 px-2 border rounded-[5px] text-[10px] font-extrabold flex items-center justify-center space-x-1 transition-all ${badgeStatus
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-500'
                      }`}
                  >
                    <FiCheck className="w-3 h-3 stroke-[3]" />
                    <span>Active</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBadgeStatus(false)}
                    className={`flex-1 py-2 px-2 border rounded-[5px] text-[10px] font-extrabold flex items-center justify-center space-x-1 transition-all ${!badgeStatus
                      ? 'bg-slate-100 border-slate-400 text-slate-700'
                      : 'bg-white border-slate-200 text-slate-500'
                      }`}
                  >
                    <FiX className="w-3 h-3 stroke-[3]" />
                    <span>Inactive</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-sm font-bold transition-all border border-slate-200/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-[#0f53a1] hover:bg-[#0b4789] text-white rounded-[5px] text-sm font-bold transition-all shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Preview Modal */}
      {isPreviewOpen && previewBadge && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 animate-fade-in">
          <div className="absolute inset-0 cursor-default" onClick={() => setIsPreviewOpen(false)}></div>
          <div className="w-full max-w-sm bg-white rounded-[5px] p-6 text-center relative z-10 border border-slate-100 shadow-2xl animate-slide-up">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[5px] p-2 transition-all"
            >
              <FiX className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="mb-6 pt-4">
              <span 
                className="px-6 py-2.5 rounded-[5px] text-lg font-bold shadow-md inline-block mb-4"
                style={{ backgroundColor: previewBadge.background_color, color: previewBadge.text_color }}
              >
                {previewBadge.name}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">{previewBadge.name}</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">Slug: {previewBadge.slug}</p>
            </div>

            <div className="space-y-3 text-left bg-slate-50 p-4 rounded-[5px] text-sm mb-6">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">Badge ID</span>
                <span className="text-slate-800 font-extrabold">#{previewBadge.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">Text Color</span>
                <span className="text-slate-800 font-mono font-bold uppercase">{previewBadge.text_color}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">Background</span>
                <span className="text-slate-800 font-mono font-bold uppercase">{previewBadge.background_color}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">Priority</span>
                <span className="text-slate-800 font-extrabold">{previewBadge.priority ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Status</span>
                <span className={`font-bold ${previewBadge.status ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {previewBadge.status ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsPreviewOpen(false)}
              className="w-full py-2.5 bg-[#0f53a1] text-white rounded-[5px] text-sm font-bold shadow-xs hover:bg-[#0b4789] transition-all"
            >
              Close Preview
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

