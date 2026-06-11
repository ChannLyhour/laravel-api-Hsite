<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function getSettings(Request $request)
    {
        $ownerId = $request->query('owner_id', 1);

        $settingsDict = \Illuminate\Support\Facades\Cache::remember("settings_owner_{$ownerId}", 3600, function () use ($ownerId) {
            $dict = [];

            // 1. Fetch custom key-value settings from Setting table first
            $settings = Setting::where('created_by', $ownerId)->get();
            foreach ($settings as $setting) {
                $dict[$setting->key] = $setting->value;
            }

            // 2. Override/populate with primary settings from the stores table (so Store table is the source of truth)
            $storeSettings = \App\Models\Store::where('created_by', $ownerId)->get();
            foreach ($storeSettings as $item) {
                if ($item->key === 'tax_percentage') {
                    $dict[$item->key] = strval($item->value);
                } else {
                    $dict[$item->key] = $item->value;
                }
            }

            // 3. Populate/override with user profile fields to ensure identity sync
            $owner = \App\Models\User::find($ownerId);
            if ($owner) {
                $dict['first_name'] = $owner->first_name;
                $dict['last_name'] = $owner->last_name;
                $dict['gender'] = $owner->gender;
                $dict['country'] = $owner->country;
                $dict['name'] = $owner->name;
                // Also provide email and phone if not already set by store keys
                if (!isset($dict['store_email'])) $dict['store_email'] = $owner->email;
                if (!isset($dict['store_phone'])) $dict['store_phone'] = $owner->phone;
            }

            return $dict;
        });

        return response()->json($settingsDict)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function updateSettings(Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 1) {
            return response()->json(['detail' => 'Access denied. Only administrators are authorized to perform this operation.'], 403);
        }

        $request->validate([
            '*' => 'nullable',
        ]);

        $settingsDict = $request->all();

        // If the user is an admin, check if owner_id is passed in request to update that owner's settings
        $ownerId = $user->id;
        if ($user->role_id === 1) {
            if ($request->has('owner_id')) {
                $ownerId = intval($request->input('owner_id'));
            } elseif ($request->query('owner_id')) {
                $ownerId = intval($request->query('owner_id'));
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
            'first_name',
            'last_name',
            'gender',
            'country',
            'name',
            'pusher_app_id',
            'pusher_app_key',
            'pusher_app_secret',
            'pusher_app_cluster',
            'google_client_id',
            'google_client_secret',
            'google_enabled',
            'facebook_app_id',
            'facebook_app_secret',
            'facebook_enabled'
        ];

        foreach ($settingsDict as $key => $value) {
            if ($key === 'owner_id') continue;

            if (in_array($key, $storeKeys)) {
                // Keep it in Store table
                \App\Models\Store::updateOrCreate(
                    ['created_by' => $ownerId, 'key' => $key],
                    ['value' => $value]
                );
                // Ensure it is deleted from Setting table to prevent duplication or override issues
                Setting::where('created_by', $ownerId)->where('key', $key)->delete();
            } else {
                // Save to Setting table
                Setting::updateOrCreate(
                    ['created_by' => $ownerId, 'key' => $key],
                    ['value' => $value]
                );
                // Ensure it is deleted from Store table to prevent duplication or override issues
                \App\Models\Store::where('created_by', $ownerId)->where('key', $key)->delete();
            }
        }

        // Sync with User model if identity fields are present
        $owner = \App\Models\User::find($ownerId);
        if ($owner) {
            $userData = [];
            if (isset($settingsDict['name'])) $userData['name'] = $settingsDict['name'];
            if (isset($settingsDict['first_name'])) $userData['first_name'] = $settingsDict['first_name'];
            if (isset($settingsDict['last_name'])) $userData['last_name'] = $settingsDict['last_name'];
            if (isset($settingsDict['gender'])) $userData['gender'] = $settingsDict['gender'];
            if (isset($settingsDict['country'])) $userData['country'] = $settingsDict['country'];

            if (!empty($userData)) {
                $owner->update($userData);
            }
        }

        // Clear the cache
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$ownerId}");

        // Return all settings
        $settings = Setting::where('created_by', $ownerId)->get();
        $updatedDict = [];

        // Populate from Setting first
        foreach ($settings as $setting) {
            $updatedDict[$setting->key] = $setting->value;
        }

        // Override/populate from Store last to ensure correct values are returned
        $storeSettings = \App\Models\Store::where('created_by', $ownerId)->get();
        foreach ($storeSettings as $item) {
            if ($item->key === 'tax_percentage') {
                $updatedDict[$item->key] = strval($item->value);
            } else {
                $updatedDict[$item->key] = $item->value;
            }
        }

        // Final override from User table to ensure identity sync in response
        if ($owner) {
            $updatedDict['first_name'] = $owner->first_name;
            $updatedDict['last_name'] = $owner->last_name;
            $updatedDict['gender'] = $owner->gender;
            $updatedDict['country'] = $owner->country;
            $updatedDict['name'] = $owner->name;
        }

        return response()->json($updatedDict);
    }

    public function uploadLogo(Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 1) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $path = \App\Helpers\UploadHelper::uploadImage($request->file('logo'), 'settings/logo');
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
        if ($user->role_id !== 1) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        $request->validate([
            'favicon' => 'required|file|mimes:jpeg,png,jpg,gif,svg,ico,webp|max:1024',
        ]);

        if ($request->hasFile('favicon')) {
            $path = \App\Helpers\UploadHelper::uploadImage($request->file('favicon'), 'settings/favicon');
            return response()->json([
                'url' => asset($path),
                'path' => $path
            ]);
        }

        return response()->json(['detail' => 'No file provided.'], 400);
    }
}
