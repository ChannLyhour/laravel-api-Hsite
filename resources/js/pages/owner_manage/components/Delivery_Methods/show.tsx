import React from 'react';
import { FiArrowLeft, FiTruck, FiInfo, FiEdit2, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { type DeliveryMethod } from '@/api/owner/deliveryMethods';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';

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
                                   <FiInfo className="text-primary" />
                                   <span>Delivery Method Details</span>
                              </h2>
                              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                   Review details, configuration, and status of this delivery option.
                              </p>
                         </div>
                    </div>

                    <button
                         onClick={() => onEdit(method)}
                         className="py-2 px-5 bg-primary hover:bg-primary-hover text-white rounded-[5px] text-xs font-bold transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 flex items-center space-x-2 cursor-pointer border-none active:scale-95 duration-200"
                    >
                         <FiEdit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                         <span>Edit Profile</span>
                    </button>
               </div>

               {/* ── TWO COLUMN MAIN LAYOUT ────────────────────────────── */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
                    {/* Left Column (1/3 width) - Preview Card */}
                    <div className="bg-white border border-slate-100 rounded-[5px] p-6 shadow-xs text-center space-y-4">
                         <div className="flex justify-center">
                              <div className="w-24 h-24 rounded-[16px] overflow-hidden bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center font-black text-4xl shadow-sm shrink-0">
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
                                        <FiTruck className="w-12 h-12" />
                                   </span>
                              </div>
                         </div>

                         <div className="space-y-1">
                              <h4 className="font-extrabold text-slate-800 text-lg">{method.name}</h4>
                              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                   Code: <span className="font-bold text-slate-650">{method.code}</span>
                              </p>
                         </div>

                         <div className="flex justify-center gap-2 pt-2 border-t border-slate-50">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${method.is_active
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                        : 'bg-rose-50 border-rose-200 text-rose-600'
                                   }`}>
                                   {method.is_active ? 'Active' : 'Disabled'}
                              </span>
                         </div>
                    </div>

                    {/* Right Column (2/3 width) - Method Details */}
                    <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[5px] p-6 sm:p-8 shadow-xs space-y-6">
                         <h3 className="font-extrabold text-slate-800 text-sm sm:text-base border-b border-slate-50 pb-3">
                              Delivery Option Profile Summary
                         </h3>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Cost */}
                              <div className="flex items-start gap-3">
                                   <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400 shrink-0">
                                        <FiDollarSign className="w-4 h-4 text-emerald-500" />
                                   </div>
                                   <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cost / Shipping Fee</p>
                                        <p className="text-xs font-black text-emerald-600">${parseFloat(String(method.cost)).toFixed(2)}</p>
                                   </div>
                              </div>

                              {/* Estimated Days */}
                              <div className="flex items-start gap-3">
                                   <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400 shrink-0">
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
                              <div className="flex items-start gap-3 md:col-span-2">
                                   <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400 shrink-0">
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
                    </div>
               </div>
          </div>
     );
};
