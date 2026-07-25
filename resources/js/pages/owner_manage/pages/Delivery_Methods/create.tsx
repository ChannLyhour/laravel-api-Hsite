import React, { useState, useEffect } from 'react';
import { FiTruck, FiUpload, FiX, FiSliders, FiImage, FiInfo } from 'react-icons/fi';
import { deliveryMethodsService, type DeliveryMethod } from '@/api/owner/deliveryMethods';
import { deliveryZonesService, type DeliveryZone } from '@/api/owner/deliveryZones';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';
import { PageHeader } from '@/pages/owner_manage/helper/PageHeader';
import { FormActions } from '@/pages/owner_manage/helper/FormActions';

interface DeliveryMethodCreatePageProps {
  onClose: () => void;
  onSave: (method: DeliveryMethod) => void;
}

export const DeliveryMethodCreatePage: React.FC<DeliveryMethodCreatePageProps> = ({
  onClose,
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
    delivery_zone_id: '',
  });
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);

  useEffect(() => {
    const loadZones = async () => {
      try {
        setLoadingZones(true);
        const data = await deliveryZonesService.getMyDeliveryZones();
        setDeliveryZones(data || []);
      } catch (err) {
        console.error('Failed to fetch delivery zones:', err);
      } finally {
        setLoadingZones(false);
      }
    };
    loadZones();
  }, []);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      data.append('name', formData.name);
      data.append('code', formData.code.toLowerCase().replace(/\s+/g, '-'));
      data.append('description', formData.description);
      data.append('cost', formData.cost);
      data.append('estimated_days_min', String(formData.estimated_days_min));
      data.append('estimated_days_max', String(formData.estimated_days_max));
      data.append('is_active', formData.is_active ? '1' : '0');
      if (formData.delivery_zone_id) {
        data.append('delivery_zone_id', formData.delivery_zone_id);
      } else {
        data.append('delivery_zone_id', 'null');
      }
      if (imageFile) {
        data.append('image', imageFile);
      }

      const created = await deliveryMethodsService.createDeliveryMethod(data);
      toast.success(`Delivery method "${created.name}" added!`);
      onSave(created);
      onClose();
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        toast.error(err.details.message || 'Failed to save delivery method.');
      } else {
        toast.error('Failed to save delivery method.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 pb-10 w-full text-left">
      {/* ── HEADER NAVIGATION ─────────────────────────────── */}
      <PageHeader
        title="Add New Delivery Method"
        subtitle="Create a shipping/delivery profile for your customers at checkout."
        onClose={onClose}
        backTitle="Back to delivery methods list"
      />

      {/* ── FORM CONTAINER ────────────────────────────────── */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left Column: General Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <GroupDiv className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-855 flex items-center gap-1.5">
                <FiTruck className="text-orange-500" />
                <span>Method Configuration</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Configure primary delivery details and geographical restrictions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Method Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Express Delivery"
                  className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-800 bg-white"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Method Code / Slug</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="e.g. express"
                  className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 block">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Get your order in 1 to 2 hours with our express motor delivery."
                rows={3}
                className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-800 bg-white resize-none"
              />
            </div>

            {/* Restrict to Delivery Zone */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 block">
                Restrict to Delivery Zone <span className="text-slate-400 font-medium">(Optional)</span>
              </label>
              <select
                value={formData.delivery_zone_id}
                onChange={e => setFormData(prev => ({ ...prev, delivery_zone_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-800 bg-white cursor-pointer"
              >
                <option value="">All Zones / Nationwide (Global)</option>
                {deliveryZones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.code})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                If restricted, this delivery method will only be shown to customers residing in the selected zone during checkout.
              </p>
            </div>
          </GroupDiv>
        </div>

        {/* Right Column: Pricing, Timeline, Status & Image */}
        <div className="space-y-6">
          {/* Pricing & Timeline Card */}
          <GroupDiv className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-855 flex items-center gap-1.5">
                <FiSliders className="text-orange-500" />
                <span>Pricing & Timeline</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Set shipping fee and estimated days.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Delivery Cost ($)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.cost}
                  onChange={e => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-700 block">Min Est. Days</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.estimated_days_min}
                    onChange={e => setFormData(prev => ({ ...prev, estimated_days_min: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-800 bg-white"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-700 block">Max Est. Days</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.estimated_days_max}
                    onChange={e => setFormData(prev => ({ ...prev, estimated_days_max: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>
          </GroupDiv>

          {/* Image & Icon Upload Card */}
          <GroupDiv className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-855 flex items-center gap-1.5">
                <FiImage className="text-orange-500" />
                <span>Image or Icon</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Upload a custom branding image or icon.
              </p>
            </div>

            {imagePreview ? (
              <div className="flex flex-col items-center justify-center p-4 bg-black/[0.02] border border-dashed rounded-[8px] space-y-3 relative">
                <div className="w-24 h-16 rounded-[4px] border border-black/10 bg-black/[0.03] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-1" />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-[5px] border border-slate-200 hover:border-rose-100 transition-all cursor-pointer flex items-center gap-1"
                >
                  <FiX className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Remove</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-[5px] cursor-pointer hover:bg-black/[0.02] transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUpload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-2xs font-bold text-slate-500">
                      <span>Click to upload</span> or drag
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1">PNG, JPG, SVG up to 2MB</p>
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
          </GroupDiv>

          {/* Active Status Card */}
          <GroupDiv className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-855 flex items-center gap-1.5">
                <FiInfo className="text-orange-500" />
                <span>Status Settings</span>
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-left">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 accent-orange-600 cursor-pointer"
              />
              <label htmlFor="is_active" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                Activate this delivery method (visible to customers at checkout)
              </label>
            </div>
          </GroupDiv>
        </div>

        {/* Action buttons */}
        <FormActions
          onCancel={onClose}
          saving={saving}
          submitLabel="Add Method"
          disabled={!formData.name.trim() || !formData.code.trim()}
          className="lg:col-span-3"
        />
      </form>
    </div>
  );
};
