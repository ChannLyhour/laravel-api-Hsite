<?php
$merchantId = 'ec475602';
$apiKey = '2ac355df26562e1070295884ea9f4fc4bd479902';
$apiUrl = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/generate-qr';

$req_time = date('YmdHis');
$tran_id = 'TXN-TEST-' . time();
$amount = '1.00';
$purchase_type = 'purchase';
$payment_option = 'abapay_khqr';
$currency = 'USD';

$first_name = 'Guest';
$last_name = 'User';
$email = 'guest@example.com';
$phone = '012345678';
$items = base64_encode(json_encode([['name' => 'Outfit-6', 'quantity' => 1, 'price' => 1.00]]));
$callback_url = base64_encode('http://localhost:8000/api/payments/callback');
$lifetime = 6;
$qr_image_template = 'template3_color';

// We will test multiple hash strings
$variations = [];

// Variation 1: 22-parameters sequence from controller
// req_time + merchant_id + tran_id + amount + items + gdt + shipping + ctid + pwt + firstname + lastname + email + phone + type + payment_option + return_url + cancel_url + custom_fields + return_params + payout + qr_image_template + lifetime
$variations['Controller_22_params'] = 
    $req_time 
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

// Variation 2: 21-parameters sequence (standard purchase/generate-qr sequence from docs)
// req_time + merchant_id + tran_id + amount + items + shipping + ctid + pwt + firstname + lastname + email + phone + type + payment_option + return_url + cancel_url + continue_success_url + return_deeplink + currency + custom_fields + return_params
$variations['Docs_21_params_with_callback_in_return_url'] = 
    $req_time 
    . $merchantId 
    . $tran_id 
    . $amount 
    . $items 
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
    . '' // continue_success_url
    . '' // return_deeplink
    . $currency 
    . '' // custom_fields
    . '' // return_params
;

// Variation 3: 21-parameters sequence with return_url empty
$variations['Docs_21_params_return_url_empty'] = 
    $req_time 
    . $merchantId 
    . $tran_id 
    . $amount 
    . $items 
    . '' // shipping
    . '' // ctid
    . '' // pwt
    . $first_name // firstname
    . $last_name // lastname
    . $email // email
    . $phone // phone
    . $purchase_type // type
    . $payment_option 
    . '' // return_url
    . '' // cancel_url
    . '' // continue_success_url
    . '' // return_deeplink
    . $currency 
    . '' // custom_fields
    . '' // return_params
;

// Variation 4: Simple sequence: req_time + merchant_id + tran_id + amount + items
$variations['Simple_5_params'] = 
    $req_time 
    . $merchantId 
    . $tran_id 
    . $amount 
    . $items;

// Variation 5: Simple sequence + type + payment_option + currency
$variations['Simple_8_params'] = 
    $req_time 
    . $merchantId 
    . $tran_id 
    . $amount 
    . $items
    . $purchase_type
    . $payment_option
    . $currency;

// Let's run a test loop
foreach ($variations as $name => $hashStr) {
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

    echo "=== Test Variation: $name ===\n";
    echo "Hash String: $hashStr\n";
    echo "HTTP Status: $http_status\n";
    echo "Response: $response\n\n";
}
