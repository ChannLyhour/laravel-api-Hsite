<?php

namespace App\Helpers;

use App\Models\Store;
use Illuminate\Support\Facades\Log;

class TelegramOTPAcc
{
     /**
      * Send OTP verification message to Telegram.
      *
      * @param \App\Models\Order $order
      * @param string|int $otpCode
      * @return void
      */
     public static function sendOTP ($order, $otpCode)
     {
          $storeId = $order->store_id;
          if (!$storeId) {
               return;
          }

          try {
               $enabled = Store::where('created_by', $storeId)->where('key', 'telegram_enabled')->value('value');
               if ($enabled !== '1' && $enabled !== 1 && $enabled !== 'true') {
                    return;
               }

               $botToken = Store::where('created_by', $storeId)->where('key', 'telegram_bot_token')->value('value');
               $chatId = Store::where('created_by', $storeId)->where('key', 'telegram_chat_id')->value('value');

               if (!$botToken || !$chatId) {
                    return;
               }

               $customerName = htmlspecialchars($order->customer_name ?? 'Guest Customer', ENT_QUOTES, 'UTF-8');
               $customerPhone = htmlspecialchars($order->customer_phone ?? '', ENT_QUOTES, 'UTF-8');

               $messageLines = [
                    "🔐 <b>Order OTP Verification</b>",
                    "",
                    "📋 <b>Order No:</b> #" . ($order->order_no ?? $order->id),
                    "👤 <b>Customer:</b> " . $customerName,
                    "📞 <b>Phone Number:</b> <code>" . $customerPhone . "</code>",
                    "",
                    "🔑 <b>Verification OTP Code:</b>",
                    "👉 <code>" . $otpCode . "</code> 👈",
                    "",
                    "⚠️ Use this code to verify the guest checkout order.",
                    "⏰ Sent at: " . now()->format('M d, Y, h:i A')
               ];

               $message = implode("\n", $messageLines);

               self::sendMessage($botToken, $chatId, $message);
          } catch (\Exception $e) {
               Log::error("TelegramOTPAcc sendOTP failed: " . $e->getMessage());
          }
     }

     /**
      * Send raw message via Telegram HTTP API.
      */
     private static function sendMessage ($botToken, $chatId, $text)
     {
          try {
               $url = "https://api.telegram.org/bot" . $botToken . "/sendMessage";
               $ch = curl_init();
               curl_setopt($ch, CURLOPT_URL, $url);
               curl_setopt($ch, CURLOPT_POST, true);
               curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

               $postFields = [
                    'chat_id' => $chatId,
                    'text' => $text,
                    'parse_mode' => 'HTML'
               ];

               curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
               curl_setopt($ch, CURLOPT_TIMEOUT, 5);
               curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
               $response = curl_exec($ch);
               curl_close($ch);
               return json_decode($response, true);
          } catch (\Exception $e) {
               Log::warning("TelegramOTPAcc sendMessage failed: " . $e->getMessage());
               return null;
          }
     }

     /**
      * Normalize Cambodian phone number to +855 format.
      *
      * @param string $phone
      * @return string
      */
     public static function normalizeCambodianPhone($phone)
     {
          $phoneClean = preg_replace('/[^0-9]/', '', $phone);
          if (str_starts_with($phoneClean, '855')) {
               return '+' . $phoneClean;
          }
          if (str_starts_with($phoneClean, '0')) {
               return '+855' . substr($phoneClean, 1);
          }
          return '+855' . $phoneClean;
     }
}
