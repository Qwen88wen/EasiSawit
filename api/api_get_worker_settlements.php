<?php
/**
 * Get Worker Settlements
 * GET: /api/api_get_worker_settlements.php?worker_id=123
 *
 * Returns settlement history for a specific worker
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

$worker_id = isset($_GET['worker_id']) ? (int)$_GET['worker_id'] : null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
$status = isset($_GET['status']) ? $_GET['status'] : null;

// Build query
$where_clauses = [];
$bind_types = '';
$bind_params = [];

if ($worker_id !== null) {
    $where_clauses[] = "ws.worker_id = ?";
    $bind_types .= 'i';
    $bind_params[] = $worker_id;
}

if ($status !== null && in_array($status, ['pending', 'paid', 'cancelled'])) {
    $where_clauses[] = "ws.payment_status = ?";
    $bind_types .= 's';
    $bind_params[] = $status;
}

$where_sql = count($where_clauses) > 0 ? 'WHERE ' . implode(' AND ', $where_clauses) : '';

$sql = "
    SELECT ws.*, w.name AS worker_name, w.type AS worker_type,
           (SELECT COUNT(*) FROM settlement_work_logs swl WHERE swl.settlement_id = ws.id) AS work_logs_count
    FROM worker_settlements ws
    JOIN workers w ON ws.worker_id = w.id
    $where_sql
    ORDER BY ws.created_at DESC
    LIMIT ?
";

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $conn->error]);
    exit();
}

// Bind parameters
$bind_types .= 'i';
$bind_params[] = $limit;

if (!empty($bind_params)) {
    $stmt->bind_param($bind_types, ...$bind_params);
}

$stmt->execute();
$result = $stmt->get_result();

$settlements = [];

while ($row = $result->fetch_assoc()) {
    $settlements[] = [
        'id' => (int)$row['id'],
        'worker_id' => (int)$row['worker_id'],
        'worker_name' => $row['worker_name'],
        'worker_type' => $row['worker_type'],
        'settlement_date' => $row['settlement_date'],
        'from_date' => $row['from_date'],
        'to_date' => $row['to_date'],
        'total_tons' => (float)$row['total_tons'],
        'gross_pay' => (float)$row['gross_pay'],
        'total_deductions' => (float)$row['total_deductions'],
        'net_pay' => (float)$row['net_pay'],
        'epf_employee' => (float)$row['epf_employee'],
        'epf_employer' => (float)$row['epf_employer'],
        'socso_employee' => (float)$row['socso_employee'],
        'socso_employer' => (float)$row['socso_employer'],
        'eis_employee' => (float)$row['eis_employee'],
        'eis_employer' => (float)$row['eis_employer'],
        'pcb_mtd' => (float)$row['pcb_mtd'],
        'payment_status' => $row['payment_status'],
        'payment_method' => $row['payment_method'],
        'notes' => $row['notes'],
        'work_logs_count' => (int)$row['work_logs_count'],
        'created_at' => $row['created_at'],
        'paid_at' => $row['paid_at']
    ];
}

$stmt->close();
$conn->close();

http_response_code(200);
echo json_encode($settlements);
?>
