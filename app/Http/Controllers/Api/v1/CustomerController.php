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
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
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

        $customers = $query->skip($skip)->take($limit)->get();
        return response()->json($customers);
    }

    public function show($id)
    {
        $customer = Customer::findOrFail($id);
        return response()->json($customer);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $customer->update($request->only(['name', 'email', 'phone', 'address', 'city', 'user_id']));
        return response()->json($customer);
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete(); // Soft delete

        return response()->json(['detail' => 'Customer record deleted successfully.']);
    }
}
