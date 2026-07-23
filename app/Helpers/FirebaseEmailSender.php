<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Kreait\Laravel\Firebase\Facades\Firebase;

class FirebaseEmailSender
{
    /**
     * Send email via Firebase Firestore "Trigger Email" extension (Port 443 HTTPS - Unblocked).
     *
     * @param string $toEmail
     * @param string $subject
     * @param string $htmlContent
     * @return bool
     */
    public static function sendEmailViaFirestore(string $toEmail, string $subject, string $htmlContent): bool
    {
        try {
            $firestore = Firebase::firestore()->database();
            $firestore->collection('mail')->add([
                'to' => $toEmail,
                'message' => [
                    'subject' => $subject,
                    'html' => $htmlContent,
                ]
            ]);

            Log::info("🔥 [FIREBASE FIRESTORE MAIL SENT] Subject: '{$subject}' | Recipient: {$toEmail}");
            return true;
        } catch (\Throwable $e) {
            Log::error("❌ [FIREBASE FIRESTORE MAIL FAILED] To {$toEmail}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Firebase Auth Password Reset / Verification Link (Port 443 HTTPS - Unblocked).
     *
     * @param string $toEmail
     * @return bool
     */
    public static function sendAuthEmailLink(string $toEmail): bool
    {
        try {
            $auth = Firebase::auth();
            $auth->sendPasswordResetLink($toEmail);
            Log::info("🔥 [FIREBASE AUTH LINK SENT] Recipient: {$toEmail}");
            return true;
        } catch (\Throwable $e) {
            Log::error("❌ [FIREBASE AUTH LINK FAILED] To {$toEmail}: " . $e->getMessage());
            return false;
        }
    }
}
