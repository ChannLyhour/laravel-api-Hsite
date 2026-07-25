import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiUser } from 'react-icons/fi';
import { customersService, type Customer, type UpdateCustomerPayload } from '@/api/owner/customers';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';

interface CustomerEditPageProps {
     onClose: () => void;
     customer: Customer;
     onSave: (customer: Customer) => void;
}

export const CustomerEditPage: React.FC<CustomerEditPageProps> = ({
     onClose,
     customer,
     onSave,
}) => {
     const [formData, setFormData] = useState<UpdateCustomerPayload>({
          name: '',
          first_name: '',
          last_name: '',
          gender: 'male',
          country: 'Cambodia',
          email: '',
          phone: '',
          address: '',
          city: '',
     });
     const [saving, setSaving] = useState(false);

     useEffect(() => {
          if (customer) {
               setFormData({
                    name: customer.name || '',
                    first_name: customer.first_name || '',
                    last_name: customer.last_name || '',
                    gender: customer.gender || 'male',
                    country: customer.country || 'Cambodia',
                    email: customer.email || '',
                    phone: customer.phone || '',
                    address: customer.address || '',
                    city: customer.city || '',
               });
          }
     }, [customer]);

     if (!customer) return null;

     const handleSave = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!formData.name?.trim() && !(formData.first_name && formData.last_name)) return;

          // Ensure name is populated if not explicitly provided
          const finalPayload = { ...formData };
          if (!finalPayload.name?.trim() && finalPayload.first_name && finalPayload.last_name) {
               finalPayload.name = `${finalPayload.first_name} ${finalPayload.last_name}`;
          }

          setSaving(true);
          try {
               const updated = await customersService.updateCustomer(customer.id, finalPayload);
               toast.success(`Customer "${updated.name}" updated!`);
               onSave(updated);
               onClose();
          } catch (err) {
               console.error(err);
               if (err instanceof ApiError) {
                    toast.error(err.details.message || 'Failed to save customer.');
               } else {
                    toast.error('Failed to save customer.');
               }
          } finally {
               setSaving(false);
          }
     };

     const avatarUrl = customer.image ? resolveImageUrl(customer.image) : null;

     return (
          <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 pb-10 w-full">
               {/* ── HEADER NAVIGATION ─────────────────────────────── */}
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100 pb-5">
                    <div className="flex items-center space-x-3">
                         <button
                              onClick={onClose}
                              className="p-2 border border-slate-200 rounded-[5px] hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-2xs"
                              title="Back to customers list"
                         >
                              <FiArrowLeft className="w-5 h-5 stroke-[2.5]" />
                         </button>
                         <div>
                              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
                                   <FiUser className="text-primary" />
                                   <span>Edit Customer Profile</span>
                              </h2>
                              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                   Modify personal details, location preferences, and contact information for this customer.
                              </p>
                         </div>
                    </div>
               </div>

               {/* ── TWO COLUMN MAIN LAYOUT ────────────────────────────── */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
                    {/* Left Column (1/3 width) - Profile Preview Card */}
                    <div className="bg-white border border-slate-100 rounded-[5px] p-6 shadow-xs text-center space-y-4 animate-fade-in">
                         <div className="flex justify-center">
                              <div className="w-24 h-24 rounded-[16px] overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-4xl shadow-sm shrink-0">
                                   {avatarUrl ? (
                                        <img
                                             src={avatarUrl}
                                             alt={formData.name || 'Preview'}
                                             className="w-full h-full object-cover"
                                             onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                  if (fallback) fallback.style.display = 'flex';
                                             }}
                                        />
                                   ) : null}
                                   <span className="w-full h-full flex items-center justify-center" style={{ display: avatarUrl ? 'none' : 'flex' }}>
                                        {formData.name ? formData.name.charAt(0).toUpperCase() : <FiUser className="w-12 h-12" />}
                                   </span>
                              </div>
                         </div>

                         <div className="space-y-1">
                              <h4 className="font-extrabold text-slate-800 text-lg">
                                   {formData.first_name || formData.last_name
                                        ? `${formData.first_name || ''} ${formData.last_name || ''}`.trim()
                                        : formData.name || 'New Customer'}
                              </h4>
                              <p className="text-slate-400 text-xs font-semibold truncate max-w-[200px] mx-auto">
                                   {formData.email || 'No email address'}
                              </p>
                         </div>

                         <div className="flex justify-center gap-2 pt-2 border-t border-slate-50">
                              {formData.gender && (
                                   <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600 capitalize">
                                        {formData.gender}
                                   </span>
                              )}
                              {formData.country && (
                                   <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600">
                                        {formData.country}
                                   </span>
                              )}
                         </div>
                    </div>

                    {/* Right Column (2/3 width) - Form Container */}
                    <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[5px] p-6 sm:p-8 shadow-xs">
                         <h3 className="font-extrabold text-slate-800 text-sm sm:text-base border-b border-slate-50 pb-3 mb-6">
                              Customer Profile Summary
                         </h3>
                         <form onSubmit={handleSave} className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">
                                             First Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                             type="text"
                                             required
                                             value={formData.first_name || ''}
                                             onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                             placeholder="John"
                                             className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
                                        />
                                   </div>
                                   <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">
                                             Last Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                             type="text"
                                             required
                                             value={formData.last_name || ''}
                                             onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                             placeholder="Doe"
                                             className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
                                        />
                                   </div>
                              </div>

                              <div className="space-y-1.5">
                                   <label className="text-xs font-bold text-slate-700 block">
                                        Full Display Name (Auto-generated if empty)
                                   </label>
                                   <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. John Doe"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
                                   />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">Gender</label>
                                        <select
                                             value={formData.gender || 'male'}
                                             onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                             className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
                                        >
                                             <option value="male">Male</option>
                                             <option value="female">Female</option>
                                             <option value="other">Other</option>
                                        </select>
                                   </div>
                                   <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">Country</label>
                                        <select
                                             value={formData.country || 'Cambodia'}
                                             onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                             className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
                                        >
                                             <option value="Cambodia">Cambodia</option>
                                             <option value="Vietnam">Vietnam</option>
                                             <option value="USA">USA</option>
                                             <option value="Other">Other</option>
                                        </select>
                                   </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">Email</label>
                                        <input
                                             type="email"
                                             value={formData.email || ''}
                                             onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                             placeholder="john@example.com"
                                             className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
                                        />
                                   </div>
                                   <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">Phone</label>
                                        <input
                                             type="text"
                                             value={formData.phone || ''}
                                             onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                             placeholder="+855 12 345 678"
                                             className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
                                        />
                                   </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">City</label>
                                        <input
                                             type="text"
                                             value={formData.city || ''}
                                             onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                             placeholder="e.g. Phnom Penh"
                                             className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
                                        />
                                   </div>
                                   <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">Address</label>
                                        <input
                                             type="text"
                                             value={formData.address || ''}
                                             onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                             placeholder="Street address"
                                             className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 bg-white"
                                        />
                                   </div>
                              </div>

                              <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-100">
                                   <button
                                        type="button"
                                        onClick={onClose}
                                        className="py-2.5 px-5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-xs font-bold transition-all border border-slate-200/50 cursor-pointer min-w-[100px]"
                                   >
                                        Cancel
                                   </button>
                                   <button
                                        type="submit"
                                        disabled={saving || (!formData.name?.trim() && !(formData.first_name?.trim() && formData.last_name?.trim()))}
                                        className="py-2.5 px-6 bg-primary hover:bg-primary-hover text-white rounded-[5px] text-xs font-black transition-all flex items-center justify-center space-x-1.5 border-none cursor-pointer disabled:opacity-50 select-none min-w-[140px]"
                                   >
                                        {saving ? (
                                             <>
                                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                                  <span>Saving...</span>
                                             </>
                                        ) : (
                                             <span>Update Customer</span>
                                        )}
                                   </button>
                              </div>
                         </form>
                    </div>
               </div>
          </div>
     );
};
