<?php
$req_time = date('YmdHis');
$tran_id = 'TXN-TEST-' . time();
$amount = 1.00; // float
$purchase_type = 'purchase';
$payment_option = 'abapay_khqr';
$currency = 'USD';

$merchantId = 'ec475602';
$apiKey = '2ac355df26562e1070295884ea9f4fc4bd479902';
$apiUrl = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/generate-qr';

$first_name = 'Guest';
$last_name = 'User';
$email = 'guest@example.com';
$phone = '012345678';
$items = base64_encode(json_encode([['name' => 'Outfit-6', 'quantity' => 1, 'price' => 1.00]]));
$callback_url = base64_encode('http://localhost:8000/api/payments/callback');
$lifetime = 6;
$qr_image_template = 'template3_color';

// Hash sequence order:
$hashStr = $req_time 
    . $merchantId 
    . $tran_id 
    . $amount 
    . $items 
    . '' // gdt
    . '' // shipping
    . '' // ctid
    . '' // pwt
    . $first_name // firstname
    . $last_name // lastname
    . $email // email
    . $phone // phone
    . $purchase_type // type
    . $payment_option 
    . $callback_url // return_url
    . '' // cancel_url
    . '' // custom_fields
    . '' // return_params
    . '' // payout
    . $qr_image_template 
    . $lifetime;

$hash = base64_encode(hash_hmac('sha512', $hashStr, $apiKey, true));

$postFields = [
    'req_time' => $req_time,
    'merchant_id' => $merchantId,
    'tran_id' => $tran_id,
    'first_name' => $first_name,
    'last_name' => $last_name,
    'email' => $email,
    'phone' => $phone,
    'amount' => $amount,
    'purchase_type' => $purchase_type,
    'payment_option' => $payment_option,
    'items' => $items,
    'currency' => $currency,
    'callback_url' => $callback_url,
    'return_deeplink' => null,
    'custom_fields' => null,
    'return_params' => null,
    'payout' => null,
    'lifetime' => $lifetime,
    'qr_image_template' => $qr_image_template,
    'hash' => $hash,
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postFields));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $http_status\n";
echo "Response: $response\n";
