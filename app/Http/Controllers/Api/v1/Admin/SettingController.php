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
            'store_name', 'store_phone', 'store_email', 'store_address',
            'tax_percentage', 'subscription_tier', 'custom_domain',
            'logo_url', 'favicon_url', 'social_tiktok', 'social_facebook',
            'social_telegram', 'shipping_fee', 'free_shipping_threshold',
            'website_theme', 'currency', 'maintenance_mode', 'announcement_text', 'footer_text'
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

        return response()->json($updatedDict);
    }
}

