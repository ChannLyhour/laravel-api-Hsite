import React, { useState, useEffect } from 'react';
import { socialMediaService } from '@/api/owner/socialMedia';
import type { SocialMediaRow } from '@/api/owner/socialMedia';
import { toast } from '@/pages/owner_manage/utils/toast';
import { FiLoader, FiEdit, FiTrash2, FiShare2, FiGlobe } from 'react-icons/fi';
import { 
  FaFacebookF, 
  FaTelegramPlane, 
  FaTiktok, 
  FaInstagram, 
  FaYoutube, 
  FaPinterest, 
  FaTwitter, 
  FaLinkedinIn 
} from 'react-icons/fa';
import '@/pages/owner_manage/style/font.css';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';
import { useTranslation } from '../../lang/i18n';

interface SocialMediaTabProps {
  ownerId?: number | string;
}

const AVAILABLE_PLATFORMS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'google-plus', label: 'Google Plus' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'tiktok', label: 'TikTok' },
];

const getPlatformConfig = (platform: string) => {
  const name = platform.toLowerCase();
  switch (name) {
    case 'facebook':
      return {
        icon: <FaFacebookF className="w-4 h-4 text-white" />,
        bgColor: 'bg-[#1877F2]',
        borderColor: 'border-[#1877F2]/20',
        bgLight: 'bg-[#1877F2]/10',
        textColor: 'text-[#1877F2]',
        label: 'Facebook',
      };
    case 'instagram':
      return {
        icon: <FaInstagram className="w-4 h-4 text-white" />,
        bgColor: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
        borderColor: 'border-[#ee2a7b]/20',
        bgLight: 'bg-[#ee2a7b]/10',
        textColor: 'text-[#ee2a7b]',
        label: 'Instagram',
      };
    case 'tiktok':
      return {
        icon: <FaTiktok className="w-4 h-4 text-white" />,
        bgColor: 'bg-black',
        borderColor: 'border-black/20',
        bgLight: 'bg-black/5',
        textColor: 'text-black dark:text-white',
        label: 'TikTok',
      };
    case 'telegram':
      return {
        icon: <FaTelegramPlane className="w-4 h-4 text-white" />,
        bgColor: 'bg-[#229ED9]',
        borderColor: 'border-[#229ED9]/20',
        bgLight: 'bg-[#229ED9]/10',
        textColor: 'text-[#229ED9]',
        label: 'Telegram',
      };
    case 'youtube':
      return {
        icon: <FaYoutube className="w-4 h-4 text-white" />,
        bgColor: 'bg-[#FF0000]',
        borderColor: 'border-[#FF0000]/20',
        bgLight: 'bg-[#FF0000]/10',
        textColor: 'text-[#FF0000]',
        label: 'YouTube',
      };
    case 'pinterest':
      return {
        icon: <FaPinterest className="w-4 h-4 text-white" />,
        bgColor: 'bg-[#BD081C]',
        borderColor: 'border-[#BD081C]/20',
        bgLight: 'bg-[#BD081C]/10',
        textColor: 'text-[#BD081C]',
        label: 'Pinterest',
      };
    case 'twitter':
      return {
        icon: <FaTwitter className="w-4 h-4 text-white" />,
        bgColor: 'bg-[#1DA1F2]',
        borderColor: 'border-[#1DA1F2]/20',
        bgLight: 'bg-[#1DA1F2]/10',
        textColor: 'text-[#1DA1F2]',
        label: 'Twitter',
      };
    case 'linkedin':
      return {
        icon: <FaLinkedinIn className="w-4 h-4 text-white" />,
        bgColor: 'bg-[#0A66C2]',
        borderColor: 'border-[#0A66C2]/20',
        bgLight: 'bg-[#0A66C2]/10',
        textColor: 'text-[#0A66C2]',
        label: 'LinkedIn',
      };
    default:
      return {
        icon: <FiGlobe className="w-4 h-4 text-white" />,
        bgColor: 'bg-slate-500',
        borderColor: 'border-slate-500/20',
        bgLight: 'bg-slate-500/10',
        textColor: 'text-slate-500',
        label: platform,
      };
  }
};

