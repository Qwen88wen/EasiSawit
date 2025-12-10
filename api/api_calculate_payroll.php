<?php
// api/api_calculate_payroll.php - Refactored Malaysian Payroll Calculation API (Fixed EPF Lookup Logic)

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

// ============================================================================
// CRITICAL FIX #1: Force MySQLi to throw exceptions for silent failures
// ============================================================================
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// ============================================================================
// HELPER FUNCTIONS - Statutory Contribution Calculations
// ============================================================================

/**
 * [Fixed Version] Lookup Foreign Worker SOCSO (Employment Injury Scheme, employer only)
 * Lookup Foreign Worker SOCSO (Employment Injury Scheme)
 */
function lookup_socso_foreign_employer($conn, $gross_pay) {
    // 1. Attempt exact lookup - fix WHERE condition
    $stmt = $conn->prepare("
        SELECT employer_contribution
        FROM socso_foreign_schedule
        WHERE salary_ceiling < ? AND salary_floor >= ?
        ORDER BY salary_floor ASC
        LIMIT 1
    ");
    
    if ($stmt === false) {
        error_log("Foreign SOCSO lookup prepare failed: " . $conn->error);
        return 0.00;
    }
    
    $stmt->bind_param("dd", $gross_pay, $gross_pay);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$result) {
        // 2. [Fallback Logic] Retrieve highest bracket
        $stmt_max = $conn->prepare("
            SELECT employer_contribution
            FROM socso_foreign_schedule
            ORDER BY salary_floor DESC
            LIMIT 1
        ");
        $stmt_max->execute();
        $result_max = $stmt_max->get_result()->fetch_assoc();
        $stmt_max->close();

        if ($result_max) {
            error_log("Foreign SOCSO: Using fallback max bracket for gross_pay: {$gross_pay}");
            return (float)$result_max['employer_contribution'];
        }

        error_log("Foreign SOCSO: No data found for gross_pay: {$gross_pay}");
        return 0.00; // Complete lookup failure
    }

    // 3. Exact lookup successful
    return (float)$result['employer_contribution'];
}

/**
 * [Fixed Version] Lookup local employee SOCSO and EIS
 * Lookup SOCSO and EIS contributions based on gross pay
 */
function lookup_socso_eis($conn, $gross_pay) {
    // 1. Attempt exact lookup - fix WHERE condition
    $stmt = $conn->prepare("
        SELECT socso_employee, socso_employer, eis_employee, eis_employer
        FROM socso_eis_schedule
        WHERE salary_ceiling < ? AND salary_floor >= ?
        ORDER BY salary_floor ASC
        LIMIT 1
    ");
    
    if ($stmt === false) {
        error_log("SOCSO/EIS lookup prepare failed: " . $conn->error);
        return ['socso_employee' => 0.00, 'socso_employer' => 0.00, 'eis_employee' => 0.00, 'eis_employer' => 0.00];
    }
    
    $stmt->bind_param("dd", $gross_pay, $gross_pay);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$result) {
        // 2. [Fallback Logic] Retrieve highest bracket
        $stmt_max = $conn->prepare("
            SELECT socso_employee, socso_employer, eis_employee, eis_employer
            FROM socso_eis_schedule
            ORDER BY salary_floor DESC
            LIMIT 1
        ");
        $stmt_max->execute();
        $result_max = $stmt_max->get_result()->fetch_assoc();
        $stmt_max->close();

        if ($result_max) {
            error_log("SOCSO/EIS: Using fallback max bracket for gross_pay: {$gross_pay}");
            return [
                'socso_employee' => (float)$result_max['socso_employee'],
                'socso_employer' => (float)$result_max['socso_employer'],
                'eis_employee' => (float)$result_max['eis_employee'],
                'eis_employer' => (float)$result_max['eis_employer']
            ];
        }

        error_log("SOCSO/EIS: No data found for gross_pay: {$gross_pay}");
        return ['socso_employee' => 0.00, 'socso_employer' => 0.00, 'eis_employee' => 0.00, 'eis_employer' => 0.00];
    }

    // 3. Exact lookup successful
    return [
        'socso_employee' => (float)$result['socso_employee'],
        'socso_employer' => (float)$result['socso_employer'],
        'eis_employee' => (float)$result['eis_employee'],
        'eis_employer' => (float)$result['eis_employer']
    ];
}

/**
 * [Fixed Version] Lookup EPF contributions - includes Foreign logic and high salary fallback
 * Lookup EPF contributions based on gross pay, age, and nationality
 */
function lookup_epf($conn, $gross_pay, $is_above_60, $worker_nationality) {

    // MODIFIED: Foreign workers use direct calculation (2% employee, 4% employer)
    // instead of lookup table, with ceiling to next complete Ringgit
    if ($worker_nationality === 'Foreign') {
        // Employee contribution: 2% of gross pay, ceiling to next Ringgit
        $epf_employee = ceil($gross_pay * 0.02);

        // Apply maximum cap of RM 400
        if ($epf_employee > 400.00) {
            $epf_employee = 400.00;
        }

        // Employer contribution: 4% of gross pay, ceiling to next Ringgit
        $epf_employer = ceil($gross_pay * 0.04);

        // Apply maximum cap of RM 800
        if ($epf_employer > 800.00) {
            $epf_employer = 800.00;
        }

        return [
            'epf_employee' => (float)$epf_employee,
            'epf_employer' => (float)$epf_employer
        ];
    }

    // Local workers continue to use EPF schedule lookup table
    $age_group = $is_above_60 ? 'Above 60' : 'Below 60';

    // 2. [Fixed] Attempt exact lookup - fix WHERE condition
    // Correct condition: salary_ceiling < ? AND salary_floor >= ?
    $stmt = $conn->prepare("
        SELECT employee_contribution, employer_contribution
        FROM epf_schedule
        WHERE age_group = ?
        AND salary_ceiling < ?
        AND salary_floor >= ?
        ORDER BY salary_floor ASC
        LIMIT 1
    ");

    if ($stmt === false) {
        error_log("EPF lookup prepare failed: " . $conn->error);
        return ['epf_employee' => 0.00, 'epf_employer' => 0.00];
    }

    // Bind parameters: age_group, gross_pay, gross_pay
    $stmt->bind_param("sdd", $age_group, $gross_pay, $gross_pay);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$result) {
        // 3. [Fallback Logic] If lookup fails, use highest bracket
        $stmt_max = $conn->prepare("
            SELECT employee_contribution, employer_contribution
            FROM epf_schedule
            WHERE age_group = ?
            ORDER BY salary_floor DESC
            LIMIT 1
        ");
        $stmt_max->bind_param("s", $age_group);
        $stmt_max->execute();
        $result_max = $stmt_max->get_result()->fetch_assoc();
        $stmt_max->close();

        if ($result_max) {
            error_log("EPF: Using fallback max bracket for {$age_group}, gross_pay: {$gross_pay}");
            return [
                'epf_employee' => (float)$result_max['employee_contribution'],
                'epf_employer' => (float)$result_max['employer_contribution']
            ];
        }

        error_log("EPF: No data found for {$age_group}, gross_pay: {$gross_pay}");
        return ['epf_employee' => 0.00, 'epf_employer' => 0.00];
    }

    // 4. Exact lookup successful
    return [
        'epf_employee' => (float)$result['employee_contribution'],
        'epf_employer' => (float)$result['employer_contribution']
    ];
}


/**
 * Calculate annual tax liability using Malaysian progressive tax rates
 */
function calculate_annual_tax_rate($chargeable_income) {
    if ($chargeable_income <= 0) {
        return 0.00;
    }
    
    $tax = 0.00;
    $brackets = [
        ['limit' => 5000, 'rate' => 0.00, 'cumulative' => 0],
        ['limit' => 20000, 'rate' => 0.01, 'cumulative' => 0],
        ['limit' => 35000, 'rate' => 0.03, 'cumulative' => 150],
        ['limit' => 50000, 'rate' => 0.08, 'cumulative' => 600],
        ['limit' => 70000, 'rate' => 0.14, 'cumulative' => 1800],
        ['limit' => 100000, 'rate' => 0.21, 'cumulative' => 4600],
        ['limit' => 250000, 'rate' => 0.24, 'cumulative' => 10900],
        ['limit' => 400000, 'rate' => 0.245, 'cumulative' => 46900],
        ['limit' => 600000, 'rate' => 0.25, 'cumulative' => 83650],
        ['limit' => 1000000, 'rate' => 0.26, 'cumulative' => 133650],
        ['limit' => 2000000, 'rate' => 0.28, 'cumulative' => 237650],
        ['limit' => PHP_FLOAT_MAX, 'rate' => 0.30, 'cumulative' => 517650]
    ];
    
    $previous_limit = 0;
    foreach ($brackets as $bracket) {
        if ($chargeable_income <= $bracket['limit']) {
            $taxable_in_bracket = $chargeable_income - $previous_limit;
            $tax = $bracket['cumulative'] + ($taxable_in_bracket * $bracket['rate']);
            break;
        }
        $previous_limit = $bracket['limit'];
    }
    
    return round($tax, 2);
}

/**
 * Calculate PCB (Monthly Tax Deduction) based on LHDN formula
 * [Note: This function is now only applicable for local employees (Resident)]
 */
function calculate_pcb($conn, $taxable_income, $worker_details, $ytd_tax_paid) {
    $mtr_personal = 9000.00 / 12;
    $mtr_spouse = 4000.00 / 12;
    $mtr_child = 2000.00 / 12;
    
    $tmr = $mtr_personal;
    
    if (isset($worker_details['marital_status']) && $worker_details['marital_status'] === 'Married') {
        $spouse_working = $worker_details['spouse_working'] ?? false;
        if (!$spouse_working) {
            $tmr += $mtr_spouse;
        }
    }
    
    $children_count = $worker_details['children_count'] ?? 0;
    if ($children_count > 0) {
        $tmr += ($children_count * $mtr_child);
    }
    
    $epf_monthly_relief = 250.00;
    $zakat = $worker_details['zakat_monthly'] ?? 0.00;
    $net_taxable_monthly = $taxable_income - $tmr - $epf_monthly_relief;
    
    if ($net_taxable_monthly < 0) {
        $net_taxable_monthly = 0.00;
    }
    
    $annual_chargeable_income = $net_taxable_monthly * 12;
    $annual_tax = calculate_annual_tax_rate($annual_chargeable_income);
    $pcb_monthly = $annual_tax / 12;
    $pcb_monthly -= $zakat;
    
    if ($pcb_monthly < 0) {
        $pcb_monthly = 0.00;
    }
    
    return round($pcb_monthly, 2);
}

// ============================================================================
// MAIN PAYROLL CALCULATION LOGIC
// ============================================================================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed. Use POST."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->month) || !isset($data->year) || !isset($data->worker_type)) {
    http_response_code(400);
    echo json_encode(["message" => "Missing required parameters: month, year, worker_type"]);
    exit();
}

$month = intval($data->month);
$year = intval($data->year);
$worker_type = trim($data->worker_type);

// ============================================================================
// CRITICAL FIX #2: Future Date Validation
// ============================================================================
// Basic format validation
if ($month < 1 || $month > 12 || $year < 2000 || $year > 2100) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid month or year"]);
    exit();
}

// Future date check
$current_year = (int)date('Y');
$current_month = (int)date('n'); // 1-12 format
$requested_period = ($year * 12) + $month;
$current_period = ($current_year * 12) + $current_month;

if ($requested_period > $current_period) {
    http_response_code(400);
    echo json_encode([
        "message" => "Cannot calculate payroll for future periods",
        "requested" => sprintf("%d-%02d", $year, $month),
        "current" => sprintf("%d-%02d", $current_year, $current_month),
        "error_code" => "FUTURE_PERIOD_NOT_ALLOWED"
    ]);
    exit();
}

// Worker type validation
if (!in_array($worker_type, ['Local', 'Foreign', 'All'])) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid worker_type. Must be 'Local', 'Foreign', or 'All'"]);
    exit();
}

