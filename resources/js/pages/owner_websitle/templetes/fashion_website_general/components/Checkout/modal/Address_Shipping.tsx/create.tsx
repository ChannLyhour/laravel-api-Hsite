import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiMapPin, FiChevronRight } from 'react-icons/fi';
import { toast } from '@/pages/owner_websitle/templetes/fashion_website/utils/toast';
import { shippingAddressesService } from '@/api/owner/shippingAddresses';
import type { ShippingAddress } from '@/api/owner/shippingAddresses';
import { openLocationMapModal } from '@/pages/owner_websitle/templetes/fashion_website/components/helpers/autoLocationCustomer';
import { CAMBODIA_CITIES } from './index';

import { EmailOrPhoneHelper } from '@/pages/owner_websitle/templetes/fashion_website/request/EmailorPhone';
import '@/pages/owner_websitle/templetes/fashion_website/styles/index.css';

interface CreateAddressModalProps {
     onClose: () => void;
     onSave: (addr: ShippingAddress) => void;
     isLoggedIn?: boolean;
}

export const CreateAddressModal: React.FC<CreateAddressModalProps> = ({
     onClose,
     onSave,
     isLoggedIn = false,
}) => {
     const [form, setForm] = useState({
          first_name: '',
          last_name: '',
          telephone: '',
          address: '',
          country: 'Cambodia',
          city_province: '',
          latitude: null as number | string | null,
          longitude: null as number | string | null,
     });
     const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
     const [loading, setLoading] = useState(false);
     const [fetchingLocation, setFetchingLocation] = useState(false);

     const handleAutoGetLocation = async () => {
          try {
               setFetchingLocation(true);
               const result = await openLocationMapModal(
                    form.latitude ? parseFloat(String(form.latitude)) : null,
                    form.longitude ? parseFloat(String(form.longitude)) : null
               );
               if (result) {
                    setForm(prev => ({
                         ...prev,
                         address: result.address,
                         city_province: result.city_province || prev.city_province,
                         latitude: result.latitude,
                         longitude: result.longitude,
                    }));
                    toast.success('Location updated from map!');
               }
          } catch (err) {
               console.error('Map selection error:', err);
               toast.error('Failed to select location from map.');
          } finally {
               setFetchingLocation(false);
          }
     };

     const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
          setForm(prev => ({ ...prev, [key]: e.target.value }));

     const handleSave = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!form.telephone || !form.address || !form.city_province) {
               toast.error('Telephone, City/Province, and Address are required.');
               return;
          }

          if (!EmailOrPhoneHelper.validatePhone(form.telephone)) {
               toast.error('Please enter a valid telephone number.');
               return;
          }
          const formattedPhone = EmailOrPhoneHelper.formatPhone(form.telephone);

          if (!isLoggedIn) {
               // Local address for guest checkout
               const guestAddress: ShippingAddress = {
                    id: Date.now(),
                    user_id: 0,
                    first_name: form.first_name,
                    last_name: form.last_name,
                    telephone: formattedPhone,
                    address: form.address,
                    city_province: form.city_province,
                    country: form.country,
                    set_as_default: true,
                    latitude: form.latitude,
                    longitude: form.longitude,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
               };
               onSave(guestAddress);
               onClose();
               toast.success('Address set for this order!');
               return;
          }

          setLoading(true);
          try {
               const newAddress = await shippingAddressesService.createAddress({
                    first_name: form.first_name,
                    last_name: form.last_name,
                    telephone: formattedPhone,
                    address: form.address,
                    city_province: form.city_province,
                    country: form.country,
                    set_as_default: false,
                    latitude: form.latitude,
                    longitude: form.longitude,
               });
               onSave(newAddress);
               onClose();
               toast.success('New address saved!');
          } catch (error) {
               toast.error('Failed to save address.');
          } finally {
               setLoading(false);
          }
     };

     return createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
               {/* Backdrop */}
               <div
                    className="absolute inset-0 bg-stone-950/40"
                    onClick={onClose}
               />

               {/* Modal */}
               <div className="relative z-10 bg-white w-full max-w-md rounded-sm shadow-2xl animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4">
                         <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                              Add new address
                         </h2>
                         <button
                              onClick={onClose}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500 transition-colors border-none bg-transparent cursor-pointer"
                         >
                              <FiX className="w-4 h-4 stroke-[2.5]" />
                         </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 pb-6 space-y-4">
                         {/* First & Last name */}
                         <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                        First name
                                   </label>
                                   <input
                                        type="text"
                                        value={form.first_name}
                                        onChange={set('first_name')}
                                        placeholder="Enter first name"
                                        className="w-full px-3 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                                   />
                              </div>
                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                        Last name
                                   </label>
                                   <input
                                        type="text"
                                        value={form.last_name}
                                        onChange={set('last_name')}
                                        placeholder="Enter last name"
                                        className="w-full px-3 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                                   />
                              </div>
                         </div>

                         {/* Phone */}
                         <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                   Telephone <span className="text-red-400">(Required)</span>
                              </label>
                              <div className="flex gap-2">
                                   <div className="flex items-center px-3 py-2.5 border border-stone-200 rounded-[3px] bg-stone-50 text-xs font-black text-stone-700 shrink-0">
                                        + 855
                                   </div>
                                   <input
                                        type="tel"
                                        value={form.telephone}
                                        onChange={set('telephone')}
                                        placeholder="Enter phone number"
                                        className="flex-1 px-3 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                                   />
                              </div>
                         </div>

                         {/* Address */}
                         <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                   <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                        Address <span className="text-red-400">(Required)</span>
                                   </label>
                                   <button
                                        type="button"
                                        onClick={handleAutoGetLocation}
                                        disabled={fetchingLocation}
                                        className="text-[10px] font-bold text-black tracking-wider flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors"
                                   >
                                        <FiMapPin className="w-3.5 h-3.5 animate-pulse" /> Allow Location Auto
                                   </button>
                              </div>
                              <div className="relative">
                                   <input
                                        type="text"
                                        value={form.address}
                                        onChange={set('address')}
                                        placeholder="Enter address or click auto location"
                                        className="w-full pl-3 pr-10 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                                   />
                                   <button
                                        type="button"
                                        onClick={handleAutoGetLocation}
                                        disabled={fetchingLocation}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors"
                                        title="Use Current GPS Location"
                                   >
                                        {fetchingLocation ? (
                                             <span className="w-3.5 h-3.5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                             <FiMapPin className="w-4 h-4 text-stone-500" />
                                        )}
                                   </button>
                              </div>
                         </div>

                         {/* Country + City */}
                         <div className="grid grid-cols-2 gap-3">
                              {/* Country */}
                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                        Country
                                   </label>
                                   <div className="relative">
                                        <select
                                             value={form.country}
                                             onChange={set('country')}
                                             className="w-full appearance-none px-3 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 focus:outline-none focus:border-stone-900 bg-white pr-8 cursor-pointer"
                                        >
                                             <option value="Cambodia">Cambodia</option>
                                        </select>
                                        <FiChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                                   </div>
                              </div>

                              {/* City */}
                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                        City/province <span className="text-red-400">(Required)</span>
                                   </label>
                                   <div className="relative">
                                        <button
                                             type="button"
                                             onClick={() => setCityDropdownOpen(v => !v)}
                                             className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-[3px] text-xs text-left cursor-pointer bg-white transition-colors ${form.city_province ? 'text-stone-800 font-medium' : 'text-stone-300'} ${cityDropdownOpen ? 'border-stone-900' : 'border-stone-200'}`}
                                        >
                                             {form.city_province || '— Select city / province *'}
                                             <FiChevronRight className={`w-3.5 h-3.5 text-stone-400 transition-transform ${cityDropdownOpen ? 'rotate-90' : ''}`} />
                                        </button>
                                        {cityDropdownOpen && (
                                             <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-[3px] shadow-lg z-50 max-h-48 overflow-y-auto">
                                                  {CAMBODIA_CITIES.map(city => (
                                                       <button
                                                            key={city}
                                                            type="button"
                                                            onClick={() => {
                                                                 setForm(p => ({ ...p, city_province: city }));
                                                                 setCityDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 text-xs font-medium cursor-pointer border-none transition-colors ${form.city_province === city ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-50'}`}
                                                       >
                                                            {city}
                                                       </button>
                                                  ))}
                                             </div>
                                        )}
                                   </div>
                              </div>
                         </div>

                         {form.latitude && form.longitude && !isNaN(parseFloat(String(form.latitude))) && !isNaN(parseFloat(String(form.longitude))) && (
                              <div className="w-full h-32 border border-stone-200 rounded-[3px] overflow-hidden mt-1 relative">
                                   <iframe
                                        title="Selected Location Preview"
                                        src={`https://maps.google.com/maps?q=${parseFloat(String(form.latitude))},${parseFloat(String(form.longitude))}&z=15&output=embed`}
                                        className="w-full h-full border-none"
                                        loading="lazy"
                                   />
                                   <div className="absolute top-2 right-2 bg-stone-900/80 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-xs">
                                        Pinned Map Preview
                                   </div>
                              </div>
                         )}

                         {/* Save */}
                         <button
                              onClick={handleSave}
                              disabled={loading}
                              className={`w-full py-3.5 bg-stone-900 hover:bg-stone-850 text-white font-black text-xs uppercase tracking-widest rounded-[3px] border-none cursor-pointer transition-colors mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                         >
                              {loading ? 'Saving...' : 'Save'}
                         </button>
                    </div>
               </div>
          </div>,
          document.body
     );
};
