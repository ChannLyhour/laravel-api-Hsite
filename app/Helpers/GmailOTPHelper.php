<?php

namespace App\Helpers;

use App\Models\Store;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class GmailOTPHelper
{
    /**
     * Send OTP verification email to the customer.
     *
     * @param \App\Models\Order $order
     * @param string|int $otpCode
     * @return void
     */
    public static function sendOTP ($order, $otpCode)
    {
        $storeId = $order->store_id;
        $recipientEmail = $order->customer_email;

        Log::info("GmailOTPHelper::sendOTP called - Order ID: {$order->id}, Store ID: {$storeId}, Email: {$recipientEmail}, OTP: {$otpCode}");

        if (!$storeId) {
            Log::warning("GmailOTPHelper::sendOTP - No store_id, aborting.");
            return;
        }

        if (!$recipientEmail) {
            Log::warning("GmailOTPHelper::sendOTP - No customer email, aborting.");
            return;
        }

        if (str_contains($recipientEmail, '@temp-customer.com')) {
            Log::info("GmailOTPHelper::sendOTP - Customer email is a temporary address, skipping email OTP.");
            return;
        }

        try {
            // Resolve actual store owner user ID
            $isOwnerUser = Store::where('created_by', $storeId)->exists();
            $ownerUserId = $isOwnerUser ? $storeId : (Store::where('id', $storeId)->value('created_by') ?: $storeId);

            // Retrieve store settings
            $settings = Store::where('created_by', $ownerUserId)->get()->pluck('value', 'key');

            $storeName = $settings->get('store_name') ?: 'Our Store';

            // Support both flat keys and JSON `otp_email_configuration`
            $otpConfigRaw = $settings->get('otp_email_configuration');
            $otpConfig = [];
            if (!empty($otpConfigRaw)) {
                $otpConfig = is_string($otpConfigRaw) ? json_decode($otpConfigRaw, true) : (is_array($otpConfigRaw) ? $otpConfigRaw : []);
            }

            // Extract mail_mailer setting without hardcoding 'smtp' fallback default
            $mailMailer = $settings->get('mail_mailer') ?: ($otpConfig['mail_mailer'] ?? null);
            $mailHost = $settings->get('mail_host') ?: ($otpConfig['mail_host'] ?? null);
            $mailPort = $settings->get('mail_port') ?: ($otpConfig['mail_port'] ?? 587);
            $mailEncryption = $settings->get('mail_encryption') ?: ($otpConfig['mail_encryption'] ?? 'tls');
            $mailUsername = $settings->get('mail_username') ?: ($otpConfig['mail_username'] ?? null);
            $mailPassword = $settings->get('mail_password') ?: ($otpConfig['mail_password'] ?? null);
            $mailFromAddress = $settings->get('mail_from_address') ?: ($otpConfig['mail_from_address'] ?? null);
            $mailFromName = $settings->get('mail_from_name') ?: ($otpConfig['mail_from_name'] ?? $storeName);

            // Legacy Gmail fallback keys
            $gmailEnabled = $settings->get('gmail_enabled') ?: ($otpConfig['gmail_enabled'] ?? null);
            $gmailEmail = $settings->get('gmail_email') ?: ($otpConfig['gmail_email'] ?? null);
            $gmailPassword = $settings->get('gmail_password') ?: ($otpConfig['gmail_password'] ?? null);

            $cleanMailPassword = $mailPassword ? str_replace(' ', '', $mailPassword) : '';
            $cleanGmailPassword = $gmailPassword ? str_replace(' ', '', $gmailPassword) : '';

            $isResendApi = (strtolower(trim((string) $mailMailer)) === 'resend') || str_starts_with($cleanMailPassword, 're_');
            $isStoreSendmail = !$isResendApi && (strtolower(trim((string) $mailMailer)) === 'sendmail');
            $isStoreSmtpConfigured = !$isResendApi && !$isStoreSendmail && $mailHost && $mailUsername && !empty($cleanMailPassword);
            $isStoreGmailConfigured = !$isResendApi && ($gmailEnabled === '1' || $gmailEnabled === 1 || $gmailEnabled === 'true') && $gmailEmail && !empty($cleanGmailPassword);

            // Final parameters for sending email
            $finalFromEmail = null;
            $finalFromName = $storeName;

            if ($isResendApi) {
                Log::info("GmailOTPHelper::sendOTP - Sending via Resend HTTPS API (Port 443) for owner user ID {$ownerUserId}.");
                $apiKey = $cleanMailPassword ?: env('RESEND_KEY');
                $finalFromEmail = $mailFromAddress ?: 'onboarding@resend.dev';
                $finalFromName = $mailFromName ?: $storeName;

                $subject = "🔐 Order Verification Code - #{$order->order_no} | {$finalFromName}";
                $htmlContent = self::buildEmailTemplate($order, $otpCode, $settings, $finalFromName, '');

                $ch = curl_init('https://api.resend.com/emails');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $apiKey,
                    'Content-Type: application/json',
                ]);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                    'from' => "{$finalFromName} <{$finalFromEmail}>",
                    'to' => [$recipientEmail],
                    'subject' => $subject,
                    'html' => $htmlContent,
                ]));
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                $res = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode >= 200 && $httpCode < 300) {
                    Log::info("📧 [RESEND HTTPS OTP SENT] Order #{$order->id} (" . ($order->order_no ?? $order->id) . ") | OTP: {$otpCode} | Recipient: {$recipientEmail} | Response: {$res}");
                    return;
                } else {
                    Log::error("❌ [RESEND HTTPS OTP FAILED] Order #{$order->id}: HTTP {$httpCode} - {$res}");
                }
            } elseif ($isStoreSendmail) {
                Log::info("GmailOTPHelper::sendOTP - Configuring dynamic Sendmail/Postfix for owner user ID {$ownerUserId}.");
                config([
                    'mail.default' => 'sendmail',
                    'mail.mailers.sendmail.transport' => 'sendmail',
                    'mail.mailers.sendmail.path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs -i'),
                    'mail.mailers.sendmail.stream' => [
                        'ssl' => [
                            'allow_self_signed' => true,
                            'verify_peer' => false,
                            'verify_peer_name' => false,
                        ],
                    ],
                    'mail.from.address' => $mailFromAddress ?: 'noreply@' . (request()->getHost() ?: 'localhost'),
                    'mail.from.name' => $mailFromName ?: $storeName,
                ]);
                Mail::purge('sendmail');
                $finalFromEmail = $mailFromAddress;
                $finalFromName = $mailFromName ?: $storeName;
            } elseif ($isStoreSmtpConfigured) {
                Log::info("GmailOTPHelper::sendOTP - Configuring dynamic SMTP using store SMTP settings for owner user ID {$ownerUserId}.");
                $resolvedPort = intval($mailPort ?: 587);
                $resolvedEnc = $mailEncryption ?: 'tls';
                if ($mailHost === 'smtp.gmail.com' && ($resolvedPort == 587 || empty($mailEncryption) || $mailEncryption === 'tls')) {
                    $resolvedPort = 465;
                    $resolvedEnc = 'ssl';
                }
                config([
                    'mail.default' => 'smtp',
                    'mail.mailers.smtp.transport' => 'smtp',
                    'mail.mailers.smtp.host' => $mailHost,
                    'mail.mailers.smtp.port' => $resolvedPort,
                    'mail.mailers.smtp.encryption' => $resolvedEnc,
                    'mail.mailers.smtp.username' => $mailUsername,
                    'mail.mailers.smtp.password' => $cleanMailPassword,
                    'mail.mailers.smtp.stream' => [
                        'ssl' => [
                            'allow_self_signed' => true,
                            'verify_peer' => false,
                            'verify_peer_name' => false,
                        ],
                    ],
                    'mail.from.address' => $mailFromAddress ?: $mailUsername,
                    'mail.from.name' => $mailFromName ?: $storeName,
                ]);
                Mail::purge('smtp');
                $finalFromEmail = $mailFromAddress ?: $mailUsername;
                $finalFromName = $mailFromName ?: $storeName;
            } elseif ($isStoreGmailConfigured) {
                Log::info("GmailOTPHelper::sendOTP - Configuring dynamic SMTP using store Gmail settings for owner user ID {$ownerUserId}.");
                $gmailPort = ($mailPort && $mailPort != '587') ? intval($mailPort) : 465;
                $gmailEnc = $gmailPort == 465 ? 'ssl' : 'tls';
                config([
                    'mail.default' => 'smtp',
                    'mail.mailers.smtp.transport' => 'smtp',
                    'mail.mailers.smtp.host' => 'smtp.gmail.com',
                    'mail.mailers.smtp.port' => $gmailPort,
                    'mail.mailers.smtp.encryption' => $gmailEnc,
                    'mail.mailers.smtp.username' => $gmailEmail,
                    'mail.mailers.smtp.password' => $cleanGmailPassword,
                    'mail.mailers.smtp.stream' => [
                        'ssl' => [
                            'allow_self_signed' => true,
                            'verify_peer' => false,
                            'verify_peer_name' => false,
                        ],
                    ],
                    'mail.from.address' => $gmailEmail,
                    'mail.from.name' => $storeName,
                ]);
                Mail::purge('smtp');
                $finalFromEmail = $gmailEmail;
                $finalFromName = $storeName;
            } else {
                Log::info("GmailOTPHelper::sendOTP - Using default system mailer configuration. Overriding 'from' name to: {$storeName}.");
                config([
                    'mail.from.name' => $storeName,
                ]);
                Mail::purge();
            }

            $subject = "🔐 Order Verification Code - #{$order->order_no} | {$finalFromName}";

            // Send Email using Mail::send to allow inline attachment embedding
            Mail::send([], [], function ($message) use ($recipientEmail, $subject, $finalFromName, $finalFromEmail, $order, $otpCode, $settings) {
                $message->to($recipientEmail)
                    ->subject($subject);

                if ($finalFromEmail) {
                    $message->from($finalFromEmail, $finalFromName);
                }

                // Resolve logo URL - check if it can be embedded inline
                $logoUrl = $settings->get('logo_url');
                $resolvedLogo = '';

                if ($logoUrl) {
                    if (str_starts_with($logoUrl, 'http://') || str_starts_with($logoUrl, 'https://')) {
                        $resolvedLogo = $logoUrl;
                    } else {
                        $logoPath = ltrim($logoUrl, '/');
                        if (!str_starts_with($logoPath, 'uploads/') && !str_starts_with($logoPath, 'static/')) {
                            $logoPath = 'uploads/' . $logoPath;
                        }
                        $localPath = public_path($logoPath);
                        if (file_exists($localPath)) {
                            $resolvedLogo = $message->embed($localPath);
                        } else {
                            $customDomain = $settings->get('custom_domain');
                            $baseUrl = $customDomain ? "https://{$customDomain}" : url('/');
                            $resolvedLogo = rtrim($baseUrl, '/') . '/' . $logoPath;
                        }
                    }
                }

                // Build HTML Content passing the resolved logo URL
                $htmlContent = self::buildEmailTemplate($order, $otpCode, $settings, $finalFromName, $resolvedLogo);

                $message->html($htmlContent);
            });

            Log::info("📧 [GMAIL OTP SENT] Order #{$order->id} (" . ($order->order_no ?? $order->id) . ") | OTP: {$otpCode} | Recipient: {$recipientEmail}");
        } catch (\Exception $e) {
            Log::error("❌ [GMAIL OTP FAILED] Order #{$order->id} to {$recipientEmail}: " . $e->getMessage());
        }
    }

    /**
     * Build a premium, clean, responsive HTML email template for OTP verification.
     */
    private static function buildEmailTemplate ($order, $otpCode, $settings, $storeName, $resolvedLogo = '')
    {
        $orderNo = $order->order_no ?: $order->id;
        $customerName = htmlspecialchars($order->customer_name ?? 'Valued Customer', ENT_QUOTES, 'UTF-8');

        // Get Store contact details
        $storePhone = $settings->get('store_phone') ?: '';
        $storeAddress = $settings->get('store_address') ?: '';
        $socialTelegram = $settings->get('social_telegram') ?: '';
        $socialFacebook = $settings->get('social_facebook') ?: '';
        $socialTiktok = $settings->get('social_tiktok') ?: '';

        // Formulate order items rows
        $itemsHtml = '';
        $order->loadMissing('items');
        foreach ($order->items as $index => $item) {
            $subtotal = floatval($item->price) * intval($item->quantity);
            $itemName = htmlspecialchars($item->name, ENT_QUOTES, 'UTF-8');

            $itemsHtml .= "
                <tr style='border-bottom: 1px solid #f1f5f9;'>
                    <td style='padding: 12px 8px; font-size: 14px; color: #334155;'>
                        <div style='font-weight: 600; color: #1e293b;'>{$itemName}</div>
                    </td>
                    <td style='padding: 12px 8px; font-size: 14px; color: #64748b; text-align: center;'>{$item->quantity}</td>
                    <td style='padding: 12px 8px; font-size: 14px; color: #1e293b; text-align: right; font-weight: 500;'>$" . number_format($subtotal, 2) . "</td>
                </tr>
            ";
        }

        // Price breakdown fields
        $subtotalAmount = floatval($order->subtotal ?? $order->total_amount);
        $taxAmount = floatval($order->tax ?? 0);
        $shippingFee = floatval($order->shipping_fee ?? 0);
        $discountAmount = floatval($order->discount_amount ?? 0);
        $totalAmount = floatval($order->total_amount);

        // Social links HTML
        $socialsHtml = '';
        if ($socialTelegram) {
            $socialsHtml .= "<a href='{$socialTelegram}' style='color: #64748b; text-decoration: none; margin: 0 10px; font-size: 13px; font-weight: 500;'>Telegram</a>";
        }
        if ($socialFacebook) {
            $socialsHtml .= "<a href='{$socialFacebook}' style='color: #64748b; text-decoration: none; margin: 0 10px; font-size: 13px; font-weight: 500;'>Facebook</a>";
        }
        if ($socialTiktok) {
            $socialsHtml .= "<a href='{$socialTiktok}' style='color: #64748b; text-decoration: none; margin: 0 10px; font-size: 13px; font-weight: 500;'>TikTok</a>";
        }

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Order Verification Code</title>
        </head>
        <body style='margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; -webkit-font-smoothing: antialiased;'>
            <table width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #f8fafc; padding: 40px 10px;'>
                <tr>
                    <td align='center'>
                        <table width='100%' max-width='600' border='0' cellspacing='0' cellpadding='0' style='max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;'>
                            
                            <!-- Header -->
                            <tr>
                                <td style='background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 40px; text-align: center;'>
                                    " . ($resolvedLogo ? "<img src='{$resolvedLogo}' alt='{$storeName}' style='max-height: 50px; margin-bottom: 12px; display: inline-block;' />" : "") . "
                                    <div style='font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;'>{$storeName}</div>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style='padding: 40px;'>
                                    <h1 style='margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a;'>Verify Your Order</h1>
                                    <p style='margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #475569;'>
                                        Hello <strong>{$customerName}</strong>,<br>
                                        Thank you for choosing {$storeName}! Please use the verification code below to verify and complete your guest checkout order.
                                    </p>
                                    
                                    <!-- OTP Code Box -->
                                    <div style='background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px; border: 1px dashed #cbd5e1;'>
                                        <div style='font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px;'>Your Verification Code</div>
                                        <div style='font-family: Menlo, Monaco, Consolas, \"Courier New\", monospace; font-size: 36px; font-weight: 800; color: #4f46e5; letter-spacing: 8px; padding-left: 8px;'>{$otpCode}</div>
                                    </div>
                                    
                                    <p style='margin: 0 0 32px 0; font-size: 13px; line-height: 20px; color: #64748b;'>
                                        ⚠️ This verification code is valid for 60 minutes. Please enter it immediately in the checkout screen to place your order. If you did not request this, you can safely ignore this email.
                                    </p>
                                    
                                    <!-- Order Details Section -->
                                    <div style='border-top: 1px solid #e2e8f0; padding-top: 30px; margin-top: 10px;'>
                                        <h3 style='margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #0f172a;'>Order Summary (#{$orderNo})</h3>
                                        
                                        <table width='100%' border='0' cellspacing='0' cellpadding='0' style='margin-bottom: 20px; border-collapse: collapse;'>
                                            <thead>
                                                <tr style='border-bottom: 2px solid #e2e8f0;'>
                                                    <th align='left' style='padding: 8px 8px 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b;'>Item</th>
                                                    <th align='center' style='padding: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b;'>Qty</th>
                                                    <th align='right' style='padding: 8px 0 8px 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b;'>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {$itemsHtml}
                                            </tbody>
                                        </table>
                                        
                                        <!-- Price Breakdown -->
                                        <table width='100%' border='0' cellspacing='0' cellpadding='0' style='font-size: 14px;'>
                                            <tr>
                                                <td style='padding: 4px 0; color: #64748b;'>Subtotal</td>
                                                <td align='right' style='padding: 4px 0; color: #1e293b;'>$" . number_format($subtotalAmount, 2) . "</td>
                                            </tr>
                                            " . ($discountAmount > 0 ? "
                                            <tr>
                                                <td style='padding: 4px 0; color: #e11d48;'>Discount</td>
                                                <td align='right' style='padding: 4px 0; color: #e11d48;'>-$" . number_format($discountAmount, 2) . "</td>
                                            </tr>
                                            " : "") . "
                                            " . ($shippingFee > 0 ? "
                                            <tr>
                                                <td style='padding: 4px 0; color: #64748b;'>Shipping Fee</td>
                                                <td align='right' style='padding: 4px 0; color: #1e293b;'>$" . number_format($shippingFee, 2) . "</td>
                                            </tr>
                                            " : "") . "
                                            " . ($taxAmount > 0 ? "
                                            <tr>
                                                <td style='padding: 4px 0; color: #64748b;'>Tax</td>
                                                <td align='right' style='padding: 4px 0; color: #1e293b;'>$" . number_format($taxAmount, 2) . "</td>
                                            </tr>
                                            " : "") . "
                                            <tr style='border-top: 1px solid #e2e8f0; font-size: 16px; font-weight: 700;'>
                                                <td style='padding: 12px 0 0 0; color: #0f172a;'>Total Amount</td>
                                                <td align='right' style='padding: 12px 0 0 0; color: #4f46e5;'>$" . number_format($totalAmount, 2) . "</td>
                                            </tr>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 30px 40px; text-align: center;'>
                                    " . ($storeAddress ? "<div style='font-size: 13px; color: #64748b; margin-bottom: 6px;'>{$storeAddress}</div>" : "") . "
                                    " . ($storePhone ? "<div style='font-size: 13px; color: #64748b; margin-bottom: 12px;'>Tel: {$storePhone}</div>" : "") . "
                                    " . ($socialsHtml ? "<div style='margin-bottom: 15px;'>{$socialsHtml}</div>" : "") . "
                                    <div style='font-size: 11px; color: #94a3b8;'>
                                        This is an automated system email. Please do not reply directly to this message.
                                    </div>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        ";
    }
}