$payroll_summary = [
    'total_gross_pay' => 0.00,
    'total_epf_employee' => 0.00,
    'total_epf_employer' => 0.00,
    'total_socso_employee' => 0.00,
    'total_socso_employer' => 0.00,
    'total_eis_employee' => 0.00,
    'total_eis_employer' => 0.00,
    'total_pcb_mtd' => 0.00,
    'total_net_pay' => 0.00,
    'payslips' => []
];

// ============================================================================
// STEP 1: Fetch Active Workers
// ============================================================================
$worker_sql = "SELECT id, name, type, age, marital_status, children_count, spouse_working, zakat_monthly 
                FROM workers 
                WHERE status = 'Active'";

if ($worker_type !== 'All') {
    $worker_sql .= " AND type = ?";
    $stmt_workers = $conn->prepare($worker_sql);
    
    if ($stmt_workers === false) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $conn->error]);
        exit();
    }
    
    $stmt_workers->bind_param("s", $worker_type);
} else {
    $stmt_workers = $conn->prepare($worker_sql);
    
    if ($stmt_workers === false) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $conn->error]);
        exit();
    }
}

$stmt_workers->execute();
$result_workers = $stmt_workers->get_result();
$active_workers = [];

while ($row = $result_workers->fetch_assoc()) {
    $active_workers[$row['id']] = $row;
}

