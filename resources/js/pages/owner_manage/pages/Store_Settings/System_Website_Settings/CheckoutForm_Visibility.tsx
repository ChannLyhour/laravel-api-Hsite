import React from 'react';
import { GroupDiv } from '../../../helper/GroupDiv';
import { useTranslation } from '../../../lang/i18n';

interface CheckoutFormVisibilityProps {
     checkoutDeliveryAddress: 'open' | 'close' | 'null';
     setCheckoutDeliveryAddress: (val: 'open' | 'close' | 'null') => void;
     checkoutPreferredContact: 'open' | 'close' | 'null';
     setCheckoutPreferredContact: (val: 'open' | 'close' | 'null') => void;
     preferredContactPhone: boolean;
     setPreferredContactPhone: (val: boolean) => void;
     preferredContactTelegram: boolean;
     setPreferredContactTelegram: (val: boolean) => void;
     preferredContactWhatsapp: boolean;
     setPreferredContactWhatsapp: (val: boolean) => void;
     checkoutNote: 'open' | 'close' | 'null';
     setCheckoutNote: (val: 'open' | 'close' | 'null') => void;
     checkoutClaimCode: 'open' | 'close' | 'null';
     setCheckoutClaimCode: (val: 'open' | 'close' | 'null') => void;
}

export const CheckoutFormVisibility: React.FC<CheckoutFormVisibilityProps> = ({
     checkoutDeliveryAddress,
     setCheckoutDeliveryAddress,
     checkoutPreferredContact,
     setCheckoutPreferredContact,
     preferredContactPhone,
     setPreferredContactPhone,
     preferredContactTelegram,
     setPreferredContactTelegram,
     preferredContactWhatsapp,
     setPreferredContactWhatsapp,
     checkoutNote,
     setCheckoutNote,
     checkoutClaimCode,
     setCheckoutClaimCode,
}) => {
     const { t } = useTranslation();
     return (
          <div className="max-w-xl mx-auto space-y-4 animate-fade-in font-kuntomruy">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.checkout_header')}</h4>
               <GroupDiv>
                    <div className="space-y-1.5">
                         <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.delivery_address_field')}</label>
                         <select
                              value={checkoutDeliveryAddress}
                              onChange={(e) => setCheckoutDeliveryAddress(e.target.value as any)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                         >
                              <option value="open">{t('settings.required_open')}</option>
                              <option value="null">{t('settings.optional_null')}</option>
                              <option value="close">{t('settings.hidden_close')}</option>
                         </select>
                         <p className="text-[10px] text-slate-400 font-medium">{t('settings.delivery_helper')}</p>
                    </div>

                    <div className="space-y-1.5">
                         <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.preferred_contact_field')}</label>
                         <select
                              value={checkoutPreferredContact}
                              onChange={(e) => setCheckoutPreferredContact(e.target.value as any)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                         >
                              <option value="open">{t('settings.required_open')}</option>
                              <option value="null">{t('settings.optional_null')}</option>
                              <option value="close">{t('settings.hidden_close')}</option>
                         </select>
                         <p className="text-[10px] text-slate-400 font-medium">{t('settings.contact_helper')}</p>
                    </div>

                    {checkoutPreferredContact !== 'close' && (
                         <div className="space-y-2 pt-1">
                              <label className="text-xs font-bold text-slate-700 block">{t('settings.enabled_channels')}</label>
                              <div className="space-y-2 bg-slate-55 bg-slate-50 p-3 rounded-[5px] border border-slate-200">
                                   <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-600">
                                        <input
                                             type="checkbox"
                                             checked={preferredContactPhone}
                                             onChange={(e) => setPreferredContactPhone(e.target.checked)}
                                             className="w-4 h-4 rounded text-orange-550 border-slate-355 focus:ring-orange-550 cursor-pointer"
                                        />
                                        <span>Phone Call (+855...)</span>
                                   </label>
                                   <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-600">
                                        <input
                                             type="checkbox"
                                             checked={preferredContactTelegram}
                                             onChange={(e) => setPreferredContactTelegram(e.target.checked)}
                                             className="w-4 h-4 rounded text-orange-550 border-slate-355 focus:ring-orange-550 cursor-pointer"
                                        />
                                        <span>Telegram (username/phone)</span>
                                   </label>
                                   <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-600">
                                        <input
                                             type="checkbox"
                                             checked={preferredContactWhatsapp}
                                             onChange={(e) => setPreferredContactWhatsapp(e.target.checked)}
                                             className="w-4 h-4 rounded text-orange-550 border-slate-355 focus:ring-orange-550 cursor-pointer"
                                        />
                                        <span>WhatsApp (phone)</span>
                                   </label>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">{t('settings.channels_helper')}</p>
                         </div>
                    )}

                    <div className="space-y-1.5">
                         <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.order_note_field')}</label>
                         <select
                              value={checkoutNote}
                              onChange={(e) => setCheckoutNote(e.target.value as any)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                         >
                              <option value="open">{t('settings.required_open')}</option>
                              <option value="null">{t('settings.optional_null')}</option>
                              <option value="close">{t('settings.hidden_close')}</option>
                         </select>
                         <p className="text-[10px] text-slate-400 font-medium">{t('settings.note_helper')}</p>
                    </div>

                    <div className="space-y-1.5">
                         <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.voucher_field')}</label>
                         <select
                              value={checkoutClaimCode}
                              onChange={(e) => setCheckoutClaimCode(e.target.value as any)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                         >
                              <option value="open">{t('settings.required_open')}</option>
                              <option value="null">{t('settings.optional_null')}</option>
                              <option value="close">{t('settings.hidden_close')}</option>
                         </select>
                         <p className="text-[10px] text-slate-400 font-medium">{t('settings.voucher_helper')}</p>
                    </div>
               </GroupDiv>
          </div>
     );
};