export const SocialMediaTab: React.FC<SocialMediaTabProps> = () => {
  const { t } = useTranslation();
  const [socials, setSocials] = useState<SocialMediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [mediaLink, setMediaLink] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Load socials on mount
  const loadSocials = async () => {
    setLoading(true);
    try {
      const data = await socialMediaService.getMySocials();
      setSocials(data || []);
    } catch (err) {
      console.error('Failed to load social media links:', err);
      toast.error('Failed to load social media link list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSocials();
  }, []);

  const handleReset = () => {
    setSelectedPlatform('');
    setMediaLink('');
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlatform) {
      toast.error('Please select a social media platform.');
      return;
    }

    if (!mediaLink.trim()) {
      toast.error('Please enter the social media link URL.');
      return;
    }

    // Basic URL validation
    try {
      new URL(mediaLink);
    } catch {
      toast.error('Please enter a valid absolute URL (e.g. https://facebook.com/page).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId !== null) {
        // Edit mode
        await socialMediaService.updateSocial(editingId, {
          name: selectedPlatform,
          link: mediaLink,
        });
        toast.success('Social media link updated successfully!');
      } else {
        // Create mode
        // Prevent adding duplicate active links for the same platform
        const exists = socials.some((s) => s.name.toLowerCase() === selectedPlatform.toLowerCase());
        if (exists) {
          toast.error(`A link for ${selectedPlatform} already exists. Please edit the existing link instead.`);
          setSubmitting(false);
          return;
        }

        await socialMediaService.createSocial({
          name: selectedPlatform,
          link: mediaLink,
          status: true,
        });
        toast.success('Social media link created successfully!');
      }

      handleReset();
      await loadSocials();
    } catch (err) {
      console.error('Failed to save social link:', err);
      toast.error('Failed to save social media link.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (social: SocialMediaRow) => {
    setSelectedPlatform(social.name);
    setMediaLink(social.link);
    setEditingId(social.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this social media link?')) {
      return;
    }

    try {
      await socialMediaService.deleteSocial(id);
      toast.success('Social media link deleted!');
      await loadSocials();
    } catch (err) {
      console.error('Failed to delete social link:', err);
      toast.error('Failed to delete social media link.');
    }
  };

  const handleToggleStatus = async (social: SocialMediaRow) => {
    try {
      // Optmistically update UI state
      setSocials((prev) =>
        prev.map((s) => (s.id === social.id ? { ...s, status: !s.status } : s))
      );
      await socialMediaService.toggleSocial(social.id);
      toast.success(`${social.name.toUpperCase()} link status updated.`);
    } catch (err) {
      console.error('Failed to toggle social link status:', err);
      toast.error('Failed to toggle status.');
      // Revert if error
      setSocials((prev) =>
        prev.map((s) => (s.id === social.id ? { ...s, status: social.status } : s))
      );
    }
  };

  if (loading && socials.length === 0) {
    return (
      <div className="border p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy custom-card-container">
        <FiLoader className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-bold text-slate-400">{t('social.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">

      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiShare2 className="text-orange-500 w-5 h-5" />
          <span>{t('social.title')}</span>
        </h2>
      </div>

      {/* Setup Form Card */}
      <GroupDiv className="space-y-6">
        <div>
          <h4 className="text-sm font-black text-slate-800 tracking-tight">{t('social.setup_title')}</h4>
          <p className="text-slate-400 text-[11px] sm:text-xs mt-1">
            {t('social.setup_subtitle')}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Select Social Media */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">{t('social.select_platform')} <span className="text-slate-300">🛈</span></label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-[5px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">{t('social.select_placeholder')}</option>
                {AVAILABLE_PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Social Media Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">{t('social.link_label')} <span className="text-slate-300">🛈</span></label>
              <input
                type="text"
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                placeholder={t('social.link_placeholder')}
                className="w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2 bg-black/[0.04] hover:bg-black/[0.08] text-inherit rounded-[5px] text-xs font-extrabold transition-all cursor-pointer border-none"
            >
              {t('social.reset')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer disabled:opacity-60 border-none flex items-center space-x-1.5"
            >
              {submitting && <FiLoader className="w-3 h-3 animate-spin" />}
              <span>{editingId !== null ? t('social.update') : t('social.save')}</span>
            </button>
          </div>
        </form>
      </GroupDiv>

      {/* List Card (Grid version) */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-800 tracking-tight">{t('social.list_title')}</h4>
          <span className="text-[11px] opacity-65 font-bold bg-black/[0.04] px-2 py-0.5 rounded-full">
            {socials.length} Configured
          </span>
        </div>

        {/* Grid Content */}
        {socials.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border rounded-[5px] shadow-xs custom-card-container">
            {t('social.no_links')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {socials.map((social) => {
              const config = getPlatformConfig(social.name);
              return (
                <div 
                  key={social.id} 
                  className={`border ${config.borderColor} rounded-[8px] p-5 shadow-2xs hover:shadow-xs transition-all duration-300 flex flex-col justify-between space-y-4 custom-card-container`}
                >
                  {/* Header: Brand Icon & Platform Name */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-full ${config.bgColor} flex items-center justify-center shadow-xs shrink-0`}>
                        {config.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-slate-800 capitalize leading-tight">
                          {config.label}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {t('social.platform_link')}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Status Switcher */}
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={social.status}
                        onChange={() => handleToggleStatus(social)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                    </label>
                  </div>

                  {/* Body: Link URL */}
                  <div className="bg-black/[0.02] p-3 rounded-[6px] border">
                    <a 
                      href={social.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-mono text-inherit opacity-75 hover:text-orange-500 break-all line-clamp-2 transition-colors block text-left"
                      title={social.link}
                    >
                      {social.link}
                    </a>
                  </div>

                  {/* Footer: Action Buttons */}
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200/40">
                    <button
                      onClick={() => handleEditClick(social)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[5px] bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200/50 text-[11px] font-bold cursor-pointer"
                      title="Edit social link"
                    >
                      <FiEdit className="w-3.5 h-3.5" />
                      <span>{t('social.edit')}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(social.id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-250/50 text-[11px] font-bold cursor-pointer"
                      title="Delete social link"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                      <span>{t('social.delete')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

