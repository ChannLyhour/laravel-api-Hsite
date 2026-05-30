<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function admins()
    {
        $admins = User::where('role_id', 1)->get();
        
        // Filter admins who have created menu items
        $filtered = $admins->filter(function ($admin) {
            return MenuItem::where('created_by', $admin->id)->count() > 0;
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
        if ($currentUser->role_id != 1 && $currentUser->id != $user->id) {
            return response()->json(['detail' => 'Not authorized to update this user.'], 403);
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|required|string|min:6',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'image' => 'nullable|string',
            'role_id' => 'sometimes|nullable|integer',
        ]);

        $data = $request->only(['name', 'email', 'phone', 'address', 'city', 'state', 'image']);
        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }
        if ($request->has('role_id') && $currentUser->role_id == 1) {
            $data['role_id'] = $request->role_id;
        }

        $user->update($data);
        return response()->json($user);
    }

    public function destroy(Request $request, $id)
    {
        $currentUser = $request->user();
        if ($currentUser->role_id != 1) {
            return response()->json(['detail' => 'Only administrators can perform this operation.'], 403);
        }

        $user = User::findOrFail($id);
        $user->delete(); // Soft delete

        return response()->json(['detail' => 'User deleted successfully.']);
    }
}
