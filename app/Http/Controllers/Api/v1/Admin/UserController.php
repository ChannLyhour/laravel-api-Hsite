<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function admins()
    {
        // Include both super admins (role_id=1) and store owners (role_id=30003)
        $admins = User::whereIn('role_id', [1, 30003])->get();
        
        // Filter to those who have created menu items (active storefronts)
        $filtered = $admins->filter(function ($admin) {
            return Product::where('created_by', $admin->id)->count() > 0;
        });

        // Map to minimum public profile
        $publicAdmins = $filtered->map(function ($admin) {
            return [
                'id' => $admin->id,
                'name' => $admin->name,
                'city' => $admin->city,
                'image' => $admin->image,
            ];
        })->values();

        return response()->json($publicAdmins);
    }

    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $users = User::skip($skip)->take($limit)->get();
        return response()->json($users);
    }

    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        // Authorize: Admin or the user themselves
        $currentUser = $request->user();
        if (! in_array($currentUser->role_id, [1, 30003]) && $currentUser->id != $user->id) {
            return response()->json(['detail' => 'Not authorized to update this user.'], 403);
        }

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
            'role_id' => 'sometimes|nullable|integer',
        ]);

        $data = $request->only(['name', 'first_name', 'last_name', 'gender', 'email', 'phone', 'address', 'city', 'country', 'state']);
        
        if ($request->hasFile('image')) {
            $data['image'] = \App\Helpers\UploadHelper::updateImage($user->getRawOriginal('image'), $request->file('image'), 'users');
        } elseif ($request->has('image')) {
            $data['image'] = $request->image;
        }

        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }
        if ($request->has('role_id') && in_array($currentUser->role_id, [1, 30003])) {
            $data['role_id'] = $request->role_id;
        }

        $user->update($data);

        // Sync with Customer if the user is a customer (role_id=2)
        if ((int)$user->role_id === 2) {
            $customer = \App\Models\Customer::where('user_id', $user->id)->first();
            if ($customer) {
                $customer->update($request->only(['name', 'first_name', 'last_name', 'gender', 'email', 'phone', 'address', 'city', 'country']));
            }
        }

        return response()->json($user);
    }

    public function destroy(Request $request, $id)
    {
        $currentUser = $request->user();
        if (! in_array($currentUser->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators can perform this operation.'], 403);
        }

        $user = User::findOrFail($id);
        $user->delete(); // Soft delete

        return response()->json(['detail' => 'User deleted successfully.']);
    }
}
