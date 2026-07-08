import React, { useState } from 'react';
import { saveStoreType } from '../api';
import { toast } from 'react-hot-toast';
import { runAutoSetup } from '../../owner_manage/helper/auto/autoSetup';

interface TypeStoreProps {
     ownerId: number | string;
     token: string;
     onComplete: () => void;
}

interface StoreTypeOption {
     id: string;
     title: string;
     subtitle: string;
     icon: React.ReactNode;
}

export const TypeStore: React.FC<TypeStoreProps> = ({ ownerId, token, onComplete }) => {
     const [selectedType, setSelectedType] = useState<string>('restaurant');
     const [loading, setLoading] = useState(false);

     const storeTypes: StoreTypeOption[] = [
          {
               id: 'restaurant',
               title: 'Restaurant',
               subtitle: 'Dine-in, takeaway & delivery',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
               )
          },
          {
               id: 'cafe',
               title: 'Cafe / Coffee Shop',
               subtitle: 'Coffee, tea & light food',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
                    </svg>
               )
          },
          {
               id: 'bakery',
               title: 'Bakery',
               subtitle: 'Bread, pastries & cakes',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12c0-3.328 1.62-6.277 4.116-8.084C7.545 3.327 9.535 2 12 2z" />
                         <path d="M12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                    </svg>
               )
          },
          {
               id: 'fast_food',
               title: 'Fast Food',
               subtitle: 'Quick-serve meals & combos',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <path d="M2 10.5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1.5a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-1.5z" />
                         <path d="M6 9.5a6 6 0 0 1 12 0v0H6v0z" />
                         <path d="M5 16h14a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2z" />
                    </svg>
               )
          },
          {
               id: 'bar',
               title: 'Bar / Pub',
               subtitle: 'Drinks, cocktails & bar food',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <path d="M22 2H2v3l8 8v7H6v2h12v-2h-4v-7l8-8V2zM12 11L5.3 4.3h13.4L12 11z" />
                    </svg>
               )
          },
          {
               id: 'fashion',
               title: 'Fashion',
               subtitle: 'Clothing, shoes & accessories',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <path d="M20.37 8.91l-7.37-5.5a1 1 0 0 0-1.2 0l-7.37 5.5a1 1 0 0 0-.39.8V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.71a1 1 0 0 0-.39-.8z" />
                         <path d="M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    </svg>
               )
          },
          {
               id: 'electronics',
               title: 'Electronics',
               subtitle: 'Gadgets, phones & accessories',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                         <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
               )
          },
          {
               id: 'beauty',
               title: 'Beauty',
               subtitle: 'Cosmetics, skincare & fragrance',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <path d="M12 2a5 5 0 0 1 5 5v3H7V7a5 5 0 0 1 5-5z" />
                         <rect x="5" y="10" width="14" height="12" rx="2" />
                    </svg>
               )
          },
          {
               id: 'gifts',
               title: 'Gifts & Lifestyle',
               subtitle: 'Gifts, crafts & lifestyle goods',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <rect x="3" y="8" width="18" height="13" rx="2" />
                         <rect x="2" y="4" width="20" height="4" rx="1" />
                         <line x1="12" y1="4" x2="12" y2="21" />
                         <path d="M12 4a3 3 0 1 0-3-3M12 4a3 3 0 1 1 3-3" />
                    </svg>
               )
          },
          {
               id: 'supermarket',
               title: 'Supermarket',
               subtitle: 'Large selection of groceries',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <circle cx="9" cy="21" r="1" />
                         <circle cx="20" cy="21" r="1" />
                         <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
               )
          },
          {
               id: 'minimart',
               title: 'Mini-mart',
               subtitle: 'Small convenience store',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                         <rect x="9" y="14" width="6" height="8" />
                    </svg>
               )
          },
          {
               id: 'handmade',
               title: 'Handmade',
               subtitle: 'Handmade & artisan products',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                         <path d="M12 6v6M12 12l4 4M12 12L8 16" />
                    </svg>
               )
          },
          {
               id: 'digital',
               title: 'Digital Products',
               subtitle: 'Digital goods & downloads',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
               )
          },
          {
               id: 'service_other',
               title: 'Service / Other',
               subtitle: 'Handmade, digital or bookings',
               icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                         <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                         <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
               )
          }
     ];

     const handleFinish = async () => {
          setLoading(true);
          try {
               // Save store type to database settings
               await saveStoreType(selectedType, token);

               // Run auto-setup helper to seed static categories and attributes
               const setupToast = toast.loading('Initializing workspace settings & seeding category structures...');
               try {
                    await runAutoSetup(selectedType, token, ownerId);
                    toast.success('Workspace populated with default settings!', { id: setupToast });
               } catch (setupErr) {
                    console.error('Failed to run store auto-setup:', setupErr);
                    toast.error('Workspace created, but failed to seed defaults.', { id: setupToast });
               }

               // Update local storage settings Cache
               const storeSettingsRaw = localStorage.getItem("store_settings");
               if (storeSettingsRaw) {
                    const storeSettings = JSON.parse(storeSettingsRaw);
                    storeSettings.store_type = selectedType;
                    localStorage.setItem("store_settings", JSON.stringify(storeSettings));
               }

               toast.success('Store type updated successfully!');
               onComplete();
          } catch (err: any) {
               const errMsg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Failed to set store type.';
               toast.error(errMsg);
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden font-kuntomruy">
               {/* Background Accent Gradients */}
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] -z-10" />
               <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -z-10" />

               <div className="w-full max-w-4xl bg-white/85 backdrop-blur-2xl rounded-[16px] border border-slate-200 p-8 sm:p-12 shadow-2xl z-10">

                    {/* Header Texts */}
                    <div className="text-center mb-10 max-w-2xl mx-auto">
                         <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-normal">
                              តើអាជីវកម្មរបស់អ្នកជាប្រភេទអ្វី?
                         </h2>
                         <p className="text-slate-500 text-sm mt-3 font-semibold leading-relaxed">
                              យើងនឹងបង្កើតប្រភេទ និងជម្រើសបញ្ជាទិញដែលត្រឹមត្រូវជូនអ្នកដោយស្វ័យប្រវត្ត។ អ្នកអាចកែប្រែពេលក្រោយបាន។
                         </p>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                         {storeTypes.map((option) => {
                              const isSelected = selectedType === option.id;
                              return (
                                   <div
                                        key={option.id}
                                        onClick={() => setSelectedType(option.id)}
                                        className={`flex items-start gap-4 p-5 rounded-[12px] border-2 cursor-pointer transition-all duration-300 select-none ${isSelected
                                                  ? 'border-rose-500 bg-rose-50/5 shadow-md shadow-rose-500/5'
                                                  : 'border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                                             }`}
                                   >
                                        {/* Icon Container */}
                                        <div className={`p-2.5 rounded-[8px] shrink-0 ${isSelected ? 'text-rose-500 bg-rose-50' : 'text-slate-400 bg-slate-50'
                                             }`}>
                                             {option.icon}
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-1 text-left">
                                             <h4 className="text-sm font-black text-slate-800 tracking-tight">
                                                  {option.title}
                                             </h4>
                                             <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                                                  {option.subtitle}
                                             </p>
                                        </div>
                                   </div>
                              );
                         })}
                    </div>

                    {/* Submit Button */}
                    <div className="max-w-md mx-auto">
                         <button
                              onClick={handleFinish}
                              disabled={loading}
                              className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold text-sm sm:text-base rounded-[10px] shadow-lg shadow-orange-500/25 active:scale-[0.98] duration-150 flex items-center justify-center gap-2 border-none cursor-pointer uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              {loading ? (
                                   <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                   <>
                                        <span>🚀 បង្កើតហាងរបស់ខ្ញុំ</span>
                                   </>
                              )}
                         </button>
                    </div>

               </div>
          </div>
     );
};
