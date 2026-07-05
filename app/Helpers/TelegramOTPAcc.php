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
          Log::info("TelegramOTPAcc::sendOTP called - Order ID: {$order->id}, Store ID: {$storeId}, Phone: {$order->customer_phone}, OTP: {$otpCode}");

          if (!$storeId) {
               Log::warning("TelegramOTPAcc::sendOTP - No store_id, aborting.");
               return;
          }

          try {
               $enabled = Store::where('created_by', $storeId)->where('key', 'telegram_enabled')->value('value');
               Log::info("TelegramOTPAcc::sendOTP - telegram_enabled value: " . var_export($enabled, true));
               if ($enabled !== '1' && $enabled !== 1 && $enabled !== 'true') {
                    Log::warning("TelegramOTPAcc::sendOTP - Telegram not enabled for store {$storeId}, aborting.");
                    return;
               }

               $botToken = Store::where('created_by', $storeId)->where('key', 'telegram_bot_token')->value('value');
               $chatId = Store::where('created_by', $storeId)->where('key', 'telegram_chat_id')->value('value');
               Log::info("TelegramOTPAcc::sendOTP - botToken: " . ($botToken ? 'present' : 'NULL') . ", chatId: {$chatId}");

               if (!$botToken) {
                    Log::warning("TelegramOTPAcc::sendOTP - No bot token, aborting.");
                    return;
               }

               $customerName = htmlspecialchars($order->customer_name ?? 'Guest Customer', ENT_QUOTES, 'UTF-8');
               $customerPhone = htmlspecialchars($order->customer_phone ?? '', ENT_QUOTES, 'UTF-8');

               $normalizedPhone = self::normalizeCambodianPhone($customerPhone);
               $customerChatId = Store::where('created_by', $storeId)->where('key', "tg_chat_" . $normalizedPhone)->value('value');
               $targetChatId = $customerChatId ?: $chatId;
               Log::info("TelegramOTPAcc::sendOTP - normalizedPhone: {$normalizedPhone}, customerChatId: " . ($customerChatId ?? 'NULL') . ", targetChatId: {$targetChatId}");

               if (!$targetChatId) {
                    Log::warning("TelegramOTPAcc::sendOTP - No target chat ID, aborting.");
                    return;
               }

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

               $result = self::sendMessage($botToken, $targetChatId, $message);
               Log::info("TelegramOTPAcc::sendOTP - sendMessage result: " . json_encode($result));
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
      * Check if there is a pending order for this phone number and store owner, and send the OTP if it exists in cache.
      *
      * @param int $storeOwnerId
      * @param string $normalizedPhone
      * @param string $rawPhoneNumber
      * @return void
      */
     public static function checkAndSendPendingOTP($storeOwnerId, $normalizedPhone, $rawPhoneNumber)
     {
          try {
               Log::info("checkAndSendPendingOTP: Checking pending orders for storeOwner: {$storeOwnerId}, phone: {$normalizedPhone}");
               
               // Find any recent pending orders for this store owner matching either normalized or raw phone
               $pendingOrder = \App\Models\Order::where('store_id', $storeOwnerId)
                    ->where(function($q) use ($normalizedPhone, $rawPhoneNumber) {
                         $cleanRaw = preg_replace('/[^0-9]/', '', $rawPhoneNumber);
                         $q->where('customer_phone', 'like', '%' . $normalizedPhone . '%')
                           ->orWhere('customer_phone', 'like', '%' . $cleanRaw . '%')
                           ->orWhere('customer_phone', 'like', '%' . ltrim($normalizedPhone, '+') . '%');
                    })
                    ->orderBy('created_at', 'desc')
                    ->first();

               if ($pendingOrder) {
                    $otpCode = \Illuminate\Support\Facades\Cache::get("order_otp_{$pendingOrder->id}");
                    Log::info("checkAndSendPendingOTP: Found order ID {$pendingOrder->id}, Cached OTP exists: " . ($otpCode ? 'Yes' : 'No'));
                    if ($otpCode) {
                         self::sendOTP($pendingOrder, $otpCode);
                    }
               } else {
                    Log::info("checkAndSendPendingOTP: No pending order found for {$normalizedPhone}");
               }
          } catch (\Exception $e) {
               Log::error("TelegramOTPAcc::checkAndSendPendingOTP failed: " . $e->getMessage());
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
