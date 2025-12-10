<?php
// api/api_generate_management_report.php - Management Report PDF Generator

ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(["message" => "Method not allowed"]);
    exit();
}

include 'db_connect.php';
require_once('../TCPDF/tcpdf.php');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (
        !isset($data['month']) ||
        !isset($data['year']) ||
        !isset($data['worker_type'])
    ) {
        throw new Exception("Incomplete data. Month, year, and worker_type are required.");
    }

    $month = intval($data['month']);
    $year = intval($data['year']);
    $worker_type = $data['worker_type'];

    if ($month < 1 || $month > 12 || $year < 2000 || $year > 2100) {
        throw new Exception("Invalid month or year.");
    }

   // FETCH PAYROLL DATA
   
    $sql = "SELECT 
              pp.id,
              pp.worker_id,
              pp.worker_name,
              pp.worker_type,
              pp.base_income,
              pp.gross_pay,
              pp.net_pay,
              pp.epf_employee,
              pp.epf_employer,
              pp.socso_employee,
              pp.socso_employer,
              pp.eis_employee,
              pp.eis_employer,
              pp.pcb_mtd,
              pp.total_deduction_non_statutory
            FROM payroll_payslips pp
            JOIN payroll_runs pr ON pp.run_id = pr.id
            WHERE pr.month = ? AND pr.year = ?";

    if ($worker_type !== 'All') {
        $sql .= " AND pp.worker_type = ?";
    }

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Database prepare error: " . $conn->error);
    }

    if ($worker_type !== 'All') {
        $stmt->bind_param("iii", $month, $year, $worker_type);
    } else {
        $stmt->bind_param("ii", $month, $year);
    }

    if (!$stmt->execute()) {
        throw new Exception("Database execute error: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $payslips = [];
    $totals = [
        'total_workers' => 0,
        'total_gross_pay' => 0,
        'total_net_pay' => 0,
        'total_epf_employee' => 0,
        'total_epf_employer' => 0,
        'total_socso_employee' => 0,
        'total_socso_employer' => 0,
        'total_eis_employee' => 0,
        'total_eis_employer' => 0,
        'total_pcb' => 0,
    ];

    while ($row = $result->fetch_assoc()) {
        $payslips[] = $row;
        $totals['total_workers']++;
        $totals['total_gross_pay'] += $row['gross_pay'];
        $totals['total_net_pay'] += $row['net_pay'];
        $totals['total_epf_employee'] += $row['epf_employee'];
        $totals['total_epf_employer'] += $row['epf_employer'];
        $totals['total_socso_employee'] += $row['socso_employee'];
        $totals['total_socso_employer'] += $row['socso_employer'];
        $totals['total_eis_employee'] += $row['eis_employee'];
        $totals['total_eis_employer'] += $row['eis_employer'];
        $totals['total_pcb'] += $row['pcb_mtd'];
    }

    $stmt->close();

    // If no payslips found, still generate report with zero values
    if (empty($payslips)) {
        $payslips = [];
        // Totals stay at 0 values already initialized
    }

    
    // GENERATE PDF
   
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    $pdf->SetMargins(10, 10, 10);
    $pdf->SetAutoPageBreak(TRUE, 15);
    $pdf->SetFont('helvetica', '', 10);
    $pdf->AddPage('L'); // Landscape

    // Title
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->Cell(0, 10, 'Management Payroll Report', 0, 1, 'C');

    // Report Info
    $pdf->SetFont('helvetica', '', 10);
    $month_name = date('F', mktime(0, 0, 0, $month, 1));
    $pdf->Cell(0, 5, "Period: $month_name $year", 0, 1);
    $pdf->Cell(0, 5, "Worker Type: " . ($worker_type === 'All' ? 'All Workers' : $worker_type), 0, 1);
    $pdf->Cell(0, 5, "Generated: " . date('Y-m-d H:i:s'), 0, 1);
    $pdf->Ln(5);

    // Summary Table
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->SetFillColor(200, 200, 200);
    
    $pdf->Cell(40, 7, 'Total Workers', 1, 0, 'C', true);
    $pdf->Cell(50, 7, 'Total Gross Pay', 1, 0, 'C', true);
    $pdf->Cell(50, 7, 'Total Net Pay', 1, 0, 'C', true);
    $pdf->Cell(50, 7, 'Total Deductions', 1, 1, 'C', true);

    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetFillColor(245, 245, 245);
    $total_deductions = $totals['total_epf_employee'] + $totals['total_socso_employee'] + $totals['total_eis_employee'] + $totals['total_pcb'];
    
    $pdf->Cell(40, 7, $totals['total_workers'], 1, 0, 'C', true);
    $pdf->Cell(50, 7, 'RM ' . number_format($totals['total_gross_pay'], 2), 1, 0, 'R', true);
    $pdf->Cell(50, 7, 'RM ' . number_format($totals['total_net_pay'], 2), 1, 0, 'R', true);
    $pdf->Cell(50, 7, 'RM ' . number_format($total_deductions, 2), 1, 1, 'R', true);
    
    $pdf->Ln(5);

    // Deductions Breakdown
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->Cell(0, 7, 'Employee Contributions & Deductions', 0, 1);

    $pdf->SetFillColor(200, 200, 200);
    $pdf->Cell(50, 7, 'Contribution Type', 1, 0, 'C', true);
    $pdf->Cell(50, 7, 'Total Amount', 1, 0, 'C', true);
    $pdf->Cell(50, 7, 'Employer Contribution', 1, 1, 'C', true);

    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetFillColor(245, 245, 245);

    // EPF
    $pdf->Cell(50, 7, 'EPF (Provident Fund)', 1, 0, 'L', true);
    $pdf->Cell(50, 7, 'RM ' . number_format($totals['total_epf_employee'], 2), 1, 0, 'R', true);
    $pdf->Cell(50, 7, 'RM ' . number_format($totals['total_epf_employer'], 2), 1, 1, 'R', true);

    // SOCSO
    $pdf->Cell(50, 7, 'SOCSO (Social Security)', 1, 0, 'L', true);
    $pdf->Cell(50, 7, 'RM ' . number_format($totals['total_socso_employee'], 2), 1, 0, 'R', true);
    $pdf->Cell(50, 7, 'RM ' . number_format($totals['total_socso_employer'], 2), 1, 1, 'R', true);

    // EIS
    $pdf->Cell(50, 7, 'EIS (Employment Insurance)', 1, 0, 'L', true);
    $pdf->Cell(50, 7, 'RM ' . number_format($totals['total_eis_employee'], 2), 1, 0, 'R', true);
    $pdf->Cell(50, 7, 'RM ' . number_format($totals['total_eis_employer'], 2), 1, 1, 'R', true);

    // PCB
    $pdf->Cell(50, 7, 'PCB (Income Tax)', 1, 0, 'L', true);
    $pdf->Cell(50, 7, 'RM ' . number_format($totals['total_pcb'], 2), 1, 0, 'R', true);
    $pdf->Cell(50, 7, '-', 1, 1, 'R', true);

    $pdf->Ln(5);

    // Summary Footer
    $pdf->SetFont('helvetica', 'B', 10);
    $total_employer_contributions = $totals['total_epf_employer'] + $totals['total_socso_employer'] + $totals['total_eis_employer'];
    $pdf->Cell(100, 7, 'Total Employer Contributions:', 0, 0);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(50, 7, 'RM ' . number_format($total_employer_contributions, 2), 0, 1, 'R');

    // Clean output buffer and send PDF
    ob_end_clean();

    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="Management_Report_' . $month . '_' . $year . '.pdf"');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');

    $pdf->Output('Management_Report_' . $month . '_' . $year . '.pdf', 'D');

} catch (Exception $e) {
    ob_end_clean();
    error_log("Management Report Error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "message" => "Error generating report: " . $e->getMessage(),
        "error" => $e->getMessage()
    ]);
}

$conn->close();
exit();
?>
