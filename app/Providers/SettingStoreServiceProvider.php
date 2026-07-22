<?php

namespace App\Providers;

use App\Models\Store;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class SettingStoreServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        if ($this->app->runningInConsole() || $this->app->runningUnitTests()) {
            return;
        }

        if (! Schema::hasTable('stores')) {
            return;
        }

        try {
            // Find store settings by owner / created_by
            $userId = auth()->id();
            $storeQuery = Store::query();

            if ($userId) {
                $storeQuery->where('created_by', $userId);
            }

            $settings = $storeQuery->pluck('value', 'key');

            if ($settings->isEmpty()) {
                $settings = Store::whereNotNull('value')->pluck('value', 'key');
            }

            $mailMailer = strtolower(trim((string) ($settings->get('mail_mailer') ?: 'smtp')));
            $mailHost = $settings->get('mail_host') ?: ($settings->get('gmail_email') ? 'smtp.gmail.com' : null);
            $mailPort = (int) ($settings->get('mail_port') ?: 465);
            $mailEncryption = $settings->get('mail_encryption') ?: 'ssl';
            $mailUsername = $settings->get('mail_username') ?: $settings->get('gmail_email');
            $mailPassword = $settings->get('mail_password') ?: $settings->get('gmail_password');
            $mailFromAddress = $settings->get('mail_from_address') ?: $mailUsername;
            $mailFromName = $settings->get('mail_from_name') ?: ($settings->get('store_name') ?: config('mail.from.name'));

            $cleanPassword = $mailPassword ? str_replace(' ', '', $mailPassword) : null;

            if ($mailHost && $mailUsername && !empty($cleanPassword)) {
                config([
                    'mail.default' => $mailMailer,
                    'mail.mailers.smtp.host' => $mailHost,
                    'mail.mailers.smtp.port' => $mailPort,
                    'mail.mailers.smtp.username' => $mailUsername,
                    'mail.mailers.smtp.password' => $cleanPassword,
                    'mail.mailers.smtp.encryption' => in_array($mailEncryption, ['ssl', 'tls'], true) ? $mailEncryption : null,
                    'mail.mailers.smtp.stream' => [
                        'ssl' => [
                            'allow_self_signed' => true,
                            'verify_peer' => false,
                            'verify_peer_name' => false,
                        ],
                    ],
                    'mail.from.address' => $mailFromAddress ?: config('mail.from.address'),
                    'mail.from.name' => $mailFromName ?: config('mail.from.name'),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Unable to load store application settings.', [
                'exception' => $e->getMessage(),
            ]);
        }
    }
}
