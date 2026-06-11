<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\User;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Automatically check every minute and mark users offline who haven't sent a heartbeat for 3 minutes
Schedule::call(function () {
    $staleUsers = User::where('is_online', true)
        ->where(function ($query) {
            $query->whereNull('last_seen_at')
                ->orWhere('last_seen_at', '<', now()->subMinutes(1));
        })
        ->get();

    foreach ($staleUsers as $user) {
        // Update database column to false (0) — no Pusher broadcast
        $user->update(['is_online' => false]);
    }
})->everyMinute();
