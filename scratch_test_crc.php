<?php
require __DIR__ . '/vendor/autoload.php';
use KHQR\Models\CRC;

$payload = "00020101021230410016A0000007620001010117lyhour_chann@bkrt52045999530384054040.105802KH5912Lyhour Chann6010Phnom Penh62100106ORD1236304";
$sdkCrc = new CRC('63', $payload);

function calculateCRC16($str)
{
    $crc = 0xFFFF;
    for ($i = 0; $i < strlen($str); $i++) {
        $x = (($crc >> 8) ^ ord($str[$i])) & 0xFF;
        $x ^= $x >> 4;
        $crc = (($crc << 8) ^ ($x << 12) ^ ($x << 5) ^ $x) & 0xFFFF;
    }
    return sprintf('%04X', $crc);
}

$myCrc = calculateCRC16($payload);

echo "SDK CRC: " . $sdkCrc->value . "\n";
echo "My CRC: " . $myCrc . "\n";
