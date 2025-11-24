<?php
// Test script to diagnose payroll calculation issues
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== Payroll Calculation Diagnostic Test ===\n\n";

// Test 1: Check if files exist
echo "1. Checking required files:\n";
$files = [
    'api/check_auth.php',
    'api/db_connect.php',
    'api/api_calculate_payroll.php'
];

foreach ($files as $file) {
    $exists = file_exists($file);
    echo "   - $file: " . ($exists ? "✓ EXISTS" : "✗ MISSING") . "\n";
}

echo "\n2. Testing database connection:\n";
include 'api/db_connect.php';
if ($conn) {
    echo "   ✓ Database connected successfully\n";

    // Test 3: Check required tables
    echo "\n3. Checking required tables:\n";
    $tables = [
        'workers',
        'work_logs',
        'customers',
        'epf_schedule',
        'socso_eis_schedule',
        'socso_foreign_schedule',
        'fixed_salaries',
        'manual_allowances'
    ];

    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        $exists = $result && $result->num_rows > 0;
        echo "   - $table: " . ($exists ? "✓ EXISTS" : "✗ MISSING") . "\n";
    }

    // Test 4: Check for active workers
    echo "\n4. Checking for active workers:\n";
    $result = $conn->query("SELECT COUNT(*) as count, type FROM workers WHERE status = 'Active' GROUP BY type");
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            echo "   - {$row['type']}: {$row['count']} active workers\n";
        }
    } else {
        echo "   ✗ No active workers found\n";
    }

    // Test 5: Check for work logs
    echo "\n5. Checking for work logs (last 3 months):\n";
    $result = $conn->query("
        SELECT DATE_FORMAT(log_date, '%Y-%m') as period, COUNT(*) as count
        FROM work_logs
        WHERE log_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
        GROUP BY DATE_FORMAT(log_date, '%Y-%m')
        ORDER BY period DESC
        LIMIT 3
    ");

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            echo "   - {$row['period']}: {$row['count']} work logs\n";
        }
    } else {
        echo "   ✗ No work logs found in the last 3 months\n";
    }

    // Test 6: Check for fixed salary workers
    echo "\n6. Checking for fixed salary workers:\n";
    $result = $conn->query("SELECT COUNT(*) as count FROM fixed_salaries");
    if ($result) {
        $row = $result->fetch_assoc();
        echo "   - Fixed salary workers: {$row['count']}\n";
    }

    // Test 7: Check for manual allowances
    echo "\n7. Checking for manual allowances (last 3 months):\n";
    $result = $conn->query("
        SELECT CONCAT(year, '-', LPAD(month, 2, '0')) as period, COUNT(*) as count
        FROM manual_allowances
        WHERE (year * 12 + month) >= ((YEAR(NOW()) * 12 + MONTH(NOW())) - 3)
        GROUP BY year, month
        ORDER BY year DESC, month DESC
        LIMIT 3
    ");

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            echo "   - {$row['period']}: {$row['count']} manual allowances\n";
        }
    } else {
        echo "   ✗ No manual allowances found in the last 3 months\n";
    }

    $conn->close();
} else {
    echo "   ✗ Database connection failed\n";
}

echo "\n=== Test Complete ===\n";
?>
