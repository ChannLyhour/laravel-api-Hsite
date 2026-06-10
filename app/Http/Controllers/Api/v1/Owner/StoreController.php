<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use App\Helpers\UploadHelper;

class StoreController extends Controller
{
    public function index(Request $request)
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

    public function showByOwner($ownerId)
    {
        $storeSettings = Store::where('created_by', $ownerId)->get();
        if ($storeSettings->isEmpty()) {
            return response()->json(['detail' => "Store not found for owner user with ID {$ownerId}"], 404);
        }
        $dict = [
            'id' => intval($ownerId),
            'owner_id' => intval($ownerId),
            'created_by' => intval($ownerId),
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

    public function showMe(Request $request)
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

    public function upsert(Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        $storeKeys = [
            'store_name', 'store_phone', 'store_email', 'store_address',
            'tax_percentage', 'subscription_tier', 'custom_domain',
            'logo_url', 'favicon_url', 'social_tiktok', 'social_facebook',
            'social_telegram', 'shipping_fee', 'free_shipping_threshold',
            'website_theme', 'currency', 'maintenance_mode', 'announcement_text', 'footer_text',
            'payment_methods', 'guest_checkout',
            'pusher_app_id', 'pusher_app_key', 'pusher_app_secret', 'pusher_app_cluster'
        ];

        $data = $request->all();
        foreach ($data as $key => $value) {
            if (!in_array($key, $storeKeys)) {
                continue;
            }

            $val = $value;
            if ($key === 'payment_methods' && (is_array($value) || is_object($value))) {
                $val = json_encode($value);
            }

            Store::updateOrCreate(
                ['created_by' => $user->id, 'key' => $key],
                ['value' => $val]
            );
        }

        if ($request->has('guest_checkout')) {
            Store::where('created_by', $user->id)->update(['guest_checkout' => (bool)$request->guest_checkout]);
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$user->id}");

        $storeSettings = Store::where('created_by', $user->id)->get();
        $dict = [
            'id' => $user->id,
            'owner_id' => $user->id,
            'created_by' => $user->id,
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

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 1) {
            return response()->json(['detail' => 'Access denied. Only administrators can perform this operation.'], 403);
        }

        $request->validate([
            'created_by' => 'required|integer|exists:users,id',
        ]);

        $storeKeys = [
            'store_name', 'store_phone', 'store_email', 'store_address',
            'tax_percentage', 'subscription_tier', 'custom_domain',
            'logo_url', 'favicon_url', 'social_tiktok', 'social_facebook',
            'social_telegram', 'shipping_fee', 'free_shipping_threshold',
            'website_theme', 'currency', 'maintenance_mode', 'announcement_text', 'footer_text',
            'payment_methods', 'guest_checkout',
            'pusher_app_id', 'pusher_app_key', 'pusher_app_secret', 'pusher_app_cluster'
        ];

        $ownerId = $request->created_by;
        $data = $request->all();
        foreach ($data as $key => $value) {
            if (!in_array($key, $storeKeys)) {
                continue;
            }

            $val = $value;
            if ($key === 'payment_methods' && (is_array($value) || is_object($value))) {
                $val = json_encode($value);
            }

            Store::updateOrCreate(
                ['created_by' => $ownerId, 'key' => $key],
                ['value' => $val]
            );
        }

        if ($request->has('guest_checkout')) {
            Store::where('created_by', $ownerId)->update(['guest_checkout' => (bool)$request->guest_checkout]);
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$ownerId}");

        $storeSettings = Store::where('created_by', $ownerId)->get();
        $dict = [
            'id' => $ownerId,
            'owner_id' => $ownerId,
            'created_by' => $ownerId,
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

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
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
            'store_name', 'store_phone', 'store_email', 'store_address',
            'tax_percentage', 'subscription_tier', 'custom_domain',
            'logo_url', 'favicon_url', 'social_tiktok', 'social_facebook',
            'social_telegram', 'shipping_fee', 'free_shipping_threshold',
            'website_theme', 'currency', 'maintenance_mode', 'announcement_text', 'footer_text',
            'payment_methods', 'guest_checkout',
            'pusher_app_id', 'pusher_app_key', 'pusher_app_secret', 'pusher_app_cluster'
        ];

        $data = $request->all();
        foreach ($data as $key => $value) {
            if (!in_array($key, $storeKeys)) {
                continue;
            }

            $val = $value;
            if ($key === 'payment_methods' && (is_array($value) || is_object($value))) {
                $val = json_encode($value);
            }

            Store::updateOrCreate(
                ['created_by' => $ownerId, 'key' => $key],
                ['value' => $val]
            );
        }

        if ($request->has('guest_checkout')) {
            Store::where('created_by', $ownerId)->update(['guest_checkout' => (bool)$request->guest_checkout]);
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$ownerId}");

        $storeSettings = Store::where('created_by', $ownerId)->get();
        $dict = [
            'id' => $ownerId,
            'owner_id' => $ownerId,
            'created_by' => $ownerId,
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

    public function uploadLogo(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
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

    public function uploadFavicon(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
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

    public function getPaymentGateways()
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
                'id' => 'wing',
                'name' => 'Wing Bank',
                'description' => 'Pay securely with WingPay',
                'logoColor' => 'bg-[#84bd00]',
                'textColor' => 'text-blue-900',
                'logoText' => 'Wing',
                'fields' => [
                    ['key' => 'merchantId', 'label' => 'Merchant ID', 'type' => 'text'],
                    ['key' => 'apiKey', 'label' => 'API Key', 'type' => 'password'],
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


    
}

