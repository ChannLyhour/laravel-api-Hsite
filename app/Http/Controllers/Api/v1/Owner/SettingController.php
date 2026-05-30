<?php

namespace App\Http\Controllers\Api\v1\Owner;

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

            // 1. Fetch defaults from the stores table
            $store = \App\Models\Store::where('created_by', $ownerId)->first();
            if ($store) {
                $dict['store_name'] = $store->store_name;
                $dict['store_phone'] = $store->store_phone;
                $dict['store_email'] = $store->store_email;
                $dict['store_address'] = $store->store_address;
                $dict['tax_percentage'] = strval($store->tax_percentage);
                $dict['subscription_tier'] = $store->subscription_tier;
                $dict['custom_domain'] = $store->custom_domain;
                $dict['logo_url'] = $store->logo_url;
                $dict['social_tiktok'] = $store->social_tiktok;
                $dict['social_facebook'] = $store->social_facebook;
                $dict['social_telegram'] = $store->social_telegram;
            }

            // 2. Override with custom key-value settings
            $settings = Setting::where('created_by', $ownerId)->get();
            foreach ($settings as $setting) {
                $dict[$setting->key] = $setting->value;
            }
            return $dict;
        });

        return response()->json($settingsDict)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function updateSettings(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Store owner or admin only.'], 403);
        }

        $request->validate([
            '*' => 'nullable|string',
        ]);

        $settingsDict = $request->all();

        foreach ($settingsDict as $key => $value) {
            Setting::updateOrCreate(
                ['created_by' => $user->id, 'key' => $key],
                ['value' => $value]
            );
        }

        // Also update the stores table to keep it in sync
        $store = \App\Models\Store::where('created_by', $user->id)->first();
        if ($store) {
            $updatedFields = [];
            if (array_key_exists('store_name', $settingsDict)) $updatedFields['store_name'] = $settingsDict['store_name'];
            if (array_key_exists('store_phone', $settingsDict)) $updatedFields['store_phone'] = $settingsDict['store_phone'];
            if (array_key_exists('store_email', $settingsDict)) $updatedFields['store_email'] = $settingsDict['store_email'];
            if (array_key_exists('store_address', $settingsDict)) $updatedFields['store_address'] = $settingsDict['store_address'];
            if (array_key_exists('tax_percentage', $settingsDict)) $updatedFields['tax_percentage'] = floatval($settingsDict['tax_percentage']);
            if (array_key_exists('subscription_tier', $settingsDict)) $updatedFields['subscription_tier'] = $settingsDict['subscription_tier'];
            if (array_key_exists('custom_domain', $settingsDict)) $updatedFields['custom_domain'] = $settingsDict['custom_domain'];
            if (array_key_exists('logo_url', $settingsDict)) $updatedFields['logo_url'] = $settingsDict['logo_url'];
            if (array_key_exists('social_tiktok', $settingsDict)) $updatedFields['social_tiktok'] = $settingsDict['social_tiktok'];
            if (array_key_exists('social_facebook', $settingsDict)) $updatedFields['social_facebook'] = $settingsDict['social_facebook'];
            if (array_key_exists('social_telegram', $settingsDict)) $updatedFields['social_telegram'] = $settingsDict['social_telegram'];

            if (!empty($updatedFields)) {
                $store->update($updatedFields);
            }
        }

        // Clear the cache
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$user->id}");

        // Return all settings
        $settings = Setting::where('created_by', $user->id)->get();
        $updatedDict = [];
        
        // Populate from Store first to return full synced payload
        if ($store) {
            $updatedDict['store_name'] = $store->store_name;
            $updatedDict['store_phone'] = $store->store_phone;
            $updatedDict['store_email'] = $store->store_email;
            $updatedDict['store_address'] = $store->store_address;
            $updatedDict['tax_percentage'] = strval($store->tax_percentage);
            $updatedDict['subscription_tier'] = $store->subscription_tier;
            $updatedDict['custom_domain'] = $store->custom_domain;
            $updatedDict['logo_url'] = $store->logo_url;
            $updatedDict['social_tiktok'] = $store->social_tiktok;
            $updatedDict['social_facebook'] = $store->social_facebook;
            $updatedDict['social_telegram'] = $store->social_telegram;
        }
        
        foreach ($settings as $setting) {
            $updatedDict[$setting->key] = $setting->value;
        }

        return response()->json($updatedDict);
    }
}
