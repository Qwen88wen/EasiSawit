<?php
// api/api_generate_report.php - Multi-Language PDF Payslip Generator

// CRITICAL FIX #1: Enable output buffering to catch any stray output
ob_start();

// Handle preflight OPTIONS request BEFORE including anything
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}

include 'db_connect.php';

// Force MySQLi to throw exceptions
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require_once('../TCPDF/tcpdf.php');

// ============================================================================
// MULTI-LANGUAGE SUPPORT
// ============================================================================

// FORCE ENGLISH ONLY - Ignore language parameter from URL
$lang = 'en'; // Always use English for payslips

// Note: Language parameter is ignored - all payslips generated in English only

// Translation dictionary
$translations = [
    'en' => [
        'payslip_title' => 'Official Payslip',
        'worker_name' => 'Worker Name',
        'worker_type' => 'Worker Type',
        'payment_month' => 'Payment Month',
        'payment_period' => 'Payment Period',
        'generated_on' => 'Generated on',
        'income_allowances' => 'INCOME & ALLOWANCES',
        'deductions_contributions' => 'DEDUCTIONS & CONTRIBUTIONS',
        'base_pay' => 'Base Pay',
        'epf_employee' => 'EPF (Employee)',
        'socso_employee' => 'SOCSO (Employee)',
        'eis_employee' => 'EIS (Employee)',
        'pcb_mtd' => 'PCB (MTD)',
        'gross_pay' => 'GROSS PAY',
        'total_deduction' => 'TOTAL DEDUCTION',
        'net_pay' => 'NET PAY',
        'employer_contributions' => 'Employer Contributions',
        'epf_employer' => 'EPF (Employer)',
        'socso_employer' => 'SOCSO (Employer)',
        'eis_employer' => 'EIS (Employer)',
        'computer_generated' => 'This is a computer-generated payslip. No signature is required.',
        'minimum_wage_topup' => 'Minimum Wage Top-up',
        'loan_repayment' => 'Staff Loan Repayment'
    ],
    'zh' => [
        'payslip_title' => '薪资单',
        'worker_name' => '员工姓名',
        'worker_type' => '员工类型',
        'payment_month' => '付款月份',
        'payment_period' => '付款期间',
        'generated_on' => '生成日期',
        'income_allowances' => '收入与津贴',
        'deductions_contributions' => '扣除与贡献',
        'base_pay' => '基本工资',
        'epf_employee' => '公积金 (员工)',
        'socso_employee' => '社险 (员工)',
        'eis_employee' => '就业保险 (员工)',
        'pcb_mtd' => '所得税 (月扣)',
        'gross_pay' => '总薪资',
        'total_deduction' => '总扣除',
        'net_pay' => '实付工资',
        'employer_contributions' => '雇主贡献',
        'epf_employer' => '公积金 (雇主)',
        'socso_employer' => '社险 (雇主)',
        'eis_employer' => '就业保险 (雇主)',
        'computer_generated' => '这是电脑生成的薪资单，无需签名。',
        'minimum_wage_topup' => '最低工资补贴',
        'loan_repayment' => '员工贷款还款'
    ],
    'ms' => [
        'payslip_title' => 'Slip Gaji Rasmi',
        'worker_name' => 'Nama Pekerja',
        'worker_type' => 'Jenis Pekerja',
        'payment_month' => 'Bulan Pembayaran',
        'payment_period' => 'Tempoh Pembayaran',
        'generated_on' => 'Dijana pada',
        'income_allowances' => 'PENDAPATAN & ELAUN',
        'deductions_contributions' => 'POTONGAN & CARUMAN',
        'base_pay' => 'Gaji Asas',
        'epf_employee' => 'KWSP (Pekerja)',
        'socso_employee' => 'PERKESO (Pekerja)',
        'eis_employee' => 'SIP (Pekerja)',
        'pcb_mtd' => 'PCB (MTD)',
        'gross_pay' => 'JUMLAH GAJI',
        'total_deduction' => 'JUMLAH POTONGAN',
        'net_pay' => 'GAJI BERSIH',
        'employer_contributions' => 'Caruman Majikan',
        'epf_employer' => 'KWSP (Majikan)',
        'socso_employer' => 'PERKESO (Majikan)',
        'eis_employer' => 'SIP (Majikan)',
        'computer_generated' => 'Ini adalah slip gaji yang dijana oleh komputer. Tiada tandatangan diperlukan.',
        'minimum_wage_topup' => 'Tambahan Gaji Minimum',
        'loan_repayment' => 'Bayaran Balik Pinjaman Kakitangan'
    ]
];

// Get translation array for selected language
$t = $translations[$lang] ?? $translations['en'];

// ============================================================================
// INPUT VALIDATION
// ============================================================================

$payslip_id = $_GET['payslip_id'] ?? null;
$run_id = $_GET['run_id'] ?? null;

if (!$payslip_id && !$run_id) {
    ob_end_clean();
    header("Access-Control-Allow-Origin: *");
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(["message" => "Either payslip_id or run_id is required."]);
    exit();
}

// ============================================================================
// FETCH PAYSLIP DATA
// ============================================================================

