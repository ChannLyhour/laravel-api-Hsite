import React, { useState, useEffect, useRef } from 'react';
import { FiSettings, FiLoader, FiUploadCloud, FiTrash2, FiImage, FiGlobe, FiMapPin } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { storesService, Store_setting } from '@/api/owner/stores';
import { resolveImageUrl } from '@/api/imageUtils';
import { GroupDiv } from '../../helper/GroupDiv';
import '@/pages/owner_manage/style/font.css';
import { BrandIdentityOperationsTab } from './System_Website_Settings/Brand_Identity_Operations_Tab';
import { CheckoutFormVisibility } from './System_Website_Settings/CheckoutForm_Visibility';
import { FinancialConfigurationsTab } from './System_Website_Settings/Financial_Configurations_Tab';
import { StoreOperationsContent } from './System_Website_Settings/Store_Operations_Content';
import { useTranslation } from '../../lang/i18n';

interface SettingsTabProps {
  profile: any;
  ownerId?: number | string;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ profile, ownerId }) => {
  const { t } = useTranslation();
  const activeOwnerId = ownerId ?? profile?.user?.id;
  const [loading, setLoading] = useState(true);
  const [activeInnerTab, setActiveInnerTab] = useState<'brand' | 'financial' | 'operations' | 'checkout'>('brand');

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
  const [customerChat, setCustomerChat] = useState(true);
  const [sendChatOrder, setSendChatOrder] = useState(true);
  const [announcementText, setAnnouncementText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [checkoutDeliveryAddress, setCheckoutDeliveryAddress] = useState<'open' | 'close' | 'null'>('open');
  const [checkoutPreferredContact, setCheckoutPreferredContact] = useState<'open' | 'close' | 'null'>('open');
  const [checkoutNote, setCheckoutNote] = useState<'open' | 'close' | 'null'>('open');
  const [checkoutClaimCode, setCheckoutClaimCode] = useState<'open' | 'close' | 'null'>('open');
  const [preferredContactPhone, setPreferredContactPhone] = useState(true);
  const [preferredContactTelegram, setPreferredContactTelegram] = useState(true);
  const [preferredContactWhatsapp, setPreferredContactWhatsapp] = useState(true);

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

  const handleAutoGetStoreLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    const loadingToast = toast.loading('Accessing GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setStoreLatitude(latitude.toFixed(8));
        setStoreLongitude(longitude.toFixed(8));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            }
          );
          const data = await res.json();
          toast.dismiss(loadingToast);

          if (data) {
            const fullAddress = data.display_name || '';
            const cleanAddress = fullAddress
              .replace(/, Cambodia$/, '')
              .replace(/, \d{5,6}$/, '')
              .trim();
            setStoreAddress(cleanAddress);
            toast.success('Location coordinates detected and address updated!');
          } else {
            toast.success('Location coordinates detected!');
          }
        } catch (err) {
          toast.dismiss(loadingToast);
          toast.success('Location coordinates detected!');
        }
      },
      (error) => {
        toast.dismiss(loadingToast);
        toast.error('Failed to access location. Please check your browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10005 }
    );
  };

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
        const saved = localStorage.getItem(`store_settings_owner_${activeOwnerId}`);
        const current = saved ? JSON.parse(saved) : {};
        const updated = { ...current, favicon_url: cleanPath };
        localStorage.setItem(`store_settings_owner_${activeOwnerId}`, JSON.stringify(updated));
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
            try {
              const scoped = localStorage.getItem(`store_settings_owner_${activeOwnerId}`);
              if (scoped) {
                const parsed = JSON.parse(scoped);
                if (parsed && parsed[key] !== undefined && parsed[key] !== null) {
                  return String(parsed[key]);
                }
              }
            } catch (_) {}
            return defaultValue;
          };

          setStoreName(loadSetting('store_name', ''));
          setCustomDomain(loadSetting('custom_domain', ''));
          setStorePhone(loadSetting('store_phone', ''));
          setStoreEmail(loadSetting('store_email', ''));
          const locationData = data.location_store;
          setStoreAddress(locationData?.store_address || loadSetting('store_address', ''));
          setStoreLatitude(locationData?.store_latitude ? String(locationData.store_latitude) : loadSetting('store_latitude', ''));
          setStoreLongitude(locationData?.store_longitude ? String(locationData.store_longitude) : loadSetting('store_longitude', ''));
          setTaxPercentage(loadSetting('tax_percentage', '0'));
          setShippingFee(loadSetting('shipping_fee', '0'));
          setFreeShippingThreshold(loadSetting('free_shipping_threshold', '0'));
          setLogoUrl(loadSetting('logo_url', ''));
          setFaviconUrl(loadSetting('favicon_url', ''));
          setCurrency(loadSetting('currency', 'USD'));
          setMaintenanceMode(loadSetting('maintenance_mode', 'false') === 'true');
          setGuestCheckout(loadSetting('guest_checkout', 'true') === 'true');
          setCustomerChat(loadSetting('customer_chat', 'true') === 'true');
          setSendChatOrder(loadSetting('send_chat_order', 'true') === 'true');
          setAnnouncementText(loadSetting('announcement_text', ''));
          setFooterText(loadSetting('footer_text', ''));
          setCheckoutDeliveryAddress((loadSetting('checkout_delivery_address', 'open') as any));
          setCheckoutPreferredContact((loadSetting('checkout_preferred_contact', 'open') as any));
          setPreferredContactPhone(loadSetting('preferred_contact_phone', 'true') === 'true');
          setPreferredContactTelegram(loadSetting('preferred_contact_telegram', 'true') === 'true');
          setPreferredContactWhatsapp(loadSetting('preferred_contact_whatsapp', 'true') === 'true');
          setCheckoutNote((loadSetting('checkout_note', 'open') as any));
          setCheckoutClaimCode((loadSetting('checkout_claim_code', 'open') as any));
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch store settings from API, loading local backup.', err);
        const saved = localStorage.getItem(`store_settings_owner_${activeOwnerId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setStoreName(parsed.store_name || 'Food');
          setCustomDomain(parsed.custom_domain || '');
          setStorePhone(parsed.store_phone || '+855 12 345 678');
          setStoreEmail(parsed.store_email || 'contact@food.com');
          setStoreAddress(parsed.store_address || '');
          setTaxPercentage(parsed.tax_percentage || '0');
          setShippingFee(parsed.shipping_fee || '0');
          setFreeShippingThreshold(parsed.free_shipping_threshold || '0');
          setLogoUrl(parsed.logo_url || '');
          setFaviconUrl(parsed.favicon_url || '');
          setCurrency(parsed.currency || 'USD');
          setMaintenanceMode(parsed.maintenance_mode === 'true' || parsed.maintenance_mode === true);
          setGuestCheckout(parsed.guest_checkout === 'true' || parsed.guest_checkout === true || parsed.guest_checkout === undefined);
          setCustomerChat(parsed.customer_chat === 'true' || parsed.customer_chat === true || parsed.customer_chat === undefined);
          setSendChatOrder(parsed.send_chat_order === 'true' || parsed.send_chat_order === true || parsed.send_chat_order === undefined);
          setAnnouncementText(parsed.announcement_text || '');
          setFooterText(parsed.footer_text || '');
          setCheckoutDeliveryAddress(parsed.checkout_delivery_address || 'open');
          setCheckoutPreferredContact(parsed.checkout_preferred_contact || 'open');
          setPreferredContactPhone(parsed.preferred_contact_phone === 'true' || parsed.preferred_contact_phone === true || parsed.preferred_contact_phone === undefined);
          setPreferredContactTelegram(parsed.preferred_contact_telegram === 'true' || parsed.preferred_contact_telegram === true || parsed.preferred_contact_telegram === undefined);
          setPreferredContactWhatsapp(parsed.preferred_contact_whatsapp === 'true' || parsed.preferred_contact_whatsapp === true || parsed.preferred_contact_whatsapp === undefined);
          setCheckoutNote(parsed.checkout_note || 'open');
          setCheckoutClaimCode(parsed.checkout_claim_code || 'open');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ownerId, profile]);

  const handleSaveSettings = () => {
    let existingSettings: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(`store_settings_owner_${activeOwnerId}`);
      if (saved) {
        existingSettings = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse website settings from local storage', e);
    }

    const location_store = {
      store_address: storeAddress,
      store_latitude: storeLatitude,
      store_longitude: storeLongitude,
    };

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
      customer_chat: String(customerChat),
      send_chat_order: String(sendChatOrder),
      announcement_text: announcementText,
      footer_text: footerText,
      checkout_delivery_address: checkoutDeliveryAddress,
      checkout_preferred_contact: checkoutPreferredContact,
      preferred_contact_phone: String(preferredContactPhone),
      preferred_contact_telegram: String(preferredContactTelegram),
      preferred_contact_whatsapp: String(preferredContactWhatsapp),
      checkout_note: checkoutNote,
      checkout_claim_code: checkoutClaimCode,
      store_latitude: storeLatitude,
      store_longitude: storeLongitude,
      location_store: location_store,
    };

    const brand_identity_operations = {
      store_name: storeName,
      custom_domain: customDomain,
      store_phone: storePhone,
      store_email: storeEmail,
      store_address: storeAddress,
      store_latitude: storeLatitude,
      store_longitude: storeLongitude,
      logo_url: logoUrl,
      favicon_url: faviconUrl,
    };

    const financial_configurations = {
      tax_percentage: taxPercentage,
      shipping_fee: shippingFee,
      free_shipping_threshold: freeShippingThreshold,
      currency: currency,
    };

    const store_operations_content = {
      maintenance_mode: String(maintenanceMode),
      guest_checkout: String(guestCheckout),
      customer_chat: String(customerChat),
      send_chat_order: String(sendChatOrder),
      announcement_text: announcementText,
      footer_text: footerText,
    };

    const checkout_form_visibility = {
      checkout_delivery_address: checkoutDeliveryAddress,
      checkout_preferred_contact: checkoutPreferredContact,
      preferred_contact_phone: String(preferredContactPhone),
      preferred_contact_telegram: String(preferredContactTelegram),
      preferred_contact_whatsapp: String(preferredContactWhatsapp),
      checkout_note: checkoutNote,
      checkout_claim_code: checkoutClaimCode,
    };

    const payload = {
      brand_identity_operations,
      financial_configurations,
      store_operations_content,
      checkout_form_visibility,
      location_store,
    };

    const mergedSettings = {
      ...existingSettings,
      ...updatedFields,
      ...payload,
    };

    localStorage.setItem(`store_settings_owner_${activeOwnerId}`, JSON.stringify(mergedSettings));
    localStorage.setItem('store_settings', JSON.stringify(mergedSettings));
    window.dispatchEvent(new Event('settings_updated'));

    const isAdmin = profile?.user?.role === 'admin';
    const targetOwnerId = isAdmin ? ownerId : undefined;

    const saveSettings = async () => {
      const loadToast = toast.loading('Saving store configurations to server...');
      try {
        await storesService.updateStore(payload, targetOwnerId);
        toast.dismiss();
        toast.success('Store and website configurations saved successfully!');
      } catch (err: any) {
        toast.dismiss();
        const detail = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to save store configurations to server.';
        toast.error(detail);
      }
    };
    saveSettings();
  };

  const handleDiscardSettings = () => {
    setLoading(true);
    const activeOwnerId = profile?.user?.id;
    storesService.getStore(activeOwnerId)
      .then((data) => {
        if (data) {
          setStoreName(data.store_name || '');
          setCustomDomain(data.custom_domain || '');
          setStorePhone(data.store_phone || '');
          setStoreEmail(data.store_email || '');
          const locationData = data.location_store;
          setStoreAddress(locationData?.store_address || data.store_address || '');
          setStoreLatitude(locationData?.store_latitude ? String(locationData.store_latitude) : (data.store_latitude ? String(data.store_latitude) : ''));
          setStoreLongitude(locationData?.store_longitude ? String(locationData.store_longitude) : (data.store_longitude ? String(data.store_longitude) : ''));
          setTaxPercentage(data.tax_percentage !== undefined && data.tax_percentage !== null ? String(data.tax_percentage) : '0');
          setShippingFee(data.shipping_fee !== undefined && data.shipping_fee !== null ? String(data.shipping_fee) : '0');
          setFreeShippingThreshold(data.free_shipping_threshold !== undefined && data.free_shipping_threshold !== null ? String(data.free_shipping_threshold) : '0');
          setLogoUrl(data.logo_url || '');
          setFaviconUrl(data.favicon_url || '');
          setCurrency(data.currency || 'USD');
          setMaintenanceMode(data.maintenance_mode === 'true' || data.maintenance_mode === true);
          setGuestCheckout(data.guest_checkout === 'true' || data.guest_checkout === true || data.guest_checkout === undefined);
          setCustomerChat(data.customer_chat === 'true' || data.customer_chat === true || data.customer_chat === undefined);
          setSendChatOrder(data.send_chat_order === 'true' || data.send_chat_order === true || data.send_chat_order === undefined);
          setAnnouncementText(data.announcement_text || '');
          setFooterText(data.footer_text || '');
          setCheckoutDeliveryAddress(data.checkout_delivery_address || 'open');
          setCheckoutPreferredContact(data.checkout_preferred_contact || 'open');
          setPreferredContactPhone(data.preferred_contact_phone === 'true' || data.preferred_contact_phone === true || data.preferred_contact_phone === undefined);
          setPreferredContactTelegram(data.preferred_contact_telegram === 'true' || data.preferred_contact_telegram === true || data.preferred_contact_telegram === undefined);
          setPreferredContactWhatsapp(data.preferred_contact_whatsapp === 'true' || data.preferred_contact_whatsapp === true || data.preferred_contact_whatsapp === undefined);
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
    <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[8px] shadow-xs space-y-8 animate-fade-in font-kuntomruy custom-card-container">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiSettings className="text-orange-500 w-6 h-6" />
          <span>{t('settings.title')}</span>
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 overflow-x-auto pb-px gap-6 no-scrollbar select-none">
        <button
          onClick={() => setActiveInnerTab('brand')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-black uppercase tracking-wider cursor-pointer border-none bg-transparent whitespace-nowrap transition-all duration-200 outline-none ${
            activeInnerTab === 'brand'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          <FiImage className="w-4 h-4" />
          <span>{t('settings.brand_tab')}</span>
        </button>

        <button
          onClick={() => setActiveInnerTab('financial')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-black uppercase tracking-wider cursor-pointer border-none bg-transparent whitespace-nowrap transition-all duration-200 outline-none ${
            activeInnerTab === 'financial'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          <FiSettings className="w-4 h-4" />
          <span>{t('settings.financial_tab')}</span>
        </button>

        <button
          onClick={() => setActiveInnerTab('operations')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-black uppercase tracking-wider cursor-pointer border-none bg-transparent whitespace-nowrap transition-all duration-200 outline-none ${
            activeInnerTab === 'operations'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          <FiSettings className="w-4 h-4" />
          <span>{t('settings.operations_tab')}</span>
        </button>

        <button
          onClick={() => setActiveInnerTab('checkout')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-black uppercase tracking-wider cursor-pointer border-none bg-transparent whitespace-nowrap transition-all duration-200 outline-none ${
            activeInnerTab === 'checkout'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          <FiSettings className="w-4 h-4" />
          <span>{t('settings.checkout_tab')}</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[300px]">
        {activeInnerTab === 'brand' && (
          <BrandIdentityOperationsTab
            storeName={storeName}
            setStoreName={setStoreName}
            customDomain={customDomain}
            setCustomDomain={setCustomDomain}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            logoError={logoError}
            setLogoError={setLogoError}
            uploadingLogo={uploadingLogo}
            handleLogoUpload={handleLogoUpload}
            logoInputRef={logoInputRef}
            faviconUrl={faviconUrl}
            setFaviconUrl={setFaviconUrl}
            faviconError={faviconError}
            setFaviconError={setFaviconError}
            uploadingFavicon={uploadingFavicon}
            handleFaviconUpload={handleFaviconUpload}
            faviconInputRef={faviconInputRef}
            storePhone={storePhone}
            setStorePhone={setStorePhone}
            storeEmail={storeEmail}
            setStoreEmail={setStoreEmail}
            storeAddress={storeAddress}
            setStoreAddress={setStoreAddress}
            storeLatitude={storeLatitude}
            setStoreLatitude={setStoreLatitude}
            storeLongitude={storeLongitude}
            setStoreLongitude={setStoreLongitude}
            handleAutoGetStoreLocation={handleAutoGetStoreLocation}
          />
        )}

        {activeInnerTab === 'financial' && (
          <FinancialConfigurationsTab
            taxPercentage={taxPercentage}
            setTaxPercentage={setTaxPercentage}
            currency={currency}
            setCurrency={setCurrency}
          />
        )}

        {activeInnerTab === 'operations' && (
          <StoreOperationsContent
            maintenanceMode={maintenanceMode}
            setMaintenanceMode={setMaintenanceMode}
            guestCheckout={guestCheckout}
            setGuestCheckout={setGuestCheckout}
            customerChat={customerChat}
            setCustomerChat={setCustomerChat}
            sendChatOrder={sendChatOrder}
            setSendChatOrder={setSendChatOrder}
            announcementText={announcementText}
            setAnnouncementText={setAnnouncementText}
            footerText={footerText}
            setFooterText={setFooterText}
          />
        )}

        {activeInnerTab === 'checkout' && (
          <CheckoutFormVisibility
            checkoutDeliveryAddress={checkoutDeliveryAddress}
            setCheckoutDeliveryAddress={setCheckoutDeliveryAddress}
            checkoutPreferredContact={checkoutPreferredContact}
            setCheckoutPreferredContact={setCheckoutPreferredContact}
            preferredContactPhone={preferredContactPhone}
            setPreferredContactPhone={setPreferredContactPhone}
            preferredContactTelegram={preferredContactTelegram}
            setPreferredContactTelegram={setPreferredContactTelegram}
            preferredContactWhatsapp={preferredContactWhatsapp}
            setPreferredContactWhatsapp={setPreferredContactWhatsapp}
            checkoutNote={checkoutNote}
            setCheckoutNote={setCheckoutNote}
            checkoutClaimCode={checkoutClaimCode}
            setCheckoutClaimCode={setCheckoutClaimCode}
          />
        )}
      </div>

      {/* Footer actions */}
      <div className="pt-6 border-t border-slate-200 flex justify-end space-x-3">
        <button
          onClick={handleDiscardSettings}
          className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-655 rounded-[5px] text-xs font-extrabold transition-all cursor-pointer border border-slate-200"
        >
          Discard Changes
        </button>
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-[5px] text-xs font-black shadow-xs hover:shadow-sm active:scale-98 transition-all cursor-pointer border-none uppercase tracking-wider"
        >
          Save System Configs
        </button>
      </div>
    </div>
  );
};

