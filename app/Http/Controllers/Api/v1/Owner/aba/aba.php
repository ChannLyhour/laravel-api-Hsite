<?php

namespace App\Http\Controllers\Api\v1\Owner\aba;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class aba extends Controller
{
    /**
     * ABA PayWay Sandbox Credentials
     */
    protected const SANDBOX_MERCHANT_ID = 'ec477316';
    protected const SANDBOX_API_KEY = '8c5b65561de1d1664859d7621fa3ca8d6c99a707';

    protected const SANDBOX_RSA_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCBvY2V540AhkdkxTPoTns+svUy\n5c9ZfNUCzGpCFoqRRu+JpXR3uz/9TcduyeICerVKBtDpA2W4th0rhIkKLo+lLXrK\n8IMH3/9RaMmEMiGviA2O5JvYbMcUnbGEHj78UQKLGWkSApix9EvTVOWwtelviq+V\nYUrp7BTYB4nhAE88CwIDAQAB\n-----END PUBLIC KEY-----";

    protected const SANDBOX_RSA_PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQD7Spia4Xuv2uFGUc4uFFU5Gt6E0DTc2D3RxRaT7NLEPUMelKOa\njnqNNBy6inaNDn646zceQMWDZ9MKMuJnBO4nDhErxlzEsUTb00H61ofPINztpl15\nsizIh5UDPvD3vi7EN2DNUF7jWjsTcTrrgmmlob8Vbewx6Hg/dKhm/7ii2QIDAQAB\nAoGAICBEy0Q5dl2CwGUz+UMjNBZBzXP61iMVICzUupujxG/alV3GXruJYmT/qT+L\ncXQhck2r8cOxHKAY5Gxl8mq4cWfqD4kyk2lrSjBOJQTDziLPK8fh/D92irg78x2j\nx89UxM1pyMY4dcOVOoHdZPlmGYytf6dCIY5dFRC8sRRlN5sCQQD/BvswGh3/jzoq\nVITqDtFgLc2uGNcL9dxYo+oZbApWChxr28Oa9XrvKvLY1ss2k+LbSAjB2Kd3Wvx/\nyd1xx22jAkEA/D/3kIcqgYjKJDwkwjyOwqU832OBrsLLhw40tDI32WQBgy3zwVIg\nO23N6YgEaAjRnb/1G1ytq9XrURcB59L9UwJBAOy/5mB5Xm/o3u59GAbRSr4mx1Jf\n7QNFcxE22hRPoCjPqiLXGXe5fC6biGaUwIIiN++pp7eNEapT5SQcml8N7FECQB+4\nJ3hMFuM9ATY3PeQS21zMjHAGwjrokdFEzwnNusoiUjJdp+YqXpU6hIcWLH+shDdS\n+Q5cxBX0i2eh/gJZvLMCQD405Yyyn/nNz1M0xIPMW18jJf8mGnIyjgJCNqJ9aWoE\nx+G4WPF98RWciMoAJ+ZsHM46neEOiXAktuqEMTEwA/c=\n-----END RSA PRIVATE KEY-----";

    protected const SANDBOX_PURCHASE_URL = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';
    protected const SANDBOX_CHECK_TRANSACTION_URL = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction';

    /**
     * Get store ABA config or fallback to sandbox credentials.
     */
    protected function getAbaConfig(?int $ownerId = null): array
    {
        $merchantId = config('aba.merchant_id', self::SANDBOX_MERCHANT_ID);
        $apiKey = config('aba.api_key', self::SANDBOX_API_KEY);
        $purchaseUrl = config('aba.purchase_url', self::SANDBOX_PURCHASE_URL);
        $checkUrl = config('aba.check_url', self::SANDBOX_CHECK_TRANSACTION_URL);
        $rsaPublicKey = config('aba.rsa_public_key', self::SANDBOX_RSA_PUBLIC_KEY);
        $rsaPrivateKey = config('aba.rsa_private_key', self::SANDBOX_RSA_PRIVATE_KEY);

        if ($ownerId) {
            $paymentRow = Store::where('created_by', $ownerId)
                ->where('key', 'payment_methods')
                ->first();

            if ($paymentRow) {
                $methods = json_decode($paymentRow->value, true) ?: [];
                if (!empty($methods['aba']['values'])) {
                    $vals = $methods['aba']['values'];
                    if (!empty($vals['merchantId'])) {
                        $merchantId = $vals['merchantId'];
                    }
                    if (!empty($vals['apiKey'])) {
                        $apiKey = $vals['apiKey'];
                    }
                }
            }
        }

        return [
            'merchant_id' => $merchantId ?: self::SANDBOX_MERCHANT_ID,
            'api_key' => $apiKey ?: self::SANDBOX_API_KEY,
            'purchase_url' => $purchaseUrl,
            'check_url' => $checkUrl,
            'rsa_public_key' => $rsaPublicKey,
            'rsa_private_key' => $rsaPrivateKey,
        ];
    }

