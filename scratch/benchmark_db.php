<?php
// Standalone DB Performance Benchmark Script

$host = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
$port = 4000;
$db = 'hsite_system_api';
$user = 'EqyMtPi63u9wFEb.root';
$pass = 'zWWeicsHRhaewUY0';
$ca = __DIR__ . '/../ca.pem.tidb';

echo "=== TiDB Cloud Performance Benchmark ===\n\n";

// 1. Measure Connection Time (TCP + SSL Handshake)
$startConnect = microtime(true);
try {
    $options = [
        PDO::MYSQL_ATTR_SSL_CA => $ca,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ];
    $dsn = "mysql:host=$host;port=$port;dbname=$db";
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}
$endConnect = microtime(true);
$connectTime = ($endConnect - $startConnect) * 1000;
echo "1. TCP + SSL Connection Handshake: " . number_format($connectTime, 2) . " ms\n";

// 2. Measure Simple Query Time (SELECT 1)
$queries = 10;
$totalQueryTime = 0;
for ($i = 0; $i < $queries; $i++) {
    $startQuery = microtime(true);
    $pdo->query("SELECT 1")->fetch();
    $endQuery = microtime(true);
    $totalQueryTime += ($endQuery - $startQuery);
}
$avgQueryTime = ($totalQueryTime / $queries) * 1000;
echo "2. Simple Query (SELECT 1) average over $queries runs: " . number_format($avgQueryTime, 2) . " ms\n";

// 3. Try querying table 'stores'
try {
    $startQuery = microtime(true);
    $stmt = $pdo->query("SELECT COUNT(*) FROM stores");
    $count = $stmt->fetchColumn();
    $endQuery = microtime(true);
    $tableQueryTime = ($endQuery - $startQuery) * 1000;
    echo "3. Query table 'stores' (Count: $count): " . number_format($tableQueryTime, 2) . " ms\n";
} catch (Exception $e) {
    echo "3. Query table 'stores' failed (table may not exist yet): " . $e->getMessage() . "\n";
}

// 4. Try querying table 'products'
try {
    $startQuery = microtime(true);
    $stmt = $pdo->query("SELECT COUNT(*) FROM products");
    $count = $stmt->fetchColumn();
    $endQuery = microtime(true);
    $tableQueryTime = ($endQuery - $startQuery) * 1000;
    echo "4. Query table 'products' (Count: $count): " . number_format($tableQueryTime, 2) . " ms\n";
} catch (Exception $e) {
    echo "4. Query table 'products' failed (table may not exist yet): " . $e->getMessage() . "\n";
}

echo "\n========================================\n";
