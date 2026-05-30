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

        $settings = Setting::where('created_by', $ownerId)->get();
        
        $settingsDict = [];
        foreach ($settings as $setting) {
            $settingsDict[$setting->key] = $setting->value;
        }

        return response()->json($settingsDict);
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

        // Return all settings
        $settings = Setting::where('created_by', $user->id)->get();
        $updatedDict = [];
        foreach ($settings as $setting) {
            $updatedDict[$setting->key] = $setting->value;
        }

        return response()->json($updatedDict);
    }
}