$stmt_workers->close();

if (empty($active_workers)) {
    http_response_code(200);
    echo json_encode([
        "message" => "No active workers found for the specified type.",
        "payroll_summary" => $payroll_summary
    ]);
    exit();
}

// ============================================================================
// STEP 2: Fetch Work Logs for the Period (Piece-Rate Workers)
// ============================================================================
$worker_ids = array_keys($active_workers);
$placeholders = implode(',', array_fill(0, count($worker_ids), '?'));

// 3NF normalized: rate from customers table
$worklog_sql = "SELECT wl.id, wl.log_date, wl.worker_id, wl.customer_id, wl.tons, c.rate AS rate_per_ton, c.name AS customer_name
                 FROM work_logs wl
                 JOIN customers c ON wl.customer_id = c.id
                 WHERE MONTH(wl.log_date) = ? AND YEAR(wl.log_date) = ? AND wl.worker_id IN ($placeholders)";

$stmt_worklogs = $conn->prepare($worklog_sql);

if ($stmt_worklogs === false) {
    http_response_code(500);
    echo json_encode(["message" => "Database error preparing work logs: " . $conn->error]);
    exit();
}

$bind_types = 'ii' . str_repeat('i', count($worker_ids));
$bind_params = array_merge([$month, $year], $worker_ids);
$stmt_worklogs->bind_param($bind_types, ...$bind_params);
$stmt_worklogs->execute();
$result_worklogs = $stmt_worklogs->get_result();

