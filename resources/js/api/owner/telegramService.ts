import type { Order } from "@/pages/owner_manage/components/order/show";
import { storesService } from "./stores";

// ── Types ─────────────────────────────────────────────────
export interface TelegramBotConfig {
  bot_token: string;
  chat_id: string;
  enabled: boolean;
}

const STORAGE_KEY = "telegram_bot_config";

// ── Config Helpers ────────────────────────────────────────

/**
 * Load Telegram bot config from localStorage.
 */
export const getTelegramConfig = (): TelegramBotConfig | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as TelegramBotConfig;
    }

    // Fallback to store_settings
    const storeSettingsRaw = localStorage.getItem("store_settings");
    if (storeSettingsRaw) {
      const storeSettings = JSON.parse(storeSettingsRaw);
      if (storeSettings.telegram_bot_token || storeSettings.telegram_chat_id) {
        return {
          bot_token: storeSettings.telegram_bot_token || "",
          chat_id: storeSettings.telegram_chat_id || "",
          enabled:
            storeSettings.telegram_enabled === "1" ||
            storeSettings.telegram_enabled === true,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const saveTelegramConfig = async (
  config: TelegramBotConfig,
): Promise<void> => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

  // Merge into store_settings
  try {
    const storeSettingsRaw = localStorage.getItem("store_settings");
    const storeSettings = storeSettingsRaw ? JSON.parse(storeSettingsRaw) : {};
    storeSettings.telegram_bot_token = config.bot_token;
    storeSettings.telegram_chat_id = config.chat_id;
    storeSettings.telegram_enabled = config.enabled ? "1" : "0";
    localStorage.setItem("store_settings", JSON.stringify(storeSettings));
    window.dispatchEvent(new Event("settings_updated"));
  } catch (e) {
    console.warn(
      "Failed to merge telegram config into store_settings local cache:",
      e,
    );
  }

  // Also persist to backend store settings
  try {
    await storesService.updateStore({
      telegram_bot_token: config.bot_token,
      telegram_chat_id: config.chat_id,
      telegram_enabled: config.enabled ? "1" : "0",
    });
  } catch (err) {
    console.warn("Failed to persist telegram config to backend:", err);
  }
};

// ── Telegram API ──────────────────────────────────────────

/**
 * Send a raw text message via the Telegram Bot API.
 */
const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  text: string,
  parseMode: "HTML" | "Markdown" = "HTML",
): Promise<{ ok: boolean; description?: string }> => {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });

  const data = await res.json();
  return data;
};

// ── Public Methods ────────────────────────────────────────

/**
 * Send a test message to verify the bot token and chat ID work.
 */
export const sendTestMessage = async (
  botToken: string,
  chatId: string,
): Promise<{ ok: boolean; description?: string }> => {
  const text = [
    "✅ <b>Telegram Bot Connected!</b>",
    "",
    "Your store order notifications are now active.",
    `⏰ ${new Date().toLocaleString()}`,
  ].join("\n");

  return sendTelegramMessage(botToken, chatId, text);
};

export const sendOrderNotification = async (order: Order): Promise<void> => {
  // Disabled in frontend to prevent duplicate messages from multiple open browser tabs.
  // The Telegram order notification is now handled exclusively by the Laravel backend.
};
