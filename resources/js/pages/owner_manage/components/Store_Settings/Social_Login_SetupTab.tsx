import React, { useState, useEffect } from 'react';
import { FiSettings, FiLoader, FiCheck, FiInfo, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { storesService } from '@/api/owner/stores';
import '@/pages/owner_manage/style/font.css';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';

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

export const Social_Login_SetupTab: React.FC<TabProps> = ({ ownerId, profile }) => {
     const [loading, setLoading] = useState(true);
     const [googleClientId, setGoogleClientId] = useState('');
     const [googleClientSecret, setGoogleClientSecret] = useState('');
     const [showGoogleSecret, setShowGoogleSecret] = useState(false);
     const [googleEnabled, setGoogleEnabled] = useState(false);
     const [facebookAppId, setFacebookAppId] = useState('');
     const [facebookAppSecret, setFacebookAppSecret] = useState('');
     const [showFacebookSecret, setShowFacebookSecret] = useState(false);
     const [facebookEnabled, setFacebookEnabled] = useState(false);
     const [saving, setSaving] = useState(false);

     useEffect(() => {
          const settings = getStoredSettings();
          setGoogleClientId(settings.google_client_id || '');
          setGoogleClientSecret(settings.google_client_secret || '');
          setGoogleEnabled(settings.google_enabled === true || settings.google_enabled === 'true' || settings.google_enabled === '1' || settings.google_enabled === 1);
          setFacebookAppId(settings.facebook_app_id || '');
          setFacebookAppSecret(settings.facebook_app_secret || '');
          setFacebookEnabled(settings.facebook_enabled === true || settings.facebook_enabled === 'true' || settings.facebook_enabled === '1' || settings.facebook_enabled === 1);
          setLoading(false);
     }, []);

     const handleSave = async (e: React.FormEvent) => {
          e.preventDefault();
          setSaving(true);

          const success = await saveSettingsToStore({
               google_client_id: googleClientId.trim(),
               google_client_secret: googleClientSecret.trim(),
               google_enabled: googleEnabled,
               facebook_app_id: facebookAppId.trim(),
               facebook_app_secret: facebookAppSecret.trim(),
               facebook_enabled: facebookEnabled,
          }, ownerId, profile);

          setSaving(false);
          if (success) {
               toast.success('Social Login (OAuth) credentials saved successfully!');
          } else {
               toast.error('Failed to update OAuth configuration.');
          }
     };

     if (loading) {
          return (
               <div className="border p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy custom-card-container">
                    <FiLoader className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs font-bold text-slate-400">Loading OAuth Settings...</span>
               </div>
          );
     }

     return (
          <div className="border p-6 sm:p-8 rounded-[5px] shadow-xs space-y-8 animate-fade-in font-kuntomruy custom-card-container">
               <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
                         <FiSettings className="text-orange-500" />
                         <span>Social Login Setup (OAuth)</span>
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                         Configure Google and Facebook OAuth credentials to enable social logins on your storefront.
                    </p>
               </div>

               <div className="bg-black/[0.02] border border-black/10 rounded-[8px] p-5 flex items-start gap-3">
                    <FiInfo className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-500 leading-relaxed font-semibold">
                         Providing these credentials connects your store to Google and Facebook Authentication services. Make sure to whitelist your store domain as an authorized redirect URI in your Google Developer Console and Meta Apps Dashboard.
                    </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Form Column */}
                    <form onSubmit={handleSave} className="lg:col-span-7 space-y-8">
                         {/* Google OAuth Section */}
                         <div className="space-y-4 border-b border-slate-100 pb-6">
                              <div className="flex items-center justify-between">
                                   <h4 className="text-sm font-black text-slate-855 uppercase tracking-wider flex items-center gap-2 text-left">
                                        <span className="text-emerald-600">●</span> Google Login Configuration
                                   </h4>
                                   <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                             type="checkbox"
                                             checked={googleEnabled}
                                             onChange={() => setGoogleEnabled(!googleEnabled)}
                                             className="sr-only peer"
                                        />
                                        <div className="w-10 h-5.5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-orange-500" />
                                        <span className="ml-2 text-xs font-bold text-slate-650">{googleEnabled ? 'Enabled' : 'Disabled'}</span>
                                   </label>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                                   <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-750 block">Google Client ID</label>
                                        <input
                                             type="text"
                                             value={googleClientId}
                                             onChange={e => setGoogleClientId(e.target.value)}
                                             placeholder="e.g. 1234567890-abc123xyz.apps.googleusercontent.com"
                                             className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                             disabled={!googleEnabled}
                                             required={googleEnabled}
                                        />
                                   </div>

                                   <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-755 block">Google Client Secret</label>
                                        <div className="relative">
                                             <input
                                                  type={showGoogleSecret ? 'text' : 'password'}
                                                  value={googleClientSecret}
                                                  onChange={e => setGoogleClientSecret(e.target.value)}
                                                  placeholder="Google client secret key"
                                                  className="w-full pl-4 pr-10 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                                  disabled={!googleEnabled}
                                                  required={googleEnabled}
                                             />
                                             <button
                                                  type="button"
                                                  onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer border-none bg-transparent flex items-center"
                                                  disabled={!googleEnabled}
                                             >
                                                  {showGoogleSecret ? <FiEyeOff className="w-4.5 h-4.5" /> : <FiEye className="w-4.5 h-4.5" />}
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         </div>

                         {/* Facebook OAuth Section */}
                         <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                   <h4 className="text-sm font-black text-slate-855 uppercase tracking-wider flex items-center gap-2 text-left">
                                        <span className="text-[#1877f2]">●</span> Facebook Login Configuration
                                   </h4>
                                   <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                             type="checkbox"
                                             checked={facebookEnabled}
                                             onChange={() => setFacebookEnabled(!facebookEnabled)}
                                             className="sr-only peer"
                                        />
                                        <div className="w-10 h-5.5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-orange-500" />
                                        <span className="ml-2 text-xs font-bold text-slate-650">{facebookEnabled ? 'Enabled' : 'Disabled'}</span>
                                   </label>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                                   <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-755 block">Facebook App ID</label>
                                        <input
                                             type="text"
                                             value={facebookAppId}
                                             onChange={e => setFacebookAppId(e.target.value)}
                                             placeholder="e.g. 849204928104829"
                                             className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                             disabled={!facebookEnabled}
                                             required={facebookEnabled}
                                        />
                                   </div>

                                   <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-755 block">Facebook App Secret</label>
                                        <div className="relative">
                                             <input
                                                  type={showFacebookSecret ? 'text' : 'password'}
                                                  value={facebookAppSecret}
                                                  onChange={e => setFacebookAppSecret(e.target.value)}
                                                  placeholder="Facebook app secret key"
                                                  className="w-full pl-4 pr-10 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                                                  disabled={!facebookEnabled}
                                                  required={facebookEnabled}
                                             />
                                             <button
                                                  type="button"
                                                  onClick={() => setShowFacebookSecret(!showFacebookSecret)}
                                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 focus:outline-none cursor-pointer border-none bg-transparent flex items-center"
                                                  disabled={!facebookEnabled}
                                             >
                                                  {showFacebookSecret ? <FiEyeOff className="w-4.5 h-4.5" /> : <FiEye className="w-4.5 h-4.5" />}
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         </div>

                         <div className="pt-4 border-t border-slate-100 flex justify-end">
                              <button
                                   type="submit"
                                   disabled={saving}
                                   className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center space-x-1.5 shadow-2xs active:scale-98"
                              >
                                   {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                                   <span>Save Configuration</span>
                              </button>
                         </div>
                    </form>

                    {/* Setup Instructions Column */}
                    <GroupDiv className="lg:col-span-5 space-y-6 text-left">
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/80 pb-3">
                              <FiInfo className="text-orange-500 w-4 h-4" /> OAuth Setup Guides
                         </h4>

                         {/* Google Credentials Guide */}
                         <div className="space-y-3">
                              <h5 className="text-xs font-bold text-slate-755 flex items-center gap-1.5">
                                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Google App Setup
                              </h5>
                              <ol className="list-decimal pl-4 text-[11px] text-slate-550 font-semibold space-y-2 leading-relaxed">
                                   <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Google Cloud Console</a>.</li>
                                   <li>Create a new project or select an existing one.</li>
                                   <li>Navigate to <strong>APIs & Services &gt; Credentials</strong>.</li>
                                   <li>Click <strong>Create Credentials</strong> and select <strong>OAuth client ID</strong>.</li>
                                   <li>Configure the OAuth consent screen if prompted.</li>
                                   <li>Under Application Type, select <strong>Web application</strong>.</li>
                                   <li>Add your Authorized Redirect URI:
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                             <code className="bg-black/[0.04] border px-2 py-1 rounded text-[10px] font-mono flex-1 break-all select-all">
                                                  {window.location.origin}/auth/google/callback
                                             </code>
                                             <button
                                                  type="button"
                                                  onClick={() => {
                                                       navigator.clipboard.writeText(`${window.location.origin}/auth/google/callback`);
                                                       toast.success('Google callback URI copied!');
                                                  }}
                                                  className="p-1.5 text-slate-400 hover:text-slate-655 hover:bg-black/[0.04] rounded border cursor-pointer flex items-center"
                                                  title="Copy to clipboard"
                                             >
                                                  <FiCopy className="w-3.5 h-3.5" />
                                             </button>
                                        </div>
                                   </li>
                                   <li>Copy the generated <strong>Client ID</strong> and <strong>Client Secret</strong> into the form on the left.</li>
                              </ol>
                         </div>

                         {/* Facebook Credentials Guide */}
                         <div className="space-y-3 pt-4 border-t border-slate-200/60">
                              <h5 className="text-xs font-bold text-slate-755 flex items-center gap-1.5">
                                   <span className="w-2 h-2 rounded-full bg-[#1877f2]"></span> Meta (Facebook) App Setup
                              </h5>
                              <ol className="list-decimal pl-4 text-[11px] text-slate-550 font-semibold space-y-2 leading-relaxed">
                                   <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Meta for Developers</a>.</li>
                                   <li>Click <strong>My Apps</strong> and create a new Developer App.</li>
                                   <li>Select <strong>Allow users to log in...</strong> as your usecase.</li>
                                   <li>Add the <strong>Facebook Login</strong> product to your App.</li>
                                   <li>Navigate to <strong>Facebook Login &gt; Settings</strong>.</li>
                                   <li>Enable <strong>Client OAuth Login</strong> and <strong>Web OAuth Login</strong>.</li>
                                   <li>Add your Valid OAuth Redirect URI:
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                             <code className="bg-black/[0.04] border px-2 py-1 rounded text-[10px] font-mono flex-1 break-all select-all">
                                                  {window.location.origin}/auth/facebook/callback
                                             </code>
                                             <button
                                                  type="button"
                                                  onClick={() => {
                                                       navigator.clipboard.writeText(`${window.location.origin}/auth/facebook/callback`);
                                                       toast.success('Facebook callback URI copied!');
                                                  }}
                                                  className="p-1.5 text-slate-400 hover:text-slate-655 hover:bg-black/[0.04] rounded border cursor-pointer flex items-center"
                                                  title="Copy to clipboard"
                                             >
                                                  <FiCopy className="w-3.5 h-3.5" />
                                             </button>
                                        </div>
                                   </li>
                                   <li>Find your <strong>App ID</strong> and <strong>App Secret</strong> under <strong>App Settings &gt; Basic</strong>.</li>
                              </ol>
                         </div>
                    </GroupDiv>
               </div>
          </div>
     );
};