$worker_monthly_data = [];

while ($log = $result_worklogs->fetch_assoc()) {
    $worker_id = $log['worker_id'];
    
    if (!isset($worker_monthly_data[$worker_id])) {
        $worker_monthly_data[$worker_id] = [
            'total_tons' => 0.00,
            'total_base_pay' => 0.00,
            'logs' => []
        ];
    }
    
    $log_amount = $log['tons'] * $log['rate_per_ton'];
    $worker_monthly_data[$worker_id]['total_tons'] += $log['tons'];
    $worker_monthly_data[$worker_id]['total_base_pay'] += $log_amount;
    $worker_monthly_data[$worker_id]['logs'][] = $log;
}

$stmt_worklogs->close();

// ============================================================================
// STEP 2.5: Fetch Fixed Salaries (Office Staff)
// ============================================================================
$conn->query("CREATE TABLE IF NOT EXISTS fixed_salaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL UNIQUE,
    monthly_salary DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fixed_salary_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$stmt_fixed = $conn->prepare("SELECT worker_id, monthly_salary FROM fixed_salaries");

if ($stmt_fixed === false) {
    http_response_code(500);
    echo json_encode(["message" => "Database error preparing fixed salaries: " . $conn->error]);
    exit();
}

$stmt_fixed->execute();
$result_fixed = $stmt_fixed->get_result();
$fixed_salary_map = [];

while ($row = $result_fixed->fetch_assoc()) {
    $fixed_salary_map[$row['worker_id']] = (float)$row['monthly_salary'];
}

$stmt_fixed->close();

// ============================================================================
// STEP 2.75: Ensure manual_allowances table exists
// ============================================================================
try {
    $conn->query("CREATE TABLE IF NOT EXISTS manual_allowances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        worker_id INT NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        allowance_type VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_worker_period (worker_id, month, year),
        CONSTRAINT fk_manual_allowance_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Exception $e) {
    // Table might already exist with different structure, continue
    error_log("manual_allowances table creation note: " . $e->getMessage());
}

// ============================================================================
// STEP 2.8: Check if there's ANY activity data for this period
// ============================================================================
$has_work_logs = !empty($worker_monthly_data);

$stmt_check_allowances = $conn->prepare("
    SELECT COUNT(*) as count
    FROM manual_allowances
    WHERE month = ? AND year = ?
");
$stmt_check_allowances->bind_param("ii", $month, $year);
$stmt_check_allowances->execute();
$result_check = $stmt_check_allowances->get_result()->fetch_assoc();
$has_manual_allowances = $result_check['count'] > 0;
$stmt_check_allowances->close();

// MODIFIED LOGIC: Check if there's ANY activity OR fixed salary workers
// Generate payroll if: (1) work logs exist, (2) manual allowances exist, OR (3) fixed salary workers exist
// Only skip if there are NO piece-rate work logs, NO manual allowances, AND NO fixed salary workers
$has_fixed_salary_workers = !empty($fixed_salary_map);

if (!$has_work_logs && !$has_manual_allowances && !$has_fixed_salary_workers) {
    $conn->close();
    http_response_code(200);
    echo json_encode([
        "message" => "No payroll data found for the specified period. This period has no work logs, manual allowances, or fixed salary workers.",
        "period" => sprintf("%d-%02d", $year, $month),
        "payroll_summary" => $payroll_summary,
        "info" => "To generate payroll for this period, please add work logs, manual allowances, or set up fixed salary workers."
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// ============================================================================
// STEP 3: Calculate Payroll for Each Worker (ALL WORKERS)
// ============================================================================

foreach ($active_workers as $worker_id => $worker_details) {
    // Determine base income based on worker type
    $is_fixed_salary = isset($fixed_salary_map[$worker_id]);
    $worker_nationality = $worker_details['type']; // 'Local' or 'Foreign'
    
    // ========================================================================
    // CRITICAL: Skip workers with NO activity in this period
    // ========================================================================
    
    $has_worker_work_logs = isset($worker_monthly_data[$worker_id]);
    
    // Check if this specific worker has manual allowances for this period
    $stmt_check_worker_allowances = $conn->prepare("
        SELECT COUNT(*) as count 
        FROM manual_allowances 
        WHERE worker_id = ? AND month = ? AND year = ?
    ");
    $stmt_check_worker_allowances->bind_param("iii", $worker_id, $month, $year);
    $stmt_check_worker_allowances->execute();
    $result_worker_check = $stmt_check_worker_allowances->get_result()->fetch_assoc();
    $has_worker_allowances = $result_worker_check['count'] > 0;
    $stmt_check_worker_allowances->close();
    
    // MODIFIED LOGIC: "No work, no payroll" applies to piece-rate workers ONLY
    // Fixed salary workers should ALWAYS be included in payroll
    $has_worker_activity = $has_worker_work_logs || $has_worker_allowances;

    // Skip workers with no activity (EXCEPT fixed salary workers who get paid regardless)
    if (!$has_worker_activity && !$is_fixed_salary) {
         continue; // Skip: Piece-rate worker with no work logs or manual allowances
    }

    // ========================================================================
    // Base Income Logic
    // ========================================================================
    if ($is_fixed_salary) {
        // Fixed Salary Employee (Office Staff)
        // MODIFIED: Only included if they have work logs or manual allowances
        $base_income = $fixed_salary_map[$worker_id];
        $total_tons = 0.00;
        $work_logs = [];

    } else {
        // Piece-Rate Employee
        $base_income = $worker_monthly_data[$worker_id]['total_base_pay'] ?? 0.00;
        $total_tons = $worker_monthly_data[$worker_id]['total_tons'] ?? 0.00;
        $work_logs = $worker_monthly_data[$worker_id]['logs'] ?? [];
    }
    
    $total_allowance = 0.00;
    $taxable_income_for_pcb = $base_income;
    $payslip_items = [];
    
    // ========================================================================
    // Phase A: Add Fixed Monthly Salary as System Allowance (Office Staff Only)
    // ========================================================================
    
    if ($is_fixed_salary && $base_income > 0) {
        $payslip_items[] = [
            'item_type' => 'ALLOWANCE',
            'type_id' => null,
            'item_name' => 'Fixed Monthly Salary',
            'item_description' => 'Fixed Monthly Salary Base',
            'amount' => $base_income
        ];
    }
    
    // ========================================================================
    // Phase B: Minimum Wage Top-up (ONLY for Local Piece-Rate Workers)
    // ========================================================================
    
    if (!$is_fixed_salary && $worker_nationality === 'Local') {
        $minimum_wage = 1700.00;
        if ($base_income < $minimum_wage) {
            $topup_amount = $minimum_wage - $base_income;
            $total_allowance += $topup_amount;
            $taxable_income_for_pcb += $topup_amount;
            
            $payslip_items[] = [
                'item_type' => 'ALLOWANCE',
                'type_id' => null,
                'item_name' => 'Minimum Wage Top-up',
                'item_description' => 'Minimum Wage Guarantee for Local Staff',
                'amount' => $topup_amount
            ];
        }
    }
    
    // ========================================================================
    // Phase C: Manual Allowances Integration (ONLY for Local Workers)
    // ========================================================================
    
    if ($worker_nationality === 'Local') {
        $stmt_manual = $conn->prepare("
            SELECT allowance_type, description, amount 
            FROM manual_allowances 
            WHERE worker_id = ? AND month = ? AND year = ?
        ");
        
        if ($stmt_manual !== false) {
            $stmt_manual->bind_param("iii", $worker_id, $month, $year);
            $stmt_manual->execute();
            $result_manual = $stmt_manual->get_result();
            
            while ($manual_row = $result_manual->fetch_assoc()) {
                $manual_amount = (float)$manual_row['amount'];
                $total_allowance += $manual_amount;
                $taxable_income_for_pcb += $manual_amount;
                
                $payslip_items[] = [
                    'item_type' => 'ALLOWANCE',
                    'type_id' => null,
                    'item_name' => $manual_row['allowance_type'],
                    'item_description' => $manual_row['description'] ?? $manual_row['allowance_type'],
                    'amount' => $manual_amount
                ];
            }
            
            $stmt_manual->close();
        }
    }
    
    $gross_pay = $base_income + $total_allowance;
    
    // ========================================================================
    // Phase E: Calculate Statutory Deductions
    // ========================================================================
    
    $worker_age = $worker_details['age'] ?? 35;
    $is_above_60 = $worker_age >= 60;

    if ($worker_nationality === 'Local') {
        
        // --- 1. Local Worker Logic ---
        
        $epf_contributions = lookup_epf($conn, $gross_pay, $is_above_60, $worker_nationality); 
        $epf_employee = $epf_contributions['epf_employee'];
        $epf_employer = $epf_contributions['epf_employer'];
        
        $socso_eis_contributions = lookup_socso_eis($conn, $gross_pay);
        $socso_employee = $socso_eis_contributions['socso_employee'];
        $socso_employer = $socso_eis_contributions['socso_employer'];
        $eis_employee = $socso_eis_contributions['eis_employee'];
        $eis_employer = $socso_eis_contributions['eis_employer'];
        
        $pcb_worker_details = [
            'age' => $worker_age,
            'marital_status' => $worker_details['marital_status'] ?? 'Single',
            'spouse_working' => $worker_details['spouse_working'] ?? false,
            'children_count' => $worker_details['children_count'] ?? 0,
            'zakat_monthly' => $worker_details['zakat_monthly'] ?? 0.00
        ];
        
        $pcb_mtd = calculate_pcb($conn, $taxable_income_for_pcb, $pcb_worker_details, 0.00);

    } else {
        
        // --- 2. Foreign Worker Logic ---
        
        // EPF is now mandatory for foreign workers (2% employee, 4% employer)
        $epf_contributions = lookup_epf($conn, $gross_pay, $is_above_60, $worker_nationality);
        $epf_employee = $epf_contributions['epf_employee'];
        $epf_employer = $epf_contributions['epf_employer'];
        
        // EIS: Not covered for foreign workers
        $eis_employee = 0.00;
        $eis_employer = 0.00;
        
        // SOCSO: Employer only, different rate (Employment Injury Scheme)
        $socso_employee = 0.00; 
        $socso_employer = lookup_socso_foreign_employer($conn, $gross_pay);
        
        // PCB: 30% flat rate for non-residents
        $pcb_mtd = round($taxable_income_for_pcb * 0.30, 2);
    }
    
    $total_statutory_deduction = $epf_employee + $socso_employee + $eis_employee + $pcb_mtd;
    
    // ========================================================================
    // Phase F: Calculate Net Pay
    // ========================================================================
    
    $net_pay = $gross_pay - $total_statutory_deduction;
    
    // ========================================================================
    // Phase G: Update Summary
    // ========================================================================
    
    $payroll_summary['total_gross_pay'] += $gross_pay;
    $payroll_summary['total_epf_employee'] += $epf_employee;
    $payroll_summary['total_epf_employer'] += $epf_employer;
    $payroll_summary['total_socso_employee'] += $socso_employee;
    $payroll_summary['total_socso_employer'] += $socso_employer;
    $payroll_summary['total_eis_employee'] += $eis_employee;
    $payroll_summary['total_eis_employer'] += $eis_employer;
    $payroll_summary['total_pcb_mtd'] += $pcb_mtd;
    $payroll_summary['total_net_pay'] += $net_pay;
    
    $payroll_summary['payslips'][] = [
        'worker_id' => $worker_id,
        'worker_name' => $worker_details['name'],
        'worker_type' => $worker_details['type'],
        'employment_type' => $is_fixed_salary ? 'Fixed Salary' : 'Piece Rate',
        'total_tons' => round($total_tons, 2),
        'base_income' => round($base_income, 2),
        'total_allowance' => round($total_allowance, 2),
        'gross_pay' => round($gross_pay, 2),
        'epf_employee' => round($epf_employee, 2),
        'epf_employer' => round($epf_employer, 2),
        'socso_employee' => round($socso_employee, 2),
        'socso_employer' => round($socso_employer, 2),
        'eis_employee' => round($eis_employee, 2),
        'eis_employer' => round($eis_employer, 2),
        'pcb_mtd' => round($pcb_mtd, 2),
        'total_deduction_non_statutory' => 0.00,
        'net_pay' => round($net_pay, 2),
        'work_logs_details' => $work_logs,
        'items_to_persist' => $payslip_items
    ];
}

// ============================================================================
// STEP 4: Persist Results to Database
// ============================================================================

$conn->begin_transaction();

try {
    $conn->query("CREATE TABLE IF NOT EXISTS payroll_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month INT NOT NULL,
        year INT NOT NULL,
        worker_type VARCHAR(16) NOT NULL,
        total_gross_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_epf_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_epf_employer DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_socso_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_socso_employer DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_eis_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_eis_employer DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_pcb_mtd DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_net_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_period (month, year, worker_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS payroll_payslips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        run_id INT NOT NULL,
        worker_id INT NOT NULL,
        worker_name VARCHAR(255) NOT NULL,
        worker_type VARCHAR(16) NOT NULL,
        total_tons DECIMAL(10,2) NOT NULL DEFAULT 0,
        base_income DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
        gross_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
        epf_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
        epf_employer DECIMAL(12,2) NOT NULL DEFAULT 0,
        socso_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
        socso_employer DECIMAL(12,2) NOT NULL DEFAULT 0,
        eis_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
        eis_employer DECIMAL(12,2) NOT NULL DEFAULT 0,
        pcb_mtd DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_deduction_non_statutory DECIMAL(12,2) NOT NULL DEFAULT 0,
        net_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_run (run_id),
        CONSTRAINT fk_payslips_run FOREIGN KEY (run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS payslip_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payslip_id INT NOT NULL,
        item_type ENUM('ALLOWANCE', 'DEDUCTION') NOT NULL,
        type_id INT,
        item_name VARCHAR(255) NOT NULL,
        item_description VARCHAR(255),
        amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_payslip (payslip_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt_find = $conn->prepare("SELECT id FROM payroll_runs WHERE month = ? AND year = ? AND worker_type = ?");
    $stmt_find->bind_param("iis", $month, $year, $worker_type);
    $stmt_find->execute();
    $stmt_find->bind_result($existing_run_id);
    $has_existing = $stmt_find->fetch();
    $stmt_find->close();

    if ($has_existing) {
        $stmt_update = $conn->prepare("
            UPDATE payroll_runs 
            SET total_gross_pay = ?, total_epf_employee = ?, total_epf_employer = ?, 
                total_socso_employee = ?, total_socso_employer = ?, total_eis_employee = ?,
                total_eis_employer = ?, total_pcb_mtd = ?, total_net_pay = ?
            WHERE id = ?
        ");
        $stmt_update->bind_param(
            "dddddddddi",
            $payroll_summary['total_gross_pay'],
            $payroll_summary['total_epf_employee'],
            $payroll_summary['total_epf_employer'],
            $payroll_summary['total_socso_employee'],
            $payroll_summary['total_socso_employer'],
            $payroll_summary['total_eis_employee'],
            $payroll_summary['total_eis_employer'],
            $payroll_summary['total_pcb_mtd'],
            $payroll_summary['total_net_pay'],
            $existing_run_id
        );
        if ($stmt_update->execute() === FALSE) {
            throw new Exception("SQL EXECUTE FAILED (payroll_runs UPDATE): " . $stmt_update->error);
        }
        $stmt_update->close();

        $stmt_del = $conn->prepare("DELETE FROM payroll_payslips WHERE run_id = ?");
        $stmt_del->bind_param("i", $existing_run_id);
        if ($stmt_del->execute() === FALSE) {
            throw new Exception("SQL EXECUTE FAILED (DELETE payroll_payslips): " . $stmt_del->error);
        }
        $stmt_del->close();

        $run_id = $existing_run_id;
    } else {
        $stmt_insert = $conn->prepare("
            INSERT INTO payroll_runs 
            (month, year, worker_type, total_gross_pay, total_epf_employee, total_epf_employer, 
             total_socso_employee, total_socso_employer, total_eis_employee, total_eis_employer,
             total_pcb_mtd, total_net_pay) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt_insert->bind_param(
            "iisddddddddd",
            $month,
            $year,
            $worker_type,
            $payroll_summary['total_gross_pay'],
            $payroll_summary['total_epf_employee'],
            $payroll_summary['total_epf_employer'],
            $payroll_summary['total_socso_employee'],
            $payroll_summary['total_socso_employer'],
            $payroll_summary['total_eis_employee'],
            $payroll_summary['total_eis_employer'],
            $payroll_summary['total_pcb_mtd'],
            $payroll_summary['total_net_pay']
        );
        
        if ($stmt_insert->execute() === FALSE) {
            throw new Exception("SQL EXECUTE FAILED (payroll_runs INSERT): " . $stmt_insert->error);
        }
        $run_id = $stmt_insert->insert_id;
        $stmt_insert->close();
    }

    if (!empty($payroll_summary['payslips'])) {
        $stmt_ps = $conn->prepare("
            INSERT INTO payroll_payslips 
            (run_id, worker_id, worker_name, worker_type, total_tons, base_income, total_allowance, 
             gross_pay, epf_employee, epf_employer, socso_employee, socso_employer, 
             eis_employee, eis_employer, pcb_mtd, total_deduction_non_statutory, net_pay) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt_items = $conn->prepare("
            INSERT INTO payslip_items 
            (payslip_id, item_type, type_id, item_name, item_description, amount) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        foreach ($payroll_summary['payslips'] as $ps) {
            $stmt_ps->bind_param(
                "iissddddddddddddd",
                $run_id,
                $ps['worker_id'],
                $ps['worker_name'],
                $ps['worker_type'],
                $ps['total_tons'],
                $ps['base_income'],
                $ps['total_allowance'],
                $ps['gross_pay'],
                $ps['epf_employee'],
                $ps['epf_employer'],
                $ps['socso_employee'],
                $ps['socso_employer'],
                $ps['eis_employee'],
                $ps['eis_employer'],
                $ps['pcb_mtd'],
                $ps['total_deduction_non_statutory'],
                $ps['net_pay']
            );
            if ($stmt_ps->execute() === FALSE) {
                throw new Exception("SQL EXECUTE FAILED (payroll_payslips INSERT): " . $stmt_ps->error);
            }
            $payslip_id = $conn->insert_id;
            
            foreach ($ps['items_to_persist'] as $item) {
                $item_description = $item['item_description'] ?? null;
                
                $stmt_items->bind_param(
                    "isissd",
                    $payslip_id,
                    $item['item_type'],
                    $item['type_id'],
                    $item['item_name'],
                    $item_description,
                    $item['amount']
                );
                if ($stmt_items->execute() === FALSE) {
                    throw new Exception("SQL EXECUTE FAILED (payslip_items INSERT): " . $stmt_items->error);
                }
            }
        }
        $stmt_ps->close();
        $stmt_items->close();
    }

    $conn->commit();
    
} catch (Exception $e) {
    $conn->rollback();
    $persistence_error = $e->getMessage();
    error_log("Payroll persistence error: " . $e->getMessage());
}

$conn->close();

$payroll_summary['total_gross_pay'] = round($payroll_summary['total_gross_pay'], 2);
$payroll_summary['total_epf_employee'] = round($payroll_summary['total_epf_employee'], 2);
$payroll_summary['total_epf_employer'] = round($payroll_summary['total_epf_employer'], 2);
$payroll_summary['total_socso_employee'] = round($payroll_summary['total_socso_employee'], 2);
$payroll_summary['total_socso_employer'] = round($payroll_summary['total_socso_employer'], 2);
$payroll_summary['total_eis_employee'] = round($payroll_summary['total_eis_employee'], 2);
$payroll_summary['total_eis_employer'] = round($payroll_summary['total_eis_employer'], 2);
$payroll_summary['total_pcb_mtd'] = round($payroll_summary['total_pcb_mtd'], 2);
$payroll_summary['total_net_pay'] = round($payroll_summary['total_net_pay'], 2);

http_response_code(200);
echo json_encode([
    'message' => 'Payroll calculation completed successfully.',
    'payroll_summary' => $payroll_summary,
    'run_id' => isset($run_id) ? $run_id : null,
    'persistence' => isset($persistence_error) ? ('WARN: ' . $persistence_error) : 'OK'
]);
?>