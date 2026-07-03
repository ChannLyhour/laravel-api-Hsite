import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiMapPin } from 'react-icons/fi';
import { deliveryZonesService, type DeliveryZone } from '@/api/owner/deliveryZones';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';

interface DeliveryZoneEditPageProps {
  onClose: () => void;
  zone: DeliveryZone;
  onSave: (zone: DeliveryZone) => void;
}

export const DeliveryZoneEditPage: React.FC<DeliveryZoneEditPageProps> = ({
  onClose,
  zone,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'radius',
    center_lat: '',
    center_lng: '',
    radius_km: '',
    polygon_coordinates: '',
    delivery_fee: '0.00',
    estimated_delivery_time: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name || '',
        code: zone.code || '',
        description: zone.description || '',
        type: zone.type || 'radius',
        center_lat: zone.center_lat ? String(zone.center_lat) : '',
        center_lng: zone.center_lng ? String(zone.center_lng) : '',
        radius_km: zone.radius_km ? String(zone.radius_km) : '',
        polygon_coordinates: zone.polygon_coordinates || '',
        delivery_fee: String(zone.delivery_fee || '0.00'),
        estimated_delivery_time: zone.estimated_delivery_time || '',
        is_active: zone.is_active,
      });
    }
  }, [zone]);

  if (!zone) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Name and Code are required.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<DeliveryZone> = {
        name: formData.name,
        code: formData.code.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        type: formData.type as 'radius' | 'polygon',
        center_lat: formData.center_lat ? parseFloat(formData.center_lat) : null,
        center_lng: formData.center_lng ? parseFloat(formData.center_lng) : null,
        radius_km: formData.radius_km ? parseFloat(formData.radius_km) : null,
        polygon_coordinates: formData.polygon_coordinates || null,
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        estimated_delivery_time: formData.estimated_delivery_time,
        is_active: formData.is_active,
      };

      const updated = await deliveryZonesService.updateDeliveryZone(zone.id, payload);
      toast.success(`Delivery zone "${updated.name}" updated!`);
      onSave(updated);
      onClose();
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        toast.error(err.details.message || 'Failed to save delivery zone.');
      } else {
        toast.error('Failed to save delivery zone.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 pb-10 w-full text-left">
      {/* ── HEADER NAVIGATION ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 border border-slate-200 rounded-[5px] hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-2xs"
            title="Back to delivery zones list"
          >
            <FiArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <FiMapPin className="text-primary" />
              <span>Modify Delivery Zone</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Edit regional pricing and estimated timelines.
            </p>
          </div>
        </div>
      </div>

      {/* ── FORM CONTAINER ────────────────────────────────── */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">
              Zone Details
            </h3>

            {/* Zone Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Zone Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Phnom Penh, Siem Reap"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-350 focus:outline-none focus:border-primary bg-white"
                required
              />
            </div>

            {/* Zone Code */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Zone Code / Shortcode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., PP-ZONE"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-350 focus:outline-none focus:border-primary bg-white"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe which regions or provinces are covered by this zone..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-350 focus:outline-none focus:border-primary bg-white resize-none"
              />
            </div>

            {/* Zone Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Zone Type
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary bg-white cursor-pointer"
              >
                <option value="radius">Radius-based coverage</option>
                <option value="polygon">Custom geographical polygon</option>
              </select>
            </div>

            {formData.type === 'radius' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    Center Latitude
                  </label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={formData.center_lat}
                    onChange={e => setFormData({ ...formData, center_lat: e.target.value })}
                    placeholder="e.g., 11.5564"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-350 focus:outline-none focus:border-primary bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    Center Longitude
                  </label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={formData.center_lng}
                    onChange={e => setFormData({ ...formData, center_lng: e.target.value })}
                    placeholder="e.g., 104.9282"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-350 focus:outline-none focus:border-primary bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    Radius (KM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.radius_km}
                    onChange={e => setFormData({ ...formData, radius_km: e.target.value })}
                    placeholder="e.g., 5.00"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-350 focus:outline-none focus:border-primary bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                  Polygon Coordinates (WKT String)
                </label>
                <textarea
                  value={formData.polygon_coordinates}
                  onChange={e => setFormData({ ...formData, polygon_coordinates: e.target.value })}
                  placeholder="e.g., POLYGON((104.9 11.5, 105.0 11.5, 105.0 11.6, 104.9 11.6, 104.9 11.5))"
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-350 focus:outline-none focus:border-primary bg-white resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">
              Fee & Schedule
            </h3>

            {/* Delivery Fee */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Delivery Fee (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-sans font-bold text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.delivery_fee}
                  onChange={e => setFormData({ ...formData, delivery_fee: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                  required
                />
              </div>
            </div>

            {/* Estimated Delivery Time */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Estimated Delivery Time
              </label>
              <input
                type="text"
                value={formData.estimated_delivery_time}
                onChange={e => setFormData({ ...formData, estimated_delivery_time: e.target.value })}
                placeholder="e.g., 24 Hours, 1-2 Days"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-350 focus:outline-none focus:border-primary bg-white"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  Status Active
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle to enable/disable this zone.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl border-none cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3.5 bg-primary hover:bg-primary-hover active:scale-98 text-white font-black text-xs uppercase tracking-widest rounded-xl border-none cursor-pointer transition-all shadow-md disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
