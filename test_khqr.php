<?php
function formatTLV($tag, $value) { 
    $len = str_pad(strlen($value), 2, '0', STR_PAD_LEFT); 
    return $tag . $len . $value; 
} 
function calcCrc($str) { 
    $crc = 0xFFFF; 
    for ($i = 0; $i < strlen($str); $i++) { 
        $x = (($crc >> 8) ^ ord($str[$i])) & 0xFF; 
        $x ^= $x >> 4; 
        $crc = (($crc << 8) ^ ($x << 12) ^ ($x << 5) ^ $x) & 0xFFFF; 
    } 
    return sprintf('%04X', $crc); 
} 

$payload = formatTLV('00', '01'); 
$payload .= formatTLV('01', '12'); 
$tag29 = formatTLV('00', 'kh.gov.nbc.bakong') . formatTLV('01', 'lisacafe@aba'); 
$payload .= formatTLV('29', $tag29); 
$payload .= formatTLV('52', '5999'); 
$payload .= formatTLV('53', '840'); 
$payload .= formatTLV('54', '0.10'); 
$payload .= formatTLV('58', 'KH'); 
$payload .= formatTLV('59', 'LISA CAFE'); 
$payload .= formatTLV('60', 'Phnom Penh'); 
$tag62 = formatTLV('01', 'ORD-123'); 
$payload .= formatTLV('62', $tag62); 
$payload .= '6304'; 
echo $payload . calcCrc($payload) . PHP_EOL;
