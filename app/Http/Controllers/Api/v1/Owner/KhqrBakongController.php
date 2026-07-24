<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use App\Helpers\CustomKHQR;

class KhqrBakongController extends Controller
{
    /**
     * Generate Bakong KHQR code.
     */
    public function generateQr(Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        // Defaults
        $bakongAccountId = '';
        $bakongMerchantName = '';
        $bakongMerchantCity = '';

        // Load store payment configuration
        $storeId = $request->input('store_id');
        if ($storeId && (int)$storeId !== $user->id) {
            return response()->json(['detail' => 'You are not authorized to access this store.'], 403);
        }

        $paymentMethodsRow = Store::where('created_by', $user->id)
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

        // Custom override via request
        if ($request->filled('bakong_account_id')) {
            $bakongAccountId = $request->input('bakong_account_id');
        }
        if ($request->filled('merchant_name')) {
            $bakongMerchantName = $request->input('merchant_name');
        }
        if ($request->filled('merchant_city')) {
            $bakongMerchantCity = $request->input('merchant_city');
        }

        $bakongAccountId = trim($bakongAccountId);
        $bakongMerchantName = trim($bakongMerchantName);
        $bakongMerchantCity = trim($bakongMerchantCity);

        if (empty($bakongAccountId) || empty($bakongMerchantName) || empty($bakongMerchantCity)) {
            return response()->json([
                'success' => false,
                'message' => 'Bakong KHQR payment is not configured yet for this store profile.'
            ], 400);
        }

        // Normalize Bakong ID (usually lowercase)
        $bakongAccountId = strtolower($bakongAccountId);

        $amount = 0;
        $currency = 'USD';
        $billNo = 'TXN' . time();

        if ($request->filled('order_id')) {
            $order = Order::findOrFail($request->input('order_id'));

            // Check authorization: order's store must be owned by user
            if ((int)$order->store_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized order access.'
                ], 403);
            }

