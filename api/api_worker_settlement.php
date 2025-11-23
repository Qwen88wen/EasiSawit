<?php
/**
 * Worker On-Demand Settlement API
 * POST: /api/api_worker_settlement.php
 *
 * Processes settlement request for a worker
 * Calculates pay for all unsettled work logs
 * Supports cross-month settlement
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Security: Check session/authentication
include 'check_auth.php';
include 'db_connect.php';

// Get request data
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->worker_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Worker ID is required"]);
    exit();
}

$worker_id = (int)$data->worker_id;
$settlement_date = isset($data->settlement_date) ? $data->settlement_date : date('Y-m-d');
$payment_method = isset($data->payment_method) ? $data->payment_method : null;
$notes = isset($data->notes) ? $data->notes : null;

try {
    // Start transaction
    $conn->begin_transaction();

    // ========================================================================
    // STEP 1: Get Worker Details
    // ========================================================================
    $stmt_worker = $conn->prepare("
        SELECT id, name, type, age, marital_status, children_count, spouse_working, zakat_monthly
        FROM workers
        WHERE id = ? AND status = 'Active'
    ");
    $stmt_worker->bind_param("i", $worker_id);
    $stmt_worker->execute();
    $worker = $stmt_worker->get_result()->fetch_assoc();
    $stmt_worker->close();

    if (!$worker) {
        throw new Exception("Worker not found or inactive");
    }

    $worker_type = $worker['type']; // 'Local' or 'Foreign'

    // ========================================================================
    // STEP 2: Get All Unsettled Work Logs for this Worker
    // ========================================================================
    $stmt_logs = $conn->prepare("
        SELECT wl.id, wl.log_date, wl.worker_id, wl.customer_id, wl.tons, wl.rate_per_ton,
               c.name AS customer_name
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
    $result_logs = $stmt_logs->get_result();

    if ($result_logs->num_rows === 0) {
        throw new Exception("No unsettled work logs found for this worker");
    }

    // Collect work logs and calculate totals
    $work_logs = [];
    $total_tons = 0.00;
    $base_income = 0.00;
    $from_date = null;
    $to_date = null;

    while ($log = $result_logs->fetch_assoc()) {
        $log_amount = $log['tons'] * $log['rate_per_ton'];
        $work_logs[] = [
            'id' => $log['id'],
            'log_date' => $log['log_date'],
            'customer_name' => $log['customer_name'],
            'tons' => $log['tons'],
            'rate_per_ton' => $log['rate_per_ton'],
            'amount' => $log_amount
        ];

        $total_tons += (float)$log['tons'];
        $base_income += $log_amount;

        // Track date range
        if ($from_date === null || $log['log_date'] < $from_date) {
            $from_date = $log['log_date'];
        }
        if ($to_date === null || $log['log_date'] > $to_date) {
            $to_date = $log['log_date'];
        }
    }
    $stmt_logs->close();

    // ========================================================================
    // STEP 3: Calculate Statutory Deductions
    // ========================================================================

    // Include helper functions from payroll calculation
    include_once 'api_calculate_payroll_helpers.php';

    $gross_pay = $base_income;

    // Initialize deductions
    $epf_employee = 0.00;
    $epf_employer = 0.00;
    $socso_employee = 0.00;
    $socso_employer = 0.00;
    $eis_employee = 0.00;
    $eis_employer = 0.00;
    $pcb_mtd = 0.00;

    if ($worker_type === 'Local') {
        // EPF Calculation (11% employee, 12-13% employer)
        $epf_employee = round($gross_pay * 0.11, 2);

        // Employer contribution depends on age
        if ($worker['age'] >= 60) {
            $epf_employer = round($gross_pay * 0.04, 2);
        } else {
            $epf_employer = round($gross_pay * 0.13, 2);
        }

        // SOCSO and EIS lookup
        if (function_exists('lookup_socso_eis')) {
            $socso_eis = lookup_socso_eis($conn, $gross_pay);
            $socso_employee = $socso_eis['socso_employee'];
            $socso_employer = $socso_eis['socso_employer'];
            $eis_employee = $socso_eis['eis_employee'];
            $eis_employer = $socso_eis['eis_employer'];
        }

        // PCB (simplified - using basic calculation)
        // For proper PCB, would need MTD calculation
        $taxable_income = $gross_pay;

        // Basic PCB calculation (example, should use proper PCB tables)
        if ($taxable_income > 5000) {
            $pcb_mtd = round(($taxable_income - 5000) * 0.08, 2);
        }

    } else if ($worker_type === 'Foreign') {
        // Foreign workers: Only SOCSO (employer only)
        if (function_exists('lookup_socso_foreign_employer')) {
            $socso_employer = lookup_socso_foreign_employer($conn, $gross_pay);
        }
    }

    $total_deductions = $epf_employee + $socso_employee + $eis_employee + $pcb_mtd;
    $net_pay = $gross_pay - $total_deductions;

    // ========================================================================
    // STEP 4: Create Settlement Record
    // ========================================================================
    $stmt_settlement = $conn->prepare("
        INSERT INTO worker_settlements (
            worker_id, settlement_date, from_date, to_date,
            total_tons, gross_pay, total_deductions, net_pay,
            epf_employee, epf_employer, socso_employee, socso_employer,
            eis_employee, eis_employer, pcb_mtd,
            payment_status, payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    ");

    $stmt_settlement->bind_param(
        "isssdddddddddddss",
        $worker_id,
        $settlement_date,
        $from_date,
        $to_date,
        $total_tons,
        $gross_pay,
        $total_deductions,
        $net_pay,
        $epf_employee,
        $epf_employer,
        $socso_employee,
        $socso_employer,
        $eis_employee,
        $eis_employer,
        $pcb_mtd,
        $payment_method,
        $notes
    );

    if (!$stmt_settlement->execute()) {
        throw new Exception("Failed to create settlement record: " . $stmt_settlement->error);
    }

    $settlement_id = $stmt_settlement->insert_id;
    $stmt_settlement->close();

    // ========================================================================
    // STEP 5: Link Work Logs to Settlement
    // ========================================================================
    $stmt_link = $conn->prepare("
        INSERT INTO settlement_work_logs (settlement_id, work_log_id, log_date, amount)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($work_logs as $log) {
        $stmt_link->bind_param(
            "iisd",
            $settlement_id,
            $log['id'],
            $log['log_date'],
            $log['amount']
        );

        if (!$stmt_link->execute()) {
            throw new Exception("Failed to link work log: " . $stmt_link->error);
        }
    }
    $stmt_link->close();

    // Commit transaction
    $conn->commit();

    // ========================================================================
    // STEP 6: Return Settlement Details
    // ========================================================================
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Settlement created successfully",
        "settlement" => [
            "id" => $settlement_id,
            "worker_id" => $worker_id,
            "worker_name" => $worker['name'],
            "worker_type" => $worker_type,
            "settlement_date" => $settlement_date,
            "from_date" => $from_date,
            "to_date" => $to_date,
            "total_tons" => (float)$total_tons,
            "gross_pay" => (float)$gross_pay,
            "epf_employee" => (float)$epf_employee,
            "epf_employer" => (float)$epf_employer,
            "socso_employee" => (float)$socso_employee,
            "socso_employer" => (float)$socso_employer,
            "eis_employee" => (float)$eis_employee,
            "eis_employer" => (float)$eis_employer,
            "pcb_mtd" => (float)$pcb_mtd,
            "total_deductions" => (float)$total_deductions,
            "net_pay" => (float)$net_pay,
            "work_logs_count" => count($work_logs),
            "work_logs" => $work_logs
        ]
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();

    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>
