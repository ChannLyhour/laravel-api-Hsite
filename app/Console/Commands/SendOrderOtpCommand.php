<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Helpers\TelegramHelper;
use App\Helpers\TelegramOTPAcc;
use App\Helpers\GmailOTPHelper;
use Illuminate\Support\Facades\Log;

class SendOrderOtpCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'order:send-otp {order_id} {otp_code?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send Order Notification or OTP in background';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $orderId = $this->argument('order_id');
        $otpCode = $this->argument('otp_code');

        $order = Order::find($orderId);
        if (!$order) {
            Log::warning("SendOrderOtpCommand: Order #{$orderId} not found.");
            return 1;
        }

        $custPhone = $order->customer_phone;
        $custEmail = $order->customer_email;
        $isRealEmail = $custEmail && filter_var($custEmail, FILTER_VALIDATE_EMAIL) && !str_contains($custEmail, '@temp-customer.com');

        if (!$otpCode) {
            // Send regular order notification to store owner
            try {
                TelegramHelper::sendOrderNotification($order);
            } catch (\Exception $ex) {
                Log::warning("Telegram order notification failed: " . $ex->getMessage());
            }
        } else {
            // Send OTP code via Telegram & Gmail
            try {
                if ($custPhone) {
                    TelegramOTPAcc::sendOTP($order, $otpCode);
                }
                if ($isRealEmail) {
                    GmailOTPHelper::sendOTP($order, $otpCode);
                }
            } catch (\Exception $ex) {
                Log::warning("❌ [OTP SENDING FAILED] Order #{$order->id}: " . $ex->getMessage());
            }
        }

        return 0;
    }
}
