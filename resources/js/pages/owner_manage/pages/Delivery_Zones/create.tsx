import React, { useState } from 'react';
import { FiMapPin, FiClock } from 'react-icons/fi';
import { deliveryZonesService, type DeliveryZone } from '@/api/owner/deliveryZones';
import { Store_setting } from '@/api/owner/stores';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';
import { PageHeader } from '@/pages/owner_manage/helper/PageHeader';
import { FormActions } from '@/pages/owner_manage/helper/FormActions';

interface DeliveryZoneCreatePageProps {
  onClose: () => void;
  onSave: (zone: DeliveryZone) => void;
}

export const DeliveryZoneCreatePage: React.FC<DeliveryZoneCreatePageProps> = ({
  onClose,
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

  const handleUseStoreLocation = () => {
    const settings = Store_setting();
    if (settings && settings.store_latitude && settings.store_longitude) {
      setFormData(prev => ({
        ...prev,
        center_lat: String(settings.store_latitude),
        center_lng: String(settings.store_longitude),
      }));
      toast.success('Loaded store coordinates!');
    } else {
      toast.error('Store coordinates are not configured in Store Settings.');
    }
  };

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    const loadingToast = toast.loading('Detecting GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss(loadingToast);
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          center_lat: latitude.toFixed(8),
          center_lng: longitude.toFixed(8),
        }));
        toast.success('Loaded current coordinates!');
      },
      (error) => {
        toast.dismiss(loadingToast);
        toast.error('Failed to detect location. Please check browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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

      const created = await deliveryZonesService.createDeliveryZone(payload);
      toast.success(`Delivery zone "${created.name}" added!`);
      onSave(created);
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
      <PageHeader
        title="Add New Delivery Zone"
        subtitle="Define a regional delivery fee and delivery timeline structure."
        onClose={onClose}
        backTitle="Back to delivery zones list"
      />

      {/* ── FORM CONTAINER ────────────────────────────────── */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 space-y-6">
          <GroupDiv className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-855 flex items-center gap-1.5">
                <FiMapPin className="text-orange-500" />
                <span>Zone Details</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Specify the name, shortcode, type and geographic coverage.
              </p>
            </div>

            {/* Zone Name */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Zone Name</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Phnom Penh, Siem Reap, National Highway 6"
                className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                required
              />
            </div>

            {/* Zone Code */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Zone Code / Shortcode</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., PP-ZONE, SR-ZONE"
                className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 block">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe which regions or provinces are covered by this zone..."
                rows={4}
                className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold resize-none"
              />
            </div>

            {/* Zone Type */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 block">
                Zone Type
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold cursor-pointer bg-white"
              >
                <option value="radius">Radius-based coverage</option>
                <option value="polygon">Custom geographical polygon</option>
              </select>
            </div>

            {formData.type === 'radius' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">
                    Radius Center Point
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUseStoreLocation}
                      className="px-3 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] text-slate-700 rounded-[5px] text-[11px] font-extrabold transition-all cursor-pointer border-none"
                    >
                      Use Store Location
                    </button>
                    <button
                      type="button"
                      onClick={handleDetectCurrentLocation}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-[5px] text-[11px] font-extrabold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer border-none"
                    >
                      <FiMapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Detect GPS</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">
                      Center Latitude
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={formData.center_lat}
                      onChange={e => setFormData({ ...formData, center_lat: e.target.value })}
                      placeholder="e.g., 11.5564"
                      className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">
                      Center Longitude
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={formData.center_lng}
                      onChange={e => setFormData({ ...formData, center_lng: e.target.value })}
                      placeholder="e.g., 104.9282"
                      className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">
                      Radius (KM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.radius_km}
                      onChange={e => setFormData({ ...formData, radius_km: e.target.value })}
                      placeholder="e.g., 5.00"
                      className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Live Zone Center Map Preview */}
                {formData.center_lat && formData.center_lng && (
                  <div className="space-y-1.5 pt-2 text-left">
                    <label className="text-xs font-bold text-slate-700 block">
                      Zone Center Map Preview
                    </label>
                    <div className="w-full h-48 rounded-[5px] overflow-hidden border border-slate-200 bg-slate-50">
                      <iframe
                        title="Zone Center Location Check"
                        src={`https://maps.google.com/maps?q=${parseFloat(formData.center_lat)},${parseFloat(formData.center_lng)}&z=14&output=embed`}
                        className="w-full h-full border-none"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 animate-fade-in text-left">
                <label className="text-xs font-bold text-slate-700 block">
                  Polygon Coordinates (WKT String)
                </label>
                <textarea
                  value={formData.polygon_coordinates}
                  onChange={e => setFormData({ ...formData, polygon_coordinates: e.target.value })}
                  placeholder="e.g., POLYGON((104.9 11.5, 105.0 11.5, 105.0 11.6, 104.9 11.6, 104.9 11.5))"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold font-mono resize-none"
                />
              </div>
            )}
          </GroupDiv>
        </div>

        {/* Right Sidebar Details */}
        <div className="space-y-6">
          <GroupDiv className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-855 flex items-center gap-1.5">
                <FiClock className="text-orange-500" />
                <span>Fee & Schedule</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Configure pricing and timeline properties.
              </p>
            </div>

            {/* Delivery Fee */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Delivery Fee (USD)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-sans font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.delivery_fee}
                  onChange={e => setFormData({ ...formData, delivery_fee: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                  required
                />
              </div>
            </div>

            {/* Estimated Delivery Time */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 block">
                Estimated Delivery Time
              </label>
              <input
                type="text"
                value={formData.estimated_delivery_time}
                onChange={e => setFormData({ ...formData, estimated_delivery_time: e.target.value })}
                placeholder="e.g., 24 Hours, 1-2 Days, 3-5 Days"
                className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between pt-2 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 block">
                  Status Active
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle to enable/disable this zone.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 accent-orange-600 cursor-pointer"
              />
            </div>
          </GroupDiv>

          {/* Action buttons */}
          <FormActions
            onCancel={onClose}
            saving={saving}
            submitLabel="Add Zone"
          />
        </div>
      </form>
    </div>
  );
};
