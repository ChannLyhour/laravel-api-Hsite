import React, { useState, useEffect, useRef } from 'react';
import { FiSettings, FiLoader, FiUploadCloud, FiTrash2, FiImage, FiGlobe } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { storesService, Store_setting } from '@/api/owner/stores';
import { resolveImageUrl } from '@/api/imageUtils';
import { GroupDiv } from '../../helper/GroupDiv';
import '@/pages/owner_manage/style/font.css';

interface SettingsTabProps {
  profile: any;
  ownerId?: number | string;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ profile, ownerId }) => {
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeLatitude, setStoreLatitude] = useState('');
  const [storeLongitude, setStoreLongitude] = useState('');
  const [taxPercentage, setTaxPercentage] = useState('0');
  const [shippingFee, setShippingFee] = useState('0');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('0');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoError, setLogoError] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState('');
  const [faviconError, setFaviconError] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [guestCheckout, setGuestCheckout] = useState(true);
  const [announcementText, setAnnouncementText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [checkoutDeliveryAddress, setCheckoutDeliveryAddress] = useState<'open' | 'close' | 'null'>('open');
  const [checkoutPreferredContact, setCheckoutPreferredContact] = useState<'open' | 'close' | 'null'>('open');
  const [checkoutNote, setCheckoutNote] = useState<'open' | 'close' | 'null'>('open');
  const [checkoutClaimCode, setCheckoutClaimCode] = useState<'open' | 'close' | 'null'>('open');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Reset logo preview error when URL changes
  useEffect(() => {
    setLogoError(false);
  }, [logoUrl]);

  // Reset favicon preview error when URL changes
  useEffect(() => {
    setFaviconError(false);
  }, [faviconUrl]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const res = await storesService.uploadLogo(file);
      const cleanPath = res.path ? res.path.replace(/^uploads\//, '') : res.url;
      setLogoUrl(cleanPath);
      toast.success('Brand logo uploaded successfully!');
    } catch (err) {
      console.error('Logo upload failed:', err);
      toast.error('Failed to upload brand logo. Please check image constraints.');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFavicon(true);
    try {
      const res = await storesService.uploadFavicon(file);
      const cleanPath = res.path ? res.path.replace(/^uploads\//, '') : res.url;
      setFaviconUrl(cleanPath);

      // Immediately apply the favicon to the browser tab (remove & re-create for Chrome)
      document.querySelectorAll("link[rel~='icon']").forEach(el => el.parentNode?.removeChild(el));
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = `${resolveImageUrl(cleanPath)}?v=${Date.now()}`;
      document.head.appendChild(newLink);

      // Save to API immediately so this store's favicon is persisted per-store on the server
      const isAdmin = profile?.user?.role === 'admin';
      const targetOwnerId = isAdmin ? ownerId : undefined;
      await storesService.updateStore({ favicon_url: cleanPath }, targetOwnerId);

      // Also update localStorage so App.tsx favicon effect fires right away
      try {
        const saved = localStorage.getItem('store_settings');
        const current = saved ? JSON.parse(saved) : {};
        const updated = { ...current, favicon_url: cleanPath };
        localStorage.setItem('store_settings', JSON.stringify(updated));
        window.dispatchEvent(new Event('settings_updated'));
      } catch (_) { }

      toast.success('Favicon uploaded and saved!');
    } catch (err) {
      console.error('Favicon upload failed:', err);
      toast.error('Failed to upload favicon. Please check file constraints.');
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    }
  };

  // Load configurations from API on mount
  useEffect(() => {
    const activeOwnerId = ownerId ?? profile?.user?.id;
    if (!activeOwnerId) {
      setLoading(false);
      return;
    }
    storesService.getStore(activeOwnerId)
      .then((data) => {
        if (data) {
          const loadSetting = (key: string, defaultValue: string) => {
            if (data[key] !== undefined && data[key] !== null) return String(data[key]);
            const settings = Store_setting();
            if (settings && settings[key] !== undefined) return String(settings[key]);
            return defaultValue;
          };

          setStoreName(loadSetting('store_name', '---'));
          setCustomDomain(loadSetting('custom_domain', ''));
          setStorePhone(loadSetting('store_phone', '---'));
          setStoreEmail(loadSetting('store_email', '---'));
          setStoreAddress(loadSetting('store_address', '---'));
          setStoreLatitude(loadSetting('store_latitude', ''));
          setStoreLongitude(loadSetting('store_longitude', ''));
          setTaxPercentage(loadSetting('tax_percentage', '0'));
          setShippingFee(loadSetting('shipping_fee', '0'));
          setFreeShippingThreshold(loadSetting('free_shipping_threshold', '0'));
          setLogoUrl(loadSetting('logo_url', ''));
          setFaviconUrl(loadSetting('favicon_url', ''));
          setCurrency(loadSetting('currency', 'USD'));
          setMaintenanceMode(loadSetting('maintenance_mode', 'false') === 'true');
          setGuestCheckout(loadSetting('guest_checkout', 'true') === 'true');
           setAnnouncementText(loadSetting('announcement_text', ''));
          setFooterText(loadSetting('footer_text', ''));
          setCheckoutDeliveryAddress((loadSetting('checkout_delivery_address', 'open') as any));
          setCheckoutPreferredContact((loadSetting('checkout_preferred_contact', 'open') as any));
          setCheckoutNote((loadSetting('checkout_note', 'open') as any));
          setCheckoutClaimCode((loadSetting('checkout_claim_code', 'open') as any));
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch store settings from API, loading local backup.', err);
        const saved = localStorage.getItem('store_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setStoreName(parsed.store_name || 'Food');
          setCustomDomain(parsed.custom_domain || '');
          setStorePhone(parsed.store_phone || '+855 12 345 678');
          setStoreEmail(parsed.store_email || 'contact@food.com');
          setStoreAddress(parsed.store_address || '---');
          setTaxPercentage(parsed.tax_percentage || '0');
          setShippingFee(parsed.shipping_fee || '0');
          setFreeShippingThreshold(parsed.free_shipping_threshold || '0');
          setLogoUrl(parsed.logo_url || '');
          setFaviconUrl(parsed.favicon_url || '');
          setCurrency(parsed.currency || 'USD');
          setMaintenanceMode(parsed.maintenance_mode === 'true' || parsed.maintenance_mode === true);
          setGuestCheckout(parsed.guest_checkout === 'true' || parsed.guest_checkout === true || parsed.guest_checkout === undefined);
           setAnnouncementText(parsed.announcement_text || '');
          setFooterText(parsed.footer_text || '');
          setCheckoutDeliveryAddress(parsed.checkout_delivery_address || 'open');
          setCheckoutPreferredContact(parsed.checkout_preferred_contact || 'open');
          setCheckoutNote(parsed.checkout_note || 'open');
          setCheckoutClaimCode(parsed.checkout_claim_code || 'open');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ownerId, profile]);

  const handleSaveSettings = () => {
    // Retrieve existing website settings from local storage to preserve all other keys (like payment_methods, pusher, etc.)
    let existingSettings: Record<string, any> = {};
    try {
      const saved = localStorage.getItem('store_settings');
      if (saved) {
        existingSettings = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse website settings from local storage', e);
    }

    const updatedFields: Record<string, any> = {
      store_name: storeName,
      custom_domain: customDomain,
      store_phone: storePhone,
      store_email: storeEmail,
      store_address: storeAddress,
      tax_percentage: taxPercentage,
      shipping_fee: shippingFee,
      free_shipping_threshold: freeShippingThreshold,
      logo_url: logoUrl,
      favicon_url: faviconUrl,
      currency: currency,
      maintenance_mode: String(maintenanceMode),
      guest_checkout: String(guestCheckout),
      announcement_text: announcementText,
      footer_text: footerText,
      checkout_delivery_address: checkoutDeliveryAddress,
      checkout_preferred_contact: checkoutPreferredContact,
      checkout_note: checkoutNote,
      checkout_claim_code: checkoutClaimCode,
      store_latitude: storeLatitude,
      store_longitude: storeLongitude,
    };

    const mergedSettings = {
      ...existingSettings,
      ...updatedFields,
    };

    // Save locally
    localStorage.setItem('store_settings', JSON.stringify(mergedSettings));
    window.dispatchEvent(new Event('settings_updated'));

    // Update API — pass ownerId only if user role is admin to hit PUT /stores/{id}
    const isAdmin = profile?.user?.role === 'admin';
    const targetOwnerId = isAdmin ? ownerId : undefined;

    toast.promise(
      storesService.updateStore(updatedFields, targetOwnerId),
      {
        loading: 'Saving store configurations to server...',
        success: 'Store and website configurations saved successfully!',
        error: 'Failed to save store configurations to server.',
      }
    );
  };

  const handleDiscardSettings = () => {
    setLoading(true);
    const activeOwnerId = profile?.user?.id;
    storesService.getStore(activeOwnerId)
      .then((data) => {
        if (data) {
          setStoreName(data.store_name || '---');
          setCustomDomain(data.custom_domain || '');
          setStorePhone(data.store_phone || '---');
          setStoreEmail(data.store_email || '---');
          setStoreAddress(data.store_address || '---');
          setStoreLatitude(data.store_latitude ? String(data.store_latitude) : '');
          setStoreLongitude(data.store_longitude ? String(data.store_longitude) : '');
          setTaxPercentage(data.tax_percentage !== undefined && data.tax_percentage !== null ? String(data.tax_percentage) : '0');
          setShippingFee(data.shipping_fee !== undefined && data.shipping_fee !== null ? String(data.shipping_fee) : '0');
          setFreeShippingThreshold(data.free_shipping_threshold !== undefined && data.free_shipping_threshold !== null ? String(data.free_shipping_threshold) : '0');
          setLogoUrl(data.logo_url || '');
          setFaviconUrl(data.favicon_url || '');
          setCurrency(data.currency || 'USD');
          setMaintenanceMode(data.maintenance_mode === 'true' || data.maintenance_mode === true);
          setGuestCheckout(data.guest_checkout === 'true' || data.guest_checkout === true || data.guest_checkout === undefined);
           setAnnouncementText(data.announcement_text || '');
          setFooterText(data.footer_text || '');
          setCheckoutDeliveryAddress(data.checkout_delivery_address || 'open');
          setCheckoutPreferredContact(data.checkout_preferred_contact || 'open');
          setCheckoutNote(data.checkout_note || 'open');
          setCheckoutClaimCode(data.checkout_claim_code || 'open');
        }
        toast.success('Modifications discarded. Reverted to stored server config.');
      })
      .catch((err) => {
        console.error('Failed to load fresh store settings', err);
        toast.error('Failed to discard: Server unreachable.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy">
        <FiLoader className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading system configurations...</span>
      </div>
    );
  }

  return (
    <div className="border p-6 sm:p-8 rounded-[5px] shadow-xs space-y-8 animate-fade-in font-kuntomruy custom-card-container">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiSettings className="text-orange-500" />
          <span>System & Website Settings</span>
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">Configure store brand, operational states, contact details, social links, and tax parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1 */}
        <div className="space-y-6">
          {/* Section 1: Brand details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Brand Identity & Assets</h4>
            <GroupDiv>

              {/* Store Brand Name */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Store Brand Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Name Store ..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                />
              </div>

              {/* Custom Domain */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Custom Domain / Subdomain</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g. our20s"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Used by Next.js storefront to resolve this store (e.g. <code>our20s</code> for vhsite.vercel.app/our20s, or custom domain).
                </p>
              </div>

              {/* Upload image Logo */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Brand Logo Image</label>

                <div className="flex items-start space-x-4">
                  {/* Logo Preview Container */}
                  <div className="w-24 h-24 rounded-[5px] border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {logoUrl?.trim() && !logoError ? (
                      <img
                        src={resolveImageUrl(logoUrl)}
                        alt="Logo Preview"
                        className="w-full h-full object-contain p-1.5 bg-white"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <FiImage className="w-8 h-8 stroke-[1.5]" />
                        <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">No Logo</span>
                      </div>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                        <FiLoader className="w-5 h-5 text-orange-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-[5px] text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer border-none"
                        disabled={uploadingLogo}
                      >
                        <FiUploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Upload Logo</span>
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-[5px] border border-slate-200 hover:border-rose-100 transition-all cursor-pointer"
                          title="Remove Logo"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      JPG, PNG, WebP or SVG.<br />
                      Max size: 2MB.<br />
                      Recommended: 250x100px.
                    </p>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Upload image Favicon */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Logo Favicon (Tab Icon)</label>

                <div className="flex items-start space-x-4">
                  {/* Favicon Preview Container */}
                  <div className="w-24 h-24 rounded-[5px] border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {faviconUrl?.trim() && !faviconError ? (
                      <img
                        src={resolveImageUrl(faviconUrl)}
                        alt="Favicon Preview"
                        className="w-10 h-10 object-contain p-1 bg-white rounded-md border border-slate-100 shadow-2xs"
                        onError={() => setFaviconError(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <FiGlobe className="w-8 h-8 stroke-[1.5]" />
                        <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">No Icon</span>
                      </div>
                    )}
                    {uploadingFavicon && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                        <FiLoader className="w-5 h-5 text-orange-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => faviconInputRef.current?.click()}
                        className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-[5px] text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer border-none"
                        disabled={uploadingFavicon}
                      >
                        <FiUploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Upload Favicon</span>
                      </button>
                      {faviconUrl && (
                        <button
                          type="button"
                          onClick={() => setFaviconUrl('')}
                          className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-[5px] border border-slate-200 hover:border-rose-100 transition-all cursor-pointer"
                          title="Remove Favicon"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      ICO, PNG, WebP or SVG.<br />
                      Max size: 1MB.<br />
                      Recommended: 32x32px.
                    </p>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={faviconInputRef}
                  onChange={handleFaviconUpload}
                  accept="image/*,.ico"
                  className="hidden"
                />
              </div>

            </GroupDiv>
          </div>

          {/* Section 2: Contacts & Operations */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact & Operations</h4>
            <GroupDiv>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Store Telephone</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Store Email</label>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Store Address</label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                />
              </div>

              {/* Store Latitude and Longitude */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Store Latitude</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={storeLatitude}
                    onChange={(e) => setStoreLatitude(e.target.value)}
                    placeholder="e.g. 11.5564"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Store Longitude</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={storeLongitude}
                    onChange={(e) => setStoreLongitude(e.target.value)}
                    placeholder="e.g. 104.9282"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                  />
                </div>
              </div>

              {/* Store Map Preview */}
              {(storeLatitude || storeLongitude || storeAddress) && (
                <div className="pt-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Store Location Preview</label>
                  <div className="w-full h-44 rounded-[5px] overflow-hidden border border-slate-200 bg-slate-50 relative">
                    <iframe
                      title="Store Map Preview"
                      src={
                        storeLatitude && storeLongitude
                          ? `https://maps.google.com/maps?q=${parseFloat(storeLatitude)},${parseFloat(storeLongitude)}&z=15&output=embed`
                          : `https://maps.google.com/maps?q=${encodeURIComponent(storeAddress)}&z=15&output=embed`
                      }
                      className="w-full h-full border-none"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </GroupDiv>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-6">
          {/* Section 3: Financial configuration */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financial Configurations</h4>
            <GroupDiv>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">VAT / Sales Tax Rate (%)</label>
                <input
                  type="number"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Base Currency Symbol</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="KHR">KHR (៛) - Cambodian Riel</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>
            </GroupDiv>
          </div>

          {/* Section 4: Store Operations & Content */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store Operations & Content</h4>
            <GroupDiv>
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Maintenance Mode</label>
                <div className="flex items-center space-x-3 p-3 rounded-[5px] border border-black/10">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
                  </label>
                  <span className="text-xs font-bold text-inherit opacity-75">{maintenanceMode ? 'Store is Offline' : 'Store is Online'}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">When enabled, customers will see a maintenance page instead of your storefront.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Guest Checkout</label>
                <div className="flex items-center space-x-3 bg-white p-3 rounded-[5px] border border-slate-200">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={guestCheckout}
                      onChange={(e) => setGuestCheckout(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
                  </label>
                  <span className="text-xs font-bold text-slate-600">{guestCheckout ? 'Enabled (Any user)' : 'Disabled (Login Required)'}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Allow customers to checkout without creating an account.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Website Announcement Bar</label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. Free delivery on orders over $50!"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Website Footer Copyright / Info</label>
                <textarea
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="e.g. © 2026 Your Store Name. All rights reserved."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold min-h-[80px] resize-none"
                />
              </div>
            </GroupDiv>
          </div>
        </div>

        {/* Column 3 */}
        <div className="space-y-6">
          {/* Section 5: Checkout Form Configurations */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Checkout Fields Visibility & Validation</h4>
            <GroupDiv>
              {/* Delivery Address Field */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Delivery Address Field</label>
                <select
                  value={checkoutDeliveryAddress}
                  onChange={(e) => setCheckoutDeliveryAddress(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="open">Required (Open)</option>
                  <option value="null">Optional (Null)</option>
                  <option value="close">Hidden (Close)</option>
                </select>
                <p className="text-[10px] text-slate-400 font-medium">Control whether delivery address is required, optional, or hidden on checkout.</p>
              </div>

              {/* Preferred Contact Line Field */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Preferred Contact Field</label>
                <select
                  value={checkoutPreferredContact}
                  onChange={(e) => setCheckoutPreferredContact(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="open">Required (Open)</option>
                  <option value="null">Optional (Null)</option>
                  <option value="close">Hidden (Close)</option>
                </select>
                <p className="text-[10px] text-slate-400 font-medium">Control whether preferred contact method/details are required, optional, or hidden.</p>
              </div>

              {/* Note Field */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Order Note Field</label>
                <select
                  value={checkoutNote}
                  onChange={(e) => setCheckoutNote(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="open">Required (Open)</option>
                  <option value="null">Optional (Null)</option>
                  <option value="close">Hidden (Close)</option>
                </select>
                <p className="text-[10px] text-slate-400 font-medium">Control whether the order note field is required, optional, or hidden.</p>
              </div>

              {/* Claim Code Field */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Claim Code / Voucher Field</label>
                <select
                  value={checkoutClaimCode}
                  onChange={(e) => setCheckoutClaimCode(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="open">Required (Open)</option>
                  <option value="null">Optional (Null)</option>
                  <option value="close">Hidden (Close)</option>
                </select>
                <p className="text-[10px] text-slate-400 font-medium">Control whether the voucher claim code input is required, optional, or hidden.</p>
              </div>
            </GroupDiv>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
        <button
          onClick={handleDiscardSettings}
          className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-xs font-extrabold transition-all cursor-pointer"
        >
          Discard Changes
        </button>
        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-[5px] text-xs font-extrabold shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          Save System Configs
        </button>
      </div>
    </div>
  );
};

