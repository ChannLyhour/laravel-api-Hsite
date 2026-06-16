<?php
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

$payload1 = "00020101021129180014jonhsmith@nbcq5204599953031165802KH5910Jonh Smith6010PHNOM PENH9917001317394957787226304";
echo "Test 1 Expected: 6894\n";
echo "Test 1 Actual:   " . calculateCRC16($payload1) . "\n";

$payload2 = "00020101021229420013ishinvin@devb01090123456780208Dev Bank5204599953031165405100005802KH5909Ishin Vin6010Phnom Penh62680114INV-2022-12-250211855123456780310Ishin Shop07060123450807Payment64180002ZH0102文山0202金边993400131755076232336011317550762923366304";
echo "Test 2 Expected: 16C4\n";
echo "Test 2 Actual:   " . calculateCRC16($payload2) . "\n";
