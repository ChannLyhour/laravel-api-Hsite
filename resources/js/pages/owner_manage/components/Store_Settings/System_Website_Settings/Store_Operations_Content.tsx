import React from 'react';
import { GroupDiv } from '../../../helper/GroupDiv';
import { useTranslation } from '../../../lang/i18n';

interface StoreOperationsContentProps {
  maintenanceMode: boolean;
  setMaintenanceMode: (val: boolean) => void;
  guestCheckout: boolean;
  setGuestCheckout: (val: boolean) => void;
  customerChat: boolean;
  setCustomerChat: (val: boolean) => void;
  sendChatOrder: boolean;
  setSendChatOrder: (val: boolean) => void;
  announcementText: string;
  setAnnouncementText: (val: string) => void;
  footerText: string;
  setFooterText: (val: string) => void;
}

export const StoreOperationsContent: React.FC<StoreOperationsContentProps> = ({
  maintenanceMode,
  setMaintenanceMode,
  guestCheckout,
  setGuestCheckout,
  customerChat,
  setCustomerChat,
  sendChatOrder,
  setSendChatOrder,
  announcementText,
  setAnnouncementText,
  footerText,
  setFooterText,
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fade-in font-kuntomruy">
      {/* Status switches */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.operational_states')}</h4>
        <GroupDiv>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.maintenance_mode')}</label>
            <div className="flex items-center space-x-3 p-3 rounded-[5px] border border-slate-200 bg-white">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
              </label>
              <span className="text-xs font-bold text-slate-600">{maintenanceMode ? t('settings.store_offline') : t('settings.store_online')}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{t('settings.maintenance_helper')}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.guest_checkout')}</label>
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
              <span className="text-xs font-bold text-slate-600">{guestCheckout ? t('settings.enabled_any') : t('settings.disabled_login')}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{t('settings.guest_helper')}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.live_chat_widget')}</label>
            <div className="flex items-center space-x-3 bg-white p-3 rounded-[5px] border border-slate-200">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={customerChat}
                  onChange={(e) => setCustomerChat(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
              </label>
              <span className="text-xs font-bold text-slate-600">{customerChat ? t('settings.enabled_show_chat') : t('settings.disabled_hide_chat')}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{t('settings.chat_helper')}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.send_chat_order')}</label>
            <div className="flex items-center space-x-3 bg-white p-3 rounded-[5px] border border-slate-200">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendChatOrder}
                  onChange={(e) => setSendChatOrder(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
              </label>
              <span className="text-xs font-bold text-slate-600">{sendChatOrder ? t('settings.enabled_send_chat') : t('settings.disabled_no_send')}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{t('settings.send_chat_helper')}</p>
          </div>
        </GroupDiv>
      </div>

      {/* Custom Content */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.store_content')}</h4>
        <GroupDiv>
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.announcement_bar')}</label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="e.g. Free delivery on orders over $50!"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.footer_copyright')}</label>
            <textarea
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="e.g. © 2026 Your Store Name. All rights reserved."
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold min-h-[140px] resize-none"
            />
          </div>
        </GroupDiv>
      </div>
    </div>
  );
};
