<?php

namespace App\payment_config;

use App\Models\Order;
use App\Models\Store;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Helpers\CustomKHQR;

class khqrConfig
{
     /**
      * Generate QR code response.
      *
      * @param Request $request
      * @return \Illuminate\Http\JsonResponse
      */
     public static function generate (Request $request)
     {
          $request->validate([
               'order_id' => 'nullable|exists:orders,id',
               'store_id' => 'nullable|integer',
               'amount' => 'nullable|numeric',
               'currency' => 'string|in:USD,KHR',
               'customer_name' => 'nullable|string',
               'customer_email' => 'nullable|string',
               'customer_phone' => 'nullable|string',
               'items' => 'nullable|array',
               'payment_method' => 'nullable|string',
               'bill_no' => 'nullable|string',
          ]);

          try {
               $currency = $request->input('currency', 'USD');

               if ($request->filled('order_id')) {
                    $order = Order::findOrFail($request->order_id);
                    $ownerId = $order->store_id;
                    $amount = $order->total_amount;
                    $customerName = $order->customer_name;
                    $customerEmail = $order->customer_email;
                    $customerPhone = $order->customer_phone;
                    $paymentMethod = $order->payment_method;
                    $orderId = $order->id;
                    $items = $order->items;
               } else {
                    $request->validate([
                         'store_id' => 'required|integer',
                         'amount' => 'required|numeric',
                    ]);
                    $ownerId = $request->input('store_id');
                    $amount = $request->input('amount');
                    $customerName = $request->input('customer_name', 'Guest User');
                    $customerEmail = $request->input('customer_email', 'customer@example.com');
                    $customerPhone = $request->input('customer_phone', '012345678');
                    $paymentMethod = $request->input('payment_method', 'aba');
                    $orderId = null;
                    $items = $request->input('items', []);
               }

               // Handle Bakong Payment Method
               if ($paymentMethod === 'bakong') {
                    $bakongAccountId = 'lyhour_chann@bkrt';
                    $bakongMerchantName = 'Lyhour Chann';
                    $bakongMerchantCity = 'Phnom Penh';

                    $paymentMethodsRow = Store::where('created_by', $ownerId)
                         ->where('key', 'payment_methods')
                         ->first();

                    if ($paymentMethodsRow) {
                         $methods = json_decode($paymentMethodsRow->value, true) ?: [];
                         if (isset($methods['bakong'])) {
                              $bakongConfig = $methods['bakong'];
                              $bakongValues = $bakongConfig['values'] ?? [];
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

                    $tran_id = 'TXN' . ($orderId ?: 'VIRTUAL') . '' . time();
                    if ($orderId === null && $request->filled('bill_no')) {
                         $tran_id = $request->input('bill_no');
                    }
                    $bakongAccountId = strtolower(trim($bakongAccountId));

                    if (empty($bakongAccountId)) {
                         $bakongAccountId = 'lyhour_chann@bkrt';
                    }

                    // Use the official Bakong KHQR SDK
                    $currencyCode = ($currency === 'KHR') ? 116 : 840;
                    $amountVal = (float) $amount;

                    // For Individual P2P Bakong accounts, generate static QR codes (amount = 0.0)
                    $isIndividual = (strpos($bakongAccountId, '@') !== false) && !str_contains($bakongAccountId, '@retail') && !str_contains($bakongAccountId, '@merchant');
                    if ($isIndividual) {
                         $amountVal = 0.0;
                    }

                    $billNo = $orderId ? ('ORD' . $orderId) : $tran_id;

                    $qrString = CustomKHQR::generate(
                         $bakongAccountId,
                         $bakongMerchantName ?: 'Merchant',
                         $bakongMerchantCity ?: 'Phnom Penh',
                         $amountVal,
                         $currencyCode,
                         $billNo
                    );
                    $md5 = md5($qrString);

                    Log::info('[Bakong Checkout] Generated QR', [
                         'order_id' => $orderId,
                         'bakong_account_id' => $bakongAccountId,
                         'amount' => $amount,
                         'currency' => $currency,
                         'qr_string' => $qrString
                    ]);

                    // Fetch Bakong API config for Deeplink
                    $bakongApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiMDFkZTkxZjVlZjJmNDNkOSJ9LCJpYXQiOjE3ODE1ODA5MDMsImV4cCI6MTc4OTM1NjkwM30.AeUiWG-mS__GNL20QFGwVsX6PLifCIQUvXcbIUCWBHg';
                    $bakongApiUrl = 'https://api-bakong.nbc.gov.kh';
                    if ($paymentMethodsRow) {
                         $methods = json_decode($paymentMethodsRow->value, true) ?: [];
                         if (isset($methods['bakong'])) {
                              $bakongConfig = $methods['bakong'];
                              $bakongValues = $bakongConfig['values'] ?? [];
                              $bakongApiKey = $bakongValues['apiKey'] ?? '';
                              $bakongApiUrl = rtrim(!empty($bakongValues['apiUrl']) ? $bakongValues['apiUrl'] : 'https://api-bakong.nbc.gov.kh', '/');
                         }
                    }

                    $deeplink = 'https://bakong.nbc.org.kh/download';
                    if (!empty($bakongApiKey)) {
                         try {
                              $bakongApiUrl = rtrim($bakongApiUrl, '/');
                              $httpClient = Http::withHeaders([
                                   'Content-Type' => 'application/json',
                                   'Accept' => 'application/json',
                              ])->withToken($bakongApiKey);

                              if (!app()->isProduction() || !empty($bakongConfig['sandbox']) || str_contains($bakongApiUrl, 'sandbox') || str_contains($bakongApiUrl, 'local')) {
                                   $httpClient = $httpClient->withoutVerifying();
                              }

                              $response = $httpClient->post($bakongApiUrl . '/v1/generate_deeplink_by_qr', [
                                   'qr' => $qrString,
                                   'appDeepLinkCallback' => $request->getSchemeAndHttpHost(),
                                   'appName' => $bakongMerchantName ?: 'Merchant',
                                   'appIconUrl' => 'https://bakong.nbc.gov.kh/assets/img/bakong-logo.png'
                              ]);

                              Log::info('[Bakong Deeplink Checkout] Response received', [
                                   'order_id' => $orderId,
                                   'status' => $response->status(),
                                   'body' => $response->json()
                              ]);

                              if ($response->successful()) {
                                   $resData = $response->json();
                                   if (isset($resData['data']['shortLink'])) {
                                        $deeplink = $resData['data']['shortLink'];
                                   }
                              }
                         } catch (\Exception $e) {
                              Log::error('[Bakong Deeplink Checkout] Failed: ' . $e->getMessage());
                         }
                    }

                    if ($orderId) {
                         PaymentTransaction::create([
                              'order_id' => $orderId,
                              'transaction_id' => $tran_id,
                              'payment_method' => 'bakong',
                              'amount' => $amount,
                              'status' => 'pending',
                              'raw_response' => json_encode([
                                   'qr_string' => $qrString,
                                   'deeplink' => $deeplink,
                                   'md5' => $md5
                              ]),
                         ]);
                    }

                    // Generate QR Image in WebP format (Base64 data:image/webp)
                    $base64Qr = CustomKHQR::generateWebpQrBase64($qrString, 300);

                    return response()->json([
                         'success' => true,
                         'qrString' => $qrString,
                         'qrImage' => $base64Qr,
                         'abapay_deeplink' => $deeplink,
                         'transaction_id' => $tran_id,
                    ]);
               }

               // Load store payment configuration
               $merchantId = 'ec454848'; // sandbox fallback
               $apiKey = 'ec454848b598b9e6e00ea3535cf04b122f87a875'; // sandbox fallback
               $apiUrl = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/generate-qr';

               $paymentMethodsRow = Store::where('created_by', $ownerId)
                    ->where('key', 'payment_methods')
                    ->first();

               if ($paymentMethodsRow) {
                    $methods = json_decode($paymentMethodsRow->value, true) ?: [];
                    if (isset($methods['aba'])) {
                         $abaConfigData = $methods['aba'];
                         $abaValues = $abaConfigData['values'] ?? [];

                         // ── NEW: Check for PayWay Link-based config ──────────
                         $paywayLink = $abaValues['payway_link'] ?? '';
                         if (!empty($paywayLink) && str_contains($paywayLink, 'link.payway.com.kh')) {
                              return abaConfig::generate(
                                   $request,
                                   $ownerId,
                                   $orderId,
                                   (float) $amount,
                                   $currency,
                                   $customerName ?: 'Guest User',
                                   $customerEmail ?: 'customer@example.com',
                                   $customerPhone ?: '012345678',
                                   $items,
                                   $paywayLink
                              );
                         }

                         // ── Legacy: API credential-based config (backward compat) ──
                         if (!empty($abaValues['merchantId'])) {
                              $merchantId = $abaValues['merchantId'];
                         } elseif (!empty($abaConfigData['merchantId'])) {
                              $merchantId = $abaConfigData['merchantId'];
                         }

                         if (!empty($abaValues['apiKey'])) {
                              $apiKey = $abaValues['apiKey'];
                         } elseif (!empty($abaConfigData['apiKey'])) {
                              $apiKey = $abaConfigData['apiKey'];
                         }

                         $rawUrl = $abaValues['apiUrl'] ?? $abaConfigData['apiUrl'] ?? null;
                         if (!empty($rawUrl)) {
                              $url = trim($rawUrl);
                              if (str_contains($url, 'link.payway.com.kh')) {
                                   $apiUrl = $url;
                              } else {
                                   if (!str_contains($url, '/payments/generate-qr') && !str_contains($url, '/payments/purchase')) {
                                        $url = rtrim($url, '/') . '/api/payment-gateway/v1/payments/generate-qr';
                                   } else {
                                        $url = str_replace('/payments/purchase', '/payments/generate-qr', $url);
                                   }
                                   $apiUrl = $url;
                              }
                         }
                    }
               }

               // Generate payload details
               $req_time = date('YmdHis');
               $tran_id = 'TXN-' . ($orderId ?: 'VIRTUAL') . '-' . time();
               if ($orderId === null && $request->filled('bill_no')) {
                    $tran_id = $request->input('bill_no');
               }
               $amountFormatted = $currency === 'KHR'
                    ? (string) round($amount)
                    : number_format((float) $amount, 2, '.', '');
               $purchase_type = 'purchase';
               $payment_option = 'abapay_khqr';

               $names = explode(' ', trim($customerName ?: 'Guest User'));
               $first_name = $names[0];
               $last_name = isset($names[1]) ? implode(' ', array_slice($names, 1)) : 'User';

               $email = $customerEmail ?: 'customer@example.com';
               $phone = $customerPhone ?: '012345678';

               $itemsList = [];
               if ($orderId) {
                    foreach ($items as $item) {
                         $itemsList[] = [
                              'name' => $item->name ?: ($item->productVariant->product->name ?? 'Product'),
                              'quantity' => (int) $item->quantity,
                              'price' => (float) number_format((float) $item->price, 2, '.', ''),
                         ];
                    }
               } else {
                    foreach ($items as $item) {
                         $itemsList[] = [
                              'name' => $item['name'] ?? 'Product',
                              'quantity' => (int) ($item['quantity'] ?? 1),
                              'price' => (float) number_format((float) ($item['price'] ?? 0), 2, '.', ''),
                         ];
                    }
               }
               if (empty($itemsList)) {
                    $itemsList[] = [
                         'name' => 'Order Item',
                         'quantity' => 1,
                         'price' => (float) $amountFormatted,
                    ];
               }
               $itemsBase64 = base64_encode(json_encode($itemsList));
               $callbackUrl = ''; // leave empty since we poll status
               $lifetime = 6;
               $qr_image_template = 'template3_color';

               // Correct PayWay generate-qr hash sequence (19 parameters):
               $hashStr = $req_time
                    . $merchantId
                    . $tran_id
                    . $amountFormatted
                    . $itemsBase64
                    . $first_name
                    . $last_name
                    . $email
                    . $phone
                    . $purchase_type
                    . $payment_option
                    . $callbackUrl
                    . '' // return_deeplink
                    . $currency
                    . '' // custom_fields
                    . '' // return_params
                    . '' // payout
                    . $lifetime
                    . $qr_image_template;

               $postFields = [
                    'req_time' => $req_time,
                    'merchant_id' => $merchantId,
                    'tran_id' => $tran_id,
                    'first_name' => $first_name,
                    'last_name' => $last_name,
                    'email' => $email,
                    'phone' => $phone,
                    'amount' => $amountFormatted,
                    'purchase_type' => $purchase_type,
                    'payment_option' => $payment_option,
                    'items' => $itemsBase64,
                    'currency' => $currency,
                    'callback_url' => $callbackUrl ?: null,
                    'return_deeplink' => null,
                    'custom_fields' => null,
                    'return_params' => null,
                    'payout' => null,
                    'lifetime' => $lifetime,
                    'qr_image_template' => $qr_image_template,
                    'hash' => base64_encode(hash_hmac('sha512', $hashStr, $apiKey, true)),
               ];

               Log::info('[PayWay] Sending QR Generate request to: ' . $apiUrl, $postFields);

               // Connect server-to-server (bypass SSL verification on local/sandbox to avoid cURL cert issues)
               $httpClient = Http::withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
               ]);
               if (!app()->isProduction() || str_contains($apiUrl, 'sandbox')) {
                    $httpClient = $httpClient->withoutVerifying();
               }

               // MOCK MODE FALLBACK / PAYWAY LINK: If merchantId is sandbox prefix 'ec', url contains sandbox, or it is a direct PayWay Link
               $isPaywayLink = str_contains($apiUrl, 'link.payway.com.kh');
               $isSandbox = str_contains($apiUrl, 'sandbox') || str_starts_with($merchantId, 'ec') || $isPaywayLink;
               if ($isSandbox && $request->input('real') !== 'true' && $request->input('real') !== 1 && $request->input('real') !== '1') {
                    $qrStringVal = 'mock_khqr_string_for_testing_' . $tran_id;

                    if ($isPaywayLink) {
                         // Generate a real scan-compatible KHQR for direct transfers
                         $bakongAccountId = '1785273@aba';
                         $bakongMerchantName = 'CHANN LYHOUR';
                         $bakongMerchantCity = 'Phnom Penh';
                         if ($paymentMethodsRow) {
                              $methods = json_decode($paymentMethodsRow->value, true) ?: [];
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
                         $amountVal = (float) $amount;
                         $billNo = $orderId ? ('ORD' . $orderId) : $tran_id;

                         $qrStringVal = CustomKHQR::generate(
                              $bakongAccountId,
                              $bakongMerchantName ?: 'Merchant',
                              $bakongMerchantCity ?: 'Phnom Penh',
                              $amountVal,
                              $currencyCode,
                              $billNo
                         );
                    }

                    $mockResData = [
                         'status' => 0,
                         'description' => 'Success',
                         'qrString' => $qrStringVal,
                         'qrImage' => '', // Generated below
                         'abapay_deeplink' => $isPaywayLink ? $apiUrl : 'http://localhost:3000/mock-payway-deeplink',
                    ];

                    if ($orderId) {
                         PaymentTransaction::create([
                              'order_id' => $orderId,
                              'transaction_id' => $tran_id,
                              'payment_method' => 'aba_pay',
                              'amount' => $amount,
                              'status' => 'pending',
                              'raw_response' => json_encode($mockResData),
                         ]);
                    }

                    // Generate QR Image in WebP format (Base64 data:image/webp)
                    $base64Qr = CustomKHQR::generateWebpQrBase64($mockResData['qrString'], 300);

                    return response()->json([
                         'success' => true,
                         'qrString' => $mockResData['qrString'],
                         'qrImage' => $base64Qr,
                         'abapay_deeplink' => $mockResData['abapay_deeplink'],
                         'transaction_id' => $tran_id,
                    ]);
               }

               $response = $httpClient->post($apiUrl, $postFields);

               Log::info('[PayWay] QR Generate Response', [
                    'order_id' => $orderId,
                    'status' => $response->status(),
                    'response' => $response->json()
               ]);

               if ($response->failed()) {
                    return response()->json([
                         'success' => false,
                         'message' => 'Failed to connect to PayWay API: HTTP Status ' . $response->status(),
                    ], 502);
               }

               $resData = $response->json();
               Log::info('[PayWay] QR Response received: ', $resData ?? []);

               // Check if PayWay returned status 0 (Success)
               $statusCode = isset($resData['status']['code']) ? (int) $resData['status']['code'] : (isset($resData['status']) ? (int) $resData['status'] : -1);
               if ($statusCode === 0) {
                    if ($orderId) {
                         // Record the pending transaction log
                         PaymentTransaction::create([
                              'order_id' => $orderId,
                              'transaction_id' => $tran_id,
                              'payment_method' => 'aba_pay',
                              'amount' => $amount,
                              'status' => 'pending',
                              'raw_response' => json_encode($resData),
                         ]);
                    }

                    return response()->json([
                         'success' => true,
                         'qrString' => $resData['qrString'] ?? '',
                         'qrImage' => $resData['qrImage'] ?? '',
                         'abapay_deeplink' => $resData['abapay_deeplink'] ?? '',
                         'transaction_id' => $tran_id,
                    ]);
               }

               return response()->json([
                    'success' => false,
                    'message' => $resData['description'] ?? ($resData['status']['message'] ?? 'PayWay Gateway returned an error.'),
                    'raw' => $resData,
               ], 400);

          } catch (\Exception $e) {
               Log::error('[PayWay] Generate QR Exception: ' . $e->getMessage());
               return response()->json([
                    'success' => false,
                    'message' => 'Internal Server Error: ' . $e->getMessage(),
               ], 500);
          }
     }
}
