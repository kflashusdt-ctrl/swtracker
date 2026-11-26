<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    send_json(405, ['error' => 'method_not_allowed']);
}

$uetr = strtolower(trim((string) ($_GET['uetr'] ?? '')));
if (!preg_match(UETR_RE, $uetr)) {
    send_json(400, ['error' => 'invalid_uetr']);
}

try {
    $driver = db_driver();
    rate_limit('status', 30, 60);

    $q = db()->prepare(
        'SELECT status_code, reason_code, agent_bic, occurred_at, received_at, source
           FROM payment_status_events
          WHERE lower(trim(uetr)) = ?
          ORDER BY occurred_at ASC, id ASC'
    );
    $q->execute([$uetr]);

    $events = array_map(
        fn (array $r) => [
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
    error_log('[status.php] ' . $e->getMessage()); 
    $body = ['error' => 'DB_ERROR'];
    if (config()['debug']) {
        $body['message'] = $e->getMessage();
    }
    send_json(500, $body);
}

send_json(200, [
    'uetr' => $uetr,
    'events' => $events,
    'partnersConnected' => 0,
    'db' => $driver, 
    'checkedAt' => gmdate('Y-m-d\TH:i:s\Z'),
]);