<?php
// Shared helpers for the payment status API.
// Read-only: no bank is connected yet, so nothing writes statuses. There is deliberately
// no endpoint or form for typing a status in by hand — when a bank partner is signed, its
// official API becomes the only way statuses enter payment_status_events.

declare(strict_types=1);

// Internal file: refuse direct HTTP requests on any server (Apache also blocks it via .htaccess).
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

const UETR_RE = '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/';
const BIC_RE = '/^[A-Z0-9]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/';

// SWIFT gpi transaction status codes (ISO 20022) and the gpi reason codes used with ACSP.
const STATUS_CODES = ['ACSP', 'ACCC', 'RJCT'];
const REASON_CODES = ['G000', 'G001', 'G002', 'G003', 'G004'];

function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = require __DIR__ . '/config.php';
    }
    return $cfg;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }
    $c = config();
    if (str_starts_with($c['db_dsn'], 'sqlite:')) {
        $dir = dirname(substr($c['db_dsn'], 7));
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
    }
    $pdo = new PDO($c['db_dsn'], $c['db_user'], $c['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    migrate($pdo);
    return $pdo;
}

function migrate(PDO $pdo): void
{
    // MySQL/MariaDB: create the tables once with api/schema.mysql.sql.
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'sqlite') {
        return;
    }
    $pdo->exec("CREATE TABLE IF NOT EXISTS payment_status_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uetr CHAR(36) NOT NULL,
        status_code CHAR(4) NOT NULL,
        reason_code CHAR(4) NULL,
        agent_bic VARCHAR(11) NULL,
        occurred_at VARCHAR(25) NOT NULL,
        received_at VARCHAR(25) NOT NULL,
        source VARCHAR(64) NOT NULL,
        event_hash CHAR(64) NOT NULL UNIQUE
    )");
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_pse_uetr ON payment_status_events (uetr)');
    $pdo->exec("CREATE TABLE IF NOT EXISTS rate_limits (
        bucket VARCHAR(80) PRIMARY KEY,
        hits INTEGER NOT NULL,
        window_start INTEGER NOT NULL
    )");
}

function send_json(int $code, array $body): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
    exit;
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/** Simple fixed-window rate limit. */
function rate_limit(string $name, int $max, int $windowSeconds): void
{
    $pdo = db();
    $bucket = $name . ':' . hash('sha256', client_ip());
    $now = time();
    $row = $pdo->prepare('SELECT hits, window_start FROM rate_limits WHERE bucket = ?');
    $row->execute([$bucket]);
    $r = $row->fetch();
    if (!$r || $now - (int) $r['window_start'] >= $windowSeconds) {
        $pdo->prepare('REPLACE INTO rate_limits (bucket, hits, window_start) VALUES (?, 1, ?)')->execute([$bucket, $now]);
        return;
    }
    if ((int) $r['hits'] >= $max) {
        header('Retry-After: ' . ($windowSeconds - ($now - (int) $r['window_start'])));
        send_json(429, ['error' => 'too_many_requests']);
    }
    $pdo->prepare('UPDATE rate_limits SET hits = hits + 1 WHERE bucket = ?')->execute([$bucket]);
}

function iso_utc(string $value): ?string
{
    $ts = strtotime($value);
    return $ts === false ? null : gmdate('Y-m-d\TH:i:s\Z', $ts);
}
