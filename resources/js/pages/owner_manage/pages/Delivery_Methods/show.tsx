import React from 'react';
import { FiTruck, FiInfo, FiEdit2, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { type DeliveryMethod } from '@/api/owner/deliveryMethods';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';
import { PageHeader } from '@/pages/owner_manage/helper/PageHeader';

interface DeliveryMethodShowPageProps {
     onClose: () => void;
     method: DeliveryMethod;
     onEdit: (method: DeliveryMethod) => void;
}

export const DeliveryMethodShowPage: React.FC<DeliveryMethodShowPageProps> = ({
     onClose,
     method,
     onEdit,
}) => {
     if (!method) return null;

     const imageUrl = method.image ? resolveImageUrl(method.image) : null;

     return (
          <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 pb-10 w-full text-left">
               {/* ── HEADER NAVIGATION ─────────────────────────────── */}
               <PageHeader
                    title="Delivery Method Details"
                    subtitle="Review details, configuration, and status of this delivery option."
                    onClose={onClose}
                    backTitle="Back to delivery methods list"
                    action={
                         <button
                              onClick={() => onEdit(method)}
                              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold shadow-xs active:scale-98 transition-all border-none cursor-pointer flex items-center gap-1.5"
                         >
                              <FiEdit2 className="w-3.5 h-3.5" />
                              <span>Edit Profile</span>
                         </button>
                    }
               />

               {/* ── TWO COLUMN MAIN LAYOUT ────────────────────────────── */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
                    {/* Left Column (1/3 width) - Preview Card */}
                    <GroupDiv className="text-center space-y-4">
                         <div className="flex justify-center">
                              <div className="w-16 h-16 rounded-[5px] overflow-hidden bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center font-black shadow-2xs shrink-0">
                                   {imageUrl ? (
                                        <img
                                             src={imageUrl}
                                             alt={method.name}
                                             className="w-full h-full object-cover"
                                             onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                  if (fallback) fallback.style.display = 'flex';
                                             }}
                                        />
                                   ) : null}
                                   <span className="w-full h-full flex items-center justify-center" style={{ display: imageUrl ? 'none' : 'flex' }}>
                                        <FiTruck className="w-8 h-8" />
                                   </span>
                              </div>
                         </div>

                         <div className="space-y-1">
                              <h4 className="font-extrabold text-slate-800 text-lg">{method.name}</h4>
                              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                   Code: <span className="font-bold text-slate-655">{method.code}</span>
                              </p>
                         </div>

                         <div className="flex justify-center gap-2 pt-2 border-t border-slate-50">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block ${method.is_active
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                        : 'bg-rose-50 border-rose-100 text-rose-650'
                                   }`}>
                                   {method.is_active ? 'Active' : 'Disabled'}
                              </span>
                         </div>
                    </GroupDiv>

                    {/* Right Column (2/3 width) - Method Details */}
                    <div className="lg:col-span-2">
                         <GroupDiv className="space-y-6">
                              <div>
                                   <h3 className="text-base font-extrabold text-slate-855 flex items-center gap-1.5">
                                        <FiInfo className="text-orange-500" />
                                        <span>Delivery Option Profile Summary</span>
                                   </h3>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   {/* Cost */}
                                   <div className="flex items-start gap-3">
                                        <div className="p-2 bg-black/[0.02] border rounded-[5px] text-slate-400 shrink-0">
                                             <FiDollarSign className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cost / Shipping Fee</p>
                                             <p className="text-xs font-black text-emerald-600">${parseFloat(String(method.cost)).toFixed(2)}</p>
                                        </div>
                                   </div>

                                   {/* Estimated Days */}
                                   <div className="flex items-start gap-3">
                                        <div className="p-2 bg-black/[0.02] border rounded-[5px] text-slate-400 shrink-0">
                                             <FiCalendar className="w-4 h-4 text-orange-500" />
                                        </div>
                                        <div>
                                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estimated Delivery Time</p>
                                             <p className="text-xs font-bold text-slate-700">
                                                  {method.estimated_days_min} to {method.estimated_days_max} Days
                                             </p>
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
                                                  {method.description || 'No description provided for this method.'}
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
