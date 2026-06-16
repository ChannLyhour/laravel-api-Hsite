<?php

namespace App\Helpers;

class CustomKHQR
{
    public static function generate($bakongAccountId, $merchantName, $merchantCity, $amount, $currencyCode, $billNo)
    {
        $isIndividual = (strpos($bakongAccountId, '@') !== false) && !str_contains($bakongAccountId, '@retail') && !str_contains($bakongAccountId, '@merchant');
        if ($isIndividual) {
            return self::generateTag29($bakongAccountId, $merchantName, $merchantCity, $amount, $currencyCode, $billNo);
        }
        return self::generateTag30($bakongAccountId, $merchantName, $merchantCity, $amount, $currencyCode, $billNo);
    }

    public static function generateTag29($bakongAccountId, $merchantName, $merchantCity, $amount, $currencyCode, $billNo)
    {
        $payload = '';
        $payload .= self::formatTLV('00', '01'); // Payload Format Indicator
        $poi = ($amount > 0) ? '12' : '11';
        $payload .= self::formatTLV('01', $poi); // Point of Initiation Method: 11 for Static, 12 for Dynamic

        // Tag 29: Individual Account Information
        $subtag00 = self::formatTLV('00', $bakongAccountId);
        $subtag02 = self::formatTLV('02', 'Bakong'); // Acquiring Bank Name
        $individualAccountInfo = $subtag00 . $subtag02;
        $payload .= self::formatTLV('29', $individualAccountInfo);

        $payload .= self::formatTLV('52', '5999'); // MCC
        $payload .= self::formatTLV('53', (string)$currencyCode); // Currency
        
        if ($amount > 0) {
            $payload .= self::formatTLV('54', number_format($amount, 2, '.', '')); // Amount
        }
        
        $payload .= self::formatTLV('58', 'KH'); // Country Code
        $payload .= self::formatTLV('59', $merchantName); // Merchant Name
        $payload .= self::formatTLV('60', $merchantCity); // Merchant City

        // Tag 62: Additional Data Field
        $subtagBillNo = self::formatTLV('01', $billNo);
        $payload .= self::formatTLV('62', $subtagBillNo);

        $payload .= '6304'; // CRC tag and length
        
        $crc = self::calculateCRC16($payload);
        return $payload . $crc;
    }

    public static function generateTag30($bakongAccountId, $merchantName, $merchantCity, $amount, $currencyCode, $billNo)
    {
        $payload = '';
        $payload .= self::formatTLV('00', '01'); // Payload Format Indicator
        $poi = ($amount > 0) ? '12' : '11';
        $payload .= self::formatTLV('01', $poi); // Point of Initiation Method: 11 for Static, 12 for Dynamic

        // Tag 30: Merchant Account Information
        $subtag00 = self::formatTLV('00', 'A000000762000101');
        $subtag01 = self::formatTLV('01', $bakongAccountId);
        $subtag02 = self::formatTLV('02', 'Bakong'); // Acquiring Bank is mandatory
        $merchantAccountInfo = $subtag00 . $subtag01 . $subtag02;
        $payload .= self::formatTLV('30', $merchantAccountInfo);

        $payload .= self::formatTLV('52', '5999'); // MCC
        $payload .= self::formatTLV('53', (string)$currencyCode); // Currency
        
        if ($amount > 0) {
            $payload .= self::formatTLV('54', number_format($amount, 2, '.', '')); // Amount
        }
        
        $payload .= self::formatTLV('58', 'KH'); // Country Code
        $payload .= self::formatTLV('59', $merchantName); // Merchant Name
        $payload .= self::formatTLV('60', $merchantCity); // Merchant City

        // Tag 62: Additional Data Field
        $subtagBillNo = self::formatTLV('01', $billNo);
        $payload .= self::formatTLV('62', $subtagBillNo);

        // Tag 99: Timestamp (optional, omit to prevent format errors from weird timestamps)
        
        $payload .= '6304'; // CRC tag and length
        
        $crc = self::calculateCRC16($payload);
        return $payload . $crc;
    }

    private static function formatTLV($tag, $value)
    {
        // For EMVCo, length is the number of bytes in UTF-8
        $length = str_pad((string)strlen($value), 2, '0', STR_PAD_LEFT);
        return $tag . $length . $value;
    }

    private static function calculateCRC16($str)
    {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($str); $i++) {
            $x = (($crc >> 8) ^ ord($str[$i])) & 0xFF;
            $x ^= $x >> 4;
            $crc = (($crc << 8) ^ ($x << 12) ^ ($x << 5) ^ $x) & 0xFFFF;
        }
        return sprintf('%04X', $crc);
    }
}
