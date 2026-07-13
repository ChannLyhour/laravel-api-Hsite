import React, { useState, useEffect } from 'react';
import { FiMapPin, FiPhone, FiMail, FiSend, FiCheck } from 'react-icons/fi';
import { FaFacebookF, FaTelegramPlane, FaTiktok, FaInstagram, FaYoutube, FaWhatsapp, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import type { StoreRow } from '@/api/owner/stores';
import { socialMediaService } from '@/api/owner/socialMedia';
import type { SocialMediaRow } from '@/api/owner/socialMedia';
import { themes } from '@/pages/owner_manage/templete_website/themes';
import { useOwnerURL } from '@/app/OwnerURL';
import { getLightTheme } from './utils/themeHelper';
import { resolveImageUrl } from '@/api/imageUtils';

interface FooterPageProps {
    token: string | null;
    stores: StoreRow | null;
    onNavigate: (to: string) => void;
    storeName?: string;
    ownerUserId?: number | string;
}

export const FooterPage: React.FC<FooterPageProps> = ({
    token: _token,
    stores,
    onNavigate,
    storeName = '',
    ownerUserId
}) => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [socials, setSocials] = useState<SocialMediaRow[]>([]);
    const activeTheme = getLightTheme(themes[stores?.website_theme || 'default'] || themes.default);

    useEffect(() => {
        if (ownerUserId) {
            socialMediaService.getPublicSocials(ownerUserId)
                .then(setSocials)
                .catch(err => console.error('Failed to fetch socials in free footer:', err));
        }
    }, [ownerUserId]);

    const { buildLink: buildStoreLink } = useOwnerURL(
        ownerUserId || stores?.created_by || stores?.owner_id || stores?.hashid,
        storeName || stores?.store_name
    );

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setSubscribed(true);
            setEmail('');
        }
    };

    const getSocialIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('facebook')) return <FaFacebookF className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover/social:scale-110 text-[#1877F2]" />;
        if (n.includes('telegram')) return <FaTelegramPlane className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover/social:scale-110 text-[#37aee2]" />;
        if (n.includes('tiktok')) return <FaTiktok className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover/social:scale-110 text-black" />;
        if (n.includes('instagram')) return <FaInstagram className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover/social:scale-110 text-[#E4405F]" />;
        if (n.includes('youtube')) return <FaYoutube className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover/social:scale-110 text-[#CD201F]" />;
        if (n.includes('whatsapp')) return <FaWhatsapp className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover/social:scale-110 text-[#25D366]" />;
        if (n.includes('x') || n.includes('twitter')) return <FaTwitter className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover/social:scale-110 text-[#1DA1F2]" />;
        if (n.includes('linkedin')) return <FaLinkedinIn className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover/social:scale-110 text-[#0077B5]" />;
        return null;
    };

    const formatSocialUrl = (url?: string) => {
        if (!url || url === '#' || url === '---') return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    return (
        <footer className={`pt-24 pb-12 relative overflow-hidden font-sans border-t transition-all duration-300 ${activeTheme.footerBg}`}>
            {/* High-end ambient visual assets using currentColor for perfect theme blending */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03] pointer-events-none"></div>

            {/* Glowing Accent Top Line */}
            <div className="bg-gradient-to-r from-transparent via-white/10 to-transparent h-[1px] w-full absolute top-0 left-0"></div>

            {/* Glowing bottom-right ambient mesh */}
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>
            {/* Glowing top-left ambient mesh */}
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-black/10 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* Brand block (Column 1) */}
                    <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 space-y-6">
                        <div className="flex items-center space-x-3 text-white">
                            {stores?.logo_url ? (
                                <div className="relative group/logo">
                                    <div className={`absolute -inset-1.5 bg-gradient-to-r ${activeTheme.gradientClass || 'from-orange-500 to-amber-400'} rounded-[6px] blur-sm opacity-10 group-hover/logo:opacity-30 transition duration-300`}></div>
                                    <img
                                        src={resolveImageUrl(stores.logo_url)}
                                        alt={stores.store_name || storeName || 'BiteFlow Store'}
                                        className={`relative h-11 w-auto object-contain rounded-[5px] border ${activeTheme.borderClass} shadow-md bg-white p-1`}
                                    />
                                </div>
                            ) : (
                                <div className={`bg-gradient-to-tr ${activeTheme.gradientClass || 'from-orange-500 to-amber-400'} p-2.5 rounded-[5px] text-white shadow-lg ${activeTheme.shadowClass || 'shadow-orange-500/20'}`}>
                                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707-.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                    </svg>
                                </div>
                            )}
                            <span className={`text-2xl tracking-tight text-white ${activeTheme.headingFont}`}>
                                {stores?.store_name || storeName || 'BiteFlow Store'}
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed font-medium text-slate-500 max-w-sm">
                            Crafting premium gourmet culinary experiences and delivering fresh, delicious chef-made meals directly to your doorstep in 30 minutes.
                        </p>
                    </div>

                    {/* Links Column (Column 2) */}
                    <div className="col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-2 space-y-5">
                        <h4 className="text-sm font-black uppercase text-white tracking-wider">Quick Links</h4>
                        <ul className="space-y-3.5 text-sm font-semibold">
                            <li>
                                <a
                                    href={buildStoreLink('/')}
                                    onClick={(e) => { e.preventDefault(); onNavigate(buildStoreLink('/')); }}
                                    className={`group flex items-center space-x-2 text-slate-450 hover:${activeTheme.primaryText} transition-all duration-300`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full scale-0 group-hover:scale-100 transition-all duration-300 ease-out origin-left ${activeTheme.primaryBg}`}></span>
                                    <span className="group-hover:translate-x-1 transition-transform duration-300">Home</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href={buildStoreLink('/menu')}
                                    onClick={(e) => { e.preventDefault(); onNavigate(buildStoreLink('/menu')); }}
                                    className={`group flex items-center space-x-2 text-slate-455 hover:${activeTheme.primaryText} transition-all duration-300`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full scale-0 group-hover:scale-100 transition-all duration-300 ease-out origin-left ${activeTheme.primaryBg}`}></span>
                                    <span className="group-hover:translate-x-1 transition-transform duration-300">Our Menu</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href={buildStoreLink('/policies/privacy-policy')}
                                    onClick={(e) => { e.preventDefault(); onNavigate(buildStoreLink('/policies/privacy-policy')); }}
                                    className={`group flex items-center space-x-2 text-slate-450 hover:${activeTheme.primaryText} transition-all duration-300`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full scale-0 group-hover:scale-100 transition-all duration-300 ease-out origin-left ${activeTheme.primaryBg}`}></span>
                                    <span className="group-hover:translate-x-1 transition-transform duration-300">Privacy Policy</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href={buildStoreLink('/policies/refund-policy')}
                                    onClick={(e) => { e.preventDefault(); onNavigate(buildStoreLink('/policies/refund-policy')); }}
                                    className={`group flex items-center space-x-2 text-slate-450 hover:${activeTheme.primaryText} transition-all duration-300`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full scale-0 group-hover:scale-100 transition-all duration-300 ease-out origin-left ${activeTheme.primaryBg}`}></span>
                                    <span className="group-hover:translate-x-1 transition-transform duration-300">Refund Policy</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Get in Touch (Column 3) */}
                    <div className="col-span-1 sm:col-span-1 md:col-span-3 lg:col-span-3 space-y-5">
                        <h4 className="text-sm font-black uppercase text-white tracking-wider">Get in touch</h4>
                        <div className="space-y-4">
                            {/* Address Card */}
                            <div className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/10 transition-all duration-300 shadow-sm">
                                <div className="w-9 h-9 bg-black/25 border border-white/5 text-slate-400 group-hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 shadow-inner group-hover:scale-105">
                                    <FiMapPin className="w-4 h-4 text-current" />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">Location</p>
                                    <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors leading-relaxed break-words">
                                        {stores?.store_address || '---'}
                                    </p>
                                </div>
                            </div>

                            {/* Phone Card */}
                            <div className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/10 transition-all duration-300 shadow-sm">
                                <div className="w-9 h-9 bg-black/25 border border-white/5 text-slate-400 group-hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 shadow-inner group-hover:scale-105">
                                    <FiPhone className="w-4 h-4 text-current" />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">Phone</p>
                                    <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors leading-relaxed break-words">
                                        {stores?.store_phone || '---'}
                                    </p>
                                </div>
                            </div>

                            {/* Email Card */}
                            <div className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/10 transition-all duration-300 shadow-sm">
                                <div className="w-9 h-9 bg-black/25 border border-white/5 text-slate-400 group-hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 shadow-inner group-hover:scale-105">
                                    <FiMail className="w-4 h-4 text-current" />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">Email</p>
                                    <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors leading-relaxed break-words">
                                        {stores?.store_email || 'info@food.com'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter (Column 4) */}
                    <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3 space-y-6">
                        <div className="space-y-2">
                            <h4 className="text-sm font-black uppercase text-white tracking-wider">Stay Gourmet</h4>
                            <p className="text-xs font-semibold leading-relaxed text-slate-500">
                                Subscribe for exclusive tasting menus, chef updates, and premium discount events.
                            </p>
                        </div>
                        {subscribed ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-3 text-emerald-500 animate-[fade-in_0.3s_ease-out_forwards]">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <FiCheck className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-extrabold text-white">Successfully Subscribed!</p>
                                    <p className="text-[10px] text-emerald-400 mt-0.5">Welcome to our culinary updates.</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="relative flex items-center group/form">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/25 border border-white/10 focus:border-white/20 focus:bg-black/40 text-white rounded-xl pl-4 pr-12 py-3.5 text-xs font-semibold focus:outline-none transition-all placeholder:text-slate-500 focus:ring-1 focus:ring-white/5"
                                />
                                <button
                                    type="submit"
                                    className={`absolute right-1.5 p-2 ${activeTheme.primaryBg} ${activeTheme.primaryHover} text-white rounded-lg transition-all duration-300 hover:shadow-lg ${activeTheme.shadowClass} cursor-pointer active:scale-95 flex items-center justify-center border-none`}
                                    aria-label="Subscribe"
                                >
                                    <FiSend className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        )}
                    </div>

                </div>

                <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs font-semibold text-slate-500">
                    <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                        <span className="text-slate-500 font-medium">
                            &copy; {new Date().getFullYear()} {stores?.store_name || storeName || 'BiteFlow Store'}. All rights reserved.
                        </span>
                        <span className="hidden sm:block text-slate-700">·</span>
                        <span className="inline-flex items-center space-x-1.5 text-slate-500 font-medium">
                            <span>Made with</span>
                            <svg className="w-3.5 h-3.5 text-rose-450 fill-rose-450" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <span>by</span>
                            <a
                                href="https://github.com/ChannLyhour"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-bold transition-opacity hover:opacity-80 hover:underline ${activeTheme.primaryText}`}
                            >
                                ChannLyhour
                            </a>
                        </span>
                    </div>
                    <div className="flex space-x-3.5">
                        {socials.map((social) => (
                            <a
                                key={social.id}
                                href={formatSocialUrl(social.link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 shadow-sm cursor-pointer group/social"
                                title={social.name}
                            >
                                {getSocialIcon(social.name)}
                            </a>
                        ))}
                    </div>
                </div>

            </div>
        </footer>
    );
};

