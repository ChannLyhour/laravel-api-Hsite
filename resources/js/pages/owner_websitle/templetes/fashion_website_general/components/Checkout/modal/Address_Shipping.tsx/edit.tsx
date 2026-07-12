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

interface EditAddressModalProps {
     onClose: () => void;
     onSave: (addr: ShippingAddress) => void;
     isLoggedIn?: boolean;
     addressToEdit: ShippingAddress;
}

export const EditAddressModal: React.FC<EditAddressModalProps> = ({
     onClose,
     onSave,
     isLoggedIn = false,
     addressToEdit,
}) => {
     const formatInitialPhone = (phone: string) => {
          if (!phone) return '';
          let clean = phone.trim();
          clean = clean.replace(/^(\+?855\s*)+/, '');
          if (clean.startsWith('0')) {
               clean = clean.slice(1);
          }
          return clean;
     };

     const [form, setForm] = useState({
          first_name: addressToEdit.first_name || '',
          last_name: addressToEdit.last_name || '',
          telephone: formatInitialPhone(addressToEdit.telephone),
          address: addressToEdit.address || '',
          country: addressToEdit.country || 'Cambodia',
          city_province: addressToEdit.city_province || '',
          latitude: addressToEdit.latitude || null as number | string | null,
          longitude: addressToEdit.longitude || null as number | string | null,
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
                    id: addressToEdit.id,
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
                    created_at: addressToEdit.created_at,
                    updated_at: new Date().toISOString(),
               };
               onSave(guestAddress);
               onClose();
               toast.success('Address updated!');
               return;
          }

          setLoading(true);
          try {
               const updatedAddress = await shippingAddressesService.updateAddress(addressToEdit.id, {
                    first_name: form.first_name,
                    last_name: form.last_name,
                    telephone: formattedPhone,
                    address: form.address,
                    city_province: form.city_province,
                    country: form.country,
                    set_as_default: addressToEdit.set_as_default,
                    latitude: form.latitude,
                    longitude: form.longitude,
               });
               onSave(updatedAddress);
               onClose();
               toast.success('Address updated successfully!');
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
                    className="absolute inset-0 bg-stone-950/30 backdrop-blur-xs"
                    onClick={onClose}
               />

               {/* Modal */}
               <div className="relative z-10 bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-100 animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
                         <h2 className="text-xs font-black text-stone-955 uppercase tracking-widest">
                              Modify Address
                         </h2>
                         <button
                              onClick={onClose}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500 transition-colors border-none bg-transparent cursor-pointer"
                         >
                              <FiX className="w-4 h-4 stroke-[2.5]" />
                         </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                         {/* First & Last name */}
                         <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider block">
                                        First name
                                   </label>
                                   <input
                                        type="text"
                                        value={form.first_name}
                                        onChange={set('first_name')}
                                        placeholder="Enter first name"
                                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-955/10 focus:border-stone-955 transition-all"
                                   />
                              </div>
                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider block">
                                        Last name
                                   </label>
                                   <input
                                        type="text"
                                        value={form.last_name}
                                        onChange={set('last_name')}
                                        placeholder="Enter last name"
                                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-955/10 focus:border-stone-955 transition-all"
                                   />
                              </div>
                         </div>

                         {/* Phone */}
                         <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider block">
                                   Telephone <span className="text-red-400">(Required)</span>
                              </label>
                              <div className="flex gap-2">
                                   <div className="flex items-center px-4 py-3 border border-stone-200 rounded-xl bg-stone-50 text-xs font-black text-stone-700 shrink-0">
                                        + 855
                                   </div>
                                   <input
                                        type="tel"
                                        value={form.telephone}
                                        onChange={set('telephone')}
                                        placeholder="Enter phone number"
                                        className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-955/10 focus:border-stone-955 transition-all"
                                   />
                              </div>
                         </div>

                         {/* Address */}
                         <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                   <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider block">
                                        Address <span className="text-red-400">(Required)</span>
                                   </label>
                                   <button
                                        type="button"
                                        onClick={handleAutoGetLocation}
                                        disabled={fetchingLocation}
                                        className="text-[10px] font-black text-stone-955 tracking-wider flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors"
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
                                        className="w-full pl-4 pr-10 py-3 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-955/10 focus:border-stone-955 transition-all"
                                   />
                                   <button
                                        type="button"
                                        onClick={handleAutoGetLocation}
                                        disabled={fetchingLocation}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-450 border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors"
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
                                   <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider block">
                                        Country
                                   </label>
                                   <div className="relative">
                                        <select
                                             value={form.country}
                                             onChange={set('country')}
                                             className="w-full appearance-none px-4 py-3 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-955/10 focus:border-stone-955 bg-white pr-8 cursor-pointer"
                                        >
                                             <option value="Cambodia">Cambodia</option>
                                        </select>
                                        <FiChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                                   </div>
                              </div>

                              {/* City */}
                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider block">
                                        City/province <span className="text-red-400">(Required)</span>
                                   </label>
                                   <div className="relative">
                                        <button
                                             type="button"
                                             onClick={() => setCityDropdownOpen(v => !v)}
                                             className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-xs text-left cursor-pointer bg-white transition-all ${form.city_province ? 'text-stone-900 font-semibold' : 'text-stone-300'} ${cityDropdownOpen ? 'border-stone-955 ring-2 ring-stone-955/10' : 'border-stone-200'}`}
                                        >
                                             {form.city_province || '— Select *'}
                                             <FiChevronRight className={`w-3.5 h-3.5 text-stone-400 transition-transform ${cityDropdownOpen ? 'rotate-90' : ''}`} />
                                        </button>
                                        {cityDropdownOpen && (
                                             <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                                                  {CAMBODIA_CITIES.map(city => (
                                                       <button
                                                            key={city}
                                                            type="button"
                                                            onClick={() => {
                                                                 setForm(p => ({ ...p, city_province: city }));
                                                                 setCityDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2 text-xs font-semibold cursor-pointer border-none transition-colors ${form.city_province === city ? 'bg-stone-955 text-white' : 'bg-white text-stone-700 hover:bg-stone-50'}`}
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
                              <div className="w-full h-32 border border-stone-200 rounded-2xl overflow-hidden mt-1 relative">
                                   <iframe
                                        title="Selected Location Preview"
                                        src={`https://maps.google.com/maps?q=${parseFloat(String(form.latitude))},${parseFloat(String(form.longitude))}&z=15&output=embed`}
                                        className="w-full h-full border-none"
                                        loading="lazy"
                                   />
                                   <div className="absolute top-2 right-2 bg-stone-955/80 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-xs">
                                        Pinned Map Preview
                                   </div>
                              </div>
                         )}

                         {/* Save */}
                         <button
                              onClick={handleSave}
                              disabled={loading}
                              className={`w-full py-3.5 bg-stone-955 hover:bg-stone-900 active:scale-[0.98] text-white font-black text-xs uppercase tracking-widest rounded-xl border-none cursor-pointer transition-all mt-2 shadow-[0_4px_14px_rgba(0,0,0,0.15)] ${loading ? 'opacity-70 cursor-not-allowed shadow-none' : ''}`}
                         >
                              {loading ? 'Saving...' : 'Apply Changes'}
                         </button>
                    </div>
               </div>
          </div>,
          document.body
     );
};
