<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\ProductAttribute;
use App\Models\ProductAttributeValue;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductAttributeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = ProductAttribute::query()->with('values');

        if ($user && $user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            $createdBy = $request->query('created_by');
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
        }

        $attributes = $query->get();
        return response()->json($attributes);
    }

    public function store(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['message' => 'Only administrators are allowed to create attributes.'], 403);
        }

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('product_attributes')->where(function ($query) use ($request) {
                    return $query->where('created_by', $request->user()->id);
                }),
            ],
        ]);

        $attribute = ProductAttribute::create([
            'name' => $request->name,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($attribute, 201);
    }

    public function storeValue(Request $request, $attributeId)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['message' => 'Only administrators are allowed to add values.'], 403);
        }

        $attribute = ProductAttribute::findOrFail($attributeId);

        $request->validate([
            'value' => 'required|string|max:255',
        ]);

        // Check uniqueness for this specific attribute value pair
        $exists = ProductAttributeValue::where('product_attribute_id', $attribute->id)
            ->where('value', $request->value)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'This value already exists for this attribute.'], 400);
        }

        $value = ProductAttributeValue::create([
            'product_attribute_id' => $attribute->id,
            'value' => $request->value,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($value, 201);
    }

    public function destroyValue(Request $request, $valueId)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['message' => 'Only administrators are allowed to delete values.'], 403);
        }

        $value = ProductAttributeValue::findOrFail($valueId);
        
        // Detach variants to avoid foreign key constraint violations
        $value->variants()->detach();
        
        $value->delete();

        return response()->json(['detail' => 'Option value deleted successfully.']);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['message' => 'Only administrators are allowed to delete attributes.'], 403);
        }

        $attribute = ProductAttribute::findOrFail($id);
        
        // Loop through each option value, detach its variants, and delete the value
        foreach ($attribute->values as $value) {
            $value->variants()->detach();
            $value->delete();
        }
        
        $attribute->delete();

        return response()->json(['detail' => 'Product attribute deleted successfully.']);
    }
}
