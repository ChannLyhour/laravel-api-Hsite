import React, { useState } from 'react';
import { FiArrowLeft, FiSave, FiLoader, FiEye, FiEyeOff, FiUploadCloud, FiTrash2, FiImage, FiInfo, FiSliders } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { storesService } from '@/api/owner/stores';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';

interface PaymentField {
     key: string;
     label: string;
     type: 'text' | 'password' | 'textarea' | 'image';
     required?: boolean;
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
     const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
     const [uploadingImage, setUploadingImage] = useState<Record<string, boolean>>({});
     const [saving, setSaving] = useState(false);

     const handleImageUpload = async (fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setUploadingImage(prev => ({ ...prev, [fieldKey]: true }));
          try {
               const res = await storesService.uploadLogo(file);
               const cleanPath = res.path ? res.path.replace(/^uploads\//, '') : res.url;
               setValues(prev => ({
                    ...prev,
                    [fieldKey]: cleanPath
               }));
               toast.success('Payment gateway logo uploaded successfully!');
          } catch (err) {
               console.error('Image upload failed:', err);
               toast.error('Failed to upload image. Please check image constraints.');
          } finally {
               setUploadingImage(prev => ({ ...prev, [fieldKey]: false }));
               e.target.value = '';
          }
     };

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

     // Separate fields into credentials and branding assets
     const credentialsFields = gateway.fields.filter(f => f.type !== 'image');
     const brandingFields = gateway.fields.filter(f => f.type === 'image');

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
                                         {credentialsFields.map(field => (
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
                                                             className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                                             required={field.required !== false}
                                                        />
                                                   )}
                                              </div>
                                         ))}
                                    </div>
                               </GroupDiv>
                          </div>

                          {/* Right Sidebar Column: Brand & Status info */}
                          <div className="space-y-6">
                               {/* Custom Logo Upload Card */}
                               {brandingFields.map(field => (
                                    <GroupDiv key={field.key} className="space-y-4">
                                         <div>
                                              <h3 className="text-base font-extrabold text-slate-850 flex items-center gap-1.5">
                                                   <FiImage className="text-orange-500" />
                                                   <span>{field.label}</span>
                                              </h3>
                                              <p className="text-slate-400 text-xs mt-0.5">
                                                   Upload a custom graphic brand logo for the payment provider.
                                              </p>
                                         </div>

                                         <div className="flex flex-col items-center justify-center p-4 bg-black/[0.02] border border-dashed rounded-[8px] space-y-3 relative">
                                              <div className="w-24 h-16 rounded-[4px] border border-black/10 bg-black/[0.03] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
                                                   {values[field.key] ? (
                                                        <img
                                                             src={resolveImageUrl(values[field.key])}
                                                             alt="Custom Gateway Logo Preview"
                                                             className="w-full h-full object-contain p-1"
                                                        />
                                                   ) : (
                                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                                             <FiImage className="w-7 h-7 stroke-[1.5]" />
                                                             <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Default Logo</span>
                                                        </div>
                                                   )}
                                                   {uploadingImage[field.key] && (
                                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                                                             <FiLoader className="w-5 h-5 text-orange-500 animate-spin" />
                                                        </div>
                                                   )}
                                              </div>

                                              <div className="flex gap-2 w-full justify-center">
                                                   <label className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-[5px] text-[11px] font-extrabold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer border-none">
                                                        <FiUploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                                                        <span>Upload Image</span>
                                                        <input
                                                             type="file"
                                                             accept="image/*"
                                                             className="hidden"
                                                             disabled={uploadingImage[field.key]}
                                                             onChange={(e) => handleImageUpload(field.key, e)}
                                                        />
                                                   </label>
                                                   {values[field.key] && (
                                                        <button
                                                             type="button"
                                                             onClick={() => setValues(prev => ({ ...prev, [field.key]: '' }))}
                                                             className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-[5px] border border-slate-200 hover:border-rose-100 transition-all cursor-pointer"
                                                             title="Remove Logo"
                                                        >
                                                             <FiTrash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                   )}
                                              </div>
                                              <p className="text-[9px] text-slate-400 font-medium text-center leading-relaxed">
                                                   Recommended dimensions: 250x150px. Max size 2MB.
                                              </p>
                                         </div>
                                    </GroupDiv>
                               ))}

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
