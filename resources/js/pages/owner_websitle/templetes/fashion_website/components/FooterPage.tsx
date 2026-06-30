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

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(url);
    }
  };

  return (
    <footer className="bg-white text-stone-500 pt-12 sm:pt-16 pb-16 sm:pb-10 mt-auto border-t border-stone-200/60 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-4 sm:gap-10">
          {/* Column 1: Brand & Bio */}
          <div className="col-span-3 sm:col-span-1 space-y-4 text-left">
            <span className="font-sans font-black text-xl text-stone-900 uppercase tracking-widest block transition-all duration-300 hover:text-[#E61E25] cursor-default">
              {storeInfo?.store_name || storeName}
            </span>
            <p className="text-xs leading-relaxed text-stone-500 font-medium">
              Premium haute-couture boutique specializing in minimalist organic clothing, linen collections,
              and handcrafted style lookbooks.
            </p>

            {/* Dynamic Social Icons */}
            <div className="flex items-center space-x-3 pt-2">
              {socials.map((social) => (
                <a
                  key={social.id}
                  href={formatSocialUrl(social.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-stone-200 hover:border-stone-400 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-all duration-300"
                  title={social.name}
                >
                  {getSocialIcon(social.name)}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Product Badges / Collections */}
          <div className="col-span-1 space-y-4 text-left">
            <h4 className="text-stone-900 font-black text-xs uppercase tracking-wider">Collections</h4>
            <ul className="space-y-2.5 text-xs font-semibold list-none p-0 m-0">
              {badges.length > 0 ? (
                badges.map((badge) => {
                  const targetId = badge.name.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <li key={badge.id}>
                      <a href={`#${targetId}`} className="footer-link-draw text-stone-500 hover:text-stone-900 no-underline flex items-center gap-1.5 capitalize">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: badge.background_color || '#E61E25' }}
                        />
                        {badge.name.toLowerCase()}
                      </a>
                    </li>
                  );
                })
              ) : (
                <>
                </>
              )}
            </ul>
          </div>

          {/* Column 3: Offers & Deals */}
          <div className="col-span-1 space-y-4 text-left">
            <h4 className="text-stone-900 font-black text-xs uppercase tracking-wider">Offers & Deals</h4>
            <ul className="space-y-2.5 text-xs font-semibold list-none p-0 m-0">
              {promotions.map((promo) => (
                <li key={promo.id}>
                  <a
                    href={promo.link}
                    onClick={(e) => handleLinkClick(e, promo.link)}
                    className="footer-link-draw text-stone-500 no-underline capitalize"
                  >
                    {promo.title.toLowerCase()}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact / Hub */}
          <div className="col-span-1 sm:col-span-1 space-y-4 text-left">
            <h4 className="text-stone-900 font-black text-xs uppercase tracking-wider">Contact Us</h4>
            <div className="space-y-3.5 text-xs font-semibold">
              {storeInfo?.store_address && storeInfo.store_address !== '---' && (
                <div className="flex items-start sm:gap-3 group min-w-0">
                  <div className="hidden sm:flex w-8 h-8 rounded-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-850 items-center justify-center shrink-0 text-stone-500 group-hover:text-stone-900 group-hover:bg-stone-100/50 transition-all duration-300">
                    <FiMapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-stone-400 uppercase tracking-wider leading-none">
                      <FiMapPin className="w-3.5 h-3.5 sm:hidden shrink-0 text-stone-400" />
                      {storeInfo?.store_name && storeInfo.store_name || '---'}
                    </span>
                    <span className="text-stone-700 dark:text-stone-300 leading-normal block break-words text-[11px] sm:text-xs">
                      {storeInfo.store_address}
                    </span>
                  </div>
                </div>
              )}
              {storeInfo?.store_phone && storeInfo.store_phone !== '---' && (
                <a 
                  href={`tel:${storeInfo.store_phone}`} 
                  className="flex items-start sm:items-center sm:gap-3 group text-stone-700 dark:text-stone-300 no-underline hover:text-[#E61E25] transition-colors min-w-0"
                >
                  <div className="hidden sm:flex w-8 h-8 rounded-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-850 items-center justify-center shrink-0 text-stone-500 group-hover:text-[#E61E25] group-hover:bg-[#E61E25]/5 group-hover:border-[#E61E25]/20 transition-all duration-300">
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
                  className="flex items-start sm:items-center sm:gap-3 group text-stone-700 dark:text-stone-300 no-underline hover:text-[#E61E25] transition-colors min-w-0"
                >
                  <div className="hidden sm:flex w-8 h-8 rounded-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-850 items-center justify-center shrink-0 text-stone-500 group-hover:text-[#E61E25] group-hover:bg-[#E61E25]/5 group-hover:border-[#E61E25]/20 transition-all duration-300">
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
          </div>
        </div>
      </div>
    </footer>
  );
};
