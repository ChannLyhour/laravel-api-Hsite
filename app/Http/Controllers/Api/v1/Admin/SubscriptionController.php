<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SubscriptionController extends Controller
{
    /**
     * Get system-wide plan features.
     */
    public function getFeatures(Request $request)
    {
        $setting = Setting::where('key', 'biteflow_plan_features')->first();
        
        if ($setting) {
            $features = json_decode($setting->value, true);
            if ($features) {
                return response()->json($features);
            }
        }

        // Return the default features if not configured in database
        $defaults = [
            'free' => [
                'Products Limit:10 Products',
                'Categories Limit:2 Categories',
                'Orders Limit:10 Orders/mo',
                'Staff Limit:0 Staff',
                'Online Ordering',
                'Customer Reviews',
                'QR Payment',
            ],
            'basic' => [
                'Products Limit:35 Products',
                'Categories Limit:4 Categories',
                'Orders Limit:Unlimited Orders/mo',
                'Staff Limit:Unlimited Staff',
                'Online Ordering',
                'Customer Reviews',
                'Reservations',
                'Analytics & Reports',
                'QR Payment',
            ],
            'standard' => [
                'Products Limit:150 Products',
                'Categories Limit:10 Categories',
                'Orders Limit:Unlimited Orders/mo',
                'Staff Limit:Unlimited Staff',
                'Online Ordering',
                'Customer Reviews',
                'Reservations',
                'Analytics & Reports',
                'Delivery Zones',
                'Coupons & Discounts',
                'QR Payment',
                'Staff Accounts',
                'POS System',
            ],
            'premium' => [
                'Products Limit:Unlimited Products',
                'Categories Limit:Unlimited Categories',
                'Orders Limit:Unlimited Orders/mo',
                'Staff Limit:Unlimited Staff',
                'Online Ordering',
                'Customer Reviews',
                'Reservations',
                'Analytics & Reports',
                'Delivery Zones',
                'Coupons & Discounts',
                'QR Payment',
                'Email Campaigns',
                'Loyalty Program',
                'Custom Domain',
                'Inventory Management',
                'Staff Accounts',
                'POS System',
            ],
        ];

        return response()->json($defaults);
    }

    /**
     * Update system-wide plan features.
     */
    public function updateFeatures(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role_id !== 1) {
            return response()->json(['detail' => 'Access denied. Only administrators can manage subscription settings.'], 403);
        }

        $request->validate([
            'free' => 'required|array',
            'basic' => 'required|array',
            'standard' => 'required|array',
            'premium' => 'required|array',
        ]);

        $features = $request->only(['free', 'basic', 'standard', 'premium']);

        Setting::updateOrCreate(
            ['key' => 'biteflow_plan_features', 'created_by' => 1],
            ['value' => json_encode($features)]
        );

        // Clear settings cache for owner 1 (system settings)
        Cache::forget('settings_owner_1');

        return response()->json([
            'message' => 'Subscription plan features updated successfully.',
            'features' => $features
        ]);
    }
}
