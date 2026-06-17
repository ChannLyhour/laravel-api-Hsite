<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use App\Helpers\CustomKHQR;

class PaymentController extends Controller
{
    /**
     * Generate PayWay KHQR for checking out.
     */
    public function generateQr(Request $request)
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
                $amountVal = (float)$amount;

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
                    $abaConfig = $methods['aba'];
                    $abaValues = $abaConfig['values'] ?? [];

                    if (!empty($abaValues['merchantId'])) {
                        $merchantId = $abaValues['merchantId'];
                    } elseif (!empty($abaConfig['merchantId'])) {
                        $merchantId = $abaConfig['merchantId'];
                    }

                    if (!empty($abaValues['apiKey'])) {
                        $apiKey = $abaValues['apiKey'];
                    } elseif (!empty($abaConfig['apiKey'])) {
                        $apiKey = $abaConfig['apiKey'];
                    }

                    $rawUrl = $abaValues['apiUrl'] ?? $abaConfig['apiUrl'] ?? null;
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
                ? (string)round($amount)
                : number_format((float)$amount, 2, '.', '');
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
                        'quantity' => (int)$item->quantity,
                        'price' => (float)number_format((float)$item->price, 2, '.', ''),
                    ];
                }
            } else {
                foreach ($items as $item) {
                    $itemsList[] = [
                        'name' => $item['name'] ?? 'Product',
                        'quantity' => (int)($item['quantity'] ?? 1),
                        'price' => (float)number_format((float)($item['price'] ?? 0), 2, '.', ''),
                    ];
                }
            }
            if (empty($itemsList)) {
                $itemsList[] = [
                    'name' => 'Order Item',
                    'quantity' => 1,
                    'price' => (float)$amountFormatted,
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
                    $amountVal = (float)$amount;
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
            $statusCode = isset($resData['status']['code']) ? (int)$resData['status']['code'] : (isset($resData['status']) ? (int)$resData['status'] : -1);
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

    /**
     * Check transaction status on PayWay Sandbox.
     */
    public function checkTransaction(Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|string',
            'store_id' => 'nullable|integer',
            'payment_method' => 'nullable|string',
            'md5' => 'nullable|string',
        ]);

        try {
            $txn = PaymentTransaction::where('transaction_id', $request->transaction_id)->first();
            $order = null;

            if ($txn) {
                $order = $txn->order;
                $ownerId = $order ? $order->store_id : 1;
                $paymentMethod = $txn->payment_method;
                $rawResponse = json_decode($txn->raw_response, true) ?: [];
                $qrString = $rawResponse['qr_string'] ?? '';
                $md5 = md5($qrString);
            } else {
                $ownerId = $request->input('store_id') ?: ($request->user() ? $request->user()->id : 1);
                $paymentMethod = $request->input('payment_method', 'aba');
                $md5 = $request->input('md5');
                if (empty($md5)) {
                    $md5 = md5('mock_khqr_string_for_testing_' . $request->transaction_id);
                }
            }

            // Handle Bakong verification
            if ($paymentMethod === 'bakong') {
                $wantsConfirm = $request->input('confirm') === true || $request->input('confirm') === 'true' || $request->input('confirm') == 1;
                
                // Fetch Bakong API keys from store settings
                $apiKey = '';
                $apiUrl = '';
                $isSandbox = true;

                $paymentMethodsRow = Store::where('created_by', $ownerId)
                    ->where('key', 'payment_methods')
                    ->first();

                if ($paymentMethodsRow) {
                    $methods = json_decode($paymentMethodsRow->value, true) ?: [];
                    if (isset($methods['bakong'])) {
                        $bakongConfig = $methods['bakong'];
                        $bakongValues = $bakongConfig['values'] ?? [];
                        if (!empty($bakongValues['apiKey'])) {
                            $apiKey = $bakongValues['apiKey'];
                        }
                        if (!empty($bakongValues['apiUrl'])) {
                            $apiUrl = rtrim($bakongValues['apiUrl'], '/');
                        }
                        $isSandbox = !empty($bakongConfig['sandbox']);
                    }
                }

                $apiKey = $apiKey ?: config('bakong.api_token');
                $apiUrl = rtrim($apiUrl ?: config('bakong.api_url'), '/');

                // Force override API URL based on Sandbox mode for NBC testing
                if ($isSandbox && $apiUrl === 'https://api-bakong.nbc.gov.kh') {
                    $apiUrl = 'https://sit-api-bakong.nbc.gov.kh';
                } elseif (!$isSandbox && $apiUrl === 'https://sit-api-bakong.nbc.gov.kh') {
                    $apiUrl = 'https://api-bakong.nbc.gov.kh';
                }

                // Facilitate mock testing for local environment without active token
                if (env('APP_ENV') === 'local' && (empty($apiKey) || $apiKey === 'your_bakong_token_here' || $md5 === 'mock_success' || $request->transaction_id === 'mock_success')) {
                    $mockResData = [
                        'status' => ['code' => 0, 'errorCode' => null, 'message' => null],
                        'data' => [
                            'hash' => $md5,
                            'amount' => $txn ? (float)$txn->amount : 0.0,
                            'status' => 'SUCCESS'
                        ]
                    ];
                    if ($txn) {
                        $txn->update([
                            'status' => 'success',
                            'raw_response' => json_encode($mockResData),
                        ]);
                        if ($order) {
                            $order->update(['payment_status' => 'Paid']);
                        }
                    }

                    return response()->json([
                        'success' => true,
                        'payment_status' => 'Paid',
                        'message' => 'Bakong payment completed successfully (Local Mock)!',
                        'raw' => $mockResData,
                    ]);
                }

                // 1. If we have a token, attempt a real API check
                if ($apiKey || $md5) {
                    try {
                        $httpClient = Http::withHeaders([
                            'Content-Type' => 'application/json',
                            'Accept' => 'application/json',
                        ])->withToken($apiKey);

                        if (!app()->isProduction() || $isSandbox || str_contains($apiUrl, 'sandbox') || str_contains($apiUrl, 'local')) {
                            $httpClient = $httpClient->withoutVerifying();
                        }

                        $response = $httpClient->post($apiUrl . '/v1/check_transaction_by_md5', [
                            'md5' => $md5
                        ]);

                        Log::info('[Bakong Check Transaction] Response received', [
                            'transaction_id' => $request->transaction_id,
                            'status' => $response->status(),
                            'body' => $response->json()
                        ]);

                        if ($response->successful()) {
                            $resData = $response->json();
                            $code = isset($resData['status']['code']) ? (int)$resData['status']['code'] : (isset($resData['responseCode']) ? (int)$resData['responseCode'] : -1);
                            $dataField = $resData['data'] ?? [];
                            $statusVal = $dataField['status'] ?? '';

                            if ($code === 0 && (strtolower($statusVal) === 'success' || $statusVal === 'SUCCESS')) {
                                if ($txn) {
                                    $txn->update([
                                        'status' => 'success',
                                        'raw_response' => json_encode($resData),
                                    ]);
                                    if ($order) {
                                        $order->update(['payment_status' => 'Paid']);
                                    }
                                }

                                return response()->json([
                                    'success' => true,
                                    'payment_status' => 'Paid',
                                    'message' => 'Bakong payment completed successfully!',
                                    'raw' => $resData,
                                ]);
                            }
                        }
                    } catch (\Exception $e) {
                        Log::error('[Bakong checkTransaction] Real API call exception: ' . $e->getMessage());
                    }
                }

                // 2. Fallback to mock confirmation if requested
                if ($wantsConfirm) {
                    if ($txn) {
                        $txn->update(['status' => 'success']);
                        if ($order) {
                            $order->update(['payment_status' => 'Paid']);
                        }
                    }
                    
                    return response()->json([
                        'success' => true,
                        'payment_status' => 'Paid',
                        'message' => 'Bakong payment completed successfully (Mock Mode)!',
                    ]);
                }
                
                return response()->json([
                    'success' => true,
                    'payment_status' => 'Unpaid',
                    'message' => 'Bakong payment is still pending.',
                ]);
            }

            // Load store API credentials
            $merchantId = 'ec454848';
            $apiKey = 'ec454848b598b9e6e00ea3535cf04b122f87a875';
            $apiUrl = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction';

            $paymentMethodsRow = Store::where('created_by', $ownerId)
                ->where('key', 'payment_methods')
                ->first();

            if ($paymentMethodsRow) {
                $methods = json_decode($paymentMethodsRow->value, true) ?: [];
                if (isset($methods['aba'])) {
                    $abaConfig = $methods['aba'];
                    $abaValues = $abaConfig['values'] ?? [];

                    if (!empty($abaValues['merchantId'])) {
                        $merchantId = $abaValues['merchantId'];
                    } elseif (!empty($abaConfig['merchantId'])) {
                        $merchantId = $abaConfig['merchantId'];
                    }

                    if (!empty($abaValues['apiKey'])) {
                        $apiKey = $abaValues['apiKey'];
                    } elseif (!empty($abaConfig['apiKey'])) {
                        $apiKey = $abaConfig['apiKey'];
                    }

                    $rawUrl = $abaValues['apiUrl'] ?? $abaConfig['apiUrl'] ?? null;
                    if (!empty($rawUrl)) {
                        $url = trim($rawUrl);
                        if (!str_contains($url, '/payments/check-transaction') && !str_contains($url, '/payments/purchase')) {
                            $url = rtrim($url, '/') . '/api/payment-gateway/v1/payments/check-transaction';
                        } else {
                            $url = str_replace('/payments/purchase', '/payments/check-transaction', $url);
                        }
                        $apiUrl = $url;
                    }
                }
            }

            $req_time = date('YmdHis');
            $postFields = [
                'req_time' => $req_time,
                'merchant_id' => $merchantId,
                'tran_id' => $request->transaction_id,
            ];

            // Correct PayWay check-transaction hash sequence:
            // req_time + merchant_id + tran_id
            $hashStr = $req_time . $merchantId . $request->transaction_id;
            $postFields['hash'] = base64_encode(hash_hmac('sha512', $hashStr, $apiKey, true));

            Log::info('[PayWay] Checking transaction: ' . $apiUrl, $postFields);

            // Connect server-to-server (bypass SSL verification on local/sandbox to avoid cURL cert issues)
            $httpClient = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ]);
            if (!app()->isProduction() || str_contains($apiUrl, 'sandbox')) {
                $httpClient = $httpClient->withoutVerifying();
            }

            // MOCK MODE FALLBACK: If merchantId is sandbox prefix 'ec', url contains sandbox, or is custom PayWay link
            $isSandbox = str_contains($apiUrl, 'sandbox') || str_starts_with($merchantId, 'ec') || str_contains($apiUrl, 'link.payway.com.kh');
            if ($isSandbox && $request->input('real') !== 'true' && $request->input('real') !== 1 && $request->input('real') !== '1') {
                $mockResData = [
                    'status' => 0,
                    'description' => 'Success',
                    'amount' => $txn ? $txn->amount : $request->input('amount', 0),
                    'tran_id' => $request->transaction_id,
                ];

                // Only complete payment if user clicked "Confirm Sandbox Payment" (confirm parameter is true)
                if ($request->input('confirm') === true || $request->input('confirm') === 'true' || $request->input('confirm') == 1) {
                    if ($txn) {
                        $txn->update([
                            'status' => 'success',
                            'raw_response' => json_encode($mockResData),
                        ]);

                        if ($order) {
                            $order->update([
                                'payment_status' => 'Paid',
                            ]);
                        }
                    }

                    return response()->json([
                        'success' => true,
                        'payment_status' => 'Paid',
                        'message' => 'Payment completed successfully (Mock Mode)!',
                        'raw' => $mockResData,
                    ]);
                }

                // Background polling check returns pending
                return response()->json([
                    'success' => true,
                    'payment_status' => 'Unpaid',
                    'message' => 'Payment is still pending (Mock Mode).',
                    'raw' => $mockResData,
                ]);
            }

            $response = $httpClient->post($apiUrl, $postFields);

            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to connect to PayWay Check-Transaction API: Status ' . $response->status(),
                ], 502);
            }

            $resData = $response->json();
            Log::info('[PayWay] Check Response: ', $resData ?? []);

            if (isset($resData['status'])) {
                $statusVal = (int)$resData['status'];
                if ($statusVal === 0) {
                    // Paid
                    if ($txn) {
                        $txn->update([
                            'status' => 'success',
                            'raw_response' => json_encode($resData),
                        ]);

                        if ($order) {
                            $order->update([
                                'payment_status' => 'Paid',
                            ]);
                        }
                    }

                    return response()->json([
                        'success' => true,
                        'payment_status' => 'Paid',
                        'message' => 'Payment completed successfully!',
                        'raw' => $resData,
                    ]);
                } else if (
                    $statusVal === 1 || 
                    $statusVal === 2 || 
                    strtolower($resData['description'] ?? '') === 'pending' || 
                    strtolower($resData['payment_status'] ?? '') === 'pending'
                ) {
                    // Pending
                    return response()->json([
                        'success' => true,
                        'payment_status' => 'Unpaid',
                        'message' => 'Payment is still pending.',
                        'raw' => $resData,
                    ]);
                } else {
                    // Failed
                    if ($txn) {
                        $txn->update([
                            'status' => 'failed',
                            'raw_response' => json_encode($resData),
                        ]);
                    }
                    
                    return response()->json([
                        'success' => true,
                        'payment_status' => 'Failed',
                        'message' => $resData['description'] ?? 'Payment failed.',
                        'raw' => $resData,
                    ]);
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'PayWay returned invalid response format.',
                'raw' => $resData,
            ], 400);

        } catch (\Exception $e) {
            Log::error('[PayWay] Check Transaction Exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Internal Server Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Safely truncate a UTF-8 string to a maximum number of bytes.
     */
    private function truncateUtf8($string, $maxBytes)
    {
        $string = $this->sanitizeKhqrString($string);
        if (strlen($string) <= $maxBytes) {
            return $string;
        }
        return mb_strcut($string, 0, $maxBytes, 'UTF-8');
    }

    /**
     * Sanitize strings for KHQR (remove special characters and non-ASCII for better compatibility).
     */
    private function sanitizeKhqrString($string)
    {
        // Remove special characters that might break EMVCo
        $string = str_replace(['"', "'", '&', '<', '>', '@', '#', '$', '%', '*', '^', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ';', ':', ',', '?', '/'], '', $string);
        // Replace multiple spaces with single space
        $string = preg_replace('/\s+/', ' ', $string);
        // Trim whitespace
        return trim($string);
    }

    /**
     * Format tag, length, value into EMVCo format.
     */
    private function formatTLV($tag, $value)
    {
        $value = (string)$value;
        $len = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
        return $tag . $len . $value;
    }

    /**
     * Calculate CRC16 CCITT checksum.
     */
    private function calculateCRC16($str)
    {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($str); $i++) {
            $x = (($crc >> 8) ^ ord($str[$i])) & 0xFF;
            $x ^= $x >> 4;
            $crc = (($crc << 8) ^ ($x << 12) ^ ($x << 5) ^ $x) & 0xFFFF;
        }
        return sprintf('%04X', $crc);
    }
}
