import React from 'react';
import { FiImage, FiUploadCloud, FiTrash2, FiLoader, FiGlobe, FiMapPin } from 'react-icons/fi';
import { resolveImageUrl } from '@/api/imageUtils';
import { GroupDiv } from '../../../helper/GroupDiv';
import { useTranslation } from '../../../lang/i18n';

interface BrandIdentityOperationsTabProps {
  storeName: string;
  setStoreName: (val: string) => void;
  customDomain: string;
  setCustomDomain: (val: string) => void;
  logoUrl: string;
  setLogoUrl: (val: string) => void;
  logoError: boolean;
  setLogoError: (val: boolean) => void;
  uploadingLogo: boolean;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  faviconUrl: string;
  setFaviconUrl: (val: string) => void;
  faviconError: boolean;
  setFaviconError: (val: boolean) => void;
  uploadingFavicon: boolean;
  handleFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  faviconInputRef: React.RefObject<HTMLInputElement | null>;
  storePhone: string;
  setStorePhone: (val: string) => void;
  storeEmail: string;
  setStoreEmail: (val: string) => void;
  storeAddress: string;
  setStoreAddress: (val: string) => void;
  storeLatitude: string;
  setStoreLatitude: (val: string) => void;
  storeLongitude: string;
  setStoreLongitude: (val: string) => void;
  handleAutoGetStoreLocation: () => void;
}

export const BrandIdentityOperationsTab: React.FC<BrandIdentityOperationsTabProps> = ({
  storeName,
  setStoreName,
  customDomain,
  setCustomDomain,
  logoUrl,
  setLogoUrl,
  logoError,
  setLogoError,
  uploadingLogo,
  handleLogoUpload,
  logoInputRef,
  faviconUrl,
  setFaviconUrl,
  faviconError,
  setFaviconError,
  uploadingFavicon,
  handleFaviconUpload,
  faviconInputRef,
  storePhone,
  setStorePhone,
  storeEmail,
  setStoreEmail,
  storeAddress,
  setStoreAddress,
  storeLatitude,
  setStoreLatitude,
  storeLongitude,
  setStoreLongitude,
  handleAutoGetStoreLocation,
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fade-in font-kuntomruy">
      {/* Brand details */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.brand_assets')}</h4>
        <GroupDiv>
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.store_brand_name')}</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Name Store ..."
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.custom_domain')}</label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="e.g. our20s"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
            />
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              {t('settings.domain_helper', { domain: 'our20s' })}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.brand_logo')}</label>
            <div className="flex items-start space-x-4">
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

              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-[5px] text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer border-none"
                    disabled={uploadingLogo}
                  >
                    <FiUploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t('settings.upload_logo')}</span>
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
                  {t('settings.logo_ratio')}
                </p>
              </div>
            </div>
            <input
              type="file"
              ref={logoInputRef as any}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.logo_favicon')}</label>
            <div className="flex items-start space-x-4">
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

              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-[5px] text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer border-none"
                    disabled={uploadingFavicon}
                  >
                    <FiUploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t('settings.upload_favicon')}</span>
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
                  {t('settings.favicon_ratio')}
                </p>
              </div>
            </div>
            <input
              type="file"
              ref={faviconInputRef as any}
              onChange={handleFaviconUpload}
              accept="image/*,.ico"
              className="hidden"
            />
          </div>
        </GroupDiv>
      </div>

      {/* Contacts & Operations */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.contact_operations')}</h4>
        <GroupDiv>
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.store_telephone')}</label>
            <input
              type="text"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.store_email')}</label>
            <input
              type="email"
              value={storeEmail}
              onChange={(e) => setStoreEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.store_address')}</label>
            <input
              type="text"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <label className="text-xs font-bold text-slate-700 block">{t('settings.store_coordinates')}</label>
            <button
              type="button"
              onClick={handleAutoGetStoreLocation}
              className="px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-650 rounded-[5px] text-[10px] font-black uppercase tracking-wider transition-all border border-orange-100 cursor-pointer flex items-center gap-1"
            >
              <FiMapPin className="w-3 h-3 stroke-[2.5]" /> {t('settings.auto_detect_gps')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">{t('settings.store_latitude')}</label>
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
              <label className="text-xs font-bold text-slate-700 block">{t('settings.store_longitude')}</label>
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

          {(storeLatitude || storeLongitude || storeAddress) && (
            <div className="pt-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{t('settings.location_map')}</label>
              <div className="w-full h-40 rounded-[5px] overflow-hidden border border-slate-200 bg-slate-50 relative">
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
  );
};
