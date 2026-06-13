<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplatePurchase;
use App\Models\TemplateDownloadToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TemplateController extends Controller
{
    /**
     * Display a listing of active templates.
     */
    public function index(Request $request)
    {
        $user = $request->user('sanctum');
        $templates = Template::where('status', 'active')->get();

        if ($user) {
            $purchasedIds = TemplatePurchase::where('user_id', $user->id)
                ->pluck('template_id')
                ->toArray();

            foreach ($templates as $tpl) {
                $tpl->owned = in_array($tpl->id, $purchasedIds);
            }
        } else {
            foreach ($templates as $tpl) {
                $tpl->owned = false;
            }
        }

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Display the specified template details.
     */
    public function show(Request $request, $tpl_code)
    {
        $template = Template::where('tpl_code', $tpl_code)
            ->where('status', 'active')
            ->firstOrFail();

        $user = $request->user('sanctum');
        $owned = false;

        if ($user) {
            $owned = TemplatePurchase::where('user_id', $user->id)
                ->where('template_id', $template->id)
                ->exists();
        }

        $template->owned = $owned;

        return response()->json([
            'success' => true,
            'data' => $template
        ]);
    }

    /**
     * Check if the authenticated user owns a specific template.
     */
    public function checkOwned(Request $request, $tpl_code)
    {
        $user = $request->user();
        $template = Template::where('tpl_code', $tpl_code)->firstOrFail();

        $owned = TemplatePurchase::where('user_id', $user->id)
            ->where('template_id', $template->id)
            ->exists();

        return response()->json([
            'success' => true,
            'owned' => $owned
        ]);
    }

    /**
     * Purchase a template and generate an initial download token.
     */
    public function purchase(Request $request, $tpl_code)
    {
        $user = $request->user();
        $template = Template::where('tpl_code', $tpl_code)
            ->where('status', 'active')
            ->firstOrFail();

        $request->validate([
            'order_ref' => 'required|string|max:255',
        ]);

        $orderRef = $request->input('order_ref');

        // Check if already purchased
        $purchase = TemplatePurchase::where('user_id', $user->id)
            ->where('template_id', $template->id)
            ->first();

        if (!$purchase) {
            $purchase = TemplatePurchase::create([
                'user_id' => $user->id,
                'template_id' => $template->id,
                'order_ref' => $orderRef,
                'amount_paid' => $template->price,
                'purchased_at' => now(),
            ]);
        }

        // Generate download token immediately
        $token = bin2hex(random_bytes(32));
        TemplateDownloadToken::create([
            'user_id' => $user->id,
            'template_id' => $template->id,
            'token' => $token,
            'expires_at' => now()->addHours(2), // 2 hours expiration
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template purchased successfully.',
            'download_token' => $token,
            'expires_at' => now()->addHours(2)->toIso8601String()
        ]);
    }

    /**
     * Generate a new single-use download token for a template the user owns.
     */
    public function generateToken(Request $request, $tpl_code)
    {
        $user = $request->user();
        $template = Template::where('tpl_code', $tpl_code)->firstOrFail();

        // Verify ownership
        $owned = TemplatePurchase::where('user_id', $user->id)
            ->where('template_id', $template->id)
            ->exists();

        if (!$owned) {
            return response()->json([
                'success' => false,
                'message' => 'You do not own this template. Please purchase it first.'
            ], 403);
        }

        $token = bin2hex(random_bytes(32));
        TemplateDownloadToken::create([
            'user_id' => $user->id,
            'template_id' => $template->id,
            'token' => $token,
            'expires_at' => now()->addHours(2),
        ]);

        return response()->json([
            'success' => true,
            'download_token' => $token,
            'expires_at' => now()->addHours(2)->toIso8601String()
        ]);
    }

    /**
     * Securely download the template ZIP file using the download token.
     */
    public function download($token)
    {
        $tokenRecord = TemplateDownloadToken::where('token', $token)->first();

        if (!$tokenRecord) {
            abort(404, 'Invalid download token.');
        }

        if (now()->greaterThan($tokenRecord->expires_at)) {
            abort(403, 'Download token has expired.');
        }

        if ($tokenRecord->used_at !== null) {
            abort(403, 'Download token has already been used.');
        }

        $template = Template::find($tokenRecord->template_id);
        if (!$template) {
            abort(404, 'Template not found.');
        }

        // Try different folder layouts for storage_path to find the ZIP file
        // Private app folder (Preferred)
        $filePath = storage_path('app/private/' . $template->file_path);
        
        // Let's also check default local storage directory if private storage is not standard
        if (!file_exists($filePath)) {
            $filePath = storage_path('templates/' . basename($template->file_path));
        }
        // Standard storage/app/templates/ as well
        if (!file_exists($filePath)) {
            $filePath = storage_path('app/templates/' . basename($template->file_path));
        }

        if (!file_exists($filePath)) {
            Log::error("Template file missing: " . $filePath . " for template Code: " . $template->tpl_code);
            abort(404, 'Template source zip archive was not found on the server.');
        }

        // Mark token as used
        $tokenRecord->update([
            'used_at' => now(),
        ]);

        return response()->download($filePath, basename($filePath));
    }
}
