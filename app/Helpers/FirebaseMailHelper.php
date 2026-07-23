<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Kreait\Laravel\Firebase\Facades\Firebase;

class FirebaseMailHelper
{
    /**
     * Generate Firebase Auth Email Verification Link for a customer.
     *
     * @param string $email
     * @return string|null
     */
    public static function generateEmailVerificationLink(string $email): ?string
    {
        try {
            $auth = Firebase::auth();
            $link = $auth->getEmailVerificationLink($email);
            Log::info("🔥 [FIREBASE EMAIL LINK GENERATED] For: {$email}");
            return $link;
        } catch (\Throwable $e) {
            Log::error("❌ [FIREBASE EMAIL LINK FAILED] For {$email}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate Firebase Password Reset / OTP Link for a customer.
     *
     * @param string $email
     * @return string|null
     */
    public static function generatePasswordResetLink(string $email): ?string
    {
        try {
            $auth = Firebase::auth();
            $link = $auth->getPasswordResetLink($email);
            Log::info("🔥 [FIREBASE PASSWORD RESET LINK] For: {$email}");
            return $link;
        } catch (\Throwable $e) {
            Log::error("❌ [FIREBASE RESET LINK FAILED] For {$email}: " . $e->getMessage());
            return null;
        }
    }
}
