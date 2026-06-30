<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use App\Helpers\UploadHelper;

class StoreController extends Controller
{
    public function index (Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['detail' => 'Only administrators are authorized to perform this operation.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $stores = Store::all()->groupBy('created_by');
        $formatted = [];
        foreach ($stores as $ownerId => $items) {
            $dict = [
                'id' => $ownerId,
                'owner_id' => $ownerId,
                'created_by' => $ownerId,
                'hashid' => \Vinkla\Hashids\Facades\Hashids::encode(intval($ownerId)),
            ];
            foreach ($items as $item) {
                $value = $item->value;
                if ($item->key === 'payment_methods') {
                    $value = json_decode($value, true) ?: [];
                }
                $dict[$item->key] = $value;
            }
            $owner = \App\Models\User::find($ownerId);
            if ($owner) {
                $dict['owner'] = $owner;
            }
            $formatted[] = $dict;
        }

        $formatted = array_slice($formatted, $skip, $limit);
        return response()->json($formatted);
    }

    public function showByOwner ($ownerId)
    {
        $realOwnerId = $ownerId;
        if (!is_numeric($realOwnerId)) {
            $decoded = \Vinkla\Hashids\Facades\Hashids::decode($ownerId);
            $realOwnerId = !empty($decoded) ? $decoded[0] : null;
        }

        if ($realOwnerId == 1) {
            $authUser = request()->user('api') ?: auth()->user();
            if (!$authUser || $authUser->id != 1) {
                return response()->json(['message' => 'Store not found.'], 404);
            }
        }

        $storeSettings = Store::where('created_by', $realOwnerId)->get();
        if ($storeSettings->isEmpty()) {
            $user = \App\Models\User::find($realOwnerId);
            $storeName = $user ? $user->name : "Store #{$realOwnerId}";
            return response()->json([
                'id' => intval($realOwnerId),
                'owner_id' => intval($realOwnerId),
                'created_by' => intval($realOwnerId),
                'hashid' => \Vinkla\Hashids\Facades\Hashids::encode(intval($realOwnerId)),
                'store_name' => $storeName,
                'store_email' => $user ? $user->email : '',
                'store_phone' => '',
                'store_address' => '',
                'guest_checkout' => true,
                'payment_methods' => [],
            ]);
        }
        $dict = [
            'id' => intval($realOwnerId),
            'owner_id' => intval($realOwnerId),
            'created_by' => intval($realOwnerId),
            'hashid' => \Vinkla\Hashids\Facades\Hashids::encode(intval($realOwnerId)),
        ];
        foreach ($storeSettings as $item) {
            $value = $item->value;
            if ($item->key === 'payment_methods') {
                $value = json_decode($value, true) ?: [];
            }
            $dict[$item->key] = $value;
        }
        return response()->json($dict);
    }

    public function showMe (Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        $storeSettings = Store::where('created_by', $user->id)->get();
        if ($storeSettings->isEmpty()) {
            return response()->json(['detail' => 'You do not have a store profile configured yet.'], 404);
        }
        $dict = [
            'id' => $user->id,
            'owner_id' => $user->id,
            'created_by' => $user->id,
            'hashid' => \Vinkla\Hashids\Facades\Hashids::encode($user->id),
        ];
        foreach ($storeSettings as $item) {
            $value = $item->value;
            if ($item->key === 'payment_methods') {
                $value = json_decode($value, true) ?: [];
            }
            $dict[$item->key] = $value;
        }
        return response()->json($dict);
    }

    public function upsert (Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        $storeKeys = [
            'store_name',
            'store_phone',
            'store_email',
            'store_address',
            'tax_percentage',
            'subscription_tier',
            'custom_domain',
            'logo_url',
            'favicon_url',
            'social_tiktok',
            'social_facebook',
            'social_telegram',
            'shipping_fee',
            'free_shipping_threshold',
            'website_theme',
            'currency',
            'maintenance_mode',
            'announcement_text',
            'footer_text',
            'payment_methods',
            'guest_checkout',
            'pusher_app_id',
            'pusher_app_key',
            'pusher_app_secret',
            'pusher_app_cluster',
            'google_client_id',
            'google_client_secret',
            'google_enabled',
            'facebook_app_id',
            'facebook_app_secret',
            'facebook_enabled',
            'checkout_delivery_address',
            'checkout_preferred_contact',
            'checkout_note',
            'checkout_claim_code',
            'telegram_bot_token',
            'telegram_chat_id',
            'telegram_enabled'
        ];

        $data = $request->all();
        foreach ($data as $key => $value) {
            if (!in_array($key, $storeKeys)) {
                continue;
            }

            $val = $value;
            if (in_array($key, ['logo_url', 'favicon_url'])) {
                $val = UploadHelper::normalizePath($value);
            } elseif ($key === 'payment_methods' && (is_array($value) || is_object($value))) {
                $val = json_encode($value);
            }

            Store::updateOrCreate(
                ['created_by' => $user->id, 'key' => $key],
                ['value' => $val]
            );
        }

        // Auto-sync domain setting with store_domains table
        if ($request->has('custom_domain')) {
            $domainVal = strtolower(trim($request->custom_domain));
            if ($domainVal) {
                $type = 'custom';
                $platformDomain = config('app.platform_domain', 'yourplatform.com');
                
                if (!str_contains($domainVal, '.') || str_ends_with($domainVal, '.' . $platformDomain) || str_ends_with($domainVal, '.lvh.me') || str_ends_with($domainVal, '.vercel.app')) {
                    $type = 'subdomain';
                }
                
                $fullDomain = $domainVal;
                if ($type === 'subdomain' && !str_contains($domainVal, '.')) {
                    $fullDomain = $domainVal . '.' . $platformDomain;
                }

                \App\Models\StoreDomain::updateOrCreate(
                    ['owner_id' => $user->id, 'type' => $type],
                    [
                        'domain' => $fullDomain,
                        'is_verified' => true,
                        'is_primary' => true
                    ]
                );
            } else {
                \App\Models\StoreDomain::where('owner_id', $user->id)->delete();
            }
        }

        if ($request->has('guest_checkout')) {
            Store::where('created_by', $user->id)->update(['guest_checkout' => (bool) $request->guest_checkout]);
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$user->id}");

        // Auto-register Telegram webhook if bot token is provided
        if ($request->has('telegram_bot_token') && $request->telegram_bot_token) {
            \App\Helpers\TelegramHelper::registerWebhook($request->telegram_bot_token, $request->getSchemeAndHttpHost());
        }

        $storeSettings = Store::where('created_by', $user->id)->get();
        $dict = [
            'id' => $user->id,
            'owner_id' => $user->id,
            'created_by' => $user->id,
            'hashid' => \Vinkla\Hashids\Facades\Hashids::encode($user->id),
        ];
        foreach ($storeSettings as $item) {
            $value = $item->value;
            if ($item->key === 'payment_methods') {
                $value = json_decode($value, true) ?: [];
            }
            $dict[$item->key] = $value;
        }
        return response()->json($dict);
    }

    public function store (Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 1) {
            return response()->json(['detail' => 'Access denied. Only administrators can perform this operation.'], 403);
        }

        $request->validate([
            'created_by' => 'required|integer|exists:users,id',
        ]);

        $storeKeys = [
            'store_name',
            'store_phone',
            'store_email',
            'store_address',
            'tax_percentage',
            'subscription_tier',
            'custom_domain',
            'logo_url',
            'favicon_url',
            'social_tiktok',
            'social_facebook',
            'social_telegram',
            'shipping_fee',
            'free_shipping_threshold',
            'website_theme',
            'currency',
            'maintenance_mode',
            'announcement_text',
            'footer_text',
            'payment_methods',
            'guest_checkout',
            'pusher_app_id',
            'pusher_app_key',
            'pusher_app_secret',
            'pusher_app_cluster',
            'google_client_id',
            'google_client_secret',
            'google_enabled',
            'facebook_app_id',
            'facebook_app_secret',
            'facebook_enabled',
            'checkout_delivery_address',
            'checkout_preferred_contact',
            'checkout_note',
            'checkout_claim_code',
            'telegram_bot_token',
            'telegram_chat_id',
            'telegram_enabled'
        ];

        $ownerId = $request->created_by;
        $data = $request->all();
        foreach ($data as $key => $value) {
            if (!in_array($key, $storeKeys)) {
                continue;
            }

            $val = $value;
            if (in_array($key, ['logo_url', 'favicon_url'])) {
                $val = UploadHelper::normalizePath($value);
            } elseif ($key === 'payment_methods' && (is_array($value) || is_object($value))) {
                $val = json_encode($value);
            }

            Store::updateOrCreate(
                ['created_by' => $ownerId, 'key' => $key],
                ['value' => $val]
            );
        }

        if ($request->has('guest_checkout')) {
            Store::where('created_by', $ownerId)->update(['guest_checkout' => (bool) $request->guest_checkout]);
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$ownerId}");

        $storeSettings = Store::where('created_by', $ownerId)->get();
        $dict = [
            'id' => $ownerId,
            'owner_id' => $ownerId,
            'created_by' => $ownerId,
            'hashid' => \Vinkla\Hashids\Facades\Hashids::encode($ownerId),
        ];
        foreach ($storeSettings as $item) {
            $value = $item->value;
            if ($item->key === 'payment_methods') {
                $value = json_decode($value, true) ?: [];
            }
            $dict[$item->key] = $value;
        }
        return response()->json($dict, 201);
    }

