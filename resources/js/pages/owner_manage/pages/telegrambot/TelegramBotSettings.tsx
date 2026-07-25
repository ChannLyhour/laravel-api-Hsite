import React, { useState, useEffect } from 'react';
import { FiSend, FiCheck, FiAlertCircle, FiToggleLeft, FiToggleRight, FiEye, FiEyeOff, FiInfo, FiLoader } from 'react-icons/fi';
import { FaTelegramPlane } from 'react-icons/fa';
import {
  getTelegramConfig,
  saveTelegramConfig,
  sendTestMessage,
  type TelegramBotConfig,
} from '@/api/owner/telegramService';
import { storesService } from '@/api/owner/stores';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';
import { useTranslation } from '../../lang/i18n';

interface TelegramBotSettingsProps {
  ownerId?: number | string;
}

export const TelegramBotSettings: React.FC<TelegramBotSettingsProps> = ({ ownerId }) => {
  const { t } = useTranslation();
  const activeOwnerId = ownerId ?? localStorage.getItem('selected_owner_id');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [customerBotLink, setCustomerBotLink] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Load saved config on mount from API
  useEffect(() => {
    const loadConfig = async () => {
      setLoadingConfig(true);
      try {
        const store = await storesService.getStore(activeOwnerId);
        if (store) {
          setBotToken(store.telegram_bot_token || '');
          setChatId(store.telegram_chat_id || '');
          setEnabled(store.telegram_enabled === '1' || store.telegram_enabled === true);
          setCustomerBotLink(store.telegram_customer_bot_link || '');

          // Update local cache
          const config = {
            bot_token: store.telegram_bot_token || '',
            chat_id: store.telegram_chat_id || '',
            enabled: store.telegram_enabled === '1' || store.telegram_enabled === true,
            customer_bot_link: store.telegram_customer_bot_link || '',
          };
          localStorage.setItem(`telegram_bot_config_owner_${activeOwnerId}`, JSON.stringify(config));

          const storeSettingsRaw = localStorage.getItem(`store_settings_owner_${activeOwnerId}`);
          const storeSettings = storeSettingsRaw ? JSON.parse(storeSettingsRaw) : {};
          storeSettings.telegram_bot_token = store.telegram_bot_token;
          storeSettings.telegram_chat_id = store.telegram_chat_id;
          storeSettings.telegram_enabled = store.telegram_enabled;
          storeSettings.telegram_customer_bot_link = store.telegram_customer_bot_link;
          localStorage.setItem(`store_settings_owner_${activeOwnerId}`, JSON.stringify(storeSettings));
        }
      } catch (err) {
        console.warn('Failed to load telegram config from API, loading local backup.', err);
        const config = getTelegramConfig(activeOwnerId);
        if (config) {
          setBotToken(config.bot_token || '');
          setChatId(config.chat_id || '');
          setEnabled(config.enabled ?? false);
          setCustomerBotLink(config.customer_bot_link || '');
        }
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, [activeOwnerId]);

  const handleSave = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error('Please fill in both Bot Token and Chat ID.');
      return;
    }

    setSaving(true);
    try {
      await saveTelegramConfig({
        bot_token: botToken.trim(),
        chat_id: chatId.trim(),
        enabled,
        customer_bot_link: customerBotLink.trim(),
      }, activeOwnerId);
      toast.success('Telegram bot settings saved!');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error('Please enter Bot Token and Chat ID first.');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await sendTestMessage(botToken.trim(), chatId.trim());
      if (result.ok) {
        setTestResult({ ok: true, message: 'Test message sent successfully! Check your Telegram.' });
        toast.success('Test message sent to Telegram!');
      } else {
        setTestResult({ ok: false, message: result.description || 'Failed to send message. Please check your token and chat ID.' });
        toast.error(result.description || 'Failed to send test message.');
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Network error — could not reach Telegram API.' });
      toast.error('Failed to connect to Telegram API.');
    } finally {
      setTesting(false);
    }
  };

  const maskedToken = botToken
    ? botToken.substring(0, 8) + '•'.repeat(Math.max(0, botToken.length - 12)) + botToken.substring(botToken.length - 4)
    : '';

  if (loadingConfig) {
    return (
      <div className="bg-white border border-slate-100 p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy">
        <FiLoader className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-bold text-slate-400">{t('telegram.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-[8px] bg-gradient-to-br from-[#0088cc] to-[#0066aa] text-white flex items-center justify-center shadow-md shrink-0">
          <FaTelegramPlane className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            {t('telegram.title')}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {t('telegram.subtitle')}
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-[8px] p-4 text-xs text-blue-800 space-y-2">
        <div className="flex items-start gap-2">
          <FiInfo className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5 font-medium leading-relaxed text-left">
            <p className="font-bold">{t('telegram.guide_title')}</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>{t('telegram.guide_step1')}</li>
              <li>{t('telegram.guide_step2')}</li>
              <li>{t('telegram.guide_step3')}</li>
              <li>{t('telegram.guide_step4')}</li>
              <li>{t('telegram.guide_step5')}</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-slate-100 rounded-[8px] p-6 shadow-xs space-y-5 text-left">

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-[8px] bg-slate-50/80 border border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">{t('telegram.notif_title')}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {enabled ? t('telegram.notif_enabled') : t('telegram.notif_disabled')}
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className="cursor-pointer bg-transparent border-none outline-none p-0 transition-transform active:scale-95"
            title={enabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {enabled ? (
              <FiToggleRight className="w-9 h-9 text-emerald-500" />
            ) : (
              <FiToggleLeft className="w-9 h-9 text-slate-300" />
            )}
          </button>
        </div>

        {/* Bot Token */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-slate-700 block">
            {t('telegram.bot_token')}
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 bg-white pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0"
            >
              {showToken ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {t('telegram.bot_token_helper')}
          </p>
        </div>

        {/* Chat ID */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-slate-700 block">
            {t('telegram.chat_id')}
          </label>
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="e.g. 123456789 or -1001234567890"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 bg-white"
          />
          <p className="text-[10px] text-slate-400 font-medium">
            {t('telegram.chat_id_helper')}
          </p>
        </div>

        {/* Customer Bot Username */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-slate-700 block">
            {t('telegram.customer_bot')}
          </label>
          <input
            type="text"
            value={customerBotLink}
            onChange={(e) => setCustomerBotLink(e.target.value)}
            placeholder="e.g. @Gotfly_bot"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 bg-white"
          />
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            {t('telegram.customer_bot_helper')}
          </p>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`flex items-center gap-2.5 p-3 rounded-[6px] border text-xs font-bold ${testResult.ok
              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
              : 'bg-rose-50/50 border-rose-100 text-rose-700'
            }`}>
            {testResult.ok
              ? <FiCheck className="w-4 h-4 shrink-0" />
              : <FiAlertCircle className="w-4 h-4 shrink-0" />
            }
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleTest}
            disabled={testing || !botToken.trim() || !chatId.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-[6px] text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {testing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>{t('telegram.sending')}</span>
              </>
            ) : (
              <>
                <FiSend className="w-3.5 h-3.5" />
                <span>{t('telegram.send_test')}</span>
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !botToken.trim() || !chatId.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0088cc] to-[#0066aa] hover:from-[#0077bb] hover:to-[#005599] text-white rounded-[6px] text-xs font-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] shadow-sm border-none"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('telegram.saving')}</span>
              </>
            ) : (
              <>
                <FiCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('telegram.save_settings')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Card */}
      {botToken && chatId && (
        <div className="bg-white border border-slate-100 rounded-[8px] p-5 shadow-xs space-y-3 text-left">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">{t('telegram.preview_title')}</h4>
          <div className="bg-slate-50 border border-slate-200/60 rounded-[6px] p-4 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-line">
            {`🛒 New Order Received!

📋 Order: #ORD-001
👤 Customer: John Doe
📞 Phone: +855 12 345 678

🍽 Items:
  1. Chicken Rice x2 — $12.00
  2. Iced Coffee x1 — $3.50

💰 Total: $15.50
💳 Payment: Cash on Delivery ⏳ Unpaid
📍 Address: St. 123, Phnom Penh

⏰ Jun 29, 2026, 11:00 AM`}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {t('telegram.preview_helper')}
          </p>
        </div>
      )}
    </div>
  );
};
