import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from '@/pages/owner_manage/utils/toast';
import {
  FiZap, FiX, FiImage, FiLoader, FiCheck, FiShoppingBag, FiPlus,
  FiBox, FiChevronDown, FiSearch, FiAlertTriangle, FiArrowLeft, FiTrash2,
  FiRefreshCw, FiEdit,
} from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';
import { flashDealsService, type FlashDealRow } from '@/api/owner/flashDeals';
import { menuItemsService, categoriesService, type MenuItem, type Category } from '@/api/owner/categories';
import { HelperTable, type HelperTableColumn } from '@/pages/owner_manage/helper/HelperTable';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';

// Helper date format functions used by FlashDeals
function formatDateFlash(raw: string) {
  if (!raw) return '—';
  const clean = raw.replace('T', ' ');
  return clean.slice(0, 16);
}

// ─────────────────────────────────────────────────────────────────────────────
// Flash Deal Modals
// ─────────────────────────────────────────────────────────────────────────────
interface FlashDealModalProps {
  deal: FlashDealRow | null;
  onClose: () => void;
  onSaved: (saved: FlashDealRow) => void;
}

const FlashDealModal: React.FC<FlashDealModalProps> = ({ deal, onClose, onSaved }) => {
  const [title, setTitle] = useState(deal?.title || '');
  const [startDate, setStartDate] = useState(deal?.start_date ? deal.start_date.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(deal?.end_date ? deal.end_date.slice(0, 10) : '');
  const [priority, setPriority] = useState(deal?.priority != null ? String(deal.priority) : '0');
  const [isPublished, setIsPublished] = useState(deal?.is_published ?? false);
  const [metaTitle, setMetaTitle] = useState(deal?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(deal?.meta_description || '');

  // Images
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(deal?.image || null);
  const [metaImageFile, setMetaImageFile] = useState<File | null>(null);
  const [metaImagePreview, setMetaImagePreview] = useState<string | null>(deal?.meta_image || null);

  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const metaFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isMeta: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.');
        return;
      }
      if (isMeta) {
        setMetaImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setMetaImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      toast.error('Title, Start Date and End Date are required.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('start_date', startDate);
      fd.append('end_date', endDate);
      fd.append('is_published', isPublished ? '1' : '0');
      fd.append('priority', priority);
      if (metaTitle) fd.append('meta_title', metaTitle);
      if (metaDescription) fd.append('meta_description', metaDescription);

      if (imageFile) {
        fd.append('image', imageFile);
      }
      if (metaImageFile) {
        fd.append('meta_image', metaImageFile);
      }

      let saved: FlashDealRow;
      if (deal) {
        saved = await flashDealsService.updateFlashDeal(deal.id, fd);
        toast.success('Flash deal updated successfully!');
      } else {
        saved = await flashDealsService.createFlashDeal(fd);
        toast.success('Flash deal created successfully!');
      }
      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to save flash deal.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white';
  const labelCls = 'block text-xs font-bold text-slate-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs animate-fade-in overflow-y-auto py-10">
      <div className="bg-white rounded-[8px] shadow-2xl w-full max-w-2xl mx-4 my-auto overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FiZap className="text-orange-500 w-4 h-4" />
            <span>{deal ? 'Edit Flash Deal Details' : 'Create Flash Deal'}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={labelCls}>Flash Deal Title *</label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Summer Mega Sale" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>End Date *</label>
              <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <input type="number" className={inputCls} value={priority} onChange={e => setPriority(e.target.value)} placeholder="0" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pt-2">
                <label className="text-xs font-bold text-slate-700">Publish Immediately</label>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-50" />
                </label>
              </div>

              <div>
                <label className={labelCls}>Meta Title (Optional)</label>
                <input className={inputCls} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="SEO Meta Title" />
              </div>

              <div>
                <label className={labelCls}>Meta Description (Optional)</label>
                <textarea rows={3} className={`${inputCls} resize-none`} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="SEO Meta Description..." />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Banner Image</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-[5px] h-28 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all p-2 relative overflow-hidden">
                  <input type="file" ref={fileInputRef} onChange={e => handleFileChange(e, false)} accept="image/*" className="hidden" />
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Banner Preview" className="w-full h-full object-cover rounded-[3px]" />
                      <button type="button" onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors border-none"><FiX className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <FiImage className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-500">Upload Banner File</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Meta Image</label>
                <div onClick={() => metaFileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-[5px] h-28 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all p-2 relative overflow-hidden">
                  <input type="file" ref={metaFileInputRef} onChange={e => handleFileChange(e, true)} accept="image/*" className="hidden" />
                  {metaImagePreview ? (
                    <>
                      <img src={metaImagePreview} alt="Meta Preview" className="w-full h-full object-cover rounded-[3px]" />
                      <button type="button" onClick={e => { e.stopPropagation(); setMetaImageFile(null); setMetaImagePreview(null); if (metaFileInputRef.current) metaFileInputRef.current.value = ''; }} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors border-none"><FiX className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <FiImage className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-500">Upload Meta Image File</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[5px] border-none cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5 shadow-xs">
              {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
              {deal ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ManageProductsModalProps {
  deal: FlashDealRow;
  products: MenuItem[];
  onClose: () => void;
  onUpdated: (updated: FlashDealRow) => void;
}

const ManageProductsModal: React.FC<ManageProductsModalProps> = ({ deal, products, onClose, onUpdated }) => {
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const associatedIds = new Set((deal.products || []).map(p => p.id));

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleProduct = async (productId: number, currentlyAssociated: boolean) => {
    setTogglingId(productId);
    try {
      let updated: FlashDealRow;
      if (currentlyAssociated) {
        updated = await flashDealsService.removeProduct(deal.id, productId);
        toast.success('Product removed from flash deal!');
      } else {
        updated = await flashDealsService.addProducts(deal.id, [productId]);
        toast.success('Product added to flash deal!');
      }
      onUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to update product association.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs animate-fade-in py-10">
      <div className="bg-white rounded-[8px] shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50/80 to-white">
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FiShoppingBag className="text-orange-500 w-4 h-4 animate-bounce" />
            <span>Manage Products — {deal.title}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-50 shrink-0">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full px-3.5 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredProducts.length === 0 ? (
            <p className="text-center text-xs font-bold text-slate-400 py-6">No products found.</p>
          ) : (
            filteredProducts.map(p => {
              const isAssociated = associatedIds.has(p.id);
              const isToggling = togglingId === p.id;
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-[5px] border border-slate-100 hover:bg-slate-50/55 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                      {p.display_image ? (
                        <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><FiImage className="w-4 h-4 text-slate-350" /></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">{p.name}</h4>
                      <p className="text-[10px] text-slate-450 font-bold">${Number(p.price).toFixed(2)}</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    {isToggling ? (
                      <FiLoader className="w-4 h-4 text-orange-500 animate-spin" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={isAssociated}
                        onChange={() => handleToggleProduct(p.id, isAssociated)}
                        className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                      />
                    )}
                  </label>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-[5px] text-xs font-extrabold border-none cursor-pointer transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface AddProductPageViewProps {
  deal: FlashDealRow;
  products: MenuItem[];
  categories: Category[];
  onBack: () => void;
  onUpdated: (updated: FlashDealRow) => void;
}

const AddProductPageView: React.FC<AddProductPageViewProps> = ({ deal, products, categories, onBack, onUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [_loading, setLoading] = useState(false);
  const [activeDeal, setActiveDeal] = useState<FlashDealRow>(deal);

  const [selectedMainCatId, setSelectedMainCatId] = useState<number | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<number | null>(null);
  const [selectedSubSubCatId, setSelectedSubSubCatId] = useState<number | null>(null);

  const mainCategories = useMemo(() => {
    return categories.filter(c => !c.parent_id);
  }, [categories]);

  const subCategories = useMemo(() => {
    if (!selectedMainCatId) return [];
    return categories.filter(c => c.parent_id === selectedMainCatId);
  }, [categories, selectedMainCatId]);

  const subSubCategories = useMemo(() => {
    if (!selectedSubCatId) return [];
    return categories.filter(c => c.parent_id === selectedSubCatId);
  }, [categories, selectedSubCatId]);

  const shopName = (() => {
    try {
      const local = localStorage.getItem('store_settings');
      if (local) {
        return JSON.parse(local).store_name || '6valley CMS';
      }
    } catch (e) { }
    return '6valley CMS';
  })();

  const getCategoryName = (catId: number) => {
    const found = categories.find(c => c.id === catId);
    return found ? found.name : "Women's Fashion";
  };

  const associatedIds = new Set((activeDeal.products || []).map(p => p.id));

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedSubSubCatId) {
      return p.category_id === selectedSubSubCatId;
    }
    if (selectedSubCatId) {
      const isDirectMatch = p.category_id === selectedSubCatId;
      const isChildMatch = categories.some(c => c.parent_id === selectedSubCatId && c.id === p.category_id);
      return isDirectMatch || isChildMatch;
    }
    if (selectedMainCatId) {
      const getDescendantIds = (catId: number): number[] => {
        const children = categories.filter(c => c.parent_id === catId);
        let ids = [catId];
        children.forEach(child => {
          ids = [...ids, ...getDescendantIds(child.id)];
        });
        return ids;
      };
      const allowedIds = getDescendantIds(selectedMainCatId);
      return p.category_id && allowedIds.includes(p.category_id);
    }
    return true;
  });

  const handleToggleProduct = async (productId: number, currentlyAssociated: boolean) => {
    setLoading(true);
    try {
      let updated: FlashDealRow;
      if (currentlyAssociated) {
        updated = await flashDealsService.removeProduct(activeDeal.id, productId);
        toast.success('Product removed from flash deal!');
      } else {
        updated = await flashDealsService.addProducts(activeDeal.id, [productId]);
        toast.success('Product added to flash deal!');
      }
      setActiveDeal(updated);
      onUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to update product association.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border-none cursor-pointer flex items-center justify-center shrink-0"
          title="Back to Flash Deals List"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <FiBox className="text-orange-500 w-5 h-5" />
          <span>Add New Product</span>
        </h3>
      </div>

      <div className="bg-white border border-slate-100 p-6 rounded-[5px] shadow-xs space-y-4 relative">
        <div className="border-b border-slate-50 pb-4">
          <h4 className="text-sm font-black text-slate-800 tracking-tight">Flash Deal</h4>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Select products</label>

          {isOpen && (
            <div className="fixed inset-0 z-20 cursor-default" onClick={() => {
              setIsOpen(false);
              setSelectedMainCatId(null);
              setSelectedSubCatId(null);
              setSelectedSubSubCatId(null);
            }} />
          )}

          <div className="relative w-full">
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                if (isOpen) {
                  setSelectedMainCatId(null);
                  setSelectedSubCatId(null);
                  setSelectedSubSubCatId(null);
                }
              }}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white flex items-center justify-between cursor-pointer"
            >
              <span className="text-slate-500 font-semibold">Select products</span>
              <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-[5px] shadow-lg z-30 flex flex-col max-h-[350px]">
                <div className="p-3 border-b border-slate-100 flex items-center relative">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by product name..."
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white"
                    autoFocus
                  />
                  <FiSearch className="absolute right-6 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="px-3 pb-3 border-b border-slate-100 grid grid-cols-3 gap-2 shrink-0">
                  <select
                    value={selectedMainCatId || ''}
                    onChange={e => {
                      setSelectedMainCatId(e.target.value ? Number(e.target.value) : null);
                      setSelectedSubCatId(null);
                      setSelectedSubSubCatId(null);
                    }}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {mainCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSubCatId || ''}
                    onChange={e => {
                      setSelectedSubCatId(e.target.value ? Number(e.target.value) : null);
                      setSelectedSubSubCatId(null);
                    }}
                    disabled={!selectedMainCatId}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                  >
                    <option value="">All Sub</option>
                    {subCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSubSubCatId || ''}
                    onChange={e => {
                      setSelectedSubSubCatId(e.target.value ? Number(e.target.value) : null);
                    }}
                    disabled={!selectedSubCatId}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                  >
                    <option value="">All Sub Sub</option>
                    {subSubCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">All Products</span>
                </div>

                <div className="flex-1 overflow-y-auto py-1">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">No products found</div>
                  ) : (
                    filteredProducts.map(p => {
                      const isAlreadyAdded = associatedIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleProduct(p.id, isAlreadyAdded)}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-none ${isAlreadyAdded ? 'bg-orange-50/20 hover:bg-orange-50/40' : ''
                            }`}
                        >
                          <div className="w-12 h-12 rounded bg-slate-50 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.display_image ? (
                              <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <FiImage className="w-5 h-5 text-slate-350" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className={`text-xs font-bold text-slate-800 truncate ${isAlreadyAdded ? 'text-orange-600 font-extrabold' : ''}`}>
                                {p.name}
                              </h5>
                              {isAlreadyAdded && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] bg-orange-100 text-orange-600 font-black shrink-0">Added</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                              Price : ${Number(p.price).toFixed(2)} Category : {getCategoryName(p.category_id)} Brand : {p.brand?.name || 'UrbanEdge'} Shop : {shopName}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {(!activeDeal.products || activeDeal.products.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-slate-100 rounded-[5px] shadow-xs">
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-14 h-16 bg-slate-100 rounded-[4px] border border-slate-200 relative flex flex-col justify-between p-2 shadow-2xs">
                <div className="h-0.5 w-6 bg-slate-300 rounded" />
                <div className="h-0.5 w-8 bg-slate-300 rounded" />
                <div className="h-0.5 w-5 bg-slate-300 rounded" />
                <div className="h-0.5 w-7 bg-slate-300 rounded" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-xs">
                <FiAlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 tracking-tight">No product select yet</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[5px] shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 tracking-tight">Selected Products</h4>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                {activeDeal.products.length} {activeDeal.products.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-450 uppercase tracking-wider">
                    <th className="px-6 py-4 w-16">SL</th>
                    <th className="px-6 py-4">Product Info</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeDeal.products.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200/60 overflow-hidden shrink-0">
                            {p.display_image ? (
                              <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                <FiImage className="w-4 h-4 text-slate-350" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</h5>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{getCategoryName(p.category_id)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-700">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProduct(p.id, true)}
                            className="p-1.5 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 cursor-pointer transition-colors"
                            title="Remove Product"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface FlashDealsTabProps {
  ownerId?: number | string;
  storeId?: number;
}

export const FlashDealsTab: React.FC<FlashDealsTabProps> = ({ ownerId, storeId }) => {
  const [deals, setDeals] = useState<FlashDealRow[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDealForAddProduct, setSelectedDealForAddProduct] = useState<FlashDealRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<FlashDealRow | null>(null);
  const [productsTarget, setProductsTarget] = useState<FlashDealRow | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const FLASH_DEAL_COLUMNS: HelperTableColumn[] = [
    { key: 'sl', label: 'SL' },
    { key: 'title', label: 'Title' },
    { key: 'duration', label: 'Duration' },
    { key: 'priority', label: 'Priority', align: 'center' },
    { key: 'status', label: 'Status' },
    { key: 'active_products', label: 'Active Products', align: 'center' },
    { key: 'publish', label: 'Publish', align: 'center' },
    { key: 'action', label: 'Action', align: 'center' },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, prods, catsData] = await Promise.all([
        flashDealsService.getMyFlashDeals(0, 100, ownerId),
        menuItemsService.getMenuItems(200, 0, ownerId, storeId),
        categoriesService.getCategories(100, 0, ownerId, storeId),
      ]);
      setDeals(data || []);
      setProducts(prods || []);
      setCategories(catsData?.categories || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load flash deals.');
    } finally {
      setLoading(false);
    }
  }, [ownerId, storeId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = deals.filter(d =>
    !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const togglePublish = async (id: number) => {
    try {
      const updated = await flashDealsService.toggleFlashDeal(id);
      setDeals(prev => prev.map(d => d.id === id ? updated : d));
      toast.success('Flash deal status updated!');
    } catch {
      toast.error('Failed to update publish status.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    try {
      await flashDealsService.deleteFlashDeal(id);
      setDeals(prev => prev.filter(d => d.id !== id));
      toast.success('Flash deal deleted successfully.');
    } catch {
      toast.error('Failed to delete flash deal.');
    }
  };

  if (selectedDealForAddProduct) {
    return (
      <AddProductPageView
        deal={selectedDealForAddProduct}
        products={products}
        categories={categories}
        onBack={() => setSelectedDealForAddProduct(null)}
        onUpdated={updated => {
          setDeals(prev => prev.map(d => d.id === updated.id ? updated : d));
          setSelectedDealForAddProduct(updated);
        }}
      />
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    inactive: 'bg-slate-50 text-slate-500 border border-slate-200',
    expired: 'bg-rose-50 text-rose-600 border border-rose-100',
  };

  return (
    <>
      {showModal && (
        <FlashDealModal
          deal={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={saved => {
            setDeals(prev => {
              const idx = prev.findIndex(d => d.id === saved.id);
              if (idx !== -1) {
                return prev.map(d => d.id === saved.id ? saved : d);
              }
              return [saved, ...prev];
            });
          }}
        />
      )}

      {productsTarget && (
        <ManageProductsModal
          deal={productsTarget}
          products={products}
          onClose={() => setProductsTarget(null)}
          onUpdated={updated => {
            setDeals(prev => prev.map(d => d.id === updated.id ? updated : d));
            setProductsTarget(updated);
          }}
        />
      )}

      <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <FiZap className="text-orange-500 w-5 h-5" />
              <span>Flash Deals</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">Manage time-limited mega discounts for storewide events.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-500 border-none cursor-pointer transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { setEditTarget(null); setShowModal(true); }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold border-none cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add Flash Deal
            </button>
          </div>
        </div>

        <HelperTable<FlashDealRow>
          title="Flash Deals List"
          count={filtered.length}
          columns={FLASH_DEAL_COLUMNS}
          data={paginated}
          loading={loading}
          searchPlaceholder="Search by title…"
          searchValue={searchQuery}
          onSearchChange={v => { setSearchQuery(v); setCurrentPage(1); }}
          emptyStateText="No Flash Deals Found"
          emptyStateSubtext="Create a mega deal and add products to start selling."
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={size => { setItemsPerPage(size); setCurrentPage(1); }}
          renderRow={(deal, idx) => (
            <tr key={deal.id} className="hover:bg-slate-50/40 transition-colors">
              <td className="px-5 py-3.5 text-xs font-bold text-slate-400">
                {(currentPage - 1) * itemsPerPage + idx + 1}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-200/60 rounded-[5px] overflow-hidden shrink-0 flex items-center justify-center">
                    {deal.image ? (
                      <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                    ) : (
                      <FiZap className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 line-clamp-1">{deal.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Priority: {deal.priority}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span>{formatDateFlash(deal.start_date)}</span>
                  <span className="text-slate-350">→</span>
                  <span>{formatDateFlash(deal.end_date)}</span>
                </div>
              </td>
              <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-600">
                {deal.priority}
              </td>
              <td className="px-5 py-3.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColors[deal.status] || statusColors.inactive}`}>
                  {deal.status}
                </span>
              </td>
              <td className="px-5 py-3.5 text-center text-xs font-extrabold text-slate-800">
                {deal.active_products || 0}
              </td>
              <td className="px-5 py-3.5 text-center">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deal.is_published}
                    onChange={() => togglePublish(deal.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                </label>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedDealForAddProduct(deal)}
                    className="px-2.5 py-1.5 rounded-[5px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/50 cursor-pointer font-bold text-[10px] flex items-center gap-1 transition-colors"
                    title="Add Product"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> Product
                  </button>
                  <button
                    onClick={() => setProductsTarget(deal)}
                    className="p-1.5 rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60 cursor-pointer transition-colors"
                    title="Manage Products"
                  >
                    <FiShoppingBag className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setEditTarget(deal); setShowModal(true); }}
                    className="p-1.5 rounded-[5px] bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/50 cursor-pointer transition-colors"
                    title="Edit"
                  >
                    <FiEdit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(deal.id)}
                    className="p-1.5 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 cursor-pointer transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </div>
    </>
  );
};