    public function update (Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        if ($user->role_id === 30003 && $user->id !== intval($id)) {
            return response()->json(['detail' => 'Access denied. You can only update your own store profile.'], 403);
        }

        $ownerId = $id;
        $storeSettingsExists = Store::where('created_by', $ownerId)->exists();
        if (!$storeSettingsExists) {
            $single = Store::find($id);
            if ($single) {
                $ownerId = $single->created_by;
            } else {
                return response()->json(['detail' => 'Store profile not found.'], 404);
            }
        }

        $storeKeys = [
            'store_name',
            'store_phone',
            'store_email',
            'store_address',
            'tax_percentage',
            'subscription_tier',
            'custom_domain',
            'logo_url',
            'favicon_url',
            'social_tiktok',
            'social_facebook',
            'social_telegram',
            'shipping_fee',
            'free_shipping_threshold',
            'website_theme',
            'currency',
            'maintenance_mode',
            'announcement_text',
            'footer_text',
            'payment_methods',
            'guest_checkout',
            'pusher_app_id',
            'pusher_app_key',
            'pusher_app_secret',
            'pusher_app_cluster',
            'google_client_id',
            'google_client_secret',
            'google_enabled',
            'facebook_app_id',
            'facebook_app_secret',
            'facebook_enabled',
            'checkout_delivery_address',
            'checkout_preferred_contact',
            'checkout_note',
            'checkout_claim_code',
            'telegram_bot_token',
            'telegram_chat_id',
            'telegram_enabled'
        ];

        $data = $request->all();
        foreach ($data as $key => $value) {
            if (!in_array($key, $storeKeys)) {
                continue;
            }

            $val = $value;
            if (in_array($key, ['logo_url', 'favicon_url'])) {
                $val = UploadHelper::normalizePath($value);
            } elseif ($key === 'payment_methods' && (is_array($value) || is_object($value))) {
                $val = json_encode($value);
            }

            Store::updateOrCreate(
                ['created_by' => $ownerId, 'key' => $key],
                ['value' => $val]
            );
        }

        if ($request->has('guest_checkout')) {
            Store::where('created_by', $ownerId)->update(['guest_checkout' => (bool) $request->guest_checkout]);
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$ownerId}");

        // Auto-register Telegram webhook if bot token is provided
        if ($request->has('telegram_bot_token') && $request->telegram_bot_token) {
            \App\Helpers\TelegramHelper::registerWebhook($request->telegram_bot_token, $request->getSchemeAndHttpHost());
        }

        $storeSettings = Store::where('created_by', $ownerId)->get();
        $dict = [
            'id' => $ownerId,
            'owner_id' => $ownerId,
            'created_by' => $ownerId,
            'hashid' => \Vinkla\Hashids\Facades\Hashids::encode($ownerId),
        ];
        foreach ($storeSettings as $item) {
            $value = $item->value;
            if ($item->key === 'payment_methods') {
                $value = json_decode($value, true) ?: [];
            }
            $dict[$item->key] = $value;
        }
        return response()->json($dict);
    }

