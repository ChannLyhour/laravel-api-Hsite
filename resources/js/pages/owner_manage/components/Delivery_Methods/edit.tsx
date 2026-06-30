import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiTruck, FiUpload, FiX } from 'react-icons/fi';
import { deliveryMethodsService, type DeliveryMethod } from '@/api/owner/deliveryMethods';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';

interface DeliveryMethodEditPageProps {
  onClose: () => void;
  method: DeliveryMethod;
  onSave: (method: DeliveryMethod) => void;
}

export const DeliveryMethodEditPage: React.FC<DeliveryMethodEditPageProps> = ({
  onClose,
  method,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    cost: '0.00',
    estimated_days_min: 1,
    estimated_days_max: 3,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (method) {
      setFormData({
        name: method.name || '',
        code: method.code || '',
        description: method.description || '',
        cost: String(method.cost || '0.00'),
        estimated_days_min: method.estimated_days_min || 1,
        estimated_days_max: method.estimated_days_max || 3,
        is_active: method.is_active,
      });
      if (method.image) {
        setImagePreview(resolveImageUrl(method.image));
      } else {
        setImagePreview(null);
      }
    }
  }, [method]);

  if (!method) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    if (Number(formData.estimated_days_min) > Number(formData.estimated_days_max)) {
      toast.error('Minimum estimated days cannot be greater than maximum.');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('_method', 'PUT'); // Match Laravel putFormData route handling
      data.append('name', formData.name);
      data.append('code', formData.code.toLowerCase().replace(/\s+/g, '-'));
      data.append('description', formData.description);
      data.append('cost', formData.cost);
      data.append('estimated_days_min', String(formData.estimated_days_min));
      data.append('estimated_days_max', String(formData.estimated_days_max));
      data.append('is_active', formData.is_active ? '1' : '0');
      
      if (imageFile) {
        data.append('image', imageFile);
      } else if (!imagePreview) {
        // If image was removed
        data.append('image', '');
      }

      const updated = await deliveryMethodsService.updateDeliveryMethod(method.id, data);
      toast.success(`Delivery method "${updated.name}" updated!`);
      onSave(updated);
      onClose();
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        toast.error(err.details.message || 'Failed to update delivery method.');
      } else {
        toast.error('Failed to update delivery method.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 pb-10 w-full">
      {/* ── HEADER NAVIGATION ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 border border-slate-200 rounded-[5px] hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-2xs"
            title="Back to delivery methods list"
          >
            <FiArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <FiTruck className="text-primary" />
              <span>Edit Delivery Method</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Modify details or update the pricing and estimated days for this delivery option.
            </p>
          </div>
        </div>
      </div>

      {/* ── FORM CONTAINER ────────────────────────────────── */}
      <div className="max-w-2xl bg-white rounded-[5px] border border-slate-100 shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Method Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Express Delivery"
                className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Method Code / Slug <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="e.g. express"
                className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g. Get your order in 1 to 2 hours with our express motor delivery."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Delivery Cost ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.cost}
                onChange={e => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Min Est. Days</label>
              <input
                type="number"
                min="0"
                required
                value={formData.estimated_days_min}
                onChange={e => setFormData(prev => ({ ...prev, estimated_days_min: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Max Est. Days</label>
              <input
                type="number"
                min="0"
                required
                value={formData.estimated_days_max}
                onChange={e => setFormData(prev => ({ ...prev, estimated_days_max: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Image or Icon</label>
            {imagePreview ? (
              <div className="relative w-32 h-32 rounded-[8px] overflow-hidden border border-slate-200 shadow-2xs group animate-fade-in">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-sm cursor-pointer border-none"
                  title="Remove image"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full animate-fade-in">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-[5px] cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUpload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-2xs font-bold text-slate-500">
                      <span>Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, SVG up to 2MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Active status */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="is_active" className="text-xs font-bold text-slate-750 cursor-pointer select-none">
              Activate this delivery method (visible to customers at checkout)
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-xs font-bold transition-all border border-slate-200/50 cursor-pointer min-w-[100px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name.trim() || !formData.code.trim()}
              className="py-2.5 px-6 bg-primary hover:bg-primary-hover text-white rounded-[5px] text-xs font-black transition-all flex items-center justify-center space-x-1.5 border-none cursor-pointer disabled:opacity-50 select-none min-w-[140px]"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Method</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
