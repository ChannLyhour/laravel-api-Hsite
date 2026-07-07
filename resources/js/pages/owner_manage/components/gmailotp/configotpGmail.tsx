import React, { useState, useEffect } from 'react';
import { FiSettings, FiLoader, FiCheck, FiInfo, FiEye, FiEyeOff, FiMail } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { storesService } from '@/api/owner/stores';
import '@/pages/owner_manage/style/font.css';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';
import { useTranslation } from '../../lang/i18n';

interface TabProps {
     ownerId?: number | string;
     profile?: any;
}

const getStoredSettings = (ownerId?: number | string) => {
     try {
          const activeOwnerId = ownerId || localStorage.getItem('selected_owner_id') || 'global';
          const saved = localStorage.getItem(`store_settings_owner_${activeOwnerId}`) || localStorage.getItem('store_settings');
          return saved ? JSON.parse(saved) : {};
     } catch (e) {
          return {};
     }
};

const saveSettingsToStore = async (newSettings: Record<string, any>, ownerId?: number | string, profile?: any) => {
     const activeOwnerId = ownerId || localStorage.getItem('selected_owner_id') || 'global';
     const current = getStoredSettings(activeOwnerId);
     const merged = { ...current, ...newSettings };
     localStorage.setItem(`store_settings_owner_${activeOwnerId}`, JSON.stringify(merged));
     localStorage.setItem('store_settings', JSON.stringify(merged));
     window.dispatchEvent(new Event('settings_updated'));

     const isAdmin = profile?.user?.role === 'admin';
     const targetOwnerId = isAdmin ? ownerId : undefined;

     try {
          await storesService.updateStore(merged, targetOwnerId);
          return { success: true };
     } catch (err: any) {
          console.error('Failed to update store settings:', err);
          return {
               success: false,
               message: err?.details?.message || err?.message || 'Unknown backend error'
          };
     }
};

