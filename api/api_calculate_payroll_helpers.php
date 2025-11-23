<?php
/**
 * Payroll Calculation Helper Functions
 * Shared between api_calculate_payroll.php and api_worker_settlement.php
 */

/**
 * Lookup Foreign Worker SOCSO (Employment Injury Scheme)
 */
function lookup_socso_foreign_employer($conn, $gross_pay) {
    // Try exact lookup
    $stmt = $conn->prepare("
        SELECT employer_contribution
        FROM socso_foreign_schedule
        WHERE salary_floor <= ? AND salary_ceiling >= ?
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
        // Fallback: Get max bracket
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
        return 0.00;
    }

    return (float)$result['employer_contribution'];
}

/**
 * Lookup SOCSO and EIS contributions for Local workers
 */
function lookup_socso_eis($conn, $gross_pay) {
    // Try exact lookup
    $stmt = $conn->prepare("
        SELECT socso_employee, socso_employer, eis_employee, eis_employer
        FROM socso_eis_schedule
        WHERE salary_floor <= ? AND salary_ceiling >= ?
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
        // Fallback: Get max bracket
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

    return [
        'socso_employee' => (float)$result['socso_employee'],
        'socso_employer' => (float)$result['socso_employer'],
        'eis_employee' => (float)$result['eis_employee'],
        'eis_employer' => (float)$result['eis_employer']
    ];
}
?>
