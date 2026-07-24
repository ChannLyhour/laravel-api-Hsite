<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Helpers\OrderNoHelper;

class OrderController extends Controller
{
    /**
     * Create a new order.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'nullable|string',
            'customer_phone' => 'nullable|string',
            'items' => 'required|array',
            'store_id' => 'required|exists:stores,created_by',
            'total_amount' => 'required|numeric',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        try {
            $result = DB::transaction(function () use ($request) {
                // Try to get user from sanctum guard even if middleware is not applied to support both guest and auth
                $user = $request->user() ?? auth('sanctum')->user();
                // Only automatically link to the logged-in user if they are a customer (role_id = 2)
                $userId = ($user && (int)$user->role_id === 2) ? $user->id : null;

                if (!$userId && $request->customer_id) {
                    $u = \App\Models\User::find($request->customer_id);
                    if ($u && (int)$u->role_id === 2) {
                        $userId = $u->id;
                    }
                }

                $isNewCustomer = false;

                // Auto-create customer user account for guest checkouts
                if (!$userId && $request->customer_phone) {
                    $loginValue = trim($request->customer_phone);
                    $isEmail = filter_var($loginValue, FILTER_VALIDATE_EMAIL);

                    if ($isEmail) {
                        $existingUser = \App\Models\User::where('email', $loginValue)->first();
                    } else {
                        $phoneClean = preg_replace('/[^0-9]/', '', $loginValue);
                        if (strlen($phoneClean) >= 8) {
                            $phoneSuffix = substr($phoneClean, -8);
                            $existingUser = \App\Models\User::where('phone', 'LIKE', '%' . $phoneSuffix)->first();
                        } else {
                            $existingUser = \App\Models\User::where('phone', $loginValue)->first();
                        }
                    }

                    if ($existingUser) {
                        $userId = $existingUser->id;
                    } else {
                        // Split name
                        $fullName = trim($request->customer_name ?? 'Guest Customer');
                        $parts = explode(' ', $fullName);
                        $firstName = $parts[0] ?? 'Guest';
                        $lastName = isset($parts[1]) ? implode(' ', array_slice($parts, 1)) : 'Customer';

                        $phone = $isEmail ? null : \App\Helpers\TelegramOTPAcc::normalizeCambodianPhone($loginValue);
                        $email = $isEmail ? $loginValue : null;

                        // Check uniqueness if email is provided
                        if ($email) {
                            $emailExists = \App\Models\User::where('email', $email)->exists();
                            if ($emailExists) {
                                $email = time() . '_' . $email;
                            }
                        }

                        $newUser = \App\Models\User::create([
                            'name' => $fullName,
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'email' => $email,
                            'phone' => $phone,
                            'address' => $request->customer_address,
                            'role_id' => 2, // Customer
                            'password' => \Illuminate\Support\Facades\Hash::make($loginValue),
                            'created_by' => $request->store_id,
                        ]);

                        // Create corresponding Customer entry
                        $newUser->customers()->create([
                            'store_id' => $request->store_id,
                            'name' => $fullName,
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'email' => $email,
                            'phone' => $phone,
                            'address' => $request->customer_address,
                            'created_by' => $request->store_id,
                        ]);

                        $userId = $newUser->id;
                        $isNewCustomer = true;
                    }
                }

                if ($request->coupon_code) {
                    $coupon = \App\Models\Coupon::where('code', strtoupper($request->coupon_code))
                        ->where('is_active', true)
                        ->first();

                    if (!$coupon) {
                        throw new \Exception('Invalid or inactive coupon code.');
                    }

                    $today = now()->toDateString();
                    if ($coupon->start_date->toDateString() > $today) {
                        throw new \Exception('Coupon is not yet active.');
                    }
                    if ($coupon->expire_date->toDateString() < $today) {
                        throw new \Exception('Coupon has expired.');
                    }

                    $subtotalVal = $request->subtotal ?? $request->total_amount;
                    if ($coupon->minimum_purchase && $subtotalVal < $coupon->minimum_purchase) {
                        throw new \Exception('Minimum purchase of $' . number_format($coupon->minimum_purchase, 2) . ' is required.');
                    }

                    if ($coupon->limit_total && $coupon->total_used >= $coupon->limit_total) {
                        throw new \Exception('This coupon has reached its total usage limit.');
                    }

                    if ($coupon->limit_same_user) {
                        $phone = $request->customer_phone;
                        $query = Order::where('coupon_code', $coupon->code)
                            ->whereNotIn('status', ['canceled', 'cancelled']);

                        if ($userId) {
                            $query->where(function ($q) use ($userId, $phone) {
                                $q->where('user_id', $userId);
                                if ($phone) {
                                    $q->orWhere('customer_phone', $phone);
                                }
                            });
                        } else if ($phone) {
                            $query->where('customer_phone', $phone);
                        }

                        $usedCount = $query->count();
                        if ($usedCount >= $coupon->limit_same_user) {
                            throw new \Exception('You have reached the usage limit for this coupon.');
                        }
                    }

                    $coupon->increment('total_used');
                }

                $loginValue = $request->customer_phone ? trim($request->customer_phone) : null;
                $isEmail = $loginValue ? filter_var($loginValue, FILTER_VALIDATE_EMAIL) : false;
                $custPhone = $isEmail ? null : \App\Helpers\TelegramOTPAcc::normalizeCambodianPhone($request->customer_phone);
                $custEmail = $isEmail ? $loginValue : $request->customer_email;
                $isRealEmail = !empty($custEmail);

                $storeId = $request->store_id;
                $isOwnerUser = Store::where('created_by', $storeId)->exists();
                $ownerUserId = $isOwnerUser ? $storeId : (Store::where('id', $storeId)->value('created_by') ?: $storeId);

                // Check if Telegram OTP is configured and enabled
                $tgEnabled = Store::where('created_by', $ownerUserId)->where('key', 'telegram_enabled')->value('value');
                $tgToken = Store::where('created_by', $ownerUserId)->where('key', 'telegram_bot_token')->value('value');
                $isTgOTPEnabled = ($tgEnabled === '1' || $tgEnabled === 1 || $tgEnabled === 'true') && !empty($tgToken);

                // Check if Gmail/Sendmail OTP is configured and enabled
                $gmailEnabled = Store::where('created_by', $ownerUserId)->where('key', 'gmail_enabled')->value('value');
                $gmailUser = Store::where('created_by', $ownerUserId)->where('key', 'mail_username')->value('value');
                $gmailHost = Store::where('created_by', $ownerUserId)->where('key', 'mail_host')->value('value');
                $mailMailer = Store::where('created_by', $ownerUserId)->where('key', 'mail_mailer')->value('value');
                $isGmailOTPEnabled = ($gmailEnabled === '1' || $gmailEnabled === 1 || $gmailEnabled === 'true') 
                    || (!empty($gmailUser) && !empty($gmailHost))
                    || (strtolower(trim((string) $mailMailer)) === 'sendmail');

                $otpRequiredForStore = ($isTgOTPEnabled && $custPhone) || ($isGmailOTPEnabled && $isRealEmail) || (!$userId && ($custPhone || $isRealEmail));

                $order = Order::create([
                    'order_no' => OrderNoHelper::generate(),
                    'order_type' => $request->order_type ?? 'delivery',
                    'user_id' => $userId,
                    'created_by' => $userId,
                    'customer_name' => $request->customer_name,
                    'customer_phone' => $custPhone,
                    'customer_email' => $custEmail,
                    'customer_address' => $request->customer_address,
                    'shipping_address_id' => $request->shipping_address_id,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'notes' => $request->notes,
                    'status' => $otpRequiredForStore ? 'unverified' : 'pending',
                    'subtotal' => $request->subtotal ?? $request->total_amount,
                    'tax' => $request->tax ?? 0,
                    'shipping_fee' => $request->shipping_fee ?? 0,
                    'discount_amount' => $request->discount_amount ?? 0,
                    'coupon_code' => $request->coupon_code,
                    'total_amount' => $request->total_amount,
                    'payment_status' => 'Unpaid',
                    'payment_method' => $request->payment_method ?? 'cod',
                    'store_id' => $request->store_id,
                ]);

                foreach ($request->items as $item) {
                    // Smart fallback for frontend sending different keys
                    $variantId = $item['product_variant_id'] ?? null;

                    if (!$variantId) {
                        // If frontend sends 'product_id' or 'menu_item_id', try to find the first variant of that product
                        $productId = $item['product_id'] ?? $item['menu_item_id'] ?? $item['id'] ?? null;
                        if ($productId) {
                            $variant = \App\Models\ProductVariant::where('product_id', $productId)->first();
                            if ($variant) {
                                $variantId = $variant->id;
                            } else {
                                // If it was actually a variant ID passed as product_id
                                $directVariant = \App\Models\ProductVariant::find($productId);
                                if ($directVariant) {
                                    $variantId = $directVariant->id;
                                }
                            }
                        }
                    }

                    // Resolve actual product name from database
                    $productName = $item['name'] ?? null;
                    if (!$productName || $productName === 'Product Item') {
                        if ($variantId) {
                            $resolvedVariant = \App\Models\ProductVariant::with('product')->find($variantId);
                            if ($resolvedVariant && $resolvedVariant->product) {
                                $productName = $resolvedVariant->product->name;
                            }
                        }
                    }

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_variant_id' => $variantId,
                        'name' => $productName ?? 'Unknown Product',
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                    ]);

                    // Subtract stock if the order does not require OTP verification (starts as 'pending')
                    if (!$otpRequiredForStore && $variantId) {
                        $variant = \App\Models\ProductVariant::find($variantId);
                        if ($variant) {
                            $variant->decrement('stock_qty', $item['quantity']);
                        }
                    }
                }

                return [
                    'order' => $order,
                    'otpRequiredForStore' => $otpRequiredForStore,
                    'custPhone' => $custPhone,
                    'custEmail' => $custEmail,
                    'isRealEmail' => $isRealEmail,
                    'userId' => $userId,
                    'ownerUserId' => $ownerUserId,
                ];
            });

            $order = $result['order'];
            $otpRequiredForStore = $result['otpRequiredForStore'];
            $custPhone = $result['custPhone'];
            $custEmail = $result['custEmail'];
            $isRealEmail = $result['isRealEmail'];
            $userId = $result['userId'];
            $ownerUserId = $result['ownerUserId'];

            $token = null;
            $otpRequired = false;
            $telegramBotLink = null;
            $otpCode = null;

            if ($otpRequiredForStore) {
                $otpRequired = true;
                $otpCode = (string) rand(100000, 999999);
                \Illuminate\Support\Facades\Cache::put("order_otp_{$order->id}", $otpCode, 3600);
                \Illuminate\Support\Facades\Log::info("🔑 [OTP GENERATED] Order #{$order->id} ({$order->order_no}) | OTP: {$otpCode} | Phone: {$custPhone} | Email: {$custEmail}");

                if ($custPhone) {
                    $botToken = Store::where('created_by', $ownerUserId)->where('key', 'telegram_bot_token')->value('value');
                    $customBotLink = Store::where('created_by', $ownerUserId)->where('key', 'telegram_customer_bot_link')->value('value');
                    if ($customBotLink) {
                        $cleanLink = trim($customBotLink);
                        if (strpos($cleanLink, 'http') === 0) {
                            $telegramBotLink = $cleanLink;
                        } else {
                            $telegramBotLink = "https://t.me/" . ltrim($cleanLink, '@');
                        }
                    } elseif ($botToken) {
                        $cacheKey = "tg_bot_username_" . md5($botToken);
                        $botUsername = \Illuminate\Support\Facades\Cache::get($cacheKey);
                        if ($botUsername === null) {
                            $botUsername = \Illuminate\Support\Facades\Cache::remember($cacheKey, 86400, function () use ($botToken) {
                                try {
                                    $response = \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(3)->get("https://api.telegram.org/bot" . $botToken . "/getMe");
                                    if ($response->successful()) {
                                        $data = $response->json();
                                        return $data['result']['username'] ?? null;
                                    }
                                } catch (\Exception $e) {
                                    \Illuminate\Support\Facades\Log::warning("Failed to fetch Telegram bot info: " . $e->getMessage());
                                }
                                return null;
                            });
                        }

                        if ($botUsername) {
                            $telegramBotLink = "https://t.me/" . $botUsername;
                        }
                    }
                }
            } else {
                if ($userId) {
                    $u = \App\Models\User::find($userId);
                    if ($u) {
                        $token = $u->createToken('auth-token')->plainTextToken;
                    }
                }
            }

            // Dispatch truly background CLI command for heavy external notifications (Gmail SMTP / Telegram API)
            self::dispatchAsyncOrderOtp($order->id, $otpRequiredForStore ? $otpCode : null);

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'otp_required' => $otpRequired,
                'telegram_bot_link' => $telegramBotLink,
                'token' => $token,
                'order' => $order->load(['items.productVariant.product', 'store'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get orders for the currently authenticated user.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = Order::where('user_id', $user->id)
            ->where('status', '!=', 'unverified')
            ->with(['items.productVariant.product', 'store']);

        if ($request->has('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json($orders);
    }

    /**
     * Alias for me()
     */
    public function mine(Request $request)
    {
        return $this->me($request);
    }

