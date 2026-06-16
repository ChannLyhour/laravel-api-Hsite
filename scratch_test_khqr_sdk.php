<?php
require __DIR__ . '/vendor/autoload.php';

use KHQR\BakongKHQR;
use KHQR\Helpers\KHQRData;
use KHQR\Models\MerchantInfo;

$merchantInfo = new MerchantInfo(
    'bakong_merchant@nbc',
    'Lyhour Chann',
    'Phnom Penh',
    '123456',
    'Acquiring Bank',
    null,
    KHQRData::CURRENCY_USD,
    0.10,
    'INV12345'
);

$result = BakongKHQR::generateMerchant($merchantInfo);
print_r($result);