$payslips_to_generate = [];

try {
    if ($payslip_id) {
        if (!is_numeric($payslip_id)) {
            throw new Exception("Payslip ID must be numeric.");
        }
        
        $stmt_main = $conn->prepare("SELECT * FROM payroll_payslips WHERE id = ?");
        if ($stmt_main === false) {
            throw new Exception("Failed to prepare statement: " . $conn->error);
        }
        
        $stmt_main->bind_param("i", $payslip_id);
        
        if ($stmt_main->execute() === FALSE) {
            throw new Exception("SQL EXECUTE FAILED (fetch payslip): " . $stmt_main->error);
        }
        
        $result = $stmt_main->get_result();
        if ($result->num_rows > 0) {
            $payslips_to_generate[] = $result->fetch_assoc();
        }
        $stmt_main->close();
        
    } else {
        if (!is_numeric($run_id)) {
            throw new Exception("Run ID must be numeric.");
        }
        
        $stmt_main = $conn->prepare("SELECT * FROM payroll_payslips WHERE run_id = ?");
        if ($stmt_main === false) {
            throw new Exception("Failed to prepare statement: " . $conn->error);
        }
        
        $stmt_main->bind_param("i", $run_id);
        
        if ($stmt_main->execute() === FALSE) {
            throw new Exception("SQL EXECUTE FAILED (fetch payslips by run): " . $stmt_main->error);
        }
        
        $result = $stmt_main->get_result();
        while ($row = $result->fetch_assoc()) {
            $payslips_to_generate[] = $row;
        }
        $stmt_main->close();
    }
    
    if (empty($payslips_to_generate)) {
        ob_end_clean();
        header("Access-Control-Allow-Origin: *");
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(["message" => "No payslips found for the specified ID."]);
        exit();
    }
    
} catch (Exception $e) {
    ob_end_clean();
    header("Access-Control-Allow-Origin: *");
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "message" => "Database error occurred.",
        "error" => $e->getMessage()
    ]);
    exit();
}

// ============================================================================
// GENERATE PDF
// ============================================================================

