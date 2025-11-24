<?php
// Test script to actually call the payroll API
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session (required by check_auth.php)
session_start();

// Simulate logged-in user (bypass authentication for testing)
$_SESSION['admin_user_id'] = 1;
$_SESSION['username'] = 'test_admin';
$_SESSION['last_activity'] = time();

// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';

// Test data for current month
$test_data = [
    'month' => (int)date('n'),  // Current month
    'year' => (int)date('Y'),   // Current year
    'worker_type' => 'All'
];

// Simulate POST input
$_POST = $test_data;
file_put_contents('php://input', json_encode($test_data));

echo "=== Testing Payroll Calculation API ===\n";
echo "Test Period: {$test_data['year']}-" . str_pad($test_data['month'], 2, '0', STR_PAD_LEFT) . "\n";
echo "Worker Type: {$test_data['worker_type']}\n\n";

echo "Calling api_calculate_payroll.php...\n\n";

// Capture output
ob_start();
include 'api/api_calculate_payroll.php';
$output = ob_get_clean();

echo "=== API Response ===\n";
echo $output;
echo "\n";
?>
