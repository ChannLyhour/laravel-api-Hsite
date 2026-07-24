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
                if (in_array($item->key, ['sidebar_status', 'subsidebar_status'])) {
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                } elseif (
                    in_array($item->key, [
                        'payment_methods',
                        'brand_identity_operations',
                        'financial_configurations',
                        'store_operations_content',
                        'checkout_form_visibility',
                        'firebase_setup',
                        'pusher_configuration',
                        'marketing_tools_setup',
                        'social_login_setup',
                        'social_login_setup_oauth',
                        'telegram_bot_notifications',
                        'otp_email_configuration',
                        'location_store'
                    ])
                ) {
                    $value = json_decode($value, true) ?: [];
                }
                $dict[$item->key] = $value;
                $dict[$this->toSnakeCase($item->key)] = $value;
                if (in_array($item->key, [
                    'brand_identity_operations',
                    'financial_configurations',
                    'store_operations_content',
                    'checkout_form_visibility',
                    'otp_email_configuration',
                    'firebase_setup',
                    'location_store'
                ]) && is_array($value)) {
                    foreach ($value as $subKey => $subVal) {
                        $dict[$subKey] = $subVal;
                        $dict[$this->toSnakeCase($subKey)] = $subVal;
                    }
                }
            }
            if (!isset($dict['sidebar_status'])) {
                $dict['sidebar_status'] = true;
                $dict['sidebarStatus'] = true;
            }
            if (!isset($dict['subsidebar_status'])) {
                $dict['subsidebar_status'] = true;
                $dict['subsidebarStatus'] = true;
            }
            if (!isset($dict['location_store']) || empty($dict['location_store'])) {
                $loc = [
                    'store_address' => $dict['store_address'] ?? '',
                    'store_latitude' => $dict['store_latitude'] ?? '',
                    'store_longitude' => $dict['store_longitude'] ?? '',
                ];
                $dict['location_store'] = $loc;
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

    public function publicList()
    {
        // 1. Fetch active owners/admins
        $users = \App\Models\User::whereIn('role_id', [1, 30003])
            ->where('state', 'active')
            ->get();

        // 2. Fetch product counts for each owner (only active storefronts with products)
        $productCounts = \App\Models\Product::select('created_by', \DB::raw('count(*) as total'))
            ->whereIn('created_by', $users->pluck('id'))
            ->groupBy('created_by')
            ->pluck('total', 'created_by')
            ->toArray();

        // 3. Fetch public settings (name & logo)
        $settings = Store::whereIn('created_by', $users->pluck('id'))
            ->whereIn('key', ['store_name', 'logo_url'])
            ->get()
            ->groupBy('created_by');

        $formatted = [];
        foreach ($users as $user) {
            $productsCount = $productCounts[$user->id] ?? 0;
            if ($productsCount === 0) {
                continue; // Only list active stores with products
            }

            $userSettings = $settings->get($user->id);
            $storeName = $user->name;
            $logoUrl = $user->image ?: '';

            if ($userSettings) {
                foreach ($userSettings as $item) {
                    if ($item->key === 'store_name' && !empty($item->value)) {
                        $storeName = $item->value;
                    }
                    if ($item->key === 'logo_url' && !empty($item->value)) {
                        $logoUrl = $item->value;
                    }
                }
            }

            $formatted[] = [
                'id' => intval($user->id),
                'owner_id' => intval($user->id),
                'created_by' => intval($user->id),
                'hashid' => \Vinkla\Hashids\Facades\Hashids::encode(intval($user->id)),
                'name' => $storeName,
                'logo_url' => $logoUrl,
                'products' => $productsCount,
            ];
        }

        return response()->json($formatted);
    }

    public function showByOwner ($ownerId)
    {
        $realOwnerId = $ownerId;
        if (!is_numeric($realOwnerId)) {
            $decoded = \Vinkla\Hashids\Facades\Hashids::decode($ownerId);
            $realOwnerId = !empty($decoded) ? $decoded[0] : null;
        }

        if (!$realOwnerId) {
            return response()->json(['detail' => 'Store not found.'], 404);
        }

        $data = \Illuminate\Support\Facades\Cache::remember("stores_owner_{$realOwnerId}", 86400 * 30, function () use ($realOwnerId) {
            $storeSettings = Store::where('created_by', $realOwnerId)->get();
            if ($storeSettings->isEmpty()) {
                $user = \App\Models\User::find($realOwnerId);
                $storeName = $user ? $user->name : "Store #{$realOwnerId}";
                return [
                    'id' => intval($realOwnerId),
                    'owner_id' => intval($realOwnerId),
                    'created_by' => intval($realOwnerId),
                    'hashid' => \Vinkla\Hashids\Facades\Hashids::encode(intval($realOwnerId)),
                    'store_name' => $storeName,
                    'store_email' => $user ? $user->email : '',
                    'store_phone' => '',
                    'store_address' => '',
                    'store_latitude' => '',
                    'store_longitude' => '',
                    'location_store' => [
                        'store_address' => '',
                        'store_latitude' => '',
                        'store_longitude' => '',
                    ],
                    'guest_checkout' => true,
                    'payment_methods' => [],
                ];
            }
            $dict = [
                'id' => intval($realOwnerId),
                'owner_id' => intval($realOwnerId),
                'created_by' => intval($realOwnerId),
                'hashid' => \Vinkla\Hashids\Facades\Hashids::encode(intval($realOwnerId)),
            ];
            foreach ($storeSettings as $item) {
                $value = $item->value;
                if (in_array($item->key, ['sidebar_status', 'subsidebar_status'])) {
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                } elseif (
                    in_array($item->key, [
                        'payment_methods',
                        'brand_identity_operations',
                        'financial_configurations',
                        'store_operations_content',
                        'checkout_form_visibility',
                        'firebase_setup',
                        'pusher_configuration',
                        'marketing_tools_setup',
                        'social_login_setup',
                        'social_login_setup_oauth',
                        'telegram_bot_notifications',
                        'otp_email_configuration',
                        'location_store'
                    ])
                ) {
                    $value = json_decode($value, true) ?: [];
                }
                $dict[$item->key] = $value;
                $dict[$this->toSnakeCase($item->key)] = $value;
                if (in_array($item->key, [
                    'brand_identity_operations',
                    'financial_configurations',
                    'store_operations_content',
                    'checkout_form_visibility',
                    'otp_email_configuration',
                    'firebase_setup',
                    'location_store'
                ]) && is_array($value)) {
                    foreach ($value as $subKey => $subVal) {
                        $dict[$subKey] = $subVal;
                        $dict[$this->toSnakeCase($subKey)] = $subVal;
                    }
                }
            }
            if (!isset($dict['sidebar_status'])) {
                $dict['sidebar_status'] = true;
                $dict['sidebarStatus'] = true;
            }
            if (!isset($dict['subsidebar_status'])) {
                $dict['subsidebar_status'] = true;
                $dict['subsidebarStatus'] = true;
            }

            if (!isset($dict['location_store']) || empty($dict['location_store'])) {
                $loc = [
                    'store_address' => $dict['store_address'] ?? '',
                    'store_latitude' => $dict['store_latitude'] ?? '',
                    'store_longitude' => $dict['store_longitude'] ?? '',
                ];
                $dict['location_store'] = $loc;
            }

            return $dict;
        });

        return response()->json($data);
    }

    public function showMe (Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        $data = \Illuminate\Support\Facades\Cache::remember("stores_me_{$user->id}", 86400 * 30, function () use ($user) {
            $storeSettings = Store::where('created_by', $user->id)->get();
            if ($storeSettings->isEmpty()) {
                return null;
            }
            $dict = [
                'id' => $user->id,
                'owner_id' => $user->id,
                'created_by' => $user->id,
                'hashid' => \Vinkla\Hashids\Facades\Hashids::encode($user->id),
            ];
            foreach ($storeSettings as $item) {
                $value = $item->value;
                if (in_array($item->key, ['sidebar_status', 'subsidebar_status'])) {
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                } elseif (
                    in_array($item->key, [
                        'payment_methods',
                        'brand_identity_operations',
                        'financial_configurations',
                        'store_operations_content',
                        'checkout_form_visibility',
                        'firebase_setup',
                        'pusher_configuration',
                        'marketing_tools_setup',
                        'social_login_setup',
                        'social_login_setup_oauth',
                        'telegram_bot_notifications',
                        'otp_email_configuration',
                        'location_store'
                    ])
                ) {
                    $value = json_decode($value, true) ?: [];
                }
                $dict[$item->key] = $value;
                $dict[$this->toSnakeCase($item->key)] = $value;
                if (in_array($item->key, [
                    'brand_identity_operations',
                    'financial_configurations',
                    'store_operations_content',
                    'checkout_form_visibility',
                    'location_store'
                ]) && is_array($value)) {
                    foreach ($value as $subKey => $subVal) {
                        $dict[$subKey] = $subVal;
                        $dict[$this->toSnakeCase($subKey)] = $subVal;
                    }
                }
            }
            if (!isset($dict['sidebar_status'])) {
                $dict['sidebar_status'] = true;
                $dict['sidebarStatus'] = true;
            }
            if (!isset($dict['subsidebar_status'])) {
                $dict['subsidebar_status'] = true;
                $dict['subsidebarStatus'] = true;
            }

            if (!isset($dict['location_store']) || empty($dict['location_store'])) {
                $loc = [
                    'store_address' => $dict['store_address'] ?? '',
                    'store_latitude' => $dict['store_latitude'] ?? '',
                    'store_longitude' => $dict['store_longitude'] ?? '',
                ];
                $dict['location_store'] = $loc;
            }

            return $dict;
        });

        if ($data === null) {
            return response()->json(['detail' => 'You do not have a store profile configured yet.'], 404);
        }

        return response()->json($data);
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
            'location_store',
            'tax_percentage',
            'subscription_tier',
            'sidebar_status',
            'subsidebar_status',
            'store_type',
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
            'brand_identity_operations',
            'financial_configurations',
            'store_operations_content',
            'checkout_form_visibility',
            'firebase_setup',
            'firebase_api_key',
            'firebase_project_id',
            'firebase_auth_domain',
            'firebase_messaging_sender_id',
            'firebase_app_id',
            'pusher_configuration',
            'marketing_tools_setup',
            'social_login_setup',
            'social_login_setup_oauth',
            'telegram_bot_notifications',
            'otp_email_configuration',
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
            'preferred_contact_phone',
            'preferred_contact_telegram',
            'preferred_contact_whatsapp',
            'checkout_note',
            'checkout_claim_code',
            'telegram_bot_token',
            'telegram_chat_id',
            'telegram_enabled',
            'telegram_customer_bot_link',
            'customer_chat',
            'send_chat_order',
            'gmail_enabled',
            'gmail_email',
            'gmail_password',
            'mail_mailer',
            'mail_host',
            'mail_port',
            'mail_encryption',
            'mail_username',
            'mail_password',
            'mail_from_address',
            'mail_from_name'
        ];

        if ($request->has('website_theme')) {
            $currentTheme = Store::where('created_by', $user->id)->where('key', 'website_theme')->value('value');
            if ($request->website_theme !== $currentTheme) {
                \App\Models\StoreThemeHistory::create([
                    'owner_id' => $user->id,
                    'theme_id' => $request->website_theme,
                    'changed_by' => $user->id,
                ]);
            }
        }

        $data = $request->all();
        foreach ($data as $key => $value) {
            if (!in_array($key, $storeKeys)) {
                continue;
            }

            $val = $value;
            if (in_array($key, ['logo_url', 'favicon_url'])) {
                $val = UploadHelper::normalizePath($value);
            } elseif (
                in_array($key, [
                    'payment_methods',
                    'brand_identity_operations',
                    'financial_configurations',
                    'store_operations_content',
                    'checkout_form_visibility',
                    'firebase_setup',
                    'pusher_configuration',
                    'marketing_tools_setup',
                    'social_login_setup',
                    'social_login_setup_oauth',
                    'telegram_bot_notifications',
                    'otp_email_configuration',
                    'location_store'
                ]) && (is_array($value) || is_object($value))
            ) {
                $val = json_encode($value);
            }

            if ($val === null || $val === '' || $val === 'null' || $val === 'undefined') {
                Store::where('created_by', $user->id)->where('key', $key)->delete();
                continue;
            }

            Store::updateOrCreate(
                ['created_by' => $user->id, 'key' => $key],
                ['value' => $val]
            );

            // Auto-extract and save nested keys as flat rows in the database for backend compatibility
            if (in_array($key, [
                'brand_identity_operations',
                'financial_configurations',
                'store_operations_content',
                'checkout_form_visibility',
                'otp_email_configuration',
                'firebase_setup',
                'location_store'
            ]) && (is_array($value) || is_object($value))) {
                foreach ($value as $subKey => $subVal) {
                    if ($subVal === null || $subVal === '' || $subVal === 'null' || $subVal === 'undefined') {
                        Store::where('created_by', $user->id)->where('key', $subKey)->delete();
                    } else {
                        Store::updateOrCreate(
                            ['created_by' => $user->id, 'key' => $subKey],
                            ['value' => $subVal]
                        );
                    }
                }
            }
        }

        // Auto-sync domain setting with store_domains table
        $customDomainVal = null;
        if ($request->has('custom_domain')) {
            $customDomainVal = $request->custom_domain;
        } elseif ($request->has('brand_identity_operations') && is_array($request->brand_identity_operations) && isset($request->brand_identity_operations['custom_domain'])) {
            $customDomainVal = $request->brand_identity_operations['custom_domain'];
        }

        if ($customDomainVal !== null) {
            $domainVal = strtolower(trim($customDomainVal));
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

                // Check if this domain is already registered to a different owner
                $exists = \App\Models\StoreDomain::where('domain', $fullDomain)
                    ->where('owner_id', '!=', $user->id)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'detail' => "The domain or subdomain '{$fullDomain}' is already taken by another store."
                    ], 422);
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

        $guestCheckoutVal = null;
        if ($request->has('guest_checkout')) {
            $guestCheckoutVal = $request->guest_checkout;
        } elseif ($request->has('store_operations_content') && is_array($request->store_operations_content) && isset($request->store_operations_content['guest_checkout'])) {
            $guestCheckoutVal = $request->store_operations_content['guest_checkout'];
        }

        if ($guestCheckoutVal !== null) {
            Store::where('created_by', $user->id)->update(['guest_checkout' => (bool) $guestCheckoutVal]);
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$user->id}");
        \Illuminate\Support\Facades\Cache::forget("stores_owner_{$user->id}");
        \Illuminate\Support\Facades\Cache::forget("stores_me_{$user->id}");

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
            if (in_array($item->key, ['sidebar_status', 'subsidebar_status'])) {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            } elseif ($item->key === 'payment_methods') {
                $value = json_decode($value, true) ?: [];
            }
            $dict[$item->key] = $value;
        }
        if (!isset($dict['sidebar_status'])) {
            $dict['sidebar_status'] = true;
            $dict['sidebarStatus'] = true;
        }
        if (!isset($dict['subsidebar_status'])) {
            $dict['subsidebar_status'] = true;
            $dict['subsidebarStatus'] = true;
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
            'location_store',
            'tax_percentage',
            'subscription_tier',
            'sidebar_status',
            'subsidebar_status',
            'store_type',
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
            'firebase_setup',
            'firebase_api_key',
            'firebase_project_id',
            'firebase_auth_domain',
            'firebase_messaging_sender_id',
            'firebase_app_id',
            'otp_email_configuration',
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
            'preferred_contact_phone',
            'preferred_contact_telegram',
            'preferred_contact_whatsapp',
            'checkout_note',
            'checkout_claim_code',
            'telegram_bot_token',
            'telegram_chat_id',
            'telegram_enabled',
            'customer_chat',
            'send_chat_order',
            'gmail_enabled',
            'gmail_email',
            'gmail_password',
            'mail_mailer',
            'mail_host',
            'mail_port',
            'mail_encryption',
            'mail_username',
            'mail_password',
            'mail_from_address',
            'mail_from_name'
        ];

        $ownerId = $request->created_by;
        if ($request->has('website_theme')) {
            $currentTheme = Store::where('created_by', $ownerId)->where('key', 'website_theme')->value('value');
            if ($request->website_theme !== $currentTheme) {
                \App\Models\StoreThemeHistory::create([
                    'owner_id' => $ownerId,
                    'theme_id' => $request->website_theme,
                    'changed_by' => $request->user()->id,
                ]);
            }
        }

        $data = $request->all();
        foreach ($data as $key => $value) {
            if (!in_array($key, $storeKeys)) {
                continue;
            }

            $val = $value;
            if (in_array($key, ['logo_url', 'favicon_url'])) {
                $val = UploadHelper::normalizePath($value);
            } elseif (in_array($key, ['payment_methods', 'location_store']) && (is_array($value) || is_object($value))) {
                $val = json_encode($value);
            }

            if ($val === null) {
                Store::where('created_by', $ownerId)->where('key', $key)->delete();
                continue;
            }

            Store::updateOrCreate(
                ['created_by' => $ownerId, 'key' => $key],
                ['value' => $val]
            );

            // Auto-extract and save nested keys as flat rows in the database for backend compatibility
            if (in_array($key, [
                'brand_identity_operations',
                'financial_configurations',
                'store_operations_content',
                'checkout_form_visibility',
                'location_store'
            ]) && (is_array($value) || is_object($value))) {
                foreach ($value as $subKey => $subVal) {
                    if ($subVal === null || $subVal === '' || $subVal === 'null' || $subVal === 'undefined') {
                        Store::where('created_by', $ownerId)->where('key', $subKey)->delete();
                    } else {
                        Store::updateOrCreate(
                            ['created_by' => $ownerId, 'key' => $subKey],
                            ['value' => $subVal]
                        );
                    }
                }
            }
        }

        if ($request->has('guest_checkout')) {
            Store::where('created_by', $ownerId)->update(['guest_checkout' => (bool) $request->guest_checkout]);
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$ownerId}");
        \Illuminate\Support\Facades\Cache::forget("stores_owner_{$ownerId}");
        \Illuminate\Support\Facades\Cache::forget("stores_me_{$ownerId}");

        $storeSettings = Store::where('created_by', $ownerId)->get();
        $dict = [
            'id' => $ownerId,
            'owner_id' => $ownerId,
            'created_by' => $ownerId,
            'hashid' => \Vinkla\Hashids\Facades\Hashids::encode($ownerId),
        ];
        foreach ($storeSettings as $item) {
            $value = $item->value;
            if (in_array($item->key, ['sidebar_status', 'subsidebar_status'])) {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            } elseif (in_array($item->key, ['payment_methods', 'location_store'])) {
                $value = json_decode($value, true) ?: [];
            }
            $dict[$item->key] = $value;
            $dict[$this->toSnakeCase($item->key)] = $value;
        }
        if (!isset($dict['sidebar_status'])) {
            $dict['sidebar_status'] = true;
            $dict['sidebarStatus'] = true;
        }
        if (!isset($dict['subsidebar_status'])) {
            $dict['subsidebar_status'] = true;
            $dict['subsidebarStatus'] = true;
        }
        if (!isset($dict['location_store']) || empty($dict['location_store'])) {
            $loc = [
                'store_address' => $dict['store_address'] ?? '',
                'store_latitude' => $dict['store_latitude'] ?? '',
                'store_longitude' => $dict['store_longitude'] ?? '',
            ];
            $dict['location_store'] = $loc;
        }
        return response()->json($dict, 201);
    }

    public function update (Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        $realOwnerId = $id;
        if (!is_numeric($realOwnerId)) {
            $decoded = \Vinkla\Hashids\Facades\Hashids::decode($id);
            $realOwnerId = !empty($decoded) ? $decoded[0] : null;
        }

        if (!$realOwnerId) {
            return response()->json(['detail' => 'Invalid store owner ID.'], 400);
        }

        if ($user->role_id === 30003 && $user->id !== intval($realOwnerId)) {
            return response()->json(['detail' => 'Access denied. You can only update your own store profile.'], 403);
        }

        $ownerId = $realOwnerId;
        $storeSettingsExists = Store::where('created_by', $ownerId)->exists();
        if (!$storeSettingsExists) {
            $ownerUser = \App\Models\User::find($realOwnerId);
            if (!$ownerUser) {
                return response()->json(['detail' => 'Store profile not found.'], 404);
            }
            $ownerId = $ownerUser->id;
        }

        $storeKeys = [
            'store_name',
            'store_phone',
            'store_email',
            'location_store',
            'tax_percentage',
            'subscription_tier',
            'sidebar_status',
            'subsidebar_status',
            'store_type',
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
            'preferred_contact_phone',
            'preferred_contact_telegram',
            'preferred_contact_whatsapp',
            'checkout_note',
            'checkout_claim_code',
            'telegram_bot_token',
            'telegram_chat_id',
            'telegram_enabled',
            'customer_chat',
            'send_chat_order',
            'gmail_enabled',
            'gmail_email',
            'gmail_password',
            'mail_mailer',
            'mail_host',
            'mail_port',
            'mail_encryption',
            'mail_username',
            'mail_password',
            'mail_from_address',
            'mail_from_name'
        ];

        $data = $request->all();
        foreach ($data as $key => $value) {
            if (!in_array($key, $storeKeys)) {
                continue;
            }

            $val = $value;
            if (in_array($key, ['logo_url', 'favicon_url'])) {
                $val = UploadHelper::normalizePath($value);
            } elseif (in_array($key, ['payment_methods', 'location_store']) && (is_array($value) || is_object($value))) {
                $val = json_encode($value);
            }

            if ($val === null || $val === '' || $val === 'null' || $val === 'undefined') {
                Store::where('created_by', $ownerId)->where('key', $key)->delete();
                continue;
            }

            Store::updateOrCreate(
                ['created_by' => $ownerId, 'key' => $key],
                ['value' => $val]
            );

            // Auto-extract and save nested keys as flat rows in the database for backend compatibility
            if (in_array($key, [
                'brand_identity_operations',
                'financial_configurations',
                'store_operations_content',
                'checkout_form_visibility',
                'location_store'
            ]) && (is_array($value) || is_object($value))) {
                foreach ($value as $subKey => $subVal) {
                    if ($subVal === null || $subVal === '' || $subVal === 'null' || $subVal === 'undefined') {
                        Store::where('created_by', $ownerId)->where('key', $subKey)->delete();
                    } else {
                        Store::updateOrCreate(
                            ['created_by' => $ownerId, 'key' => $subKey],
                            ['value' => $subVal]
                        );
                    }
                }
            }
        }

        // Auto-sync domain setting with store_domains table
        $customDomainVal = null;
        if ($request->has('custom_domain')) {
            $customDomainVal = $request->custom_domain;
        } elseif ($request->has('brand_identity_operations') && is_array($request->brand_identity_operations) && isset($request->brand_identity_operations['custom_domain'])) {
            $customDomainVal = $request->brand_identity_operations['custom_domain'];
        }

        if ($customDomainVal !== null) {
            $domainVal = strtolower(trim($customDomainVal));
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

                // Check if this domain is already registered to a different owner
                $exists = \App\Models\StoreDomain::where('domain', $fullDomain)
                    ->where('owner_id', '!=', $ownerId)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'detail' => "The domain or subdomain '{$fullDomain}' is already taken by another store."
                    ], 422);
                }

                \App\Models\StoreDomain::updateOrCreate(
                    ['owner_id' => $ownerId, 'type' => $type],
                    [
                        'domain' => $fullDomain,
                        'is_verified' => true,
                        'is_primary' => true
                    ]
                );
            } else {
                \App\Models\StoreDomain::where('owner_id', $ownerId)->delete();
            }
        }

        $guestCheckoutVal = null;
        if ($request->has('guest_checkout')) {
            $guestCheckoutVal = $request->guest_checkout;
        } elseif ($request->has('store_operations_content') && is_array($request->store_operations_content) && isset($request->store_operations_content['guest_checkout'])) {
            $guestCheckoutVal = $request->store_operations_content['guest_checkout'];
        }

        if ($guestCheckoutVal !== null) {
            Store::where('created_by', $ownerId)->update(['guest_checkout' => (bool) $guestCheckoutVal]);
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$ownerId}");
        \Illuminate\Support\Facades\Cache::forget("stores_owner_{$ownerId}");
        \Illuminate\Support\Facades\Cache::forget("stores_me_{$ownerId}");

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
            if (in_array($item->key, ['sidebar_status', 'subsidebar_status'])) {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            } elseif (in_array($item->key, ['payment_methods', 'location_store'])) {
                $value = json_decode($value, true) ?: [];
            }
            $dict[$item->key] = $value;
            $dict[$this->toSnakeCase($item->key)] = $value;
        }
        if (!isset($dict['sidebar_status'])) {
            $dict['sidebar_status'] = true;
            $dict['sidebarStatus'] = true;
        }
        if (!isset($dict['subsidebar_status'])) {
            $dict['subsidebar_status'] = true;
            $dict['subsidebarStatus'] = true;
        }
        if (!isset($dict['location_store']) || empty($dict['location_store'])) {
            $loc = [
                'store_address' => $dict['store_address'] ?? '',
                'store_latitude' => $dict['store_latitude'] ?? '',
                'store_longitude' => $dict['store_longitude'] ?? '',
            ];
            $dict['location_store'] = $loc;
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
                'description' => 'Config 1: ABA Bank Support KHQR (PayWay Link) | Config 2: Config with KHPAY',
                'logoColor' => 'bg-[#005d7e]',
                'textColor' => 'text-white',
                'logoText' => 'ABA',
                'fields' => [
                    ['key' => 'payway_link', 'label' => 'ABA Merchant Link (PayWay Link)', 'type' => 'text', 'placeholder' => 'https://link.payway.com.kh/ABAPAYvu485790W', 'hint' => 'Config 1: Paste your ABA Merchant sharing link from ABA PayWay app.'],
                    ['key' => 'khpay_api_key', 'label' => 'KHPay API Token (Bearer Key)', 'type' => 'password', 'required' => false, 'placeholder' => 'ak_43a276d3b91c5b1ca12c...', 'hint' => 'Config 2: API Key from khpay.site for dynamic KHQR generation & status checking.'],
                    ['key' => 'khpay_account_id', 'label' => 'Bakong / KHPay Account ID', 'type' => 'text', 'required' => false, 'placeholder' => 'lyhour_chann@bkrt', 'hint' => 'Config 2: Your Bakong ID registered on KHPay.'],
                    ['key' => 'khpay_merchant_name', 'label' => 'Merchant Name', 'type' => 'text', 'required' => false, 'placeholder' => 'OuR20s Collection', 'hint' => 'Config 2: Display merchant name for KHQR payments.'],
                    ['key' => 'khpay_merchant_city', 'label' => 'Merchant City', 'type' => 'text', 'required' => false, 'placeholder' => 'Siem Reap', 'hint' => 'Config 2: Merchant city for KHQR payments.'],
                ],
                'defaultValues' => [
                    'payway_link' => 'https://link.payway.com.kh/ABAPAYvu485790W',
                    'khpay_api_key' => env('KHPAY_API_KEY', 'ak_43a276d3b91c5b1ca12c85f28d5aaee14cce07cb1ef294d2'),
                    'khpay_account_id' => 'lyhour_chann@bkrt',
                    'khpay_merchant_name' => 'OuR20s Collection',
                    'khpay_merchant_city' => 'Siem Reap',
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
                ],
                'defaultValues' => [
                    'bakongAccountId' => '',
                    'merchantName' => '',
                    'merchantCity' => '',
                    'apiKey' => '',
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

        // Clean protocol prefix if present
        $domain = str_replace(['http://', 'https://'], '', $domain);

        // Support path-based domain resolution (e.g. 127.0.0.1:8000/our20s or vhsite.vercel.app/our20s)
        $domainPathSlug = null;
        if (str_contains($domain, '/')) {
            $parts = explode('/', $domain);
            $domain = $parts[0]; // Host part
            $domainPathSlug = $parts[1]; // Path slug
        }

        $storeDomain = null;
        $ownerId = null;
        $domainType = 'subdomain';
        $isVerified = true;

        if ($domainPathSlug) {
            // Path-based storefront matching
            $storeSetting = Store::where(function ($query) use ($domainPathSlug) {
                $query->where(function ($q) use ($domainPathSlug) {
                    $q->where('key', 'custom_domain')
                        ->where(function ($sq) use ($domainPathSlug) {
                            $sq->where('value', $domainPathSlug)
                                ->orWhere('value', $domainPathSlug . '.lvh.me')
                                ->orWhereRaw("REPLACE(value, ':3000', '') = ?", [$domainPathSlug])
                                ->orWhereRaw("REPLACE(value, ':8000', '') = ?", [$domainPathSlug]);
                        });
                })->orWhere(function ($q) use ($domainPathSlug) {
                    $q->where('key', 'store_name')
                        ->whereRaw("LOWER(REPLACE(value, ' ', '_')) = ?", [$domainPathSlug]);
                });
            })->first();

            if ($storeSetting) {
                $ownerId = $storeSetting->created_by;
                $domainType = 'path';
                $isVerified = true;
            }
        } else {
            // Check direct custom domain table
            $storeDomain = \App\Models\StoreDomain::where('domain', $domain)->first();
            if ($storeDomain) {
                $ownerId = $storeDomain->owner_id;
                $domainType = $storeDomain->type;
                $isVerified = $storeDomain->is_verified;
            }
        }

        if (!$ownerId) {
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
                $platforms = ['lvh.me', 'store-frontend-v-hsite.vercel.app', 'vhsite-storefront.vercel.app', 'vhsite.com', 'yourplatform.com', 'vhsitekh.site', config('app.platform_domain')];
                foreach ($platforms as $plat) {
                    if ($plat && str_ends_with($domainWithoutPort, '.' . $plat)) {
                        $subdomainSlug = str_replace('.' . $plat, '', $domainWithoutPort);
                        break;
                    }
                }
                if ($subdomainSlug) {
                    $storeSetting = Store::where(function ($query) use ($subdomainSlug) {
                        $query->where(function ($q) use ($subdomainSlug) {
                            $slugWithUnderscores = str_replace('-', '_', $subdomainSlug);
                            $slugWithoutDashes = str_replace(['-', '_'], '', $subdomainSlug);
                            
                            $possibleValues = [];
                            $slugs = [$subdomainSlug, $slugWithUnderscores, $slugWithoutDashes];
                            $platforms = ['lvh.me', 'store-frontend-v-hsite.vercel.app', 'vhsite-storefront.vercel.app', 'vhsite.com', 'yourplatform.com', 'vhsitekh.site', config('app.platform_domain')];
                            
                            foreach ($slugs as $s) {
                                $possibleValues[] = $s;
                                $possibleValues[] = $s . '/';
                                $possibleValues[] = 'http://' . $s;
                                $possibleValues[] = 'http://' . $s . '/';
                                $possibleValues[] = 'https://' . $s;
                                $possibleValues[] = 'https://' . $s . '/';
                                
                                foreach ($platforms as $plat) {
                                    if (!$plat) continue;
                                    $possibleValues[] = $s . '.' . $plat;
                                    $possibleValues[] = $s . '.' . $plat . '/';
                                    $possibleValues[] = 'http://' . $s . '.' . $plat;
                                    $possibleValues[] = 'http://' . $s . '.' . $plat . '/';
                                    $possibleValues[] = 'https://' . $s . '.' . $plat;
                                    $possibleValues[] = 'https://' . $s . '.' . $plat . '/';
                                }
                            }
                            
                            $possibleValues = array_unique(array_map('strtolower', array_filter($possibleValues)));
                            
                            $q->where('key', 'custom_domain')
                                ->whereIn(\Illuminate\Support\Facades\DB::raw('LOWER(value)'), $possibleValues);
                        })->orWhere(function ($q) use ($subdomainSlug) {
                            $slugWithSpaces = str_replace('-', ' ', $subdomainSlug);
                            $slugWithUnderscores = str_replace('-', '_', $subdomainSlug);
                            $q->where('key', 'store_name')
                                ->where(function($sq) use ($slugWithSpaces, $slugWithUnderscores, $subdomainSlug) {
                                    $sq->whereRaw("LOWER(value) = ?", [$slugWithSpaces])
                                        ->orWhereRaw("LOWER(value) = ?", [$slugWithUnderscores])
                                        ->orWhereRaw("LOWER(value) = ?", [$subdomainSlug]);
                                });
                        });
                    })->first();
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

        $location = $settings->has('location_store')
            ? json_decode($settings->get('location_store'), true)
            : [
                'store_address' => $settings->get('store_address'),
                'store_latitude' => $settings->get('store_latitude'),
                'store_longitude' => $settings->get('store_longitude'),
            ];

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
            'location_store' => $location,
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

    private function toSnakeCase ($string)
    {
        $str = preg_replace('/[^a-zA-Z0-9\s_]/', '', $string);
        $str = preg_replace('/\s+/', '_', trim($str));
        return strtolower($str);
    }
}
