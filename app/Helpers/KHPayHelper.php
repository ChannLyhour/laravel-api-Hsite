<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KHPayHelper
{
    /**
     * Get KHPay API Base URL
     */
    protected static function getBaseUrl(): string
    {
        return config('services.khpay.base_url', 'https://khpay.site/api/v1');
    }

    /**
     * Get KHPay API Key from Store settings or ENV
     */
    protected static function getApiKey(?string $apiKey = null): string
    {
        return $apiKey ?: config('services.khpay.api_key', env('KHPAY_API_KEY', 'ak_43a276d3b91c5b1ca12c85f28d5aaee14cce07cb1ef294d2'));
    }

    /**
     * Generate KHQR Code via KHPay API.
     *
     * @param float $amount
     * @param string $currency (USD or KHR)
     * @param string $orderId
     * @param string $description
     * @param string|null $customApiKey
     * @return array|null
     */
    public static function generateKHQR(
        float $amount,
        string $currency = 'USD',
        string $orderId = '',
        string $description = '',
        string $accountId = 'lyhour_chann@bkrt',
        string $merchantName = 'OuR20s Store',
        string $merchantCity = 'Siem Reap',
        ?string $customApiKey = null,
        ?string $paywayLink = null
    ): ?array {
        try {
            $apiKey = self::getApiKey($customApiKey);
            if (empty($apiKey)) {
                Log::warning("⚠️ [KHPAY] Missing KHPay API Key in config/ENV.");
                return null;
            }

            $http = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->timeout(10);

            if (app()->isLocal()) {
                $http = $http->withoutVerifying();
            }

            $payload = [
                'account_id' => $accountId,
                'merchant_name' => $merchantName ?: 'Merchant',
                'merchant_city' => $merchantCity ?: 'Phnom Penh',
                'amount' => $amount,
                'currency' => strtoupper($currency),
                'order_id' => $orderId,
                'description' => $description ?: "Payment for Order #{$orderId}",
            ];

            if (!empty($paywayLink)) {
                $payload['payway_link'] = $paywayLink;
                $payload['payway_merchant_link'] = $paywayLink;
            }

            $response = $http->post(self::getBaseUrl() . '/bakong/generate', $payload);

            if ($response->successful()) {
                $data = $response->json();
                $innerData = $data['data'] ?? $data;
                Log::info("✅ [KHPAY QR GENERATED] Order #{$orderId} Amount: {$amount} {$currency}");
                return [
                    'success' => true,
                    'transaction_id' => $innerData['transaction_id'] ?? null,
                    'qr_code' => $innerData['qr'] ?? ($innerData['qr_code'] ?? null),
                    'qr_image_url' => $innerData['download_qr'] ?? ($innerData['qr_image_url'] ?? null),
                    'payment_url' => $innerData['payment_url'] ?? null,
                    'md5' => $innerData['md5'] ?? null,
                    'raw' => $data,
                ];
            }

            Log::error("❌ [KHPAY QR FAILED] Order #{$orderId} Status {$response->status()}: " . $response->body());
            return null;
        } catch (\Throwable $e) {
            Log::error("❌ [KHPAY QR EXCEPTION] Order #{$orderId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Check KHPay Payment Status by Order ID / MD5.
     *
     * @param string $orderId
     * @param string|null $customApiKey
     * @return array|null
     */
    public static function checkPaymentStatus(string $orderId, ?string $customApiKey = null): ?array
    {
        try {
            $apiKey = self::getApiKey($customApiKey);
            if (empty($apiKey)) {
                return null;
            }

            $http = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Accept' => 'application/json',
            ])->timeout(10);

            if (app()->isLocal()) {
                $http = $http->withoutVerifying();
            }

            $response = $http->get(self::getBaseUrl() . '/check-status/' . $orderId);

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Throwable $e) {
            Log::error("❌ [KHPAY CHECK EXCEPTION] Order #{$orderId}: " . $e->getMessage());
            return null;
        }
    }
}
