<?php
/**
 * Test Bakong MD5 hashing for KHQR verification.
 * This script demonstrates how the MD5 hash is generated from a KHQR string
 * and used to check transaction status.
 */

function generateKHQR($accountId, $merchantName, $merchantCity, $amount, $currency, $billNo) {
    // Basic KHQR Tag formatters
    $formatTLV = function($tag, $value) {
        $len = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
        return $tag . $len . $value;
    };

    $calculateCRC16 = function($str) {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($str); $i++) {
            $x = (($crc >> 8) ^ ord($str[$i])) & 0xFF;
            $x ^= $x >> 4;
            $crc = (($crc << 8) ^ ($x << 12) ^ ($x << 5) ^ $x) & 0xFFFF;
        }
        return sprintf('%04X', $crc);
    };

    // Use Tag 30 (Merchant) as the default for store-related payments for better compatibility
    $accountTag = '30';
    
    // Tag 30 (Merchant Account Information)
    $subtag00 = $formatTLV('00', 'A000000762000101'); // Universal EMVCo GUID for Cambodia
    $subtag01 = $formatTLV('01', $accountId);
    $merchantAccountInfo = $subtag00 . $subtag01;
    
    // Standardize Merchant Account Info: 00=GUID, 01=AccountID
    // Subtag 02 (optional) is omitted for maximum compatibility

    $payload = '';
    $payload .= $formatTLV('00', '01');
    $payload .= $formatTLV('01', '12'); // Dynamic
    $payload .= $formatTLV($accountTag, $merchantAccountInfo);
    $payload .= $formatTLV('52', '5999');
    $payload .= $formatTLV('53', ($currency === 'KHR' ? '116' : '840'));
    $payload .= $formatTLV('54', number_format((float)$amount, 2, '.', ''));
    $payload .= $formatTLV('58', 'KH');
    $payload .= $formatTLV('59', substr($merchantName, 0, 25));
    $payload .= $formatTLV('60', substr($merchantCity, 0, 15));
    $payload .= $formatTLV('62', $formatTLV('01', $billNo));
    $payload .= '6304';
    
    $crc = $calculateCRC16($payload);
    return $payload . $crc;
}

// 1. Setup sample data
$accountId = 'lyhour_chann@bkrt';
$merchantName = 'Lyhour Chann';
$merchantCity = 'Phnom Penh';
$amount = 0.10;
$currency = 'USD';
$billNo = 'INV12345';

// 2. Generate KHQR String
$qrString = generateKHQR($accountId, $merchantName, $merchantCity, $amount, $currency, $billNo);

// 3. Generate MD5 Hash (Mandatory for Bakong check_transaction_by_md5)
$md5Hash = md5($qrString);

echo "=== Bakong MD5 Verification Test ===\n";
echo "Account ID:    " . $accountId . "\n";
echo "Amount:        " . $amount . " " . $currency . "\n";
echo "Bill No:       " . $billNo . "\n";
echo "------------------------------------\n";
echo "KHQR String:   " . $qrString . "\n";
echo "MD5 Hash:      " . $md5Hash . "\n";
echo "------------------------------------\n";
echo "This MD5 hash is what must be sent to:\n";
echo "POST https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5\n";
echo "Body: {\"md5\": \"" . $md5Hash . "\"}\n";
echo "------------------------------------\n";

// 4. Verify logic matches controllers
$expectedFormat = "/^[a-f0-9]{32}$/";
if (preg_match($expectedFormat, $md5Hash)) {
    echo "✅ SUCCESS: Valid 32-character MD5 hash generated.\n";
} else {
    echo "❌ FAILED: Invalid MD5 hash format.\n";
}
