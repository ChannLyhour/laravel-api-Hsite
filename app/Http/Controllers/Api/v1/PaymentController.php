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
use App\payment_config\khqrConfig;

class PaymentController extends Controller
{
    /**
     * Generate PayWay KHQR for checking out.
     */
    public function generateQr (Request $request)
    {
        return khqrConfig::generate($request);
    }

    /**
     * Check transaction status on PayWay Sandbox.
     */
    public function checkTransaction (Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|string',
            'store_id' => 'nullable|integer',
            'payment_method' => 'nullable|string',
            'md5' => 'nullable|string',
        ]);

        try {
            // KHPay status verification check
            if (str_starts_with($request->transaction_id, 'bk_') || str_starts_with($request->transaction_id, 'txn_')) {
                $khpayCheck = \App\Helpers\KHPayHelper::checkPaymentStatus($request->transaction_id);
                if ($khpayCheck && (!empty($khpayCheck['paid']) || (isset($khpayCheck['status']) && strtolower($khpayCheck['status']) === 'success'))) {
                    $txn = PaymentTransaction::where('transaction_id', $request->transaction_id)->first();
                    if ($txn) {
                        $txn->update(['status' => 'success', 'raw_response' => json_encode($khpayCheck)]);
                        if ($txn->order) {
                            $txn->order->update(['payment_status' => 'Paid']);
                            try {
                                \Illuminate\Support\Facades\Cache::forget("telegram_sent_order_{$txn->order->id}");
                                \App\Helpers\TelegramHelper::sendOrderNotification($txn->order);
                                \App\Helpers\SendStatusTelegramboToCustomers::sendStatus($txn->order, 'PAID');
                            } catch (\Throwable $e) {
                                Log::error("Failed sending Telegram payment update: " . $e->getMessage());
                            }
                        }
                    }

                    $customerToken = null;
                    if ($txn && $txn->order && $txn->order->user_id) {
                        $user = \App\Models\User::find($txn->order->user_id);
                        if ($user) {
                            $customerToken = $user->createToken('customer_auth_token')->plainTextToken;
                        }
                    }

                    return response()->json([
                        'success' => true,
                        'payment_status' => 'Paid',
                        'customer_token' => $customerToken,
                        'message' => 'Payment verified via KHPay API!',
                        'raw' => $khpayCheck
                    ]);
                }
            }

            $txn = PaymentTransaction::where('transaction_id', $request->transaction_id)->first();
            $order = null;

            if ($txn) {
                if ($txn->isExpired()) {
                    $txn->update(['status' => 'expired']);
                    return response()->json([
                        'success' => false,
                        'status' => 'EXPIRED',
                        'payment_status' => 'Expired',
                        'message' => 'Transaction has expired. Please generate a fresh KHQR Code.'
                    ], 400);
                }

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

            // Handle Bakong / ABA KHQR verification (supports Bakong, ABA KHQR, and any KHQR with MD5)
            $isBakongOrKhqr = ($paymentMethod === 'bakong' || $paymentMethod === 'aba' || $paymentMethod === 'aba_pay' || !empty($md5));

            if ($isBakongOrKhqr) {
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
                    if ($wantsConfirm || $md5 === 'mock_success' || $request->transaction_id === 'mock_success') {
                        $mockResData = [
                            'status' => ['code' => 0, 'errorCode' => null, 'message' => null],
                            'data' => [
                                'hash' => $md5,
                                'amount' => $txn ? (float) $txn->amount : 0.0,
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
                                try {
                                    \Illuminate\Support\Facades\Cache::forget("telegram_sent_order_{$order->id}");
                                    \App\Helpers\TelegramHelper::sendOrderNotification($order);
                                    \App\Helpers\SendStatusTelegramboToCustomers::sendStatus($order, 'PAID');
                                } catch (\Throwable $e) {
                                    Log::error("Failed sending Telegram payment update: " . $e->getMessage());
                                }
                            }
                        }

                        $customerToken = null;
                        if ($order && $order->user_id) {
                            $user = \App\Models\User::find($order->user_id);
                            if ($user) {
                                $customerToken = $user->createToken('customer_auth_token')->plainTextToken;
                            }
                        }

                        return response()->json([
                            'success' => true,
                            'payment_status' => 'Paid',
                            'customer_token' => $customerToken,
                            'message' => 'Payment completed successfully (Local Mock)!',
                            'raw' => $mockResData,
                        ]);
                    }
                }

                // 1. If we have a token or MD5, attempt a real API check via Bakong NBC Open API
                if (!empty($md5) && (!empty($apiKey) || env('APP_ENV') !== 'local')) {
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

                        Log::info('[KHQR Check Transaction] Response received', [
                            'transaction_id' => $request->transaction_id,
                            'payment_method' => $paymentMethod,
                            'status' => $response->status(),
                            'body' => $response->json()
                        ]);

                        if ($response->successful()) {
                            $resData = $response->json();
                            $code = isset($resData['status']['code']) ? (int) $resData['status']['code'] : (isset($resData['responseCode']) ? (int) $resData['responseCode'] : -1);
                            $dataField = $resData['data'] ?? [];
                            $statusVal = $dataField['status'] ?? '';

                            if ($code === 0 && (empty($statusVal) || strtolower($statusVal) === 'success' || $statusVal === 'SUCCESS')) {
                                if ($txn) {
                                    $txn->update([
                                        'status' => 'success',
                                        'raw_response' => json_encode($resData),
                                    ]);
                                    if ($order) {
                                        $order->update(['payment_status' => 'Paid']);
                                        try {
                                            \Illuminate\Support\Facades\Cache::forget("telegram_sent_order_{$order->id}");
                                            \App\Helpers\TelegramHelper::sendOrderNotification($order);
                                            \App\Helpers\SendStatusTelegramboToCustomers::sendStatus($order, 'PAID');
                                        } catch (\Throwable $e) {
                                            Log::error("Failed sending Telegram payment update: " . $e->getMessage());
                                        }
                                    }
                                }

                                 $customerToken = null;
                                 if ($order && $order->user_id) {
                                     $user = \App\Models\User::find($order->user_id);
                                     if ($user) {
                                         $customerToken = $user->createToken('customer_auth_token')->plainTextToken;
                                     }
                                 }

                                 return response()->json([
                                     'success' => true,
                                     'payment_status' => 'Paid',
                                     'customer_token' => $customerToken,
                                     'message' => 'KHQR payment completed successfully!',
                                     'raw' => $resData,
                                 ]);
                            }
                        }
                    } catch (\Exception $e) {
                        Log::error('[KHQR checkTransaction] Real API call exception: ' . $e->getMessage());
                    }
                }

                // If payment method is strictly Bakong and not confirmed, return pending here
                if ($paymentMethod === 'bakong') {
                    if ($wantsConfirm) {
                        if ($txn) {
                            $txn->update(['status' => 'success']);
                            if ($order) {
                                $order->update(['payment_status' => 'Paid']);
                                try {
                                    \Illuminate\Support\Facades\Cache::forget("telegram_sent_order_{$order->id}");
                                    \App\Helpers\TelegramHelper::sendOrderNotification($order);
                                    \App\Helpers\SendStatusTelegramboToCustomers::sendStatus($order, 'PAID');
                                } catch (\Throwable $e) {
                                    Log::error("Failed sending Telegram payment update: " . $e->getMessage());
                                }
                            }
                        }

                        $customerToken = null;
                        if ($order && $order->user_id) {
                            $user = \App\Models\User::find($order->user_id);
                            if ($user) {
                                $customerToken = $user->createToken('customer_auth_token')->plainTextToken;
                            }
                        }

                        return response()->json([
                            'success' => true,
                            'payment_status' => 'Paid',
                            'customer_token' => $customerToken,
                            'message' => 'Bakong payment completed successfully (Mock Mode)!',
                        ]);
                    }

                    return response()->json([
                        'success' => true,
                        'payment_status' => 'Unpaid',
                        'message' => 'Bakong payment is still pending.',
                    ]);
                }
            }

            // Load store API credentials
            $merchantId = 'ec454848';
            $apiKey = 'ec454848b598b9e6e00ea3535cf04b122f87a875';
            $apiUrl = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction';
            $isPaywayLinkMode = false;

            $paymentMethodsRow = Store::where('created_by', $ownerId)
                ->where('key', 'payment_methods')
                ->first();

            if ($paymentMethodsRow) {
                $methods = json_decode($paymentMethodsRow->value, true) ?: [];
                if (isset($methods['aba'])) {
                    $abaConfig = $methods['aba'];
                    $abaValues = $abaConfig['values'] ?? [];

                    // ── NEW: Check for PayWay Link-based config ──────────
                    $paywayLink = !empty($abaValues['payway_link']) ? $abaValues['payway_link'] : 'https://link.payway.com.kh/ABAPAYvu485790W';
                    if (!empty($paywayLink) && str_contains($paywayLink, 'link.payway.com.kh')) {
                        $isPaywayLinkMode = true;
                    }

                    // ── Legacy: API credential-based config ──────────
                    if (!$isPaywayLinkMode) {
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
            }

            // ── PayWay Link mode: use confirm-based flow ──────────
            if ($isPaywayLinkMode) {
                $wantsConfirm = $request->input('confirm') === true || $request->input('confirm') === 'true' || $request->input('confirm') == 1;

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
                        'message' => 'Payment completed successfully!',
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'payment_status' => 'Unpaid',
                    'message' => 'Payment is still pending. Please confirm after paying via ABA.',
                ]);
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
                $statusVal = (int) $resData['status'];
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
    private function truncateUtf8 ($string, $maxBytes)
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
    private function sanitizeKhqrString ($string)
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
    private function formatTLV ($tag, $value)
    {
        $value = (string) $value;
        $len = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
        return $tag . $len . $value;
    }

    /**
     * Calculate CRC16 CCITT checksum.
     */
    private function calculateCRC16 ($str)
    {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($str); $i++) {
            $x = (($crc >> 8) ^ ord($str[$i])) & 0xFF;
            $x ^= $x >> 4;
            $crc = (($crc << 8) ^ ($x << 12) ^ ($x << 5) ^ $x) & 0xFFFF;
        }
        return sprintf('%04X', $crc);
    }

    /**
     * Get active payment methods for a specific owner/store.
     */
    public function getActiveMethods (Request $request)
    {
        $ownerId = $request->query('owner_id');
        if (!$ownerId) {
            return response()->json(['detail' => 'owner_id is required.'], 400);
        }

        $realOwnerId = $ownerId;
        if (!is_numeric($realOwnerId)) {
            $decoded = \Vinkla\Hashids\Facades\Hashids::decode($ownerId);
            $realOwnerId = !empty($decoded) ? $decoded[0] : null;
        }

        if (!$realOwnerId) {
            return response()->json([]);
        }

        $paymentMethodsRow = Store::where('created_by', $realOwnerId)
            ->where('key', 'payment_methods')
            ->first();

        $settings = [];
        if ($paymentMethodsRow) {
            $settings = json_decode($paymentMethodsRow->value, true) ?: [];
        }

        $methodsBase = [
            [
                'key' => 'aba',
                'logo' => asset('build/assets/bank/aba-pay-way.png'),
                'name' => 'ABA PAY',
                'desc' => 'Scan to pay with ABA Mobile',
            ],
            [
                'key' => 'bakong',
                'logo' => asset('build/assets/bank/bakong-khqr.png'),
                'name' => 'Bakong KHQR',
                'desc' => 'Scan to pay with Bakong App or any KHQR supported bank',
            ],
            [
                'key' => 'acleda',
                'logo' => asset('build/assets/bank/acleda.png'),
                'name' => 'ACLEDA PAY',
                'desc' => 'Pay securely with ACLEDA.',
            ],
            [
                'key' => 'cod',
                'logo' => 'emoji:💵',
                'name' => 'Cash on Delivery',
                'desc' => 'បង់ប្រាក់នៅពេលទទួលបានទំនិញ',
            ]
        ];

        $activeMethods = [];
        foreach ($methodsBase as $p) {
            $key = $p['key'];
            $config = $settings[$key] ?? null;
            $enabled = false;

            if ($config) {
                $enabled = filter_var($config['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
            } else {
                $legacyRow = Store::where('created_by', $realOwnerId)
                    ->where('key', 'payment_gw_' . $key)
                    ->first();
                if ($legacyRow) {
                    $parsed = json_decode($legacyRow->value, true);
                    $enabled = filter_var($parsed['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
                } else {
                    $enabled = ($key === 'cod' || $key === 'transfer');
                }
            }

            if ($enabled) {
                $activeMethods[] = $p;
            }
        }

        return response()->json($activeMethods);
    }
}
