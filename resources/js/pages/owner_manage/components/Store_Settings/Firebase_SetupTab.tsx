import React, { useState, useEffect } from 'react';
import { FiSettings, FiLoader, FiCheck, FiInfo, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { storesService } from '@/api/owner/stores';
import '@/pages/owner_manage/style/font.css';

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

export const Firebase_SetupTab: React.FC<TabProps> = ({ ownerId, profile }) => {
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const settings = getStoredSettings();
    setApiKey(settings.firebase_api_key || '');
    setProjectId(settings.firebase_project_id || '');
    setAuthDomain(settings.firebase_auth_domain || '');
    setMessagingSenderId(settings.firebase_messaging_sender_id || '');
    setAppId(settings.firebase_app_id || '');
    setLoading(false);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const success = await saveSettingsToStore({
      firebase_api_key: apiKey,
      firebase_project_id: projectId,
      firebase_auth_domain: authDomain,
      firebase_messaging_sender_id: messagingSenderId,
      firebase_app_id: appId,
    }, ownerId, profile);

    setSaving(false);
    if (success) {
      toast.success('Firebase FCM credentials saved successfully!');
    } else {
      toast.error('Failed to update Firebase configuration.');
    }
  };

  if (loading) {
    return (
      <div className="border p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy custom-card-container">
        <FiLoader className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading Firebase Settings...</span>
      </div>
    );
  }

  return (
    <div className="border p-6 sm:p-8 rounded-[5px] shadow-xs space-y-8 animate-fade-in font-kuntomruy custom-card-container">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiSettings className="text-orange-500" />
          <span>Firebase Setup</span>
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Configure Firebase Cloud Messaging credentials to allow delivery of push alerts to customer web & mobile apps.
        </p>
      </div>

      <div className="bg-black/[0.02] border border-black/10 rounded-[8px] p-5 flex items-start gap-3">
        <FiInfo className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-500 leading-relaxed font-semibold">
          Firebase credentials are used to link push alert triggers. Set up messaging templates, tokens, and register keys to let customers receive delivery logs, discount announcements, or checkout updates.
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-750 block">Firebase API Key *</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-4 pr-10 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer border-none bg-transparent flex items-center"
              >
                {showApiKey ? <FiEyeOff className="w-4.5 h-4.5" /> : <FiEye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-750 block">FCM Project ID *</label>
            <input
              type="text"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              placeholder="e.g. store-name-f31d"
              className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-755 block">Auth Domain</label>
            <input
              type="text"
              value={authDomain}
              onChange={e => setAuthDomain(e.target.value)}
              placeholder="e.g. store-name-f31d.firebaseapp.com"
              className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-750 block">Messaging Sender ID</label>
            <input
              type="text"
              value={messagingSenderId}
              onChange={e => setMessagingSenderId(e.target.value)}
              placeholder="e.g. 83920194820"
              className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-750 block">App ID</label>
            <input
              type="text"
              value={appId}
              onChange={e => setAppId(e.target.value)}
              placeholder="e.g. 1:83920:web:9f8d"
              className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
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
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Firebase_SetupTab;
