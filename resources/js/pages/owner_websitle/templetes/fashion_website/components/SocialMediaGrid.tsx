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
               <section className="w-full bg-white dark:bg-stone-950 py-4 border-t border-stone-200/40 dark:border-stone-850 font-sans overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         {/* Section Header */}
                         <div className="text-center max-w-xl mx-auto mb-2 space-y-3">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-850 rounded-full text-stone-500 dark:text-stone-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                   <FiShare2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                                   Connect With Us
                              </span>
                              <h2 className="text-3xl sm:text-4xl font-serif text-stone-900 dark:text-stone-100 tracking-tight animate-pulse">
                                   <span className="italic text-stone-900 dark:text-stone-100">Social Channels</span>
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
          <section className="w-full bg-white dark:bg-stone-950 py-4 border-t border-stone-200/40 dark:border-stone-850 font-sans overflow-hidden">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Section Header */}
                    <div className="text-center max-w-xl mx-auto mb-2 space-y-3">
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-850 rounded-full text-stone-500 dark:text-stone-400 text-[10px] font-black uppercase tracking-widest">
                              <FiShare2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                              Connect With Us
                         </span>
                         <h2 className="text-3xl sm:text-4xl font-serif text-stone-900 dark:text-stone-100 tracking-tight">
                              <span className="italic text-stone-900 dark:text-stone-100">Social Channels</span>
                         </h2>
                    </div>

                    {/* Media Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 max-w-4xl mx-auto justify-center">
                         {socials.map((social) => {
                              const config = getPlatformConfig(social.name);
                              return (
                                   <a
                                        key={social.id}
                                        href={social.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative group/grid block rounded-xl border border-stone-200/80 dark:border-stone-850 shadow-3xs hover:shadow-2xs hover:border-stone-300 dark:hover:border-stone-700 transition-all duration-350 bg-white dark:bg-stone-900 cursor-pointer no-underline w-full aspect-square"
                                   >
                                        <div className="absolute top-2 right-2 text-stone-300 dark:text-stone-600 group-hover/grid:text-stone-500 dark:group-hover/grid:text-stone-400 transition-colors pointer-events-none">
                                             <FiExternalLink className="w-3 h-3" />
                                        </div>
                                        <div className="p-3 flex flex-col items-center justify-center text-center space-y-2 h-full">
                                             {/* Circular Brand Icon */}
                                             <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center shadow-2xs transform group-hover/grid:scale-108 transition-transform duration-300`}>
                                                  {config.icon}
                                             </div>

                                             {/* Text info */}
                                             <div className="space-y-0.5">
                                                  <h3 className="text-2xs sm:text-xs font-black text-stone-900 dark:text-stone-100 capitalize tracking-wide">
                                                       {config.label}
                                                  </h3>
                                                  <p className="text-[8px] sm:text-[9px] text-stone-400 dark:text-stone-550 font-bold uppercase tracking-wider">
                                                       Follow
                                                  </p>
                                             </div>
                                        </div>
                                   </a>
                              );
                         })}
                    </div>

               </div>
          </section>
     );
};
