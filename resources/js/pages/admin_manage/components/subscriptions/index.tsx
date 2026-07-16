import React, { useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export interface PlanFeatures {
     free: string[];
     basic: string[];
     standard: string[];
     premium: string[];
}

export const defaultPlanFeatures: PlanFeatures = {
     free: [
          'Products Limit:10 Products',
          'Categories Limit:2 Categories',
          'Orders Limit:10 Orders/mo',
          'Staff Limit:0 Staff',
          'Online Ordering',
          'Customer Reviews',
          'QR Payment',
     ],
     basic: [
          'Products Limit:35 Products',
          'Categories Limit:4 Categories',
          'Orders Limit:Unlimited Orders/mo',
          'Staff Limit:Unlimited Staff',
          'Online Ordering',
          'Customer Reviews',
          'Reservations',
          'Analytics & Reports',
          'QR Payment',
     ],
     standard: [
          'Products Limit:150 Products',
          'Categories Limit:10 Categories',
          'Orders Limit:Unlimited Orders/mo',
          'Staff Limit:Unlimited Staff',
          'Online Ordering',
          'Customer Reviews',
          'Reservations',
          'Analytics & Reports',
          'Delivery Zones',
          'Coupons & Discounts',
          'QR Payment',
          'Staff Accounts',
          'POS System',
     ],
     premium: [
          'Products Limit:Unlimited Products',
          'Categories Limit:Unlimited Categories',
          'Orders Limit:Unlimited Orders/mo',
          'Staff Limit:Unlimited Staff',
          'Online Ordering',
          'Customer Reviews',
          'Reservations',
          'Analytics & Reports',
          'Delivery Zones',
          'Coupons & Discounts',
          'QR Payment',
          'Email Campaigns',
          'Loyalty Program',
          'Custom Domain',
          'Inventory Management',
          'Staff Accounts',
          'POS System',
          'Customer Live Chat',
     ],
};

export const allFeaturesConfig = [
     { key: 'Products Limit', label: 'Products Limit', type: 'select', options: ['10 Products', '35 Products', '150 Products', 'Unlimited Products'] },
     { key: 'Categories Limit', label: 'Categories Limit', type: 'select', options: ['2 Categories', '4 Categories', '10 Categories', 'Unlimited Categories'] },
     { key: 'Orders Limit', label: 'Orders Limit', type: 'select', options: ['10 Orders/mo', 'Unlimited Orders/mo'] },
     { key: 'Staff Limit', label: 'Staff Limit', type: 'select', options: ['0 Staff', 'Unlimited Staff'] },
     { key: 'Online Ordering', label: 'Online Ordering', type: 'toggle' },
     { key: 'Customer Reviews', label: 'Customer Reviews', type: 'toggle' },
     { key: 'Reservations', label: 'Reservations', type: 'toggle' },
     { key: 'Analytics & Reports', label: 'Analytics & Reports', type: 'toggle' },
     { key: 'Delivery Zones', label: 'Delivery Zones', type: 'toggle' },
     { key: 'Coupons & Discounts', label: 'Coupons & Discounts', type: 'toggle' },
     { key: 'QR Payment', label: 'QR Payment', type: 'toggle' },
     { key: 'Email Campaigns', label: 'Email Campaigns', type: 'toggle' },
     { key: 'Loyalty Program', label: 'Loyalty Program', type: 'toggle' },
     { key: 'Custom Domain', label: 'Custom Domain', type: 'toggle' },
     { key: 'Inventory Management', label: 'Inventory Management', type: 'toggle' },
     { key: 'Staff Accounts', label: 'Staff Accounts', type: 'toggle' },
     { key: 'POS System', label: 'POS System', type: 'toggle' },
     { key: 'Customer Live Chat', label: 'Customer Live Chat', type: 'toggle' },
];

interface SubscriptionsTabProps {
     planFeatures: PlanFeatures;
     setPlanFeatures: React.Dispatch<React.SetStateAction<PlanFeatures>>;
     planPrices?: Record<string, number>;
     setPlanPrices?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ 
     planFeatures, 
     setPlanFeatures,
     planPrices,
     setPlanPrices
}) => {
     const [activePlanTab, setActivePlanTab] = useState<'free' | 'basic' | 'standard' | 'premium'>('free');

     const getFeatureValue = (plan: 'free' | 'basic' | 'standard' | 'premium', key: string) => {
          const found = planFeatures[plan]?.find(f => f.startsWith(key + ':'));
          return found ? found.split(':')[1] : '';
     };

     const handleToggleFeature = (plan: 'free' | 'basic' | 'standard' | 'premium', key: string) => {
          const list = [...(planFeatures[plan] || [])];
          const index = list.findIndex(f => f === key || f.startsWith(key + ':'));

          if (index > -1) {
               list.splice(index, 1);
               toast.error(`Feature "${key}" disabled for ${plan.toUpperCase()} tier.`);
          } else {
               list.push(key);
               toast.success(`Feature "${key}" enabled for ${plan.toUpperCase()} tier.`);
          }

          setPlanFeatures({ ...planFeatures, [plan]: list });
     };

     const handleSelectFeatureValue = (plan: 'free' | 'basic' | 'standard' | 'premium', key: string, val: string) => {
          const list = [...(planFeatures[plan] || [])];
          const index = list.findIndex(f => f.startsWith(key + ':'));
          const entry = `${key}:${val}`;

          if (index > -1) {
               list[index] = entry;
          } else {
               list.push(entry);
          }

          setPlanFeatures({ ...planFeatures, [plan]: list });
          toast.success(`Updated ${key} to "${val}" for ${plan.toUpperCase()} tier.`);
     };

     return (
          <div className="space-y-6">
               {/* Dynamic Plan Prices Configurator */}
               {planPrices && setPlanPrices && (
                    <div className="bg-white p-6 rounded-[5px] border border-slate-200/60 shadow-sm max-w-xl space-y-4">
                         <div>
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Plan Pricing Configuration</h3>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Modify pricing values for each subscription plan. Auto-saves to database.</p>
                         </div>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {(['free', 'basic', 'standard', 'premium'] as const).map(p => (
                                   <div key={p} className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">{p} Price ($)</label>
                                        <input
                                             type="number"
                                             min="0"
                                             step="0.01"
                                             value={planPrices[p] !== undefined ? planPrices[p] : 0}
                                             onChange={(e) => {
                                                  const val = parseFloat(e.target.value);
                                                  setPlanPrices(prev => ({
                                                       ...prev,
                                                       [p]: isNaN(val) ? 0 : val
                                                  }));
                                             }}
                                             className="w-full bg-slate-50 border border-slate-200 rounded-[5px] px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary"
                                        />
                                   </div>
                              ))}
                         </div>
                    </div>
               )}

               {/* Plan Tabs Selector */}
               <div className="flex space-x-1 bg-white p-1 rounded-[5px] border border-slate-200/60 shadow-sm max-w-md">
                    {(['free', 'basic', 'standard', 'premium'] as const).map(p => (
                         <button
                              key={p}
                              onClick={() => setActivePlanTab(p)}
                              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-[5px] transition-all cursor-pointer border-none ${activePlanTab === p
                                   ? 'bg-primary text-white shadow-sm'
                                   : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                   }`}
                         >
                              {p}
                         </button>
                    ))}
               </div>

               {/* Checklist details matching uploaded screenshot */}
               <div className="bg-white p-6 rounded-[5px] border border-slate-200/60 shadow-sm space-y-4 max-w-xl">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                         <div>
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider capitalize">{activePlanTab} Feature Grid Toggles</h3>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Toggle rows to adjust feature access for {activePlanTab} plan.</p>
                         </div>
                         <span className="text-[10px] font-black text-primary bg-orange-50 uppercase tracking-widest px-2.5 py-1 rounded-[5px]">
                              {planFeatures[activePlanTab]?.length || 0} Toggles ON
                         </span>
                    </div>

                    {/* 20-Feature List Grid */}
                    <div className="divide-y divide-slate-100">
                         {allFeaturesConfig.map((feat) => {
                              const isSelect = feat.type === 'select';
                              const isEnabled = isSelect
                                   ? planFeatures[activePlanTab]?.some(f => f.startsWith(feat.key + ':'))
                                   : planFeatures[activePlanTab]?.includes(feat.key);

                              const selectVal = isSelect ? getFeatureValue(activePlanTab, feat.key) : '';

                              return (
                                   <div key={feat.key} className="py-3 flex items-center justify-between text-xs font-semibold">
                                        <div className="flex items-center gap-3">
                                             {isEnabled ? (
                                                  <span
                                                       onClick={() => {
                                                            if (isSelect) {
                                                                 const list = planFeatures[activePlanTab].filter(f => !f.startsWith(feat.key + ':'));
                                                                 setPlanFeatures({ ...planFeatures, [activePlanTab]: list });
                                                                 toast.error(`Disabled ${feat.key} for ${activePlanTab} tier.`);
                                                            } else {
                                                                 handleToggleFeature(activePlanTab, feat.key);
                                                            }
                                                       }}
                                                       className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center justify-center shrink-0 cursor-pointer border border-transparent hover:border-emerald-300"
                                                  >
                                                       <FiCheck className="w-3.5 h-3.5" />
                                                  </span>
                                             ) : (
                                                  <span
                                                       onClick={() => {
                                                            if (isSelect) {
                                                                 handleSelectFeatureValue(activePlanTab, feat.key, feat.options![0]);
                                                            } else {
                                                                 handleToggleFeature(activePlanTab, feat.key);
                                                            }
                                                       }}
                                                       className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center shrink-0 cursor-pointer border border-transparent hover:border-slate-300"
                                                  >
                                                       <FiX className="w-2.5 h-2.5" />
                                                  </span>
                                             )}

                                             <span className={`${isEnabled ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>{feat.label}</span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                             {isSelect && isEnabled ? (
                                                  <select
                                                       value={selectVal}
                                                       onChange={(e) => handleSelectFeatureValue(activePlanTab, feat.key, e.target.value)}
                                                       className="bg-slate-50 border border-slate-200 rounded-[5px] px-2 py-1 text-[11px] font-black focus:outline-none focus:border-primary text-slate-800"
                                                  >
                                                       {feat.options?.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                       ))}
                                                  </select>
                                             ) : isSelect ? (
                                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Disabled</span>
                                             ) : (
                                                  <div
                                                       onClick={() => handleToggleFeature(activePlanTab, feat.key)}
                                                       className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative shrink-0 ${isEnabled ? 'bg-primary' : 'bg-slate-200'
                                                            }`}
                                                  >
                                                       <div
                                                            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs ${isEnabled ? 'right-0.5' : 'left-0.5'
                                                                 }`}
                                                       />
                                                  </div>
                                             )}
                                        </div>
                                   </div>
                              );
                         })}
                    </div>
               </div>
          </div>
     );
};
