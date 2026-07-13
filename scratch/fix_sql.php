<?php
$files = [
    'd:/Laravel-Tutorial/laravel-api-VHsite/hsite_system_api.sql',
    'd:/Laravel-Tutorial/laravel-api-VHsite/food_ordering_system.sql'
];

foreach ($files as $sqlFile) {
    if (!file_exists($sqlFile)) {
        echo "File not found: $sqlFile\n";
        continue;
    }

    $content = file_get_contents($sqlFile);

    // Replace ROW_FORMAT = Compact with ROW_FORMAT = Dynamic
    $pattern = '/ROW_FORMAT\s*=\s*Compact/i';
    $replacement = 'ROW_FORMAT = Dynamic';

    $count = 0;
    $newContent = preg_replace($pattern, $replacement, $content, -1, $count);

    if ($newContent !== null) {
        file_put_contents($sqlFile, $newContent);
        echo "Successfully replaced $count occurrences in " . basename($sqlFile) . ".\n";
    } else {
        echo "Error processing " . basename($sqlFile) . ".\n";
    }
}
