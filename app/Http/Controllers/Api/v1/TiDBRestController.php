<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\TiDBRestService;
use Illuminate\Http\Request;

class TiDBRestController extends Controller
{
    protected TiDBRestService $tidbRest;

    public function __construct(TiDBRestService $tidbRest)
    {
        $this->tidbRest = $tidbRest;
    }

    /**
     * Get products via TiDB Cloud Data Service REST API.
     *
     * URL: GET /api/tidb-rest/products?created_by=6
     */
    public function getProducts(Request $request)
    {
        $createdBy = $request->query('created_by', 1);

        // Call the 'get_products' endpoint defined inside your TiDB Cloud Data Service
        // Make sure you have created and deployed this endpoint in your TiDB Cloud console!
        $response = $this->tidbRest->callEndpoint('get_products', [
            'created_by' => $createdBy
        ]);

        if ($response === null) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve data from TiDB REST API. Make sure your .env keys are correct and the get_products endpoint is deployed.'
            ], 500);
        }

        return response()->json($response);
    }
}
