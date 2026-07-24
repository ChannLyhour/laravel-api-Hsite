import React, { useState, useEffect } from 'react';
import { FiSettings, FiLoader } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { storesService } from '@/api/owner/stores';
import { resolveImageUrl } from '@/api/imageUtils';
import { EditPage } from '../payment_method/edit';
import '@/pages/owner_manage/style/font.css';
import { useTranslation } from '../../lang/i18n';

import abaLogo from '@/pages/main_website/Company_bank/aba.png';
import bakongLogo from '@/pages/main_website/Company_bank/bakong.png';
import acledaLogo from '@/pages/main_website/Company_bank/acleda.png';

const DEFAULT_LOGOS: Record<string, string> = {
     aba: abaLogo,
     bakong: bakongLogo,
     acleda: acledaLogo,
};

interface TabProps {
     ownerId?: number | string;
     profile?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility functions for loading & saving settings
// ─────────────────────────────────────────────────────────────────────────────
const getStoredSettings = () => {
     try {
          const saved = localStorage.getItem('store_settings');
          return saved ? JSON.parse(saved) : {};
     } catch (e) {
          return {};
     }
};

const saveSettingsToStore = async (newSettings: Record<string, any>, ownerId?: number | string, profile?: any) => {
     const current = getStoredSettings();
     const merged = { ...current, ...newSettings };
     localStorage.setItem('store_settings', JSON.stringify(merged));
     window.dispatchEvent(new Event('settings_updated'));

     // Update API — pass ownerId only if user role is admin to hit PUT /stores/{id}
     const isAdmin = profile?.user?.role === 'admin';
     const targetOwnerId = isAdmin ? ownerId : undefined;

     try {
          await storesService.updateStore(merged, targetOwnerId);
          return true;
     } catch (err) {
          console.error('Failed to update store settings:', err);
          return false;
     }
};

interface PaymentGateway {
     id: string;
     name: string;
     description: string;
     logoColor: string;
     textColor: string;
     logoText: string;
     fields: { key: string; label: string; type: 'text' | 'password' | 'textarea' | 'image'; required?: boolean; placeholder?: string; hint?: string }[];
     defaultValues?: Record<string, string>;
}


const FALLBACK_GATEWAYS: PaymentGateway[] = [
     {
          id: 'aba',
          name: 'ABA PAY',
          description: 'Config 1: ABA Bank Support KHQR (PayWay Link) | Config 2: Config with KHPAY',
          logoColor: 'bg-[#005d7e]',
          textColor: 'text-white',
          logoText: 'ABA',
          fields: [
               { key: 'payway_link', label: 'ABA Merchant Link (PayWay Link)', type: 'text', placeholder: 'https://link.payway.com.kh/ABAPAYvu485790W', hint: 'Config 1: Paste your ABA Merchant sharing link from ABA PayWay app.' },
               { key: 'khpay_api_key', label: 'KHPay API Token (Bearer Key)', type: 'password', required: false, placeholder: 'ak_43a276d3b91c5b1ca12c...', hint: 'Config 2: API Key from khpay.site for dynamic KHQR generation & status checking.' },
               { key: 'khpay_account_id', label: 'Bakong / KHPay Account ID', type: 'text', required: false, placeholder: 'lyhour_chann@bkrt', hint: 'Config 2: Your Bakong ID registered on KHPay.' },
               { key: 'khpay_merchant_name', label: 'Merchant Name', type: 'text', required: false, placeholder: 'OuR20s Collection', hint: 'Config 2: Display merchant name for KHQR payments.' },
               { key: 'khpay_merchant_city', label: 'Merchant City', type: 'text', required: false, placeholder: 'Siem Reap', hint: 'Config 2: Merchant city for KHQR payments.' }
          ]
     },
     {
          id: 'bakong',
          name: 'Bakong KHQR',
          description: 'Scan to pay with Bakong App or any KHQR supported bank',
          logoColor: 'bg-[#b30006]',
          textColor: 'text-white',
          logoText: 'Bakong',
          fields: [
               { key: 'bakongAccountId', label: 'Your Production Bakong Account ID', type: 'text' },
               { key: 'merchantName', label: 'Merchant ID / Username', type: 'text' },
               { key: 'merchantCity', label: 'Merchant City', type: 'text' },
               { key: 'apiKey', label: 'API Token / Secret Key', type: 'password', required: false },
               { key: 'apiUrl', label: 'API Base URL', type: 'text', required: false }
          ]
     },
     {
          id: 'acleda',
          name: 'ACLEDA PAY',
          description: 'Pay securely with ACLEDA.',
          logoColor: 'bg-[#0d3b66]',
          textColor: 'text-amber-400',
          logoText: 'ACLEDA',
          fields: [
               { key: 'merchantId', label: 'Merchant ID', type: 'text' },
               { key: 'apiKey', label: 'API Key', type: 'password' },
               { key: 'apiUrl', label: 'API Base URL', type: 'text' }
          ]
     }
];

export const Payment_Gateways_SetupTab: React.FC<TabProps> = ({ ownerId, profile }) => {
     const { t } = useTranslation();
     const [loading, setLoading] = useState(true);
     const [activeGateway, setActiveGateway] = useState<PaymentGateway | null>(null);
     const [gateways, setGateways] = useState<PaymentGateway[]>([]);
     const [paymentMethods, setPaymentMethods] = useState<Record<string, { enabled: boolean; sandbox: boolean; values: Record<string, string> }>>({});

     useEffect(() => {
          const initData = async () => {
               setLoading(true);

               // 1. Fetch available gateways from API (with fallback)
               let availableGateways: PaymentGateway[] = [];
               try {
                    const fetched = await storesService.getPaymentGateways();
                    if (Array.isArray(fetched) && fetched.length > 0) {
                         availableGateways = fetched;
                    } else {
                         availableGateways = FALLBACK_GATEWAYS;
                    }
               } catch (err) {
                    console.warn('Failed to fetch gateways from API, using defaults.', err);
                    availableGateways = FALLBACK_GATEWAYS;
               }
               setGateways(availableGateways);

               // 2. Load current configurations from settings
               const settings = getStoredSettings();
               const methods = settings.payment_methods || {};

               const mergedMethods: Record<string, any> = {};
               availableGateways.forEach(gw => {
                    const existing = methods[gw.id] || { enabled: false, sandbox: true, values: {} };
                    const mergedValues = { ...(gw.defaultValues || {}), ...(existing.values || {}) };
                    mergedMethods[gw.id] = {
                         ...existing,
                         values: mergedValues
                    };
               });

               setPaymentMethods(mergedMethods);
               setLoading(false);
          };

          initData();
     }, []);

     const handleToggleGateway = async (gatewayId: string, currentStatus: boolean) => {
          const updatedMethod = {
               ...paymentMethods[gatewayId],
               enabled: !currentStatus
          };

          const newMethods = { ...paymentMethods, [gatewayId]: updatedMethod };
          setPaymentMethods(newMethods);

          const savingSuccess = await saveSettingsToStore({
               payment_methods: newMethods
          }, ownerId, profile);

          if (savingSuccess) {
               toast.success(`${gateways.find(g => g.id === gatewayId)?.name} ${!currentStatus ? 'Enabled' : 'Disabled'} successfully!`);
          } else {
               toast.error('Failed to update payment gateway settings.');
          }
     };

     const handleConfigureClick = (gateway: PaymentGateway) => {
          setActiveGateway(gateway);
     };

     if (loading) {
          return (
               <div className="border p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy custom-card-container">
                    <FiLoader className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs font-bold text-slate-400">{t('payment_gateways.loading')}</span>
               </div>
          );
     }

     if (activeGateway) {
          const config = paymentMethods[activeGateway.id] || { enabled: false, sandbox: true, values: {} };
          return (
               <EditPage
                    gateway={activeGateway}
                    config={config}
                    onClose={() => setActiveGateway(null)}
                    onSave={async (updatedValues, sandbox) => {
                         const currentMethod = paymentMethods[activeGateway.id] || { enabled: false };
                         const updatedMethod = {
                              ...currentMethod,
                              sandbox,
                              values: updatedValues
                         };

                         const newMethods = { ...paymentMethods, [activeGateway.id]: updatedMethod };
                         setPaymentMethods(newMethods);

                         const savingSuccess = await saveSettingsToStore({
                              payment_methods: newMethods
                         }, ownerId, profile);

                         return savingSuccess;
                    }}
                    ownerId={ownerId}
               />
          );
     }

     return (
          <div className="border p-6 sm:p-8 rounded-[5px] shadow-xs space-y-8 animate-fade-in font-kuntomruy custom-card-container">
               <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
                         <FiSettings className="text-orange-500" />
                         <span>{t('payment_gateways.title')}</span>
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                         {t('payment_gateways.subtitle')}
                    </p>
               </div>

               <div className="space-y-3 pt-2">
                    {gateways.length === 0 ? (
                         <div className="text-center py-10 border border-dashed rounded-[5px]">
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                                   {t('payment_gateways.no_gateways')}
                              </p>
                         </div>
                    ) : gateways.map(gw => {
                         const config = paymentMethods[gw.id] || { enabled: false, sandbox: true, values: {} };
                         return (
                              <div
                                   key={gw.id}
                                   className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-[5px] hover:bg-black/[0.04] transition-colors gap-4"
                              >
                                   <div className="flex items-center gap-4">
                                        {DEFAULT_LOGOS[gw.id] ? (
                                             <div className="w-12 h-8 rounded-[4px] shrink-0 border border-black/5 bg-black/[0.03] flex items-center justify-center overflow-hidden shadow-xs">
                                                  <img
                                                       src={DEFAULT_LOGOS[gw.id]}
                                                       alt={`${gw.name} Logo`}
                                                       className="w-full h-full object-contain p-1"
                                                  />
                                             </div>
                                        ) : (
                                             <div className={`w-12 h-8 rounded-[4px] shrink-0 flex items-center justify-center font-black text-center shadow-xs select-none leading-none px-1 ${gw.logoColor} ${gw.textColor} ${gw.logoText.length > 5 ? 'text-[8px]' : 'text-[10px]'}`}>
                                                  {gw.logoText}
                                             </div>
                                        )}
                                        <div className="text-xs text-left">
                                             <div className="flex items-center gap-2">
                                                  <p className="font-bold text-inherit">{gw.name}</p>
                                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${config.enabled
                                                       ? config.sandbox ? 'bg-amber-550 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                       : 'bg-slate-150 text-slate-450'
                                                       }`}>
                                                       {config.enabled ? (config.sandbox ? t('payment_gateways.sandbox') : t('payment_gateways.live')) : t('payment_gateways.inactive')}
                                                  </span>
                                             </div>
                                             <p className="text-[10px] opacity-60 font-medium mt-0.5">{gw.description}</p>
                                        </div>
                                   </div>

                                   <div className="flex items-center justify-end gap-4 border-t sm:border-none pt-3 sm:pt-0">
                                        <button
                                             onClick={() => handleConfigureClick(gw)}
                                             className="px-3.5 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] text-inherit rounded-[5px] text-[11px] font-extrabold flex items-center space-x-1 border-none cursor-pointer transition-colors"
                                        >
                                             <FiSettings className="w-3.5 h-3.5 text-slate-400" />
                                             <span>{t('payment_gateways.configure_api')}</span>
                                        </button>

                                        <label className="relative inline-flex items-center cursor-pointer select-none">
                                             <input
                                                  type="checkbox"
                                                  checked={config.enabled}
                                                  onChange={() => handleToggleGateway(gw.id, config.enabled)}
                                                  className="sr-only peer"
                                             />
                                             <div className="w-10 h-5.5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-orange-500" />
                                        </label>
                                   </div>
                              </div>
                         );
                    })}
               </div>
          </div>
     );
};
