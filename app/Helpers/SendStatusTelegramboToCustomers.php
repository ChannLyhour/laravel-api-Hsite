<?php

namespace App\Helpers;

use App\Models\Store;
use Illuminate\Support\Facades\Log;

class SendStatusTelegramboToCustomers
{
     /**
      * Send Order Status Update message to the customer via Telegram.
      *
      * @param \App\Models\Order $order
      * @param string $status
      * @return void
      */
     public static function sendStatus ($order, $status)
     {
          try {
               $storeId = $order->store_id;
               $customerPhone = $order->customer_phone;

               if (!$storeId) {
                    Log::warning("SendStatusTelegramboToCustomers::sendStatus - No store_id on order {$order->id}, aborting.");
                    return;
               }

               if (!$customerPhone) {
                    Log::warning("SendStatusTelegramboToCustomers::sendStatus - No phone number on order {$order->id}, aborting.");
                    return;
               }

               // Check store configuration
               $telegramEnabled = Store::where('created_by', $storeId)->where('key', 'telegram_enabled')->value('value');
               if ($telegramEnabled !== '1' && $telegramEnabled !== 1 && $telegramEnabled !== 'true') {
                    Log::info("SendStatusTelegramboToCustomers::sendStatus - Telegram is not enabled for store {$storeId}, skipping.");
                    return;
               }

               $botToken = Store::where('created_by', $storeId)->where('key', 'telegram_bot_token')->value('value');
               if (!$botToken) {
                    Log::warning("SendStatusTelegramboToCustomers::sendStatus - No telegram_bot_token configured for store {$storeId}, aborting.");
                    return;
               }

               // Normalize phone and look up customer's Telegram chat_id
               $normalizedPhone = self::normalizePhone($customerPhone);
               $customerChatId = Store::where('created_by', $storeId)->where('key', "tg_chat_" . $normalizedPhone)->value('value');

               if (!$customerChatId) {
                    Log::info("SendStatusTelegramboToCustomers::sendStatus - Customer phone {$customerPhone} does not have a linked Telegram chat_id in store settings, skipping notification.");
                    return;
               }

               // Format status message
               $storeName = Store::where('created_by', $storeId)->where('key', 'store_name')->value('value') ?: 'Our Store';
               $customerName = htmlspecialchars($order->customer_name ?? 'Valued Customer', ENT_QUOTES, 'UTF-8');
               $orderNo = $order->order_no ?: $order->id;
               $totalAmount = number_format($order->total_amount, 2);

               $statusText = strtolower(trim($status));
               $statusEmoji = 'ℹ️';
               $statusTitle = 'Order Update | ព័ត៌មានការបញ្ជាទិញ';
               $statusDescEN = '';
               $statusDescKH = '';

               switch ($statusText) {
                    case 'pending':
                         $statusEmoji = '⏳';
                         $statusTitle = 'Order Placed (Pending) | ការបញ្ជាទិញកំពុងរង់ចាំ';
                         $statusDescEN = 'Your order has been received and is currently pending verification.';
                         $statusDescKH = 'ការបញ្ជាទិញរបស់អ្នកត្រូវបានទទួល និងកំពុងរង់ចាំការផ្ទៀងផ្ទាត់។';
                         break;
                    case 'confirmed':
                    case 'confirmed_order':
                         $statusEmoji = '✅';
                         $statusTitle = 'Order Confirmed | ការបញ្ជាទិញត្រូវបានបញ្ជាក់';
                         $statusDescEN = 'Great news! Your order has been confirmed by the store.';
                         $statusDescKH = 'ដំណឹងល្អ! ការបញ្ជាទិញរបស់អ្នកត្រូវបានបញ្ជាក់ដោយហាងហើយ។';
                         break;
                    case 'processing':
                         $statusEmoji = '👨‍🍳';
                         $statusTitle = 'Order Processing | កំពុងរៀបចំការបញ្ជាទិញ';
                         $statusDescEN = 'Your order is currently being prepared and will be shipped shortly.';
                         $statusDescKH = 'ការបញ្ជាទិញរបស់អ្នកកំពុងត្រូវបានរៀបចំ និងផ្ញើជូនក្នុងពេលឆាប់ៗនេះ។';
                         break;
                    case 'delivering':
                    case 'shipped':
                    case 'out_for_delivery':
                         $statusEmoji = '🚚';
                         $statusTitle = 'Out For Delivery | ទំនិញកំពុងដឹកជញ្ជូន';
                         $statusDescEN = 'Your order is out for delivery! Our delivery agent will contact you shortly.';
                         $statusDescKH = 'ទំនិញរបស់អ្នកកំពុងត្រូវបានដឹកជញ្ជូនហើយ! ភ្នាក់ងារដឹកជញ្ជូននឹងទាក់ទងទៅអ្នកក្នុងពេលឆាប់ៗនេះ។';
                         break;
                    case 'completed':
                    case 'complete':
                         $statusEmoji = '🎉';
                         $statusTitle = 'Order Completed | ការបញ្ជាទិញត្រូវបានបញ្ចប់';
                         $statusDescEN = 'Your order has been successfully completed. Thank you for shopping with us!';
                         $statusDescKH = 'ការបញ្ជាទិញរបស់អ្នកត្រូវបានបញ្ចប់ដោយជោគជ័យ។ អរគុណសម្រាប់ការគាំទ្រហាងយើងខ្ញុំ!';
                         break;
                    case 'cancelled':
                    case 'canceled':
                         $statusEmoji = '❌';
                         $statusTitle = 'Order Cancelled | ការបញ្ជាទិញត្រូវបានលុបចោល';
                         $statusDescEN = 'Your order has been cancelled. Please contact support if you have any questions.';
                         $statusDescKH = 'ការបញ្ជាទិញរបស់អ្នកត្រូវបានលុបចោល។ សូមទាក់ទងមកខាងយើងខ្ញុំ ប្រសិនបើអ្នកមានចម្ងល់ផ្សេងៗ។';
                         break;
                    default:
                         $statusEmoji = 'ℹ️';
                         $statusTitle = 'Order Status Updated | ស្ថានភាពការបញ្ជាទិញត្រូវបានផ្លាស់ប្តូរ';
                         $statusDescEN = "Your order status has been updated to: " . ucfirst($statusText) . ".";
                         $statusDescKH = "ស្ថានភាពនៃការបញ្ជាទិញរបស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាពទៅជា៖ " . strtoupper($statusText) . "។";
                         break;
               }

               $messageLines = [
                    "{$statusEmoji} <b>{$statusTitle}</b>",
                    "",
                    "Hello <b>{$customerName}</b>,",
                    "🇺🇸 {$statusDescEN}",
                    "🇰🇭 {$statusDescKH}",
                    "",
                    "📋 <b>Order Number / លេខបញ្ជាទិញ:</b> #{$orderNo}",
                    "💰 <b>Total Amount / ទឹកប្រាក់សរុប:</b> \${$totalAmount}",
                    "🏪 <b>Store / ហាង:</b> {$storeName}",
                    "",
                    "🔄 <b>Status / ស្ថានភាព:</b> <code>" . strtoupper($statusText) . "</code>",
                    "⏰ Updated at / ធ្វើបច្ចុប្បន្នភាព៖ " . now()->format('M d, Y, h:i A')
               ];

               $text = implode("\n", $messageLines);

               $result = self::sendMessage($botToken, $customerChatId, $text);
               Log::info("SendStatusTelegramboToCustomers::sendStatus - Sent status {$statusText} to customer chat ID {$customerChatId}. Result: " . json_encode($result));
          } catch (\Exception $e) {
               Log::error("SendStatusTelegramboToCustomers::sendStatus failed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
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
               Log::warning("SendStatusTelegramboToCustomers sendMessage failed: " . $e->getMessage());
               return null;
          }
     }

     /**
      * Normalize Cambodian phone number to +855 format.
      */
     public static function normalizePhone ($phone)
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
