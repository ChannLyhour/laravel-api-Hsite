import React, { useState, useEffect } from 'react';
import { themes, type ThemeConfig } from './themes';
import { paidThemes } from './templates/paidThemes';
import { paidSmartPhoneThemes, SmartPhoneTemplateCard, SmartPhonePurchaseModal } from './templates_smart_phone';
import type { SmartPhoneThemeInfo } from './templates_smart_phone';
import { FiCheck, FiLayout, FiStar, FiShoppingCart, FiEye, FiLock, FiCreditCard, FiX, FiInfo, FiMoon, FiAward, FiCompass, FiSmartphone, FiDownload } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { templatesService, type TemplateData } from '@/api/owner/templates';
import { getStoreUrl, getStoreSlugFromDomain } from '@Security/Owner/configUrl';
import '@/pages/owner_manage/style/font.css';

interface ThemeSelectorPanelProps {
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
  ownerId?: number | string;
  profile?: any;
  storeSettings?: Record<string, any>;
}

interface ThemeMarketplaceInfo {
  author: string;
  category: string;
  price: string;
  originalPrice: string;
  rating: number;
  reviews: string;
  sales: string;
  image: string;
  badge?: string;
  badgeBg?: string;
}

// Keep the first 4 free styling themes in the panel data
const freeMarketplaceData: Record<string, ThemeMarketplaceInfo> = {
  default: {
    author: 'BiteFlow Culinary',
    category: 'Fast Food & Appetizing Diner',
    price: 'Free',
    originalPrice: '$59',
    rating: 5,
    reviews: '8.4K',
    sales: '124,530 Sales',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80',
    badge: 'Weekly Bestseller',
    badgeBg: 'bg-emerald-500 text-white',
  },
  minimal_dark_green: {
    author: 'SleekStudio',
    category: 'Grab-Style Eco Express & Delivery',
    price: 'Free',
    originalPrice: '$59',
    rating: 5,
    reviews: '3.1K',
    sales: '38,200 Sales',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
    badge: 'Hot Item',
    badgeBg: 'bg-green-500 text-white',
  },
  elegant_rose: {
    author: 'RoyalBistro Designs',
    category: 'Bakery, Cafe & Royal Buffet',
    price: 'Free',
    originalPrice: '$69',
    rating: 5,
    reviews: '1.8K',
    sales: '22,780 Sales',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80',
    badge: 'Premium Pick',
    badgeBg: 'bg-amber-500 text-white',
  },
  glass_gradient: {
    author: 'CyberDining Co.',
    category: 'Cyber Lounges & Cocktail Bars',
    price: 'Free',
    originalPrice: '$79',
    rating: 5,
    reviews: '2.4K',
    sales: '33,120 Sales',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80',
    badge: 'Future Tech',
    badgeBg: 'bg-cyan-500 text-white',
  },
  sweet_pastry: {
    author: 'PastryArtisan Co.',
    category: 'Donut, Bakery & Ice Cream Shop',
    price: 'Free',
    originalPrice: '$49',
    rating: 5,
    reviews: '1.2K',
    sales: '15,430 Sales',
    image: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=500&q=80',
    badge: 'Trending Sweet',
    badgeBg: 'bg-pink-500 text-white',
  }
};

