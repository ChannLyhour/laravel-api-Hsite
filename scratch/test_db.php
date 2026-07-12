<?php
$host = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
$port = 4000;

$databases = [
    'hsitc_system_api',
    'hsite_system_api',
];

$usernames = [
    'EqyMIP163u9wFEB.root',
    'EqyMIP163u9wFEb.root',
    'EqyMlP163u9wFEB.root',
    'EqyMlP163u9wFEb.root',
];

$passwords = [
    'zWWeicsHRhzcwUYO',
    'zWWeicsHRhzcwUY0',
    'zWWe1csHRhzcwUYO',
    'zWWe1csHRhzcwUY0',
    'zWWeicsHRhacwUYO',
    'zWWeicsHRhacwUY0',
    'zWWe1csHRhacwUYO',
    'zWWe1csHRhacwUY0',
    'zWWeicsHRhzcwUYo',
    'zWWe1csHRhzcwUYo',
    'zWWeicsHRhacwUYo',
    'zWWe1csHRhacwUYo',
];

$ca = __DIR__ . '/../ca.pem.tidb';

foreach ($databases as $db) {
    foreach ($usernames as $user) {
        foreach ($passwords as $pass) {
            echo "Testing: DB=$db, USER=$user, PASS=$pass ... ";
            try {
                $options = [
                    PDO::MYSQL_ATTR_SSL_CA => $ca,
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                ];
                $dsn = "mysql:host=$host;port=$port;dbname=$db";
                $pdo = new PDO($dsn, $user, $pass, $options);
                echo "SUCCESS!\n";
                exit(0);
            } catch (Exception $e) {
                $msg = $e->getMessage();
                if (str_contains($msg, 'Access denied')) {
                    echo "Access Denied\n";
                } else {
                    echo "ERROR: " . $msg . "\n";
                }
            }
        }
    }
}
