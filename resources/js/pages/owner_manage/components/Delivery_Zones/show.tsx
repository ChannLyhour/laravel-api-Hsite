import React from 'react';
import { FiMapPin, FiInfo, FiEdit2, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { type DeliveryZone } from '@/api/owner/deliveryZones';
import '@/pages/owner_manage/style/font.css';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';
import { PageHeader } from '@/pages/owner_manage/helper/PageHeader';

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
      <PageHeader
        title="Delivery Zone Details"
        subtitle="Review configuration, fee, and status of this delivery zone."
        onClose={onClose}
        backTitle="Back to delivery zones list"
        action={
          <button
            onClick={() => onEdit(zone)}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold shadow-xs active:scale-98 transition-all border-none cursor-pointer flex items-center gap-1.5"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
            <span>Modify Zone</span>
          </button>
        }
      />

      {/* ── TWO COLUMN MAIN LAYOUT ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Left Column (1/3 width) - Preview Card */}
        <GroupDiv className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-[5px] bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center font-black shadow-2xs shrink-0">
              <FiMapPin className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-800 text-lg">{zone.name}</h4>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Code: <span className="font-bold text-slate-655">{zone.code}</span>
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-2 border-t border-slate-50">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block ${zone.is_active
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
              : 'bg-rose-50 border-rose-100 text-rose-650'
              }`}>
              {zone.is_active ? 'Active' : 'Disabled'}
            </span>
          </div>
        </GroupDiv>

        {/* Right Column (2/3 width) - Details */}
        <div className="lg:col-span-2">
          <GroupDiv className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-855 flex items-center gap-1.5">
                <FiInfo className="text-orange-500" />
                <span>Zone Profile Summary</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Fee */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-black/[0.02] border rounded-[5px] text-slate-400 shrink-0">
                  <FiDollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Delivery Fee</p>
                  <p className="text-xs font-black text-emerald-600">${parseFloat(String(zone.delivery_fee)).toFixed(2)}</p>
                </div>
              </div>

              {/* Estimated Days */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-black/[0.02] border rounded-[5px] text-slate-400 shrink-0">
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
              <div className="flex items-start gap-3 md:col-span-2 border-t border-slate-100 pt-4">
                <div className="p-2 bg-black/[0.02] border rounded-[5px] text-slate-400 shrink-0">
                  <FiMapPin className="w-4 h-4 text-orange-500" />
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
                      <code className="block bg-black/[0.02] p-2 rounded-[5px] break-all text-[10px] text-slate-600 border border-slate-200 font-mono select-all">
                        {zone.polygon_coordinates || 'N/A'}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3 md:col-span-2 border-t border-slate-100 pt-4">
                <div className="p-2 bg-black/[0.02] border rounded-[5px] text-slate-400 shrink-0">
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
          </GroupDiv>
        </div>
      </div>
    </div>
  );
};
