import React, { useState, useEffect, useRef } from 'react';
import { bannersService } from '@/api/owner/banners';
import { resolveImageUrl } from '@/api/imageUtils';
import type { BannerRow } from '@/api/owner/banners';
import { toast } from '@/pages/owner_manage/utils/toast';
import { FiLoader, FiEdit, FiTrash2, FiImage, FiSave, FiX } from 'react-icons/fi';
import { HelperTable } from '@/pages/owner_manage/helper/HelperTable';
import { useConfirm } from '@/components/ConfirmProvider';
import '@/pages/owner_manage/style/font.css';
import { ImageCropModal } from './ImageCropModal';
import { ButtonToggleStatus } from '../helper/buttonToggleStatus';

interface BannersTabProps {
  ownerId?: number | string;
}

export const BannersTab: React.FC<BannersTabProps> = () => {
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Crop states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [tempFileName, setTempFileName] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchValue, setSearchValue] = useState('');

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await bannersService.getMyBanners();
      setBanners(data || []);
    } catch (err) {
      console.error('Failed to load banners:', err);
      toast.error('Failed to load banners list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    setIsActive(true);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.');
        return;
      }
      // Validate size (original max 10MB to allow cropping high-res images)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB.');
        return;
      }
      setTempFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      // Clear value so selecting same file triggers change again
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId && !imageFile) {
      toast.error('Please upload a banner image.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('is_active', isActive ? '1' : '0');
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingId !== null) {
        await bannersService.updateBanner(editingId, formData);
        toast.success('Banner updated successfully!');
      } else {
        await bannersService.createBanner(formData);
        toast.success('Banner created successfully!');
      }

      window.dispatchEvent(new CustomEvent('data_updated'));
      new BroadcastChannel('data_updates').postMessage('refresh');
      handleReset();
      await loadBanners();
    } catch (err: any) {
      console.error('Failed to save banner:', err);
      toast.error(err?.details?.message || 'Failed to save banner.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (banner: BannerRow) => {
    setTitle(banner.title || '');
    setDescription(banner.description || '');
    setImagePreview(banner.image);
    setImageFile(null);
    setIsActive(banner.is_active);
    setEditingId(banner.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: number) => {
    const ok = await confirm({
      title: 'Delete Banner',
      message: 'Are you sure you want to permanently delete this banner? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!ok) return;

    try {
      await bannersService.deleteBanner(id);
      toast.success('Banner deleted!');
      window.dispatchEvent(new CustomEvent('data_updated'));
      new BroadcastChannel('data_updates').postMessage('refresh');
      await loadBanners();
    } catch (err) {
      console.error('Failed to delete banner:', err);
      toast.error('Failed to delete banner.');
    }
  };

  const handleToggleStatus = async (banner: BannerRow) => {
    try {
      // Optimistically update local state
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
      );
      await bannersService.toggleBanner(banner.id);
      toast.success('Banner visibility status updated.');
      window.dispatchEvent(new CustomEvent('data_updated'));
      new BroadcastChannel('data_updates').postMessage('refresh');
    } catch (err) {
      console.error('Failed to toggle banner status:', err);
      toast.error('Failed to update status.');
      // Revert state
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: banner.is_active } : b))
      );
    }
  };

  if (loading && banners.length === 0) {
    return (
      <div className="bg-white border border-slate-100 p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy">
        <FiLoader className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading banner setup...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <FiImage className="text-orange-500 w-5 h-5" />
            <span>Banner Setup</span>
          </h3>
          <p className="text-slate-400 text-xs mt-1">Configure banner advertisements and promotions shown on your public storefront homepage.</p>
        </div>
      </div>

      {/* Setup Form Card */}
      <div className="border p-6 rounded-[5px] shadow-xs space-y-6 custom-card-container">
        <div>
          <h4 className="text-sm font-black text-slate-800 tracking-tight">
            {editingId !== null ? 'Edit Banner Details' : 'Add New Promotional Banner'}
          </h4>
          <p className="text-slate-400 text-[11px] sm:text-xs mt-1">
            Fill in details and upload an image file. Ideal banners are rectangular (1200x400 pixels).
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Details */}
            <div className="lg:col-span-2 space-y-4">
              {/* Banner Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Banner Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Flash Summer Sale 2026"
                  className="w-full px-4 py-2.5 bg-transparent border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                />
              </div>

              {/* Banner Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter details about this promotional offer..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-transparent border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold resize-none"
                />
              </div>

              {/* Status Switch */}
              <div className="flex items-center space-x-3 pt-2">
                <label className="text-xs font-bold text-slate-700">Set as Active Banner</label>
                <ButtonToggleStatus
                  status={isActive}
                  onToggle={() => setIsActive(!isActive)}
                  className=""
                />
              </div>
            </div>

            {/* File Dropzone/Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Banner Image *</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-[5px] h-32 flex flex-col items-center justify-center cursor-pointer bg-black/[0.02] hover:bg-black/[0.04] transition-all p-2 relative overflow-hidden"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                {imagePreview ? (
                  <>
                    <img src={resolveImageUrl(imagePreview)} alt="Preview" className="w-full h-full object-cover rounded-[3px]" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors border-none"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-1">
                    <FiImage className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-[11px] font-black text-slate-500">Upload Banner File</p>
                    <p className="text-[10px] text-slate-400">JPG, PNG, WebP (Max 2MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2 bg-black/[0.04] hover:bg-black/[0.08] text-inherit rounded-[5px] text-xs font-extrabold transition-all cursor-pointer border border-black/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer disabled:opacity-60 border-none flex items-center space-x-1.5"
            >
              {submitting ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
              <span>{editingId !== null ? 'Update Banner' : 'Create Banner'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* List Card — powered by HelperTable */}
      {(() => {
        const filtered = banners.filter((b) =>
          !searchValue ||
          (b.title ?? '').toLowerCase().includes(searchValue.toLowerCase())
        );
        const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
        const paginated = filtered.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        );

        return (
          <HelperTable<BannerRow>
            title="Active Banner List"
            count={filtered.length}
            data={paginated}
            loading={false}
            columns={[
              { key: 'sl', label: 'Sl' },
              { key: 'image', label: 'Image' },
              { key: 'title', label: 'Banner Title' },
              { key: 'status', label: 'Status' },
              { key: 'action', label: 'Action', align: 'center' },
            ]}
            searchPlaceholder="Search banners..."
            searchValue={searchValue}
            onSearchChange={(val) => { setSearchValue(val); setCurrentPage(1); }}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
            emptyStateText="No Banners Found"
            emptyStateSubtext="No banners configured yet. Add a banner using the form above!"
            renderRow={(banner, index) => (
              <tr key={banner.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-5 py-4 text-slate-500 font-black text-xs">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="px-5 py-4">
                  <div className="w-28 h-12 rounded overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                    <img src={resolveImageUrl(banner.image)} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-700 font-semibold text-xs">
                  {banner.title ? banner.title : <span className="text-slate-400 font-normal italic">No Title Provided</span>}
                </td>
                <td className="px-5 py-4">
                  <ButtonToggleStatus
                    status={banner.is_active}
                    onToggle={() => handleToggleStatus(banner)}
                  />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleEditClick(banner)}
                      className="p-1.5 rounded-[5px] bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200/50 cursor-pointer"
                      title="Edit Banner"
                    >
                      <FiEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(banner.id)}
                      className="p-1.5 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-250/50 cursor-pointer"
                      title="Delete Banner"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        );
      })()}

      {isCropModalOpen && tempImageSrc && (
        <ImageCropModal
          imageSrc={tempImageSrc}
          fileName={tempFileName}
          onConfirm={(croppedFile) => {
            if (croppedFile.size > 2 * 1024 * 1024) {
              toast.error('Cropped image size exceeds 2MB limit.');
              return;
            }
            setImageFile(croppedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(croppedFile);
            setIsCropModalOpen(false);
            setTempImageSrc(null);
          }}
          onCancel={() => {
            setIsCropModalOpen(false);
            setTempImageSrc(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
        />
      )}
    </div>
  );
};

