<?php

namespace App\Helpers;

class CustomKHQR
{
    public static function generate($bakongAccountId, $merchantName, $merchantCity, $amount, $currencyCode, $billNo)
    {
        $acquiringBank = 'Bakong';
        if (strpos($bakongAccountId, '@') !== false) {
            $parts = explode('@', $bakongAccountId);
            $domain = end($parts);
            if (strtolower($domain) === 'wing') {
                $acquiringBank = 'Wing Bank';
            } elseif (strtolower($domain) === 'aba') {
                $acquiringBank = 'ABA Bank';
            } elseif (strtolower($domain) === 'acleda') {
                $acquiringBank = 'ACLEDA Bank';
            }
        }

        $isIndividual = (strpos($bakongAccountId, '@') !== false) && !str_contains($bakongAccountId, '@retail') && !str_contains($bakongAccountId, '@merchant');

        if ($isIndividual) {
            $individualInfo = new \Piseth\BakongKhqr\Models\IndividualInfo(
                $bakongAccountId,
                $merchantName ?: 'Merchant',
                $merchantCity ?: 'Phnom Penh',
                $acquiringBank,
                null, // accountInformation
                (int)$currencyCode,
                (float)$amount,
                $billNo
            );
            $res = \Piseth\BakongKhqr\BakongKHQR::generateIndividual($individualInfo);
            return $res->data['qr'];
        } else {
            $merchantID = '123456';
            if (strpos($bakongAccountId, '@') !== false) {
                $parts = explode('@', $bakongAccountId);
                $merchantID = $parts[0];
            }
            $merchantInfo = new \Piseth\BakongKhqr\Models\MerchantInfo(
                $bakongAccountId,
                $merchantName ?: 'Merchant',
                $merchantCity ?: 'Phnom Penh',
                $merchantID,
                $acquiringBank,
                null, // accountInformation
                (int)$currencyCode,
                (float)$amount,
                $billNo
            );
            $res = \Piseth\BakongKhqr\BakongKHQR::generateMerchant($merchantInfo);
            return $res->data['qr'];
        }
    }

    /**
     * Generate a WebP QR code image in Base64 data format.
     */
    public static function generateWebpQrBase64($qrString, $size = 300)
    {
        try {
            $level = \BaconQrCode\Common\ErrorCorrectionLevel::H();
            $qrCode = \BaconQrCode\Encoder\Encoder::encode($qrString, $level);
            $matrix = $qrCode->getMatrix();
            
            $width = $matrix->getWidth();
            $height = $matrix->getHeight();
            
            // Calculate pixel scaling to hit requested size closely while maintaining grid alignment
            $margin = 4; // EMVCo quiet zone modules
            $totalModules = $width + ($margin * 2);
            $pixelSize = max(1, (int)round($size / $totalModules));
            
            $imgWidth = $totalModules * $pixelSize;
            $imgHeight = $totalModules * $pixelSize;
            
            $img = imagecreatetruecolor($imgWidth, $imgHeight);
            $white = imagecolorallocate($img, 255, 255, 255);
            $black = imagecolorallocate($img, 0, 0, 0);
            
            // Fill background with white
            imagefilledrectangle($img, 0, 0, $imgWidth - 1, $imgHeight - 1, $white);
            
            for ($y = 0; $y < $height; $y++) {
                for ($x = 0; $x < $width; $x++) {
                    if ($matrix->get($x, $y) === 1 || $matrix->get($x, $y) === true) {
                        $x1 = ($x + $margin) * $pixelSize;
                        $y1 = ($y + $margin) * $pixelSize;
                        $x2 = $x1 + $pixelSize - 1;
                        $y2 = $y1 + $pixelSize - 1;
                        imagefilledrectangle($img, $x1, $y1, $x2, $y2, $black);
                    }
                }
            }
            
            ob_start();
            imagewebp($img, null, 85); // 85% WebP quality
            $webpData = ob_get_clean();
            
            if (function_exists('imagedestroy')) {
                @imagedestroy($img);
            }
            
            return 'data:image/webp;base64,' . base64_encode($webpData);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('WebP QR generation failed: ' . $e->getMessage());
            return '';
        }
    }

    private static function sanitizeString($string, $default = 'Merchant')
    {
        // Transliterate or remove non-ASCII characters to guarantee Latin characters for EMVCo compatibility
        $string = preg_replace('/[^\x20-\x7E]/', '', $string);
        // Remove special characters that might break EMVCo
        $string = str_replace(['"', "'", '&', '<', '>', '@', '#', '$', '%', '*', '^', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ';', ':', ',', '?', '/'], '', $string);
        // Replace multiple spaces with single space
        $string = preg_replace('/\s+/', ' ', $string);
        $string = trim($string);
        return empty($string) ? $default : $string;
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
