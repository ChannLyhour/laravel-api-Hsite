<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'nullable|string|in:male,female',
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'gender' => $request->gender,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
            'country' => $request->country,
            'user_id' => $request->user_id,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($customer, 201);
    }

    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $user = $request->user();
        $query = Customer::query();

        if ($user && $user->role_id != 1) {
            $query->where('created_by', $user->id);
        }

        $customers = $query->with('user')->skip($skip)->take($limit)->get();
        return response()->json($customers);
    }

    public function show($id)
    {
        $customer = Customer::with('user')->findOrFail($id);
        return response()->json($customer);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::with('user')->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'nullable|string|in:male,female',
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'image' => 'nullable',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $updateData = $request->only(['name', 'first_name', 'last_name', 'gender', 'email', 'phone', 'address', 'city', 'country', 'user_id']);
        $customer->update($updateData);

        // Sync with User if user_id is present
        if ($customer->user_id) {
            $user = \App\Models\User::find($customer->user_id);
            if ($user) {
                $userData = $request->only(['name', 'first_name', 'last_name', 'gender', 'email', 'phone', 'address', 'city', 'country']);
                
                if ($request->hasFile('image')) {
                    $userData['image'] = \App\Helpers\UploadHelper::updateImage($user->getRawOriginal('image'), $request->file('image'), 'users');
                } elseif ($request->has('image')) {
                    $userData['image'] = $request->image;
                }
                
                $user->update($userData);
            }
        }

        return response()->json($customer);
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete(); // Soft delete

        return response()->json(['detail' => 'Customer record deleted successfully.']);
    }
}
