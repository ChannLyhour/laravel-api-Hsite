<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Store;

class DynamicBroadcastConfig
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $channelName = $request->input('channel_name');
        if ($channelName && preg_match('/^private-chat\.(\d+)$/', $channelName, $matches)) {
            $conversationId = $matches[1];
            Store::configurePusherForConversation($conversationId);
        }

        return $next($request);
    }
}