export const ThemeSelectorPanel: React.FC<ThemeSelectorPanelProps> = ({
  currentTheme = 'default',
  onSelectTheme,
  ownerId,
  profile,
  storeSettings,
}) => {
  const activeThemeId = themes[currentTheme] ? currentTheme : 'default';

  // Database templates list fetched from backend
  const [dbTemplates, setDbTemplates] = useState<TemplateData[]>([]);

  // Unlocked premium themes from local storage
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unlocked_premium_themes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Unlocked smartphone templates from local storage
  const [unlockedSmartPhoneTemplates, setUnlockedSmartPhoneTemplates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unlocked_smartphone_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load owned templates status from backend on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const list = await templatesService.listTemplates();
        setDbTemplates(list);

        // Filter premium web themes purchased
        const premiumOwnedKeys = list
          .filter(t => t.owned && !t.theme_key.startsWith('smartphone_'))
          .map(t => t.theme_key);

        // Filter smartphone templates purchased
        const smartphoneOwnedKeys = list
          .filter(t => t.owned && t.theme_key.startsWith('smartphone_'))
          .map(t => t.theme_key);

        setUnlockedThemes(prev => {
          const merged = Array.from(new Set([...prev, ...premiumOwnedKeys]));
          localStorage.setItem('unlocked_premium_themes', JSON.stringify(merged));
          return merged;
        });

        setUnlockedSmartPhoneTemplates(prev => {
          const merged = Array.from(new Set([...prev, ...smartphoneOwnedKeys]));
          localStorage.setItem('unlocked_smartphone_templates', JSON.stringify(merged));
          return merged;
        });
      } catch (err) {
        console.warn('Failed to load owned templates from backend', err);
      }
    };

    fetchTemplates();
  }, []);

  // Active smartphone template
  const [activeSmartPhoneTemplate, setActiveSmartPhoneTemplate] = useState<string>(() => {
    try {
      return localStorage.getItem('active_smartphone_template') || '';
    } catch {
      return '';
    }
  });

  // Modal and payment states
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [themeToBuy, setThemeToBuy] = useState<ThemeConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  // Smartphone template purchase modal state
  const [showSmartPhonePurchaseModal, setShowSmartPhonePurchaseModal] = useState(false);
  const [smartPhoneTemplateToBuy, setSmartPhoneTemplateToBuy] = useState<SmartPhoneThemeInfo | null>(null);
  const [isSmartPhoneProcessing, setIsSmartPhoneProcessing] = useState(false);
  const [smartPhonePaymentForm, setSmartPhonePaymentForm] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const freeThemeIds = [
    'default',
    'minimal_dark_green',
    'elegant_rose',
    'glass_gradient',
    'sweet_pastry'
  ];
  const premiumThemeIds = ['cafe_shop', 'electronic', 'fashion', 'fashion_website_general', 'minimal_dark_gold'];

  const freeThemes = freeThemeIds.map(id => themes[id]).filter(Boolean);
  const premiumThemes = premiumThemeIds.map(id => themes[id]).filter(Boolean);

  const isAdmin = profile?.user?.role === 'admin';

  const visiblePremiumThemes = premiumThemes.filter(theme => {
    if (isAdmin) return true;
    const dbTpl = dbTemplates.find(t => t.theme_key === theme.id);
    return dbTpl ? dbTpl.owned : unlockedThemes.includes(theme.id);
  });

  const visibleMobileThemes = Object.values(paidSmartPhoneThemes).filter(template => {
    if (isAdmin) return true;
    const dbTpl = dbTemplates.find(t => t.theme_key === template.id);
    return dbTpl ? dbTpl.owned : unlockedSmartPhoneTemplates.includes(template.id);
  });

  const getStoreSlug = () => {
    const path = window.location.pathname;
    if (path.startsWith('/owner=')) {
      return path.substring(7);
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('store') || '';
  };

  const handleLivePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const resolvedOwnerId = ownerId || storeSettings?.hashid || storeSettings?.owner_id || storeSettings?.created_by || (profile?.user?.role === 'admin'
      ? (localStorage.getItem('selected_owner_id') || profile?.user?.hashid || profile?.user?.id)
      : (profile?.user?.hashid || profile?.user?.id));
    const resolvedStoreName = storeSettings?.custom_domain ? getStoreSlugFromDomain(storeSettings.custom_domain) : (storeSettings?.store_name || 'Store');
    
    if (resolvedOwnerId && resolvedStoreName && resolvedStoreName !== 'Store') {
      const path = getStoreUrl(resolvedStoreName, resolvedOwnerId);
      window.open(path, '_blank');
    } else {
      const storeSlug = getStoreSlug();
      window.open(`/${storeSlug}`, '_blank');
    }
  };

  const handleThemeAction = (e: React.MouseEvent, theme: ThemeConfig, isPremium: boolean) => {
    e.stopPropagation();
    
    const dbTpl = isPremium ? dbTemplates.find(t => t.theme_key === theme.id) : null;
    const isUnlocked = !isPremium || (dbTpl ? dbTpl.owned : unlockedThemes.includes(theme.id));

    if (isUnlocked) {
      onSelectTheme(theme.id);
    } else {
      if (profile?.user?.role === 'admin') {
        toast.error('This template is locked. Please assign it from the Admin Panel.');
        return;
      }
      setThemeToBuy(theme);
      setShowPurchaseModal(true);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeToBuy) return;

    if (!paymentForm.cardName || !paymentForm.cardNumber || !paymentForm.expiry || !paymentForm.cvv) {
      toast.error('Please fill out all payment details.');
      return;
    }

    setIsProcessing(true);

    const backendTpl = dbTemplates.find(t => t.theme_key === themeToBuy.id);
    if (!backendTpl) {
      toast.error('Template is not registered in backend database.');
      setIsProcessing(false);
      return;
    }

    try {
      // Create order ref (mock bank charge reference)
      const mockOrderRef = `ABA-TPL-${Date.now()}`;
      const res = await templatesService.purchaseTemplate(backendTpl.tpl_code, mockOrderRef);

      if (res.success) {
        setIsProcessing(false);
        const updatedUnlocked = [...unlockedThemes, themeToBuy.id];
        setUnlockedThemes(updatedUnlocked);
        localStorage.setItem('unlocked_premium_themes', JSON.stringify(updatedUnlocked));
        setDbTemplates(prev => prev.map(t => t.theme_key === themeToBuy.id ? { ...t, owned: true } : t));
        
        toast.success(`${themeToBuy.name} unlocked successfully!`);
        onSelectTheme(themeToBuy.id);

        if (res.download_token) {
          const downloadUrl = templatesService.getDownloadUrl(res.download_token);
          // Trigger file download
          window.location.href = downloadUrl;
        }
        
        // Reset state
        setShowPurchaseModal(false);
        setThemeToBuy(null);
        setPaymentForm({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
      } else {
        toast.error('Failed to complete purchase on server.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Payment processing failed.');
      setIsProcessing(false);
    }
  };

  // ── Smartphone Template Handlers ──
  const handleSmartPhonePurchase = (template: SmartPhoneThemeInfo) => {
    setSmartPhoneTemplateToBuy(template);
    setShowSmartPhonePurchaseModal(true);
  };

  const handleSmartPhoneActivate = (templateId: string) => {
    setActiveSmartPhoneTemplate(templateId);
    localStorage.setItem('active_smartphone_template', templateId);
    window.dispatchEvent(new Event('settings_updated'));
    toast.success(`Smartphone template activated!`);
  };

  const handleSmartPhonePreview = (_templateId: string) => {
    const resolvedOwnerId = ownerId || storeSettings?.hashid || storeSettings?.owner_id || storeSettings?.created_by || (profile?.user?.role === 'admin'
      ? (localStorage.getItem('selected_owner_id') || profile?.user?.hashid || profile?.user?.id)
      : (profile?.user?.hashid || profile?.user?.id));
    const resolvedStoreName = storeSettings?.custom_domain ? getStoreSlugFromDomain(storeSettings.custom_domain) : (storeSettings?.store_name || 'Store');
    
    if (resolvedOwnerId && resolvedStoreName && resolvedStoreName !== 'Store') {
      const path = getStoreUrl(resolvedStoreName, resolvedOwnerId);
      const separator = path.includes('?') ? '&' : '?';
      window.open(`${path}${separator}view=mobile`, '_blank');
    } else {
      const storeSlug = getStoreSlug();
      window.open(`/${storeSlug}?view=mobile`, '_blank');
    }
  };

  const handleSmartPhonePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartPhoneTemplateToBuy) return;

    if (!smartPhonePaymentForm.cardName || !smartPhonePaymentForm.cardNumber || !smartPhonePaymentForm.expiry || !smartPhonePaymentForm.cvv) {
      toast.error('Please fill out all payment details.');
      return;
    }

    setIsSmartPhoneProcessing(true);

    const backendTpl = dbTemplates.find(t => t.theme_key === smartPhoneTemplateToBuy.id);
    if (!backendTpl) {
      toast.error('Template is not registered in backend database.');
      setIsSmartPhoneProcessing(false);
      return;
    }

    try {
      // Create order ref (mock bank charge reference)
      const mockOrderRef = `ABA-MOB-${Date.now()}`;
      const res = await templatesService.purchaseTemplate(backendTpl.tpl_code, mockOrderRef);

      if (res.success) {
        setIsSmartPhoneProcessing(false);
        const updatedUnlocked = [...unlockedSmartPhoneTemplates, smartPhoneTemplateToBuy.id];
        setUnlockedSmartPhoneTemplates(updatedUnlocked);
        localStorage.setItem('unlocked_smartphone_templates', JSON.stringify(updatedUnlocked));
        setDbTemplates(prev => prev.map(t => t.theme_key === smartPhoneTemplateToBuy.id ? { ...t, owned: true } : t));
        
        toast.success(`${smartPhoneTemplateToBuy.name} unlocked successfully!`);
        handleSmartPhoneActivate(smartPhoneTemplateToBuy.id);

        if (res.download_token) {
          const downloadUrl = templatesService.getDownloadUrl(res.download_token);
          // Trigger file download
          window.location.href = downloadUrl;
        }
        
        // Reset state
        setShowSmartPhonePurchaseModal(false);
        setSmartPhoneTemplateToBuy(null);
        setSmartPhonePaymentForm({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
      } else {
        toast.error('Failed to complete purchase on server.');
        setIsSmartPhoneProcessing(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Payment processing failed.');
      setIsSmartPhoneProcessing(false);
    }
  };

  // Helper to render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: rating }).map((_, idx) => (
          <FiStar key={idx} className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
        ))}
      </div>
    );
  };

  const renderThemeCard = (theme: ThemeConfig, isPremium: boolean) => {
    const isSelected = theme.id === activeThemeId;
    const mInfo = isPremium 
      ? paidThemes[theme.id] 
      : (freeMarketplaceData[theme.id] || freeMarketplaceData.default);
    
    const dbTpl = isPremium ? dbTemplates.find(t => t.theme_key === theme.id) : null;
    const isUnlocked = !isPremium || (dbTpl ? dbTpl.owned : unlockedThemes.includes(theme.id));

    return (
      <div
        key={theme.id}
        onClick={(e) => handleThemeAction(e, theme, isPremium)}
        className={`relative border rounded-[4px] overflow-hidden cursor-pointer transition-all duration-300 flex flex-col group bg-white ${
          isSelected
            ? 'border-orange-500 ring-2 ring-orange-500/10 shadow-md scale-[1.01]'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        {isPremium ? (
          /* Premium template preview image */
          <div className="h-44 relative bg-slate-100 overflow-hidden select-none border-b border-slate-150 shrink-0">
            <img 
              src={mInfo.image} 
              alt={dbTpl ? dbTpl.title : theme.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            {/* Badge */}
            {mInfo.badge && (
              <span className={`absolute top-3 left-3 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-[3px] shadow-2xs ${mInfo.badgeBg}`}>
                {mInfo.badge}
              </span>
            )}

            {/* Premium Lock Overlay */}
            {!isUnlocked && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center transition-all opacity-100 group-hover:bg-slate-900/50 animate-fade-in">
                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-sm text-slate-800 text-[10px] font-bold uppercase tracking-wider scale-95 group-hover:scale-100 transition-all">
                  <FiLock className="text-amber-500 w-3 h-3" />
                  <span>Premium Template</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Free style color gradient */
          <div className={`h-36 relative bg-gradient-to-r ${theme.previewColor} overflow-hidden select-none border-b border-slate-100 shrink-0 flex items-center justify-center transition-all duration-300 group-hover:brightness-[1.03]`}>
            
            {/* Glassmorphic Icon Bubble in center */}
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-lg text-white text-2xl transition-transform duration-300 group-hover:scale-105">
              {theme.id === 'default' && <FiLayout className="w-6 h-6 text-white drop-shadow-xs" />}
              {theme.id.startsWith('minimal_dark') && <FiMoon className="w-6 h-6 text-white drop-shadow-xs" />}
              {theme.id === 'elegant_rose' && <FiAward className="w-6 h-6 text-white drop-shadow-xs" />}
              {theme.id === 'glass_gradient' && <FiCompass className="w-6 h-6 text-white drop-shadow-xs" />}
            </div>

            {/* Badge */}
            {mInfo.badge && (
              <span className={`absolute top-3 left-3 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-[3px] shadow-2xs ${mInfo.badgeBg}`}>
                {mInfo.badge}
              </span>
            )}
          </div>
        )}

        {/* Card Details Block */}
        <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow gap-3.5">
          {/* Title, Category & Authors */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-start justify-between gap-2.5">
              <h5 className="font-black text-slate-800 text-sm sm:text-base leading-tight hover:text-primary transition-colors line-clamp-2 min-h-[38px] flex-grow pr-1">
                {dbTpl ? dbTpl.title : theme.name}
              </h5>
              
              {/* Prices */}
              <div className="text-right shrink-0 flex flex-col items-end pt-0.5">
                <span className="text-[10px] font-semibold text-slate-400 line-through leading-none">{mInfo.originalPrice}</span>
                <span className={`text-sm font-black leading-none mt-0.5 ${isPremium && !isUnlocked ? 'text-amber-600' : 'text-slate-900'}`}>
                  {isPremium && isUnlocked ? 'Unlocked' : (dbTpl ? '$' + parseFloat(dbTpl.price).toFixed(2) : mInfo.price)}
                </span>
              </div>
            </div>

            {/* Color Swatch Indicators */}
            <div className="flex items-center space-x-1.5 py-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Color Theme:</span>
              <div className="flex items-center -space-x-1">
                <span 
                  className={`w-3.5 h-3.5 rounded-full border border-white bg-gradient-to-r ${theme.previewColor} shadow-3xs`} 
                  title="Gradient Accent Palette"
                />
                <span 
                  className={`w-3.5 h-3.5 rounded-full border border-white ${theme.primaryBg.includes('bg-gradient') ? 'bg-cyan-500' : theme.primaryBg} shadow-3xs`} 
                  title="Primary Color Indicator"
                />
              </div>
            </div>

            {/* Author Line */}
            <p className="text-[10px] font-semibold text-slate-400 leading-none">
              by <span className="text-slate-500 hover:text-primary transition-colors cursor-pointer">{mInfo.author}</span> in <span className="text-primary hover:underline cursor-pointer">{mInfo.category}</span>
            </p>
          </div>

          {/* Star Ratings & Sales Count */}
          <div className="flex items-center justify-between text-slate-400 border-t border-slate-50 pt-3">
            <div className="flex items-center gap-1">
              {renderStars(mInfo.rating)}
              <span className="text-[10px] font-black text-slate-600">({mInfo.reviews})</span>
            </div>
            
            <span className="text-[10px] font-bold text-slate-500">{mInfo.sales}</span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            {/* Cart Selection / Purchase Toggle */}
            <button
              type="button"
              onClick={(e) => handleThemeAction(e, theme, isPremium)}
              className={`p-2 rounded-[4px] transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300'
              }`}
              title={
                isSelected 
                  ? 'Theme applied and activated' 
                  : isPremium && !isUnlocked 
                    ? (profile?.user?.role === 'admin' ? 'This template is locked. Please assign it from the Admin Panel.' : 'Purchase this premium template') 
                    : 'Apply this storefront theme'
              }
            >
              {isSelected ? (
                <FiCheck className="w-4 h-4" />
              ) : isPremium && !isUnlocked ? (
                <FiShoppingCart className="w-4 h-4 text-amber-500" />
              ) : (
                <FiShoppingCart className="w-4 h-4" />
              )}
            </button>

            {/* Live Preview Button */}
            <button
              type="button"
              onClick={handleLivePreviewClick}
              className="flex-grow py-2 px-3.5 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-850 hover:bg-slate-50 text-xs font-black rounded-[4px] transition-all cursor-pointer text-center flex items-center justify-center space-x-1"
            >
              <FiEye className="w-3.5 h-3.5 text-slate-400" />
              <span>Live Preview</span>
            </button>

            {isPremium && isUnlocked && (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  const backendTpl = dbTemplates.find(t => t.theme_key === theme.id);
                  if (backendTpl) {
                    try {
                      const loadingId = toast.loading('Generating download link...');
                      const res = await templatesService.generateDownloadToken(backendTpl.tpl_code);
                      toast.dismiss(loadingId);
                      if (res.success && res.download_token) {
                        window.location.href = templatesService.getDownloadUrl(res.download_token);
                        toast.success('Download started!');
                      } else {
                        toast.error('Failed to generate download link.');
                      }
                    } catch (err: any) {
                      toast.dismiss();
                      toast.error(err.message || 'Download failed.');
                    }
                  }
                }}
                className="p-2 border border-slate-200 hover:border-emerald-350 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-[4px] transition-all cursor-pointer flex items-center justify-center shrink-0"
                title="Download Source Code ZIP"
              >
                <FiDownload className="w-4 h-4" />
              </button>
            )}

            {/* Apply / Buy / Active Action Button */}
            <button
              type="button"
              onClick={(e) => handleThemeAction(e, theme, isPremium)}
              className={`px-4 py-2 text-xs font-black rounded-[4px] transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white shadow-2xs'
                  : isPremium && !isUnlocked
                    ? (profile?.user?.role === 'admin'
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 border-transparent text-white shadow-2xs')
                    : 'bg-white hover:bg-orange-50 border-orange-500 text-orange-600 hover:text-orange-700'
              }`}
            >
              {isSelected 
                ? 'Active' 
                : isPremium && !isUnlocked 
                  ? (profile?.user?.role === 'admin' ? 'Locked' : 'Buy Theme') 
                  : 'Apply Theme'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 font-kuntomruy text-slate-700">
      
      {/* SECTION 1: Free Style & Colors */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <FiLayout className="text-orange-500 w-5 h-5 shrink-0" />
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Free Customization Styles</span>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 rounded-[3px]">
                  Free
                </span>
              </h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Apply premium layout colors and styles to your digital storefront completely free of charge.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {freeThemes.map((theme) => renderThemeCard(theme, false))}
        </div>
      </div>

      {/* SECTION 2: Premium Theme Templates */}
      {visiblePremiumThemes.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <FiCreditCard className="text-amber-500 w-5 h-5 shrink-0" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <span>Premium Theme Templates</span>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-[3px] ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isAdmin ? 'Admin Assign' : 'Assigned'}
                  </span>
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Elevate your storefront with premium templates assigned to your store.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {visiblePremiumThemes.map((theme) => renderThemeCard(theme, true))}
          </div>
        </div>
      )}

      {/* SECTION 3: Premium Mobile App Templates */}
      {visibleMobileThemes.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <FiSmartphone className="text-violet-500 w-5 h-5 shrink-0" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2 flex-wrap">
                  <span>Premium Mobile App Templates</span>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-violet-100 text-violet-700 rounded-[3px]">
                    📱 Phone
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 rounded-[3px]">
                    📟 Tablet
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-[3px] ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isAdmin ? 'Admin Assign' : 'Assigned'}
                  </span>
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Transform your storefront with responsive smartphone & tablet app templates assigned to your store.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {visibleMobileThemes.map((template) => {
              const dbTpl = dbTemplates.find(t => t.theme_key === template.id);
              const overriddenTemplate = dbTpl ? {
                ...template,
                name: dbTpl.title,
                price: '$' + parseFloat(dbTpl.price).toFixed(2)
              } : template;
              const isUnlocked = dbTpl ? !!dbTpl.owned : unlockedSmartPhoneTemplates.includes(template.id);
              
              return (
                <SmartPhoneTemplateCard
                  key={template.id}
                  template={overriddenTemplate}
                  isUnlocked={isUnlocked}
                  isActive={activeSmartPhoneTemplate === template.id}
                  onPurchase={isAdmin ? () => toast.error('This template is locked. Please assign it from the Admin Panel.') : handleSmartPhonePurchase}
                  onActivate={handleSmartPhoneActivate}
                  onPreview={handleSmartPhonePreview}
                  isAdmin={isAdmin}
                  onDownload={async (templateId) => {
                    const backendTpl = dbTemplates.find(t => t.theme_key === templateId);
                    if (backendTpl) {
                      try {
                        const loadingId = toast.loading('Generating download link...');
                        const res = await templatesService.generateDownloadToken(backendTpl.tpl_code);
                        toast.dismiss(loadingId);
                        if (res.success && res.download_token) {
                          window.location.href = templatesService.getDownloadUrl(res.download_token);
                          toast.success('Download started!');
                        } else {
                          toast.error('Failed to generate download link.');
                        }
                      } catch (err: any) {
                        toast.dismiss();
                        toast.error(err.message || 'Download failed.');
                      }
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      )}



      {/* PREMIUM PURCHASE MODAL */}
      {showPurchaseModal && themeToBuy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[8px] max-w-md w-full overflow-hidden shadow-2xl animate-fade-in border border-slate-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <FiLock className="text-amber-500 w-4 h-4" />
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Unlock Storefront Template</h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowPurchaseModal(false); setThemeToBuy(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePurchaseSubmit} className="p-5 space-y-5 flex-grow overflow-y-auto">
              
              {/* Product Preview Info */}
              <div className="bg-orange-50/50 border border-orange-100/50 p-4 rounded-[4px] flex items-center space-x-4">
                <img 
                  src={paidThemes[themeToBuy.id]?.image} 
                  alt={themeToBuy.name} 
                  className="w-16 h-16 object-cover rounded-[3px] border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm leading-tight">{themeToBuy.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">One-time developer license purchase</p>
                  <div className="mt-2 flex items-baseline space-x-1.5">
                    <span className="text-xs text-slate-400 line-through leading-none">
                      {paidThemes[themeToBuy.id]?.originalPrice}
                    </span>
                    <span className="text-base font-black text-amber-600 leading-none">
                      {paidThemes[themeToBuy.id]?.price}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details Form */}
              <div className="space-y-3.5">
                <h5 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FiCreditCard className="text-slate-400" />
                  <span>Cardholder Information</span>
                </h5>

                {/* Cardholder Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Card Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    disabled={isProcessing}
                    value={paymentForm.cardName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-semibold focus:outline-none focus:border-orange-500 disabled:bg-slate-50 transition-colors"
                  />
                </div>

                {/* Card Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="•••• •••• •••• ••••"
                    disabled={isProcessing}
                    value={paymentForm.cardNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-semibold focus:outline-none focus:border-orange-500 disabled:bg-slate-50 transition-colors"
                  />
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Expiration</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      disabled={isProcessing}
                      value={paymentForm.expiry}
                      onChange={(e) => setPaymentForm({ ...paymentForm, expiry: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-semibold focus:outline-none focus:border-orange-500 disabled:bg-slate-50 transition-colors text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">CVV</label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      maxLength={4}
                      disabled={isProcessing}
                      value={paymentForm.cvv}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-semibold focus:outline-none focus:border-orange-500 disabled:bg-slate-50 transition-colors text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Secure Info Alert */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-[4px] flex items-start space-x-2.5">
                <FiInfo className="text-slate-400 w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-[10px] font-semibold text-slate-500 leading-normal">
                  Your billing details are transmitted securely. By continuing, you agree to buy the template developer license.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-[4px] text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <span>Authorize & Pay {paidThemes[themeToBuy.id]?.price}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SMARTPHONE TEMPLATE PURCHASE MODAL */}
      {showSmartPhonePurchaseModal && smartPhoneTemplateToBuy && (
        <SmartPhonePurchaseModal
          template={smartPhoneTemplateToBuy}
          isProcessing={isSmartPhoneProcessing}
          paymentForm={smartPhonePaymentForm}
          setPaymentForm={setSmartPhonePaymentForm}
          onSubmit={handleSmartPhonePurchaseSubmit}
          onClose={() => {
            setShowSmartPhonePurchaseModal(false);
            setSmartPhoneTemplateToBuy(null);
          }}
        />
      )}
    </div>
  );
};
