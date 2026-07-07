import React, { useState } from 'react';
import { FiUser, FiMail, FiLock, FiMapPin, FiShoppingBag, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { client } from '@/api/client';
import { toast } from 'react-hot-toast';
import { TypeStore } from '../typeStore/typeStore';

interface StoreRegisterProps {
     onNavigate: (to: string) => void;
}

export const StoreRegister: React.FC<StoreRegisterProps> = ({ onNavigate }) => {
     const [step, setStep] = useState(1);
     const [loading, setLoading] = useState(false);
     const [registeredUser, setRegisteredUser] = useState<{ id: number | string; token: string } | null>(null);

     // Form Fields
     const [firstName, setFirstName] = useState('');
     const [lastName, setLastName] = useState('');
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');

     const [storeName, setStoreName] = useState('');
     const [storeAddress, setStoreAddress] = useState('');

     // Get initial tier from URL query parameters
     const getInitialTier = () => {
          const params = new URLSearchParams(window.location.search);
          const tier = params.get('tier')?.toLowerCase();
          if (tier && ['free', 'basic', 'standard', 'premium'].includes(tier)) {
               return tier;
          }
          return 'free';
     };

     const [selectedTier, setSelectedTier] = useState<string>(getInitialTier);

     // Field validation
     const validateStep1 = () => {
          if (!firstName.trim() || !lastName.trim()) {
               toast.error('First and last name are required.');
               return false;
          }
          if (!email.trim() || !email.includes('@')) {
               toast.error('Valid owner email is required.');
               return false;
          }
          if (password.length < 6) {
               toast.error('Password must be at least 6 characters.');
               return false;
          }
          return true;
     };

     const validateStep2 = () => {
          if (!storeName.trim()) {
               toast.error('Store name is required.');
               return false;
          }
          return true;
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!validateStep2()) return;

          setLoading(true);

          try {
               // Single atomic endpoint: creates owner user + store settings together
               const res = await client.post<any>('/register-owner', {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    email,
                    password,
                    store_name: storeName.trim(),
                    store_address: storeAddress.trim() || null,
                    subscription_tier: selectedTier,
                    country: 'Cambodia',
               });

               const token = res?.token;
               const newUserId = res?.user?.id;
               if (!token || !newUserId) {
                    throw new Error('Registration succeeded, but token or user details were missing.');
               }

               // Log the user in locally
               localStorage.setItem('admin_token', token);
               localStorage.setItem('selected_owner_id', String(newUserId));

               toast.success('Registration successful! Now select your store type.');
               setRegisteredUser({ id: newUserId, token: token });

          } catch (err: any) {
               localStorage.removeItem('admin_token');
               const errMsg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Failed to complete registration.';
               toast.error(errMsg);
          } finally {
               setLoading(false);
          }
     };

     if (registeredUser) {
          return (
               <TypeStore
                    ownerId={registeredUser.id}
                    token={registeredUser.token}
                    onComplete={() => {
                         window.location.href = '/owner';
                    }}
               />
          );
     }

     return (
          <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-slate-50 relative overflow-hidden">
               {/* Background Accent Gradients */}
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] -z-10" />
               <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -z-10" />

               <div className="w-full max-w-2xl bg-white/80 backdrop-blur-2xl rounded-[5px] border border-slate-200 p-8 sm:p-14 shadow-2xl z-10">

                    {/* Progress Tracker */}
                    <div className="flex items-center justify-between mb-12 pb-6 border-b border-slate-200">
                         <div className="flex items-center space-x-4">
                              <span className={`w-9 h-9 rounded-[5px] flex items-center justify-center text-xs font-black transition-all ${step === 1 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-emerald-500 text-slate-950'
                                   }`}>
                                   {step > 1 ? <FiCheck className="w-5 h-5" /> : '1'}
                              </span>
                              <span className={`text-xs font-black tracking-widest uppercase transition-colors ${step === 1 ? 'text-slate-900' : 'text-slate-500'
                                   }`}>
                                   Owner Profile
                              </span>
                         </div>

                         <div className="h-px flex-1 bg-slate-200 mx-6" />

                         <div className="flex items-center space-x-4">
                              <span className={`w-9 h-9 rounded-[5px] flex items-center justify-center text-xs font-black transition-all ${step === 2 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-200 text-slate-500'
                                   }`}>
                                   2
                              </span>
                              <span className={`text-xs font-black tracking-widest uppercase transition-colors ${step === 2 ? 'text-slate-900' : 'text-slate-500'
                                   }`}>
                                   Store Outlet
                              </span>
                         </div>
                    </div>

                    {/* Section Header */}
                    <div className="mb-10">
                         <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                              {step === 1 ? 'Elite Registration' : 'Configure Outlet'}
                         </h2>
                         <p className="text-slate-600 text-sm mt-3 font-medium">
                              {step === 1
                                   ? 'Create your administrative credentials for the Prime Website ecosystem.'
                                   : 'Setup the storefront details that will represent your brand on the Prime platform.'}
                         </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (validateStep1()) setStep(2); } : handleSubmit} className="space-y-6">

                         {step === 1 ? (
                              /* ================= STEP 1: OWNER USER ACCOUNT ================= */
                              <div className="space-y-5 animate-fade-in">

                                   <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                                                  First Name <span className="text-amber-500">*</span>
                                             </label>
                                             <div className="relative group">
                                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                                       <FiUser className="w-4 h-4" />
                                                  </div>
                                                  <input
                                                       type="text"
                                                       required
                                                       placeholder="e.g. Chann"
                                                       value={firstName}
                                                       onChange={(e) => setFirstName(e.target.value)}
                                                       className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-[5px] text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none transition-all"
                                                  />
                                             </div>
                                        </div>
                                        <div className="space-y-2">
                                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                                                  Last Name <span className="text-amber-500">*</span>
                                             </label>
                                             <div className="relative group">
                                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-550 transition-colors">
                                                       <FiUser className="w-4 h-4" />
                                                  </div>
                                                  <input
                                                       type="text"
                                                       required
                                                       placeholder="e.g. Lyhour"
                                                       value={lastName}
                                                       onChange={(e) => setLastName(e.target.value)}
                                                       className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-[5px] text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none transition-all"
                                                  />
                                             </div>
                                        </div>
                                   </div>

                                   <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                                             Email Address
                                        </label>
                                        <div className="relative group">
                                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                                  <FiMail className="w-4 h-4" />
                                             </div>
                                             <input
                                                  type="email"
                                                  required
                                                  placeholder="owner@prime-website.com"
                                                  value={email}
                                                  onChange={(e) => setEmail(e.target.value)}
                                                  className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-[5px] text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none transition-all"
                                             />
                                        </div>
                                   </div>

                                   <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                                             Secure Password
                                        </label>
                                        <div className="relative group">
                                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                                  <FiLock className="w-4 h-4" />
                                             </div>
                                             <input
                                                  type="password"
                                                  required
                                                  placeholder="••••••••••••"
                                                  value={password}
                                                  onChange={(e) => setPassword(e.target.value)}
                                                  className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-[5px] text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none transition-all"
                                             />
                                        </div>
                                   </div>

                                   <button
                                        type="submit"
                                        className="w-full mt-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-955 font-black text-sm rounded-[5px] transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98] duration-150 flex items-center justify-center space-x-2 border-none cursor-pointer uppercase tracking-widest"
                                   >
                                        <span>Continue Configuration</span>
                                        <FiArrowRight className="w-5 h-5" />
                                   </button>

                              </div>
                         ) : (
                              <div className="space-y-5 animate-fade-in">

                                   <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                                             Brand / Store Name
                                        </label>
                                        <div className="relative group">
                                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-550 transition-colors">
                                                  <FiShoppingBag className="w-4 h-4" />
                                             </div>
                                             <input
                                                  type="text"
                                                  required
                                                  placeholder="e.g. Prime Gourmet"
                                                  value={storeName}
                                                  onChange={(e) => setStoreName(e.target.value)}
                                                  className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-[5px] text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none transition-all"
                                             />
                                        </div>
                                   </div>

                                   <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                                             Physical Location
                                        </label>
                                        <div className="relative group">
                                             <div className="absolute top-4 left-4 pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                                  <FiMapPin className="w-4 h-4" />
                                             </div>
                                             <textarea
                                                  rows={3}
                                                  placeholder="Full street address..."
                                                  value={storeAddress}
                                                  onChange={(e) => setStoreAddress(e.target.value)}
                                                  className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-[5px] text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none resize-none transition-all"
                                             />
                                        </div>
                                   </div>

                                   <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                                             Subscription Tier
                                        </label>
                                        <select
                                             value={selectedTier}
                                             onChange={(e) => setSelectedTier(e.target.value)}
                                             className="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-[5px] text-sm font-bold text-slate-900 focus:border-amber-500/50 focus:bg-white focus:outline-none appearance-none cursor-pointer transition-all"
                                        >
                                             <option value="free" className="bg-white text-slate-900">Free Tier (Standard features)</option>
                                             <option value="basic" className="bg-white text-slate-900">Basic Tier ($3.99/mo)</option>
                                             <option value="standard" className="bg-white text-slate-900">Standard Tier ($5.99/mo)</option>
                                             <option value="premium" className="bg-white text-slate-900">Premium Tier ($9.99/mo - Custom Domain)</option>
                                        </select>
                                   </div>

                                   <div className="flex space-x-4 pt-4">
                                        <button
                                             type="button"
                                             onClick={() => setStep(1)}
                                             className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-[5px] transition-all active:scale-[0.98] duration-150 flex items-center justify-center space-x-2 border-none cursor-pointer uppercase tracking-widest"
                                        >
                                             <FiArrowLeft className="w-4 h-4" />
                                             <span>Back</span>
                                        </button>

                                        <button
                                             type="submit"
                                             disabled={loading}
                                             className="flex-[2] py-4 bg-amber-500 hover:bg-amber-400 text-slate-955 font-black text-xs rounded-[5px] transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] duration-150 flex items-center justify-center space-x-2 border-none cursor-pointer uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                             {loading ? (
                                                  <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                                             ) : (
                                                  <>
                                                       <span>Finalize Onboarding</span>
                                                       <FiCheck className="w-5 h-5" />
                                                  </>
                                             )}
                                        </button>
                                   </div>

                              </div>
                         )}

                    </form>

                    <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                         <p className="text-sm font-bold text-slate-500">
                              Already registered?{' '}
                              <button
                                   onClick={() => onNavigate('/owner/login')}
                                   className="text-amber-500 hover:text-amber-400 font-black transition-colors border-none bg-transparent cursor-pointer ml-1"
                              >
                                   Sign In to Workspace
                              </button>
                         </p>
                    </div>

               </div>
          </div>
     );
};
