import React from 'react';
import { FiArrowLeft, FiMapPin, FiInfo, FiEdit2, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { type DeliveryZone } from '@/api/owner/deliveryZones';
import '@/pages/owner_manage/style/font.css';

interface DeliveryZoneShowPageProps {
  onClose: () => void;
  zone: DeliveryZone;
  onEdit: (zone: DeliveryZone) => void;
}

export const DeliveryZoneShowPage: React.FC<DeliveryZoneShowPageProps> = ({
  onClose,
  zone,
  onEdit,
}) => {
  if (!zone) return null;

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
              <FiInfo className="text-primary" />
              <span>Delivery Zone Details</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Review configuration, fee, and status of this delivery zone.
            </p>
          </div>
        </div>

        <button
          onClick={() => onEdit(zone)}
          className="py-2.5 px-5 bg-primary hover:bg-primary-hover active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer border-none"
        >
          <FiEdit2 className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Modify Zone</span>
        </button>
      </div>

      {/* ── TWO COLUMN MAIN LAYOUT ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Left Column (1/3 width) - Preview Card */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center font-black shadow-3xs shrink-0">
              <FiMapPin className="w-10 h-10" />
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-800 text-lg">{zone.name}</h4>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Code: <span className="font-bold text-slate-650">{zone.code}</span>
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-2 border-t border-slate-50">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${zone.is_active
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}>
              {zone.is_active ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Right Column (2/3 width) - Details */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base border-b border-slate-100 pb-3">
            Zone Profile Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Fee */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400 shrink-0">
                <FiDollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Delivery Fee</p>
                <p className="text-xs font-black text-emerald-600">${parseFloat(String(zone.delivery_fee)).toFixed(2)}</p>
              </div>
            </div>

            {/* Estimated Days */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400 shrink-0">
                <FiCalendar className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estimated Timeline</p>
                <p className="text-xs font-bold text-slate-700">
                  {zone.estimated_delivery_time || 'Not Specified'}
                </p>
              </div>
            </div>

            {/* Geographical details */}
            <div className="flex items-start gap-3 md:col-span-2 border-t border-slate-105 pt-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400 shrink-0">
                <FiMapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Geographic Coverage Details</p>
                <p className="text-xs font-bold text-slate-700 capitalize">
                  Type: {zone.type || 'radius'}
                </p>
                {(!zone.type || zone.type === 'radius') ? (
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Center Coordinates: <span className="font-bold text-slate-700">{zone.center_lat || 'N/A'}, {zone.center_lng || 'N/A'}</span> • Radius: <span className="font-bold text-slate-700">{zone.radius_km || 'N/A'} KM</span>
                  </p>
                ) : (
                  <div className="text-[11px] font-semibold text-slate-500 mt-1">
                    <span className="block mb-0.5">Polygon Points:</span>
                    <code className="block bg-slate-50 p-2 rounded-lg break-all text-[10px] text-slate-600 border border-slate-100 font-mono select-all">
                      {zone.polygon_coordinates || 'N/A'}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start gap-3 md:col-span-2 border-t border-slate-105 pt-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400 shrink-0">
                <FiInfo className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Description</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  {zone.description || 'No description provided for this zone.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
