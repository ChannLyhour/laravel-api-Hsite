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

               // Handle Dynamic KHQR for Bakong, ABA, and KHPay methods
               $paymentMethodsRow = Store::where('created_by', $ownerId)
                    ->where('key', 'payment_methods')
                    ->first();

               $methods = $paymentMethodsRow ? (json_decode($paymentMethodsRow->value, true) ?: []) : [];
               $abaValues = $methods['aba']['values'] ?? [];
               $bakongValues = $methods['bakong']['values'] ?? [];

               $bakongAccountId = !empty($bakongValues['bakongAccountId']) ? $bakongValues['bakongAccountId'] : 'lyhour_chann@bkrt';
               $bakongMerchantName = !empty($bakongValues['merchantName']) ? $bakongValues['merchantName'] : 'OuR20s Collection';
               $bakongMerchantCity = !empty($bakongValues['merchantCity']) ? $bakongValues['merchantCity'] : 'Siem Reap';

               $tran_id = 'TXN' . ($orderId ?: 'VIRTUAL') . '' . time();
               if ($orderId === null && $request->filled('bill_no')) {
                    $tran_id = $request->input('bill_no');
               }
               $bakongAccountId = strtolower(trim($bakongAccountId));

               $paywayLink = !empty($abaValues['payway_link']) ? $abaValues['payway_link'] : 'https://link.payway.com.kh/ABAPAYvu485790W';

               if ($paymentMethod === 'bakong') {
                    $currencyCode = ($currency === 'KHR') ? 116 : 840;
                    $qrString = CustomKHQR::generate(
                         $bakongAccountId,
                         $bakongMerchantName ?: 'Merchant',
                         $bakongMerchantCity ?: 'Siem Reap',
                         (float) $amount,
                         $currencyCode,
                         (string) ($orderId ?: $tran_id)
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

                    $deeplink = 'https://bakong.nbc.gov.kh/download';
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
               $merchantId = 'ec477316';
               $apiKey = '8c5b65561de1d1664859d7621fa3ca8d6c99a707';
               $apiUrl = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';

               $paymentMethodsRow = Store::where('created_by', $ownerId)
                    ->where('key', 'payment_methods')
                    ->first();

               if ($paymentMethodsRow) {
                    $methods = json_decode($paymentMethodsRow->value, true) ?: [];
                    if (isset($methods['aba'])) {
                         $abaConfigData = $methods['aba'];
                         $abaValues = $abaConfigData['values'] ?? [];

                         if (!empty($abaValues['merchantId'])) {
                              $merchantId = $abaValues['merchantId'];
                         }
                         if (!empty($abaValues['apiKey'])) {
                              $apiKey = $abaValues['apiKey'];
                         }
                    }
               }

               // Generate payload details (PayWay requires tran_id to be max 20 characters)
               $req_time = date('YmdHis');
               $tran_id = substr('TXN' . ($orderId ?: rand(1000, 9999)) . time(), 0, 20);
               if ($orderId === null && $request->filled('bill_no')) {
                    $tran_id = substr($request->input('bill_no'), 0, 20);
               }
               $amountFormatted = $currency === 'KHR'
                    ? (string) round($amount)
                    : number_format((float) $amount, 2, '.', '');

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

               $purchase_type = 'purchase';
               $payment_option = 'abapay_khqr';
               $callback_url = base64_encode(url('/api/v1/payment/aba/callback'));
               $return_deeplink = '';
               $custom_fields = '';
               $return_params = '';
               $payout = '';
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
                    . $callback_url
                    . $return_deeplink
                    . $currency
                    . $custom_fields
                    . $return_params
                    . $payout
                    . $lifetime
                    . $qr_image_template;

               $hash = base64_encode(hash_hmac('sha512', $hashStr, $apiKey, true));

               $postFields = [
                    'req_time' => $req_time,
                    'merchant_id' => $merchantId,
                    'tran_id' => $tran_id,
                    'first_name' => $first_name,
                    'last_name' => $last_name,
                    'email' => $email,
                    'phone' => $phone,
                    'amount' => (float)$amountFormatted,
                    'purchase_type' => $purchase_type,
                    'payment_option' => $payment_option,
                    'items' => $itemsBase64,
                    'currency' => $currency,
                    'callback_url' => $callback_url,
                    'return_deeplink' => null,
                    'custom_fields' => null,
                    'return_params' => null,
                    'payout' => null,
                    'lifetime' => $lifetime,
                    'qr_image_template' => $qr_image_template,
                    'hash' => $hash,
               ];

               $apiUrl = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/generate-qr';
               Log::info('[PayWay] Sending QR Generate API request to: ' . $apiUrl, $postFields);

               $httpClient = Http::withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
               ]);
               if (!app()->isProduction() || str_contains($apiUrl, 'sandbox')) {
                    $httpClient = $httpClient->withoutVerifying();
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

               $statusObj = $resData['status'] ?? null;
               $isSuccess = false;
               if (is_array($statusObj) && isset($statusObj['code'])) {
                    $codeStr = (string)$statusObj['code'];
                    if ($codeStr === '00' || $codeStr === '0') {
                         $isSuccess = true;
                    }
               } elseif (!empty($resData['qrString']) || !empty($resData['qrImage'])) {
                    $isSuccess = true;
               }

               if ($isSuccess) {
                    $resTranId = (is_array($statusObj) && !empty($statusObj['tran_id'])) ? $statusObj['tran_id'] : $tran_id;
                    if ($orderId) {
                         PaymentTransaction::create([
                              'order_id' => $orderId,
                              'transaction_id' => $resTranId,
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
                         'transaction_id' => $resTranId,
                         'status' => $statusObj,
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
