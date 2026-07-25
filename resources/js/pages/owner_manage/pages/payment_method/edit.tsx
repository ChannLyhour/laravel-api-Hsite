import React, { useState } from 'react';
import { FiArrowLeft, FiSave, FiLoader, FiEye, FiEyeOff, FiInfo, FiSliders } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';

import abaLogo from '@/pages/main_website/Company_bank/aba.png';
import bakongLogo from '@/pages/main_website/Company_bank/bakong.png';
import acledaLogo from '@/pages/main_website/Company_bank/acleda.png';

const DEFAULT_LOGOS: Record<string, string> = {
     aba: abaLogo,
     bakong: bakongLogo,
     acleda: acledaLogo,
};


interface PaymentField {
     key: string;
     label: string;
     type: 'text' | 'password' | 'textarea' | 'image';
     required?: boolean;
     placeholder?: string;
     hint?: string;
}

interface PaymentGateway {
     id: string;
     name: string;
     description: string;
     logoColor: string;
     textColor: string;
     logoText: string;
     fields: PaymentField[];
     defaultValues?: Record<string, string>;
}

interface EditPageProps {
     gateway: PaymentGateway;
     config: { enabled: boolean; sandbox: boolean; values: Record<string, string> };
     onClose: () => void;
     onSave: (updatedValues: Record<string, string>, sandbox: boolean) => Promise<boolean>;
     ownerId?: number | string;
}

