<?php
declare(strict_types=1);

/*
 * Reads DATABASE_URL from every place PHP might expose it.
 * Under `php -S` getenv() is the reliable one; $_ENV is often empty
 * because of variables_order, so we check all three.
 */
$url = getenv('DATABASE_URL');
if ($url === false || $url === '') {
    $url = $_ENV['DATABASE_URL'] ?? $_SERVER['DATABASE_URL'] ?? '';
}
// Strip whitespace and stray quotes that sometimes get pasted into dashboards.
$url = trim((string) $url, " \t\n\r\0\x0B\"'");

return [
    'database_url' => $url,

    // SQLite is ONLY used when you explicitly opt in (local dev).
    // On Render, a missing DATABASE_URL is now a hard error instead of
    // silently reading an empty local database.
    'allow_sqlite_fallback' => (getenv('APP_ENV') ?: '') === 'local',
    'sqlite_path' => __DIR__ . '/storage/status.sqlite',

    // Set APP_DEBUG=1 on Render temporarily to see real DB error messages.
    'debug' => (getenv('APP_DEBUG') ?: '') === '1',
];