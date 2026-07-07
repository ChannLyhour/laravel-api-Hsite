import React, { useState, useEffect } from 'react';
import { FiSettings, FiLoader, FiCheck, FiInfo, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { storesService } from '@/api/owner/stores';
import '@/pages/owner_manage/style/font.css';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';
import { useTranslation } from '../../lang/i18n';

interface TabProps {
     ownerId?: number | string;
     profile?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility functions for loading & saving settings
// ─────────────────────────────────────────────────────────────────────────────
const getStoredSettings = () => {
     try {
          const saved = localStorage.getItem('store_settings');
          return saved ? JSON.parse(saved) : {};
     } catch (e) {
          return {};
     }
};

const saveSettingsToStore = async (newSettings: Record<string, any>, ownerId?: number | string, profile?: any) => {
     const current = getStoredSettings();
     const merged = { ...current, ...newSettings };
     localStorage.setItem('store_settings', JSON.stringify(merged));
     window.dispatchEvent(new Event('settings_updated'));

     // Update API — pass ownerId only if user role is admin to hit PUT /stores/{id}
     const isAdmin = profile?.user?.role === 'admin';
     const targetOwnerId = isAdmin ? ownerId : undefined;

     try {
          await storesService.updateStore(merged, targetOwnerId);
          return true;
     } catch (err) {
          console.error('Failed to update store settings:', err);
          return false;
     }
};

export const Pusher_ConfigurationTab: React.FC<TabProps> = ({ ownerId, profile }) => {
     const { t } = useTranslation();
     const [loading, setLoading] = useState(true);
     const [appId, setAppId] = useState('');
     const [key, setKey] = useState('');
     const [secret, setSecret] = useState('');
     const [showSecret, setShowSecret] = useState(false);
     const [cluster, setCluster] = useState('');
     const [saving, setSaving] = useState(false);

     useEffect(() => {
          const settings = getStoredSettings();
          setAppId(settings.pusher_app_id || '');
          setKey(settings.pusher_app_key || '');
          setSecret(settings.pusher_app_secret || '');
          setCluster(settings.pusher_app_cluster || 'ap1');
          setLoading(false);
     }, []);

     const handleSave = async (e: React.FormEvent) => {
          e.preventDefault();
          setSaving(true);

          const success = await saveSettingsToStore({
               pusher_app_id: appId.trim(),
               pusher_app_key: key.trim(),
               pusher_app_secret: secret.trim(),
               pusher_app_cluster: cluster.trim(),
          }, ownerId, profile);

          setSaving(false);
          if (success) {
               toast.success('Pusher configuration saved successfully!');
          } else {
               toast.error('Failed to update Pusher configuration.');
          }
     };

     if (loading) {
          return (
               <div className="border p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy custom-card-container">
                    <FiLoader className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs font-bold text-slate-400">{t('pusher.loading')}</span>
               </div>
          );
     }

     return (
          <div className="border p-6 sm:p-8 rounded-[5px] shadow-xs space-y-8 animate-fade-in font-kuntomruy custom-card-container">
               <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
                         <FiSettings className="text-orange-500" />
                         <span>{t('pusher.title')}</span>
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                         {t('pusher.subtitle')}
                    </p>
               </div>

               <div className="bg-black/[0.02] border border-black/10 rounded-[8px] p-5 flex items-start gap-3">
                    <FiInfo className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-500 leading-relaxed font-semibold">
                         {t('pusher.info')}
                    </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Form Column */}
                    <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                              <div className="space-y-1.5 sm:col-span-2">
                                   <label className="text-xs font-bold text-slate-755 block">{t('pusher.app_id')}</label>
                                   <input
                                        type="text"
                                        value={appId}
                                        onChange={e => setAppId(e.target.value)}
                                        placeholder="e.g. 2164930"
                                        className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                        required
                                   />
                              </div>

                              <div className="space-y-1.5">
                                   <label className="text-xs font-bold text-slate-755 block">{t('pusher.app_key')}</label>
                                   <input
                                        type="text"
                                        value={key}
                                        onChange={e => setKey(e.target.value)}
                                        placeholder="e.g. 039e7fbdaf49c979cbe9"
                                        className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                        required
                                   />
                              </div>

                              <div className="space-y-1.5">
                                   <label className="text-xs font-bold text-slate-755 block">{t('pusher.app_secret')}</label>
                                   <div className="relative">
                                        <input
                                             type={showSecret ? 'text' : 'password'}
                                             value={secret}
                                             onChange={e => setSecret(e.target.value)}
                                             placeholder="e.g. d3746293105a9f3fe763"
                                             className="w-full pl-4 pr-10 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                             required
                                        />
                                        <button
                                             type="button"
                                             onClick={() => setShowSecret(!showSecret)}
                                             className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer border-none bg-transparent flex items-center"
                                        >
                                             {showSecret ? <FiEyeOff className="w-4.5 h-4.5" /> : <FiEye className="w-4.5 h-4.5" />}
                                        </button>
                                   </div>
                              </div>

                              <div className="space-y-1.5 sm:col-span-2">
                                   <label className="text-xs font-bold text-slate-755 block">{t('pusher.cluster')}</label>
                                   <input
                                        type="text"
                                        value={cluster}
                                        onChange={e => setCluster(e.target.value)}
                                        placeholder="e.g. ap1, mt1, eu"
                                        className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                        required
                                   />
                              </div>
                         </div>

                         <div className="pt-4 border-t border-slate-100 flex justify-end">
                              <button
                                   type="submit"
                                   disabled={saving}
                                   className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center space-x-1.5 shadow-2xs active:scale-98"
                              >
                                   {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                                   <span>{t('pusher.save_config')}</span>
                              </button>
                         </div>
                    </form>

                    {/* Setup Instructions Column */}
                    <GroupDiv className="lg:col-span-5 space-y-6 text-left">
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/80 pb-3">
                              <FiInfo className="text-orange-500 w-4 h-4" /> {t('pusher.guide_title')}
                         </h4>

                         <div className="space-y-4">
                              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                   {t('pusher.guide_desc')}
                              </p>
                              <ol className="list-decimal pl-4 text-[11px] text-slate-550 font-semibold space-y-2 leading-relaxed">
                                   <li>{t('pusher.step1')}</li>
                                   <li>{t('pusher.step2')}</li>
                                   <li>{t('pusher.step3')}
                                        <ul className="list-disc pl-4 mt-1 space-y-1">
                                             <li><strong>{t('pusher.step3_name')}</strong></li>
                                             <li><strong>{t('pusher.step3_cluster')}</strong></li>
                                        </ul>
                                   </li>
                                   <li>{t('pusher.step4')}</li>
                                   <li>{t('pusher.step5')}</li>
                                   <li>{t('pusher.step6')}</li>
                                   <li>{t('pusher.step7')}
                                        <ul className="list-disc pl-4 mt-1.5 space-y-1.5">
                                             <li><code>app_id</code> &rarr; <strong>{t('pusher.app_id')}</strong></li>
                                             <li><code>key</code> &rarr; <strong>{t('pusher.app_key')}</strong></li>
                                             <li><code>secret</code> &rarr; <strong>{t('pusher.app_secret')}</strong></li>
                                             <li><code>cluster</code> &rarr; <strong>{t('pusher.cluster')}</strong></li>
                                        </ul>
                                   </li>
                              </ol>
                         </div>
                    </GroupDiv>
               </div>
          </div>
     );
};
