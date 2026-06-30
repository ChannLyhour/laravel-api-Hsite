import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { SettingService } from '../services/SettingService';
import type { PlatformFooterSettings, PlatformLink } from '../services/SettingService';
import { FiPlus, FiTrash2, FiGlobe, FiAlertCircle, FiUploadCloud } from 'react-icons/fi';
import { adminSettingApi } from '@/api/admin/setting';
import { resolveImageUrl } from '@/api/imageUtils';

export const SettingTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PlatformFooterSettings>({
    platform_name: 'Prime Website',
    platform_description: '',
    status_label: 'Platform Online',
    is_online: true,
    platform_links: [],
    top_stores: [],
    merchant_access_links: [],
    copyright_text: '',
    terms_url: '#',
    privacy_policy_url: '#',
  });

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      const data = await SettingService.getFooterSettings();
      setSettings(data);
      setLoading(false);
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      await SettingService.updateFooterSettings(settings);
      toast.success('Global platform and footer configurations saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save configurations to database.');
    }
  };

  const updateLink = (type: 'platform_links' | 'top_stores' | 'merchant_access_links', index: number, field: keyof PlatformLink, value: string) => {
    const newLinks = [...settings[type]];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setSettings({ ...settings, [type]: newLinks });
  };

  const addLink = (type: 'platform_links' | 'top_stores' | 'merchant_access_links') => {
    setSettings({
      ...settings,
      [type]: [...settings[type], { label: 'New Link', url: '#' }]
    });
  };

  const removeLink = (type: 'platform_links' | 'top_stores' | 'merchant_access_links', index: number) => {
    const newLinks = [...settings[type]];
    newLinks.splice(index, 1);
    setSettings({ ...settings, [type]: newLinks });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading Master Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── CORE BRANDING & STATUS ─────────────────────────── */}
      <div className="bg-white p-6 rounded-[5px] border border-slate-200/60 shadow-sm max-w-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Global Platform Branding</h3>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${settings.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {settings.is_online ? 'System Online' : 'Maintenance Mode'}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Core Brand Name</label>
            <input
              type="text"
              value={settings.platform_name}
              onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 focus:border-primary focus:outline-none"
              placeholder="e.g. Prime Website"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Label Text</label>
            <input
              type="text"
              value={settings.status_label}
              onChange={(e) => setSettings({ ...settings, status_label: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 focus:border-primary focus:outline-none"
              placeholder="e.g. Platform Online"
            />
          </div>
        </div>

        {/* Logo & Favicon Uploads */}
        <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-[5px] overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                {settings.logo_url ? (
                  <img src={resolveImageUrl(settings.logo_url)} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-300">Logo</span>
                )}
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors">
                <FiUploadCloud className="w-4 h-4" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const uploadToast = toast.loading('Uploading Logo...');
                      try {
                        const res = await adminSettingApi.uploadLogo(file);
                        setSettings({ ...settings, logo_url: res.path || res.url });
                        toast.success('Logo uploaded successfully!', { id: uploadToast });
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to upload logo.', { id: uploadToast });
                      }
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Browser Favicon</label>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-[5px] overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                {settings.favicon_url ? (
                  <img src={resolveImageUrl(settings.favicon_url)} alt="Favicon" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[8px] font-bold text-slate-300">Icon</span>
                )}
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors">
                <FiUploadCloud className="w-4 h-4" />
                <span>Upload Icon</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/x-icon, image/svg+xml"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const uploadToast = toast.loading('Uploading Favicon...');
                      try {
                        const res = await adminSettingApi.uploadFavicon(file);
                        setSettings({ ...settings, favicon_url: res.path || res.url });
                        toast.success('Favicon uploaded successfully!', { id: uploadToast });
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to upload favicon.', { id: uploadToast });
                      }
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Description (Footer)</label>
          <textarea
            value={settings.platform_description}
            onChange={(e) => setSettings({ ...settings, platform_description: e.target.value })}
            rows={3}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 focus:border-primary focus:outline-none resize-none"
            placeholder="Enter platform description..."
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-[5px]">
          <div>
            <span className="block text-xs font-black text-slate-800">Operational Connectivity</span>
            <span className="block text-[10px] font-bold text-slate-400 mt-0.5">Toggle to broadcast global online/offline status to all tenants.</span>
          </div>
          <button
            onClick={() => setSettings({ ...settings, is_online: !settings.is_online })}
            className={`px-4 py-2 rounded-[5px] text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border ${settings.is_online
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
              }`}
          >
            {settings.is_online ? 'Active (Live)' : 'Maintenance (Offline)'}
          </button>
        </div>
      </div>

      {/* ── FOOTER NAVIGATION LINKS ────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 max-w-6xl">
        
        {/* Column 1: Platform Links */}
        <div className="bg-white p-5 rounded-[5px] border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Platform Links</h4>
            <button onClick={() => addLink('platform_links')} className="text-primary hover:text-primary-hover p-1 cursor-pointer bg-transparent border-none">
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {settings.platform_links.map((link, i) => (
              <div key={i} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-[3px] border border-slate-100">
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" value={link.label} placeholder="Label"
                    onChange={(e) => updateLink('platform_links', i, 'label', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] font-black text-slate-800 focus:outline-none"
                  />
                  <input 
                    type="text" value={link.url} placeholder="URL"
                    onChange={(e) => updateLink('platform_links', i, 'url', e.target.value)}
                    className="w-full bg-transparent border-none text-[9px] font-bold text-slate-400 focus:outline-none"
                  />
                </div>
                <button onClick={() => removeLink('platform_links', i)} className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer bg-transparent border-none">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Top Stores */}
        <div className="bg-white p-5 rounded-[5px] border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Top Vendors</h4>
            <button onClick={() => addLink('top_stores')} className="text-primary hover:text-primary-hover p-1 cursor-pointer bg-transparent border-none">
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {settings.top_stores.map((link, i) => (
              <div key={i} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-[3px] border border-slate-100">
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" value={link.label} placeholder="Store Name"
                    onChange={(e) => updateLink('top_stores', i, 'label', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] font-black text-slate-800 focus:outline-none"
                  />
                  <input 
                    type="text" value={link.url} placeholder="/slug"
                    onChange={(e) => updateLink('top_stores', i, 'url', e.target.value)}
                    className="w-full bg-transparent border-none text-[9px] font-bold text-slate-400 focus:outline-none"
                  />
                </div>
                <button onClick={() => removeLink('top_stores', i)} className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer bg-transparent border-none">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Merchant Access */}
        <div className="bg-white p-5 rounded-[5px] border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Merchant Access</h4>
            <button onClick={() => addLink('merchant_access_links')} className="text-primary hover:text-primary-hover p-1 cursor-pointer bg-transparent border-none">
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {settings.merchant_access_links.map((link, i) => (
              <div key={i} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-[3px] border border-slate-100">
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" value={link.label} placeholder="Label"
                    onChange={(e) => updateLink('merchant_access_links', i, 'label', e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] font-black text-slate-800 focus:outline-none"
                  />
                  <input 
                    type="text" value={link.url} placeholder="Path"
                    onChange={(e) => updateLink('merchant_access_links', i, 'url', e.target.value)}
                    className="w-full bg-transparent border-none text-[9px] font-bold text-slate-400 focus:outline-none"
                  />
                </div>
                <button onClick={() => removeLink('merchant_access_links', i)} className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer bg-transparent border-none">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── FOOTER LEGAL & COPYRIGHT ───────────────────────── */}
      <div className="bg-white p-6 rounded-[5px] border border-slate-200/60 shadow-sm max-w-2xl space-y-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Legal & Copyright</h3>
        
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Copyright Disclaimer</label>
          <input
            type="text"
            value={settings.copyright_text}
            onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 focus:border-primary focus:outline-none"
            placeholder="e.g. © 2026 Prime Website Platform. All Rights Reserved."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Terms of Use URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-300">
                <FiGlobe className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={settings.terms_url}
                onChange={(e) => setSettings({ ...settings, terms_url: e.target.value })}
                className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Privacy Policy URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-300">
                <FiGlobe className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={settings.privacy_policy_url}
                onChange={(e) => setSettings({ ...settings, privacy_policy_url: e.target.value })}
                className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── SAVE ACTION ────────────────────────────────────── */}
      <div className="max-w-2xl flex items-center justify-between p-4 bg-slate-900 rounded-[5px] shadow-xl">
        <div className="flex items-center space-x-3 text-white">
          <FiAlertCircle className="text-amber-400 w-5 h-5" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider">Master System Configuration</p>
            <p className="text-[9px] font-bold text-slate-400">Saving will update the public frontend globally.</p>
          </div>
        </div>
        <button
          onClick={saveSettings}
          className="bg-primary hover:bg-primary-hover text-white text-[11px] font-black px-6 py-3 rounded-[5px] transition-all cursor-pointer shadow-lg border-none shadow-orange-500/20 active:scale-95 uppercase tracking-widest"
        >
          Publish Changes
        </button>
      </div>

    </div>
  );
};