    public function uploadLogo (Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $path = UploadHelper::uploadImage($request->file('logo'), 'stores/logo');
            return response()->json([
                'url' => asset($path),
                'path' => $path
            ]);
        }

        return response()->json(['detail' => 'No file provided.'], 400);
    }

    public function uploadFavicon (Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        $request->validate([
            'favicon' => 'required|file|mimes:jpeg,png,jpg,gif,svg,ico,webp|max:1024',
        ]);

        if ($request->hasFile('favicon')) {
            $path = UploadHelper::uploadImage($request->file('favicon'), 'stores/favicon');
            return response()->json([
                'url' => asset($path),
                'path' => $path
            ]);
        }

        return response()->json(['detail' => 'No file provided.'], 400);
    }

    public function getPaymentGateways ()
    {
        $gateways = [
            [
                'id' => 'aba',
                'name' => 'ABA PAY',
                'description' => 'Scan to pay with ABA Mobile',
                'logoColor' => 'bg-[#005d7e]',
                'textColor' => 'text-white',
                'logoText' => 'ABA',
                'fields' => [
                    ['key' => 'merchantId', 'label' => 'Merchant ID', 'type' => 'text'],
                    ['key' => 'apiKey', 'label' => 'API Key', 'type' => 'password'],
                    ['key' => 'apiUrl', 'label' => 'API Base URL', 'type' => 'text'],
                    ['key' => 'rsaPublicKey', 'label' => 'RSA Public Key', 'type' => 'textarea', 'required' => false],
                    ['key' => 'rsaPrivateKey', 'label' => 'RSA Private Key', 'type' => 'textarea', 'required' => false],
                    ['key' => 'logo_url', 'label' => 'Payment Gateway Logo', 'type' => 'image', 'required' => false],
                ],
                'defaultValues' => [
                    'merchantId' => 'ec475602',
                    'apiKey' => '2ac355df26562e1070295884ea9f4fc4bd479902',
                    'apiUrl' => 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase',
                    'rsaPublicKey' => "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC04A+Peko6pMoosLiX0bnnG+c+\nbo2SIOuY3+gxPhRD/kMfrvEqpr6Np45Sbe5Sjmxjr+8Rlz71VUQ5wOZdczJePoJB\n+QcHOuxYzlmOz3RJrCD5bBt7ccGdytZ9WGnCjgsnX1OfwBlN1Qx+/i2kiOa5nLyM\n1Wz+FYr5de7WaSg8WwIDAQAB\n-----END PUBLIC KEY-----",
                    'rsaPrivateKey' => "-----BEGIN RSA PRIVATE KEY-----\nMIICXQIBAAKBgQCg/jQmM2fhtq/zTKhXTx6OKIaTZr3jXX+1L7Sczcqy45LB7Q9R\nK6QAf+gbAIbyG7UMzexkZaIqp4WYfQXxOnQLMj0x17s4uTThsX1kMhuCkz/wnMbR\nESCOgqFL95BPaAC5CmfEecc+/t2T+8R5BPtC6ULFM9dt8EgMXAOeKeIHyQIDAQAB\nAoGABjCDwYC6MpS3Gsnkkne/n1xKQT5C2GwSsfz3qwwj6gEDFkrWiwq8G0tPmYMp\njQMY8Lk1iI4aQBzQ73IGEZZLWgdgCaBTSMh/soY8Jffj8OT9rLGrgzZ29+d+TTl0\nCTIofiBL6oZfDfhIupn5JbcZa0Ulti1d8jPKRlQR6apTQwECQQD7g8M+5x8Wzqqe\nvx4WxtVDQMSJJ/BvtLpE2GL8ZRtWVG3m19iFeUBxt2YVZUFWiOtQ1HydSIdnR3Sd\nKMX6UdcBAkEAo90u5/xjHW3YfP04pzibFO7vYo6yTVop3uSC2ERsegzjdl0mvX6q\nU585jQnDb5eHe0XTVLhSZnW3Mc5jEJg4yQJBAMwVfIY8D9P32iZ5ubaNnFq34UHR\nsJ1TrplSY++dMvN4Cr13g2+6lXowcJsH0F6hNyAdawhM4+H/7zXe8dZONgECQD+U\nsf+XoYmotoiA5HuV7i6oK0Btp+d1patztQVfP0v4NkYWDNMYE9TQgk8kS62/+PSu\n+jn0LxzMbiGoOC4XMmkCQQCzU+0VGeNjOJ2pj2trvRIu71h/FPSCyxAK77APgn5U\nwqAYc1N/niuBfOdVpUeovKGBcjGXgkslG/Mym+xAdoX2\n-----END RSA PRIVATE KEY-----"
                ]
            ],
            [
                'id' => 'bakong',
                'name' => 'Bakong KHQR',
                'description' => 'Scan to pay with Bakong App or any KHQR supported bank',
                'logoColor' => 'bg-[#b30006]',
                'textColor' => 'text-white',
                'logoText' => 'Bakong',
                'fields' => [
                    ['key' => 'bakongAccountId', 'label' => 'Your Production Bakong Account ID', 'type' => 'text'],
                    ['key' => 'merchantName', 'label' => 'Merchant ID / Username', 'type' => 'text'],
                    ['key' => 'merchantCity', 'label' => 'Merchant City', 'type' => 'text'],
                    ['key' => 'apiKey', 'label' => 'API Token / Secret Key', 'type' => 'password', 'required' => false],
                    ['key' => 'apiUrl', 'label' => 'API Base URL', 'type' => 'text', 'required' => false],
                    ['key' => 'logo_url', 'label' => 'Payment Gateway Logo', 'type' => 'image', 'required' => false],
                ],
                'defaultValues' => [
                    'bakongAccountId' => '',
                    'merchantName' => '',
                    'merchantCity' => '',
                    'apiKey' => '',
                ]
            ],
            [
                'id' => 'card',
                'name' => 'Credit/Debit Card',
                'description' => 'Accept Visa, Mastercard, JCB, and UnionPay payments.',
                'logoColor' => 'bg-slate-100 border border-slate-200',
                'textColor' => 'text-slate-800',
                'logoText' => '💳',
                'fields' => [
                    ['key' => 'merchantId', 'label' => 'Merchant ID', 'type' => 'text'],
                    ['key' => 'secretKey', 'label' => 'Secret Key', 'type' => 'password'],
                    ['key' => 'logo_url', 'label' => 'Payment Gateway Logo', 'type' => 'image', 'required' => false],
                ]
            ],
            [
                'id' => 'acleda',
                'name' => 'ACLEDA PAY',
                'description' => 'Pay securely with ACLEDA.',
                'logoColor' => 'bg-[#0d3b66]',
                'textColor' => 'text-amber-400',
                'logoText' => 'ACLEDA',
                'fields' => [
                    ['key' => 'merchantId', 'label' => 'Merchant ID', 'type' => 'text'],
                    ['key' => 'apiKey', 'label' => 'API Key', 'type' => 'password'],
                    ['key' => 'apiUrl', 'label' => 'API Base URL', 'type' => 'text'],
                    ['key' => 'logo_url', 'label' => 'Payment Gateway Logo', 'type' => 'image', 'required' => false],
                ]
            ],
            [
                'id' => 'wing',
                'name' => 'Wing Bank',
                'description' => 'Pay securely with WingPay',
                'logoColor' => 'bg-[#84bd00]',
                'textColor' => 'text-blue-900',
                'logoText' => 'Wing',
                'fields' => [
                    ['key' => 'merchantId', 'label' => 'Merchant ID', 'type' => 'text'],
                    ['key' => 'apiKey', 'label' => 'API Key', 'type' => 'password'],
                    ['key' => 'logo_url', 'label' => 'Payment Gateway Logo', 'type' => 'image', 'required' => false],
                ]
            ],
            [
                'id' => 'chipmong',
                'name' => 'CHIP MONG BANK',
                'description' => 'Tab to pay with CHIP MONG',
                'logoColor' => 'bg-[#009b72]',
                'textColor' => 'text-white',
                'logoText' => 'CMB',
                'fields' => [
                    ['key' => 'merchantId', 'label' => 'Merchant ID', 'type' => 'text'],
                    ['key' => 'apiKey', 'label' => 'API Key', 'type' => 'password'],
                    ['key' => 'logo_url', 'label' => 'Payment Gateway Logo', 'type' => 'image', 'required' => false],
                ]
            ],
            [
                'id' => 'transfer',
                'name' => 'Bank Transfer',
                'description' => 'ទូទាត់តាមគណនីធនាគារ',
                'logoColor' => 'bg-slate-50 border border-slate-200',
                'textColor' => 'text-slate-700',
                'logoText' => '🏦',
                'fields' => [
                    ['key' => 'bankName', 'label' => 'Bank Name', 'type' => 'text'],
                    ['key' => 'accountName', 'label' => 'Account Name', 'type' => 'text'],
                    ['key' => 'accountNumber', 'label' => 'Account Number', 'type' => 'text'],
                    ['key' => 'logo_url', 'label' => 'Payment Gateway Logo', 'type' => 'image', 'required' => false],
                ]
            ],
            [
                'id' => 'cod',
                'name' => 'Cash on Delivery',
                'description' => 'បង់ប្រាក់នៅពេលទទួលបានទំនិញ',
                'logoColor' => 'bg-slate-50 border border-slate-200',
                'textColor' => 'text-slate-700',
                'logoText' => '💵',
                'fields' => [
                    ['key' => 'notes', 'label' => 'Delivery Policy / Instructions', 'type' => 'text'],
                    ['key' => 'logo_url', 'label' => 'Payment Gateway Logo', 'type' => 'image', 'required' => false],
                ]
            ]
        ];

        return response()->json($gateways);
    }


    // ─── Domain Management ──────────────────────────────────────────────────────

    /**
     * Public: Resolve a domain to a store owner.
     * GET /api/store/resolve-domain?domain=shopA.yourplatform.com
     */
    public function resolveDomain (Request $request)
    {
        $domain = strtolower(trim($request->query('domain', '')));

        if (!$domain) {
            return response()->json(['message' => 'Missing "domain" query parameter.'], 400);
        }

        $storeDomain = \App\Models\StoreDomain::where('domain', $domain)->first();
        $ownerId = null;
        $domainType = 'subdomain';
        $isVerified = true;

        if ($storeDomain) {
            $ownerId = $storeDomain->owner_id;
            $domainType = $storeDomain->type;
            $isVerified = $storeDomain->is_verified;
        } else {
            $domainWithoutPort = $domain;
            if (str_contains($domainWithoutPort, ':')) {
                $domainWithoutPort = explode(':', $domainWithoutPort)[0];
            }
            // Fallback 1: check in key-value store (stores table) for custom_domain
            $storeSetting = Store::where('key', 'custom_domain')
                ->where(function ($q) use ($domain, $domainWithoutPort) {
                    $q->where('value', $domain)
                        ->orWhere('value', $domainWithoutPort)
                        ->orWhereRaw("REPLACE(value, ':3000', '') = ?", [$domainWithoutPort]);
                })
                ->first();
            if ($storeSetting) {
                $ownerId = $storeSetting->created_by;
                $domainType = 'custom';
                $isVerified = true;
            }

            // Fallback 1.5: If still not found, check if the queried domain is a subdomain format (e.g., our20s.lvh.me)
            // and the custom_domain setting is stored as just the prefix/slug (e.g. "our20s") or with suffix.
            if (!$ownerId) {
                $subdomainSlug = null;
                $platforms = ['lvh.me', 'store-frontend-v-hsite.vercel.app', 'vhsite-storefront.vercel.app', 'vhsite.com', 'yourplatform.com', config('app.platform_domain')];
                foreach ($platforms as $plat) {
                    if ($plat && str_ends_with($domainWithoutPort, '.' . $plat)) {
                        $subdomainSlug = str_replace('.' . $plat, '', $domainWithoutPort);
                        break;
                    }
                }
                if ($subdomainSlug) {
                    $storeSetting = Store::where('key', 'custom_domain')
                        ->where(function ($q) use ($subdomainSlug) {
                            $q->where('value', $subdomainSlug)
                                ->orWhere('value', $subdomainSlug . '.lvh.me')
                                ->orWhere('value', $subdomainSlug . '.store-frontend-v-hsite.vercel.app');
                        })
                        ->first();
                    if ($storeSetting) {
                        $ownerId = $storeSetting->created_by;
                        $domainType = 'subdomain';
                        $isVerified = true;
                    }
                }
            }
        }

        // Fallback 2: Check query params explicitly for local development / testing fallback
        if (!$ownerId) {
            if ($request->filled('owner_id')) {
                $ownerId = $request->query('owner_id');
            } elseif ($request->filled('store')) {
                $storeSetting = Store::where('key', 'store_name')
                    ->where('value', $request->query('store'))
                    ->first();
                if ($storeSetting) {
                    $ownerId = $storeSetting->created_by;
                }
            }
        }

        // Block public access to Super Admin (Owner ID 1)
        if (!$ownerId || $ownerId == 1) {
            return response()->json(['found' => false, 'message' => 'No store found for this domain.'], 404);
        }

        $settings = Store::where('created_by', $ownerId)->get()->pluck('value', 'key');

        return response()->json([
            'found' => true,
            'owner_id' => $ownerId,
            'hashid' => \Vinkla\Hashids\Facades\Hashids::encode($ownerId),
            'store_name' => $settings->get('store_name'),
            'website_theme' => $settings->get('website_theme', 'fashion_website'),
            'logo_url' => $settings->get('logo_url'),
            'favicon_url' => $settings->get('favicon_url'),
            'currency' => $settings->get('currency', 'USD'),
            'store_email' => $settings->get('store_email'),
            'store_phone' => $settings->get('store_phone'),
            'store_address' => $settings->get('store_address'),
            'domain_type' => $domainType,
            'is_verified' => $isVerified,
        ]);
    }

    /**
     * List all domains for the logged-in owner.
     * GET /api/owner/stores/domains  [auth]
     */
    public function listDomains (Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Unauthorized.'], 403);
        }

        $ownerId = ($user->role_id == 1 && $request->filled('owner_id'))
            ? $request->query('owner_id')
            : $user->id;

        $domains = \App\Models\StoreDomain::forOwner($ownerId);

        return response()->json($domains);
    }

    /**
     * Register a new domain for the logged-in owner.
     * POST /api/owner/stores/domains  [auth]
     */
    public function addDomain (Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'domain' => 'required|string|max:255|unique:store_domains,domain',
            'type' => 'nullable|string|in:subdomain,custom',
        ]);

        $ownerId = ($user->role_id == 1 && $request->filled('owner_id'))
            ? $request->input('owner_id')
            : $user->id;

        $domain = \App\Models\StoreDomain::create([
            'owner_id' => $ownerId,
            'domain' => strtolower(trim($data['domain'])),
            'type' => $data['type'] ?? 'subdomain',
            'is_verified' => ($data['type'] ?? 'subdomain') === 'subdomain', // Subdomains are auto-verified
            'is_primary' => !\App\Models\StoreDomain::where('owner_id', $ownerId)->exists(),
        ]);

        return response()->json($domain, 201);
    }

    /**
     * Remove a domain belonging to the logged-in owner.
     * DELETE /api/owner/stores/domains/{id}  [auth]
     */
    public function removeDomain (Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Unauthorized.'], 403);
        }

        $domain = \App\Models\StoreDomain::findOrFail($id);

        // Non-admin owners can only delete their own domains
        if ($user->role_id != 1 && $domain->owner_id != $user->id) {
            return response()->json(['detail' => 'You can only remove your own domains.'], 403);
        }

        $domain->delete();

        return response()->json(['detail' => 'Domain removed successfully.']);
    }

    /**
     * Quick-set a subdomain slug for the logged-in owner.
     * POST /api/owner/stores/subdomain  [auth]
     *
     * Body: { "slug": "my-shop" }
     * Result: Creates domain "my-shop.yourplatform.com" (platform domain from config)
     */
    public function setSubdomain (Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'slug' => 'required|string|max:63|regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/',
        ]);

        $platformDomain = config('app.platform_domain', 'yourplatform.com');
        $fullDomain = strtolower($data['slug']) . '.' . $platformDomain;

        $ownerId = ($user->role_id == 1 && $request->filled('owner_id'))
            ? $request->input('owner_id')
            : $user->id;

        // Check if this subdomain is already taken by another owner
        $existing = \App\Models\StoreDomain::where('domain', $fullDomain)->first();
        if ($existing && $existing->owner_id != $ownerId) {
            return response()->json(['detail' => 'This subdomain is already taken.'], 409);
        }

        // Upsert: update if owner already has a subdomain, otherwise create
        $domain = \App\Models\StoreDomain::updateOrCreate(
            ['owner_id' => $ownerId, 'type' => 'subdomain'],
            [
                'domain' => $fullDomain,
                'is_verified' => true,
                'is_primary' => !\App\Models\StoreDomain::where('owner_id', $ownerId)
                    ->where('type', 'custom')
                    ->where('is_primary', true)
                    ->exists(),
            ]
        );

        return response()->json($domain);
    }
}
