import React from 'react';
import { FiMapPin, FiCheck, FiChevronRight, FiPhone, FiSend, FiMessageSquare, FiTruck } from 'react-icons/fi';
import type { ShippingAddress } from '@/api/owner/shippingAddresses';
import { type CheckoutValidationError } from '../../validation/CheckoutValidationError';
import { type DeliveryMethod } from '@/api/owner/deliveryMethods';
import { resolveImageUrl } from '../../utils/imageUtils';

interface DeliveryAddressTabProps {
     selectedAddress: ShippingAddress | undefined;
     savedAddresses: ShippingAddress[];
     onSelectAddress: (id: number) => void;
     showAddressBook: () => void;
     preferredContact: string;
     setPreferredContact: (contact: string) => void;
     contactInput: string;
     setContactInput: (input: string) => void;
     validationError: CheckoutValidationError | null;
     isLocked: boolean;
     onNext: () => void;
     onEdit: () => void;
     isLoggedIn: boolean;
     setShowAddModal: (show: boolean) => void;
     addressBtnRef: React.RefObject<HTMLButtonElement | null>;
     preferredContactRef: React.RefObject<HTMLButtonElement | null>;
     contactInputRef: React.RefObject<HTMLInputElement | null>;
     deliveryMethods: DeliveryMethod[];
     selectedDeliveryMethod: DeliveryMethod | null;
     onSelectDeliveryMethod: (method: DeliveryMethod) => void;
     loadingDeliveryMethods: boolean;
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
}) => {
     const hasError = !!(
          validationError?.field === 'address' || 
          validationError?.field === 'preferredContact' || 
          validationError?.field === 'contactInput' ||
          validationError?.field === 'deliveryMethod'
     );

     return (
          <div className={`bg-white rounded-sm border transition-all duration-300 shadow-2xs ${!isLocked ? (hasError ? 'border-red-500 ring-1 ring-red-500/20 p-5' : 'border-stone-900 ring-1 ring-stone-900/10 p-5') : 'border-stone-200/60 p-5'}`}>
               {/* Header */}
               <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                    {isLocked ? (
                         <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white shrink-0">
                                   <FiCheck className="w-4 h-4 stroke-[3]" />
                              </div>
                              <div>
                                   <h2 className="text-xs font-black text-stone-900 uppercase tracking-widest">
                                        2. Delivery Address & Shipping
                                   </h2>
                                   <p className="text-[11px] text-stone-500 font-bold mt-0.5 animate-fade-in">
                                        {selectedAddress ? `${selectedAddress.first_name} ${selectedAddress.last_name}` : 'Guest Recipient'} • {selectedAddress?.city_province || 'No Province'}
                                   </p>
                                   <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider animate-fade-in">
                                        Contact via {preferredContact?.toUpperCase()} ({contactInput})
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
                              <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-black">2</span>
                              Delivery & Contact Details
                         </h2>
                    )}

                    {isLocked ? (
                         <button
                              onClick={onEdit}
                              className="text-[10px] font-black text-stone-500 hover:text-stone-900 uppercase tracking-widest border border-stone-200 hover:border-stone-900 px-3 py-1.5 rounded-sm bg-transparent cursor-pointer transition-all duration-200"
                         >
                              Modify
                         </button>
                    ) : (
                         <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-sm font-black uppercase tracking-wider">
                              Step 2 of 3
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
                                        Delivery address
                                   </h3>

                                   <div className="space-y-4">
                                        {/* Selected address details */}
                                        <div className={`flex items-start gap-4 p-4 border rounded-sm relative transition-all duration-200 ${validationError?.field === 'address' ? 'border-red-500 bg-red-50/10' : 'border-stone-200 bg-stone-50/50'}`}>
                                             <div className={`mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded-full border transition-all duration-200 ${validationError?.field === 'address' ? 'border-red-500 bg-red-500 text-white' : 'border-stone-900 bg-stone-900 text-white'}`}>
                                                  <FiCheck className="w-2.5 h-2.5 stroke-[4]" />
                                             </div>

                                             <div className="flex-1 text-xs text-stone-600 space-y-1">
                                                  <h4 className="font-bold text-stone-900 text-sm">
                                                       {selectedAddress ? `${selectedAddress.first_name} ${selectedAddress.last_name}` : 'No Recipient Name'}
                                                  </h4>
                                                  <p>{selectedAddress ? `${selectedAddress.address}, ${selectedAddress.city_province}, ${selectedAddress.country}` : 'Please select or add a delivery address'}</p>
                                                  {selectedAddress?.telephone && <p>{selectedAddress.telephone}</p>}
                                             </div>

                                             <button
                                                  type="button"
                                                  ref={addressBtnRef}
                                                  onClick={showAddressBook}
                                                  className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 border-none bg-transparent cursor-pointer ${validationError?.field === 'address' ? 'text-red-600 hover:text-red-800' : 'text-stone-400 hover:text-stone-900'}`}
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
                              </div>

                              {/* Preferred contact line section */}
                              <div className="border-t border-stone-100 pt-6">
                                   <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FiPhone className="w-3.5 h-3.5 text-stone-900 stroke-[2.5]" />
                                        Preferred contact line
                                   </h3>

                                   <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-2">
                                             {[
                                                  { key: 'phone', icon: <FiPhone className="w-3.5 h-3.5" />, label: 'Phone call' },
                                                  { key: 'telegram', icon: <FiSend className="w-3.5 h-3.5 rotate-[-15deg]" />, label: 'Telegram' },
                                                  { key: 'whatsapp', icon: <FiMessageSquare className="w-3.5 h-3.5" />, label: 'WhatsApp' },
                                             ].map((c, idx) => (
                                                  <button
                                                       key={c.key}
                                                       type="button"
                                                       ref={idx === 0 ? preferredContactRef : undefined}
                                                       onClick={() => setPreferredContact(c.key)}
                                                       className={`flex items-center justify-center gap-1.5 py-2.5 px-1.5 border rounded-[3px] text-xs font-bold transition-all cursor-pointer ${preferredContact === c.key
                                                            ? 'bg-stone-900 text-white border-stone-900'
                                                            : validationError?.field === 'preferredContact'
                                                                 ? 'bg-white text-red-500 border-red-300 hover:bg-red-50/50'
                                                                 : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                                            }`}
                                                  >
                                                       {c.icon}
                                                       {c.label}
                                                  </button>
                                             ))}
                                        </div>

                                        {validationError?.field === 'preferredContact' && (
                                             <p className="text-[11px] font-bold text-red-500 animate-fade-in mt-1 flex items-center gap-1">
                                                  <span>⚠️</span>
                                                  <span>{validationError.message}</span>
                                             </p>
                                        )}

                                        <div className="space-y-1.5">
                                             <input
                                                  type="text"
                                                  ref={contactInputRef}
                                                  value={contactInput}
                                                  onChange={(e) => setContactInput(e.target.value)}
                                                  placeholder={
                                                       preferredContact === 'phone'
                                                            ? 'Enter phone number (+855...)'
                                                            : preferredContact === 'telegram'
                                                                 ? 'Enter Telegram username or phone'
                                                                 : preferredContact === 'whatsapp'
                                                                      ? 'Enter WhatsApp number'
                                                                      : 'Enter contact information'
                                                  }
                                                  className={`w-full px-3.5 py-2.5 border rounded-[3px] text-xs font-bold text-stone-850 focus:outline-none transition-all duration-200 ${validationError?.field === 'contactInput'
                                                       ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/35 bg-red-50/5'
                                                       : 'border-stone-200 focus:border-stone-900'
                                                       }`}
                                             />
                                             {validationError?.field === 'contactInput' && (
                                                  <p className="text-[11px] font-bold text-red-500 animate-fade-in mt-1 flex items-center gap-1">
                                                       <span>⚠️</span>
                                                       <span>{validationError.message}</span>
                                                  </p>
                                             )}
                                        </div>
                                   </div>
                              </div>

                              {/* Delivery Method Selector */}
                              {deliveryMethods && deliveryMethods.length > 0 && (
                                   <div className="border-t border-stone-100 pt-6">
                                        <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                             <FiTruck className="w-3.5 h-3.5 text-stone-900 stroke-[2.5]" />
                                             Delivery Method
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                             {deliveryMethods.map((method) => {
                                                  const isSelected = selectedDeliveryMethod?.id === method.id;
                                                  const hasImage = !!method.image;
                                                  return (
                                                       <button
                                                            key={method.id}
                                                            type="button"
                                                            onClick={() => onSelectDeliveryMethod(method)}
                                                            className={`flex items-start gap-3 p-3 border rounded-[3px] transition-all duration-200 text-left cursor-pointer bg-white ${
                                                                 isSelected 
                                                                      ? 'border-stone-900 ring-1 ring-stone-900/10' 
                                                                      : validationError?.field === 'deliveryMethod'
                                                                           ? 'border-red-300 bg-red-50/5 hover:bg-red-50/10'
                                                                           : 'border-stone-200 hover:bg-stone-50/50'
                                                            }`}
                                                       >
                                                            {/* Icon or Image */}
                                                            <div className="w-10 h-10 rounded-[4px] overflow-hidden bg-stone-100 flex items-center justify-center shrink-0 border border-stone-100">
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
                                                                           ${parseFloat(String(method.cost)).toFixed(2)}
                                                                      </span>
                                                                 </div>
                                                                 <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                                                                      Est: {method.estimated_days_min} - {method.estimated_days_max} Days
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

                                        {validationError?.field === 'deliveryMethod' && (
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
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] font-black text-xs uppercase tracking-widest border-none cursor-pointer transition-all duration-200 flex items-center gap-2 shadow-sm focus:outline-none"
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
