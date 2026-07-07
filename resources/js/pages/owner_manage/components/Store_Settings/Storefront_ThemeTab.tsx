import React, { useState, useEffect } from 'react';
import { ThemeSelectorPanel } from '../../templete_website/ThemeSelectorPanel';
import { storesService } from '@/api/owner/stores';
import { toast } from '@/pages/owner_manage/utils/toast';
import { FiLoader, FiMonitor } from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';
import { useTranslation } from '../../lang/i18n';

interface ThemeTabProps {
  ownerId?: number | string;
  profile?: any;
}

export const Storefront_ThemeTab: React.FC<ThemeTabProps> = ({ ownerId, profile }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [allSettings, setAllSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    // For fetching, both /stores/owner/{id} and /stores/me might work,
    // but we use the same logic as SettingsTab for consistency if needed.
    const isAdmin = profile?.user?.role === 'admin';
    const effectiveOwnerId = isAdmin ? ownerId : undefined;

    storesService.getStore(effectiveOwnerId)
      .then((data) => {
        if (data) {
          setAllSettings(data);
          setCurrentTheme(data.website_theme || 'default');
        } else {
          const local = localStorage.getItem('store_settings');
          if (local) {
            const parsed = JSON.parse(local);
            setAllSettings(parsed);
            setCurrentTheme(parsed.website_theme || 'default');
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load settings from server, checking local backup', err);
        const local = localStorage.getItem('store_settings');
        if (local) {
          const parsed = JSON.parse(local);
          setAllSettings(parsed);
          setCurrentTheme(parsed.website_theme || 'default');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ownerId, profile]);

  const handleSelectTheme = (themeId: string) => {
    setCurrentTheme(themeId);

    const updatedSettings = {
      ...allSettings,
      website_theme: themeId,
    };

    // Save to local storage for real-time frontend update
    localStorage.setItem('store_settings', JSON.stringify(updatedSettings));
    window.dispatchEvent(new Event('settings_updated'));

    // Update API — pass ownerId only if user role is admin to hit PUT /stores/{id}
    const isAdmin = profile?.user?.role === 'admin';
    const targetOwnerId = isAdmin ? ownerId : undefined;

    // Save to server (only send website_theme to prevent overwriting other settings with stale/empty values)
    toast.promise(
      storesService.updateStore({ website_theme: themeId }, targetOwnerId),
      {
        loading: 'Applying and saving website theme...',
        success: 'Website theme applied successfully!',
        error: 'Failed to sync theme preference to server.',
      }
    );
  };

  if (loading) {
    return (
      <div className="border p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy custom-card-container">
        <FiLoader className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-bold text-slate-400">{t('settings.loading_storefront')}</span>
      </div>
    );
  }

  return (
    <div className="border p-6 sm:p-8 rounded-[5px] shadow-xs space-y-8 animate-fade-in font-kuntomruy custom-card-container">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiMonitor className="text-orange-500" />
          <span>{t('settings.theme_title')}</span>
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          {t('settings.theme_subtitle')}
        </p>
      </div>

      <div className="border-t pt-6">
        <ThemeSelectorPanel 
          currentTheme={currentTheme} 
          onSelectTheme={handleSelectTheme}
          ownerId={ownerId}
          profile={profile}
          storeSettings={allSettings}
        />
      </div>
    </div>
  );
};
