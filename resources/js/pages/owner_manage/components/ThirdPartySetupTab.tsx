import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiSettings, FiSave, FiLoader, FiCheck, FiX, FiInfo, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
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

// ─────────────────────────────────────────────────────────────────────────────
// 2. FIREBASE TAB (FCM Setup)
// ─────────────────────────────────────────────────────────────────────────────
export const ThirdPartyFirebaseTab: React.FC<TabProps> = ({ ownerId, profile }) => {
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


// ─────────────────────────────────────────────────────────────────────────────
// 3. MARKETING TOOLS TAB
// ─────────────────────────────────────────────────────────────────────────────
interface MarketingTool {
  id: string;
  name: string;
  description: string;
  logoColor: string;
  textColor: string;
  fields: { key: string; label: string; placeholder: string }[];
}

const MARKETING_TOOLS: MarketingTool[] = [
  {
    id: 'google_analytics',
    name: 'Google Analytics (GA4)',
    description: 'Track storefront visitors, conversions, pageviews, and bounce rates.',
    logoColor: 'bg-black/[0.03] border border-black/10',
    textColor: 'text-slate-800',
    fields: [
      { key: 'measurementId', label: 'Measurement ID (G-XXXXXXX)', placeholder: 'G-XXXXXXXXXX' }
    ]
  },
  {
    id: 'facebook_pixel',
    name: 'Facebook Pixel',
    description: 'Optimize ads, build targeted remarketing audiences, and track campaigns.',
    logoColor: 'bg-[#1877f2]',
    textColor: 'text-white',
    fields: [
      { key: 'pixelId', label: 'Facebook Pixel ID', placeholder: 'e.g. 84920492810' }
    ]
  },
  {
    id: 'tiktok_pixel',
    name: 'TikTok Pixel',
    description: 'Analyze storefront performance, purchase events, and run target campaigns.',
    logoColor: 'bg-[#000000]',
    textColor: 'text-white',
    fields: [
      { key: 'pixelId', label: 'TikTok Pixel ID', placeholder: 'e.g. C820DK49A8F' }
    ]
  }
];

const renderToolIcon = (id: string) => {
  switch (id) {
    case 'google_analytics':
      return (
        <svg viewBox="0 0 24 24" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
          {/* Left yellow bar */}
          <rect x="3" y="13" width="4" height="7" rx="1.5" fill="#F4B400" />
          {/* Middle orange bar */}
          <rect x="10" y="8" width="4" height="12" rx="1.5" fill="#F9AB00" />
          {/* Right dark orange/red bar */}
          <rect x="17" y="3" width="4" height="17" rx="1.5" fill="#E37400" />
        </svg>
      );
    case 'facebook_pixel':
      return (
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.143 14.073h-2.2v6.8H9.77v-6.8H8.375v-2.47h1.395V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.503c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47z" />
        </svg>
      );
    case 'tiktok_pixel':
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
          {/* Red shadow note */}
          <path d="M11.5 5.5v8c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5v-2c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5V7.5c1.5.5 3 1.5 3.5 2v-2c-1-.5-2.5-1.5-3.5-2z" fill="#FE0979" transform="translate(-0.8, -0.8)" />
          {/* Cyan shadow note */}
          <path d="M11.5 5.5v8c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5v-2c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5V7.5c1.5.5 3 1.5 3.5 2v-2c-1-.5-2.5-1.5-3.5-2z" fill="#00F2FE" transform="translate(0.8, 0.8)" />
          {/* White note */}
          <path d="M11.5 5.5v8c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5v-2c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5V7.5c1.5.5 3 1.5 3.5 2v-2c-1-.5-2.5-1.5-3.5-2z" fill="#FFFFFF" />
        </svg>
      );
    default:
      return null;
  }
};

