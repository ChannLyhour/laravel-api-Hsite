import React, { useState, useEffect } from 'react';
import { FiShare2, FiExternalLink, FiGlobe } from 'react-icons/fi';
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
import { socialMediaService, type SocialMediaRow } from '@/api/owner/socialMedia';
import type { StoreRow } from '@/api/owner/stores';
import { SkeletonSocialMediaGrid } from './helpers/SkeletonSt';

export interface SocialMediaGridProps {
     storeName?: string;
     stores?: StoreRow;
     ownerUserId?: number | string;
     onNavigate?: (to: string) => void;
}

const getPlatformConfig = (platform: string) => {
     const name = platform.toLowerCase();
     switch (name) {
          case 'facebook':
               return {
                    icon: <FaFacebookF className="w-5 h-5 text-white" />,
                    bgColor: 'bg-[#1877F2]',
                    hoverColor: 'hover:bg-[#1877F2]/90',
                    borderColor: 'border-[#1877F2]/10',
                    textColor: 'text-[#1877F2]',
                    label: 'Facebook',
               };
          case 'instagram':
               return {
                    icon: <FaInstagram className="w-5 h-5 text-white" />,
                    bgColor: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
                    hoverColor: 'hover:opacity-90',
                    borderColor: 'border-[#ee2a7b]/10',
                    textColor: 'text-[#ee2a7b]',
                    label: 'Instagram',
               };
          case 'tiktok':
               return {
                    icon: <FaTiktok className="w-5 h-5 text-white" />,
                    bgColor: 'bg-black',
                    hoverColor: 'hover:bg-stone-900',
                    borderColor: 'border-black/10',
                    textColor: 'text-black dark:text-white',
                    label: 'TikTok',
               };
          case 'telegram':
               return {
                    icon: <FaTelegramPlane className="w-5 h-5 text-white" />,
                    bgColor: 'bg-[#229ED9]',
                    hoverColor: 'hover:bg-[#229ED9]/90',
                    borderColor: 'border-[#229ED9]/10',
                    textColor: 'text-[#229ED9]',
                    label: 'Telegram',
               };
          case 'youtube':
               return {
                    icon: <FaYoutube className="w-5 h-5 text-white" />,
                    bgColor: 'bg-[#FF0000]',
                    hoverColor: 'hover:bg-[#FF0000]/90',
                    borderColor: 'border-[#FF0000]/10',
                    textColor: 'text-[#FF0000]',
                    label: 'YouTube',
               };
          case 'pinterest':
               return {
                    icon: <FaPinterest className="w-5 h-5 text-white" />,
                    bgColor: 'bg-[#BD081C]',
                    hoverColor: 'hover:bg-[#BD081C]/90',
                    borderColor: 'border-[#BD081C]/10',
                    textColor: 'text-[#BD081C]',
                    label: 'Pinterest',
               };
          case 'twitter':
               return {
                    icon: <FaTwitter className="w-5 h-5 text-white" />,
                    bgColor: 'bg-[#1DA1F2]',
                    hoverColor: 'hover:bg-[#1DA1F2]/90',
                    borderColor: 'border-[#1DA1F2]/10',
                    textColor: 'text-[#1DA1F2]',
                    label: 'Twitter',
               };
          case 'linkedin':
               return {
                    icon: <FaLinkedinIn className="w-5 h-5 text-white" />,
                    bgColor: 'bg-[#0A66C2]',
                    hoverColor: 'hover:bg-[#0A66C2]/90',
                    borderColor: 'border-[#0A66C2]/10',
                    textColor: 'text-[#0A66C2]',
                    label: 'LinkedIn',
               };
          default:
               return {
                    icon: <FiGlobe className="w-5 h-5 text-white" />,
                    bgColor: 'bg-stone-500',
                    hoverColor: 'hover:bg-stone-600',
                    borderColor: 'border-stone-500/10',
                    textColor: 'text-stone-500',
                    label: platform,
               };
     }
};

export const SocialMediaGrid: React.FC<SocialMediaGridProps> = ({
     ownerUserId,
}) => {
     const [socials, setSocials] = useState<SocialMediaRow[]>([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          if (ownerUserId) {
               const startTime = Date.now();
               socialMediaService.getPublicSocials(ownerUserId)
                    .then(data => {
                         const active = (data || []).filter(s => s.status);
                         setSocials(active);
                    })
                    .catch(err => {
                         console.error('Failed to load public socials:', err);
                    })
                    .finally(() => {
                         const elapsed = Date.now() - startTime;
                         const remaining = Math.max(0, 3000 - elapsed);
                         setTimeout(() => {
                              setLoading(false);
                         }, remaining);
                    });
          } else {
               setLoading(false);
          }
     }, [ownerUserId]);

     if (loading) {
          return (
               <section className="w-full bg-white dark:bg-stone-950 py-8 border-t border-stone-200/40 dark:border-stone-850 font-sans overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         {/* Section Header */}
                         <div className="text-center max-w-xl mx-auto mb-6 space-y-1 select-none animate-pulse">
                              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#E61E25]">
                                   Stay Connected
                              </span>
                              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight uppercase">
                                   Our Social Channels
                              </h2>
                         </div>
                         <SkeletonSocialMediaGrid />
                    </div>
               </section>
          );
     }

     if (socials.length === 0) {
          return null; // hide section if no social media links configured
     }

     return (
          <section className="w-full bg-white dark:bg-stone-950 py-8 border-t border-stone-200/40 dark:border-stone-850 font-sans overflow-hidden">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Section Header */}
                    <div className="text-center max-w-xl mx-auto mb-6 space-y-1 select-none">
                         <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#E61E25]">
                              Stay Connected
                         </span>
                         <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight uppercase">
                              Our Social Channels
                         </h2>
                    </div>

                    {/* Media Grid */}
                    <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto">
                         {socials.map((social) => {
                              const config = getPlatformConfig(social.name);
                              return (
                                   <a
                                        key={social.id}
                                        href={social.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group/social flex items-center gap-3.5 px-4.5 py-3 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-lg hover:border-stone-400 dark:hover:border-stone-700 hover:shadow-xs transition-all duration-300 cursor-pointer text-left no-underline"
                                   >
                                        {/* Icon with brand background */}
                                        <div className={`w-8.5 h-8.5 rounded-[4px] ${config.bgColor} flex items-center justify-center shadow-3xs group-hover/social:scale-105 transition-all duration-300`}>
                                             {config.icon}
                                        </div>

                                        {/* Text details */}
                                        <div className="flex flex-col select-none">
                                             <p className="text-[10px] font-black text-stone-850 dark:text-stone-200 uppercase tracking-widest leading-none m-0">
                                                  {config.label}
                                             </p>
                                             <p className="text-[7.5px] font-bold text-stone-400 uppercase tracking-wider mt-1.5 mb-0 group-hover/social:text-[#E61E25] transition-colors leading-none">
                                                  Go To Page
                                             </p>
                                        </div>
                                   </a>
                              );
                         })}
                    </div>

               </div>
          </section>
     );
};