            $amount = $order->total_amount;
            $currency = $request->input('currency', 'USD');
            $billNo = 'ORD' . $order->id;
        } else {
            $request->validate([
                'amount' => 'required|numeric|min:0',
                'currency' => 'string|in:USD,KHR',
                'bill_no' => 'string|nullable',
            ]);
            $amount = $request->input('amount');
            $currency = $request->input('currency', 'USD');
            if ($request->filled('bill_no')) {
                $billNo = preg_replace('/[^A-Za-z0-9\-]/', '', $request->input('bill_no'));
            }
        }
        try {
            // Keep exact payment amount for dynamic QR generation
            $currencyCode = ($currency === 'KHR') ? 116 : 840;
            $amountVal = (float)$amount;

            $qrString = CustomKHQR::generate(
                $bakongAccountId,
                $bakongMerchantName,
                $bakongMerchantCity,
                $amountVal,
                $currencyCode,
                $billNo
            );
            $md5 = md5($qrString);

            Log::info('[Bakong KHQR Owner] Generated QR', [
                'user_id' => $user->id,
                'bakong_account_id' => $bakongAccountId,
                'merchant_name' => $bakongMerchantName,
                'amount' => $amountVal,
                'currency' => $currency,
                'bill_no' => $billNo,
                'qr_string' => $qrString
            ]);

            // Fetch API config to attempt real Deeplink generation
            $apiKey = '';
            $apiUrl = '';
            $isSandbox = true;
            
            $paymentMethodsRow = Store::where('created_by', $user->id)
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

            // Force override & normalize API URL based on Sandbox / Production mode
            if ($isSandbox) {
                $apiUrl = 'https://sit-api-bakong.nbc.gov.kh';
            } else {
                $apiUrl = 'https://api-bakong.nbc.gov.kh';
            }

            $deeplink = 'https://bakong.nbc.gov.kh/download';
            if (!empty($apiKey)) {
                try {
                    $apiUrl = rtrim($apiUrl, '/');
                    $httpClient = Http::withHeaders([
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ])->withToken($apiKey);

                    // Always bypass SSL on non-production to resolve cURL error 60
                    if (!app()->isProduction() || $isSandbox || str_contains($apiUrl, 'sandbox') || str_contains($apiUrl, 'local')) {
                        $httpClient = $httpClient->withoutVerifying();
                    }

                    $response = $httpClient->post($apiUrl . '/v1/generate_deeplink_by_qr', [
                        'qr' => $qrString,
                        'appDeepLinkCallback' => $request->getSchemeAndHttpHost(),
                        'appName' => $bakongMerchantName ?: 'Merchant',
                        'appIconUrl' => 'https://bakong.nbc.gov.kh/assets/img/bakong-logo.png'
                    ]);

                    Log::info('[Bakong Deeplink] Response received', [
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
                    Log::error('[Bakong Deeplink] Failed: ' . $e->getMessage());
                }
            }

            // Save or update transaction to database so it can be resolved by checkTransaction (only if order_id is present)
            if ($request->filled('order_id')) {
                \App\Models\PaymentTransaction::updateOrCreate(
                    ['transaction_id' => $billNo],
                    [
                        'order_id' => (int)$request->input('order_id'),
                        'payment_method' => 'bakong',
                        'amount' => $amount,
                        'status' => 'pending',
                        'raw_response' => json_encode([
                            'qr_string' => $qrString,
                            'deeplink' => $deeplink,
                            'md5' => $md5
                        ]),
                    ]
                );
            }

            // Generate QR Image in WebP format (Base64 data:image/webp)
            $base64Qr = CustomKHQR::generateWebpQrBase64($qrString, 300);

            return response()->json([
                'success' => true,
                'qrString' => $qrString,
                'qrImage' => $base64Qr,
                'md5' => $md5,
                'deeplink' => $deeplink,
                'transaction_id' => $billNo,
                'merchant_info' => [
                    'bakong_account_id' => $bakongAccountId,
                    'merchant_name' => $bakongMerchantName,
                    'merchant_city' => $bakongMerchantCity,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('[Bakong KHQR Owner] Generate QR Exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Internal Server Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check transaction status on Bakong.
     */
    public function checkTransaction(Request $request)
    {
        $request->validate([
            'transaction_id' => 'nullable|string',
            'md5' => 'nullable|string',
        ]);

        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        // 1. Resolve MD5 hash
        $md5 = $request->input('md5');
        if (empty($md5) && $request->filled('transaction_id')) {
            $txn = \App\Models\PaymentTransaction::where('transaction_id', $request->input('transaction_id'))->first();
            if ($txn) {
                $rawResponse = json_decode($txn->raw_response, true) ?: [];
                $qrString = $rawResponse['qr_string'] ?? '';
                $md5 = md5($qrString);
            }
        }

        if (empty($md5)) {
            return response()->json([
                'success' => false,
                'message' => 'Could not resolve MD5 hash for check transaction.'
            ], 400);
        }

        // 2. Fetch API token
        $apiKey = '';
        $apiUrl = '';
        $isSandbox = true;

        $storeId = $request->input('store_id');
        if ($storeId && (int)$storeId !== $user->id) {
            return response()->json(['detail' => 'You are not authorized to access this store.'], 403);
        }

        $paymentMethodsRow = Store::where('created_by', $user->id)
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

        // Force override & normalize API URL based on Sandbox / Production mode
        if ($isSandbox) {
            $apiUrl = 'https://sit-api-bakong.nbc.gov.kh';
        } else {
            $apiUrl = 'https://api-bakong.nbc.gov.kh';
        }

        // 3. Handle Sandbox / Mock Confirmation or missing credentials
        $wantsConfirm = $request->input('confirm') === true || $request->input('confirm') === 'true' || $request->input('confirm') == 1;

        // Facilitate mock testing for local environment without active token
        if (env('APP_ENV') === 'local' && (empty($apiKey) || $apiKey === 'your_bakong_token_here' || $md5 === 'mock_success' || $request->transaction_id === 'mock_success')) {
            if ($request->filled('transaction_id')) {
                $txn = \App\Models\PaymentTransaction::where('transaction_id', $request->input('transaction_id'))->first();
                if ($txn) {
                    $txn->update(['status' => 'success']);
                    if ($txn->order) {
                        $txn->order->update(['payment_status' => 'Paid']);
                    }
                }
            }
            return response()->json([
                'success' => true,
                'payment_status' => 'Paid',
                'message' => 'Bakong payment completed successfully (Local Mock)!',
                'raw' => [
                    'status' => ['code' => 0, 'errorCode' => null, 'message' => null],
                    'data' => [
                        'hash' => $md5,
                        'status' => 'SUCCESS'
                    ]
                ]
            ]);
        }

        if ($isSandbox || empty($apiKey) || empty($apiUrl)) {
            if ($wantsConfirm) {
                if ($request->filled('transaction_id')) {
                    $txn = \App\Models\PaymentTransaction::where('transaction_id', $request->input('transaction_id'))->first();
                    if ($txn) {
                        $txn->update(['status' => 'success']);
                        if ($txn->order) {
                            $txn->order->update(['payment_status' => 'Paid']);
                        }
                    }
                }
                return response()->json([
                    'success' => true,
                    'payment_status' => 'Paid',
                    'message' => 'Bakong payment completed successfully (Mock Mode)!',
                ]);
            }

            if (empty($apiKey) || empty($apiUrl)) {
                return response()->json([
                    'success' => true,
                    'payment_status' => 'Unpaid',
                    'message' => 'Bakong payment is still pending (Sandbox Mode / Config not set).',
                ]);
            }
        }

        // 4. Make the API Call to Bakong
        if (empty($apiKey) || empty($apiUrl)) {
            return response()->json([
                'success' => false,
                'message' => 'Bakong API credentials are not configured yet for this store profile.'
            ], 400);
        }

        try {
            $apiUrlToCheck = $apiUrl . '/v1/check_transaction_by_md5';
            $httpClient = Http::timeout(5)->withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->withToken($apiKey);

            if (!app()->isProduction() || !empty($bakongConfig['sandbox']) || str_contains($apiUrl, 'sandbox')) {
                $httpClient = $httpClient->withoutVerifying();
            }

            $response = $httpClient->post($apiUrlToCheck, [
                'md5' => $md5
            ]);

            if ($response->successful()) {
                $resData = $response->json();
                $code = isset($resData['status']['code']) ? (int)$resData['status']['code'] : (isset($resData['responseCode']) ? (int)$resData['responseCode'] : -1);
                $dataField = $resData['data'] ?? [];
                $statusVal = $dataField['status'] ?? '';

                if ($code === 0 && (strtolower($statusVal) === 'success' || $statusVal === 'SUCCESS')) {
                    // Update matching payment transactions
                    if ($request->filled('transaction_id')) {
                        $txn = \App\Models\PaymentTransaction::where('transaction_id', $request->input('transaction_id'))->first();
                        if ($txn) {
                            $txn->update([
                                'status' => 'success',
                                'raw_response' => json_encode($resData),
                            ]);
                            if ($txn->order) {
                                $txn->order->update(['payment_status' => 'Paid']);
                            }
                        }
                    }

                    return response()->json([
                        'success' => true,
                        'payment_status' => 'Paid',
                        'message' => 'Bakong payment completed successfully!',
                        'raw' => $resData,
                    ]);
                }

                // If transaction not found (pending)
                return response()->json([
                    'success' => true,
                    'payment_status' => 'Unpaid',
                    'message' => 'Bakong payment is still pending / transaction not found yet.',
                    'raw' => $resData,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to connect to Bakong API: HTTP ' . $response->status(),
                'raw' => $response->body()
            ], 502);

        } catch (\Exception $e) {
            Log::error('[Bakong checkTransaction Owner] Exception: ' . $e->getMessage());
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
