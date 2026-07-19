<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\RestockRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RestockRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = RestockRequest::with(['product.translations', 'variant.attributeValues.attribute', 'requester']);

        if ($request->has('store_id') && !empty($request->store_id)) {
            $query->where('store_id', $request->store_id);
        }

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        return response()->json($requests);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'requested_qty' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $variant = null;
        if ($request->product_variant_id) {
            $variant = ProductVariant::find($request->product_variant_id);
        }

        $restockRequest = RestockRequest::create([
            'store_id' => $request->user()->id ?? null,
            'product_id' => $request->product_id,
            'product_variant_id' => $request->product_variant_id,
            'requested_by' => $request->user()->id ?? null,
            'current_stock' => $variant ? $variant->stock_qty : 0,
            'requested_qty' => $request->requested_qty,
            'status' => 'pending',
            'notes' => $request->notes,
        ]);

        $restockRequest->load(['product.translations', 'variant.attributeValues.attribute', 'requester']);

        return response()->json($restockRequest, 201);
    }

    public function approve(Request $request, $id)
    {
        $restockRequest = RestockRequest::findOrFail($id);

        if ($restockRequest->status === 'approved') {
            return response()->json(['message' => 'Request already approved'], 400);
        }

        return DB::transaction(function () use ($restockRequest) {
            if ($restockRequest->product_variant_id) {
                $variant = ProductVariant::findOrFail($restockRequest->product_variant_id);
                $variant->stock_qty = $variant->stock_qty + $restockRequest->requested_qty;
                $variant->save();
            }

            $restockRequest->status = 'approved';
            $restockRequest->save();

            $restockRequest->load(['product.translations', 'variant.attributeValues.attribute', 'requester']);

            return response()->json([
                'message' => 'Restock request approved successfully',
                'request' => $restockRequest,
            ]);
        });
    }

    public function decline(Request $request, $id)
    {
        $restockRequest = RestockRequest::findOrFail($id);

        $restockRequest->status = 'declined';
        $restockRequest->save();

        $restockRequest->load(['product.translations', 'variant.attributeValues.attribute', 'requester']);

        return response()->json([
            'message' => 'Restock request declined',
            'request' => $restockRequest,
        ]);
    }

    public function destroy($id)
    {
        $restockRequest = RestockRequest::findOrFail($id);
        $restockRequest->delete();

        return response()->json(['message' => 'Restock request deleted successfully']);
    }
}
