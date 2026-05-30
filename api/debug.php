<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "<h1>Vercel PHP Debug Info</h1>";
echo "<pre>";

echo "PHP Version: " . PHP_VERSION . "\n";
echo "Loaded Extensions: " . implode(", ", get_loaded_extensions()) . "\n";

try {
    echo "\nTesting Database Connection:\n";
    $host = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
    $port = 4000;
    $db = 'food_ordering_system';
    $user = 'EqyMtPi63u9wFEb.root';
    $pass = 'G3giDx5LYYCHZrzx';
    
    $caPath = realpath(__DIR__ . '/../ca.pem');
    echo "CA Cert Path: " . $caPath . " (Exists: " . (file_exists($caPath) ? 'Yes' : 'No') . ")\n";

    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    $options = [];
    if (defined('PDO::MYSQL_ATTR_SSL_CA') && file_exists($caPath)) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $caPath;
        echo "Using SSL CA Option: PDO::MYSQL_ATTR_SSL_CA\n";
    }

    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "Connection Successful!\n";
    
    $stmt = $pdo->query("SELECT VERSION()");
    echo "Database Version: " . $stmt->fetchColumn() . "\n";
} catch (\Throwable $e) {
    echo "Connection Failed: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "</pre>";
