<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\ShippingAddress;
use Illuminate\Http\Request;

class ShippingAddressController extends Controller
{
    /**
     * Display a listing of the user's shipping addresses.
     */
    public function index(Request $request)
    {
        $addresses = $request->user()->shippingAddresses;
        return response()->json($addresses);
    }

    /**
     * Store a newly created shipping address in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'telephone' => 'required|string|max:255',
            'address' => 'required|string',
            'country' => 'nullable|string|max:255',
            'city_province' => 'required|string|max:255',
            'set_as_default' => 'boolean',
        ]);

        $user = $request->user();

        // If this is set as default, unset other defaults
        if ($request->set_as_default) {
            $user->shippingAddresses()->update(['set_as_default' => false]);
        }

        // If this is the user's first address, make it default regardless
        $isFirst = $user->shippingAddresses()->count() === 0;

        $address = $user->shippingAddresses()->create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'telephone' => $request->telephone,
            'address' => $request->address,
            'country' => $request->country,
            'city_province' => $request->city_province,
            'set_as_default' => $isFirst || $request->set_as_default,
        ]);

        return response()->json($address, 201);
    }

    /**
     * Display the specified shipping address.
     */
    public function show(Request $request, $id)
    {
        $address = $request->user()->shippingAddresses()->findOrFail($id);
        return response()->json($address);
    }

    /**
     * Update the specified shipping address in storage.
     */
    public function update(Request $request, $id)
    {
        $address = $request->user()->shippingAddresses()->findOrFail($id);

        $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'telephone' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string',
            'country' => 'nullable|string|max:255',
            'city_province' => 'sometimes|required|string|max:255',
            'set_as_default' => 'boolean',
        ]);

        if ($request->set_as_default && !$address->set_as_default) {
            $request->user()->shippingAddresses()->update(['set_as_default' => false]);
        }

        $address->update($request->all());

        return response()->json($address);
    }

    /**
     * Remove the specified shipping address from storage.
     */
    public function destroy(Request $request, $id)
    {
        $address = $request->user()->shippingAddresses()->findOrFail($id);
        $wasDefault = $address->set_as_default;
        
        $address->delete();

        // If we deleted the default, set the latest one as default
        if ($wasDefault) {
            $latest = $request->user()->shippingAddresses()->latest()->first();
            if ($latest) {
                $latest->update(['set_as_default' => true]);
            }
        }

        return response()->json(['detail' => 'Shipping address deleted successfully.']);
    }

    /**
     * Set a specific address as default.
     */
    public function setDefault(Request $request, $id)
    {
        $user = $request->user();
        $address = $user->shippingAddresses()->findOrFail($id);

        $user->shippingAddresses()->update(['set_as_default' => false]);
        $address->update(['set_as_default' => true]);

        return response()->json(['detail' => 'Default shipping address updated.', 'address' => $address]);
    }
}
