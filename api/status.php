<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
// GET /api/status.php?uetr=<uetr>
// Returns status events reported by connected banks, oldest first. No bank is connected yet,
// so `events` is always empty and the site shows the "no status" page.

declare(strict_types=1);
require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    send_json(405, ['error' => 'method_not_allowed']);
}

$uetr = strtolower(trim((string) ($_GET['uetr'] ?? '')));
if (!preg_match(UETR_RE, $uetr)) {
    send_json(400, ['error' => 'invalid_uetr']);
}

try {
    rate_limit('status', 30, 60);
    $q = db()->prepare(
        'SELECT status_code, reason_code, agent_bic, occurred_at, received_at, source
           FROM payment_status_events WHERE uetr = ? ORDER BY occurred_at ASC, id ASC'
    );
    $q->execute([$uetr]);
    $events = array_map(
        fn ($r) => [
            'status' => $r['status_code'],
            'reason' => $r['reason_code'],
            'agentBic' => $r['agent_bic'],
            'occurredAt' => $r['occurred_at'],
            'receivedAt' => $r['received_at'],
            'source' => $r['source'],
        ],
        $q->fetchAll()
    );
} catch (Throwable $e) {
    error_log('status.php: ' . $e->getMessage());
    send_json(503, ['error' => 'unavailable']);
}

send_json(200, [
    'uetr' => $uetr,
    'events' => $events,
    'partnersConnected' => 0,
    'checkedAt' => gmdate('Y-m-d\TH:i:s\Z'),
]);
