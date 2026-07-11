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
        $user = $request->user('sanctum') ?? auth('sanctum')->user();
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

        $user = $request->user('sanctum') ?? auth('sanctum')->user();
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

    /**
     * Retrieve all premium templates (Super Admin).
     */
    public function adminListTemplates(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $templates = Template::all();
        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Retrieve all template assignments (Super Admin).
     */
    public function listAssignments(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $assignments = TemplatePurchase::with(['user', 'template'])->get();
        
        $formatted = $assignments->map(function ($assignment) {
            $userId = $assignment->user_id;
            
            // Get store name for this user from Store table
            $storeName = \App\Models\Store::where('created_by', $userId)
                ->where('key', 'store_name')
                ->value('value') ?? 'Unnamed Store';
                
            return [
                'id' => $assignment->id,
                'user_id' => $userId,
                'template_id' => $assignment->template_id,
                'order_ref' => $assignment->order_ref,
                'amount_paid' => $assignment->amount_paid,
                'purchased_at' => $assignment->purchased_at ? $assignment->purchased_at->toDateTimeString() : null,
                'user' => [
                    'id' => $assignment->user?->id,
                    'name' => $assignment->user?->name,
                    'email' => $assignment->user?->email,
                ],
                'store' => [
                    'store_name' => $storeName,
                ],
                'template' => [
                    'id' => $assignment->template?->id,
                    'tpl_code' => $assignment->template?->tpl_code,
                    'title' => $assignment->template?->title,
                    'theme_key' => $assignment->template?->theme_key,
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted
        ]);
    }

    /**
     * Assign a template to a specific store owner (Super Admin).
     */
    public function assignTemplate(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'template_id' => 'required|exists:templates,id',
        ]);

        $userId = $request->input('user_id');
        $templateId = $request->input('template_id');

        $template = Template::findOrFail($templateId);

        // Check if already assigned
        $purchase = TemplatePurchase::where('user_id', $userId)
            ->where('template_id', $templateId)
            ->first();

        if ($purchase) {
            return response()->json([
                'success' => false,
                'message' => 'This template is already assigned to this store owner.'
            ], 422);
        }

        $purchase = TemplatePurchase::create([
            'user_id' => $userId,
            'template_id' => $templateId,
            'order_ref' => 'ADMIN_ASSIGN_' . strtoupper(bin2hex(random_bytes(4))),
            'amount_paid' => 0.00,
            'purchased_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template assigned successfully.',
            'data' => $purchase
        ]);
    }

    /**
     * Remove a template assignment (Super Admin).
     */
    public function removeAssignment(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $purchase = TemplatePurchase::findOrFail($id);
        $purchase->delete();

        return response()->json([
            'success' => true,
            'message' => 'Template assignment removed successfully.'
        ]);
    }

    /**
     * Update an existing template assignment (Super Admin).
     */
    public function updateAssignment(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'template_id' => 'required|exists:templates,id',
        ]);

        $purchase = TemplatePurchase::findOrFail($id);

        $userId = $request->input('user_id');
        $templateId = $request->input('template_id');

        // Check if there is another record with the same user_id and template_id
        $exists = TemplatePurchase::where('user_id', $userId)
            ->where('template_id', $templateId)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'This template is already assigned to this store owner.'
            ], 422);
        }

        $purchase->update([
            'user_id' => $userId,
            'template_id' => $templateId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template assignment updated successfully.',
            'data' => $purchase
        ]);
    }
}
