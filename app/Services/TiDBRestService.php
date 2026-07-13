<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TiDBRestService
{
    protected string $publicKey;
    protected string $privateKey;
    protected string $appId;
    protected string $baseUrl;

    public function __construct()
    {
        $this->publicKey = config('services.tidb.public_key', '');
        $this->privateKey = config('services.tidb.private_key', '');
        $this->appId = config('services.tidb.app_id', '');
        $this->baseUrl = config('services.tidb.base_url', 'https://ap-southeast-1.data.tidbcloud.com');
    }

    /**
     * Call a custom TiDB Data Service REST endpoint.
     *
     * @param string $path The endpoint path (e.g., 'get_store')
     * @param array $params Query string or request body parameters
     * @param string $method HTTP method (GET or POST)
     * @return array|null The JSON response array, or null on failure
     */
    public function callEndpoint(string $path, array $params = [], string $method = 'GET')
    {
        $url = rtrim($this->baseUrl, '/') . "/api/v1beta/app/{$this->appId}/endpoint/{$path}";

        // Configure Digest Authentication
        $request = Http::withDigestAuth($this->publicKey, $this->privateKey);

        // Execute request based on method
        if (strtoupper($method) === 'POST') {
            $response = $request->post($url, $params);
        } else {
            $response = $request->get($url, $params);
        }

        if ($response->successful()) {
            return $response->json();
        }

        Log::error("TiDB REST Service error on [{$path}]: (" . $response->status() . ") " . $response->body());
        return null;
    }
}
