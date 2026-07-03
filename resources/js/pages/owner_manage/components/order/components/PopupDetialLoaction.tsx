import React from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiMapPin, FiPhone, FiUser, FiExternalLink } from 'react-icons/fi';

interface PopupDetailLocationProps {
     onClose: () => void;
     customerName: string;
     customerPhone: string;
     addressText: string;
     latitude?: number | string | null;
     longitude?: number | string | null;
}

export const PopupDetailLocation: React.FC<PopupDetailLocationProps> = ({
     onClose,
     customerName,
     customerPhone,
     addressText,
     latitude,
     longitude,
}) => {
     const hasCoordinates = latitude && longitude;
     const latVal = parseFloat(String(latitude));
     const lngVal = parseFloat(String(longitude));

     // Construct map embed source. If coordinates exist, use exact GPS, else geocode by address string
     const embedUrl = hasCoordinates && !isNaN(latVal) && !isNaN(lngVal)
          ? `https://maps.google.com/maps?q=${latVal},${lngVal}&z=15&output=embed`
          : `https://maps.google.com/maps?q=${encodeURIComponent(addressText)}&z=15&output=embed`;

     const externalMapUrl = hasCoordinates && !isNaN(latVal) && !isNaN(lngVal)
          ? `https://www.google.com/maps?q=${latVal},${lngVal}`
          : `https://www.google.com/maps?q=${encodeURIComponent(addressText)}`;

     return createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
               {/* Backdrop */}
               <div
                    className="absolute inset-0 bg-slate-955/45  transition-opacity duration-300"
                    onClick={onClose}
               />

               {/* Dialog Container */}
               <div className="relative z-10 bg-white w-full max-w-[95%] md:max-w-7xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 shrink-0">
                         <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                   <FiMapPin className="w-4.5 h-4.5 stroke-[2.2]" />
                              </div>
                              <div>
                                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">
                                        Delivery Location Map
                                   </h3>
                                   <p className="text-[10px] text-slate-450 font-bold mt-1">
                                        {hasCoordinates ? 'GPS Tagged Coordinates Match' : 'Address Text Search Resolution'}
                                   </p>
                              </div>
                         </div>
                         <button
                              onClick={onClose}
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer"
                         >
                              <FiX className="w-4 h-4 stroke-[2.5]" />
                         </button>
                    </div>

                    {/* Two-Column Content Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden w-full md:h-[800px] h-auto">
                         {/* Left Column: Map Frame */}
                         <div className="w-full h-80 md:h-full relative bg-slate-50 border-b md:border-b-0 md:border-r border-slate-150 min-h-[550px] md:min-h-0">
                              <iframe
                                   title="Customer Map Location"
                                   src={embedUrl}
                                   className="w-full h-full border-none"
                                   allowFullScreen
                                   loading="lazy"
                                   referrerPolicy="no-referrer-when-downgrade"
                              />
                         </div>

                         {/* Right Column: Details and Actions */}
                         <div className="p-6 space-y-5 overflow-y-auto flex flex-col justify-between max-h-[calc(90vh-70px)] md:max-h-none">
                              <div className="space-y-5 text-left">
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Customer Details */}
                                        <div className="space-y-3 bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
                                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                  Recipient Details
                                             </h4>
                                             <div className="space-y-2.5">
                                                  <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                                                       <FiUser className="w-4 h-4 text-slate-450" />
                                                       <span>{customerName}</span>
                                                  </div>
                                                  <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                                                       <FiPhone className="w-4 h-4 text-slate-450" />
                                                       <span>{customerPhone}</span>
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Coordinates / Map details */}
                                        <div className="space-y-3 bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
                                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                  GPS Position
                                             </h4>
                                             <div className="text-xs font-bold text-slate-700">
                                                  {hasCoordinates ? (
                                                       <div className="font-mono text-[11px] leading-relaxed space-y-1 text-slate-650">
                                                            <p>Lat: <span className="text-indigo-650 font-semibold">{latVal.toFixed(6)}</span></p>
                                                            <p>Lng: <span className="text-indigo-650 font-semibold">{lngVal.toFixed(6)}</span></p>
                                                       </div>
                                                  ) : (
                                                       <p className="text-slate-450 italic font-medium leading-relaxed">
                                                            No GPS tags saved.
                                                       </p>
                                                  )}
                                             </div>
                                        </div>
                                   </div>

                                   {/* Full Address Text */}
                                   <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                             Street Address
                                        </h4>
                                        <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50 p-3.5 border border-slate-150/50 rounded-xl">
                                             {addressText}
                                        </p>
                                   </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
                                   <a
                                        href={externalMapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-850 active:scale-98 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md decoration-none border-none cursor-pointer text-center"
                                   >
                                        <FiExternalLink className="w-4 h-4" /> Open in Google Maps
                                   </a>
                                   <button
                                        onClick={onClose}
                                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 text-[11px] font-black uppercase tracking-widest rounded-xl border-none cursor-pointer transition-all"
                                   >
                                        Close Details
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>
          </div>,
          document.body
     );
};
