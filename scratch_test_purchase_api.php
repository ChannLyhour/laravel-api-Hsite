<?php
$req_time = date('YmdHis');
$tran_id = 'TXN-TEST-' . time();
$amount = '1.00';
$type = 'purchase';
$currency = 'USD';
$payment_option = 'abapay_khqr';

$merchantId = 'ec454848';
$apiKey = 'ec454848b598b9e6e00ea3535cf04b122f87a875';
$apiUrl = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';

// Hash sequence for purchase:
// req_time + merchant_id + tran_id + amount + items + shipping + ctid + pwt + firstname + lastname + email + phone + type + payment_option + return_url + cancel_url + continue_success_url + return_deeplink + currency + custom_fields + return_params
// For minimal request, let's concatenate only populated parameters or pass empty values for optional ones.
// Let's check how the hash is generated. Usually, optional fields are left empty.
$items = base64_encode(json_encode([['name' => 'Test Item', 'quantity' => 1, 'price' => 1.00]]));
$hashStr = $req_time . $merchantId . $tran_id . $amount . $items . '' . '' . '' . '' . '' . '' . '' . $type . $payment_option . '' . '' . '' . '' . $currency . '' . '';
$hash = base64_encode(hash_hmac('sha512', $hashStr, $apiKey, true));

$postFields = [
    'req_time' => $req_time,
    'merchant_id' => $merchantId,
    'tran_id' => $tran_id,
    'amount' => $amount,
    'items' => $items,
    'type' => $type,
    'payment_option' => $payment_option,
    'currency' => $currency,
    'hash' => $hash,
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields); // Array = multipart/form-data
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $http_status\n";
echo "Response Length: " . strlen($response) . "\n";
echo "Response Preview: " . substr($response, 0, 500) . "\n";