    /**
     * Generate HMAC SHA512 Hash for ABA PayWay Purchase API v2
     */
    public static function generatePurchaseHash(
        string $req_time,
        string $merchant_id,
        string $tran_id,
        string $amount,
        string $items = '',
        string $shipping = '',
        string $firstName = '',
        string $lastName = '',
        string $email = '',
        string $phone = '',
        string $type = 'purchase',
        string $payment_option = '',
        string $return_url = '',
        string $cancel_url = '',
        string $continue_success_url = '',
        string $return_deeplink = '',
        string $currency = 'USD',
        string $custom_fields = '',
        ?string $api_key = null
    ): string {
        $api_key = $api_key ?: self::SANDBOX_API_KEY;

        $str = $req_time
            . $merchant_id
            . $tran_id
            . $amount
            . $items
            . $shipping
            . $firstName
            . $lastName
            . $email
            . $phone
            . $type
            . $payment_option
            . $return_url
            . $cancel_url
            . $continue_success_url
            . $return_deeplink
            . $currency
            . $custom_fields;

        return base64_encode(hash_hmac('sha512', $str, $api_key, true));
    }

    /**
     * Generate HMAC SHA512 Hash for ABA PayWay Check Transaction API v2
     */
    public static function generateCheckHash(
        string $req_time,
        string $merchant_id,
        string $tran_id,
        ?string $api_key = null
    ): string {
        $api_key = $api_key ?: self::SANDBOX_API_KEY;
        $str = $req_time . $merchant_id . $tran_id;
        return base64_encode(hash_hmac('sha512', $str, $api_key, true));
    }

    /**
     * Encrypt string using ABA PayWay RSA Public Key
     */
    public static function encryptRsa(string $data, ?string $publicKey = null): ?string
    {
        $key = $publicKey ?: self::SANDBOX_RSA_PUBLIC_KEY;
        $pubKeyResource = openssl_pkey_get_public($key);
        if (!$pubKeyResource) {
            return null;
        }

        $encrypted = '';
        if (openssl_public_encrypt($data, $encrypted, $pubKeyResource)) {
            return base64_encode($encrypted);
        }

        return null;
    }

    /**
     * Decrypt string using ABA PayWay RSA Private Key
     */
    public static function decryptRsa(string $encryptedData, ?string $privateKey = null): ?string
    {
        $key = $privateKey ?: self::SANDBOX_RSA_PRIVATE_KEY;
        $privKeyResource = openssl_pkey_get_private($key);
        if (!$privKeyResource) {
            return null;
        }

        $decrypted = '';
        if (openssl_private_decrypt(base64_decode($encryptedData), $decrypted, $privKeyResource)) {
            return $decrypted;
        }

        return null;
    }

