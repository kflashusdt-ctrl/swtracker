<?php
declare(strict_types=1);

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

const UETR_RE = '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/';
const BIC_RE = '/^[A-Z0-9]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/';

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

/**
 * Converts postgresql://user:pass@host:port/db?sslmode=... into what PDO
 * actually accepts: ['pgsql:host=...;port=...;dbname=...;sslmode=...', user, pass].
 */
function pg_dsn_from_url(string $url): array
{
    $p = parse_url($url);
    if ($p === false || !isset($p['scheme'], $p['host'])) {
        throw new RuntimeException('DATABASE_URL is not a valid URL');
    }
    if (!in_array(strtolower($p['scheme']), ['postgres', 'postgresql', 'pgsql'], true)) {
        throw new RuntimeException('DATABASE_URL must start with postgresql://');
    }

    $host = $p['host'];
    $port = (int) ($p['port'] ?? 5432);
    $db   = isset($p['path']) ? ltrim(rawurldecode($p['path']), '/') : '';
    $db   = $db !== '' ? $db : 'postgres';
    $user = isset($p['user']) ? rawurldecode($p['user']) : null;
    $pass = isset($p['pass']) ? rawurldecode($p['pass']) : null;

    parse_str($p['query'] ?? '', $query);
    $sslmode = is_string($query['sslmode'] ?? null) ? $query['sslmode'] : 'require';

    $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s;sslmode=%s', $host, $port, $db, $sslmode);
    return [$dsn, $user, $pass];
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $c = config();
    $url = $c['database_url'];
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10,
    ];

    if ($url === '' || str_starts_with($url, 'sqlite:')) {
        if ($url === '' && !$c['allow_sqlite_fallback']) {
            throw new RuntimeException(
                'DATABASE_URL is not set in this environment; refusing to fall back to SQLite'
            );
        }
        $path = $url === '' ? $c['sqlite_path'] : substr($url, 7);
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        $pdo = new PDO('sqlite:' . $path, null, null, $options);
    } elseif (str_starts_with($url, 'pgsql:')) {
        $pdo = new PDO($url, null, null, $options);
    } else {
        [$dsn, $user, $pass] = pg_dsn_from_url($url);
        $options[PDO::ATTR_EMULATE_PREPARES] = true;
        $pdo = new PDO($dsn, $user, $pass, $options);
    }

    migrate($pdo);
    return $pdo;
}

function db_driver(): string
{
    return (string) db()->getAttribute(PDO::ATTR_DRIVER_NAME);
}

function migrate(PDO $pdo): void
{
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
    $fwd = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($fwd !== '') {
        return trim(explode(',', $fwd)[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function rate_limit(string $name, int $max, int $windowSeconds): void
{
    $pdo = db();
    $bucket = $name . ':' . hash('sha256', client_ip());
    $now = time();
    $isPostgres = ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql');

    $row = $pdo->prepare('SELECT hits, window_start FROM rate_limits WHERE bucket = ?');
    $row->execute([$bucket]);
    $r = $row->fetch();

    if (!$r || $now - (int) $r['window_start'] >= $windowSeconds) {
        if ($isPostgres) {
            $pdo->prepare(
                'INSERT INTO rate_limits (bucket, hits, window_start) VALUES (?, 1, ?)
                 ON CONFLICT (bucket) DO UPDATE SET hits = 1, window_start = EXCLUDED.window_start'
            )->execute([$bucket, $now]);
        } else {
            $pdo->prepare('REPLACE INTO rate_limits (bucket, hits, window_start) VALUES (?, 1, ?)')
                ->execute([$bucket, $now]);
        }
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