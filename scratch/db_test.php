<?php
$host = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
$port = 4000;
$db = 'hsite_system_api';
$user = 'EqyMtPi63u9wFEb.root';
$ssl_ca = 'ca.pem.tidb';

$pw1 = 'zWWeicsHRhaewUY0';
$pw2 = 'vDz5l9R1W4EZk4WB';

echo "Testing zWWeicsHRhaewUY0...\n";
try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pw1, [
        PDO::MYSQL_ATTR_SSL_CA => $ssl_ca
    ]);
    echo "zWWeicsHRhaewUY0: SUCCESS!\n";
} catch (Exception $e) {
    echo "zWWeicsHRhaewUY0: FAILED: " . $e->getMessage() . "\n";
}

echo "\nTesting vDz5l9R1W4EZk4WB...\n";
try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pw2, [
        PDO::MYSQL_ATTR_SSL_CA => $ssl_ca
    ]);
    echo "vDz5l9R1W4EZk4WB: SUCCESS!\n";
} catch (Exception $e) {
    echo "vDz5l9R1W4EZk4WB: FAILED: " . $e->getMessage() . "\n";
}
