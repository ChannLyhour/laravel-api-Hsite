<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Share;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShareController extends Controller
{
    /**
     * Save shared data and return a unique 6-character hex ID.
     */
    public function save(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'stores' => 'required|array',
            'ownerUserId' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid validation rules',
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate a unique 6-character random hex ID
        do {
            $id = bin2hex(random_bytes(3));
        } while (Share::where('id', $id)->exists());

        // Save to database
        $share = Share::create([
            'id' => $id,
            'data' => [
                'stores' => $request->input('stores'),
                'ownerUserId' => $request->input('ownerUserId'),
            ],
        ]);

        return response()->json([
            'success' => true,
            'id' => $share->id,
        ], 201);
    }

    /**
     * Load shared data by ID.
     */
    public function load($id)
    {
        $share = Share::find($id);

        if (!$share) {
            return response()->json([
                'success' => false,
                'message' => 'Shared design not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'id' => $share->id,
            'data' => $share->data,
        ]);
    }
}