try {
    // Initialize PDF
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->SetMargins(15, 15, 15, true);
    $pdf->SetAutoPageBreak(TRUE, 15);
    
    // Font setting - English only, use standard font
    $pdf->setFont('helvetica', '', 10);
    
    // ============================================================================
    // LOOP THROUGH EACH PAYSLIP
    // ============================================================================
    
    foreach ($payslips_to_generate as $payslip_data) {
        
        // Fetch payslip items (allowances and deductions)
        $stmt_items = $conn->prepare("SELECT item_name, item_type, amount FROM payslip_items WHERE payslip_id = ?");
        if ($stmt_items === false) {
            throw new Exception("Failed to prepare payslip_items query: " . $conn->error);
        }
        
        $stmt_items->bind_param("i", $payslip_data['id']);
        
        if ($stmt_items->execute() === FALSE) {
            throw new Exception("SQL EXECUTE FAILED (fetch payslip_items): " . $stmt_items->error);
        }
        
        $payslip_items = $stmt_items->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt_items->close();
        
        // Categorize items
        $allowances = [];
        $deductions = [];
        
        foreach ($payslip_items as $item) {
            if ($item['item_type'] === 'ALLOWANCE') {
                $allowances[] = $item;
            } else if ($item['item_type'] === 'DEDUCTION') {
                $deductions[] = $item;
            }
        }
        
        // Add new page for this payslip
        $pdf->AddPage();
        
        // ============================================================================
        // BUILD HTML CONTENT WITH TRANSLATIONS
        // ============================================================================
        
        $html = '<h2 style="text-align: center; color: #333;">' . htmlspecialchars($t['payslip_title']) . '</h2>';
        $html .= '<p><strong>' . htmlspecialchars($t['worker_name']) . ':</strong> ' . htmlspecialchars($payslip_data['worker_name']) . '</p>';
        $html .= '<p><strong>' . htmlspecialchars($t['worker_type']) . ':</strong> ' . htmlspecialchars($payslip_data['worker_type']) . '</p>';
        
        // Handle payment_month
        if (isset($payslip_data['payment_month'])) {
            $html .= '<p><strong>' . htmlspecialchars($t['payment_month']) . ':</strong> ' . date('Y-m', strtotime($payslip_data['payment_month'])) . '</p>';
        } else {
            $html .= '<p><strong>' . htmlspecialchars($t['payment_period']) . ':</strong> ' . htmlspecialchars($t['generated_on']) . ' ' . date('Y-m-d') . '</p>';
        }
        
        $html .= '<hr>';
        
        // Main table structure
        $html .= '<table border="1" cellpadding="5" cellspacing="0" width="100%" style="font-size: 9pt;">';
        $html .= '<tr style="font-weight: bold; background-color: #e6e6e6;">';
        $html .= '<td width="50%" align="center">' . htmlspecialchars($t['income_allowances']) . '</td>';
        $html .= '<td width="50%" align="center">' . htmlspecialchars($t['deductions_contributions']) . '</td>';
        $html .= '</tr>';
        
        // Calculate max rows needed
        $max_rows = max(count($allowances) + 1, count($deductions) + 4);
        
        for ($i = 0; $i < $max_rows; $i++) {
            $html .= '<tr>';
            
            // Left side: Income & Allowances
            $html .= '<td>';
            if ($i == 0) {
                // Base Pay
                $html .= htmlspecialchars($t['base_pay']) . ': <span style="float: right;">RM ' . number_format($payslip_data['base_income'], 2) . '</span>';
            } elseif (isset($allowances[$i - 1])) {
                $allowance = $allowances[$i - 1];
                // Translate common allowance names
                $allowance_name = $allowance['item_name'];
                if ($allowance_name === 'Minimum Wage Top-up') {
                    $allowance_name = $t['minimum_wage_topup'];
                }
                $html .= htmlspecialchars($allowance_name) . ': <span style="float: right;">RM ' . number_format($allowance['amount'], 2) . '</span>';
            } else {
                $html .= '&nbsp;';
            }
            $html .= '</td>';
            
            // Right side: Deductions & Contributions
            $html .= '<td>';
            
            if ($i == 0) {
                $html .= htmlspecialchars($t['epf_employee']) . ': <span style="float: right;">RM ' . number_format($payslip_data['epf_employee'], 2) . '</span>';
            } elseif ($i == 1) {
                $html .= htmlspecialchars($t['socso_employee']) . ': <span style="float: right;">RM ' . number_format($payslip_data['socso_employee'], 2) . '</span>';
            } elseif ($i == 2) {
                $html .= htmlspecialchars($t['eis_employee']) . ': <span style="float: right;">RM ' . number_format($payslip_data['eis_employee'], 2) . '</span>';
            } elseif ($i == 3) {
                $html .= htmlspecialchars($t['pcb_mtd']) . ': <span style="float: right;">RM ' . number_format($payslip_data['pcb_mtd'], 2) . '</span>';
            } elseif (isset($deductions[$i - 4])) {
                $deduction = $deductions[$i - 4];
                // Translate common deduction names
                $deduction_name = $deduction['item_name'];
                if ($deduction_name === 'Staff Loan Repayment') {
                    $deduction_name = $t['loan_repayment'];
                }
                $html .= htmlspecialchars($deduction_name) . ': <span style="float: right;">RM ' . number_format($deduction['amount'], 2) . '</span>';
            } else {
                $html .= '&nbsp;';
            }
            
            $html .= '</td>';
            $html .= '</tr>';
        }
        
        // Summary rows
        $total_deduction = $payslip_data['epf_employee'] 
                         + $payslip_data['socso_employee'] 
                         + $payslip_data['eis_employee'] 
                         + $payslip_data['pcb_mtd'] 
                         + $payslip_data['total_deduction_non_statutory'];
        
        $html .= '<tr style="font-weight: bold; background-color: #f7f7f7;">';
        $html .= '<td align="right">' . htmlspecialchars($t['gross_pay']) . ': RM ' . number_format($payslip_data['gross_pay'], 2) . '</td>';
        $html .= '<td align="right">' . htmlspecialchars($t['total_deduction']) . ': RM ' . number_format($total_deduction, 2) . '</td>';
        $html .= '</tr>';
        
        $html .= '<tr style="font-weight: bold; background-color: #ccffcc;">';
        $html .= '<td colspan="2" align="center" style="font-size: 12pt;">' . htmlspecialchars($t['net_pay']) . ': RM ' . number_format($payslip_data['net_pay'], 2) . '</td>';
        $html .= '</tr>';
        
        $html .= '</table>';
        
        // Employer contributions summary
        $html .= '<br><hr>';
        $html .= '<p style="font-size: 9pt;"><strong>' . htmlspecialchars($t['employer_contributions']) . ':</strong></p>';
        $html .= '<p style="font-size: 8pt;">';
        $html .= htmlspecialchars($t['epf_employer']) . ': RM ' . number_format($payslip_data['epf_employer'], 2) . ' | ';
        $html .= htmlspecialchars($t['socso_employer']) . ': RM ' . number_format($payslip_data['socso_employer'], 2) . ' | ';
        $html .= htmlspecialchars($t['eis_employer']) . ': RM ' . number_format($payslip_data['eis_employer'], 2);
        $html .= '</p>';
        
        $html .= '<p style="font-size: 8pt; color: #666; margin-top: 20px;">' . htmlspecialchars($t['computer_generated']) . '</p>';
        
        // Write HTML to PDF
        $pdf->writeHTML($html, true, false, true, false, '');
    }
    
    // Clean buffer before outputting PDF
    ob_end_clean();
    
    // Send PDF headers
    header("Access-Control-Allow-Origin: *");
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="Payslip_' . ($run_id ?? $payslip_id) . '_' . date('YmdHis') . '.pdf"');
    
    // Output PDF
    $pdf->Output('Payslip_' . ($run_id ?? $payslip_id) . '.pdf', 'D');
    
} catch (Exception $e) {
    ob_end_clean();
    header("Access-Control-Allow-Origin: *");
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "message" => "PDF generation failed.",
        "error" => $e->getMessage()
    ]);
}

$conn->close();
exit();
?>
