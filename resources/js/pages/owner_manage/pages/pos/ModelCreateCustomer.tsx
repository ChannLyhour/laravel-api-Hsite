import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiPhone, FiLock, FiLoader } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { customersService, type Customer } from '@/api/owner/customers';
import { Store_setting } from '@/api/owner/stores';

interface ModelCreateCustomerProps {
     isOpen: boolean;
     onClose: () => void;
     onCreated: (customer: Customer) => void;
}

export const ModelCreateCustomer: React.FC<ModelCreateCustomerProps> = ({
     isOpen,
     onClose,
     onCreated
}) => {
     const [displayName, setDisplayName] = useState('');
     const [gender, setGender] = useState('male');
     const [phone, setPhone] = useState('');
     const [password, setPassword] = useState('');
     const [isSaving, setIsSaving] = useState(false);

     // Generate default password when modal opens: 1234@ + store_name (no whitespace, lowercase)
     useEffect(() => {
          if (isOpen) {
               const settings = Store_setting();
               const rawStoreName = settings?.store_name || 'store';
               const cleanStoreName = rawStoreName.replace(/\s+/g, '').toLowerCase();
               setPassword(`1234@${cleanStoreName}`);

               // Reset other fields
               setDisplayName('');
               setGender('male');
               setPhone('');
          }
     }, [isOpen]);

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();

          if (!displayName.trim()) {
               toast.error('Display Name is required');
               return;
          }
          if (!phone.trim()) {
               toast.error('Phone Number is required');
               return;
          }

          setIsSaving(true);
          try {
               const payload = {
                    name: displayName.trim(),
                    gender,
                    phone: phone.trim(),
                    password,
                    first_name: '',
                    last_name: '',
                    email: '',
                    city: '',
                    address: '',
                    country: ''
               };

               const newCustomer = await customersService.createCustomer(payload);
               toast.success(`Customer "${newCustomer.name}" created successfully!`);
               onCreated(newCustomer);
          } catch (err: any) {
               console.error('Failed to create customer:', err);
               toast.error(err?.message || 'Failed to create customer. Please check your inputs.');
          } finally {
               setIsSaving(false);
          }
     };

     if (!isOpen) return null;

     return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 animate-fade-in p-4 font-sans">
               <div
                    className="absolute inset-0 cursor-default"
                    onClick={onClose}
               />

               <div className="relative w-full max-w-md bg-white rounded-[5px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 z-10 animate-scale-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white shrink-0">
                         <div>
                              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                                   <FiUser className="text-primary w-4 h-4" />
                                   Create New Customer
                              </h3>
                              <p className="text-slate-400 text-[10px] font-medium mt-0.5">
                                   Add a new customer profile to the POS database
                              </p>
                         </div>
                         <button
                              onClick={onClose}
                              className="w-8 h-8 flex items-center justify-center rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-500 border-none cursor-pointer transition-colors"
                         >
                              <FiX className="w-4 h-4" />
                         </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">

                         {/* Display Name */}
                         <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-600 block uppercase">
                                   Display Name *
                              </label>
                              <div className="relative">
                                   <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                   <input
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 outline-none focus:border-primary transition-all"
                                        required
                                   />
                              </div>
                         </div>

                         {/* Gender */}
                         <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-600 block uppercase">
                                   Gender *
                              </label>
                              <select
                                   value={gender}
                                   onChange={e => setGender(e.target.value)}
                                   className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 outline-none focus:border-primary transition-all cursor-pointer"
                                   required
                              >
                                   <option value="male">Male</option>
                                   <option value="female">Female</option>
                                   <option value="other">Other</option>
                              </select>
                         </div>

                         {/* Phone Number */}
                         <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-600 block uppercase">
                                   Phone Number *
                              </label>
                              <div className="relative">
                                   <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                   <input
                                        type="tel"
                                        placeholder="e.g. +85512345678"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 outline-none focus:border-primary transition-all"
                                        required
                                   />
                              </div>
                         </div>

                         {/* Password (Defaults to 1234@store_name) */}
                         <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-600 block uppercase">
                                   Password (Default)
                              </label>
                              <div className="relative">
                                   <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                   <input
                                        type="text"
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 outline-none focus:border-primary transition-all"
                                   />
                              </div>
                              <p className="text-[9px] text-slate-400 leading-normal">
                                   Pre-filled default password. Can be changed if needed.
                              </p>
                         </div>

                         {/* Action Footer */}
                         <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
                              <button
                                   type="button"
                                   onClick={onClose}
                                   className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-[5px] font-bold text-xs transition-colors border-none cursor-pointer text-center"
                              >
                                   Cancel
                              </button>
                              <button
                                   type="submit"
                                   disabled={isSaving}
                                   className={`flex-1 text-white py-2.5 rounded-[5px] font-bold text-xs transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 ${isSaving
                                             ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                             : 'bg-primary hover:bg-primary-hover active:scale-98'
                                        }`}
                              >
                                   {isSaving ? (
                                        <FiLoader className="w-3.5 h-3.5 animate-spin" />
                                   ) : null}
                                   <span>{isSaving ? 'Saving...' : 'Create Customer'}</span>
                              </button>
                         </div>

                    </form>
               </div>
          </div>
     );
};
