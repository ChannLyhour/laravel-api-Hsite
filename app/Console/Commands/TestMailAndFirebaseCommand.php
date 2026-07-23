<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Helpers\GmailOTPHelper;
use App\Helpers\FirebaseNotificationHelper;
use Illuminate\Support\Facades\Log;

class TestMailAndFirebaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:send-otp-mail {email} {--otp=123456}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test sending an Order OTP email to an inbox and check Firebase setup';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $recipientEmail = $this->argument('email');
        $otpCode = $this->option('otp');

        // Retrieve existing order or construct dummy test order
        $order = Order::latest()->first();

        if (!$order) {
            $order = new Order([
                'id' => 99999,
                'order_no' => 'ODN-TEST-999',
                'store_id' => 6,
                'customer_name' => 'Test Customer',
                'customer_email' => $recipientEmail,
                'customer_phone' => '+85512345678',
                'total_amount' => 12.50,
                'subtotal' => 12.50,
            ]);
        } else {
            $order->customer_email = $recipientEmail;
        }

        $this->info("🔥 Checking Firebase SDK & Configuration...");
        try {
            if (class_exists(\Kreait\Laravel\Firebase\Facades\Firebase::class)) {
                $this->info("  [✓] kreait/laravel-firebase package is loaded.");
            }
            
            $storeId = $order->store_id ?? 6;
            $isConfigured = \App\Helpers\FirebaseNotificationHelper::isConfiguredForStore($storeId);
            if ($isConfigured) {
                $this->info("  [✓] Firebase credentials configured in database for Store #{$storeId}.");
            } else {
                $this->warn("  [!] Firebase credentials not yet configured for Store #{$storeId} (you can set them in Firebase Setup tab).");
            }
        } catch (\Throwable $e) {
            $this->warn("  [!] Firebase status: " . $e->getMessage());
        }

        $this->line("");
        $this->info("🔥 Testing Firebase Auth Email Link Generator...");
        try {
            $firebaseLink = \App\Helpers\FirebaseMailHelper::generatePasswordResetLink($recipientEmail);
            if ($firebaseLink) {
                $this->info("  [✓] Firebase Auth Email Link generated successfully!");
            } else {
                $this->info("  [i] Firebase Auth Link generation ready for Firebase users.");
            }
        } catch (\Throwable $ex) {
            $this->warn("  [!] Firebase Link: " . $ex->getMessage());
        }

        $this->line("");
        $this->info("📧 Sending OTP Verification Email to Customer Inbox: {$recipientEmail}...");

        try {
            GmailOTPHelper::sendOTP($order, $otpCode);
            $this->info("✅ GmailOTPHelper::sendOTP executed successfully!");
            $this->info("👉 Check your email inbox ({$recipientEmail}) or inspect storage/logs/laravel.log.");
        } catch (\Exception $ex) {
            $this->error("❌ OTP Email Test Failed: " . $ex->getMessage());
        }

        return 0;
    }
}
