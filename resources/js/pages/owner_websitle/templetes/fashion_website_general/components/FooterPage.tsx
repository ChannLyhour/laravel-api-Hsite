import React, { useState, useEffect } from 'react';
import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import { FaFacebookF, FaTelegramPlane, FaTiktok, FaInstagram, FaYoutube, FaWhatsapp, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import { storesService } from '@/api/owner/stores';
import type { StoreRow } from '@/api/owner/stores';
import { socialMediaService } from '@/api/owner/socialMedia';
import type { SocialMediaRow } from '@/api/owner/socialMedia';
import { productBadgesService } from '@/api/owner/productBadges';
import type { ProductBadge } from '@/api/owner/productBadges';
import '../styles/animation.css';
import type { FooterPageProps } from '../types';
import { FASHION_ROUTES } from '../routes';
import { client } from '@/api/client';
import { publicFlashDealsService } from '@/api/created_by/getFlashDealsOwnerByid';
import { resolveImageUrl } from '../utils/imageUtils';
import abaLogo from '@/pages/main_website/Company_bank/aba.png';
import bakongLogo from '@/pages/main_website/Company_bank/bakong.png';
import acledaLogo from '@/pages/main_website/Company_bank/acleda.png';



export const FooterPage: React.FC<FooterPageProps> = ({
  storeName = '---',
  stores,
  ownerUserId,
  onNavigate,
  categories = [],
}) => {
  const [storeInfo, setStoreInfo] = useState<StoreRow | null>(stores || null);
  const [socials, setSocials] = useState<SocialMediaRow[]>([]);
  const [badges, setBadges] = useState<ProductBadge[]>([]);
  const [promotions, setPromotions] = useState<{ id: string | number; title: string; link: string }[]>([]);

  useEffect(() => {
    const userId = ownerUserId || stores?.created_by;
    if (!userId) {
      if (stores) {
        setStoreInfo(stores);
      }
      return;
    }

    const fetchData = async () => {
      try {
        const [storeData, socialData, badgeData] = await Promise.all([
          storesService.getStoreByOwner(userId),
          socialMediaService.getPublicSocials(userId),
          productBadgesService.getProductBadges(100, 0, userId)
        ]);
        setStoreInfo(storeData);
        setSocials(socialData);
        setBadges(badgeData.filter(b => b.status));

        const resolvedSlug = (storeData?.store_name || storeName).replace(/\s+/g, '_');
        const resolvedHomeUrl = FASHION_ROUTES.getHome(resolvedSlug, userId);

        // Fetch Offers & Deals
        try {
          const [fd, feat, cs] = await Promise.allSettled([
            publicFlashDealsService.getFlashDealsByOwnerId(userId, 0, 5),
            client.get<any[]>(`/featured-deals?owner_id=${userId}&limit=5&skip=0`),
            client.get<any[]>(`/clearance-sales?owner_id=${userId}&limit=5&skip=0`),
          ]);

          const list: { id: string | number; title: string; link: string }[] = [];

          if (fd.status === 'fulfilled' && Array.isArray(fd.value)) {
            fd.value.filter((d: any) => d.is_published && d.status !== 'Expired').forEach((deal: any) => {
              list.push({
                id: `flash-${deal.id}`,
                title: deal.title || 'Flash Deal',
                link: `${resolvedHomeUrl}#flash-deals`,
              });
            });
          }

          if (feat.status === 'fulfilled' && Array.isArray(feat.value)) {
            feat.value.filter((d: any) => d.is_published && d.status !== 'Expired').forEach((deal: any) => {
              list.push({
                id: `featured-${deal.id}`,
                title: deal.title || 'Featured Deal',
                link: `${resolvedHomeUrl}#featured-deals`,
              });
            });
          }

          if (cs.status === 'fulfilled' && Array.isArray(cs.value)) {
            cs.value.filter((d: any) => d.is_active).forEach((deal: any) => {
              list.push({
                id: `clearance-${deal.id}`,
                title: deal.title || 'Clearance Sale',
                link: `${resolvedHomeUrl}#clearance-sale`,
              });
            });
          }

          // Fallback if no active promotions are found
          if (list.length === 0) {
            list.push({ id: 'flash-fallback', title: 'Flash Deals', link: `${resolvedHomeUrl}#flash-deals` });
            list.push({ id: 'featured-fallback', title: 'Featured Deals', link: `${resolvedHomeUrl}#featured-deals` });
            list.push({ id: 'clearance-fallback', title: 'Clearance Sale', link: `${resolvedHomeUrl}#clearance-sale` });
          }

          setPromotions(list);
        } catch (promoErr) {
          console.warn('Failed to load promotions in footer:', promoErr);
          setPromotions([
            { id: 'flash-fallback', title: 'Flash Deals', link: `${resolvedHomeUrl}#flash-deals` },
            { id: 'featured-fallback', title: 'Featured Deals', link: `${resolvedHomeUrl}#featured-deals` },
            { id: 'clearance-fallback', title: 'Clearance Sale', link: `${resolvedHomeUrl}#clearance-sale` }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch data in fashion footer:', err);
        if (stores) {
          setStoreInfo(stores);
        }
      }
    };
    fetchData();
  }, [stores, ownerUserId]);

  const formatSocialUrl = (url?: string) => {
    if (!url || url === '#' || url === '---') return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const getSocialIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('facebook')) return <FaFacebookF className="w-3.5 h-3.5 text-[#1877F2]" />;
    if (n.includes('telegram')) return <FaTelegramPlane className="w-3.5 h-3.5 text-[#37aee2]" />;
    if (n.includes('tiktok')) return <FaTiktok className="w-3.5 h-3.5 text-black" />;
    if (n.includes('instagram')) return <FaInstagram className="w-3.5 h-3.5 text-[#E4405F]" />;
    if (n.includes('youtube')) return <FaYoutube className="w-3.5 h-3.5 text-[#CD201F]" />;
    if (n.includes('whatsapp')) return <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />;
    if (n.includes('x') || n.includes('twitter')) return <FaTwitter className="w-3.5 h-3.5 text-[#1DA1F2]" />;
    if (n.includes('linkedin')) return <FaLinkedinIn className="w-3.5 h-3.5 text-[#0077B5]" />;
    return null;
  };

  const storeSlug = (storeInfo?.store_name || storeName).replace(/\s+/g, '_');
  const homeUrl = FASHION_ROUTES.getHome(storeSlug, ownerUserId || storeInfo?.created_by);
  const shopUrl = FASHION_ROUTES.getShop(ownerUserId || storeInfo?.created_by, storeSlug);

  const topCategories = React.useMemo(() => {
    return (categories || []).filter((c: any) => !c.parent_id);
  }, [categories]);

  const enabledPayments = React.useMemo(() => {
    if (!storeInfo) return [];
    
    // Parse value if it is a JSON string
    let settings = storeInfo;
    if (storeInfo.value) {
      try {
        const parsed = typeof storeInfo.value === 'string' ? JSON.parse(storeInfo.value) : storeInfo.value;
        settings = { ...storeInfo, ...parsed };
      } catch (e) {
        console.warn('Failed to parse store settings in footer:', e);
      }
    }

    const methodsBase = [
      { key: 'aba', name: 'ABA PAY', bg: 'bg-[#005D7E]' },
      { key: 'bakong', name: 'Bakong KHQR', bg: 'bg-[#b30006]' },
      { key: 'acleda', name: 'ACLEDA PAY', bg: 'bg-[#0d3b66]' },
      { key: 'cod', name: 'Cash on Delivery' }
    ];

    const activeKeys = methodsBase.filter(p => {
      const methods = settings.payment_methods || {};
      const config = methods[p.key];
      if (config) return config.enabled;

      const legacyConfig = settings[`payment_gw_${p.key}`];
      if (legacyConfig) {
        try {
          const parsed = typeof legacyConfig === 'string' ? JSON.parse(legacyConfig) : legacyConfig;
          return parsed.enabled;
        } catch { return false; }
      }
      return p.key === 'cod' || p.key === 'transfer';
    });

    return activeKeys.map(p => {
      const methods = settings.payment_methods || {};
      const config = methods[p.key] || {};
      const configValues = config.values || {};

      // 1. If custom logo is uploaded dynamically, use it!
      if (configValues.logo_url) {
        return {
          key: p.key,
          name: p.name,
          logo: (
            <img 
              src={resolveImageUrl(configValues.logo_url)} 
              alt={p.name} 
              className="w-10 h-7 rounded border border-stone-200 bg-white object-contain p-[2px]" 
            />
          )
        };
      }

      // 2. Otherwise, fall back to clean custom stylized labels
      let fallbackLogo = null;
      if (p.key === 'aba') {
        fallbackLogo = (
          <img src={abaLogo} alt="ABA Bank" className="w-10 h-7 rounded object-contain bg-white border border-stone-200 p-[2px]" />
        );
      } else if (p.key === 'bakong') {
        fallbackLogo = (
          <img src={bakongLogo} alt="Bakong KHQR" className="w-10 h-7 rounded object-contain bg-white border border-stone-200 p-[2px]" />
        );
      } else if (p.key === 'card') {
        fallbackLogo = (
          <div className="w-10 h-7 rounded shrink-0 flex items-center justify-center bg-stone-100 border border-stone-200/85 select-none">
            <div className="grid grid-cols-2 gap-[1px] p-[1px]">
              <span className="text-[5.5px] font-black text-blue-800 leading-none">VISA</span>
              <span className="text-[5.5px] font-black text-red-500 leading-none">MC</span>
              <span className="text-[5.5px] font-black text-green-700 leading-none">JCB</span>
              <span className="text-[5.5px] font-black text-blue-900 leading-none">UP</span>
            </div>
          </div>
        );
      } else if (p.key === 'acleda') {
        fallbackLogo = (
          <img src={acledaLogo} alt="ACLEDA Bank" className="w-10 h-7 rounded object-contain bg-white border border-stone-200 p-[2px]" />
        );
      } else if (p.key === 'wing') {
        fallbackLogo = (
          <img src="https://www.wingbank.com.kh/wp-content/uploads/2021/11/Wing-Bank-Logo-Vertical.png" alt="Wing Bank" className="w-10 h-7 rounded object-contain bg-white border border-stone-200 p-[2px]" />
        );
      } else if (p.key === 'chipmong') {
        fallbackLogo = (
          <img src="https://www.chipmongbank.com/assets/img/logo.png" alt="Chip Mong Bank" className="w-10 h-7 rounded object-contain bg-white border border-stone-200 p-[2px]" />
        );
      } else if (p.key === 'transfer') {
        fallbackLogo = (
          <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center bg-stone-100 border border-stone-200 select-none">
            <span className="text-[13px]">🏦</span>
          </div>
        );
      } else if (p.key === 'cod') {
        fallbackLogo = (
          <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center bg-stone-100 border border-stone-200 select-none">
            <span className="text-[13px]">💵</span>
          </div>
        );
      } else {
        fallbackLogo = (
          <div className={`w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center font-bold text-[8px] select-none uppercase ${p.bg || 'bg-stone-100 border border-stone-200'}`}>
            {p.key}
          </div>
        );
      }

      return {
        key: p.key,
        name: p.name,
        logo: fallbackLogo
      };
    });
  }, [storeInfo]);

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(url);
    }
  };

  return (
    <footer className="bg-stone-50 text-stone-600 pt-16 pb-8 mt-auto border-t border-stone-200/80 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-10 gap-x-8 lg:gap-12">
          
          {/* Column 1: Brand & Newsletter */}
          <div className="space-y-6 text-left">
            <div className="space-y-3">
              <span className="font-sans font-black text-xl text-stone-900 uppercase tracking-[0.2em] block transition-all duration-300 hover:text-[#E61E25] cursor-pointer"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate(homeUrl);
                  }
                }}
              >
                {storeInfo?.store_name || storeName}
              </span>
              <p className="text-[9px] tracking-widest text-stone-400 font-extrabold uppercase leading-normal">
                Minimalist Organic Essentials
              </p>
            </div>

            {/* Newsletter input */}
            <div className="space-y-3 pr-2">
              <h5 className="text-[10px] font-black text-stone-900 uppercase tracking-widest m-0">Newsletter</h5>
              <p className="text-[11px] text-stone-500 font-semibold leading-normal m-0">
                Join our list for exclusive releases and 10% off your first order.
              </p>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="flex items-center border-b border-stone-300 py-1"
              >
                <input 
                  type="email" 
                  required
                  placeholder="Enter email address"
                  className="appearance-none bg-transparent border-none w-full text-stone-855 mr-3 py-1 px-2 text-xs font-bold leading-tight focus:outline-none placeholder:text-stone-350"
                />
                <button 
                  type="submit"
                  className="bg-transparent hover:text-[#E61E25] text-stone-900 text-[10px] font-black uppercase tracking-wider border-none cursor-pointer transition-colors p-1"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Discover / Shopping */}
          <div className="space-y-4 text-left">
            <h4 className="text-stone-900 font-black text-xs uppercase tracking-wider">Explore</h4>
            <ul className="space-y-3 text-xs font-semibold list-none p-0 m-0">
              <li>
                <a 
                  href={homeUrl} 
                  onClick={(e) => handleLinkClick(e, homeUrl)}
                  className="text-stone-500 hover:text-[#E61E25] transition-colors no-underline footer-link-draw block py-0.5"
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href={shopUrl} 
                  onClick={(e) => handleLinkClick(e, shopUrl)}
                  className="text-stone-500 hover:text-[#E61E25] transition-colors no-underline footer-link-draw block py-0.5"
                >
                  Shop All
                </a>
              </li>
              {topCategories.slice(0, 4).map((c: any) => {
                const catSlug = `#${c.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                const catUrl = FASHION_ROUTES.getShop(ownerUserId || storeInfo?.created_by, storeSlug, { hash: catSlug });
                return (
                  <li key={c.id}>
                    <a 
                      href={catUrl} 
                      onClick={(e) => handleLinkClick(e, catUrl)}
                      className="text-stone-500 hover:text-[#E61E25] transition-colors no-underline footer-link-draw block py-0.5 capitalize"
                    >
                      {c.name.toLowerCase()}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div className="space-y-4 text-left">
            <h4 className="text-stone-900 font-black text-xs uppercase tracking-wider">Assistance</h4>
            <ul className="space-y-3 text-xs font-semibold list-none p-0 m-0">
              <li>
                <a href="#shipping" className="text-stone-500 hover:text-[#E61E25] transition-colors no-underline footer-link-draw block py-0.5">
                  Shipping & Delivery
                </a>
              </li>
              <li>
                <a href="#returns" className="text-stone-500 hover:text-[#E61E25] transition-colors no-underline footer-link-draw block py-0.5">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#size-guide" className="text-stone-500 hover:text-[#E61E25] transition-colors no-underline footer-link-draw block py-0.5">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#faq" className="text-stone-500 hover:text-[#E61E25] transition-colors no-underline footer-link-draw block py-0.5">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="space-y-4 text-left">
            <h4 className="text-stone-900 font-black text-xs uppercase tracking-wider">Contact Us</h4>
            <div className="space-y-3.5 text-xs font-semibold">
              {storeInfo?.store_address && storeInfo.store_address !== '---' && (
                <div className="flex items-start sm:gap-3 group min-w-0">
                  <div className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-stone-200 items-center justify-center shrink-0 text-stone-500 group-hover:text-stone-900 group-hover:bg-stone-100 transition-all duration-300">
                    <FiMapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-stone-400 uppercase tracking-wider leading-none">
                      <FiMapPin className="w-3.5 h-3.5 sm:hidden shrink-0 text-stone-400" />
                      {storeInfo?.store_name || 'Store'}
                    </span>
                    <span className="text-stone-700 leading-normal block break-words text-[11px] sm:text-xs">
                      {storeInfo.store_address}
                    </span>
                  </div>
                </div>
              )}
              {storeInfo?.store_phone && storeInfo.store_phone !== '---' && (
                <a 
                  href={`tel:${storeInfo.store_phone}`} 
                  className="flex items-start sm:items-center sm:gap-3 group text-stone-700 no-underline hover:text-[#E61E25] transition-colors min-w-0"
                >
                  <div className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-stone-200 items-center justify-center shrink-0 text-stone-500 group-hover:text-[#E61E25] group-hover:bg-white group-hover:border-[#E61E25] transition-all duration-300">
                    <FiPhone className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-stone-400 uppercase tracking-wider leading-none">
                      <FiPhone className="w-3.5 h-3.5 sm:hidden shrink-0 text-stone-400" />
                      Call Support
                    </span>
                    <span className="font-semibold block leading-normal break-all text-[11px] sm:text-xs">
                      {storeInfo.store_phone}
                    </span>
                  </div>
                </a>
              )}
              {storeInfo?.store_email && storeInfo.store_email !== '---' && (
                <a 
                  href={`mailto:${storeInfo.store_email}`} 
                  className="flex items-start sm:items-center sm:gap-3 group text-stone-700 no-underline hover:text-[#E61E25] transition-colors min-w-0"
                >
                  <div className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-stone-200 items-center justify-center shrink-0 text-stone-500 group-hover:text-[#E61E25] group-hover:bg-white group-hover:border-[#E61E25] transition-all duration-300">
                    <FiMail className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1 min-w-0 w-full">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-stone-400 uppercase tracking-wider leading-none">
                      <FiMail className="w-3.5 h-3.5 sm:hidden shrink-0 text-stone-400" />
                      Email Us
                    </span>
                    <span className="font-semibold block leading-normal break-all text-[11px] sm:text-xs truncate max-w-full">
                      {storeInfo.store_email}
                    </span>
                  </div>
                </a>
              )}
            </div>
            
            {/* Dynamic Social Icons */}
            {socials.length > 0 && (
              <div className="flex items-center space-x-3 pt-4 border-t border-stone-200/40 mt-4">
                {socials.map((social) => (
                  <a
                    key={social.id}
                    href={formatSocialUrl(social.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-stone-200 hover:border-stone-900 hover:bg-stone-900 hover:text-white text-stone-500 flex items-center justify-center transition-all duration-300 shadow-3xs"
                    title={social.name}
                  >
                    {getSocialIcon(social.name)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Copyright Bar */}
        <div className="pt-8 mt-12 border-t border-stone-200/80 flex flex-col lg:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-widest text-stone-400">
          <p className="m-0 text-center lg:text-left">© {new Date().getFullYear()} {storeInfo?.store_name || storeName}. All Rights Reserved.</p>
          
          {/* Enabled Payment Gateways Logos */}
          {enabledPayments.length > 0 && (
            <div className="flex items-center justify-center flex-wrap gap-2.5 animate-fade-in select-none">
              {enabledPayments.map((p) => (
                <div 
                  key={p.key} 
                  title={p.name}
                  className="transition-transform duration-300 hover:scale-105"
                >
                  {p.logo}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 m-0 text-center lg:text-right">
            <span className="cursor-pointer hover:text-stone-900 transition-colors">Privacy Policy</span>
            <span className="text-stone-200 font-normal select-none">•</span>
            <span className="cursor-pointer hover:text-stone-900 transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