export const EditPage: React.FC<EditPageProps> = ({
     gateway,
     config,
     onClose,
     onSave,
     ownerId,
}) => {
     const [sandbox, setSandbox] = useState<boolean>(config.sandbox ?? true);
     const [values, setValues] = useState<Record<string, string>>({
          ...(gateway.defaultValues || {}),
          ...(config.values || {})
     });
     const [activeTab, setActiveTab] = useState<'aba' | 'khpay'>('aba');
     const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
     const [saving, setSaving] = useState(false);

     const handleFormSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setSaving(true);
          try {
               const success = await onSave(values, sandbox);
               if (success) {
                    toast.success(`Configuration for ${gateway.name} updated!`);
                    onClose();
               }
          } catch (err) {
               console.error('Failed to save payment gateway:', err);
               toast.error('Failed to update configurations.');
          } finally {
               setSaving(false);
          }
     };

     const credentialsFields = gateway.fields;
     const displayedFields = credentialsFields.filter(field => {
          if (gateway.id !== 'aba') return true;
          if (activeTab === 'aba') {
               return field.key === 'payway_link';
          } else {
               return field.key.startsWith('khpay_');
          }
     });

     return (
          <div className="space-y-6 font-kuntomruy animate-fade-in w-full">
               {/* Navigation Header */}
               <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
                    <button
                         onClick={onClose}
                         className="p-2 border rounded-[5px] hover:bg-black/[0.04] text-inherit opacity-75 hover:opacity-100 transition-all cursor-pointer flex items-center justify-center shadow-2xs custom-card-container border-none"
                         title="Back to list"
                    >
                         <FiArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <div>
                         <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
                              <span>Configure {gateway.name}</span>
                         </h2>
                         <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                              Setup integration API parameters, environments, and custom logo.
                         </p>
                    </div>
               </div>

               <form onSubmit={handleFormSubmit} className="space-y-6 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
                         {/* Left Column: API Parameters */}
                         <div className="lg:col-span-2 space-y-6">
                              <GroupDiv className="space-y-6">
                                   <div>
                                        <h3 className="text-base font-extrabold text-slate-850 flex items-center gap-1.5">
                                             <FiSliders className="text-orange-500" />
                                             <span>API Credentials</span>
                                        </h3>
                                        <p className="text-slate-400 text-xs mt-0.5">
                                             Provide merchant API configuration keys to link securely with the provider.
                                        </p>
                                   </div>

                                   {/* Tab Switcher for ABA vs KHPAY */}
                                   {gateway.id === 'aba' && (
                                        <div className="space-y-3 border-b border-slate-200/80 pb-4 pt-1">
                                             <div className="flex flex-wrap items-center gap-2">
                                                  <button
                                                       type="button"
                                                       onClick={() => setActiveTab('aba')}
                                                       className={`px-4 py-2 text-xs font-extrabold rounded-[6px] transition-all cursor-pointer border-none flex items-center gap-2 ${
                                                            activeTab === 'aba'
                                                                 ? 'bg-[#005D7E] text-white shadow-md'
                                                                 : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                       }`}
                                                  >
                                                       <span>Config 1: Account ABA Bank Support KHQR</span>
                                                  </button>
                                                  <button
                                                       type="button"
                                                       onClick={() => setActiveTab('khpay')}
                                                       className={`px-4 py-2 text-xs font-extrabold rounded-[6px] transition-all cursor-pointer border-none flex items-center gap-2 ${
                                                            activeTab === 'khpay'
                                                                 ? 'bg-[#E61E25] text-white shadow-md'
                                                                 : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                       }`}
                                                  >
                                                       <span>Config 2: Config with KHPAY</span>
                                                  </button>
                                             </div>

                                             {activeTab === 'aba' ? (
                                                  <div className="p-3 bg-cyan-50 border border-cyan-200/60 rounded-[6px] text-xs text-cyan-900 leading-relaxed font-medium">
                                                       <strong className="font-extrabold text-[#005D7E] block mb-0.5">Config 1: ABA Bank Account (PayWay Link / KHQR)</strong>
                                                       Paste your official ABA PayWay merchant sharing link (<code className="bg-cyan-100/80 px-1 py-0.5 rounded font-mono text-[11px]">https://link.payway.com.kh/ABAPAY...</code>) to accept payments into your ABA Bank account with KHQR support.
                                                  </div>
                                             ) : (
                                                  <div className="p-3 bg-red-50 border border-red-200/60 rounded-[6px] text-xs text-red-900 leading-relaxed font-medium">
                                                       <strong className="font-extrabold text-[#E61E25] block mb-0.5">Config 2: Config with KHPAY (Dynamic KHQR API)</strong>
                                                       Provide your KHPAY API Token and Bakong Account ID from <code className="bg-red-100/80 px-1 py-0.5 rounded font-mono text-[11px]">khpay.site</code> for real-time dynamic KHQR generation and automatic payment status checks.
                                                  </div>
                                             )}
                                        </div>
                                   )}

                                   {/* Operational Mode Toggle */}
                                   <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 block">Operational Mode</label>
                                        <div className="flex items-center gap-6 bg-black/[0.02] p-3 rounded-[5px] border max-w-md">
                                             <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                                                  <input
                                                       type="radio"
                                                       name="sandbox"
                                                       checked={sandbox}
                                                       onChange={() => setSandbox(true)}
                                                       className="text-orange-600 accent-orange-600 w-4 h-4"
                                                  />
                                                  <span>Test Mode (Sandbox)</span>
                                             </label>
                                             <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                                                  <input
                                                       type="radio"
                                                       name="sandbox"
                                                       checked={!sandbox}
                                                       onChange={() => setSandbox(false)}
                                                       className="text-orange-600 accent-orange-600 w-4 h-4"
                                                  />
                                                  <span>Live Mode (Production)</span>
                                             </label>
                                        </div>
                                   </div>

                                   {/* Credentials Inputs */}
                                   <div className="space-y-4 pt-2">
                                        {displayedFields.map(field => (
                                             <div key={field.key} className="space-y-1.5 text-left">
                                                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                       <span>{field.label}</span>
                                                       {field.required !== false && <span className="text-rose-500">*</span>}
                                                  </label>

                                                  {field.type === 'textarea' ? (
                                                       <textarea
                                                            value={values[field.key] || ''}
                                                            onChange={e => setValues(prev => ({
                                                                 ...prev,
                                                                 [field.key]: e.target.value
                                                            }))}
                                                            className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold font-mono"
                                                            rows={5}
                                                            required={field.required !== false}
                                                       />
                                                  ) : field.type === 'password' ? (
                                                       <div className="relative">
                                                            <input
                                                                 type={showPasswords[field.key] ? 'text' : 'password'}
                                                                 value={values[field.key] || ''}
                                                                 onChange={e => setValues(prev => ({
                                                                      ...prev,
                                                                      [field.key]: e.target.value
                                                                 }))}
                                                                 className="w-full pl-3 pr-10 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold font-mono"
                                                                 required={field.required !== false}
                                                            />
                                                            <button
                                                                 type="button"
                                                                 onClick={() => setShowPasswords(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                                                                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 focus:outline-none cursor-pointer border-none bg-transparent flex items-center"
                                                            >
                                                                 {showPasswords[field.key] ? <FiEyeOff className="w-4.5 h-4.5" /> : <FiEye className="w-4.5 h-4.5" />}
                                                            </button>
                                                       </div>
                                                  ) : (
                                                       <input
                                                            type={field.type}
                                                            value={values[field.key] || ''}
                                                            onChange={e => setValues(prev => ({
                                                                 ...prev,
                                                                 [field.key]: e.target.value
                                                            }))}
                                                            placeholder={field.placeholder || ''}
                                                            className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                                            required={field.required !== false}
                                                       />
                                                  )}
                                                  {field.hint && (
                                                       <p className="text-[10px] text-slate-400 mt-1 leading-relaxed flex items-start gap-1">
                                                            <FiInfo className="w-3 h-3 mt-0.5 shrink-0 text-blue-400" />
                                                            <span>{field.hint}</span>
                                                       </p>
                                                  )}
                                             </div>
                                        ))}
                                   </div>
                              </GroupDiv>
                         </div>

                         {/* Right Sidebar Column: Brand & Status info */}
                         <div className="space-y-6">

                              {/* Provider Information Card */}
                              <GroupDiv className="space-y-4">
                                   <h3 className="text-base font-extrabold text-slate-850 flex items-center gap-1.5">
                                        <FiInfo className="text-blue-500" />
                                        <span>Provider Profile</span>
                                   </h3>
                                   <div className="flex items-center gap-3 bg-black/[0.02] p-2.5 rounded-[5px] border border-black/10">
                                        <div className={`w-12 h-8 rounded-[4px] shrink-0 flex items-center justify-center font-black text-center shadow-xs select-none leading-none px-1 ${gateway.logoColor} ${gateway.textColor} ${gateway.logoText.length > 5 ? 'text-[8px]' : 'text-[10px]'}`}>
                                             {gateway.logoText}
                                        </div>
                                        <div className="text-xs">
                                             <p className="font-extrabold text-slate-800">{gateway.name}</p>
                                             <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block mt-0.5 ${config.enabled
                                                  ? sandbox ? 'bg-amber-550 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                  : 'bg-slate-150 text-slate-450'
                                                  }`}>
                                                  {config.enabled ? (sandbox ? 'Sandbox Mode' : 'Live Mode') : 'Inactive'}
                                             </span>
                                        </div>
                                   </div>
                                   <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                                        {gateway.description}
                                   </p>
                              </GroupDiv>
                         </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
                         <button
                              type="button"
                              onClick={onClose}
                              className="px-5 py-2.5 bg-black/[0.04] hover:bg-black/[0.08] text-inherit rounded-[5px] text-xs font-extrabold transition-all cursor-pointer border-none"
                         >
                              Cancel
                         </button>
                         <button
                              type="submit"
                              disabled={saving}
                              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-[5px] text-xs font-extrabold shadow-xs active:scale-98 transition-all border-none cursor-pointer flex items-center gap-1.5"
                         >
                              {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
                              <span>Save Configurations</span>
                         </button>
                    </div>
               </form>
          </div>
     );
};
