<?php
/**
 * Get Worker Unsettled Logs
 * GET: /api/api_get_worker_unsettled_logs.php?worker_id=123
 *
 * Returns work logs that haven't been settled yet for a specific worker
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Security: Check session/authentication
include 'check_auth.php';
include 'db_connect.php';

if (!isset($_GET['worker_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Worker ID is required"]);
    exit();
}

$worker_id = (int)$_GET['worker_id'];

// Get worker details
$stmt_worker = $conn->prepare("SELECT id, name, type FROM workers WHERE id = ?");
$stmt_worker->bind_param("i", $worker_id);
$stmt_worker->execute();
$worker = $stmt_worker->get_result()->fetch_assoc();
$stmt_worker->close();

if (!$worker) {
    http_response_code(404);
    echo json_encode(["message" => "Worker not found"]);
    exit();
}

// Get all unsettled work logs
$stmt_logs = $conn->prepare("
    SELECT wl.id, wl.log_date, wl.worker_id, wl.customer_id, wl.tons, wl.rate_per_ton,
           c.name AS customer_name,
           (wl.tons * wl.rate_per_ton) AS amount
    FROM work_logs wl
    JOIN customers c ON wl.customer_id = c.id
    WHERE wl.worker_id = ?
      AND wl.id NOT IN (
          SELECT work_log_id FROM settlement_work_logs
      )
    ORDER BY wl.log_date ASC
");

$stmt_logs->bind_param("i", $worker_id);
$stmt_logs->execute();
$result = $stmt_logs->get_result();

$unsettled_logs = [];
$total_tons = 0.00;
$total_amount = 0.00;
$from_date = null;
$to_date = null;

while ($log = $result->fetch_assoc()) {
    $unsettled_logs[] = [
        'id' => (int)$log['id'],
        'log_date' => $log['log_date'],
        'customer_name' => $log['customer_name'],
        'tons' => (float)$log['tons'],
        'rate_per_ton' => (float)$log['rate_per_ton'],
        'amount' => (float)$log['amount']
    ];

    $total_tons += (float)$log['tons'];
    $total_amount += (float)$log['amount'];

    if ($from_date === null || $log['log_date'] < $from_date) {
        $from_date = $log['log_date'];
    }
    if ($to_date === null || $log['log_date'] > $to_date) {
        $to_date = $log['log_date'];
    }
}

$stmt_logs->close();
$conn->close();

http_response_code(200);
echo json_encode([
    "worker" => [
        "id" => (int)$worker['id'],
        "name" => $worker['name'],
        "type" => $worker['type']
    ],
    "unsettled_logs" => $unsettled_logs,
    "summary" => [
        "count" => count($unsettled_logs),
        "total_tons" => $total_tons,
        "total_amount" => $total_amount,
        "from_date" => $from_date,
        "to_date" => $to_date
    ]
]);
?>