    /**
     * Get details of a specific order.
     */
    public function show(Request $request, $id)
    {
        $order = Order::with(['items.productVariant.product', 'store'])->findOrFail($id);
        $user = $request->user();

        // Auths checks
        $isAdmin = $user && $user->role_id == 1;
        $isPurchaser = $user && $order->user_id == $user->id;
        $isOwner = $user && $order->store && $order->store->created_by == $user->id;

        // Allow access if admin, purchaser, store owner, or if it's a guest order being viewed (though guest view might need more security)
        if (!($isAdmin || $isPurchaser || $isOwner || ($order->user_id === null && $request->has('guest_access')))) {
            return response()->json(['message' => "You are not authorized to view this order."], 403);
        }

        return response()->json($order);
    }

    /**
     * Get orders for a specific store (for owners/admins).
     */
    public function storeOrders(Request $request)
    {
        $user = $request->user();
        if (!$user || !in_array((int)$user->role_id, [1, 30003])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Order::with(['items', 'store']);

        if ((int)$user->role_id !== 1) {
            $query->where('store_id', $user->id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    /**
     * Delete/cancel order if checkout was abandoned or payment failed.
     */
    public function destroy($id)
    {
        try {
            return DB::transaction(function () use ($id) {
                $order = Order::findOrFail($id);
                
                // Revert coupon usage if applied
                if ($order->coupon_code) {
                    $coupon = \App\Models\Coupon::where('code', strtoupper($order->coupon_code))->first();
                    if ($coupon && $coupon->total_used > 0) {
                        $coupon->decrement('total_used');
                    }
                }
                
                // Revert stock subtraction if the order was active (i.e. status is not 'unverified' and not already 'canceled'/'cancelled')
                $wasActive = $order->status !== 'unverified' && $order->status !== 'canceled' && $order->status !== 'cancelled';
                if ($wasActive) {
                    foreach ($order->items as $item) {
                        if ($item->product_variant_id) {
                            $variant = \App\Models\ProductVariant::find($item->product_variant_id);
                            if ($variant) {
                                $variant->increment('stock_qty', $item->quantity);
                            }
                        }
                    }
                }

                // Set status to canceled and payment status to Failed
                $order->update([
                    'status' => 'canceled',
                    'payment_status' => 'Failed',
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Order canceled successfully'
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify the OTP code for guest checkout.
     */
    public function verifyOTP(Request $request, $id)
    {
        $request->validate([
            'otp' => 'required|string',
        ]);

        $order = Order::findOrFail($id);
        $cachedOtp = \Illuminate\Support\Facades\Cache::get("order_otp_{$order->id}");
        $inputOtp = trim((string) $request->otp);

        $isTestOtp = (config('app.env') === 'local' || config('app.debug')) && in_array($inputOtp, ['123456', '999999', '111111']);
        $isValid = ($cachedOtp && $inputOtp === trim((string) $cachedOtp)) || $isTestOtp;

        if (!$isValid) {
            \Illuminate\Support\Facades\Log::warning("❌ [OTP VERIFY FAILED] Order #{$order->id} ({$order->order_no}) | Entered OTP: '{$inputOtp}' | Cached OTP: '{$cachedOtp}'");
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP code. Please check your Telegram and try again.'
            ], 400);
        }

        \Illuminate\Support\Facades\Log::info("✅ [OTP VERIFIED SUCCESS] Order #{$order->id} ({$order->order_no}) | Verified OTP: '{$inputOtp}'");

        // OTP is correct! Clear from cache
        \Illuminate\Support\Facades\Cache::forget("order_otp_{$order->id}");

        // Update order status to pending
        $order->update(['status' => 'pending']);

        // Subtract stock for all items in the order now that it is verified
        foreach ($order->items as $item) {
            if ($item->product_variant_id) {
                $variant = \App\Models\ProductVariant::find($item->product_variant_id);
                if ($variant) {
                    $variant->decrement('stock_qty', $item->quantity);
                }
            }
        }

        // Send Telegram notification to the store owner (only if paid or COD)
        try {
            $isDigitalPayment = in_array(strtolower($order->payment_method ?? ''), ['bakong', 'aba', 'khqr', 'card']);
            if (!$isDigitalPayment || strtolower($order->payment_status ?? '') === 'paid') {
                \App\Helpers\TelegramHelper::sendOrderNotification($order);
            } else {
                \Illuminate\Support\Facades\Log::info("⏸️ [TELEGRAM NOTIFICATION HELD AFTER OTP] Order #{$order->id} ({$order->order_no}) is Unpaid {$order->payment_method}. Waiting for payment completion.");
            }
        } catch (\Exception $ex) {
            \Illuminate\Support\Facades\Log::warning("Telegram order notification failed: " . $ex->getMessage());
        }

        // Retrieve or create the token for the customer account linked to the order
        $token = null;
        if ($order->user_id) {
            $u = \App\Models\User::find($order->user_id);
            if ($u) {
                $token = $u->createToken('auth-token')->plainTextToken;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Order verified successfully.',
            'token' => $token
        ]);
    }

    /**
     * Dispatch an asynchronous background CLI command to process order OTP or notifications.
     */
    public static function dispatchAsyncOrderOtp($orderId, $otpCode = null)
    {
        try {
            $artisanPath = base_path('artisan');
            $otpArg = $otpCode ? " " . escapeshellarg($otpCode) : "";
            $orderIdArg = escapeshellarg($orderId);

            if (str_contains(strtoupper(PHP_OS), 'WIN')) {
                $cmd = "start /B php \"{$artisanPath}\" order:send-otp {$orderIdArg}{$otpArg} > NUL 2>&1";
                pclose(popen($cmd, "r"));
            } else {
                $cmd = "php \"{$artisanPath}\" order:send-otp {$orderIdArg}{$otpArg} > /dev/null 2>&1 &";
                exec($cmd);
            }
        } catch (\Throwable $ex) {
            \Illuminate\Support\Facades\Log::warning("dispatchAsyncOrderOtp failed: " . $ex->getMessage());
        }
    }
}
