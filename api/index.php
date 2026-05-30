<?php

// Fix the SCRIPT_NAME and PHP_SELF when running under Vercel's /api folder.
// Since Vercel routes everything to /api/index.php, Laravel detects the base path as /api.
// Changing SCRIPT_NAME and PHP_SELF to /index.php prevents Laravel from stripping /api from the URI.
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

// Forward Vercel serverless requests to the standard Laravel entry point
require __DIR__ . '/../public/index.php';

