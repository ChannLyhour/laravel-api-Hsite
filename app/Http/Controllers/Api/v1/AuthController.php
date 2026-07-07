<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Customer;
use App\Events\UserStatusUpdated;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register (Request $request)
    {
        $storeId = $request->input('store_id') ?? $request->input('created_by');

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'name' => 'nullable|string|max:255',
            'gender' => 'nullable|string|in:male,female',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role_id' => 'nullable|integer',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'state' => 'nullable|string',
            'image' => 'nullable|string',
            'created_by' => 'nullable|integer|exists:users,id',
            'store_id' => 'nullable|integer|exists:users,id',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $storeId) {
            $displayName = $request->name ?: $request->first_name . ' ' . $request->last_name;

            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = \App\Helpers\UploadHelper::uploadImage($request->file('image'), 'users');
            } elseif ($request->has('image')) {
                $imagePath = $request->image;
            }

            $user = User::create([
                'name' => $displayName,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'gender' => $request->gender,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => $request->role_id ?? 2,
                'phone' => $request->phone,
                'address' => $request->address,
                'city' => $request->city,
                'country' => $request->country,
                'state' => $request->state ?? 'active',
                'image' => $imagePath,
                'created_by' => $request->created_by,
            ]);

            // If the user's role is a customer (default role_id=2), create a corresponding Customer model entry
            if ((int) $user->role_id === 2 && $storeId) {
                $user->customers()->create([
                    'store_id' => $storeId,
                    'name' => $displayName,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'gender' => $user->gender,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'city' => $user->city,
                    'country' => $user->country,
                    'created_by' => $storeId,
                ]);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'token' => $token,
                'user' => $user->load('customers')
            ], 201);
        });
    }

    public function login (Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $loginValue = trim($request->email);
        $isEmail = filter_var($loginValue, FILTER_VALIDATE_EMAIL);

        if ($isEmail) {
            $user = User::where('email', $loginValue)->first();
        } else {
            $normalizedPhone = \App\Helpers\TelegramOTPAcc::normalizeCambodianPhone($loginValue);
            $user = User::where('phone', $normalizedPhone)->first();

            if (!$user) {
                $phoneClean = preg_replace('/[^0-9]/', '', $loginValue);
                if (strlen($phoneClean) >= 8) {
                    $phoneSuffix = substr($phoneClean, -8);
                    $user = User::where('phone', 'LIKE', '%' . $phoneSuffix)->first();
                } else {
                    $user = User::where('phone', $loginValue)->first();
                }
            }
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['detail' => 'Incorrect email, phone number, or password'], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Mark user as online and broadcast status
        $user->update(['is_online' => true, 'last_seen_at' => now()]);
        $user->refresh();
        UserStatusUpdated::broadcastForUser($user);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer'
        ]);
    }

    public function loginCustomer (Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
            'store_id' => 'nullable|integer',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['detail' => 'Incorrect email or password'], 401);
        }

        // Restrict to customer (role_id not in [1, 30003])
        if (in_array((int) $user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Administrators must log in through the admin portal.'], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Mark user as online and broadcast status
        $user->update(['is_online' => true, 'last_seen_at' => now()]);
        $user->refresh();
        UserStatusUpdated::broadcastForUser($user);

        // Load customer data scoped by store if store_id is provided
        $response = [
            'access_token' => $token,
            'token_type' => 'bearer'
        ];

        if ($request->store_id) {
            $customer = $user->customerForStore($request->store_id);
            $response['customer'] = $customer;
        } else {
            $response['customers'] = $user->customers;
        }

        return response()->json($response);
    }

    public function loginAdmin (Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['detail' => 'Incorrect email or password'], 401);
        }

        // Restrict to admin (role_id in [1, 30003])
        if (!in_array((int) $user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Only administrators are permitted to log in.'], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Mark user as online and broadcast status
        $user->update(['is_online' => true, 'last_seen_at' => now()]);
        $user->refresh();
        UserStatusUpdated::broadcastForUser($user);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer'
        ]);
    }

    public function loginOwner (Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['detail' => 'Incorrect email or password'], 401);
        }

        // Restrict exclusively to store owners (role_id = 30003)
        if ((int) $user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Only store owners are permitted to log in.'], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Mark user as online and broadcast status
        $user->update(['is_online' => true, 'last_seen_at' => now()]);
        $user->refresh();
        UserStatusUpdated::broadcastForUser($user);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer'
        ]);
    }

    /**
     * Heartbeat — keep user marked online & refresh last_seen_at.
     * Called by frontend every 60 seconds while the tab is open.
     * POST /api/users/heartbeat
     */
    public function heartbeat (Request $request)
    {
        $user = $request->user();
        $user->update([
            'is_online' => true,
            'last_seen_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    }

    /**
     * Mark user offline immediately (called on tab close via navigator.sendBeacon).
     * POST /api/users/offline
     */
    public function markOffline (Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->update([
                'is_online' => false,
                'last_seen_at' => now(),
            ]);
            $user->refresh();
            if (class_exists(\App\Events\UserStatusUpdated::class)) {
                \App\Events\UserStatusUpdated::broadcastForUser($user);
            }
        }
        return response()->json(['ok' => true]);
    }


    /**
     * Logout — revoke token and mark user offline.
     * POST /api/logout
     */
    public function logout (Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->update(['is_online' => false, 'last_seen_at' => now()]);
            $user->refresh();

            $token = $user->currentAccessToken();
            if ($token && method_exists($token, 'delete')) {
                $token->delete();
            } else {
                $user->tokens()->delete();
            }

            if (class_exists(\App\Events\UserStatusUpdated::class)) {
                \App\Events\UserStatusUpdated::broadcastForUser($user);
            }
        }
        return response()->json(['message' => 'Logged out successfully']);
    }


    public function me (Request $request)
    {
        return response()->json($request->user());
    }

    public function update (Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'nullable|string|in:male,female',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|required|string|min:6',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'state' => 'nullable|string',
            'image' => 'nullable',
            'store_id' => 'nullable|integer',
        ]);

        $data = $request->only(['name', 'first_name', 'last_name', 'gender', 'email', 'phone', 'address', 'city', 'country', 'state']);

        if ($request->hasFile('image')) {
            $data['image'] = \App\Helpers\UploadHelper::updateImage($user->getRawOriginal('image'), $request->file('image'), 'users');
        } elseif ($request->has('image') && is_string($request->image)) {
            $data['image'] = $request->image;
        }

        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        // Sync with Customer records if the user is a customer (role_id=2)
        if ((int) $user->role_id === 2) {
            $customerData = $request->only(['name', 'first_name', 'last_name', 'gender', 'email', 'phone', 'address', 'city', 'country']);

            if ($request->store_id) {
                // Update only the specific store's customer record
                $customer = $user->customerForStore($request->store_id);
                if ($customer) {
                    $customer->update($customerData);
                }
            } else {
                // Update all customer records for this user
                Customer::where('user_id', $user->id)->update($customerData);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    public function socialLogin (Request $request)
    {
        $request->validate([
            'email' => 'required|string|email|max:255',
            'name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'image' => 'nullable|string',
            'created_by' => 'nullable|integer|exists:users,id',
            'store_id' => 'nullable|integer|exists:users,id',
        ]);

        $storeId = $request->input('store_id') ?? $request->input('created_by');

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $storeId) {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                // Determine first/last name
                $firstName = $request->first_name;
                $lastName = $request->last_name;
                if (empty($firstName) && empty($lastName)) {
                    $parts = explode(' ', $request->name, 2);
                    $firstName = $parts[0] ?? $request->name;
                    $lastName = $parts[1] ?? '';
                }

                $user = User::create([
                    'name' => $request->name,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $request->email,
                    'password' => Hash::make(\Illuminate\Support\Str::random(16)),
                    'role_id' => 2, // Customer
                    'state' => 'active',
                    'image' => $request->image,
                    'created_by' => $request->created_by,
                ]);

                // Create store-scoped customer record
                if ($storeId) {
                    $user->customers()->create([
                        'store_id' => $storeId,
                        'name' => $request->name,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'email' => $request->email,
                        'created_by' => $storeId,
                    ]);
                }
            } else {
                // If user exists, check if they need a customer record for this store
                if ((int) $user->role_id === 2 && $storeId) {
                    $existingCustomer = $user->customerForStore($storeId);
                    if (!$existingCustomer) {
                        $firstName = $request->first_name ?: $user->first_name;
                        $lastName = $request->last_name ?: $user->last_name;
                        if (empty($firstName) && empty($lastName)) {
                            $parts = explode(' ', $request->name ?: $user->name, 2);
                            $firstName = $parts[0] ?? $user->name;
                            $lastName = $parts[1] ?? '';
                        }

                        $user->customers()->create([
                            'store_id' => $storeId,
                            'name' => $request->name ?: $user->name,
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'email' => $request->email ?: $user->email,
                            'created_by' => $storeId,
                        ]);
                    }
                }
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            // Mark user as online and broadcast status
            $user->update(['is_online' => true, 'last_seen_at' => now()]);
            $user->refresh();

            if (class_exists(\App\Events\UserStatusUpdated::class)) {
                \App\Events\UserStatusUpdated::broadcastForUser($user);
            }

            $response = [
                'success' => true,
                'message' => 'Logged in successfully via social login',
                'token' => $token,
                'user' => $user->load('customers'),
            ];

            // Include the specific store's customer if store_id was provided
            if ($storeId) {
                $response['customer'] = $user->customerForStore($storeId);
            }

            return response()->json($response, 200);
        });
    }

    /**
     * Register a new Store Owner account with associated store configuration.
     * This is a public endpoint — no authentication required.
     * Creates the user (role_id=30003) and their store key-value settings in one transaction.
     *
     * POST /api/register-owner
     */
    public function registerOwner (Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'store_name' => 'required|string|max:255',
            'store_address' => 'nullable|string|max:500',
            'subscription_tier' => 'nullable|string|in:free,basic,standard,premium',
            'phone' => 'nullable|string',
            'country' => 'nullable|string',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $displayName = $request->first_name . ' ' . $request->last_name;

            // 1. Create owner user with role_id = 30003
            $user = User::create([
                'name' => $displayName,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => 30003, // Store Owner
                'phone' => $request->phone,
                'country' => $request->country ?? 'Cambodia',
                'state' => 'active',
            ]);

            // 2. Create store key-value settings for the new owner
            $storeDefaults = [
                'store_name' => $request->store_name,
                'store_email' => $request->email,
                'store_phone' => $request->phone,
                'store_address' => $request->store_address,
                'location_store' => json_encode([
                    'store_address' => $request->store_address ?? '',
                    'store_latitude' => '',
                    'store_longitude' => '',
                ]),
                'subscription_tier' => $request->subscription_tier ?? 'free',
                'tax_percentage' => '10',
                'currency' => 'USD',
                'guest_checkout' => 'true',
                'maintenance_mode' => 'false',
            ];

            foreach ($storeDefaults as $key => $value) {
                if ($value === null)
                    continue;
                \App\Models\Store::create([
                    'created_by' => $user->id,
                    'key' => $key,
                    'value' => $value,
                ]);
            }

            // 3. Generate auth token
            $token = $user->createToken('auth-token')->plainTextToken;

            // 4. Mark user as online
            $user->update(['is_online' => true, 'last_seen_at' => now()]);
            $user->refresh();

            if (class_exists(\App\Events\UserStatusUpdated::class)) {
                UserStatusUpdated::broadcastForUser($user);
            }

            return response()->json([
                'success' => true,
                'message' => 'Owner registered successfully',
                'token' => $token,
                'user' => $user,
            ], 201);
        });
    }

    /**
     * Delete the authenticated user account and all associated store details.
     *
     * DELETE /api/users/me
     */
    public function deleteAccount (Request $request)
    {
        $user = $request->user();

        return \Illuminate\Support\Facades\DB::transaction(function () use ($user) {
            if ((int) $user->role_id === 30003) {
                // Store Owner - clean up all store details

                // 1. Physically delete uploaded files from server disk
                $ownerUser = \Illuminate\Support\Facades\DB::table('users')->where('id', $user->id)->first();
                if ($ownerUser && $ownerUser->image) {
                    \App\Helpers\UploadHelper::deleteImage($ownerUser->image);
                }

                $storeSetting = \Illuminate\Support\Facades\DB::table('stores')->where('created_by', $user->id)->where('key', 'brand_identity_operations')->first();
                if ($storeSetting) {
                    $brandOps = json_decode($storeSetting->value, true);
                    if ($brandOps) {
                        if (!empty($brandOps['store_logo'])) {
                            \App\Helpers\UploadHelper::deleteImage($brandOps['store_logo']);
                        }
                        if (!empty($brandOps['store_favicon'])) {
                            \App\Helpers\UploadHelper::deleteImage($brandOps['store_favicon']);
                        }
                    }
                }

                $productIds = \Illuminate\Support\Facades\DB::table('products')->where('created_by', $user->id)->pluck('id');
                
                $productImages = \Illuminate\Support\Facades\DB::table('product_images')->whereIn('product_id', $productIds)->pluck('image')->toArray();
                foreach ($productImages as $img) {
                    \App\Helpers\UploadHelper::deleteImage($img);
                }

                $addonImages = \Illuminate\Support\Facades\DB::table('product_addons')->whereIn('product_id', $productIds)->pluck('image')->toArray();
                foreach ($addonImages as $img) {
                    \App\Helpers\UploadHelper::deleteImage($img);
                }

                $bannerImages = \Illuminate\Support\Facades\DB::table('banners')->where('created_by', $user->id)->pluck('image')->toArray();
                foreach ($bannerImages as $img) {
                    \App\Helpers\UploadHelper::deleteImage($img);
                }

                $brandImages = \Illuminate\Support\Facades\DB::table('brands')->where('created_by', $user->id)->pluck('logo')->toArray();
                foreach ($brandImages as $img) {
                    \App\Helpers\UploadHelper::deleteImage($img);
                }

                $categoryImages = \Illuminate\Support\Facades\DB::table('categories')->where('created_by', $user->id)->pluck('image')->toArray();
                foreach ($categoryImages as $img) {
                    \App\Helpers\UploadHelper::deleteImage($img);
                }

                // 2. Clear from database
                $variantIds = \App\Models\ProductVariant::whereIn('product_id', $productIds)->pluck('id');

                // Delete product associations
                \Illuminate\Support\Facades\DB::table('product_variant_attribute_values')->whereIn('product_variant_id', $variantIds)->delete();
                \App\Models\ProductVariant::whereIn('id', $variantIds)->delete();
                \App\Models\ProductImage::whereIn('product_id', $productIds)->delete();
                \App\Models\ProductAddon::whereIn('product_id', $productIds)->delete();
                \App\Models\ProductTranslation::whereIn('product_id', $productIds)->delete();
                \App\Models\ProductRating::whereIn('product_id', $productIds)->delete();
                \App\Models\Cart::whereIn('product_id', $productIds)->delete();
                \App\Models\Product::whereIn('id', $productIds)->delete();

                // Delete attributes & their values
                $attributeIds = \App\Models\ProductAttribute::where('created_by', $user->id)->pluck('id');
                \App\Models\ProductAttributeValue::whereIn('product_attribute_id', $attributeIds)->delete();
                \App\Models\ProductAttribute::whereIn('id', $attributeIds)->delete();

                // Delete marketing offers & campaigns
                \App\Models\Banner::where('created_by', $user->id)->delete();
                \App\Models\Coupon::where('created_by', $user->id)->delete();
                \App\Models\FlashDeal::where('created_by', $user->id)->delete();
                \App\Models\FeaturedDeal::where('created_by', $user->id)->delete();
                \App\Models\ClearanceSale::where('created_by', $user->id)->delete();

                // Delete delivery methods & zones
                \App\Models\DeliveryMethod::where('created_by', $user->id)->delete();
                \App\Models\DeliveryZone::where('created_by', $user->id)->delete();

                // Delete other store elements
                \App\Models\Category::where('created_by', $user->id)->delete();
                \App\Models\Brand::where('created_by', $user->id)->delete();
                \App\Models\ProductBadge::where('created_by', $user->id)->delete();
                \App\Models\SocialMedia::where('created_by', $user->id)->delete();
                \App\Models\StoreDomain::where('owner_id', $user->id)->delete();
                \App\Models\StorePage::where('owner_id', $user->id)->delete();
                \App\Models\Page::where('created_by', $user->id)->delete();
                \App\Models\Post::where('user_id', $user->id)->delete();
                \App\Models\StoreThemeHistory::where('owner_id', $user->id)->delete();

                // Delete chat conversations
                $conversationIds = \App\Models\Conversation::where('store_id', $user->id)->orWhere('created_by', $user->id)->pluck('id');
                \App\Models\Message::whereIn('conversation_id', $conversationIds)->delete();
                \App\Models\Participant::whereIn('conversation_id', $conversationIds)->delete();
                \App\Models\Conversation::whereIn('id', $conversationIds)->delete();

                // Delete payments and transactions
                $orderIds = \App\Models\Order::where('store_id', $user->id)->pluck('id');
                \App\Models\OrderItem::whereIn('order_id', $orderIds)->delete();
                \App\Models\Payment::whereIn('order_id', $orderIds)->delete();
                \App\Models\PaymentTransaction::whereIn('order_id', $orderIds)->delete();
                \App\Models\Order::whereIn('id', $orderIds)->delete();

                // Delete templates purchases
                \App\Models\TemplatePurchase::where('user_id', $user->id)->delete();
                \App\Models\TemplateDownloadToken::where('user_id', $user->id)->delete();

                // Delete customer lists
                \App\Models\Customer::where('store_id', $user->id)->delete();

                // Delete store settings configuration
                \App\Models\Store::where('created_by', $user->id)->delete();
            } else if ((int) $user->role_id === 2) {
                // Customer - clean up customer specific info
                if ($user->image) {
                    \App\Helpers\UploadHelper::deleteImage($user->image);
                }
                \App\Models\Customer::where('user_id', $user->id)->delete();
                \App\Models\Cart::where('user_id', $user->id)->delete();
                \App\Models\ShippingAddress::where('user_id', $user->id)->delete();
                \App\Models\TemplatePurchase::where('user_id', $user->id)->delete();
                \App\Models\TemplateDownloadToken::where('user_id', $user->id)->delete();
            }

            // Revoke active tokens and force delete the user
            $user->tokens()->delete();
            $user->forceDelete();

            return response()->json([
                'success' => true,
                'message' => 'Account and all associated store data deleted successfully.'
            ]);
        });
    }
}