    /**
     * Create ABA PayWay Sandbox Purchase Request payload & hash
     */
    public function createPurchase(Request $request)
    {
        $request->validate([
            'order_id' => 'nullable|integer',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'nullable|string|in:USD,KHR',
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'payment_option' => 'nullable|string',
            'return_url' => 'nullable|string|url',
            'continue_success_url' => 'nullable|string|url',
        ]);

        try {
            $user = $request->user();
            $ownerId = $user ? $user->id : 1;

            $config = $this->getAbaConfig($ownerId);

            $reqTime = date('YmdHis');
            $orderId = $request->input('order_id');
            $tranId = 'TXN-' . ($orderId ?: 'SANDBOX') . '-' . time();

            $amountFormatted = number_format((float)$request->input('amount'), 2, '.', '');
            $currency = strtoupper($request->input('currency', 'USD'));
            $paymentOption = $request->input('payment_option', 'abapay');

            $firstName = $request->input('first_name', 'Customer');
            $lastName = $request->input('last_name', 'User');
            $email = $request->input('email', 'customer@example.com');
            $phone = $request->input('phone', '012345678');

            $items = base64_encode(json_encode([
                ['name' => 'Order Payment #' . ($orderId ?: $tranId), 'quantity' => '1', 'price' => $amountFormatted]
            ]));

            $shipping = '0.00';
            $type = 'purchase';
            $returnUrl = $request->input('return_url', url('/api/v1/payment/aba/callback'));
            $cancelUrl = $request->input('cancel_url', url('/checkout'));
            $continueSuccessUrl = $request->input('continue_success_url', url('/checkout/success'));
            $returnDeeplink = '';
            $customFields = '';

            $hash = self::generatePurchaseHash(
                $reqTime,
                $config['merchant_id'],
                $tranId,
                $amountFormatted,
                $items,
                $shipping,
                $firstName,
                $lastName,
                $email,
                $phone,
                $type,
                $paymentOption,
                $returnUrl,
                $cancelUrl,
                $continueSuccessUrl,
                $returnDeeplink,
                $currency,
                $customFields,
                $config['api_key']
            );

            // Record transaction in DB if order_id is provided
            if ($orderId) {
                PaymentTransaction::create([
                    'order_id' => $orderId,
                    'transaction_id' => $tranId,
                    'payment_method' => 'aba',
                    'amount' => $amountFormatted,
                    'status' => 'pending',
                    'raw_response' => json_encode([
                        'merchant_id' => $config['merchant_id'],
                        'req_time' => $reqTime,
                        'payment_option' => $paymentOption,
                    ]),
                ]);
            }

            return response()->json([
                'success' => true,
                'sandbox' => true,
                'purchase_url' => $config['purchase_url'],
                'data' => [
                    'req_time' => $reqTime,
                    'merchant_id' => $config['merchant_id'],
                    'tran_id' => $tranId,
                    'amount' => $amountFormatted,
                    'items' => $items,
                    'shipping' => $shipping,
                    'firstname' => $firstName,
                    'lastname' => $lastName,
                    'email' => $email,
                    'phone' => $phone,
                    'type' => $type,
                    'payment_option' => $paymentOption,
                    'return_url' => $returnUrl,
                    'cancel_url' => $cancelUrl,
                    'continue_success_url' => $continueSuccessUrl,
                    'return_deeplink' => $returnDeeplink,
                    'currency' => $currency,
                    'custom_fields' => $customFields,
                    'hash' => $hash,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('[ABA PayWay Sandbox] Purchase Generation Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate ABA PayWay purchase payload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check ABA PayWay Sandbox transaction status
     */
    public function checkTransaction(Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|string',
            'store_id' => 'nullable|integer',
        ]);

        try {
            $tranId = $request->input('transaction_id');
            $user = $request->user();
            $ownerId = $request->input('store_id') ?: ($user ? $user->id : 1);

            $config = $this->getAbaConfig($ownerId);
            $reqTime = date('YmdHis');

            $hash = self::generateCheckHash(
                $reqTime,
                $config['merchant_id'],
                $tranId,
                $config['api_key']
            );

            $response = Http::asForm()->post($config['check_url'], [
                'req_time' => $reqTime,
                'merchant_id' => $config['merchant_id'],
                'tran_id' => $tranId,
                'hash' => $hash,
            ]);

            $result = $response->json();

            Log::info('[ABA PayWay Sandbox] Check Transaction Result', [
                'tran_id' => $tranId,
                'response' => $result,
            ]);

            $isPaid = false;
            if (isset($result['status']) && ($result['status'] === 0 || $result['status'] === '0' || strtolower((string)$result['status']) === 'success')) {
                $isPaid = true;

                // Update database transaction status
                $txn = PaymentTransaction::where('transaction_id', $tranId)->first();
                if ($txn) {
                    $txn->update(['status' => 'success', 'raw_response' => json_encode($result)]);
                    if ($txn->order) {
                        $txn->order->update(['payment_status' => 'Paid']);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'paid' => $isPaid,
                'status' => $isPaid ? 'Paid' : 'Pending',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            Log::error('[ABA PayWay Sandbox] Check Transaction Exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error verifying ABA PayWay transaction: ' . $e->getMessage()
            ], 500);
        }
    }
}
