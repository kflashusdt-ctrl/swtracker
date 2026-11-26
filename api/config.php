<?php

// Internal file: refuse direct HTTP requests on any server (Apache also blocks it via .htaccess).
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}
// Configuration. Override with environment variables or an api/config.local.php
// that returns an array with the same keys (it is git-ignored).
//
//   STATUS_DB_DSN   default: SQLite file in api/storage/  (MySQL example: mysql:host=localhost;dbname=bicfinder;charset=utf8mb4)
//   STATUS_DB_USER / STATUS_DB_PASS

$defaults = [
    'db_dsn' => getenv('STATUS_DB_DSN') ?: 'sqlite:' . __DIR__ . '/storage/status.sqlite',
    'db_user' => getenv('STATUS_DB_USER') ?: null,
    'db_pass' => getenv('STATUS_DB_PASS') ?: null,
];

$local = __DIR__ . '/config.local.php';
return is_file($local) ? array_merge($defaults, require $local) : $defaults;
