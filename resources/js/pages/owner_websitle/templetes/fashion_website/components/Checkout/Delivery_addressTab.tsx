import React from 'react';
import { FiMapPin, FiCheck, FiChevronRight, FiPhone, FiSend, FiMessageSquare, FiTruck, FiMail } from 'react-icons/fi';
import { FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import type { ShippingAddress } from '@/api/owner/shippingAddresses';
import { type CheckoutValidationError } from '../../validation/CheckoutValidationError';
import { type DeliveryMethod } from '@/api/owner/deliveryMethods';
import { type DeliveryZone } from '@/api/owner/deliveryZones';
import { resolveImageUrl } from '../../utils/imageUtils';
import { openLocationMapModal } from '../helpers/autoLocationCustomer';

interface DeliveryAddressTabProps {
     selectedAddress: ShippingAddress | undefined;
     savedAddresses: ShippingAddress[];
     onSelectAddress: (id: number) => void;
     showAddressBook: () => void;
     preferredContact?: string;
     setPreferredContact?: (contact: string) => void;
     contactInput?: string;
     setContactInput?: (input: string) => void;
     validationError: CheckoutValidationError | null;
     isLocked: boolean;
     onNext: () => void;
     onEdit: () => void;
     isLoggedIn: boolean;
     setShowAddModal: (show: boolean) => void;
     addressBtnRef: React.RefObject<HTMLButtonElement | null>;
     preferredContactRef?: React.RefObject<HTMLButtonElement | null>;
     contactInputRef?: React.RefObject<HTMLInputElement | null>;
     deliveryMethods: DeliveryMethod[];
     selectedDeliveryMethod: DeliveryMethod | null;
     onSelectDeliveryMethod: (method: DeliveryMethod) => void;
     loadingDeliveryMethods: boolean;
     matchingZone: DeliveryZone | null;

     // Custom delivery closed variables
     checkoutDeliveryAddress?: 'open' | 'close' | 'null';
     checkoutPreferredContact?: 'open' | 'close' | 'null';
     preferredContactPhone?: boolean;
     preferredContactTelegram?: boolean;
     preferredContactWhatsapp?: boolean;
     customCustomerName?: string;
     setCustomCustomerName?: (val: string) => void;
     customCustomerPhone?: string;
     setCustomCustomerPhone?: (val: string) => void;
     customCustomerAddress?: string;
     setCustomCustomerAddress?: (val: string) => void;
     customLatitude?: string;
     setCustomLatitude?: (val: string) => void;
     customLongitude?: string;
     setCustomLongitude?: (val: string) => void;
     customNameRef?: React.RefObject<HTMLInputElement | null>;
     customPhoneRef?: React.RefObject<HTMLInputElement | null>;
     customAddressRef?: React.RefObject<HTMLInputElement | null>;
}

export const Delivery_addressTab: React.FC<DeliveryAddressTabProps> = ({
     selectedAddress,
     savedAddresses,
     onSelectAddress,
     showAddressBook,
     preferredContact,
     setPreferredContact,
     contactInput,
     setContactInput,
     validationError,
     isLocked,
     onNext,
     onEdit,
     isLoggedIn,
     setShowAddModal,
     addressBtnRef,
     preferredContactRef,
     contactInputRef,
     deliveryMethods,
     selectedDeliveryMethod,
     onSelectDeliveryMethod,
     loadingDeliveryMethods,
     matchingZone,
     checkoutDeliveryAddress = 'open',
     checkoutPreferredContact = 'close',
     preferredContactPhone = false,
     preferredContactTelegram = false,
     preferredContactWhatsapp = false,
     customCustomerName = '',
     setCustomCustomerName,
     customCustomerPhone = '',
     setCustomCustomerPhone,
     customCustomerAddress = '',
     setCustomCustomerAddress,
     customLatitude = '',
     setCustomLatitude,
     customLongitude = '',
     setCustomLongitude,
     customNameRef,
     customPhoneRef,
     customAddressRef,
}) => {
     const hasError = !!(
          validationError?.field === 'address' ||
          validationError?.field === 'customCustomerName' ||
          validationError?.field === 'customCustomerPhone' ||
          validationError?.field === 'customCustomerAddress' ||
          validationError?.field === 'deliveryMethod'
     );
     const isLocationSelected = checkoutDeliveryAddress === 'close'
          ? !!(customLatitude && customLongitude)
          : !!(selectedAddress && selectedAddress.latitude && selectedAddress.longitude);

     const handleOpenMapModal = async () => {
          const result = await openLocationMapModal(
               customLatitude ? parseFloat(customLatitude) : null,
               customLongitude ? parseFloat(customLongitude) : null
          );
          if (result) {
               setCustomLatitude?.(String(result.latitude));
               setCustomLongitude?.(String(result.longitude));
               if (setCustomCustomerAddress && result.address) {
                    setCustomCustomerAddress(result.address);
               }
          }
     };

     return (
          <div className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm font-kuntomruy ${!isLocked ? (hasError ? 'border-red-500 ring-1 ring-red-500/20 p-5' : 'border-stone-900 ring-1 ring-stone-900/5 p-5') : 'border-stone-200/50 p-5'}`}>
               {/* Header */}
               <div 
                    onClick={isLocked ? onEdit : undefined}
                    className={`flex items-center justify-between pb-4 border-b border-stone-100 ${isLocked ? 'cursor-pointer select-none' : ''}`}
               >
                    {isLocked ? (
                         <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-250 flex items-center justify-center shrink-0 shadow-2xs">
                                   <FiCheck className="w-4 h-4 stroke-[3]" />
                              </div>
                              <div>
                                   <h2 className="text-xs font-black text-stone-900 uppercase tracking-widest">
                                        2. Delivery Address & Shipping
                                   </h2>
                                   <p className="text-[11px] text-stone-500 font-bold mt-0.5 animate-fade-in">
                                        {checkoutDeliveryAddress === 'close' ? customCustomerName : (selectedAddress ? `${selectedAddress.first_name} ${selectedAddress.last_name}` : 'Guest Recipient')} • {checkoutDeliveryAddress === 'close' ? customCustomerAddress : (selectedAddress?.city_province || 'No Province')}
                                   </p>
                                   {selectedDeliveryMethod && (
                                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider animate-fade-in">
                                             {selectedDeliveryMethod.name} (${parseFloat(String(selectedDeliveryMethod.cost)).toFixed(2)})
                                        </p>
                                   )}
                              </div>
                         </div>
                    ) : (
                         <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-black shadow-xs">2</span>
                              Delivery & Contact Details
                         </h2>
                    )}

                    {isLocked ? (
                         <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-xl font-black uppercase tracking-wider border border-emerald-200/50">
                                   Complete
                              </span>
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit();
                                   }}
                                   className="text-[10px] font-black text-stone-500 hover:text-stone-900 uppercase tracking-widest border border-stone-200 hover:border-stone-900 px-3.5 py-1.5 rounded-xl bg-transparent cursor-pointer transition-all duration-200"
                              >
                                   Modify
                              </button>
                         </div>
                    ) : (
                         <span className="text-[11px] bg-stone-100 text-stone-600 px-3 py-1 rounded-xl font-black uppercase tracking-wider">
                              Step 2 of 2
                         </span>
                    )}
               </div>

               {/* Content with smooth slide-down dropdown transition */}
               <div className={`grid transition-all duration-300 ease-in-out ${!isLocked ? 'opacity-100' : 'opacity-0'}`} style={{ gridTemplateRows: !isLocked ? '1fr' : '0fr' }}>
                    <div className="overflow-hidden">
                         <div className="space-y-6 mt-6">
                              {/* Delivery address section */}
                              <div>
                                   <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FiMapPin className="w-3.5 h-3.5 text-stone-900 stroke-[2.5]" />
                                        {checkoutDeliveryAddress === 'close' ? 'Customer Information' : 'Delivery address'}
                                   </h3>

                                   {checkoutDeliveryAddress === 'close' ? (
                                        <div className="space-y-3">
                                             {/* Customer Name */}
                                             <div className="space-y-1.5 text-left">
                                                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                                       Your Name <span className="text-red-500">*</span>
                                                  </label>
                                                  <input
                                                       ref={customNameRef as any}
                                                       type="text"
                                                       value={customCustomerName}
                                                       onChange={(e) => setCustomCustomerName?.(e.target.value)}
                                                       placeholder="your name"
                                                       className={`w-full px-3 py-2.5 border rounded-[3px] text-xs font-medium text-stone-850 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-all ${validationError?.field === 'customCustomerName' ? 'border-red-500' : 'border-stone-200'}`}
                                                  />
                                             </div>

                                             {/* Customer Phone */}
                                             <div className="space-y-1.5 text-left">
                                                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                                       Phone Number or Email <span className="text-red-500">*</span>
                                                  </label>
                                                  <div className="relative">
                                                       {customCustomerPhone && !customCustomerPhone.includes('@') && /^[+0-9]/.test(customCustomerPhone) ? (
                                                            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                                                       ) : (
                                                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                                                       )}
                                                       <input
                                                            ref={customPhoneRef as any}
                                                            type="text"
                                                            value={customCustomerPhone}
                                                            onChange={(e) => setCustomCustomerPhone?.(e.target.value)}
                                                            placeholder="phone or email"
                                                            className={`w-full pl-9 pr-3 py-2.5 border rounded-[3px] text-xs font-medium text-stone-855 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-all ${validationError?.field === 'customCustomerPhone' ? 'border-red-500' : 'border-stone-200'}`}
                                                       />
                                                  </div>
                                             </div>

                                             {/* Customer Address with Inline Detect Map Button on Right */}
                                             <div className="space-y-1.5 text-left">
                                                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                                       Delivery Address / Note <span className="text-red-500">*</span>
                                                  </label>
                                                  <div className="relative flex items-center">
                                                       <input
                                                            ref={customAddressRef as any}
                                                            type="text"
                                                            value={customCustomerAddress}
                                                            onChange={(e) => setCustomCustomerAddress?.(e.target.value)}
                                                            placeholder="Address"
                                                            className={`w-full pr-32 pl-3 py-2.5 border rounded-[3px] text-xs font-medium text-stone-850 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-all ${validationError?.field === 'customCustomerAddress' ? 'border-red-500' : 'border-stone-200'}`}
                                                       />
                                                       <button
                                                            type="button"
                                                            onClick={handleOpenMapModal}
                                                            className="absolute right-1 top-1 bottom-1 px-3 bg-stone-900 hover:bg-stone-850 text-white font-bold text-[10px] uppercase tracking-wider rounded-[2px] border-none cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
                                                            title="Detect & Select Location on Map"
                                                       >
                                                            <FiMapPin className="w-3.5 h-3.5 text-white" />
                                                            <span>Detect Map</span>
                                                       </button>
                                                  </div>
                                             </div>
                                        </div>
                                   ) : (
                                        <div className="space-y-4">
                                             {/* Selected address details */}
                                             <div className={`flex items-start gap-4 p-4 border rounded-[3px] relative transition-all duration-200 ${validationError?.field === 'address' ? 'border-red-500 bg-red-50/10' : 'border-stone-200 bg-stone-50/50'}`}>
                                                  <div className={`mt-0.5 shrink-0 flex items-center justify-center w-4.5 h-4.5 rounded-full border transition-all duration-200 ${validationError?.field === 'address' ? 'border-red-500 bg-red-500 text-white' : 'border-stone-900 bg-stone-900 text-white shadow-xs'}`}>
                                                       <FiCheck className="w-2.5 h-2.5 stroke-[4]" />
                                                  </div>

                                                  <div className="flex-1 text-xs text-stone-600 space-y-1">
                                                       <h4 className="font-extrabold text-stone-900 text-sm">
                                                            {selectedAddress ? `${selectedAddress.first_name} ${selectedAddress.last_name}` : 'No Recipient Name'}
                                                       </h4>
                                                       <p>{selectedAddress ? `${selectedAddress.address}, ${selectedAddress.city_province}, ${selectedAddress.country}` : 'Please select or add a delivery address'}</p>
                                                       {selectedAddress?.telephone && <p>{selectedAddress.telephone}</p>}
                                                  </div>

                                                  <button
                                                       type="button"
                                                       ref={addressBtnRef}
                                                       onClick={showAddressBook}
                                                       className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 border-none bg-transparent cursor-pointer ${validationError?.field === 'address' ? 'text-red-600 hover:text-red-800' : 'text-stone-400 hover:text-stone-955'}`}
                                                  >
                                                       {selectedAddress ? 'Change Address' : 'Choose Address'} <FiChevronRight className="w-3.5 h-3.5" />
                                                  </button>
                                             </div>

                                             {validationError?.field === 'address' && (
                                                  <p className="text-[11px] font-bold text-red-500 animate-fade-in mt-1 flex items-center gap-1">
                                                       <span>⚠️</span>
                                                       <span>{validationError.message}</span>
                                                  </p>
                                             )}
                                        </div>
                                   )}
                              </div>

                              {/* Delivery Method Selector */}
                              {deliveryMethods && (
                                   <div className="border-t border-stone-100 pt-6">
                                        <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                             <FiTruck className="w-3.5 h-3.5 text-stone-900 stroke-[2.5]" />
                                             Delivery Method
                                        </h3>

                                        {!isLocationSelected ? (
                                             <div
                                                  onClick={handleOpenMapModal}
                                                  className="bg-stone-50 hover:bg-stone-100/80 border border-dashed border-stone-300 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all duration-200 animate-fade-in font-kuntomruy group shadow-2xs"
                                             >
                                                  <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                                       <FiMapPin className="w-5 h-5 text-white stroke-[2.5]" />
                                                  </div>
                                                  <div>
                                                       <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest font-kuntomruy">
                                                            Select Shipping Location First
                                                       </h4>
                                                       <p className="text-xs text-stone-500 font-medium max-w-[320px] leading-relaxed font-kuntomruy mt-1">
                                                            Click here to auto-detect your location on map or search your address to view available delivery methods.
                                                       </p>
                                                  </div>
                                                  <button
                                                       type="button"
                                                       className="mt-1 px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white text-[10px] font-black uppercase tracking-wider rounded-xl border-none cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                                                  >
                                                       <FiMapPin className="w-3.5 h-3.5" />
                                                       Auto Locate & Select on Map
                                                  </button>
                                             </div>
                                        ) : deliveryMethods.length === 0 ? (
                                             <div className="bg-red-50/20 border border-dashed border-red-200/85 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 animate-fade-in font-kuntomruy">
                                                  <span className="text-2xl">🚫</span>
                                                  <h4 className="text-xs font-black text-red-800 uppercase tracking-widest font-kuntomruy">Out of Delivery Zone</h4>
                                                  <p className="text-xs text-red-500 font-medium max-w-[320px] leading-relaxed font-kuntomruy">
                                                       We do not deliver to this location. Please choose another shipping address or pin location.
                                                  </p>
                                             </div>
                                        ) : (
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                                                  {deliveryMethods.map((method) => {
                                                       const isSelected = selectedDeliveryMethod?.id === method.id;
                                                       const hasImage = !!method.image;
                                                       const isPickup = method.code?.toLowerCase().includes('pickup') ||
                                                            method.code?.toLowerCase().includes('pick-up') ||
                                                            method.name?.toLowerCase().includes('pickup') ||
                                                            method.name?.toLowerCase().includes('pick up');
                                                       const displayCost = (!isPickup && matchingZone)
                                                            ? parseFloat(String(matchingZone.delivery_fee))
                                                            : parseFloat(String(method.cost));
                                                       const displayTimeline = (!isPickup && matchingZone && matchingZone.estimated_delivery_time)
                                                            ? matchingZone.estimated_delivery_time
                                                            : `Est: ${method.estimated_days_min} - ${method.estimated_days_max} Days`;
                                                       return (
                                                            <button
                                                                 key={method.id}
                                                                 type="button"
                                                                 onClick={() => onSelectDeliveryMethod(method)}
                                                                 className={`flex items-start gap-3 p-4 border rounded-[3px] transition-all duration-200 text-left cursor-pointer bg-white ${isSelected
                                                                      ? 'border-stone-900 ring-1 ring-stone-900/5 shadow-xs'
                                                                      : validationError?.field === 'deliveryMethod'
                                                                           ? 'border-red-350 bg-red-50/5 hover:bg-red-50/10'
                                                                           : 'border-stone-200 hover:bg-stone-50/50'
                                                                      }`}
                                                             >
                                                                 {/* Icon or Image */}
                                                                 <div className="w-11 h-11 rounded-[3px] overflow-hidden bg-stone-100 flex items-center justify-center shrink-0 border border-stone-100">
                                                                      {hasImage ? (
                                                                           <img
                                                                                src={resolveImageUrl(method.image!)}
                                                                                alt={method.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                      ) : (
                                                                           <FiTruck className="w-5 h-5 text-stone-550" />
                                                                      )}
                                                                 </div>

                                                                 <div className="flex-1 text-xs min-w-0">
                                                                      <div className="flex justify-between items-start gap-2">
                                                                           <h4 className="font-extrabold text-stone-900 truncate">
                                                                                {method.name}
                                                                           </h4>
                                                                           <span className="font-black text-emerald-600 shrink-0">
                                                                                ${displayCost.toFixed(2)}
                                                                           </span>
                                                                      </div>
                                                                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                                                                           {displayTimeline}
                                                                      </p>
                                                                      {method.description && (
                                                                           <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-relaxed font-semibold">
                                                                                {method.description}
                                                                           </p>
                                                                      )}
                                                                 </div>
                                                            </button>
                                                       );
                                                  })}
                                             </div>
                                        )}

                                        {isLocationSelected && validationError?.field === 'deliveryMethod' && (
                                             <p className="text-[11px] font-bold text-red-500 animate-fade-in mt-2 flex items-center gap-1">
                                                  <span>⚠️</span>
                                                  <span>{validationError.message}</span>
                                             </p>
                                        )}
                                   </div>
                              )}

                              {/* Step navigation actions */}
                              <div className="pt-6 border-t border-stone-100 flex justify-end">
                                   <button
                                        onClick={onNext}
                                        className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-[3px] font-bold text-xs uppercase tracking-widest border-none cursor-pointer transition-all duration-200 flex items-center gap-2 shadow-md focus:outline-none"
                                   >
                                        Proceed to Payment <FiChevronRight className="w-4 h-4 stroke-[2.5]" />
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};
