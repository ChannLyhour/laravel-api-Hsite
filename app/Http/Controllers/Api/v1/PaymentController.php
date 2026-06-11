<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Generate PayWay KHQR for checking out.
     */
    public function generateQr(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'currency' => 'string|in:USD,KHR',
        ]);

        try {
            $order = Order::findOrFail($request->order_id);
            $currency = $request->input('currency', 'USD');
            $ownerId = $order->store_id;

            // Handle Bakong Payment Method
            if ($order->payment_method === 'bakong') {
                $bakongAccountId = 'chann_lyhour@chbl';
                $bakongMerchantName = 'Lyhour Dev';
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

                $tran_id = 'TXN-' . $order->id . '-' . time();

                // Format TLV helpers
                $subtag00 = $this->formatTLV('00', 'bakong');
                $subtag01 = $this->formatTLV('01', $bakongAccountId);
                
                $subtag02 = '';
                if ($order->store && $order->store->created_by) {
                    $subtag02 = $this->formatTLV('02', (string)$order->store->created_by);
                }
                
                $merchantAccountInfo = $subtag00 . $subtag01 . $subtag02;
                
                $isIndividual = str_contains($bakongAccountId, '@');
                $accountTag = $isIndividual ? '29' : '30';
                
                $payload = '';
                $payload .= $this->formatTLV('00', '01');
                $payload .= $this->formatTLV('01', '12'); // dynamic QR
                $payload .= $this->formatTLV($accountTag, $merchantAccountInfo);
                $payload .= $this->formatTLV('52', '5999');
                
                $currencyCode = $currency === 'KHR' ? '116' : '840';
                $payload .= $this->formatTLV('53', $currencyCode);
                
                $amountVal = $currency === 'KHR'
                    ? (string)round($order->total_amount)
                    : number_format((float)$order->total_amount, 2, '.', '');
                $payload .= $this->formatTLV('54', $amountVal);
                
                $payload .= $this->formatTLV('58', 'KH');
                $payload .= $this->formatTLV('59', substr($bakongMerchantName, 0, 25));
                $payload .= $this->formatTLV('60', substr($bakongMerchantCity, 0, 15));
                
                $billNo = 'ORD-' . $order->id;
                $subtag62_01 = $this->formatTLV('01', $billNo);
                $payload .= $this->formatTLV('62', $subtag62_01);
                
                $payload .= '6304';
                $crc = $this->calculateCRC16($payload);
                $qrString = $payload . $crc;

                PaymentTransaction::create([
                    'order_id' => $order->id,
                    'transaction_id' => $tran_id,
                    'payment_method' => 'bakong',
                    'amount' => $order->total_amount,
                    'status' => 'pending',
                    'raw_response' => json_encode(['qr_string' => $qrString]),
                ]);

                return response()->json([
                    'success' => true,
                    'qrString' => $qrString,
                    'qrImage' => '',
                    'abapay_deeplink' => 'https://bakong.nbc.org.kh/download',
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
                        if (!str_contains($url, '/payments/generate-qr') && !str_contains($url, '/payments/purchase')) {
                            $url = rtrim($url, '/') . '/api/payment-gateway/v1/payments/generate-qr';
                        } else {
                            $url = str_replace('/payments/purchase', '/payments/generate-qr', $url);
                        }
                        $apiUrl = $url;
                    }
                }
            }

            // Generate payload details
            $req_time = date('YmdHis');
            $tran_id = 'TXN-' . $order->id . '-' . time();
            $amount = $currency === 'KHR'
                ? (string)round($order->total_amount)
                : number_format((float)$order->total_amount, 2, '.', '');
            $purchase_type = 'purchase';
            $payment_option = 'abapay_khqr';

            $names = explode(' ', trim($order->customer_name ?: 'Guest User'));
            $first_name = $names[0];
            $last_name = isset($names[1]) ? implode(' ', array_slice($names, 1)) : 'User';

            $email = $order->customer_email ?: 'customer@example.com';
            $phone = $order->customer_phone ?: '012345678';

            $itemsList = [];
            foreach ($order->items as $item) {
                $itemsList[] = [
                    'name' => $item->name ?: ($item->productVariant->product->name ?? 'Product'),
                    'quantity' => (int)$item->quantity,
                    'price' => (float)number_format((float)$item->price, 2, '.', ''),
                ];
            }
            if (empty($itemsList)) {
                $itemsList[] = [
                    'name' => 'Order Item',
                    'quantity' => 1,
                    'price' => (float)$amount,
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
                . $amount 
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
                'amount' => $amount,
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
            $requestChain = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ]);
            if (app()->environment('local') || str_contains($apiUrl, 'sandbox')) {
                $requestChain = $requestChain->withoutVerifying();
            }

            // MOCK MODE FALLBACK: If merchantId is the sandbox fallback 'ec454848', bypass real API call
            if ($merchantId === 'ec454848' && $request->input('real') !== 'true' && $request->input('real') !== 1 && $request->input('real') !== '1') {
                $mockResData = [
                    'status' => 0,
                    'description' => 'Success',
                    'qrString' => 'mock_khqr_string_for_testing_' . $tran_id,
                    'qrImage' => 'iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABNUlEQVRIid2VQa6EIBBEm7hgyRG8CV6MRBMvNt6EI7hkYeypAsc/fztDL/4n0cAzsUJT1Yj8lzGp6hHDmv0pM+bFgEU8KcqARTgwN2FB9wTxrKekUbMZo3iZ9LBls5ZpT5aMB6VnuHVZ0xd7r/M3TMKq/odVb1xM3/3yDXMs3eP2Wh0X+zU+ZG6fWZ8h4//L6LfdgFUL4DXia5LiLBh1EckkVdeI6Uqbze3MMbNg0MXBr6ob/byZMFigOGxMJCytnN0ZE88NZt3wAZU0YJFVq70Y+chNtzdjJKG7wGZ4XcHpzOoyhmqzgeIGDJGELpaFF4sNaz2MvRg+uLzWm9W+64gnmqHqdmft/likhrNEMyZBs+ce/cOM8VrkHi0ZfSDTPmjrYa2mnRmDw3Bqc999X3Zlf308AcW4PkVW/y6nAAAAAElFTkSuQmCC',
                    'abapay_deeplink' => 'http://localhost:3000/mock-payway-deeplink',
                ];

                PaymentTransaction::create([
                    'order_id' => $order->id,
                    'transaction_id' => $tran_id,
                    'payment_method' => 'aba_pay',
                    'amount' => $order->total_amount,
                    'status' => 'pending',
                    'raw_response' => json_encode($mockResData),
                ]);

                return response()->json([
                    'success' => true,
                    'qrString' => $mockResData['qrString'],
                    'qrImage' => $mockResData['qrImage'],
                    'abapay_deeplink' => $mockResData['abapay_deeplink'],
                    'transaction_id' => $tran_id,
                ]);
            }

            $response = $requestChain->post($apiUrl, $postFields);

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
                // Record the pending transaction log
                PaymentTransaction::create([
                    'order_id' => $order->id,
                    'transaction_id' => $tran_id,
                    'payment_method' => 'aba_pay',
                    'amount' => $order->total_amount,
                    'status' => 'pending',
                    'raw_response' => json_encode($resData),
                ]);

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
        ]);

        try {
            $txn = PaymentTransaction::where('transaction_id', $request->transaction_id)->firstOrFail();
            $order = $txn->order;
            $ownerId = $order->store_id;

            // Handle Bakong verification (Mock sandbox check)
            if ($txn->payment_method === 'bakong') {
                $wantsConfirm = $request->input('confirm') === true || $request->input('confirm') === 'true' || $request->input('confirm') == 1;
                
                if ($wantsConfirm) {
                    $txn->update(['status' => 'success']);
                    $order->update(['payment_status' => 'Paid']);
                    
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
                'tran_id' => $txn->transaction_id,
            ];

            // Correct PayWay check-transaction hash sequence:
            // req_time + merchant_id + tran_id
            $hashStr = $req_time . $merchantId . $txn->transaction_id;
            $postFields['hash'] = base64_encode(hash_hmac('sha512', $hashStr, $apiKey, true));

            Log::info('[PayWay] Checking transaction: ' . $apiUrl, $postFields);

            // Connect server-to-server (bypass SSL verification on local/sandbox to avoid cURL cert issues)
            $requestChain = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ]);
            if (app()->environment('local') || str_contains($apiUrl, 'sandbox')) {
                $requestChain = $requestChain->withoutVerifying();
            }

            // MOCK MODE FALLBACK: If merchantId is the sandbox fallback 'ec454848', or sandbox mode when confirming
            $isSandbox = str_contains($apiUrl, 'sandbox');
            $wantsConfirm = $request->input('confirm') === true || $request->input('confirm') === 'true' || $request->input('confirm') == 1;

            if (($merchantId === 'ec454848' || ($isSandbox && $wantsConfirm)) && $request->input('real') !== 'true' && $request->input('real') !== 1 && $request->input('real') !== '1') {
                $mockResData = [
                    'status' => 0,
                    'description' => 'Success',
                    'amount' => $txn->amount,
                    'tran_id' => $txn->transaction_id,
                ];

                // Only complete payment if user clicked "Confirm Sandbox Payment" (confirm parameter is true)
                if ($request->input('confirm') === true || $request->input('confirm') === 'true' || $request->input('confirm') == 1) {
                    $txn->update([
                        'status' => 'success',
                        'raw_response' => json_encode($mockResData),
                    ]);

                    $order->update([
                        'payment_status' => 'Paid',
                    ]);

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

            $response = $requestChain->post($apiUrl, $postFields);

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
                    $txn->update([
                        'status' => 'success',
                        'raw_response' => json_encode($resData),
                    ]);

                    $order->update([
                        'payment_status' => 'Paid',
                    ]);

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
                    $txn->update([
                        'status' => 'failed',
                        'raw_response' => json_encode($resData),
                    ]);
                    
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
     * Format tag, length, value into EMVCo format.
     */
    private function formatTLV($tag, $value)
    {
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
