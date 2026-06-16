<?php

/**
 * Direct KHQR format comparison test.
 * No Laravel needed - just plain PHP to verify the QR string format.
 */

function formatTLV($tag, $value) {
    $len = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
    return $tag . $len . $value;
}

function calculateCRC16($str) {
    $crc = 0xFFFF;
    for ($i = 0; $i < strlen($str); $i++) {
        $x = (($crc >> 8) ^ ord($str[$i])) & 0xFF;
        $x ^= $x >> 4;
        $crc = (($crc << 8) ^ ($x << 12) ^ ($x << 5) ^ $x) & 0xFFFF;
    }
    return sprintf('%04X', $crc);
}

$bakongAccountId = 'lyhour_chann@bkrt';
$bakongMerchantName = 'Lyhour Chann';
$bakongMerchantCity = 'Phnom Penh';
$amount = '0.10';
$currency = 'USD';
$currencyCode = '840';
$billNo = 'ORD-001';

// === FORMAT A: Account ID directly in subtag 00 (WRONG - current code) ===
echo "=== FORMAT A (WRONG - current code) ===\n";
echo "Tag 29, subtag00 = bakongAccountId only\n";
$infoA = formatTLV('00', $bakongAccountId);
$payloadA = '';
$payloadA .= formatTLV('00', '01');
$payloadA .= formatTLV('01', '12');
$payloadA .= formatTLV('29', $infoA);
$payloadA .= formatTLV('52', '5999');
$payloadA .= formatTLV('53', $currencyCode);
$payloadA .= formatTLV('54', $amount);
$payloadA .= formatTLV('58', 'KH');
$payloadA .= formatTLV('59', substr($bakongMerchantName, 0, 25));
$payloadA .= formatTLV('60', substr($bakongMerchantCity, 0, 15));
$payloadA .= formatTLV('62', formatTLV('01', $billNo));
$payloadA .= '6304';
$payloadA .= calculateCRC16($payloadA);
echo $payloadA . "\n\n";
echo "Tag 29 content: [" . formatTLV('29', $infoA) . "]\n\n";

// === FORMAT B: GUID kh.gov.nbc.bakong in subtag 00, accountID in subtag 01 (CORRECT - official spec) ===
echo "=== FORMAT B (CORRECT - official spec) ===\n";
echo "Tag 29, subtag00 = kh.gov.nbc.bakong, subtag01 = bakongAccountId\n";
$infoB = formatTLV('00', 'kh.gov.nbc.bakong') . formatTLV('01', $bakongAccountId);
$payloadB = '';
$payloadB .= formatTLV('00', '01');
$payloadB .= formatTLV('01', '12');
$payloadB .= formatTLV('29', $infoB);
$payloadB .= formatTLV('52', '5999');
$payloadB .= formatTLV('53', $currencyCode);
$payloadB .= formatTLV('54', $amount);
$payloadB .= formatTLV('58', 'KH');
$payloadB .= formatTLV('59', substr($bakongMerchantName, 0, 25));
$payloadB .= formatTLV('60', substr($bakongMerchantCity, 0, 15));
$payloadB .= formatTLV('62', formatTLV('01', $billNo));
$payloadB .= '6304';
$payloadB .= calculateCRC16($payloadB);
echo $payloadB . "\n\n";
echo "Tag 29 content: [" . formatTLV('29', $infoB) . "]\n\n";

// === BREAKDOWN ===
echo "=== BREAKDOWN COMPARISON ===\n";
echo "Format A Tag 29 content length: " . strlen($infoA) . "\n";
echo "Format B Tag 29 content length: " . strlen($infoB) . "\n";
echo "\nFormat A Tag 29 raw:  " . formatTLV('29', $infoA) . "\n";
echo "Format B Tag 29 raw:  " . formatTLV('29', $infoB) . "\n";
echo "\nFor account 'lyhour_chann@bkrt':\n";
echo " - Official GUID: kh.gov.nbc.bakong (length " . strlen('kh.gov.nbc.bakong') . ")\n";
echo " - Account ID length: " . strlen($bakongAccountId) . "\n";