export const ConfigOTPGmailTab: React.FC<TabProps> = ({ ownerId, profile }) => {
     const { t } = useTranslation();
     const activeOwnerId = ownerId ?? profile?.user?.id ?? localStorage.getItem('selected_owner_id');
     const [loading, setLoading] = useState(true);
     const [saving, setSaving] = useState(false);

     // Setup config states
     const [gmailEnabled, setGmailEnabled] = useState(false);
     const [mailMailer, setMailMailer] = useState('smtp');
     const [mailHost, setMailHost] = useState('');
     const [mailPort, setMailPort] = useState('587');
     const [mailEncryption, setMailEncryption] = useState('tls');
     const [mailUsername, setMailUsername] = useState('');
     const [mailPassword, setMailPassword] = useState('');
     const [showPassword, setShowPassword] = useState(false);
     const [mailFromAddress, setMailFromAddress] = useState('');
     const [mailFromName, setMailFromName] = useState('');

     // Legacy states (kept synchronized for compatibility)
     const [gmailEmail, setGmailEmail] = useState('');
     const [gmailPassword, setGmailPassword] = useState('');

     useEffect(() => {
          const loadConfig = async () => {
               setLoading(true);
               try {
                    const store = await storesService.getStore(activeOwnerId);
                    if (store) {
                         setGmailEnabled(
                              store.gmail_enabled === '1' || 
                              store.gmail_enabled === 1 || 
                              store.gmail_enabled === 'true' || 
                              store.gmail_enabled === true
                         );
                         setMailMailer(store.mail_mailer || 'smtp');
                         setMailHost(store.mail_host || '');
                         setMailPort(store.mail_port || '587');
                         setMailEncryption(store.mail_encryption || 'tls');
                         setMailUsername(store.mail_username || '');
                         setMailPassword(store.mail_password || '');
                         setMailFromAddress(store.mail_from_address || '');
                         setMailFromName(store.mail_from_name || '');

                         // Fallbacks for legacy keys
                         setGmailEmail(store.gmail_email || '');
                         setGmailPassword(store.gmail_password || '');

                         // Update local cache
                         localStorage.setItem(`store_settings_owner_${activeOwnerId}`, JSON.stringify(store));
                         localStorage.setItem('store_settings', JSON.stringify(store));
                    }
               } catch (err) {
                    console.warn('Failed to load SMTP config from API, loading local backup.', err);
                    const settings = getStoredSettings(activeOwnerId);
                    setGmailEnabled(
                         settings.gmail_enabled === '1' || 
                         settings.gmail_enabled === 1 || 
                         settings.gmail_enabled === 'true' || 
                         settings.gmail_enabled === true
                    );
                    setMailMailer(settings.mail_mailer || 'smtp');
                    setMailHost(settings.mail_host || '');
                    setMailPort(settings.mail_port || '587');
                    setMailEncryption(settings.mail_encryption || 'tls');
                    setMailUsername(settings.mail_username || '');
                    setMailPassword(settings.mail_password || '');
                    setMailFromAddress(settings.mail_from_address || '');
                    setMailFromName(settings.mail_from_name || '');

                    // Fallbacks for legacy keys
                    setGmailEmail(settings.gmail_email || '');
                    setGmailPassword(settings.gmail_password || '');
               } finally {
                    setLoading(false);
               }
          };
          loadConfig();
     }, [activeOwnerId]);

     // Auto-presets helper
     const applyPreset = (preset: 'gmail' | 'log' | 'custom') => {
          if (preset === 'gmail') {
               setMailMailer('smtp');
               setMailHost('smtp.gmail.com');
               setMailPort('587');
               setMailEncryption('tls');
               toast.info('Gmail SMTP preset applied. Please fill in your Gmail email and App Password.');
          } else if (preset === 'log') {
               setMailMailer('log');
               setMailHost('localhost');
               setMailPort('25');
               setMailEncryption('none');
               toast.info('Local Laravel Log preset applied. Emails will print to storage/logs/laravel.log.');
          } else {
               setMailMailer('smtp');
               setMailHost('');
               setMailPort('587');
               setMailEncryption('tls');
               toast.info('Custom SMTP preset applied. Fill in your provider details.');
          }
     };

     const handleSave = async (e: React.FormEvent) => {
          e.preventDefault();
          setSaving(true);

          // Synchronize legacy fields for backward compatibility
          const resolvedGmailEmail = mailMailer === 'smtp' && mailHost === 'smtp.gmail.com' ? mailUsername : (gmailEmail || mailUsername);
          const resolvedGmailPassword = mailMailer === 'smtp' && mailHost === 'smtp.gmail.com' ? mailPassword : (gmailPassword || mailPassword);

          const result = await saveSettingsToStore({
               gmail_enabled: gmailEnabled ? '1' : '0',
               mail_mailer: mailMailer,
               mail_host: mailHost.trim(),
               mail_port: mailPort.trim(),
               mail_encryption: mailEncryption,
               mail_username: mailUsername.trim(),
               mail_password: mailPassword,
               mail_from_address: mailFromAddress.trim(),
               mail_from_name: mailFromName.trim(),

               // Sync legacy keys
               gmail_email: resolvedGmailEmail.trim(),
               gmail_password: resolvedGmailPassword,
          }, activeOwnerId, profile);

          setSaving(false);
          if (result.success) {
               toast.success('Gmail & SMTP configuration saved successfully!');
          } else {
               toast.error(`Failed to update email configuration: ${result.message}`);
          }
     };

     if (loading) {
          return (
               <div className="border p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy custom-card-container">
                    <FiLoader className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs font-bold text-slate-400">{t('smtp.loading')}</span>
               </div>
          );
     }

     return (
          <div className="border p-6 sm:p-8 rounded-[5px] shadow-xs space-y-8 animate-fade-in font-kuntomruy custom-card-container text-left">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                         <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2 text-left">
                              <FiMail className="text-orange-500 w-6 h-6" />
                              <span>{t('smtp.title')}</span>
                         </h2>
                         <p className="text-slate-400 text-xs sm:text-sm mt-1 font-semibold text-left">
                              {t('smtp.subtitle')}
                         </p>
                    </div>

                    {/* Enable Toggle Switch */}
                    <div className="flex items-center space-x-3 shrink-0">
                         <span className="text-xs font-black text-slate-700 uppercase">Status:</span>
                         <button
                              type="button"
                              onClick={() => setGmailEnabled(!gmailEnabled)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                   gmailEnabled ? 'bg-orange-500' : 'bg-slate-200'
                              }`}
                         >
                              <span
                                   className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                        gmailEnabled ? 'translate-x-5' : 'translate-x-0'
                                   }`}
                              />
                         </button>
                         <span className={`text-xs font-black uppercase ${gmailEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {gmailEnabled ? t('smtp.enabled') : t('smtp.disabled')}
                         </span>
                    </div>
               </div>

               <div className="bg-black/[0.02] border border-black/10 rounded-[8px] p-5 flex items-start gap-3">
                    <FiInfo className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-500 leading-relaxed font-semibold text-left">
                         {t('smtp.info')}
                    </div>
               </div>

               {/* Quick Configuration Presets */}
               <div className="border border-slate-200/60 rounded-[8px] p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                    <span className="text-xs font-bold text-slate-700">{t('smtp.preset_title')}</span>
                    <div className="flex flex-wrap items-center gap-2">
                         <button
                              type="button"
                              onClick={() => applyPreset('gmail')}
                              className="px-3.5 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 font-extrabold text-[11px] rounded-[4px] border-none cursor-pointer transition-all active:scale-98"
                         >
                              {t('smtp.preset_gmail')}
                         </button>
                         <button
                              type="button"
                              onClick={() => applyPreset('log')}
                              className="px-3.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-extrabold text-[11px] rounded-[4px] border-none cursor-pointer transition-all active:scale-98"
                         >
                              {t('smtp.preset_log')}
                         </button>
                         <button
                              type="button"
                              onClick={() => applyPreset('custom')}
                              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-355 text-slate-700 font-extrabold text-[11px] rounded-[4px] border-none cursor-pointer transition-all active:scale-98"
                         >
                              {t('smtp.preset_custom')}
                         </button>
                    </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Form Column */}
                    <form onSubmit={handleSave} className="lg:col-span-7 space-y-5 text-left">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              <div className="space-y-1.5 text-left">
                                   <label className="text-xs font-bold text-slate-755 block">{t('smtp.mailer')}</label>
                                   <select
                                        value={mailMailer}
                                        onChange={e => setMailMailer(e.target.value)}
                                        className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                        required
                                   >
                                        <option value="smtp">{t('smtp.mailer_smtp')}</option>
                                        <option value="log">{t('smtp.mailer_log')}</option>
                                   </select>
                              </div>

                              <div className="space-y-1.5 text-left">
                                   <label className="text-xs font-bold text-slate-755 block">{t('smtp.host')}</label>
                                   <input
                                        type="text"
                                        value={mailHost}
                                        onChange={e => setMailHost(e.target.value)}
                                        placeholder="e.g. smtp.gmail.com"
                                        className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                        required={mailMailer === 'smtp'}
                                        disabled={mailMailer === 'log'}
                                   />
                              </div>

                              <div className="space-y-1.5 text-left">
                                   <label className="text-xs font-bold text-slate-755 block">{t('smtp.port')}</label>
                                   <input
                                        type="text"
                                        value={mailPort}
                                        onChange={e => setMailPort(e.target.value)}
                                        placeholder="e.g. 587"
                                        className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                        required={mailMailer === 'smtp'}
                                        disabled={mailMailer === 'log'}
                                   />
                              </div>

                              <div className="space-y-1.5 text-left">
                                   <label className="text-xs font-bold text-slate-755 block">{t('smtp.encryption')}</label>
                                   <select
                                        value={mailEncryption}
                                        onChange={e => setMailEncryption(e.target.value)}
                                        className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                        required={mailMailer === 'smtp'}
                                        disabled={mailMailer === 'log'}
                                   >
                                        <option value="tls">{t('smtp.encryption_tls')}</option>
                                        <option value="ssl">{t('smtp.encryption_ssl')}</option>
                                        <option value="none">{t('smtp.encryption_none')}</option>
                                   </select>
                              </div>

                              <div className="space-y-1.5 sm:col-span-2 text-left">
                                   <label className="text-xs font-bold text-slate-755 block">{t('smtp.username')}</label>
                                   <input
                                        type="text"
                                        value={mailUsername}
                                        onChange={e => setMailUsername(e.target.value)}
                                        placeholder="your-email@gmail.com"
                                        className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                        required={mailMailer === 'smtp'}
                                        disabled={mailMailer === 'log'}
                                   />
                              </div>

                              <div className="space-y-1.5 sm:col-span-2 text-left">
                                   <label className="text-xs font-bold text-slate-755 block">{t('smtp.password')}</label>
                                   <div className="relative">
                                        <input
                                             type={showPassword ? 'text' : 'password'}
                                             value={mailPassword}
                                             onChange={e => setMailPassword(e.target.value)}
                                             placeholder="e.g. ghyc trfd swer klop"
                                             className="w-full pl-4 pr-10 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold font-mono"
                                             required={mailMailer === 'smtp'}
                                             disabled={mailMailer === 'log'}
                                        />
                                        <button
                                             type="button"
                                             onClick={() => setShowPassword(!showPassword)}
                                             className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer border-none bg-transparent flex items-center"
                                             disabled={mailMailer === 'log'}
                                        >
                                             {showPassword ? <FiEyeOff className="w-4.5 h-4.5" /> : <FiEye className="w-4.5 h-4.5" />}
                                        </button>
                                   </div>
                              </div>

                              <div className="space-y-1.5 text-left">
                                   <label className="text-xs font-bold text-slate-755 block">{t('smtp.from_address')}</label>
                                   <input
                                        type="email"
                                        value={mailFromAddress}
                                        onChange={e => setMailFromAddress(e.target.value)}
                                        placeholder="e.g. noreply@store.com"
                                        className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                        disabled={mailMailer === 'log'}
                                   />
                              </div>

                              <div className="space-y-1.5 text-left">
                                   <label className="text-xs font-bold text-slate-755 block">{t('smtp.from_name')}</label>
                                   <input
                                        type="text"
                                        value={mailFromName}
                                        onChange={e => setMailFromName(e.target.value)}
                                        placeholder="e.g. My Boutique Store"
                                        className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                        disabled={mailMailer === 'log'}
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
                                   <span>{t('smtp.save_config')}</span>
                              </button>
                         </div>
                    </form>

                    {/* Instructions Column */}
                    <GroupDiv className="lg:col-span-5 space-y-6 text-left">
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/80 pb-3">
                              <FiInfo className="text-orange-500 w-4 h-4" /> {t('smtp.guide_title')}
                         </h4>

                         <div className="space-y-4">
                              <p className="text-xs text-slate-500 font-semibold leading-relaxed text-left">
                                   {t('smtp.guide_desc')}
                              </p>
                              <ol className="list-decimal pl-4 text-[11px] text-slate-550 font-semibold space-y-2 leading-relaxed text-left">
                                   <li>{t('smtp.step1')}</li>
                                   <li>{t('smtp.step2')}</li>
                                   <li>{t('smtp.step3')}</li>
                                   <li>{t('smtp.step4')}</li>
                                   <li>{t('smtp.step5')}</li>
                                   <li>{t('smtp.step6')}</li>
                                   <li>{t('smtp.step7')}</li>
                              </ol>
                         </div>
                    </GroupDiv>
               </div>
          </div>
     );
};
