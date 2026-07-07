<?php

namespace App\payment_config;

use App\Models\Order;
use App\Models\Store;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Helpers\CustomKHQR;

class abaConfig
{
     /**
      * Generate QR / deeplink response for ABA PayWay Link-based payment.
      *
      * Instead of calling PayWay's API with Merchant ID + API Key,
      * this reads the store owner's PayWay sharing link
      * (e.g. https://link.payway.com.kh/ABAPAYV74740762)
      * and returns it as a deeplink for the customer to open and pay.
      *
      * A Bakong KHQR is also generated as a scan-to-pay fallback.
      *
      * @param  Request  $request
      * @param  int      $ownerId
      * @param  int|null $orderId
      * @param  float    $amount
      * @param  string   $currency
      * @param  string   $customerName
      * @param  string   $customerEmail
      * @param  string   $customerPhone
      * @param  mixed    $items
      * @param  string   $paywayLink
      * @return \Illuminate\Http\JsonResponse
      */
     public static function generate(
          Request $request,
          int $ownerId,
          ?int $orderId,
          float $amount,
          string $currency,
          string $customerName,
          string $customerEmail,
          string $customerPhone,
          $items,
          string $paywayLink
     ) {
          try {
               $tran_id = 'TXN-' . ($orderId ?: 'VIRTUAL') . '-' . time();
               if ($orderId === null && $request->filled('bill_no')) {
                    $tran_id = $request->input('bill_no');
               }

               // ── Build the PayWay deeplink with amount appended ──────────
               // The PayWay sharing link is the customer-facing payment page.
               // We pass it as-is so the customer opens it to pay.
               $deeplink = rtrim(trim($paywayLink), '/');

               // ── Generate a Bakong KHQR for scan-to-pay fallback ─────────
               $bakongAccountId = '';
               $bakongMerchantName = 'Merchant';
               $bakongMerchantCity = 'Phnom Penh';

               $paymentMethodsRow = Store::where('created_by', $ownerId)
                    ->where('key', 'payment_methods')
                    ->first();

               if ($paymentMethodsRow) {
                    $methods = json_decode($paymentMethodsRow->value, true) ?: [];

                    // Try to read Bakong config for KHQR generation
                    if (isset($methods['bakong'])) {
                         $bakongValues = $methods['bakong']['values'] ?? [];
                         if (!empty($bakongValues['bakongAccountId'])) {
                              $bakongAccountId = $bakongValues['bakongAccountId'];
                         }
                         if (!empty($bakongValues['merchantName'])) {
                              $bakongMerchantName = $bakongValues['merchantName'];
                         }
                         if (!empty($bakongValues['merchantCity'])) {
                              $bakongMerchantCity = $bakongValues['merchantCity'];
                         }
                    }
               }

               $bakongAccountId = strtolower(trim($bakongAccountId));
               $currencyCode = ($currency === 'KHR') ? 116 : 840;
               $billNo = $orderId ? ('ORD' . $orderId) : $tran_id;

               // Generate KHQR string — try Bakong first, fallback to PayWay link QR
               $qrString = $deeplink; // Default: QR encodes the PayWay link
               if (!empty($bakongAccountId) && str_contains($bakongAccountId, '@')) {
                    try {
                         $qrString = CustomKHQR::generate(
                              $bakongAccountId,
                              $bakongMerchantName,
                              $bakongMerchantCity,
                              $amount,
                              $currencyCode,
                              $billNo
                         );
                    } catch (\Exception $e) {
                         Log::warning('[ABA PayWay Link] Bakong KHQR generation failed, using PayWay link as QR: ' . $e->getMessage());
                         $qrString = $deeplink;
                    }
               }

               // Generate QR Image in WebP format (Base64 data:image/webp)
               $base64Qr = CustomKHQR::generateWebpQrBase64($qrString, 300);

               // Record the pending transaction
               if ($orderId) {
                    PaymentTransaction::create([
                         'order_id' => $orderId,
                         'transaction_id' => $tran_id,
                         'payment_method' => 'aba_pay',
                         'amount' => $amount,
                         'status' => 'pending',
                         'raw_response' => json_encode([
                              'payway_link' => $deeplink,
                              'qr_string' => $qrString,
                         ]),
                    ]);
               }

               Log::info('[ABA PayWay Link] QR generated for owner ' . $ownerId, [
                    'payway_link' => $deeplink,
                    'tran_id' => $tran_id,
                    'amount' => $amount,
                    'currency' => $currency,
               ]);

               return response()->json([
                    'success' => true,
                    'qrString' => $qrString,
                    'qrImage' => $base64Qr,
                    'abapay_deeplink' => $deeplink,
                    'transaction_id' => $tran_id,
               ]);

          } catch (\Exception $e) {
               Log::error('[ABA PayWay Link] Generate Exception: ' . $e->getMessage());
               return response()->json([
                    'success' => false,
                    'message' => 'Internal Server Error: ' . $e->getMessage(),
               ], 500);
          }
     }
}
