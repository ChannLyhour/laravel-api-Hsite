<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Events\UserStatusUpdated;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
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
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
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
            if ((int)$user->role_id === 2) {
                $user->customer()->create([
                    'name' => $displayName,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'gender' => $user->gender,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'city' => $user->city,
                    'country' => $user->country,
                    'created_by' => $request->created_by ?? $user->created_by,
                ]);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'token' => $token,
                'user' => $user->load('customer')
            ], 201);
        });
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['detail' => 'Incorrect email or password'], 401);
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

    public function loginCustomer(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['detail' => 'Incorrect email or password'], 401);
        }

        // Restrict to customer (role_id not in [1, 30003])
        if (in_array((int)$user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Administrators must log in through the admin portal.'], 403);
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

    public function loginAdmin(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['detail' => 'Incorrect email or password'], 401);
        }

        // Restrict to admin (role_id in [1, 30003])
        if (! in_array((int)$user->role_id, [1, 30003])) {
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

    public function loginOwner(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['detail' => 'Incorrect email or password'], 401);
        }

        // Restrict to owner & admin (role_id in [1, 30003])
        if (! in_array((int)$user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Only store owners and administrators are permitted to log in.'], 403);
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
    public function heartbeat(Request $request)
    {
        $user = $request->user();
        $user->update([
            'is_online'    => true,
            'last_seen_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    }

    /**
     * Mark user offline immediately (called on tab close via navigator.sendBeacon).
     * POST /api/users/offline
     */
    public function markOffline(Request $request)
    {
        $user = $request->user();
        $user->update([
            'is_online'    => false,
            'last_seen_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    }


    /**
     * Logout — revoke token and mark user offline.
     * POST /api/logout
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        $user->update(['is_online' => false, 'last_seen_at' => now()]);
        $user->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }


    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request)
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

        // Sync with Customer if the user is a customer (role_id=2)
        if ((int)$user->role_id === 2) {
            $customer = \App\Models\Customer::where('user_id', $user->id)->first();
            if ($customer) {
                $customer->update($request->only(['name', 'first_name', 'last_name', 'gender', 'email', 'phone', 'address', 'city', 'country']));
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    public function socialLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email|max:255',
            'name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'image' => 'nullable|string',
            'created_by' => 'nullable|integer|exists:users,id',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
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

                // Create customer record
                $user->customer()->create([
                    'name' => $request->name,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $request->email,
                    'created_by' => $request->created_by,
                ]);
            } else {
                // If user exists, check if they need a customer record
                if ((int)$user->role_id === 2 && !$user->customer) {
                    $firstName = $request->first_name ?: $user->first_name;
                    $lastName = $request->last_name ?: $user->last_name;
                    if (empty($firstName) && empty($lastName)) {
                        $parts = explode(' ', $request->name ?: $user->name, 2);
                        $firstName = $parts[0] ?? $user->name;
                        $lastName = $parts[1] ?? '';
                    }

                    $user->customer()->create([
                        'name' => $request->name ?: $user->name,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'email' => $request->email ?: $user->email,
                        'created_by' => $request->created_by ?? $user->created_by,
                    ]);
                }
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            // Mark user as online and broadcast status
            $user->update(['is_online' => true, 'last_seen_at' => now()]);
            $user->refresh();

            if (class_exists(\App\Events\UserStatusUpdated::class)) {
                \App\Events\UserStatusUpdated::broadcastForUser($user);
            }

            return response()->json([
                'success' => true,
                'message' => 'Logged in successfully via social login',
                'token' => $token,
                'user' => $user->load('customer')
            ], 200);
        });
    }
}