export const ThirdPartyMarketingTab: React.FC<TabProps> = ({ ownerId, profile }) => {
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<MarketingTool | null>(null);
  const [toolConfigs, setToolConfigs] = useState<Record<string, { enabled: boolean; values: Record<string, string> }>>({});
  const [modalForm, setModalForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const settings = getStoredSettings();
    const loadedConfigs: Record<string, any> = {};

    MARKETING_TOOLS.forEach(tool => {
      const savedConfig = settings[`marketing_tool_${tool.id}`];
      if (savedConfig) {
        try {
          loadedConfigs[tool.id] = typeof savedConfig === 'string' ? JSON.parse(savedConfig) : savedConfig;
        } catch (e) {
          loadedConfigs[tool.id] = { enabled: false, values: {} };
        }
      } else {
        loadedConfigs[tool.id] = { enabled: false, values: {} };
      }
    });

    setToolConfigs(loadedConfigs);
    setLoading(false);
  }, []);

  const handleToggleTool = async (toolId: string, currentStatus: boolean) => {
    const updatedConfig = {
      ...toolConfigs[toolId],
      enabled: !currentStatus
    };

    const newConfigs = { ...toolConfigs, [toolId]: updatedConfig };
    setToolConfigs(newConfigs);

    const savingSuccess = await saveSettingsToStore({
      [`marketing_tool_${toolId}`]: updatedConfig
    }, ownerId, profile);

    if (savingSuccess) {
      toast.success(`${MARKETING_TOOLS.find(t => t.id === toolId)?.name} ${!currentStatus ? 'Enabled' : 'Disabled'} successfully!`);
    } else {
      toast.error('Failed to update marketing tool settings.');
    }
  };

  const handleConfigureClick = (tool: MarketingTool) => {
    setActiveTool(tool);
    const config = toolConfigs[tool.id] || { values: {} };
    setModalForm({ ...config.values });
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTool) return;

    setSaving(true);
    const currentConfig = toolConfigs[activeTool.id] || { enabled: false };
    const updatedConfig = {
      ...currentConfig,
      values: modalForm
    };

    const newConfigs = { ...toolConfigs, [activeTool.id]: updatedConfig };
    setToolConfigs(newConfigs);

    const savingSuccess = await saveSettingsToStore({
      [`marketing_tool_${activeTool.id}`]: updatedConfig
    }, ownerId, profile);

    setSaving(false);
    if (savingSuccess) {
      toast.success(`Configuration for ${activeTool.name} saved!`);
      setActiveTool(null);
    } else {
      toast.error('Failed to save configuration details.');
    }
  };

  if (loading) {
    return (
      <div className="border p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy custom-card-container">
        <FiLoader className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading marketing tools...</span>
      </div>
    );
  }

  return (
    <div className="border p-6 sm:p-8 rounded-[5px] shadow-xs space-y-8 animate-fade-in font-kuntomruy custom-card-container">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiSettings className="text-orange-500" />
          <span>Marketing Tools Setup</span>
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Configure analytical tags, remarketing pixels, and customer insight metrics to monitor storefront behavior.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {MARKETING_TOOLS.map(tool => {
          const config = toolConfigs[tool.id] || { enabled: false };
          return (
            <div key={tool.id} className="border rounded-[8px] p-5 hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4 custom-card-container">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-[6px] ${tool.logoColor} ${tool.textColor} flex items-center justify-center shadow-xs shrink-0 select-none px-1`}>
                    {renderToolIcon(tool.id)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-855 tracking-tight flex items-center gap-1.5">
                      <span>{tool.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${config.enabled
                          ? 'bg-emerald-550 text-emerald-600 border border-emerald-100'
                          : 'bg-slate-150 text-slate-450'
                        }`}>
                        {config.enabled ? 'Enabled' : 'Inactive'}
                      </span>
                    </h4>
                    <p className="text-[11px] opacity-60 font-semibold mt-1 leading-relaxed">{tool.description}</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => handleToggleTool(tool.id, config.enabled)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-orange-500" />
                </label>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200/40">
                <button
                  onClick={() => handleConfigureClick(tool)}
                  className="px-3.5 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] text-inherit rounded-[5px] text-[11px] font-extrabold flex items-center space-x-1 border-none cursor-pointer transition-colors"
                >
                  <FiSettings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Configure API</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration modal */}
      {activeTool && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[99999] animate-fade-in">
          <div className="rounded-[8px] w-full max-w-md p-6 shadow-lg space-y-5 relative custom-card-container border-none">
            <button
              onClick={() => setActiveTool(null)}
              className="absolute top-4 right-4 p-1.5 rounded-[5px] hover:bg-black/[0.04] text-slate-400 cursor-pointer border-none bg-transparent"
            >
              <FiX className="w-4 h-4" />
            </button>

            <div>
              <h4 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Configure {activeTool.name} Settings</span>
              </h4>
              <p className="text-slate-400 text-xs mt-1">Provide tracking property identifiers to activate this integrations.</p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Input fields */}
              {activeTool.fields.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">{field.label}</label>
                  <input
                    type="text"
                    value={modalForm[field.key] || ''}
                    placeholder={field.placeholder}
                    onChange={e => setModalForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                    required
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/40">
                <button
                  type="button"
                  onClick={() => setActiveTool(null)}
                  className="px-4 py-2 text-xs font-bold text-inherit bg-black/[0.04] hover:bg-black/[0.08] rounded-[5px] border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
